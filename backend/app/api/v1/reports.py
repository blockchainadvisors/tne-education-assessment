"""Report generation and retrieval endpoints."""

import logging
import uuid

import boto3
from botocore.config import Config as BotoConfig
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.dependencies import get_current_user, get_tenant, require_role
from app.models.assessment import Assessment, AssessmentTheme
from app.models.ai_job import AIJob
from app.models.scoring import ThemeScore
from app.models.tenant import Tenant
from app.models.user import User
from app.schemas.report import ReportResponse
from app.schemas.ai_job import AIJobResponse
from app.services.report_service import get_report
from app.ai.reports.pdf_renderer import render_report_pdf

log = logging.getLogger(__name__)

router = APIRouter(prefix="/assessments/{assessment_id}/report")


@router.get("", response_model=ReportResponse)
async def get_assessment_report(
    assessment_id: uuid.UUID,
    tenant: Tenant = Depends(get_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Get the latest report for an assessment."""
    report = await get_report(db, assessment_id, tenant.id)
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    return report


@router.post("/generate", response_model=AIJobResponse, status_code=status.HTTP_202_ACCEPTED)
async def generate_report(
    assessment_id: uuid.UUID,
    tenant: Tenant = Depends(get_tenant),
    _user: User = Depends(require_role("platform_admin", "tenant_admin", "reviewer")),
    db: AsyncSession = Depends(get_db),
):
    """Trigger AI report generation for an assessment (async via Celery)."""
    # Verify assessment exists and is scored
    result = await db.execute(
        select(Assessment).where(
            Assessment.id == assessment_id, Assessment.tenant_id == tenant.id
        )
    )
    assessment = result.scalar_one_or_none()
    if not assessment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found")

    if assessment.status not in ("scored", "report_generated"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Assessment must be scored before generating a report",
        )

    # Create AI job record
    job = AIJob(
        assessment_id=assessment_id,
        job_type="report_generation",
        status="queued",
    )
    db.add(job)
    await db.flush()

    # Dispatch Celery task
    from app.workers.tasks import generate_report as generate_report_task

    generate_report_task.delay(str(assessment_id), str(job.id))

    return job


@router.get("/active-job")
async def get_active_report_job(
    assessment_id: uuid.UUID,
    tenant: Tenant = Depends(get_tenant),
    _user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Check if there's an active (queued/in_progress) report generation job.

    Jobs older than 10 minutes are considered stale and auto-failed.
    """
    from datetime import datetime, timezone, timedelta

    stale_cutoff = datetime.now(timezone.utc) - timedelta(minutes=10)

    result = await db.execute(
        select(AIJob)
        .join(Assessment, AIJob.assessment_id == Assessment.id)
        .where(
            AIJob.assessment_id == assessment_id,
            AIJob.job_type == "report_generation",
            AIJob.status.in_(("queued", "in_progress")),
            Assessment.tenant_id == tenant.id,
        )
        .order_by(AIJob.created_at.desc())
        .limit(1)
    )
    job = result.scalar_one_or_none()
    if not job:
        return None

    # Auto-fail stale jobs
    if job.created_at < stale_cutoff:
        job.status = "failed"
        job.error_message = "Job timed out"
        job.completed_at = datetime.now(timezone.utc)
        await db.commit()
        return None

    return AIJobResponse.model_validate(job)


@router.get("/pdf")
async def download_report_pdf(
    assessment_id: uuid.UUID,
    tenant: Tenant = Depends(get_tenant),
    _user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Stream the report PDF directly to the browser."""
    report = await get_report(db, assessment_id, tenant.id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Report not found"
        )

    s3 = boto3.client(
        "s3",
        endpoint_url=settings.s3_endpoint_url,
        aws_access_key_id=settings.s3_access_key,
        aws_secret_access_key=settings.s3_secret_key,
        region_name=settings.s3_region,
        config=BotoConfig(signature_version="s3v4"),
    )

    # Try to fetch existing PDF from S3
    pdf_bytes: bytes | None = None
    if report.pdf_storage_key:
        try:
            obj = s3.get_object(
                Bucket=settings.s3_bucket_name,
                Key=report.pdf_storage_key,
            )
            pdf_bytes = obj["Body"].read()
        except Exception:
            log.warning("Failed to fetch cached PDF, regenerating")

    # Generate PDF on-the-fly if not cached
    if pdf_bytes is None:
        log.info("Generating PDF on-the-fly for report %s", report.id)

        result = await db.execute(
            select(Assessment).where(Assessment.id == assessment_id)
        )
        assessment = result.scalar_one()

        scores_result = await db.execute(
            select(ThemeScore).where(ThemeScore.assessment_id == assessment_id)
        )
        theme_scores = scores_result.scalars().all()

        themes_result = await db.execute(
            select(AssessmentTheme).where(
                AssessmentTheme.template_id == assessment.template_id
            )
        )
        themes_by_id = {t.id: t for t in themes_result.scalars().all()}

        pdf_theme_scores = [
            {"name": themes_by_id[ts.theme_id].name, "score": ts.normalised_score}
            for ts in theme_scores
            if ts.theme_id in themes_by_id
        ]

        pdf_bytes = render_report_pdf(
            report=report,
            institution_name=tenant.name,
            academic_year=assessment.academic_year,
            overall_score=assessment.overall_score,
            theme_scores=pdf_theme_scores,
        )

        # Cache in S3 for future requests
        storage_key = (
            f"reports/{tenant.id}/{assessment_id}/"
            f"report-v{report.version}.pdf"
        )
        try:
            s3.put_object(
                Bucket=settings.s3_bucket_name,
                Key=storage_key,
                Body=pdf_bytes,
                ContentType="application/pdf",
            )
            report.pdf_storage_key = storage_key
            await db.commit()
        except Exception:
            log.exception("Failed to cache PDF in S3")

    filename = f"TNE-Report-{assessment_id}-v{report.version}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
        },
    )
