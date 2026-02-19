"""Document type classification using Claude API."""

import json

from app.ai.claude_client import call_claude
from app.ai.prompts.document_intelligence import (
    CLASSIFY_DOCUMENT_SYSTEM,
    CLASSIFY_DOCUMENT_TEMPLATE,
)


async def classify_document(filename: str, text_excerpt: str) -> dict:
    """Classify a document type using Claude API.

    Args:
        filename: Original filename of the document.
        text_excerpt: First 2000 characters of extracted text.

    Returns:
        Dict with document_type, confidence, and summary.
    """
    prompt = CLASSIFY_DOCUMENT_TEMPLATE.format(
        filename=filename,
        text_excerpt=text_excerpt[:2000],
    )

    try:
        result = call_claude(
            messages=[{"role": "user", "content": prompt}],
            system=CLASSIFY_DOCUMENT_SYSTEM,
            temperature=0.0,
            max_tokens=500,
        )

        content = result["content"]
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]

        classification = json.loads(content.strip())
        return {
            "document_type": classification.get("document_type", "other"),
            "confidence": classification.get("confidence", 0.0),
            "summary": classification.get("summary", ""),
        }
    except Exception:
        # Fallback: try to classify from filename
        filename_lower = filename.lower()
        if "tor" in filename_lower or "terms" in filename_lower:
            return {"document_type": "terms_of_reference", "confidence": 0.3, "summary": ""}
        elif "sop" in filename_lower or "procedure" in filename_lower:
            return {"document_type": "standard_operating_procedure", "confidence": 0.3, "summary": ""}
        elif "policy" in filename_lower or "safeguard" in filename_lower:
            return {"document_type": "policy_document", "confidence": 0.3, "summary": ""}
        return {"document_type": "other", "confidence": 0.1, "summary": ""}
