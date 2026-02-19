"""Benchmark service for peer comparison analytics."""
import uuid
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.benchmark import BenchmarkSnapshot
from app.models.scoring import ThemeScore
from app.models.assessment import Assessment


async def get_benchmark_comparison(
    db: AsyncSession,
    assessment_id: uuid.UUID,
    academic_year: str,
    country: str | None = None,
) -> list[dict]:
    """Compare an assessment's scores against benchmark percentiles."""
    # Get the assessment's theme scores
    scores_result = await db.execute(
        select(ThemeScore).where(ThemeScore.assessment_id == assessment_id)
    )
    theme_scores = scores_result.scalars().all()

    comparisons = []
    for ts in theme_scores:
        query = select(BenchmarkSnapshot).where(
            BenchmarkSnapshot.academic_year == academic_year,
            BenchmarkSnapshot.theme_id == ts.theme_id,
        )
        if country:
            query = query.where(BenchmarkSnapshot.country == country)

        result = await db.execute(query)
        benchmarks = result.scalars().all()

        for bm in benchmarks:
            # Determine percentile position
            institution_value = ts.normalised_score
            percentile_position = None
            if institution_value is not None and bm.sample_size > 0:
                if institution_value >= (bm.percentile_90 or 0):
                    percentile_position = 90
                elif institution_value >= (bm.percentile_75 or 0):
                    percentile_position = 75
                elif institution_value >= (bm.percentile_50 or 0):
                    percentile_position = 50
                elif institution_value >= (bm.percentile_25 or 0):
                    percentile_position = 25
                else:
                    percentile_position = 10

            comparisons.append({
                "theme_id": str(ts.theme_id),
                "metric_name": bm.metric_name,
                "institution_value": institution_value,
                "percentile_position": percentile_position,
                "percentile_10": bm.percentile_10,
                "percentile_25": bm.percentile_25,
                "percentile_50": bm.percentile_50,
                "percentile_75": bm.percentile_75,
                "percentile_90": bm.percentile_90,
                "sample_size": bm.sample_size,
            })

    return comparisons


async def compute_benchmark_snapshots(
    db: AsyncSession,
    academic_year: str,
) -> int:
    """Recompute benchmark percentiles from all completed assessments for a given year.

    Returns the number of snapshots created/updated.
    """
    # This will be implemented when we have enough data
    # For now, return 0
    return 0
