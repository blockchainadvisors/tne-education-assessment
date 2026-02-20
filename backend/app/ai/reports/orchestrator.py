"""Report generation orchestrator.

Generates assessment reports section-by-section via Claude API,
renders to HTML using Jinja2, then converts to PDF via WeasyPrint.
"""

import logging
import uuid

import boto3
from botocore.config import Config as BotoConfig
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.assessment import Assessment, AssessmentTheme
from app.models.scoring import ThemeScore
from app.models.report import AssessmentReport
from app.models.tenant import Tenant
from app.ai.reports.sections import (
    generate_executive_summary,
    generate_theme_analysis,
    generate_recommendations,
)
from app.ai.reports.pdf_renderer import render_report_pdf

log = logging.getLogger(__name__)


async def generate_report(
    db: AsyncSession,
    assessment_id: uuid.UUID,
) -> AssessmentReport:
    """Generate a full assessment report.

    Steps:
    1. Load assessment data and scores
    2. Generate executive summary via Claude
    3. Generate per-theme analyses via Claude
    4. Generate recommendations via Claude
    5. Render HTML → PDF
    6. Store report

    Returns:
        The created AssessmentReport record.
    """
    # Load assessment
    result = await db.execute(
        select(Assessment).where(Assessment.id == assessment_id)
    )
    assessment = result.scalar_one()

    # Load tenant
    tenant_result = await db.execute(
        select(Tenant).where(Tenant.id == assessment.tenant_id)
    )
    tenant = tenant_result.scalar_one()

    # Load theme scores
    scores_result = await db.execute(
        select(ThemeScore).where(ThemeScore.assessment_id == assessment_id)
    )
    theme_scores = scores_result.scalars().all()

    # Load themes
    themes_result = await db.execute(
        select(AssessmentTheme).where(
            AssessmentTheme.template_id == assessment.template_id
        )
    )
    themes = themes_result.scalars().all()
    themes_by_id = {t.id: t for t in themes}

    # Format scores for prompts
    theme_scores_formatted = "\n".join(
        f"- {themes_by_id.get(ts.theme_id, type('', (), {'name': 'Unknown'})()).name}: "
        f"{ts.normalised_score}/100 (weight: {ts.weighted_score})"
        for ts in theme_scores
    )

    # 1. Executive Summary
    executive_summary = await generate_executive_summary(
        institution_name=tenant.name,
        academic_year=assessment.academic_year,
        overall_score=assessment.overall_score,
        theme_scores_formatted=theme_scores_formatted,
    )

    # 2. Theme Analyses
    theme_analyses = {}
    for ts in theme_scores:
        theme = themes_by_id.get(ts.theme_id)
        if theme:
            analysis = await generate_theme_analysis(
                theme_name=theme.name,
                theme_score=ts.normalised_score,
                theme_weight=theme.weight * 100,
            )
            theme_analyses[str(ts.theme_id)] = analysis

    # 3. Recommendations
    recommendations = await generate_recommendations(
        overall_score=assessment.overall_score,
        theme_scores_formatted=theme_scores_formatted,
    )

    # Create/update report record
    existing = await db.execute(
        select(AssessmentReport)
        .where(AssessmentReport.assessment_id == assessment_id)
        .order_by(AssessmentReport.version.desc())
        .limit(1)
    )
    latest = existing.scalar_one_or_none()
    version = (latest.version + 1) if latest else 1

    report = AssessmentReport(
        assessment_id=assessment_id,
        version=version,
        executive_summary=executive_summary,
        theme_analyses=theme_analyses,
        improvement_recommendations=recommendations,
    )
    db.add(report)
    await db.flush()

    # Generate PDF and upload to S3
    try:
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

        storage_key = (
            f"reports/{assessment.tenant_id}/{assessment_id}/"
            f"report-v{version}.pdf"
        )
        s3 = boto3.client(
            "s3",
            endpoint_url=settings.s3_endpoint_url,
            aws_access_key_id=settings.s3_access_key,
            aws_secret_access_key=settings.s3_secret_key,
            region_name=settings.s3_region,
            config=BotoConfig(signature_version="s3v4"),
        )
        s3.put_object(
            Bucket=settings.s3_bucket_name,
            Key=storage_key,
            Body=pdf_bytes,
            ContentType="application/pdf",
        )

        report.pdf_storage_key = storage_key
        await db.flush()
        log.info("PDF uploaded to S3: %s", storage_key)
    except Exception:
        log.exception("PDF generation failed — report saved without PDF")

    return report
