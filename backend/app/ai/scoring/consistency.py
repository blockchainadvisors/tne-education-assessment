"""Cross-item consistency checker.

Combines rule-based checks with a Claude API call for cross-theme inconsistency detection.
"""

import json

from app.ai.claude_client import call_claude
from app.ai.prompts.scoring_text import CONSISTENCY_CHECK_SYSTEM, CONSISTENCY_CHECK_TEMPLATE


# Rule-based consistency checks
CONSISTENCY_RULES = [
    {
        "id": "staff_count_vs_phd",
        "description": "PhD staff cannot exceed total academic staff",
        "check": lambda r: (
            r.get("TL07", {}).get("value", 0) or 0
        ) <= (r.get("TL06", {}).get("value", float("inf")) or float("inf")),
    },
    {
        "id": "flying_faculty_vs_staff",
        "description": "Flying faculty cannot exceed total academic staff",
        "check": lambda r: (
            r.get("TL09", {}).get("value", 0) or 0
        ) <= (r.get("TL06", {}).get("value", float("inf")) or float("inf")),
    },
    {
        "id": "retention_plausibility",
        "description": "Retention rate should be between 0-100%",
        "check": lambda r: 0 <= (r.get("TL04", {}).get("value", 50) or 50) <= 100,
    },
    {
        "id": "employment_rate_plausibility",
        "description": "Employment rate should be between 0-100%",
        "check": lambda r: 0 <= (r.get("SE04", {}).get("value", 50) or 50) <= 100,
    },
]


def run_rule_checks(responses_by_code: dict) -> list[dict]:
    """Run rule-based consistency checks.

    Args:
        responses_by_code: Dict mapping item codes to their response values.

    Returns:
        List of issues found.
    """
    issues = []
    for rule in CONSISTENCY_RULES:
        try:
            if not rule["check"](responses_by_code):
                issues.append({
                    "severity": "high",
                    "rule_id": rule["id"],
                    "description": rule["description"],
                    "type": "rule_violation",
                })
        except (KeyError, TypeError):
            continue
    return issues


async def check_consistency(
    responses_by_code: dict,
    use_ai: bool = True,
) -> dict:
    """Run full consistency check: rules + optional Claude API analysis.

    Args:
        responses_by_code: Dict mapping item codes to response values.
        use_ai: Whether to also run Claude API consistency check.

    Returns:
        Dict with is_consistent, issues list, and summary.
    """
    # Phase 1: Rule-based checks
    rule_issues = run_rule_checks(responses_by_code)

    # Phase 3: AI-based cross-theme consistency check
    ai_issues = []
    if use_ai:
        try:
            prompt = CONSISTENCY_CHECK_TEMPLATE.format(
                assessment_data_json=json.dumps(
                    {k: v for k, v in responses_by_code.items() if v},
                    indent=2,
                    default=str,
                )[:5000]  # Limit context size
            )

            result = call_claude(
                messages=[{"role": "user", "content": prompt}],
                system=CONSISTENCY_CHECK_SYSTEM,
                temperature=0.0,
                max_tokens=2000,
            )

            content = result["content"]
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]

            ai_result = json.loads(content.strip())
            ai_issues = ai_result.get("issues", [])
        except Exception:
            pass  # AI check is non-critical

    all_issues = rule_issues + ai_issues

    return {
        "is_consistent": len(all_issues) == 0,
        "issues": all_issues,
        "rule_issues_count": len(rule_issues),
        "ai_issues_count": len(ai_issues),
        "summary": (
            "No consistency issues detected."
            if not all_issues
            else f"Found {len(all_issues)} consistency issue(s)."
        ),
    }
