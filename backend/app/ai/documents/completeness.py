"""Document completeness checking against assessment item requirements."""

import json

from app.ai.claude_client import call_claude
from app.ai.prompts.document_intelligence import COMPLETENESS_CHECK_TEMPLATE


async def check_document_completeness(
    item_label: str,
    required_type: str,
    document_summary: str,
    extracted_data: dict,
    required_sections: list[str],
) -> dict:
    """Check if a document satisfies the requirements for an assessment item.

    Args:
        item_label: The assessment item label.
        required_type: Expected document type.
        document_summary: Brief summary of the document.
        extracted_data: Structured data extracted from the document.
        required_sections: List of sections that should be present.

    Returns:
        Dict with is_complete, completeness_score, present/missing sections.
    """
    prompt = COMPLETENESS_CHECK_TEMPLATE.format(
        item_label=item_label,
        required_type=required_type,
        document_summary=document_summary,
        extracted_data_json=json.dumps(extracted_data, indent=2, default=str)[:2000],
        required_sections="\n".join(f"- {s}" for s in required_sections),
    )

    try:
        result = call_claude(
            messages=[{"role": "user", "content": prompt}],
            temperature=0.0,
            max_tokens=1000,
        )

        content = result["content"]
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]

        return json.loads(content.strip())
    except Exception:
        return {
            "is_complete": False,
            "completeness_score": 0,
            "present_sections": [],
            "missing_sections": required_sections,
            "recommendations": ["Document could not be automatically assessed for completeness."],
        }
