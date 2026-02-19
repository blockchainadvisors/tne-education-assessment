"""Time-series item scorer for multi-year trend data."""

from app.models.assessment import AssessmentItem
from app.services.calculation_service import calculate_trend


async def score_timeseries(
    value: dict | None,
    rubric: dict | None,
    item: AssessmentItem,
) -> dict | None:
    """Score a time-series item based on absolute value + trend.

    Value format: {"years": {"2021": {"male": 100, "female": 120}, "2022": {...}, ...}}
    or {"years": {"2021": 500, "2022": 520, ...}} for non-gendered data

    Scoring: Based on trend direction relative to ideal_direction in rubric.
    Declining trends get penalties.
    """
    if value is None or rubric is None:
        return None

    years_data = value.get("years", {}) if isinstance(value, dict) else {}
    if not years_data:
        return None

    # Extract totals per year
    totals = []
    for year in sorted(years_data.keys()):
        year_val = years_data[year]
        if isinstance(year_val, dict):
            # Gendered data: sum male + female
            total = sum(v for v in year_val.values() if isinstance(v, (int, float)))
            totals.append(total)
        elif isinstance(year_val, (int, float)):
            totals.append(year_val)

    if len(totals) < 2:
        return {"score": 50.0, "feedback": "Insufficient data points for trend analysis."}

    trend = calculate_trend(totals)
    ideal_direction = rubric.get("ideal_direction", "increasing")

    # Base score from absolute latest value (simplified)
    base_score = 60.0  # Default middle score

    # Trend adjustment
    if trend["direction"] == ideal_direction:
        trend_bonus = 20.0
    elif trend["direction"] == "stable":
        trend_bonus = 0.0
    else:
        # Wrong direction penalty
        trend_bonus = -20.0

    score = max(0, min(100, base_score + trend_bonus))

    pct_str = f"{trend['pct_change']}%" if trend["pct_change"] is not None else "N/A"
    return {
        "score": round(score, 1),
        "feedback": (
            f"Trend: {trend['direction']} ({pct_str} change). "
            f"{'Positive trend aligns with expectations.' if trend['direction'] == ideal_direction else 'Trend direction is concerning.'}"
        ),
    }
