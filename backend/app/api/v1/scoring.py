"""Scoring endpoints."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_tenant, require_role
from app.models.assessment import Assessment
from app.models.ai_job import AIJob
from app.models.scoring import ThemeScore
from app.models.tenant import Tenant
from app.models.user import User
from app.schemas.scoring import AssessmentScoresResponse, ThemeScoreResponse
from app.schemas.ai_job import AIJobResponse

router = APIRouter(prefix="/assessments/{assessment_id}/scores")


@router.get("", response_model=AssessmentScoresResponse)
async def get_scores(
    assessment_id: uuid.UUID,
    tenant: Tenant = Depends(get_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Get all scores for an assessment."""
    result = await db.execute(
        select(Assessment).where(
            Assessment.id == assessment_id, Assessment.tenant_id == tenant.id
        )
    )
    assessment = result.scalar_one_or_none()
    if not assessment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found")

    scores_result = await db.execute(
        select(ThemeScore).where(ThemeScore.assessment_id == assessment_id)
    )
    theme_scores = scores_result.scalars().all()

    return AssessmentScoresResponse(
        assessment_id=assessment_id,
        overall_score=assessment.overall_score,
        theme_scores=[ThemeScoreResponse.model_validate(ts) for ts in theme_scores],
    )


@router.post("/trigger-scoring", response_model=AIJobResponse, status_code=status.HTTP_202_ACCEPTED)
async def trigger_scoring(
    assessment_id: uuid.UUID,
    tenant: Tenant = Depends(get_tenant),
    _user: User = Depends(require_role("platform_admin", "tenant_admin", "reviewer")),
    db: AsyncSession = Depends(get_db),
):
    """Trigger AI scoring for an assessment (async via Celery)."""
    result = await db.execute(
        select(Assessment).where(
            Assessment.id == assessment_id, Assessment.tenant_id == tenant.id
        )
    )
    assessment = result.scalar_one_or_none()
    if not assessment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found")

    if assessment.status not in ("submitted", "under_review"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot score assessment with status '{assessment.status}'",
        )

    # Create AI job record
    job = AIJob(
        assessment_id=assessment_id,
        job_type="scoring",
        status="queued",
    )
    db.add(job)
    await db.flush()

    # Dispatch Celery task
    from app.workers.tasks import score_assessment

    score_assessment.delay(str(assessment_id), str(job.id))

    return job
