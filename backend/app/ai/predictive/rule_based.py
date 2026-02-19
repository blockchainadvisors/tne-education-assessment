"""Rule-based risk scoring engine (Phase 1).

Expert-defined thresholds that produce a 0-1 risk score
with top contributing factors. No ML needed.
"""


# Risk rule definitions: each rule checks a condition and assigns a risk contribution
RISK_RULES = [
    {
        "id": "low_financial_score",
        "name": "Low Financial Sustainability Score",
        "description": "Financial theme score below 40 indicates high financial risk",
        "weight": 0.25,
        "evaluate": lambda scores: max(0, (40 - scores.get("financial", 50)) / 40)
        if scores.get("financial", 50) < 40
        else 0.0,
    },
    {
        "id": "declining_enrollment",
        "name": "Declining Student Enrollment",
        "description": "Decreasing enrollment trend over 4 years",
        "weight": 0.20,
        "evaluate": lambda scores: 0.8
        if scores.get("enrollment_trend") == "decreasing"
        else 0.0,
    },
    {
        "id": "low_retention",
        "name": "Low Student Retention Rate",
        "description": "Retention rate below 70%",
        "weight": 0.15,
        "evaluate": lambda scores: max(0, (70 - scores.get("retention_rate", 80)) / 70)
        if scores.get("retention_rate", 80) < 70
        else 0.0,
    },
    {
        "id": "high_ssr",
        "name": "High Student-Staff Ratio",
        "description": "SSR above 35 indicates understaffing risk",
        "weight": 0.15,
        "evaluate": lambda scores: min(1.0, max(0, (scores.get("ssr", 20) - 35) / 30))
        if scores.get("ssr", 20) > 35
        else 0.0,
    },
    {
        "id": "low_governance",
        "name": "Weak Governance Score",
        "description": "Governance theme score below 50 indicates governance risk",
        "weight": 0.15,
        "evaluate": lambda scores: max(0, (50 - scores.get("governance", 60)) / 50)
        if scores.get("governance", 60) < 50
        else 0.0,
    },
    {
        "id": "low_staff_qualifications",
        "name": "Low Staff Qualifications",
        "description": "PhD percentage below 20% is concerning",
        "weight": 0.10,
        "evaluate": lambda scores: max(0, (20 - scores.get("phd_pct", 40)) / 20)
        if scores.get("phd_pct", 40) < 20
        else 0.0,
    },
]


def compute_risk_score(assessment_metrics: dict) -> dict:
    """Compute risk score from assessment metrics using expert-defined rules.

    Args:
        assessment_metrics: Dict with keys like 'financial', 'governance',
            'retention_rate', 'ssr', 'phd_pct', 'enrollment_trend', etc.

    Returns:
        Dict with:
            - risk_score: 0.0 (low risk) to 1.0 (high risk)
            - risk_level: 'low', 'medium', or 'high'
            - contributing_factors: List of active risk factors sorted by contribution
    """
    contributing_factors = []
    total_risk = 0.0

    for rule in RISK_RULES:
        try:
            raw_score = rule["evaluate"](assessment_metrics)
            weighted = raw_score * rule["weight"]
            total_risk += weighted

            if raw_score > 0:
                contributing_factors.append({
                    "rule_id": rule["id"],
                    "name": rule["name"],
                    "description": rule["description"],
                    "raw_score": round(raw_score, 3),
                    "weighted_contribution": round(weighted, 3),
                })
        except (KeyError, TypeError, ZeroDivisionError):
            continue

    # Clamp to [0, 1]
    risk_score = min(1.0, max(0.0, total_risk))

    # Determine risk level
    if risk_score >= 0.6:
        risk_level = "high"
    elif risk_score >= 0.3:
        risk_level = "medium"
    else:
        risk_level = "low"

    # Sort factors by contribution (highest first)
    contributing_factors.sort(key=lambda f: f["weighted_contribution"], reverse=True)

    return {
        "risk_score": round(risk_score, 3),
        "risk_level": risk_level,
        "contributing_factors": contributing_factors,
        "rules_evaluated": len(RISK_RULES),
    }
