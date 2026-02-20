"""Free-text item scorer using Claude API rubric evaluation."""

import json

from app.ai.claude_client import call_claude
from app.ai.prompts.scoring_text import SCORE_TEXT_RESPONSE_SYSTEM, SCORE_TEXT_RESPONSE_TEMPLATE
from app.models.assessment import AssessmentItem


async def score_text(
    value: dict | None,
    rubric: dict | None,
    item: AssessmentItem,
) -> dict | None:
    """Score a free-text response using Claude API rubric evaluation.

    Evaluates against 4 dimensions: relevance, specificity, evidence, comprehensiveness.
    Each dimension scored 0-25, total 0-100.
    """
    if value is None:
        return None

    text_value = value.get("text", "") or value.get("value", "") if isinstance(value, dict) else str(value)
    if not text_value or len(text_value.strip()) < 10:
        return {
            "score": 0.0,
            "feedback": "Response is too short or empty to evaluate.",
        }

    # Build prompt
    prompt = SCORE_TEXT_RESPONSE_TEMPLATE.format(
        item_label=item.label,
        item_code=item.code,
        theme_name="",  # Could be populated from theme relationship
        response_text=text_value[:3000],  # Limit to 3000 chars
    )

    try:
        result = call_claude(
            messages=[{"role": "user", "content": prompt}],
            system=SCORE_TEXT_RESPONSE_SYSTEM,
            temperature=0.0,
            max_tokens=1000,
        )

        # Parse JSON response
        content = result["content"]
        # Try to extract JSON from the response
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]

        scores = json.loads(content.strip())

        total = scores.get("total_score", 0)
        if total == 0:
            total = sum(
                scores.get(d, 0)
                for d in ["relevance", "specificity", "evidence", "comprehensiveness"]
            )

        feedback_parts = []
        if scores.get("strengths"):
            feedback_parts.append(f"Strengths: {'; '.join(scores['strengths'])}")
        if scores.get("weaknesses"):
            feedback_parts.append(f"Areas for improvement: {'; '.join(scores['weaknesses'])}")
        if scores.get("feedback"):
            feedback_parts.append(scores["feedback"])

        return {
            "score": float(min(100, max(0, total))),
            "feedback": " | ".join(feedback_parts) if feedback_parts else f"Score: {total}/100",
            "dimensions": {
                "relevance": scores.get("relevance"),
                "specificity": scores.get("specificity"),
                "evidence": scores.get("evidence"),
                "comprehensiveness": scores.get("comprehensiveness"),
            },
        }
    except Exception as e:
        return {
            "score": None,
            "feedback": f"Scoring error: {str(e)}",
        }
