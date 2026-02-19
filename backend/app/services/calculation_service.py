"""Auto-calculation service for derived assessment metrics.

Handles computed fields like Student-Staff Ratio (SSR), gender percentages,
PhD staff percentage, flying faculty percentage, etc.
"""
from typing import Any


def calculate_ssr(total_students: int | float, total_academic_staff: int | float) -> float | None:
    """Calculate Student-Staff Ratio."""
    if not total_academic_staff or total_academic_staff == 0:
        return None
    return round(total_students / total_academic_staff, 1)


def calculate_gender_percentage(male: int | float, female: int | float) -> dict:
    """Calculate gender split percentages from absolute numbers."""
    total = (male or 0) + (female or 0)
    if total == 0:
        return {"male_pct": None, "female_pct": None, "total": 0}
    return {
        "male_pct": round((male or 0) / total * 100, 1),
        "female_pct": round((female or 0) / total * 100, 1),
        "total": total,
    }


def calculate_phd_percentage(
    phd_staff: int | float, total_academic_staff: int | float
) -> float | None:
    """Calculate percentage of academic staff with PhD/doctoral qualifications."""
    if not total_academic_staff or total_academic_staff == 0:
        return None
    return round(phd_staff / total_academic_staff * 100, 1)


def calculate_flying_faculty_percentage(
    flying_faculty: int | float, total_academic_staff: int | float
) -> float | None:
    """Calculate flying faculty as percentage of total academic staff."""
    if not total_academic_staff or total_academic_staff == 0:
        return None
    return round(flying_faculty / total_academic_staff * 100, 1)


def calculate_retention_rate(
    enrolled: int | float, completed: int | float
) -> float | None:
    """Calculate student retention/completion rate."""
    if not enrolled or enrolled == 0:
        return None
    return round(completed / enrolled * 100, 1)


def calculate_employment_rate(
    graduates: int | float, employed_within_period: int | float
) -> float | None:
    """Calculate graduate employment rate."""
    if not graduates or graduates == 0:
        return None
    return round(employed_within_period / graduates * 100, 1)


def calculate_trend(values: list[float | int | None]) -> dict:
    """Calculate linear trend from a time series of values.

    Returns slope, direction ('increasing', 'decreasing', 'stable'), and percentage change.
    """
    clean = [v for v in values if v is not None]
    if len(clean) < 2:
        return {"slope": None, "direction": "insufficient_data", "pct_change": None}

    n = len(clean)
    x_mean = (n - 1) / 2
    y_mean = sum(clean) / n

    numerator = sum((i - x_mean) * (y - y_mean) for i, y in enumerate(clean))
    denominator = sum((i - x_mean) ** 2 for i in range(n))

    if denominator == 0:
        slope = 0.0
    else:
        slope = numerator / denominator

    if clean[0] != 0:
        pct_change = round((clean[-1] - clean[0]) / clean[0] * 100, 1)
    else:
        pct_change = None

    threshold = 0.01 * y_mean if y_mean != 0 else 0.01
    if slope > threshold:
        direction = "increasing"
    elif slope < -threshold:
        direction = "decreasing"
    else:
        direction = "stable"

    return {"slope": round(slope, 4), "direction": direction, "pct_change": pct_change}


def run_auto_calculations(item_code: str, responses: dict[str, Any]) -> Any:
    """Run auto-calculation for a specific item based on other response values.

    Args:
        item_code: The code of the auto-calculated item (e.g., "TL_SSR")
        responses: Dict mapping item_codes to their response values

    Returns:
        The calculated value, or None if inputs are missing
    """
    calculators = {
        "TL_SSR": lambda r: calculate_ssr(
            r.get("TL03", {}).get("value", 0),  # total students
            r.get("TL06", {}).get("value", 0),  # total academic staff
        ),
        "TL_PHD_PCT": lambda r: calculate_phd_percentage(
            r.get("TL07", {}).get("value", 0),  # PhD staff
            r.get("TL06", {}).get("value", 0),  # total academic staff
        ),
        "TL_FLYING_PCT": lambda r: calculate_flying_faculty_percentage(
            r.get("TL09", {}).get("value", 0),  # flying faculty
            r.get("TL06", {}).get("value", 0),  # total academic staff
        ),
        "SE_RETENTION": lambda r: calculate_retention_rate(
            r.get("SE01", {}).get("value", 0),  # enrolled
            r.get("SE02", {}).get("value", 0),  # completed
        ),
        "IM_EMPLOYMENT": lambda r: calculate_employment_rate(
            r.get("IM01", {}).get("value", 0),  # graduates
            r.get("IM02", {}).get("value", 0),  # employed
        ),
    }

    calculator = calculators.get(item_code)
    if calculator is None:
        return None
    return calculator(responses)
