"""Scoring service - orchestrates assessment scoring.

Phase 1: Basic algorithmic scoring for numeric items.
Phase 3: Full AI scoring pipeline with Claude API.
"""
import uuid
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.assessment import Assessment, AssessmentResponse, AssessmentItem, AssessmentTheme
from app.models.scoring import ThemeScore


# Theme weights as defined in the plan
THEME_WEIGHTS = {
    "teaching-learning": 0.25,
    "student-experience": 0.25,
    "governance": 0.20,
    "impact": 0.15,
    "financial": 0.15,
}


async def score_numeric_item(value: float | int | None, rubric: dict) -> float | None:
    """Score a numeric item against its rubric ranges.

    Rubric format:
    {
        "type": "numeric_range",
        "ranges": [
            {"min": 0, "max": 10, "score": 100},
            {"min": 10, "max": 20, "score": 75},
            ...
        ]
    }
    """
    if value is None or not rubric or "ranges" not in rubric:
        return None

    for r in rubric["ranges"]:
        if r.get("min", float("-inf")) <= value < r.get("max", float("inf")):
            return float(r["score"])
    return None


async def score_binary_item(value: bool | None, evidence_quality: float | None = None) -> float | None:
    """Score a yes/no item, optionally combined with evidence quality."""
    if value is None:
        return None

    binary_score = 100.0 if value else 0.0

    if evidence_quality is not None:
        return 0.3 * binary_score + 0.7 * evidence_quality

    return binary_score


async def calculate_theme_scores(
    db: AsyncSession,
    assessment_id: uuid.UUID,
) -> list[ThemeScore]:
    """Calculate aggregated theme scores from individual item scores."""
    # Get assessment with its template themes
    result = await db.execute(
        select(Assessment).where(Assessment.id == assessment_id)
    )
    assessment = result.scalar_one_or_none()
    if not assessment:
        return []

    # Get all themes for this template
    themes_result = await db.execute(
        select(AssessmentTheme).where(AssessmentTheme.template_id == assessment.template_id)
    )
    themes = themes_result.scalars().all()

    # Delete existing theme scores for this assessment
    await db.execute(
        delete(ThemeScore).where(ThemeScore.assessment_id == assessment_id)
    )

    theme_scores = []
    for theme in themes:
        # Get items and their responses for this theme
        items_result = await db.execute(
            select(AssessmentItem).where(AssessmentItem.theme_id == theme.id)
        )
        items = items_result.scalars().all()

        responses_result = await db.execute(
            select(AssessmentResponse).where(
                AssessmentResponse.assessment_id == assessment_id,
                AssessmentResponse.item_id.in_([i.id for i in items]),
            )
        )
        responses = responses_result.scalars().all()

        # Calculate weighted average of item scores
        total_weight = 0.0
        weighted_sum = 0.0
        for resp in responses:
            if resp.ai_score is not None:
                item = next((i for i in items if i.id == resp.item_id), None)
                if item:
                    weighted_sum += resp.ai_score * item.weight
                    total_weight += item.weight

        normalised = round(weighted_sum / total_weight, 2) if total_weight > 0 else None
        theme_weight = THEME_WEIGHTS.get(theme.slug, 0.2)
        weighted = round(normalised * theme_weight, 2) if normalised is not None else None

        ts = ThemeScore(
            assessment_id=assessment_id,
            theme_id=theme.id,
            normalised_score=normalised,
            weighted_score=weighted,
        )
        db.add(ts)
        theme_scores.append(ts)

    # Calculate overall score
    overall = sum(ts.weighted_score for ts in theme_scores if ts.weighted_score is not None)
    assessment.overall_score = round(overall, 2) if any(ts.weighted_score for ts in theme_scores) else None

    await db.flush()
    return theme_scores
