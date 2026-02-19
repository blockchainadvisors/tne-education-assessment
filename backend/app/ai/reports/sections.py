"""Individual report section generators using Claude API."""

import json

from app.ai.claude_client import call_claude
from app.ai.prompts.report_sections import (
    EXECUTIVE_SUMMARY_SYSTEM,
    EXECUTIVE_SUMMARY_TEMPLATE,
    THEME_ANALYSIS_TEMPLATE,
    RECOMMENDATIONS_TEMPLATE,
)


async def generate_executive_summary(
    institution_name: str,
    academic_year: str,
    overall_score: float | None,
    theme_scores_formatted: str,
    total_students: int | str = "N/A",
    ssr: float | str = "N/A",
    phd_pct: float | str = "N/A",
    retention_rate: float | str = "N/A",
    employment_rate: float | str = "N/A",
) -> str:
    """Generate executive summary section via Claude API."""
    prompt = EXECUTIVE_SUMMARY_TEMPLATE.format(
        institution_name=institution_name,
        academic_year=academic_year,
        overall_score=overall_score or "N/A",
        theme_scores_formatted=theme_scores_formatted,
        total_students=total_students,
        ssr=ssr,
        phd_pct=phd_pct,
        retention_rate=retention_rate,
        employment_rate=employment_rate,
    )

    result = call_claude(
        messages=[{"role": "user", "content": prompt}],
        system=EXECUTIVE_SUMMARY_SYSTEM,
        temperature=0.3,  # Slightly creative for prose
        max_tokens=2000,
    )

    return result["content"]


async def generate_theme_analysis(
    theme_name: str,
    theme_score: float | None,
    theme_weight: float,
    item_scores_formatted: str = "Not available",
    benchmark_data: str = "No benchmark data available for comparison",
) -> dict:
    """Generate per-theme analysis section via Claude API."""
    prompt = THEME_ANALYSIS_TEMPLATE.format(
        theme_name=theme_name,
        theme_score=theme_score or "N/A",
        theme_weight=theme_weight,
        item_scores_formatted=item_scores_formatted,
        benchmark_data=benchmark_data,
    )

    result = call_claude(
        messages=[{"role": "user", "content": prompt}],
        system=EXECUTIVE_SUMMARY_SYSTEM,
        temperature=0.3,
        max_tokens=1500,
    )

    return {
        "theme_name": theme_name,
        "score": theme_score,
        "analysis": result["content"],
    }


async def generate_recommendations(
    overall_score: float | None,
    theme_scores_formatted: str,
    low_scoring_items: str = "None identified",
    consistency_issues: str = "None identified",
) -> list[dict]:
    """Generate improvement recommendations via Claude API."""
    prompt = RECOMMENDATIONS_TEMPLATE.format(
        assessment_summary=f"Overall score: {overall_score or 'N/A'}/100",
        theme_scores_formatted=theme_scores_formatted,
        low_scoring_items=low_scoring_items,
        consistency_issues=consistency_issues,
    )

    result = call_claude(
        messages=[{"role": "user", "content": prompt}],
        system=EXECUTIVE_SUMMARY_SYSTEM,
        temperature=0.3,
        max_tokens=3000,
    )

    # Parse JSON array from response
    content = result["content"]
    try:
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]
        return json.loads(content.strip())
    except (json.JSONDecodeError, IndexError):
        return [{"title": "Report generation note", "detail": content}]
