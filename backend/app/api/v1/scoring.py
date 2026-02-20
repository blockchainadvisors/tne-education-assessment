"""Scoring endpoints."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_tenant, require_role
from app.models.assessment import Assessment, AssessmentItem, AssessmentResponse, AssessmentTheme
from app.models.ai_job import AIJob
from app.models.scoring import ThemeScore
from app.models.tenant import Tenant
from app.models.user import User
from app.schemas.scoring import AssessmentScoresResponse, ItemScoreResponse, ThemeScoreResponse
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

    # Load theme metadata for names/slugs
    themes_result = await db.execute(
        select(AssessmentTheme).where(
            AssessmentTheme.template_id == assessment.template_id
        )
    )
    themes = themes_result.scalars().all()
    themes_by_id = {t.id: t for t in themes}

    # Load items grouped by theme
    items_result = await db.execute(
        select(AssessmentItem).where(
            AssessmentItem.theme_id.in_([t.id for t in themes])
        )
    )
    items = items_result.scalars().all()
    items_by_id = {i.id: i for i in items}
    items_by_theme: dict[uuid.UUID, list] = {}
    for item in items:
        items_by_theme.setdefault(item.theme_id, []).append(item)

    # Load responses with scores
    responses_result = await db.execute(
        select(AssessmentResponse).where(
            AssessmentResponse.assessment_id == assessment_id
        )
    )
    responses = responses_result.scalars().all()
    responses_by_item = {r.item_id: r for r in responses}

    theme_score_responses = []
    for ts in theme_scores:
        theme = themes_by_id.get(ts.theme_id)
        norm = ts.normalised_score or 0.0

        # Build per-item scores for this theme
        item_scores = []
        for item in sorted(items_by_theme.get(ts.theme_id, []), key=lambda i: i.code):
            resp = responses_by_item.get(item.id)
            if resp and resp.ai_score is not None:
                item_scores.append(ItemScoreResponse(
                    item_code=item.code,
                    item_label=item.label,
                    field_type=item.field_type,
                    ai_score=resp.ai_score,
                    ai_feedback=resp.ai_feedback,
                ))

        theme_score_responses.append(ThemeScoreResponse(
            theme_id=ts.theme_id,
            theme_name=theme.name if theme else "",
            theme_code=theme.slug if theme else "",
            normalised_score=ts.normalised_score,
            weighted_score=ts.weighted_score,
            score=norm,
            max_score=100.0,
            percentage=norm,
            ai_analysis=ts.ai_analysis,
            item_scores=item_scores,
        ))

    overall = assessment.overall_score or 0.0

    return AssessmentScoresResponse(
        assessment_id=assessment_id,
        overall_score=overall,
        overall_max_score=100.0,
        overall_percentage=overall,
        theme_scores=theme_score_responses,
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
