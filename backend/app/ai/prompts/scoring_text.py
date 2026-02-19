"""Prompt templates for Claude API text scoring."""

SCORE_TEXT_RESPONSE_SYSTEM = """You are an expert TNE (Transnational Education) quality assessor.
You evaluate institutional responses against specific rubric dimensions.
You must be fair, consistent, and evidence-based in your scoring.
Always provide constructive feedback that helps institutions improve."""

SCORE_TEXT_RESPONSE_TEMPLATE = """Evaluate the following institutional response for the assessment item.

**Item**: {item_label}
**Item Code**: {item_code}
**Theme**: {theme_name}

**Institution's Response**:
{response_text}

**Scoring Rubric** - Score each dimension from 0-25:

1. **Relevance** (0-25): How relevant is the response to the specific question asked?
   - 25: Directly and comprehensively addresses all aspects
   - 18: Addresses most aspects with some detail
   - 10: Partially addresses but misses key aspects
   - 5: Barely addresses the question

2. **Specificity** (0-25): How specific and detailed is the response?
   - 25: Specific examples, numbers, names, concrete details
   - 18: Some specific details with occasional generalities
   - 10: Mostly generic statements
   - 5: Entirely vague

3. **Evidence of Quality** (0-25): Quality of evidence provided?
   - 25: Strong evidence: data, documented processes, external validation
   - 18: Reasonable evidence with some supporting data
   - 10: Limited evidence, mostly self-reported
   - 5: No evidence

4. **Comprehensiveness** (0-25): How complete is the response?
   - 25: Covers all expected aspects thoroughly
   - 18: Covers most expected aspects
   - 10: Covers some aspects but significant gaps
   - 5: Major gaps

Respond in exactly this JSON format:
{{
  "relevance": <0-25>,
  "specificity": <0-25>,
  "evidence": <0-25>,
  "comprehensiveness": <0-25>,
  "total_score": <0-100>,
  "strengths": ["<strength 1>", "<strength 2>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>"],
  "feedback": "<2-3 sentences of constructive feedback>"
}}"""

CONSISTENCY_CHECK_SYSTEM = """You are an expert TNE quality assessor performing a consistency check.
Identify contradictions, implausible claims, and inconsistencies across assessment responses."""

CONSISTENCY_CHECK_TEMPLATE = """Review the following assessment responses for internal consistency.
Flag any contradictions, implausible claims, or inconsistencies.

**Assessment Data**:
{assessment_data_json}

Respond in JSON format:
{{
  "consistent": <true/false>,
  "issues": [
    {{
      "severity": "<high/medium/low>",
      "items_involved": ["<item_code_1>", "<item_code_2>"],
      "description": "<description of the inconsistency>",
      "recommendation": "<suggested resolution>"
    }}
  ],
  "overall_assessment": "<brief summary>"
}}"""
