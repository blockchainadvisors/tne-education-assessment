"""Scoring orchestrator - coordinates all scorer types for an assessment.

Chains: Numeric → Binary → Text (Claude) → Timeseries → Consistency → Aggregation
"""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.assessment import Assessment, AssessmentItem, AssessmentResponse, AssessmentTheme
from app.ai.scoring.numeric import score_numeric
from app.ai.scoring.binary import score_binary
from app.ai.scoring.text import score_text
from app.ai.scoring.timeseries import score_timeseries
from app.services.scoring_service import calculate_theme_scores


# Map field types to scoring functions
SCORER_MAP = {
    "numeric": score_numeric,
    "percentage": score_numeric,
    "auto_calculated": score_numeric,
    "yes_no_conditional": score_binary,
    "long_text": score_text,
    "short_text": score_text,
    "multi_year_gender": score_timeseries,
}

# Field types that don't need individual scoring (scored via other mechanisms)
SKIP_SCORING = {"file_upload", "dropdown", "multi_select", "partner_specific", "salary_bands"}


async def score_assessment(
    db: AsyncSession,
    assessment_id: uuid.UUID,
) -> dict:
    """Score all items in an assessment and aggregate into theme scores.

    Returns a summary dict with overall_score and per-theme scores.
    """
    # Load assessment and its template items
    result = await db.execute(
        select(Assessment).where(Assessment.id == assessment_id)
    )
    assessment = result.scalar_one_or_none()
    if not assessment:
        raise ValueError(f"Assessment {assessment_id} not found")

    # Load all items for this template
    items_result = await db.execute(
        select(AssessmentItem)
        .join(AssessmentTheme)
        .where(AssessmentTheme.template_id == assessment.template_id)
    )
    items = items_result.scalars().all()
    items_by_id = {item.id: item for item in items}

    # Load all responses
    responses_result = await db.execute(
        select(AssessmentResponse).where(
            AssessmentResponse.assessment_id == assessment_id
        )
    )
    responses = responses_result.scalars().all()

    scored_count = 0
    skipped_count = 0

    for response in responses:
        item = items_by_id.get(response.item_id)
        if not item:
            continue

        if item.field_type in SKIP_SCORING:
            skipped_count += 1
            continue

        scorer = SCORER_MAP.get(item.field_type)
        if scorer is None:
            skipped_count += 1
            continue

        score_result = await scorer(
            value=response.value,
            rubric=item.scoring_rubric,
            item=item,
        )

        if score_result is not None:
            response.ai_score = score_result.get("score")
            response.ai_feedback = score_result.get("feedback", "")
            scored_count += 1

    await db.flush()

    # Aggregate into theme scores
    theme_scores = await calculate_theme_scores(db, assessment_id)

    # Refresh to get updated overall score
    await db.refresh(assessment)

    return {
        "assessment_id": str(assessment_id),
        "overall_score": assessment.overall_score,
        "items_scored": scored_count,
        "items_skipped": skipped_count,
        "theme_scores": [
            {
                "theme_id": str(ts.theme_id),
                "normalised_score": ts.normalised_score,
                "weighted_score": ts.weighted_score,
            }
            for ts in theme_scores
        ],
    }
