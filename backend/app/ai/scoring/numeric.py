"""Numeric item scorer - algorithmic scoring against configurable ranges."""

from app.models.assessment import AssessmentItem


async def score_numeric(
    value: dict | None,
    rubric: dict | None,
    item: AssessmentItem,
) -> dict | None:
    """Score a numeric item against rubric ranges.

    Rubric format:
    {
        "type": "numeric_range",
        "ranges": [
            {"min": 0, "max": 15, "score": 100},
            {"min": 15, "max": 25, "score": 75},
            ...
        ]
    }
    """
    if value is None or rubric is None:
        return None

    # Extract numeric value from JSONB
    num_value = value.get("value") if isinstance(value, dict) else value
    if num_value is None:
        return None

    try:
        num_value = float(num_value)
    except (TypeError, ValueError):
        return None

    ranges = rubric.get("ranges", [])
    if not ranges:
        return None

    score = None
    for r in ranges:
        r_min = r.get("min", float("-inf"))
        r_max = r.get("max", float("inf"))
        if r_min <= num_value < r_max:
            score = float(r["score"])
            break

    if score is None:
        return None

    return {
        "score": score,
        "feedback": f"Value {num_value} scored {score}/100 based on rubric ranges.",
    }
