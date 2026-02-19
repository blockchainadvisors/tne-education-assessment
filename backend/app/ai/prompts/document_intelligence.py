"""Prompt templates for document intelligence pipeline."""

CLASSIFY_DOCUMENT_SYSTEM = """You are a document classification expert for Transnational Education (TNE)
quality assessment. Classify uploaded documents into predefined categories."""

CLASSIFY_DOCUMENT_TEMPLATE = """Classify this document based on its content.

**Filename**: {filename}
**First 2000 characters of extracted text**:
{text_excerpt}

Classify into ONE of these categories:
- terms_of_reference: Partnership agreement or Terms of Reference
- standard_operating_procedure: Quality assurance SOP or process document
- organisational_chart: Governance or organisational structure diagram
- policy_document: Institutional policy (safeguarding, academic integrity, etc.)
- financial_report: Financial statements or budget documents
- meeting_minutes: Committee or board meeting minutes
- programme_specification: Programme/course specification document
- accreditation_report: External accreditation or review report
- student_survey: Student satisfaction survey results
- other: Does not fit any category above

Respond in JSON:
{{
  "document_type": "<category>",
  "confidence": <0.0-1.0>,
  "summary": "<1-2 sentence summary of the document>"
}}"""

EXTRACT_STRUCTURED_DATA_TEMPLATE = """Extract structured data from this {document_type} document.

**Document text**:
{document_text}

{type_specific_instructions}

Respond in JSON with the extracted fields. Use null for fields that cannot be determined."""

# Type-specific extraction instructions
EXTRACTION_INSTRUCTIONS = {
    "terms_of_reference": """Extract these fields:
- parties: List of parties involved
- effective_date: Start date of the agreement
- duration: Duration/end date
- key_responsibilities: List of key responsibilities for each party
- review_date: When the agreement is next reviewed
- governing_law: Jurisdiction/governing law""",

    "policy_document": """Extract these fields:
- policy_name: Official name of the policy
- scope: Who/what the policy covers
- key_provisions: List of main provisions/sections
- review_date: When the policy is next reviewed
- approving_body: Who approved the policy
- contact_person: Key contact for the policy""",

    "meeting_minutes": """Extract these fields:
- meeting_name: Name/type of meeting
- date: Date of the meeting
- attendees: List of attendees
- key_decisions: List of key decisions made
- action_items: List of action items with owners""",
}

COMPLETENESS_CHECK_TEMPLATE = """Assess whether this document satisfies the requirements for the assessment item.

**Assessment Item**: {item_label}
**Required Document Type**: {required_type}
**Document Summary**: {document_summary}
**Extracted Data**: {extracted_data_json}

**Required Sections/Content**:
{required_sections}

Respond in JSON:
{{
  "is_complete": <true/false>,
  "completeness_score": <0-100>,
  "present_sections": ["<section1>", "<section2>"],
  "missing_sections": ["<section1>"],
  "recommendations": ["<recommendation for improving completeness>"]
}}"""
