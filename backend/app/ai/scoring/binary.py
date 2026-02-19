"""Binary (Yes/No) item scorer with optional evidence quality."""

from app.models.assessment import AssessmentItem


async def score_binary(
    value: dict | None,
    rubric: dict | None,
    item: AssessmentItem,
) -> dict | None:
    """Score a yes/no item, optionally combined with evidence quality.

    Value format: {"answer": true/false, "evidence": "text..."}
    Rubric type: "binary_with_evidence" or simple binary
    """
    if value is None:
        return None

    answer = value.get("answer") if isinstance(value, dict) else value
    if answer is None:
        return None

    binary_score = 100.0 if answer else 0.0

    rubric_type = rubric.get("type", "") if rubric else ""

    if rubric_type == "binary_with_evidence":
        evidence = value.get("evidence", "") if isinstance(value, dict) else ""
        if evidence and len(str(evidence)) > 50:
            # Evidence quality based on length/detail (simplified)
            evidence_len = len(str(evidence))
            if evidence_len > 500:
                evidence_quality = 85.0
            elif evidence_len > 200:
                evidence_quality = 65.0
            else:
                evidence_quality = 40.0

            combined = 0.3 * binary_score + 0.7 * evidence_quality
            return {
                "score": round(combined, 1),
                "feedback": f"Binary: {'Yes' if answer else 'No'} ({binary_score}), "
                f"Evidence quality: {evidence_quality}/100. "
                f"Combined score: {combined:.1f}/100.",
            }

    return {
        "score": binary_score,
        "feedback": f"{'Yes' if answer else 'No'} - scored {binary_score}/100.",
    }
