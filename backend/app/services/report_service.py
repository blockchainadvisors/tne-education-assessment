"""Report generation service.

Phase 1: Stub that creates report records.
Phase 3: Full AI-powered report generation with Claude API.
"""
import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.report import AssessmentReport
from app.models.assessment import Assessment


async def get_report(
    db: AsyncSession,
    assessment_id: uuid.UUID,
    tenant_id: uuid.UUID,
) -> AssessmentReport | None:
    """Get the latest report for an assessment."""
    result = await db.execute(
        select(AssessmentReport)
        .join(Assessment)
        .where(
            AssessmentReport.assessment_id == assessment_id,
            Assessment.tenant_id == tenant_id,
        )
        .order_by(AssessmentReport.version.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


async def create_report_placeholder(
    db: AsyncSession,
    assessment_id: uuid.UUID,
) -> AssessmentReport:
    """Create a placeholder report record (to be filled by AI pipeline)."""
    # Check for existing reports to set version
    result = await db.execute(
        select(AssessmentReport)
        .where(AssessmentReport.assessment_id == assessment_id)
        .order_by(AssessmentReport.version.desc())
        .limit(1)
    )
    existing = result.scalar_one_or_none()
    version = (existing.version + 1) if existing else 1

    report = AssessmentReport(
        assessment_id=assessment_id,
        version=version,
    )
    db.add(report)
    await db.flush()
    return report
