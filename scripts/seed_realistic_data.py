"""Seed the database with realistic test data spanning 1 year.

Creates:
- 4 tenants (UK, UAE, Australia, Singapore) with different subscription tiers
- 15+ users across all roles
- Partner institutions per tenant
- Assessments across 4 academic years (2022-23 through 2025-26)
- Full responses for all 52 items per assessment
- AI scores and theme scores for completed assessments
- Assessment reports for report_generated assessments
- Benchmark snapshots for peer comparison

Run: python -m scripts.seed_realistic_data
Reset: python -m scripts.seed_realistic_data --reset
"""

import asyncio
import random
import sys
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

from passlib.context import CryptContext

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from sqlalchemy import delete, select  # noqa: E402

from app.database import Base, async_session_factory, engine  # noqa: E402
from app.models.assessment import (  # noqa: E402
    Assessment,
    AssessmentItem,
    AssessmentResponse,
    AssessmentTemplate,
    AssessmentTheme,
)
from app.models.benchmark import BenchmarkSnapshot  # noqa: E402
from app.models.report import AssessmentReport  # noqa: E402
from app.models.scoring import ThemeScore  # noqa: E402
from app.models.tenant import PartnerInstitution, Tenant  # noqa: E402
from app.models.user import User  # noqa: E402

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
random.seed(42)  # reproducible data

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
DEMO_SLUG_PREFIX = "demo-"
ACADEMIC_YEARS = ["2022-23", "2023-24", "2024-25", "2025-26"]

TENANTS = [
    {
        "name": "Imperial College London",
        "slug": "demo-imperial",
        "country": "United Kingdom",
        "institution_type": "University",
        "subscription_tier": "enterprise",
    },
    {
        "name": "University of Wollongong",
        "slug": "demo-wollongong",
        "country": "Australia",
        "institution_type": "University",
        "subscription_tier": "professional",
    },
    {
        "name": "Khalifa University",
        "slug": "demo-khalifa",
        "country": "United Arab Emirates",
        "institution_type": "University",
        "subscription_tier": "professional",
    },
    {
        "name": "Nanyang Technological University",
        "slug": "demo-nanyang",
        "country": "Singapore",
        "institution_type": "University",
        "subscription_tier": "enterprise",
    },
]

PARTNERS_BY_TENANT: dict[str, list[dict]] = {
    "demo-imperial": [
        {"name": "Singapore Institute of Technology", "country": "Singapore"},
        {"name": "HKUST", "country": "Hong Kong"},
        {"name": "University of Malaya", "country": "Malaysia"},
    ],
    "demo-wollongong": [
        {"name": "SIMGE Singapore", "country": "Singapore"},
        {"name": "University of Wollongong Dubai", "country": "United Arab Emirates"},
    ],
    "demo-khalifa": [
        {"name": "MIT Partnership Programme", "country": "United States"},
        {"name": "Technical University of Munich", "country": "Germany"},
    ],
    "demo-nanyang": [
        {"name": "TU Eindhoven", "country": "Netherlands"},
        {"name": "Peking University", "country": "China"},
        {"name": "IIT Bombay", "country": "India"},
    ],
}

USERS_BY_TENANT: dict[str, list[dict]] = {
    "demo-imperial": [
        {"email": "s.johnson@imperial.ac.uk", "full_name": "Sarah Johnson", "role": "tenant_admin", "password": "DemoPass123!"},
        {"email": "j.wilson@imperial.ac.uk", "full_name": "James Wilson", "role": "assessor", "password": "DemoPass123!"},
        {"email": "e.chen@imperial.ac.uk", "full_name": "Emily Chen", "role": "assessor", "password": "DemoPass123!"},
        {"email": "m.patel@imperial.ac.uk", "full_name": "Meera Patel", "role": "reviewer", "password": "DemoPass123!"},
    ],
    "demo-wollongong": [
        {"email": "a.murray@uow.edu.au", "full_name": "Andrew Murray", "role": "tenant_admin", "password": "DemoPass123!"},
        {"email": "l.zhang@uow.edu.au", "full_name": "Lisa Zhang", "role": "assessor", "password": "DemoPass123!"},
        {"email": "r.kapoor@uow.edu.au", "full_name": "Ravi Kapoor", "role": "reviewer", "password": "DemoPass123!"},
    ],
    "demo-khalifa": [
        {"email": "a.rashid@ku.ac.ae", "full_name": "Ahmed Al-Rashid", "role": "tenant_admin", "password": "DemoPass123!"},
        {"email": "f.hassan@ku.ac.ae", "full_name": "Fatima Hassan", "role": "assessor", "password": "DemoPass123!"},
        {"email": "o.khan@ku.ac.ae", "full_name": "Omar Khan", "role": "reviewer", "password": "DemoPass123!"},
    ],
    "demo-nanyang": [
        {"email": "w.tan@ntu.edu.sg", "full_name": "Wei Lin Tan", "role": "tenant_admin", "password": "DemoPass123!"},
        {"email": "h.lee@ntu.edu.sg", "full_name": "Hyun-Ji Lee", "role": "assessor", "password": "DemoPass123!"},
        {"email": "s.kumar@ntu.edu.sg", "full_name": "Sanjay Kumar", "role": "assessor", "password": "DemoPass123!"},
        {"email": "c.wong@ntu.edu.sg", "full_name": "Christine Wong", "role": "reviewer", "password": "DemoPass123!"},
    ],
}

# Platform admin (separate from tenants)
PLATFORM_ADMIN = {
    "email": "admin@tne-academy.com",
    "full_name": "Platform Admin",
    "role": "platform_admin",
    "password": "AdminPass123!",
}


# ---------------------------------------------------------------------------
# Response generators by field type
# ---------------------------------------------------------------------------
def _gen_numeric(code: str, field_config: dict, year_idx: int) -> dict:
    """Generate a numeric response that grows slightly year over year."""
    base_values = {
        "TL01": 8, "TL06": 35, "TL07": 22, "TL09": 5,
    }
    base = base_values.get(code, 15)
    value = base + year_idx * random.randint(1, 3) + random.randint(-2, 2)
    return {"value": max(1, value)}


def _gen_percentage(code: str, year_idx: int) -> dict:
    base_values = {
        "TL04": 82, "SE04": 72, "SE05": 85, "FN02": 8,
    }
    base = base_values.get(code, 70)
    value = base + year_idx * random.uniform(0.5, 2.0) + random.uniform(-3, 3)
    return {"value": round(min(100, max(0, value)), 1)}


def _gen_long_text(code: str) -> dict:
    texts = {
        "TL05": (
            "Programme reviews are conducted on a triennial cycle with annual light-touch monitoring. "
            "Each review panel includes external examiners from peer institutions, industry representatives, "
            "and student representatives. Curriculum updates follow a formal change-management process "
            "requiring approval from the joint academic board. Recent reviews led to the introduction of "
            "work-integrated learning modules and enhanced digital literacy components across all programmes."
        ),
        "TL12": (
            "All TNE-delivering staff complete a mandatory induction programme covering cross-cultural "
            "pedagogy, assessment design for diverse cohorts, and technology-enhanced learning. Annual "
            "CPD requirements include 30 hours of professional development, peer observation participation, "
            "and completion of at least one discipline-specific workshop. A mentoring scheme pairs new "
            "staff with experienced TNE educators for their first two years."
        ),
        "TL15": (
            "A structured peer observation scheme operates across all TNE delivery sites. Each academic "
            "participates in two observations per semester (one as observer, one as observed). Observations "
            "follow a developmental rather than evaluative model, with trained facilitators supporting "
            "reflective practice conversations. An annual teaching excellence symposium showcases "
            "innovative practices identified through the observation programme."
        ),
        "SE02": (
            "Student feedback is collected through multiple channels: end-of-module surveys (response rate >65%), "
            "mid-semester check-ins, student-staff consultative committees meeting monthly, and an anonymous "
            "online suggestion portal reviewed weekly. NSS-equivalent surveys are administered annually with "
            "results benchmarked against UK campus data. Focus groups are conducted each semester to explore "
            "qualitative themes. All feedback is reported to the joint academic board with action plans."
        ),
        "SE07": (
            "The alumni engagement strategy includes a dedicated TNE alumni network with 4,200 active members. "
            "Graduate destination surveys are conducted at 6 and 18 months post-graduation. Annual alumni events "
            "are held in each partner country. An alumni mentoring platform connects current students with "
            "graduates, with 340 active mentor-mentee pairs. Alumni contribution to curriculum advisory "
            "boards ensures industry relevance of programmes."
        ),
        "SE08": (
            "Parity of experience is ensured through shared virtual learning environments, synchronous "
            "guest lectures from UK-based faculty, identical assessment criteria and moderation processes, "
            "and equivalent library and database access. Student satisfaction scores are compared across "
            "sites each semester, with action plans triggered when TNE scores fall more than 5% below "
            "home campus benchmarks. Exchange programmes allow 15% of TNE students to spend a semester "
            "on the home campus."
        ),
        "SE10": (
            "Partner sites provide purpose-built teaching facilities including lecture theatres with "
            "recording capability, collaborative learning spaces, specialist laboratories, and 24/7 "
            "computer labs. All facilities are audited annually against agreed specifications. A capital "
            "investment plan ensures equipment refresh cycles of 3-5 years. Students have access to "
            "physical and digital library collections equivalent to the home campus."
        ),
        "SE11": (
            "A unified digital learning environment is provided through the institutional VLE, accessible "
            "worldwide. This includes recorded lectures, interactive materials, discussion forums, and "
            "online assessment submission. Students have access to specialist software through virtual "
            "desktop infrastructure. Digital literacy training is embedded in induction and supported by "
            "dedicated IT help desks operating across time zones (16-hour coverage)."
        ),
        "GV03": (
            "The quality assurance framework is aligned with the UK Quality Code and relevant local "
            "regulatory requirements. It encompasses: programme approval and modification procedures, "
            "annual monitoring against KPIs, periodic review (5-year cycle), external examining, "
            "student feedback mechanisms, and learning analytics. A dedicated TNE Quality team coordinates "
            "activities across all partnership sites, reporting to the Pro Vice-Chancellor (Global)."
        ),
        "GV05": (
            "The risk management framework for TNE operations covers strategic, operational, financial, "
            "reputational, and compliance risks. A risk register is maintained and reviewed quarterly by "
            "the TNE Operations Committee. Key risk indicators include student recruitment numbers, "
            "satisfaction scores, regulatory changes, and financial performance against targets. Risk "
            "mitigation strategies are embedded in partnership agreements with defined escalation procedures."
        ),
        "GV06": (
            "Data sharing protocols are governed by formal agreements compliant with GDPR and local data "
            "protection legislation. Student data flows through secure, encrypted channels with role-based "
            "access controls. Standardised reporting templates ensure consistent KPI monitoring across "
            "all sites. A shared business intelligence dashboard provides real-time visibility of "
            "enrolment, progression, and completion data to authorised stakeholders."
        ),
        "GV08": (
            "Annual monitoring involves submission of programme reports by partner institutions, reviewed "
            "by School Quality Committees and the TNE Quality team. Reports cover: student data and trends, "
            "external examiner responses, student feedback analysis, action plan progress, and enhancement "
            "initiatives. Site visits are conducted annually, with virtual check-ins occurring quarterly. "
            "An annual TNE monitoring conference brings together staff from all sites."
        ),
        "GV10": (
            "Academic integrity is upheld through a comprehensive policy framework implemented consistently "
            "across all sites. All submissions pass through plagiarism detection software. Staff receive "
            "training on identifying contract cheating and AI-generated content. Students complete a "
            "compulsory academic integrity module during induction. Cases are managed through a unified "
            "process with consistent penalties. An annual integrity report analyses trends and informs "
            "preventive measures."
        ),
        "IM01": (
            "Research collaboration is facilitated through joint research centres established at partner "
            "sites, shared PhD supervision arrangements, and an annual joint research fund of GBP 500,000. "
            "Current collaborative projects span artificial intelligence, sustainable engineering, and "
            "public health. Faculty exchange programmes enable 3-month research sabbaticals at partner "
            "institutions. Co-authored outputs are tracked through a shared research information system."
        ),
        "IM03": (
            "Industry engagement at TNE sites includes advisory boards with 45 industry partners, "
            "an industry mentoring programme matching students with professionals, sponsored final-year "
            "projects, and guest lecture series. Dedicated industry liaison officers at each site manage "
            "relationships with local employers. Internship conversion rates to graduate employment "
            "exceed 40%. Annual industry engagement events attract 200+ employer representatives."
        ),
        "IM04": (
            "Community impact initiatives include pro-bono consulting projects with local NGOs, "
            "STEM outreach programmes reaching 5,000 school students annually, environmental "
            "sustainability projects, and public lecture series on global challenges. The TNE "
            "partnership has contributed to local capacity building through training programmes "
            "for government officials and industry professionals, reaching 1,200 participants last year."
        ),
        "IM05": (
            "Knowledge exchange and capacity building activities include joint staff development "
            "programmes, sharing of teaching and learning innovations, collaborative curriculum "
            "design workshops, and knowledge transfer partnerships with local industry. A formal "
            "capacity building plan targets enhancement of research capability, pedagogical "
            "innovation, and institutional governance at partner sites."
        ),
        "IM07": (
            "The TNE partnership contributes to local skills development through industry-aligned "
            "programme design informed by local labour market analysis, professional certification "
            "pathways, continuing professional development offerings, and graduate attribute mapping "
            "to national skills frameworks. Employer satisfaction surveys indicate 89% rating "
            "graduates as well-prepared for the local workforce."
        ),
        "FN03": (
            "Tuition fees are set through a joint fee-setting process considering local market rates, "
            "competitor pricing, cost of delivery, and affordability indicators. Fees are benchmarked "
            "annually against comparable programmes in each market. A fee differential of 15-25% "
            "below home campus rates ensures accessibility. Instalment plans and early payment "
            "discounts are available. Fee levels are reviewed annually with a 3-year forward projection."
        ),
        "FN04": (
            "Investment in TNE infrastructure totals GBP 2.8M over the past 3 years, covering "
            "laboratory equipment upgrades, digital learning platform development, library resource "
            "expansion, and staff development. A 5-year capital investment plan allocates GBP 5M "
            "for facility enhancement. Revenue reinvestment targets commit 12% of net TNE income "
            "to quality enhancement and infrastructure. Technology investments prioritise digital "
            "assessment tools and learning analytics capabilities."
        ),
        "FN05": (
            "Financial risk assessment is integrated into the institutional risk management framework. "
            "Key financial risks include currency fluctuation, regulatory changes affecting fee caps, "
            "recruitment volatility, and partner financial stability. Mitigation strategies include "
            "currency hedging, diversification across markets, conservative recruitment forecasting, "
            "and annual partner financial audits. Scenario modelling covers best, expected, and "
            "worst-case enrolment projections with corresponding financial implications."
        ),
    }
    text = texts.get(code, (
        "Comprehensive policies and processes are in place to ensure quality and consistency "
        "across all TNE delivery sites. Regular review cycles incorporate feedback from "
        "stakeholders including students, staff, industry partners, and external bodies. "
        "Continuous improvement is embedded in the institutional culture with dedicated "
        "resources allocated to enhancement activities."
    ))
    return {"text": text}


def _gen_short_text(code: str) -> dict:
    texts = {
        "IM08": (
            "QS 5-Star rating for internationalisation; AACSB accreditation for business programmes; "
            "Times Higher Education Award for Outstanding International Strategy 2024"
        ),
    }
    return {"text": texts.get(code, "Multiple national and international recognitions received")}


def _gen_multi_year_gender(code: str, field_config: dict, year_idx: int) -> dict:
    """Generate 4-year trend data. For items with has_gender=False, skip gender breakdown."""
    has_gender = field_config.get("has_gender", True)
    base_year = 2021 + year_idx

    if code == "TL03":  # student enrolment
        base_m, base_f = 280, 250
        growth = 15
    elif code == "SE01":  # satisfaction %
        base_m, base_f = 76, 78
        growth = 1.5
    elif code == "IM02":  # publications (no gender)
        base_total = 12
        growth = 3
    elif code == "FN01":  # revenue (no gender)
        base_total = 1_800_000
        growth = 200_000
    else:
        base_m, base_f = 50, 50
        growth = 5

    years = []
    for i in range(4):
        yr = base_year + i
        if has_gender:
            m = int(base_m + i * growth + random.randint(-5, 5))
            f = int(base_f + i * growth + random.randint(-5, 5))
            o = random.randint(3, 12)
            u = random.randint(0, 4)
            years.append({"year": yr, "male": m, "female": f, "other": o, "unknown": u})
        else:
            if code == "FN01":
                total = int(base_total + i * growth + random.randint(-30_000, 30_000))
            else:
                total = int(base_total + i * growth + random.randint(-2, 2))
            years.append({"year": yr, "total": total})

    return {"years": years}


def _gen_yes_no(code: str) -> dict:
    follow_ups = {
        "TL13": (
            "Joint curriculum development involves collaborative programme design workshops held "
            "biannually, shared module specifications, and co-creation of assessment strategies. "
            "Partner faculty contribute to 35% of curriculum content, ensuring local relevance "
            "while maintaining UK academic standards."
        ),
        "TL14": (
            "External examiners are appointed for all programmes with TNE experience as a "
            "desirable criterion. Examiners visit partner sites annually and review assessment "
            "samples from all delivery locations. A dedicated moderation process ensures "
            "consistent standards across sites."
        ),
        "SE06": (
            "Structured placement programmes operate in partnership with 120+ employers. "
            "65% of students complete a placement or internship during their studies. "
            "A dedicated placements team at each site manages employer relationships and "
            "student matching. Virtual placements are available for distance learners."
        ),
        "SE09": (
            "A unified complaints and appeals process operates across all sites, with "
            "equivalent timelines and outcomes. Students can submit complaints in English "
            "or the local language. Independent review is available through the OIA or "
            "local equivalent. Resolution rates within 20 working days exceed 90%."
        ),
        "GV02": (
            "A Joint Academic Board meets quarterly with representation from both institutions "
            "including senior academic leaders, programme directors, student representatives, "
            "and quality assurance professionals. An executive sub-committee meets monthly "
            "to address operational matters."
        ),
        "GV04": (
            "Full compliance with UK Office for Students requirements and local regulatory "
            "bodies including MQA (Malaysia), ECA (Singapore), and CAA (UAE). Annual "
            "compliance audits conducted by external consultants. All regulatory conditions "
            "and recommendations tracked through a compliance management system."
        ),
        "GV09": (
            "Student representatives sit on the Joint Academic Board, programme committees, "
            "and the student experience committee. A TNE student council elected annually "
            "provides a collective student voice. Student feedback directly informs quality "
            "enhancement priorities."
        ),
        "IM06": (
            "Bidirectional mobility programmes enable 80 students per year to study at "
            "partner sites for one semester. Virtual mobility options reach an additional "
            "200 students through collaborative online international learning (COIL) modules. "
            "Staff mobility involves 25 academic exchanges per year."
        ),
        "FN07": (
            "A comprehensive scholarship programme awards GBP 450,000 annually across all "
            "TNE sites. Merit-based scholarships cover 25-50% of tuition. Need-based bursaries "
            "support 120 students per year. Additional industry-sponsored scholarships are "
            "available in STEM fields."
        ),
    }
    follow_up = follow_ups.get(code, "Comprehensive processes are in place and regularly reviewed.")
    return {"yes": True, "follow_up": follow_up}


def _gen_multi_select(code: str, field_config: dict) -> dict:
    options = field_config.get("options", [])
    # Select a good subset (60-90% of options)
    n = max(2, int(len(options) * random.uniform(0.6, 0.95)))
    selected = random.sample(options, min(n, len(options)))
    return {"selected": selected}


def _gen_salary_bands() -> dict:
    return {
        "bands": {
            "Professor": {"value": 95000, "currency": "GBP"},
            "Associate Professor": {"value": 75000, "currency": "GBP"},
            "Senior Lecturer": {"value": 62000, "currency": "GBP"},
            "Lecturer": {"value": 48000, "currency": "GBP"},
            "Teaching Assistant": {"value": 32000, "currency": "GBP"},
        }
    }


def generate_response_value(item: AssessmentItem, year_idx: int) -> dict | None:
    """Generate a realistic JSONB response value for an assessment item."""
    ft = item.field_type
    code = item.code
    fc = item.field_config or {}

    if ft == "numeric":
        return _gen_numeric(code, fc, year_idx)
    elif ft == "percentage":
        return _gen_percentage(code, year_idx)
    elif ft == "long_text":
        return _gen_long_text(code)
    elif ft == "short_text":
        return _gen_short_text(code)
    elif ft == "multi_year_gender":
        return _gen_multi_year_gender(code, fc, year_idx)
    elif ft == "yes_no_conditional":
        return _gen_yes_no(code)
    elif ft == "multi_select":
        return _gen_multi_select(code, fc)
    elif ft == "salary_bands":
        return _gen_salary_bands()
    elif ft == "auto_calculated":
        # Auto-calculated fields are computed from dependencies; store a plausible value
        return {"value": round(random.uniform(40, 85), 1)}
    elif ft == "file_upload":
        # Skip file uploads — they require actual S3 objects
        return None
    else:
        return {"text": "Sample response for field type: " + ft}


# ---------------------------------------------------------------------------
# AI analysis text generators
# ---------------------------------------------------------------------------
THEME_ANALYSES = {
    "teaching-learning": {
        "summary": "Teaching and learning provision demonstrates strong programme breadth and growing student numbers.",
        "strengths": [
            "Comprehensive range of programmes across multiple levels",
            "Strong staff development framework with mandatory CPD",
            "Effective peer observation and quality enhancement processes",
            "Growing student enrolment indicating market confidence",
        ],
        "areas_for_improvement": [
            "Proportion of doctoral-qualified staff could be increased",
            "Flying faculty model could be supplemented with more local expertise",
            "Student-staff ratio trending upward and needs monitoring",
        ],
    },
    "student-experience": {
        "summary": "Student experience shows consistent improvement with strong support services and good graduate outcomes.",
        "strengths": [
            "Multi-channel feedback system with high response rates",
            "Comprehensive student support services across all sites",
            "Strong graduate employment rates exceeding sector averages",
            "Active alumni network supporting current students",
        ],
        "areas_for_improvement": [
            "Parity of digital resources across sites needs attention",
            "Student satisfaction trends show variation between sites",
            "Safeguarding policy documentation needs updating",
        ],
    },
    "governance": {
        "summary": "Governance structures are well-established with robust quality assurance mechanisms.",
        "strengths": [
            "Joint governance board meets regularly with appropriate representation",
            "Quality assurance framework aligned with UK Quality Code",
            "Comprehensive risk management with quarterly reviews",
            "Strong academic integrity policies consistently applied",
        ],
        "areas_for_improvement": [
            "Student representation in governance could be enhanced",
            "Data sharing protocols need updating for new regulatory requirements",
            "Partner due diligence documentation requires refresh",
        ],
    },
    "impact": {
        "summary": "Impact and engagement activities show meaningful research collaboration and community benefit.",
        "strengths": [
            "Growing joint research output with partner institutions",
            "Strong industry engagement with 120+ employer partners",
            "Significant community outreach and skills development impact",
            "International mobility programmes well-established",
        ],
        "areas_for_improvement": [
            "Research collaboration could be expanded beyond current themes",
            "Knowledge exchange impact measurement needs strengthening",
            "Industry partnership diversity could be broadened",
        ],
    },
    "financial": {
        "summary": "Financial sustainability is strong with growing revenue and appropriate investment in infrastructure.",
        "strengths": [
            "Consistent revenue growth over 4-year period",
            "Competitive fee structure with affordability measures",
            "Substantial infrastructure investment plan",
            "Comprehensive scholarship programme",
        ],
        "areas_for_improvement": [
            "Currency risk management strategies need updating",
            "Revenue concentration risk in specific markets",
            "Staff salary competitiveness varies across sites",
        ],
    },
}


def _gen_executive_summary(overall_score: float, tenant_name: str, year: str) -> str:
    level = "excellent" if overall_score >= 80 else "good" if overall_score >= 65 else "satisfactory"
    return (
        f"This report presents the findings of the TNE Quality Assessment for {tenant_name} "
        f"for the academic year {year}. The assessment evaluated the institution's transnational "
        f"education activities across five core themes: Teaching & Learning, Student Experience & "
        f"Outcomes, Governance & Quality Assurance, Impact & Engagement, and Financial Sustainability.\n\n"
        f"The overall assessment score of {overall_score:.1f}/100 reflects an {level} standard of "
        f"TNE provision. The institution demonstrates particular strength in governance and quality "
        f"assurance frameworks, with well-established joint oversight mechanisms and regulatory "
        f"compliance. Student experience shows positive trends in satisfaction and graduate outcomes, "
        f"though some variation between delivery sites warrants attention.\n\n"
        f"Key recommendations focus on enhancing research collaboration output, strengthening digital "
        f"learning parity across sites, and updating financial risk management strategies to reflect "
        f"current market conditions. The institution's continued investment in TNE infrastructure "
        f"and staff development provides a strong foundation for sustainable growth."
    )


def _gen_recommendations(overall_score: float) -> list[dict]:
    recs = [
        {
            "priority": "high",
            "theme": "Teaching & Learning",
            "recommendation": "Develop a targeted recruitment strategy to increase the proportion of doctoral-qualified staff at partner sites to at least 50% within 3 years.",
            "timeline": "12-18 months",
        },
        {
            "priority": "high",
            "theme": "Student Experience",
            "recommendation": "Implement a unified digital learning platform audit to ensure resource parity across all delivery sites.",
            "timeline": "6-9 months",
        },
        {
            "priority": "medium",
            "theme": "Governance",
            "recommendation": "Update data sharing protocols to comply with emerging data protection regulations in all partner jurisdictions.",
            "timeline": "9-12 months",
        },
        {
            "priority": "medium",
            "theme": "Impact & Engagement",
            "recommendation": "Establish a formal impact measurement framework for knowledge exchange and community engagement activities.",
            "timeline": "12 months",
        },
        {
            "priority": "low",
            "theme": "Financial Sustainability",
            "recommendation": "Diversify revenue sources by expanding professional development and executive education offerings at partner sites.",
            "timeline": "18-24 months",
        },
    ]
    return recs


# ---------------------------------------------------------------------------
# Assessment status progression over academic years
# ---------------------------------------------------------------------------
# Older years → fully scored/reported; current year → in progress
STATUS_BY_YEAR_IDX = {
    0: "report_generated",  # 2022-23 — complete
    1: "scored",            # 2023-24 — scored but not yet reported
    2: "under_review",      # 2024-25 — submitted and under review
    3: "draft",             # 2025-26 — in progress
}


# ---------------------------------------------------------------------------
# Reset
# ---------------------------------------------------------------------------
async def reset_demo_data(session):
    """Remove all demo seed data."""
    result = await session.execute(
        select(Tenant).where(Tenant.slug.like("demo-%"))
    )
    tenants = result.scalars().all()

    for tenant in tenants:
        # Delete in dependency order
        # Get assessments for this tenant
        assessments = await session.execute(
            select(Assessment).where(Assessment.tenant_id == tenant.id)
        )
        for assessment in assessments.scalars().all():
            await session.execute(
                delete(AssessmentResponse).where(AssessmentResponse.assessment_id == assessment.id)
            )
            await session.execute(
                delete(ThemeScore).where(ThemeScore.assessment_id == assessment.id)
            )
            await session.execute(
                delete(AssessmentReport).where(AssessmentReport.assessment_id == assessment.id)
            )

        await session.execute(delete(Assessment).where(Assessment.tenant_id == tenant.id))
        await session.execute(delete(PartnerInstitution).where(PartnerInstitution.tenant_id == tenant.id))
        await session.execute(delete(User).where(User.tenant_id == tenant.id))
        await session.execute(delete(Tenant).where(Tenant.id == tenant.id))

    # Delete benchmark snapshots for demo years
    for year in ACADEMIC_YEARS:
        await session.execute(
            delete(BenchmarkSnapshot).where(BenchmarkSnapshot.academic_year == year)
        )

    await session.commit()
    print("Demo data reset complete.")


# ---------------------------------------------------------------------------
# Main seed
# ---------------------------------------------------------------------------
async def seed():
    reset = "--reset" in sys.argv

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session_factory() as session:
        if reset:
            await reset_demo_data(session)

        # Check if data exists
        result = await session.execute(
            select(Tenant).where(Tenant.slug == TENANTS[0]["slug"])
        )
        if result.scalar_one_or_none():
            print("Demo data already exists. Use --reset to recreate.")
            return

        # Get template
        template_result = await session.execute(
            select(AssessmentTemplate).where(AssessmentTemplate.is_active.is_(True))
        )
        template = template_result.scalar_one_or_none()
        if not template:
            print("ERROR: No active assessment template found. Run seed_assessment_template first.")
            return

        # Load all items grouped by theme
        items_result = await session.execute(
            select(AssessmentItem).join(AssessmentTheme).where(
                AssessmentTheme.template_id == template.id
            )
        )
        all_items = items_result.scalars().all()

        # Load themes
        themes_result = await session.execute(
            select(AssessmentTheme).where(AssessmentTheme.template_id == template.id)
        )
        all_themes = themes_result.scalars().all()
        theme_by_id = {t.id: t for t in all_themes}

        now = datetime.now(timezone.utc)

        # ---------------------------------------------------------------
        # 1. Create tenants, users, and partners
        # ---------------------------------------------------------------
        tenant_map: dict[str, Tenant] = {}
        user_map: dict[str, list[User]] = {}

        for t_data in TENANTS:
            tenant = Tenant(
                name=t_data["name"],
                slug=t_data["slug"],
                country=t_data["country"],
                institution_type=t_data["institution_type"],
                subscription_tier=t_data["subscription_tier"],
            )
            session.add(tenant)
            await session.flush()
            tenant_map[t_data["slug"]] = tenant
            print(f"  Created tenant: {tenant.name}")

            # Users
            users = []
            for u_data in USERS_BY_TENANT.get(t_data["slug"], []):
                user = User(
                    tenant_id=tenant.id,
                    email=u_data["email"],
                    password_hash=pwd_context.hash(u_data["password"]),
                    full_name=u_data["full_name"],
                    role=u_data["role"],
                    is_active=True,
                    email_verified=True,
                    email_verified_at=now - timedelta(days=random.randint(30, 365)),
                    last_login=now - timedelta(hours=random.randint(1, 72)),
                )
                session.add(user)
                users.append(user)

            # Platform admin attached to first tenant
            if t_data["slug"] == TENANTS[0]["slug"]:
                pa = User(
                    tenant_id=tenant.id,
                    email=PLATFORM_ADMIN["email"],
                    password_hash=pwd_context.hash(PLATFORM_ADMIN["password"]),
                    full_name=PLATFORM_ADMIN["full_name"],
                    role=PLATFORM_ADMIN["role"],
                    is_active=True,
                    email_verified=True,
                    email_verified_at=now - timedelta(days=200),
                    last_login=now - timedelta(hours=2),
                )
                session.add(pa)
                users.append(pa)

            await session.flush()
            user_map[t_data["slug"]] = users

            # Partners
            for idx, p_data in enumerate(PARTNERS_BY_TENANT.get(t_data["slug"], []), start=1):
                partner = PartnerInstitution(
                    tenant_id=tenant.id,
                    name=p_data["name"],
                    country=p_data["country"],
                    position=idx,
                )
                session.add(partner)

        await session.flush()

        # ---------------------------------------------------------------
        # 2. Create assessments with responses, scores, and reports
        # ---------------------------------------------------------------
        total_assessments = 0
        total_responses = 0

        for slug, tenant in tenant_map.items():
            users = user_map[slug]
            admin_user = next((u for u in users if u.role == "tenant_admin"), users[0])
            assessor = next((u for u in users if u.role == "assessor"), admin_user)
            reviewer = next((u for u in users if u.role == "reviewer"), None)

            for year_idx, year in enumerate(ACADEMIC_YEARS):
                status = STATUS_BY_YEAR_IDX[year_idx]

                # Calculate timestamps based on academic year
                base_date = now - timedelta(days=(3 - year_idx) * 365)
                created_at = base_date - timedelta(days=random.randint(30, 90))
                submitted_at = base_date - timedelta(days=random.randint(5, 25)) if status != "draft" else None

                assessment = Assessment(
                    tenant_id=tenant.id,
                    template_id=template.id,
                    academic_year=year,
                    status=status,
                    submitted_at=submitted_at,
                    submitted_by=assessor.id if status != "draft" else None,
                    reviewed_by=reviewer.id if reviewer and status in ("under_review", "scored", "report_generated") else None,
                )
                session.add(assessment)
                await session.flush()
                total_assessments += 1

                # --- Responses ---
                # Draft assessments get partial responses; others get full
                items_to_fill = all_items if status != "draft" else random.sample(list(all_items), k=int(len(all_items) * 0.4))

                for item in items_to_fill:
                    value = generate_response_value(item, year_idx)
                    if value is None:
                        continue  # skip file_upload

                    # Determine AI score for scored/reported assessments
                    ai_score = None
                    ai_feedback = None
                    scored_at = None

                    if status in ("scored", "report_generated"):
                        ai_score = round(random.uniform(55, 98), 1)
                        ai_feedback = f"This response demonstrates a solid understanding of {item.label.lower()}. "
                        if ai_score >= 80:
                            ai_feedback += "The evidence provided is comprehensive and well-articulated."
                        elif ai_score >= 65:
                            ai_feedback += "Additional detail on implementation outcomes would strengthen the response."
                        else:
                            ai_feedback += "Consider providing more specific evidence and measurable outcomes."
                        scored_at = submitted_at + timedelta(hours=random.randint(2, 48)) if submitted_at else None

                    response = AssessmentResponse(
                        assessment_id=assessment.id,
                        item_id=item.id,
                        partner_id=None,
                        value=value,
                        ai_score=ai_score,
                        ai_feedback=ai_feedback,
                        scored_at=scored_at,
                    )
                    session.add(response)
                    total_responses += 1

                # --- Theme Scores (for scored + report_generated) ---
                if status in ("scored", "report_generated"):
                    overall_weighted = 0.0

                    for theme in all_themes:
                        norm_score = round(random.uniform(60, 95), 1)
                        weighted = round(norm_score * theme.weight, 2)
                        overall_weighted += weighted

                        analysis_data = THEME_ANALYSES.get(theme.slug, {})
                        analysis_text = (
                            f"{analysis_data.get('summary', 'Performance in this area is satisfactory.')}\n\n"
                            f"Strengths:\n"
                            + "\n".join(f"- {s}" for s in analysis_data.get("strengths", ["Good overall performance"]))
                            + f"\n\nAreas for improvement:\n"
                            + "\n".join(f"- {a}" for a in analysis_data.get("areas_for_improvement", ["Continue to enhance"]))
                        )

                        theme_score = ThemeScore(
                            assessment_id=assessment.id,
                            theme_id=theme.id,
                            normalised_score=norm_score,
                            weighted_score=weighted,
                            ai_analysis=analysis_text,
                        )
                        session.add(theme_score)

                    # Update overall score on assessment
                    assessment.overall_score = round(overall_weighted, 1)

                # --- Report (for report_generated only) ---
                if status == "report_generated":
                    overall = assessment.overall_score or 75.0
                    report = AssessmentReport(
                        assessment_id=assessment.id,
                        version=1,
                        executive_summary=_gen_executive_summary(overall, tenant.name, year),
                        theme_analyses={
                            theme.slug: THEME_ANALYSES.get(theme.slug, {"summary": "Analysis pending"})
                            for theme in all_themes
                        },
                        improvement_recommendations=_gen_recommendations(overall),
                        generated_by="claude-opus-4-6",
                    )
                    session.add(report)

                print(f"    {tenant.name}: {year} → {status}" + (f" (score: {assessment.overall_score})" if assessment.overall_score else ""))

        # ---------------------------------------------------------------
        # 3. Benchmark snapshots
        # ---------------------------------------------------------------
        benchmark_count = 0
        metric_names = ["overall_score", "teaching_learning", "student_experience",
                        "governance", "impact", "financial"]
        countries = ["United Kingdom", "Australia", "United Arab Emirates", "Singapore", "Global"]

        for year in ACADEMIC_YEARS:
            for country in countries:
                for theme_idx, theme in enumerate(all_themes):
                    metric = metric_names[theme_idx + 1] if theme_idx < 5 else "overall_score"
                    base_p50 = random.uniform(62, 78)

                    snapshot = BenchmarkSnapshot(
                        academic_year=year,
                        country=country,
                        theme_id=theme.id,
                        metric_name=metric,
                        percentile_10=round(base_p50 - random.uniform(20, 30), 1),
                        percentile_25=round(base_p50 - random.uniform(10, 18), 1),
                        percentile_50=round(base_p50, 1),
                        percentile_75=round(base_p50 + random.uniform(8, 15), 1),
                        percentile_90=round(base_p50 + random.uniform(16, 25), 1),
                        sample_size=random.randint(15, 85),
                    )
                    session.add(snapshot)
                    benchmark_count += 1

                # Overall score benchmark
                base_p50 = random.uniform(65, 78)
                snapshot = BenchmarkSnapshot(
                    academic_year=year,
                    country=country,
                    theme_id=None,
                    metric_name="overall_score",
                    percentile_10=round(base_p50 - random.uniform(22, 32), 1),
                    percentile_25=round(base_p50 - random.uniform(12, 20), 1),
                    percentile_50=round(base_p50, 1),
                    percentile_75=round(base_p50 + random.uniform(10, 16), 1),
                    percentile_90=round(base_p50 + random.uniform(18, 26), 1),
                    sample_size=random.randint(25, 120),
                )
                session.add(snapshot)
                benchmark_count += 1

        await session.commit()

        # ---------------------------------------------------------------
        # Summary
        # ---------------------------------------------------------------
        print()
        print("=" * 70)
        print("  Realistic Test Data Seeded Successfully")
        print("=" * 70)
        print(f"  Tenants        : {len(TENANTS)}")
        print(f"  Users          : {sum(len(v) for v in USERS_BY_TENANT.values()) + 1}")
        print(f"  Partners       : {sum(len(v) for v in PARTNERS_BY_TENANT.values())}")
        print(f"  Assessments    : {total_assessments} (across {len(ACADEMIC_YEARS)} academic years)")
        print(f"  Responses      : {total_responses}")
        print(f"  Benchmarks     : {benchmark_count}")
        print()
        print("  Assessment statuses:")
        for idx, year in enumerate(ACADEMIC_YEARS):
            print(f"    {year}: {STATUS_BY_YEAR_IDX[idx]}")
        print()
        print("  Login credentials (all verified, password: DemoPass123!):")
        for slug, users_list in USERS_BY_TENANT.items():
            tenant_name = next(t["name"] for t in TENANTS if t["slug"] == slug)
            print(f"\n  {tenant_name}:")
            for u in users_list:
                print(f"    {u['role']:20s} {u['email']}")
        print(f"\n  Platform Admin:")
        print(f"    {'platform_admin':20s} {PLATFORM_ADMIN['email']}  (password: {PLATFORM_ADMIN['password']})")
        print()
        print("=" * 70)


if __name__ == "__main__":
    asyncio.run(seed())
