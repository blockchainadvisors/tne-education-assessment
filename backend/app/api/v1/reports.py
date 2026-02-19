"""Report generation and retrieval endpoints."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_tenant, require_role
from app.models.assessment import Assessment
from app.models.ai_job import AIJob
from app.models.tenant import Tenant
from app.models.user import User
from app.schemas.report import ReportResponse
from app.schemas.ai_job import AIJobResponse
from app.services.report_service import get_report

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
