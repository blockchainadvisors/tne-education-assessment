"""Seed the database with the TNE Quality Assessment template, themes, and items."""
import asyncio
import uuid
import sys
import os

# Ensure the backend package is importable when run from the project root
# or via: cd backend && python -m scripts.seed_assessment_template
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from sqlalchemy import select
from app.database import engine, async_session_factory, Base
from app.models.assessment import AssessmentTemplate, AssessmentTheme, AssessmentItem


# ---------------------------------------------------------------------------
# Template definition
# ---------------------------------------------------------------------------
TEMPLATE_NAME = "TNE Quality Assessment"
TEMPLATE_VERSION = "v1.0"
TEMPLATE_DESCRIPTION = (
    "Comprehensive assessment template for evaluating Transnational Education "
    "partnerships across five core themes: Teaching & Learning, Student Experience "
    "& Outcomes, Governance & Quality Assurance, Impact & Engagement, and "
    "Financial Sustainability."
)

# ---------------------------------------------------------------------------
# Theme definitions (name, slug, weight, display_order, description)
# ---------------------------------------------------------------------------
THEMES = [
    {
        "name": "Teaching & Learning",
        "slug": "teaching-learning",
        "weight": 0.25,
        "display_order": 1,
        "description": (
            "Evaluates the quality, breadth, and delivery of academic programmes, "
            "staffing levels and qualifications, and pedagogical practices."
        ),
    },
    {
        "name": "Student Experience & Outcomes",
        "slug": "student-experience",
        "weight": 0.25,
        "display_order": 2,
        "description": (
            "Assesses student satisfaction, support services, graduate outcomes, "
            "and parity of experience with the home campus."
        ),
    },
    {
        "name": "Governance & Quality Assurance",
        "slug": "governance",
        "weight": 0.20,
        "display_order": 3,
        "description": (
            "Reviews partnership governance structures, quality assurance frameworks, "
            "regulatory compliance, and risk management."
        ),
    },
    {
        "name": "Impact & Engagement",
        "slug": "impact",
        "weight": 0.15,
        "display_order": 4,
        "description": (
            "Measures research collaboration, industry partnerships, community impact, "
            "and knowledge exchange activities."
        ),
    },
    {
        "name": "Financial Sustainability",
        "slug": "financial",
        "weight": 0.15,
        "display_order": 5,
        "description": (
            "Evaluates revenue trends, investment in TNE infrastructure, financial "
            "risk management, and staff compensation competitiveness."
        ),
    },
]

# ---------------------------------------------------------------------------
# Item definitions keyed by theme slug
# Each item: (code, label, field_type, field_config, scoring_rubric, weight,
#              is_required, display_order)
# ---------------------------------------------------------------------------
TEXT_RUBRIC = {
    "type": "text_rubric",
    "dimensions": ["relevance", "specificity", "evidence", "comprehensiveness"],
}

ITEMS_BY_THEME: dict[str, list[dict]] = {
    # =======================================================================
    # Theme 1: Teaching & Learning  (15 items)
    # =======================================================================
    "teaching-learning": [
        {
            "code": "TL01",
            "label": "Number of TNE programmes offered",
            "field_type": "numeric",
            "field_config": {"min": 0},
            "scoring_rubric": {
                "type": "numeric_range",
                "ranges": [
                    {"min": 1, "max": 5, "score": 40},
                    {"min": 5, "max": 15, "score": 70},
                    {"min": 15, "max": 100, "score": 100},
                ],
            },
            "weight": 0.5,
            "is_required": True,
            "display_order": 1,
        },
        {
            "code": "TL02",
            "label": "Types of programmes (levels and disciplines)",
            "field_type": "multi_select",
            "field_config": {
                "options": [
                    "Foundation",
                    "Undergraduate",
                    "Postgraduate Taught",
                    "Postgraduate Research",
                    "Professional/Executive",
                ]
            },
            "scoring_rubric": {
                "type": "multi_select_coverage",
                "min_score": 20,
                "per_option": 20,
            },
            "weight": 0.5,
            "is_required": True,
            "display_order": 2,
        },
        {
            "code": "TL03",
            "label": "Total number of TNE students enrolled (4-year trend by gender)",
            "field_type": "multi_year_gender",
            "field_config": {"years": 4, "label": "Students"},
            "scoring_rubric": {
                "type": "timeseries_trend",
                "ideal_direction": "increasing",
            },
            "weight": 1.5,
            "is_required": True,
            "display_order": 3,
        },
        {
            "code": "TL04",
            "label": "Student completion/retention rate (%)",
            "field_type": "percentage",
            "field_config": {"min": 0, "max": 100},
            "scoring_rubric": {
                "type": "numeric_range",
                "ranges": [
                    {"min": 90, "max": 101, "score": 100},
                    {"min": 80, "max": 90, "score": 80},
                    {"min": 70, "max": 80, "score": 60},
                    {"min": 0, "max": 70, "score": 30},
                ],
            },
            "weight": 1.5,
            "is_required": True,
            "display_order": 4,
        },
        {
            "code": "TL05",
            "label": "Programme review mechanisms",
            "field_type": "long_text",
            "field_config": {
                "max_length": 2000,
                "placeholder": "Describe programme review and curriculum update processes...",
            },
            "scoring_rubric": TEXT_RUBRIC,
            "weight": 1.0,
            "is_required": True,
            "display_order": 5,
        },
        {
            "code": "TL06",
            "label": "Total academic staff delivering TNE programmes",
            "field_type": "numeric",
            "field_config": {"min": 0},
            "scoring_rubric": {
                "type": "numeric_range",
                "ranges": [
                    {"min": 20, "max": 1000, "score": 100},
                    {"min": 10, "max": 20, "score": 70},
                    {"min": 1, "max": 10, "score": 40},
                ],
            },
            "weight": 0.8,
            "is_required": True,
            "display_order": 6,
        },
        {
            "code": "TL07",
            "label": "Staff with doctoral qualifications (PhD or equivalent)",
            "field_type": "numeric",
            "field_config": {"min": 0},
            "scoring_rubric": None,
            "weight": 0.5,
            "is_required": True,
            "display_order": 7,
        },
        {
            "code": "TL08",
            "label": "Staff with doctoral qualifications (%)",
            "field_type": "auto_calculated",
            "field_config": {
                "formula": "TL07/TL06*100",
                "depends_on": ["TL07", "TL06"],
            },
            "scoring_rubric": {
                "type": "numeric_range",
                "ranges": [
                    {"min": 60, "max": 101, "score": 100},
                    {"min": 40, "max": 60, "score": 75},
                    {"min": 20, "max": 40, "score": 50},
                    {"min": 0, "max": 20, "score": 25},
                ],
            },
            "weight": 1.0,
            "is_required": False,
            "display_order": 8,
        },
        {
            "code": "TL09",
            "label": "Flying faculty (home campus staff teaching at TNE site)",
            "field_type": "numeric",
            "field_config": {"min": 0},
            "scoring_rubric": None,
            "weight": 0.3,
            "is_required": True,
            "display_order": 9,
        },
        {
            "code": "TL10",
            "label": "Flying faculty percentage",
            "field_type": "auto_calculated",
            "field_config": {
                "formula": "TL09/TL06*100",
                "depends_on": ["TL09", "TL06"],
            },
            "scoring_rubric": {
                "type": "numeric_range",
                "ranges": [
                    {"min": 0, "max": 20, "score": 100},
                    {"min": 20, "max": 40, "score": 75},
                    {"min": 40, "max": 60, "score": 50},
                    {"min": 60, "max": 101, "score": 25},
                ],
            },
            "weight": 0.8,
            "is_required": False,
            "display_order": 10,
        },
        {
            "code": "TL11",
            "label": "Student-Staff Ratio (SSR)",
            "field_type": "auto_calculated",
            "field_config": {
                "formula": "TL03/TL06",
                "depends_on": ["TL03", "TL06"],
            },
            "scoring_rubric": {
                "type": "numeric_range",
                "ranges": [
                    {"min": 0, "max": 15, "score": 100},
                    {"min": 15, "max": 25, "score": 75},
                    {"min": 25, "max": 35, "score": 50},
                    {"min": 35, "max": 100, "score": 25},
                ],
            },
            "weight": 1.2,
            "is_required": False,
            "display_order": 11,
        },
        {
            "code": "TL12",
            "label": "Staff development and training programmes",
            "field_type": "long_text",
            "field_config": {"max_length": 2000},
            "scoring_rubric": TEXT_RUBRIC,
            "weight": 0.8,
            "is_required": True,
            "display_order": 12,
        },
        {
            "code": "TL13",
            "label": "Joint curriculum development between partners",
            "field_type": "yes_no_conditional",
            "field_config": {
                "follow_up": "Describe the joint development process",
            },
            "scoring_rubric": {"type": "binary_with_evidence"},
            "weight": 0.8,
            "is_required": True,
            "display_order": 13,
        },
        {
            "code": "TL14",
            "label": "External examiner/moderator arrangements",
            "field_type": "yes_no_conditional",
            "field_config": {"follow_up": "Describe the arrangements"},
            "scoring_rubric": {"type": "binary_with_evidence"},
            "weight": 0.8,
            "is_required": True,
            "display_order": 14,
        },
        {
            "code": "TL15",
            "label": "Teaching observation and peer review processes",
            "field_type": "long_text",
            "field_config": {"max_length": 1500},
            "scoring_rubric": TEXT_RUBRIC,
            "weight": 0.7,
            "is_required": True,
            "display_order": 15,
        },
    ],
    # =======================================================================
    # Theme 2: Student Experience & Outcomes  (12 items)
    # =======================================================================
    "student-experience": [
        {
            "code": "SE01",
            "label": "Student satisfaction survey results (4-year trend)",
            "field_type": "multi_year_gender",
            "field_config": {
                "years": 4,
                "label": "Satisfaction %",
                "value_type": "percentage",
            },
            "scoring_rubric": {
                "type": "timeseries_trend",
                "ideal_direction": "increasing",
            },
            "weight": 1.5,
            "is_required": True,
            "display_order": 1,
        },
        {
            "code": "SE02",
            "label": "Student feedback mechanisms",
            "field_type": "long_text",
            "field_config": {"max_length": 2000},
            "scoring_rubric": TEXT_RUBRIC,
            "weight": 1.0,
            "is_required": True,
            "display_order": 2,
        },
        {
            "code": "SE03",
            "label": "Student support services available",
            "field_type": "multi_select",
            "field_config": {
                "options": [
                    "Academic advising",
                    "Mental health support",
                    "Career services",
                    "Library access",
                    "IT support",
                    "Disability support",
                    "Language support",
                ]
            },
            "scoring_rubric": {
                "type": "multi_select_coverage",
                "min_score": 15,
                "per_option": 14,
            },
            "weight": 1.0,
            "is_required": True,
            "display_order": 3,
        },
        {
            "code": "SE04",
            "label": "Graduate employment rate within 6 months (%)",
            "field_type": "percentage",
            "field_config": {"min": 0, "max": 100},
            "scoring_rubric": {
                "type": "numeric_range",
                "ranges": [
                    {"min": 80, "max": 101, "score": 100},
                    {"min": 60, "max": 80, "score": 75},
                    {"min": 40, "max": 60, "score": 50},
                    {"min": 0, "max": 40, "score": 25},
                ],
            },
            "weight": 1.5,
            "is_required": True,
            "display_order": 4,
        },
        {
            "code": "SE05",
            "label": "Graduate employment rate within 12 months (%)",
            "field_type": "percentage",
            "field_config": {"min": 0, "max": 100},
            "scoring_rubric": {
                "type": "numeric_range",
                "ranges": [
                    {"min": 90, "max": 101, "score": 100},
                    {"min": 75, "max": 90, "score": 80},
                    {"min": 60, "max": 75, "score": 55},
                    {"min": 0, "max": 60, "score": 25},
                ],
            },
            "weight": 1.0,
            "is_required": True,
            "display_order": 5,
        },
        {
            "code": "SE06",
            "label": "Student placement/internship opportunities",
            "field_type": "yes_no_conditional",
            "field_config": {
                "follow_up": "Describe placement arrangements and participation rates",
            },
            "scoring_rubric": {"type": "binary_with_evidence"},
            "weight": 1.0,
            "is_required": True,
            "display_order": 6,
        },
        {
            "code": "SE07",
            "label": "Alumni engagement and tracking",
            "field_type": "long_text",
            "field_config": {"max_length": 1500},
            "scoring_rubric": TEXT_RUBRIC,
            "weight": 0.7,
            "is_required": True,
            "display_order": 7,
        },
        {
            "code": "SE08",
            "label": "Parity of experience with home campus students",
            "field_type": "long_text",
            "field_config": {"max_length": 2000},
            "scoring_rubric": TEXT_RUBRIC,
            "weight": 1.2,
            "is_required": True,
            "display_order": 8,
        },
        {
            "code": "SE09",
            "label": "Student complaints and appeals process",
            "field_type": "yes_no_conditional",
            "field_config": {"follow_up": "Describe the process"},
            "scoring_rubric": {"type": "binary_with_evidence"},
            "weight": 0.8,
            "is_required": True,
            "display_order": 9,
        },
        {
            "code": "SE10",
            "label": "Learning resources and facilities",
            "field_type": "long_text",
            "field_config": {"max_length": 2000},
            "scoring_rubric": TEXT_RUBRIC,
            "weight": 1.0,
            "is_required": True,
            "display_order": 10,
        },
        {
            "code": "SE11",
            "label": "Digital learning environment and resources",
            "field_type": "long_text",
            "field_config": {"max_length": 1500},
            "scoring_rubric": TEXT_RUBRIC,
            "weight": 0.8,
            "is_required": True,
            "display_order": 11,
        },
        {
            "code": "SE12",
            "label": "Safeguarding and student welfare policies",
            "field_type": "file_upload",
            "field_config": {
                "accepted_types": ["pdf", "docx"],
                "max_size_mb": 10,
            },
            "scoring_rubric": {
                "type": "document_completeness",
                "required_sections": ["scope", "procedures", "contacts"],
            },
            "weight": 0.8,
            "is_required": True,
            "display_order": 12,
        },
    ],
    # =======================================================================
    # Theme 3: Governance & Quality Assurance  (10 items)
    # =======================================================================
    "governance": [
        {
            "code": "GV01",
            "label": "Partnership agreement/Terms of Reference",
            "field_type": "file_upload",
            "field_config": {
                "accepted_types": ["pdf", "docx"],
                "max_size_mb": 20,
            },
            "scoring_rubric": {
                "type": "document_completeness",
                "required_sections": [
                    "roles",
                    "responsibilities",
                    "duration",
                    "review",
                ],
            },
            "weight": 1.5,
            "is_required": True,
            "display_order": 1,
        },
        {
            "code": "GV02",
            "label": "Joint governance board/committee",
            "field_type": "yes_no_conditional",
            "field_config": {
                "follow_up": "Describe composition and meeting frequency",
            },
            "scoring_rubric": {"type": "binary_with_evidence"},
            "weight": 1.2,
            "is_required": True,
            "display_order": 2,
        },
        {
            "code": "GV03",
            "label": "Quality assurance framework description",
            "field_type": "long_text",
            "field_config": {"max_length": 3000},
            "scoring_rubric": TEXT_RUBRIC,
            "weight": 1.5,
            "is_required": True,
            "display_order": 3,
        },
        {
            "code": "GV04",
            "label": "Compliance with local regulatory requirements",
            "field_type": "yes_no_conditional",
            "field_config": {
                "follow_up": "List regulatory bodies and compliance status",
            },
            "scoring_rubric": {"type": "binary_with_evidence"},
            "weight": 1.2,
            "is_required": True,
            "display_order": 4,
        },
        {
            "code": "GV05",
            "label": "Risk management framework",
            "field_type": "long_text",
            "field_config": {"max_length": 2000},
            "scoring_rubric": TEXT_RUBRIC,
            "weight": 1.0,
            "is_required": True,
            "display_order": 5,
        },
        {
            "code": "GV06",
            "label": "Data sharing and reporting protocols",
            "field_type": "long_text",
            "field_config": {"max_length": 1500},
            "scoring_rubric": TEXT_RUBRIC,
            "weight": 0.8,
            "is_required": True,
            "display_order": 6,
        },
        {
            "code": "GV07",
            "label": "Partner institution due diligence",
            "field_type": "file_upload",
            "field_config": {
                "accepted_types": ["pdf", "docx"],
                "max_size_mb": 15,
            },
            "scoring_rubric": {
                "type": "document_completeness",
                "required_sections": [
                    "financial",
                    "academic",
                    "legal",
                    "reputation",
                ],
            },
            "weight": 1.0,
            "is_required": True,
            "display_order": 7,
        },
        {
            "code": "GV08",
            "label": "Annual monitoring and review process",
            "field_type": "long_text",
            "field_config": {"max_length": 2000},
            "scoring_rubric": TEXT_RUBRIC,
            "weight": 1.0,
            "is_required": True,
            "display_order": 8,
        },
        {
            "code": "GV09",
            "label": "Student representation in governance",
            "field_type": "yes_no_conditional",
            "field_config": {
                "follow_up": "Describe how students are represented",
            },
            "scoring_rubric": {"type": "binary_with_evidence"},
            "weight": 0.7,
            "is_required": True,
            "display_order": 9,
        },
        {
            "code": "GV10",
            "label": "Academic integrity policies and procedures",
            "field_type": "long_text",
            "field_config": {"max_length": 2000},
            "scoring_rubric": TEXT_RUBRIC,
            "weight": 1.0,
            "is_required": True,
            "display_order": 10,
        },
    ],
    # =======================================================================
    # Theme 4: Impact & Engagement  (8 items)
    # =======================================================================
    "impact": [
        {
            "code": "IM01",
            "label": "Research collaboration with partner institution",
            "field_type": "long_text",
            "field_config": {"max_length": 2000},
            "scoring_rubric": TEXT_RUBRIC,
            "weight": 1.0,
            "is_required": True,
            "display_order": 1,
        },
        {
            "code": "IM02",
            "label": "Number of joint research publications (4-year trend)",
            "field_type": "multi_year_gender",
            "field_config": {
                "years": 4,
                "label": "Publications",
                "has_gender": False,
            },
            "scoring_rubric": {
                "type": "timeseries_trend",
                "ideal_direction": "increasing",
            },
            "weight": 1.0,
            "is_required": True,
            "display_order": 2,
        },
        {
            "code": "IM03",
            "label": "Industry partnerships and engagement",
            "field_type": "long_text",
            "field_config": {"max_length": 2000},
            "scoring_rubric": TEXT_RUBRIC,
            "weight": 1.0,
            "is_required": True,
            "display_order": 3,
        },
        {
            "code": "IM04",
            "label": "Community impact and social responsibility initiatives",
            "field_type": "long_text",
            "field_config": {"max_length": 2000},
            "scoring_rubric": TEXT_RUBRIC,
            "weight": 0.8,
            "is_required": True,
            "display_order": 4,
        },
        {
            "code": "IM05",
            "label": "Knowledge exchange and capacity building",
            "field_type": "long_text",
            "field_config": {"max_length": 2000},
            "scoring_rubric": TEXT_RUBRIC,
            "weight": 0.8,
            "is_required": True,
            "display_order": 5,
        },
        {
            "code": "IM06",
            "label": "International student mobility (exchange programmes)",
            "field_type": "yes_no_conditional",
            "field_config": {
                "follow_up": "Describe mobility numbers and destinations",
            },
            "scoring_rubric": {"type": "binary_with_evidence"},
            "weight": 0.8,
            "is_required": True,
            "display_order": 6,
        },
        {
            "code": "IM07",
            "label": "Contribution to local skills development",
            "field_type": "long_text",
            "field_config": {"max_length": 1500},
            "scoring_rubric": TEXT_RUBRIC,
            "weight": 0.7,
            "is_required": True,
            "display_order": 7,
        },
        {
            "code": "IM08",
            "label": "Awards, accreditations, or recognitions received",
            "field_type": "short_text",
            "field_config": {"max_length": 500},
            "scoring_rubric": TEXT_RUBRIC,
            "weight": 0.5,
            "is_required": True,
            "display_order": 8,
        },
    ],
    # =======================================================================
    # Theme 5: Financial Sustainability  (7 items)
    # =======================================================================
    "financial": [
        {
            "code": "FN01",
            "label": "Annual TNE revenue (4-year trend, GBP)",
            "field_type": "multi_year_gender",
            "field_config": {
                "years": 4,
                "label": "Revenue (GBP)",
                "has_gender": False,
            },
            "scoring_rubric": {
                "type": "timeseries_trend",
                "ideal_direction": "increasing",
            },
            "weight": 1.5,
            "is_required": True,
            "display_order": 1,
        },
        {
            "code": "FN02",
            "label": "Revenue as percentage of total institutional income",
            "field_type": "percentage",
            "field_config": {"min": 0, "max": 100},
            "scoring_rubric": {
                "type": "numeric_range",
                "ranges": [
                    {"min": 10, "max": 101, "score": 100},
                    {"min": 5, "max": 10, "score": 70},
                    {"min": 1, "max": 5, "score": 40},
                    {"min": 0, "max": 1, "score": 20},
                ],
            },
            "weight": 1.0,
            "is_required": True,
            "display_order": 2,
        },
        {
            "code": "FN03",
            "label": "Fee structure and affordability analysis",
            "field_type": "long_text",
            "field_config": {"max_length": 2000},
            "scoring_rubric": TEXT_RUBRIC,
            "weight": 1.0,
            "is_required": True,
            "display_order": 3,
        },
        {
            "code": "FN04",
            "label": "Investment in TNE infrastructure and resources",
            "field_type": "long_text",
            "field_config": {"max_length": 2000},
            "scoring_rubric": TEXT_RUBRIC,
            "weight": 0.8,
            "is_required": True,
            "display_order": 4,
        },
        {
            "code": "FN05",
            "label": "Financial risk assessment",
            "field_type": "long_text",
            "field_config": {"max_length": 2000},
            "scoring_rubric": TEXT_RUBRIC,
            "weight": 1.0,
            "is_required": True,
            "display_order": 5,
        },
        {
            "code": "FN06",
            "label": "Salary benchmarking by band (partner staff)",
            "field_type": "salary_bands",
            "field_config": {
                "bands": [
                    "Professor",
                    "Associate Professor",
                    "Senior Lecturer",
                    "Lecturer",
                    "Teaching Assistant",
                ],
                "currencies": ["GBP", "USD", "EUR", "AED", "MYR", "SGD"],
            },
            "scoring_rubric": {"type": "salary_competitiveness"},
            "weight": 0.8,
            "is_required": True,
            "display_order": 6,
        },
        {
            "code": "FN07",
            "label": "Scholarship and financial aid provisions",
            "field_type": "yes_no_conditional",
            "field_config": {
                "follow_up": "Describe scholarship programmes and coverage",
            },
            "scoring_rubric": {"type": "binary_with_evidence"},
            "weight": 0.7,
            "is_required": True,
            "display_order": 7,
        },
    ],
}


# ---------------------------------------------------------------------------
# Seed logic
# ---------------------------------------------------------------------------
async def seed() -> None:
    """Create the TNE Quality Assessment template with all themes and items."""
    async with async_session_factory() as session:
        # ------------------------------------------------------------------
        # 1. Check if template already exists
        # ------------------------------------------------------------------
        result = await session.execute(
            select(AssessmentTemplate).where(
                AssessmentTemplate.name == TEMPLATE_NAME,
                AssessmentTemplate.version == TEMPLATE_VERSION,
            )
        )
        existing = result.scalar_one_or_none()
        if existing:
            print(
                f"Template '{TEMPLATE_NAME} {TEMPLATE_VERSION}' already exists "
                f"(id={existing.id}). Skipping seed."
            )
            return

        # ------------------------------------------------------------------
        # 2. Create the template
        # ------------------------------------------------------------------
        template = AssessmentTemplate(
            id=uuid.uuid4(),
            name=TEMPLATE_NAME,
            version=TEMPLATE_VERSION,
            description=TEMPLATE_DESCRIPTION,
            is_active=True,
        )
        session.add(template)
        await session.flush()  # ensure template.id is available
        print(f"Created template: {template.name} {template.version} (id={template.id})")

        # ------------------------------------------------------------------
        # 3. Create themes
        # ------------------------------------------------------------------
        theme_map: dict[str, AssessmentTheme] = {}
        for theme_def in THEMES:
            theme = AssessmentTheme(
                id=uuid.uuid4(),
                template_id=template.id,
                name=theme_def["name"],
                slug=theme_def["slug"],
                description=theme_def["description"],
                weight=theme_def["weight"],
                display_order=theme_def["display_order"],
            )
            session.add(theme)
            theme_map[theme_def["slug"]] = theme

        await session.flush()  # ensure theme ids are available
        print(f"Created {len(theme_map)} themes")

        # ------------------------------------------------------------------
        # 4. Create items for each theme
        # ------------------------------------------------------------------
        total_items = 0
        for slug, items_list in ITEMS_BY_THEME.items():
            theme = theme_map[slug]
            for item_def in items_list:
                item = AssessmentItem(
                    id=uuid.uuid4(),
                    theme_id=theme.id,
                    code=item_def["code"],
                    label=item_def["label"],
                    field_type=item_def["field_type"],
                    field_config=item_def["field_config"],
                    scoring_rubric=item_def["scoring_rubric"],
                    weight=item_def["weight"],
                    is_required=item_def["is_required"],
                    display_order=item_def["display_order"],
                )
                session.add(item)
                total_items += 1

        await session.commit()

        # ------------------------------------------------------------------
        # 5. Print summary
        # ------------------------------------------------------------------
        print()
        print("=" * 60)
        print("  TNE Quality Assessment Template Seeded Successfully")
        print("=" * 60)
        print(f"  Template : {TEMPLATE_NAME} {TEMPLATE_VERSION}")
        print(f"  Template ID : {template.id}")
        print(f"  Themes   : {len(theme_map)}")
        print(f"  Items    : {total_items}")
        print()
        for slug, theme_obj in theme_map.items():
            item_count = len(ITEMS_BY_THEME[slug])
            weight_pct = next(
                t["weight"] for t in THEMES if t["slug"] == slug
            ) * 100
            print(
                f"    {theme_obj.display_order}. {theme_obj.name:<40} "
                f"weight={weight_pct:.0f}%  items={item_count}"
            )
        print()
        print("=" * 60)


async def main() -> None:
    """Entry point: create tables (if needed) and run the seed."""
    # Ensure all tables exist (idempotent)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    await seed()

    # Clean up the engine
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
