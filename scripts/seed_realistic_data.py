"""Seed the database with realistic test data across 14 tenants.

Creates:
- 14 tenants across 10 countries with varying quality_factor (0.35–0.95)
- ~75 users with culturally appropriate names across all roles
- ~55 partner institutions (3–5 per tenant)
- Assessments across 4 academic years (2022-23 through 2025-26)
- Full responses for all 52 items, quality-scaled by tenant quality_factor
- AI scores and theme scores calibrated to quality_factor
- Assessment reports with tiered executive summaries and recommendations
- Benchmark snapshots across 12 countries

Run: python -m scripts.seed_realistic_data
Reset: python -m scripts.seed_realistic_data --reset
"""

import asyncio
import random
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

from passlib.context import CryptContext

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

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
from sqlalchemy import delete, select  # noqa: E402

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
random.seed(42)  # reproducible data

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
DEMO_SLUG_PREFIX = "demo-"
ACADEMIC_YEARS = ["2022-23", "2023-24", "2024-25", "2025-26"]

PASSWORD = "DemoPass123!"

TENANTS = [
    # --- Enterprise tier ---
    {
        "name": "Imperial College London",
        "slug": "demo-imperial",
        "country": "United Kingdom",
        "institution_type": "Research University",
        "subscription_tier": "enterprise",
        "quality_factor": 0.92,
    },
    {
        "name": "Nanyang Technological University",
        "slug": "demo-nanyang",
        "country": "Singapore",
        "institution_type": "Research University",
        "subscription_tier": "enterprise",
        "quality_factor": 0.90,
    },
    {
        "name": "ETH Zurich Global",
        "slug": "demo-ethz",
        "country": "Switzerland",
        "institution_type": "Research University",
        "subscription_tier": "enterprise",
        "quality_factor": 0.95,
    },
    # --- Professional tier ---
    {
        "name": "University of Melbourne",
        "slug": "demo-melbourne",
        "country": "Australia",
        "institution_type": "Research University",
        "subscription_tier": "professional",
        "quality_factor": 0.88,
    },
    {
        "name": "University of Wollongong",
        "slug": "demo-wollongong",
        "country": "Australia",
        "institution_type": "University",
        "subscription_tier": "professional",
        "quality_factor": 0.72,
    },
    {
        "name": "Khalifa University",
        "slug": "demo-khalifa",
        "country": "United Arab Emirates",
        "institution_type": "University",
        "subscription_tier": "professional",
        "quality_factor": 0.68,
    },
    {
        "name": "Dublin City University",
        "slug": "demo-dcu",
        "country": "Ireland",
        "institution_type": "University",
        "subscription_tier": "professional",
        "quality_factor": 0.75,
    },
    {
        "name": "University of Nottingham Malaysia",
        "slug": "demo-nottingham-my",
        "country": "Malaysia",
        "institution_type": "University",
        "subscription_tier": "professional",
        "quality_factor": 0.70,
    },
    # --- Basic tier ---
    {
        "name": "Manipal Academy of Higher Education",
        "slug": "demo-manipal",
        "country": "India",
        "institution_type": "University",
        "subscription_tier": "basic",
        "quality_factor": 0.65,
    },
    {
        "name": "Amity Global Institute",
        "slug": "demo-amity",
        "country": "India",
        "institution_type": "College",
        "subscription_tier": "basic",
        "quality_factor": 0.50,
    },
    {
        "name": "INTI International University",
        "slug": "demo-inti",
        "country": "Malaysia",
        "institution_type": "University",
        "subscription_tier": "basic",
        "quality_factor": 0.48,
    },
    # --- Free tier ---
    {
        "name": "Gulf College Oman",
        "slug": "demo-gulf-oman",
        "country": "Oman",
        "institution_type": "College",
        "subscription_tier": "free",
        "quality_factor": 0.38,
    },
    {
        "name": "Botswana Accountancy College",
        "slug": "demo-bac",
        "country": "Botswana",
        "institution_type": "Polytechnic",
        "subscription_tier": "free",
        "quality_factor": 0.42,
    },
    {
        "name": "Pacific Polytechnic Fiji",
        "slug": "demo-pacific-fiji",
        "country": "Fiji",
        "institution_type": "Polytechnic",
        "subscription_tier": "free",
        "quality_factor": 0.35,
    },
]

# Map slug → quality_factor for quick lookup
QF_BY_SLUG = {t["slug"]: t["quality_factor"] for t in TENANTS}

# ---------------------------------------------------------------------------
# Partners: 3–5 per tenant (~55 total)
# ---------------------------------------------------------------------------
PARTNERS_BY_TENANT: dict[str, list[dict]] = {
    "demo-imperial": [
        {"name": "Singapore Institute of Technology", "country": "Singapore"},
        {"name": "HKUST", "country": "Hong Kong"},
        {"name": "University of Malaya", "country": "Malaysia"},
        {"name": "Tsinghua University", "country": "China"},
        {"name": "Indian Institute of Science", "country": "India"},
    ],
    "demo-nanyang": [
        {"name": "TU Eindhoven", "country": "Netherlands"},
        {"name": "Peking University", "country": "China"},
        {"name": "IIT Bombay", "country": "India"},
        {"name": "KAIST", "country": "South Korea"},
    ],
    "demo-ethz": [
        {"name": "National University of Singapore", "country": "Singapore"},
        {"name": "Technical University of Munich", "country": "Germany"},
        {"name": "EPFL Middle East", "country": "United Arab Emirates"},
        {"name": "University of Tokyo", "country": "Japan"},
        {"name": "Technion Israel", "country": "Israel"},
    ],
    "demo-melbourne": [
        {"name": "Universitas Indonesia", "country": "Indonesia"},
        {"name": "Vietnam National University", "country": "Vietnam"},
        {"name": "Chulalongkorn University", "country": "Thailand"},
        {"name": "University of Auckland", "country": "New Zealand"},
    ],
    "demo-wollongong": [
        {"name": "SIMGE Singapore", "country": "Singapore"},
        {"name": "University of Wollongong Dubai", "country": "United Arab Emirates"},
        {"name": "CCCU Hong Kong", "country": "Hong Kong"},
    ],
    "demo-khalifa": [
        {"name": "MIT Partnership Programme", "country": "United States"},
        {"name": "Sorbonne Abu Dhabi", "country": "United Arab Emirates"},
        {"name": "Rochester Institute of Technology Dubai", "country": "United Arab Emirates"},
    ],
    "demo-dcu": [
        {"name": "Griffith College Dublin", "country": "Ireland"},
        {"name": "DCU Malaysia Campus", "country": "Malaysia"},
        {"name": "National College of Ireland", "country": "Ireland"},
        {"name": "Letterkenny IT", "country": "Ireland"},
    ],
    "demo-nottingham-my": [
        {"name": "University of Nottingham Ningbo", "country": "China"},
        {"name": "SEGi University", "country": "Malaysia"},
        {"name": "Sunway University", "country": "Malaysia"},
        {"name": "UCSI University", "country": "Malaysia"},
    ],
    "demo-manipal": [
        {"name": "Manipal International University", "country": "Malaysia"},
        {"name": "Manipal Academy Dubai", "country": "United Arab Emirates"},
        {"name": "American University of Antigua", "country": "Antigua and Barbuda"},
    ],
    "demo-amity": [
        {"name": "Amity University Dubai", "country": "United Arab Emirates"},
        {"name": "Amity Singapore", "country": "Singapore"},
        {"name": "Amity University London", "country": "United Kingdom"},
    ],
    "demo-inti": [
        {"name": "Southern New Hampshire University", "country": "United States"},
        {"name": "University of Hertfordshire", "country": "United Kingdom"},
        {"name": "Coventry University", "country": "United Kingdom"},
    ],
    "demo-gulf-oman": [
        {"name": "Staffordshire University", "country": "United Kingdom"},
        {"name": "University of Hull", "country": "United Kingdom"},
        {"name": "Cardiff Metropolitan University", "country": "United Kingdom"},
    ],
    "demo-bac": [
        {"name": "University of Bolton", "country": "United Kingdom"},
        {"name": "Oxford Brookes University", "country": "United Kingdom"},
        {"name": "Botswana Open University", "country": "Botswana"},
    ],
    "demo-pacific-fiji": [
        {"name": "University of the South Pacific", "country": "Fiji"},
        {"name": "University of Newcastle Australia", "country": "Australia"},
        {"name": "Fiji National University", "country": "Fiji"},
    ],
}

# ---------------------------------------------------------------------------
# Users: enterprise 7, professional 5, basic 4, free 3 per tenant (~75 total)
# ---------------------------------------------------------------------------
USERS_BY_TENANT: dict[str, list[dict]] = {
    # === Enterprise tenants (7 each) ===
    "demo-imperial": [
        {"email": "s.johnson@imperial.ac.uk", "full_name": "Sarah Johnson", "role": "tenant_admin"},
        {"email": "j.wilson@imperial.ac.uk", "full_name": "James Wilson", "role": "assessor"},
        {"email": "e.chen@imperial.ac.uk", "full_name": "Emily Chen", "role": "assessor"},
        {"email": "d.okafor@imperial.ac.uk", "full_name": "David Okafor", "role": "assessor"},
        {"email": "m.patel@imperial.ac.uk", "full_name": "Meera Patel", "role": "reviewer"},
        {
            "email": "t.hughes@imperial.ac.uk",
            "full_name": "Thomas Hughes",
            "role": "institution_user",
        },
        {
            "email": "r.baker@imperial.ac.uk",
            "full_name": "Rebecca Baker",
            "role": "institution_user",
        },
    ],
    "demo-nanyang": [
        {"email": "w.tan@ntu.edu.sg", "full_name": "Wei Lin Tan", "role": "tenant_admin"},
        {"email": "h.lee@ntu.edu.sg", "full_name": "Hyun-Ji Lee", "role": "assessor"},
        {"email": "s.kumar@ntu.edu.sg", "full_name": "Sanjay Kumar", "role": "assessor"},
        {"email": "m.lim@ntu.edu.sg", "full_name": "Ming Hui Lim", "role": "assessor"},
        {"email": "c.wong@ntu.edu.sg", "full_name": "Christine Wong", "role": "reviewer"},
        {"email": "j.ng@ntu.edu.sg", "full_name": "Jason Ng", "role": "institution_user"},
        {"email": "a.teo@ntu.edu.sg", "full_name": "Amanda Teo", "role": "institution_user"},
    ],
    "demo-ethz": [
        {"email": "l.muller@ethz.ch", "full_name": "Lukas Mueller", "role": "tenant_admin"},
        {"email": "s.weber@ethz.ch", "full_name": "Sophie Weber", "role": "assessor"},
        {"email": "m.fischer@ethz.ch", "full_name": "Marco Fischer", "role": "assessor"},
        {"email": "a.brunner@ethz.ch", "full_name": "Anna Brunner", "role": "assessor"},
        {"email": "t.huber@ethz.ch", "full_name": "Thomas Huber", "role": "reviewer"},
        {"email": "k.steiner@ethz.ch", "full_name": "Katrin Steiner", "role": "institution_user"},
        {
            "email": "p.zimmermann@ethz.ch",
            "full_name": "Peter Zimmermann",
            "role": "institution_user",
        },
    ],
    # === Professional tenants (5 each) ===
    "demo-melbourne": [
        {
            "email": "a.thompson@unimelb.edu.au",
            "full_name": "Andrew Thompson",
            "role": "tenant_admin",
        },
        {"email": "l.zhang@unimelb.edu.au", "full_name": "Lisa Zhang", "role": "assessor"},
        {"email": "b.nguyen@unimelb.edu.au", "full_name": "Binh Nguyen", "role": "assessor"},
        {"email": "k.smith@unimelb.edu.au", "full_name": "Karen Smith", "role": "reviewer"},
        {"email": "d.jones@unimelb.edu.au", "full_name": "David Jones", "role": "institution_user"},
    ],
    "demo-wollongong": [
        {"email": "a.murray@uow.edu.au", "full_name": "Andrew Murray", "role": "tenant_admin"},
        {"email": "l.zhao@uow.edu.au", "full_name": "Lisa Zhao", "role": "assessor"},
        {"email": "r.kapoor@uow.edu.au", "full_name": "Ravi Kapoor", "role": "assessor"},
        {"email": "j.brown@uow.edu.au", "full_name": "Jennifer Brown", "role": "reviewer"},
        {"email": "p.lee@uow.edu.au", "full_name": "Peter Lee", "role": "institution_user"},
    ],
    "demo-khalifa": [
        {"email": "a.rashid@ku.ac.ae", "full_name": "Ahmed Al-Rashid", "role": "tenant_admin"},
        {"email": "f.hassan@ku.ac.ae", "full_name": "Fatima Hassan", "role": "assessor"},
        {"email": "y.almani@ku.ac.ae", "full_name": "Youssef Al-Mani", "role": "assessor"},
        {"email": "o.khan@ku.ac.ae", "full_name": "Omar Khan", "role": "reviewer"},
        {"email": "n.sheikh@ku.ac.ae", "full_name": "Nadia Sheikh", "role": "institution_user"},
    ],
    "demo-dcu": [
        {"email": "c.murphy@dcu.ie", "full_name": "Ciaran Murphy", "role": "tenant_admin"},
        {"email": "s.obrien@dcu.ie", "full_name": "Siobhan O'Brien", "role": "assessor"},
        {"email": "p.kelly@dcu.ie", "full_name": "Patrick Kelly", "role": "assessor"},
        {"email": "a.walsh@dcu.ie", "full_name": "Aoife Walsh", "role": "reviewer"},
        {"email": "d.ryan@dcu.ie", "full_name": "Declan Ryan", "role": "institution_user"},
    ],
    "demo-nottingham-my": [
        {"email": "t.ahmad@nottingham.edu.my", "full_name": "Tengku Ahmad", "role": "tenant_admin"},
        {"email": "n.ibrahim@nottingham.edu.my", "full_name": "Nurul Ibrahim", "role": "assessor"},
        {"email": "r.singh@nottingham.edu.my", "full_name": "Rajinder Singh", "role": "assessor"},
        {"email": "l.chong@nottingham.edu.my", "full_name": "Lee Wei Chong", "role": "reviewer"},
        {
            "email": "s.yusof@nottingham.edu.my",
            "full_name": "Siti Yusof",
            "role": "institution_user",
        },
    ],
    # === Basic tenants (4 each) ===
    "demo-manipal": [
        {"email": "v.sharma@manipal.edu", "full_name": "Vikram Sharma", "role": "tenant_admin"},
        {"email": "p.reddy@manipal.edu", "full_name": "Priya Reddy", "role": "assessor"},
        {"email": "a.nair@manipal.edu", "full_name": "Anand Nair", "role": "reviewer"},
        {"email": "s.gupta@manipal.edu", "full_name": "Sunita Gupta", "role": "institution_user"},
    ],
    "demo-amity": [
        {"email": "r.mehta@amity.edu", "full_name": "Rajesh Mehta", "role": "tenant_admin"},
        {"email": "d.banerjee@amity.edu", "full_name": "Debika Banerjee", "role": "assessor"},
        {"email": "k.iyer@amity.edu", "full_name": "Karthik Iyer", "role": "reviewer"},
        {
            "email": "m.chopra@amity.edu",
            "full_name": "Meenakshi Chopra",
            "role": "institution_user",
        },
    ],
    "demo-inti": [
        {"email": "h.tan@inti.edu.my", "full_name": "Hui Ling Tan", "role": "tenant_admin"},
        {"email": "a.razak@inti.edu.my", "full_name": "Abdul Razak", "role": "assessor"},
        {"email": "j.ong@inti.edu.my", "full_name": "Jennifer Ong", "role": "reviewer"},
        {
            "email": "m.abdullah@inti.edu.my",
            "full_name": "Mohd Abdullah",
            "role": "institution_user",
        },
    ],
    # === Free tenants (3 each) ===
    "demo-gulf-oman": [
        {
            "email": "s.albalushi@gulfcollege.edu.om",
            "full_name": "Said Al-Balushi",
            "role": "tenant_admin",
        },
        {
            "email": "m.alsaidi@gulfcollege.edu.om",
            "full_name": "Mariam Al-Saidi",
            "role": "assessor",
        },
        {
            "email": "h.aljabri@gulfcollege.edu.om",
            "full_name": "Hamad Al-Jabri",
            "role": "reviewer",
        },
    ],
    "demo-bac": [
        {"email": "t.moyo@bac.ac.bw", "full_name": "Thabo Moyo", "role": "tenant_admin"},
        {"email": "k.molefe@bac.ac.bw", "full_name": "Kelebogile Molefe", "role": "assessor"},
        {"email": "b.seretse@bac.ac.bw", "full_name": "Boitumelo Seretse", "role": "reviewer"},
    ],
    "demo-pacific-fiji": [
        {"email": "s.nand@pacpoly.ac.fj", "full_name": "Suresh Nand", "role": "tenant_admin"},
        {"email": "m.tuivaga@pacpoly.ac.fj", "full_name": "Mere Tuivaga", "role": "assessor"},
        {"email": "r.prasad@pacpoly.ac.fj", "full_name": "Roshni Prasad", "role": "reviewer"},
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
# Theme profile: institution type → relative theme strength offsets
# Research unis: stronger at impact, weaker at financial
# Polytechnics: stronger at financial, weaker at research impact
# ---------------------------------------------------------------------------
THEME_PROFILE: dict[str, dict[str, float]] = {
    "Research University": {
        "teaching-learning": 0.02,
        "student-experience": 0.01,
        "governance": 0.0,
        "impact": 0.04,
        "financial": -0.03,
    },
    "University": {
        "teaching-learning": 0.0,
        "student-experience": 0.01,
        "governance": 0.02,
        "impact": 0.0,
        "financial": 0.0,
    },
    "College": {
        "teaching-learning": -0.02,
        "student-experience": 0.0,
        "governance": -0.01,
        "impact": -0.03,
        "financial": 0.03,
    },
    "Polytechnic": {
        "teaching-learning": -0.01,
        "student-experience": 0.02,
        "governance": -0.02,
        "impact": -0.04,
        "financial": 0.05,
    },
}


# ---------------------------------------------------------------------------
# Status profiles by subscription tier
# ---------------------------------------------------------------------------
# Enterprise/professional: all 4 years
# Basic: 3 years (skip 2022-23)
# Free: 2 years (skip 2022-23 and 2023-24)
STATUS_BY_YEAR_IDX = {
    0: "report_generated",  # 2022-23
    1: "scored",  # 2023-24
    2: "under_review",  # 2024-25
    3: "draft",  # 2025-26
}

YEARS_BY_TIER = {
    "enterprise": [0, 1, 2, 3],
    "professional": [0, 1, 2, 3],
    "basic": [1, 2, 3],  # skip 2022-23
    "free": [2, 3],  # skip 2022-23 and 2023-24
}


# ---------------------------------------------------------------------------
# Response generators by field type — quality-factor aware
# ---------------------------------------------------------------------------
def _gen_numeric(code: str, field_config: dict, year_idx: int, qf: float) -> dict:
    """Generate a numeric response scaled by quality_factor."""
    base_values = {
        "TL01": 8,
        "TL06": 35,
        "TL07": 22,
        "TL09": 5,
    }
    base = base_values.get(code, 15)
    # Scale by qf: high-quality institutions have more programmes/staff
    scaled_base = base * (0.5 + qf * 0.8)
    value = scaled_base + year_idx * random.randint(1, 3) + random.randint(-2, 2)
    return {"value": max(1, int(value))}


def _gen_percentage(code: str, year_idx: int, qf: float) -> dict:
    base_values = {
        "TL04": 82,
        "SE04": 72,
        "SE05": 85,
        "FN02": 8,
    }
    base = base_values.get(code, 70)
    # Shift base by qf: high qf pushes towards max, low qf pulls down
    qf_shift = (qf - 0.65) * 20  # qf=0.95 → +6, qf=0.35 → -6
    value = base + qf_shift + year_idx * random.uniform(0.5, 2.0) + random.uniform(-3, 3)
    return {"value": round(min(100, max(0, value)), 1)}


# Three tiers of long text responses
_LONG_TEXT_HIGH: dict[str, str] = {
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

_LONG_TEXT_MID: dict[str, str] = {
    "TL05": (
        "Programme reviews follow a regular cycle. Review panels include external and internal "
        "members. Curriculum changes are discussed at the academic board and updates are implemented "
        "with partner input. Recent changes include new elective modules."
    ),
    "TL12": (
        "Staff complete an induction covering TNE delivery. CPD is encouraged with annual targets. "
        "Peer mentoring is available for new staff. Workshops are offered each semester."
    ),
    "TL15": (
        "Peer observation takes place each semester. Staff are paired for observations with follow-up "
        "discussions. Feedback is used formatively to improve teaching practice."
    ),
    "SE02": (
        "Student feedback is gathered via end-of-module surveys and a student-staff committee. "
        "Results are reviewed by programme teams and shared with the academic board. Action plans "
        "are created for areas below benchmark."
    ),
    "SE07": (
        "An alumni network exists with regular events and newsletters. Graduate destination surveys "
        "are conducted annually. Alumni contribute to career talks and mentoring."
    ),
    "SE08": (
        "Efforts are made to ensure parity through shared VLE content, common assessments, and "
        "comparable library access. Satisfaction surveys are compared across sites annually."
    ),
    "SE10": (
        "Teaching facilities at partner sites include lecture rooms, computer labs, and library access. "
        "Equipment audits are conducted periodically."
    ),
    "SE11": (
        "A VLE is provided for all students with lecture recordings and online resources. "
        "IT support is available during business hours."
    ),
    "GV03": (
        "Quality assurance follows institutional procedures and local regulatory requirements. "
        "Programme monitoring occurs annually with external examiner input."
    ),
    "GV05": (
        "A risk register is maintained and reviewed periodically. Key risks are reported to "
        "the management committee. Mitigation plans are documented."
    ),
    "GV06": (
        "Data sharing follows agreed protocols. Student data is transmitted securely. "
        "Regular reports are shared between partner institutions."
    ),
    "GV08": (
        "Annual monitoring reports are submitted and reviewed. Site visits occur periodically "
        "with virtual check-ins between visits."
    ),
    "GV10": (
        "Academic integrity policies are applied across sites. Plagiarism detection software "
        "is used for all submissions. Training is provided to staff and students."
    ),
    "IM01": (
        "Some joint research projects exist between partner staff. A small research fund "
        "supports collaborative work. Publications are tracked informally."
    ),
    "IM03": (
        "Industry advisory input is sought for programme development. Some industry placements "
        "are available. Guest lectures from industry are organised each semester."
    ),
    "IM04": (
        "Community engagement includes occasional outreach events and partnerships with local "
        "organisations. Student volunteering is encouraged."
    ),
    "IM05": (
        "Knowledge exchange occurs through staff visits and shared curriculum materials. "
        "Some capacity building workshops have been delivered."
    ),
    "IM07": (
        "Programmes are designed with some reference to local labour market needs. "
        "Graduate employability is considered in curriculum planning."
    ),
    "FN03": (
        "Fees are set with reference to local market rates. Some affordability measures "
        "such as instalment plans are available."
    ),
    "FN04": (
        "Investment in facilities has been made over recent years. A capital plan exists "
        "for equipment replacement. Some digital resources have been upgraded."
    ),
    "FN05": (
        "Financial risks are considered as part of broader institutional planning. "
        "Key risks include recruitment volatility and currency fluctuation."
    ),
}

_LONG_TEXT_LOW: dict[str, str] = {
    "TL05": "Programme reviews are conducted periodically. Changes are approved by the academic board.",
    "TL12": "Staff induction is provided. Some CPD opportunities are available.",
    "TL15": "Informal peer observation takes place. Feedback is shared between colleagues.",
    "SE02": "End-of-module surveys are administered. Results are reviewed by programme teams.",
    "SE07": "Graduate tracking is limited. Some alumni contact is maintained.",
    "SE08": "Common assessments are used across sites. Some shared online resources are available.",
    "SE10": "Basic teaching facilities are provided at partner sites.",
    "SE11": "Online resources are available through a basic learning platform.",
    "GV03": "Quality procedures follow institutional and regulatory requirements.",
    "GV05": "Key risks are identified and discussed at management meetings.",
    "GV06": "Data is shared between partners as required for operations.",
    "GV08": "Reports are submitted annually with basic programme data.",
    "GV10": "Academic integrity policies exist and are communicated to students.",
    "IM01": "Limited research collaboration exists between partners.",
    "IM03": "Some industry links exist for student placements.",
    "IM04": "Occasional community engagement activities are organised.",
    "IM05": "Some exchange of teaching materials occurs between partners.",
    "IM07": "Programmes aim to meet local workforce needs.",
    "FN03": "Fees are set to be affordable for the local market.",
    "FN04": "Some investment in facilities has been made.",
    "FN05": "Financial sustainability is monitored at institutional level.",
}

_DEFAULT_LONG_TEXT = {
    "high": (
        "Comprehensive policies and processes are in place to ensure quality and consistency "
        "across all TNE delivery sites. Regular review cycles incorporate feedback from "
        "stakeholders including students, staff, industry partners, and external bodies. "
        "Continuous improvement is embedded in the institutional culture with dedicated "
        "resources allocated to enhancement activities."
    ),
    "mid": (
        "Policies and processes are in place for TNE delivery. Review cycles incorporate "
        "feedback from key stakeholders. Improvement actions are identified and tracked."
    ),
    "low": "Basic processes are in place for TNE delivery quality management.",
}


def _gen_long_text(code: str, qf: float) -> dict:
    if qf >= 0.7:
        text = _LONG_TEXT_HIGH.get(code, _DEFAULT_LONG_TEXT["high"])
    elif qf >= 0.5:
        text = _LONG_TEXT_MID.get(code, _DEFAULT_LONG_TEXT["mid"])
    else:
        text = _LONG_TEXT_LOW.get(code, _DEFAULT_LONG_TEXT["low"])
    return {"text": text}


def _gen_short_text(code: str, qf: float) -> dict:
    if qf >= 0.7:
        texts = {
            "IM08": (
                "QS 5-Star rating for internationalisation; AACSB accreditation for business programmes; "
                "Times Higher Education Award for Outstanding International Strategy 2024"
            ),
        }
    elif qf >= 0.5:
        texts = {
            "IM08": "National quality award; professional body accreditation for key programmes",
        }
    else:
        texts = {
            "IM08": "Local accreditation maintained",
        }
    return {"text": texts.get(code, "Relevant recognitions received")}


def _gen_multi_year_gender(code: str, field_config: dict, year_idx: int, qf: float) -> dict:
    """Generate 4-year trend data scaled by quality_factor."""
    has_gender = field_config.get("has_gender", True)
    base_year = 2021 + year_idx

    # Scale base values by qf
    scale = 0.4 + qf * 0.9  # qf=0.95→1.26, qf=0.35→0.72

    if code == "TL03":  # student enrolment
        base_m, base_f = int(280 * scale), int(250 * scale)
        growth = int(15 * scale)
    elif code == "SE01":  # satisfaction %
        base_m = int(70 + qf * 12)  # qf=0.95→81, qf=0.35→74
        base_f = base_m + 2
        growth = 1.5
    elif code == "IM02":  # publications (no gender)
        base_total = int(12 * scale)
        growth = int(3 * scale)
    elif code == "FN01":  # revenue (no gender)
        base_total = int(1_800_000 * scale)
        growth = int(200_000 * scale)
    else:
        base_m, base_f = int(50 * scale), int(50 * scale)
        growth = int(5 * scale)

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


# Yes/No follow-up texts (high quality)
_YES_NO_FOLLOW_UPS: dict[str, str] = {
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


def _gen_yes_no(code: str, qf: float) -> dict:
    # Low-quality institutions sometimes answer "no"
    if qf < 0.5 and random.random() > qf + 0.2:
        return {"yes": False}

    if qf >= 0.7:
        follow_up = _YES_NO_FOLLOW_UPS.get(
            code, "Comprehensive processes are in place and regularly reviewed."
        )
    elif qf >= 0.5:
        follow_up = _YES_NO_FOLLOW_UPS.get(
            code, "Processes are in place and reviewed periodically."
        )
        # Shorten high-quality text if it was the specific follow-up
        if code in _YES_NO_FOLLOW_UPS:
            # Take first two sentences
            sentences = follow_up.split(". ")
            follow_up = ". ".join(sentences[:2]) + "."
    else:
        follow_up = "Basic processes are in place."
    return {"yes": True, "follow_up": follow_up}


def _gen_multi_select(code: str, field_config: dict, qf: float) -> dict:
    options = field_config.get("options", [])
    # qf determines fraction of options selected
    frac = 0.3 + qf * 0.6  # qf=0.95→0.87, qf=0.35→0.51
    n = max(2, int(len(options) * frac))
    selected = random.sample(options, min(n, len(options)))
    return {"selected": selected}


def _gen_salary_bands(qf: float) -> dict:
    # Scale salaries by qf
    scale = 0.5 + qf * 0.7  # qf=0.95→1.17, qf=0.35→0.75
    return {
        "bands": {
            "Professor": {"value": int(95000 * scale), "currency": "GBP"},
            "Associate Professor": {"value": int(75000 * scale), "currency": "GBP"},
            "Senior Lecturer": {"value": int(62000 * scale), "currency": "GBP"},
            "Lecturer": {"value": int(48000 * scale), "currency": "GBP"},
            "Teaching Assistant": {"value": int(32000 * scale), "currency": "GBP"},
        }
    }


def generate_response_value(item: AssessmentItem, year_idx: int, qf: float) -> dict | None:
    """Generate a realistic JSONB response value scaled by quality_factor."""
    ft = item.field_type
    code = item.code
    fc = item.field_config or {}

    if ft == "numeric":
        return _gen_numeric(code, fc, year_idx, qf)
    elif ft == "percentage":
        return _gen_percentage(code, year_idx, qf)
    elif ft == "long_text":
        return _gen_long_text(code, qf)
    elif ft == "short_text":
        return _gen_short_text(code, qf)
    elif ft == "multi_year_gender":
        return _gen_multi_year_gender(code, fc, year_idx, qf)
    elif ft == "yes_no_conditional":
        return _gen_yes_no(code, qf)
    elif ft == "multi_select":
        return _gen_multi_select(code, fc, qf)
    elif ft == "salary_bands":
        return _gen_salary_bands(qf)
    elif ft == "auto_calculated":
        # Scale auto-calculated plausible values by qf
        base = 40 + qf * 40  # qf=0.95→78, qf=0.35→54
        return {"value": round(base + random.uniform(-5, 5), 1)}
    elif ft == "file_upload":
        return None
    else:
        return {"text": "Sample response for field type: " + ft}


# ---------------------------------------------------------------------------
# Quality-tiered theme analyses
# ---------------------------------------------------------------------------
THEME_ANALYSES_HIGH = {
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

THEME_ANALYSES_MID = {
    "teaching-learning": {
        "summary": "Teaching and learning provision is adequate with room for growth in staff qualifications and programme breadth.",
        "strengths": [
            "Established programme offerings meeting local demand",
            "Staff induction processes in place",
            "Regular programme monitoring conducted",
        ],
        "areas_for_improvement": [
            "Staff doctoral qualification rates need improvement",
            "Programme diversity is limited compared to peers",
            "Peer observation processes could be formalised",
            "More structured approach to curriculum review needed",
        ],
    },
    "student-experience": {
        "summary": "Student experience is satisfactory with basic support services and moderate graduate outcomes.",
        "strengths": [
            "Student feedback surveys administered regularly",
            "Core student support services available",
            "Graduate employment tracking in place",
        ],
        "areas_for_improvement": [
            "Feedback response rates need improvement",
            "Alumni engagement is limited and needs expansion",
            "Parity of experience between sites needs attention",
            "Digital learning resources require enhancement",
        ],
    },
    "governance": {
        "summary": "Governance structures exist but need strengthening in key areas of risk management and monitoring.",
        "strengths": [
            "Partnership agreements are in place",
            "Basic quality assurance procedures followed",
            "Regulatory compliance maintained",
        ],
        "areas_for_improvement": [
            "Risk register needs more regular review",
            "Student voice in governance is insufficient",
            "Data sharing protocols need formalisation",
            "Annual monitoring reports lack depth",
        ],
    },
    "impact": {
        "summary": "Impact activities are emerging but research collaboration and community engagement remain limited.",
        "strengths": [
            "Some industry links for student placements",
            "Local community engagement activities exist",
            "Staff exchange visits occur occasionally",
        ],
        "areas_for_improvement": [
            "Joint research output is minimal",
            "Industry engagement needs strategic approach",
            "Knowledge exchange is informal and ad hoc",
            "Impact measurement framework needed",
        ],
    },
    "financial": {
        "summary": "Financial position is stable but revenue growth is modest and investment in infrastructure is limited.",
        "strengths": [
            "Revenue is stable year on year",
            "Fee levels are competitive in the market",
            "Basic financial reporting is in place",
        ],
        "areas_for_improvement": [
            "Revenue growth is below sector average",
            "Infrastructure investment needs acceleration",
            "Financial risk assessment is basic",
            "Staff salary benchmarking needed",
        ],
    },
}

THEME_ANALYSES_LOW = {
    "teaching-learning": {
        "summary": "Teaching and learning provision requires significant improvement across programme quality and staffing.",
        "strengths": [
            "Programmes are operational and accredited locally",
            "Some staff development activities take place",
        ],
        "areas_for_improvement": [
            "Very low proportion of doctoral-qualified staff",
            "Programme review processes are informal",
            "No structured peer observation scheme",
            "Student-staff ratios are high and concerning",
            "Curriculum lacks evidence of systematic review",
        ],
    },
    "student-experience": {
        "summary": "Student experience needs substantial development with limited support services and weak outcome tracking.",
        "strengths": [
            "Basic teaching facilities are provided",
            "Student complaints process exists",
        ],
        "areas_for_improvement": [
            "Student feedback mechanisms are minimal",
            "No systematic graduate tracking",
            "Learning resources are below sector benchmarks",
            "Digital learning environment is underdeveloped",
            "No alumni engagement programme",
        ],
    },
    "governance": {
        "summary": "Governance arrangements are underdeveloped and pose risks to partnership sustainability.",
        "strengths": [
            "Basic partnership agreement exists",
            "Local regulatory requirements are met",
        ],
        "areas_for_improvement": [
            "No formal joint governance board in operation",
            "Quality assurance framework lacks rigour",
            "Risk management is reactive rather than proactive",
            "Academic integrity procedures need strengthening",
            "Annual monitoring is perfunctory",
        ],
    },
    "impact": {
        "summary": "Impact and engagement activities are minimal with very limited research collaboration or community benefit.",
        "strengths": [
            "Some local community awareness of the institution",
            "Basic industry links for graduate employment",
        ],
        "areas_for_improvement": [
            "No meaningful joint research activity",
            "Industry engagement is limited to ad hoc interactions",
            "No structured knowledge exchange programme",
            "Community impact is not measured",
            "Student mobility programmes do not exist",
        ],
    },
    "financial": {
        "summary": "Financial sustainability is precarious with declining revenue trends and minimal infrastructure investment.",
        "strengths": [
            "Fees are affordable for the local market",
            "Operational costs are managed within budget",
        ],
        "areas_for_improvement": [
            "Revenue growth is stagnant or declining",
            "No systematic infrastructure investment plan",
            "Financial risk management is absent",
            "Staff compensation is below market rates",
            "No scholarship or financial aid programme",
        ],
    },
}


def _get_theme_analyses(qf: float) -> dict:
    if qf >= 0.7:
        return THEME_ANALYSES_HIGH
    elif qf >= 0.5:
        return THEME_ANALYSES_MID
    else:
        return THEME_ANALYSES_LOW


# ---------------------------------------------------------------------------
# Quality-aware executive summary and recommendations
# ---------------------------------------------------------------------------
def _gen_executive_summary(overall_score: float, tenant_name: str, year: str, qf: float) -> str:
    if qf >= 0.7:
        level = "excellent" if overall_score >= 85 else "good"
        tone = (
            "The institution demonstrates particular strength in governance and quality "
            "assurance frameworks, with well-established joint oversight mechanisms and regulatory "
            "compliance. Student experience shows positive trends in satisfaction and graduate outcomes, "
            "though some variation between delivery sites warrants attention.\n\n"
            "Key recommendations focus on enhancing research collaboration output, strengthening digital "
            "learning parity across sites, and updating financial risk management strategies to reflect "
            "current market conditions. The institution's continued investment in TNE infrastructure "
            "and staff development provides a strong foundation for sustainable growth."
        )
    elif qf >= 0.5:
        level = "satisfactory" if overall_score >= 65 else "developing"
        tone = (
            "The institution has established basic frameworks for TNE delivery with some areas "
            "of emerging good practice. Quality assurance processes are functional but would benefit "
            "from greater formalisation and consistency. Student support services meet minimum "
            "requirements but need enhancement to match sector expectations.\n\n"
            "Priority recommendations include strengthening staff qualifications and development, "
            "developing a more systematic approach to student feedback, and establishing formal "
            "risk management processes. Investment in digital learning infrastructure is needed "
            "to improve the student experience."
        )
    else:
        level = "developing" if overall_score >= 50 else "concerning"
        tone = (
            "The institution is at an early stage of TNE maturity with significant areas requiring "
            "development. Governance structures need formalisation, quality assurance processes "
            "require substantial strengthening, and student support services are below sector "
            "benchmarks. Research and community engagement activities are minimal.\n\n"
            "Urgent priorities include establishing a formal joint governance board, developing "
            "a quality assurance framework, investing in staff qualifications, and creating "
            "systematic student feedback mechanisms. Financial sustainability planning is "
            "essential for the long-term viability of the partnership."
        )

    return (
        f"This report presents the findings of the TNE Quality Assessment for {tenant_name} "
        f"for the academic year {year}. The assessment evaluated the institution's transnational "
        f"education activities across five core themes: Teaching & Learning, Student Experience & "
        f"Outcomes, Governance & Quality Assurance, Impact & Engagement, and Financial Sustainability.\n\n"
        f"The overall assessment score of {overall_score:.1f}/100 reflects a {level} standard of "
        f"TNE provision. {tone}"
    )


def _gen_recommendations(overall_score: float, qf: float) -> list[dict]:
    if qf >= 0.7:
        return [
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
    elif qf >= 0.5:
        return [
            {
                "priority": "high",
                "theme": "Teaching & Learning",
                "recommendation": "Formalise staff development requirements with minimum CPD hours and structured peer observation.",
                "timeline": "6-9 months",
            },
            {
                "priority": "high",
                "theme": "Student Experience",
                "recommendation": "Implement systematic student feedback collection across all sites with published response targets.",
                "timeline": "3-6 months",
            },
            {
                "priority": "high",
                "theme": "Governance",
                "recommendation": "Establish a quarterly risk review process with documented risk register and mitigation strategies.",
                "timeline": "6 months",
            },
            {
                "priority": "medium",
                "theme": "Impact & Engagement",
                "recommendation": "Develop an industry engagement strategy with annual targets for employer partnerships.",
                "timeline": "12 months",
            },
            {
                "priority": "medium",
                "theme": "Financial Sustainability",
                "recommendation": "Create a 3-year infrastructure investment plan with specific targets for digital learning resources.",
                "timeline": "9-12 months",
            },
        ]
    else:
        return [
            {
                "priority": "high",
                "theme": "Governance",
                "recommendation": "Establish a formal joint governance board with defined terms of reference, meeting quarterly at minimum.",
                "timeline": "3 months",
            },
            {
                "priority": "high",
                "theme": "Teaching & Learning",
                "recommendation": "Implement a staff qualifications improvement plan targeting 30% doctoral-qualified staff within 3 years.",
                "timeline": "6-12 months",
            },
            {
                "priority": "high",
                "theme": "Student Experience",
                "recommendation": "Create a student feedback framework with module-level surveys, response targets, and published action plans.",
                "timeline": "3-6 months",
            },
            {
                "priority": "high",
                "theme": "Governance",
                "recommendation": "Develop a comprehensive quality assurance framework aligned with international standards.",
                "timeline": "6-9 months",
            },
            {
                "priority": "medium",
                "theme": "Financial Sustainability",
                "recommendation": "Conduct a financial sustainability review with scenario modelling for enrolment fluctuations.",
                "timeline": "6 months",
            },
        ]


# ---------------------------------------------------------------------------
# Quality-aware scoring
# ---------------------------------------------------------------------------
def _qf_theme_score(qf: float, theme_slug: str, inst_type: str) -> float:
    """Generate a theme score calibrated to quality_factor and institution type."""
    # Base range: qf maps linearly onto score bands
    # qf=0.95 → ~88-98, qf=0.70 → ~70-82, qf=0.35 → ~50-62
    base = qf * 85 + 10  # qf=0.95→90.75, qf=0.70→69.5, qf=0.35→39.75
    base = max(base, 35)

    # Apply institution type theme profile offset
    profile = THEME_PROFILE.get(inst_type, {})
    offset = profile.get(theme_slug, 0.0) * 100  # convert fraction to score points

    score = base + offset + random.uniform(-5, 5)
    return round(min(99, max(30, score)), 1)


def _qf_item_score(qf: float) -> float:
    """Generate an individual item AI score calibrated to quality_factor."""
    base = qf * 80 + 15  # qf=0.95→91, qf=0.35→43
    score = base + random.uniform(-8, 8)
    return round(min(99, max(25, score)), 1)


# ---------------------------------------------------------------------------
# Reset
# ---------------------------------------------------------------------------
async def reset_demo_data(session):
    """Remove all demo seed data."""
    result = await session.execute(select(Tenant).where(Tenant.slug.like("demo-%")))
    tenants = result.scalars().all()

    for tenant in tenants:
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
        await session.execute(
            delete(PartnerInstitution).where(PartnerInstitution.tenant_id == tenant.id)
        )
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
        result = await session.execute(select(Tenant).where(Tenant.slug == TENANTS[0]["slug"]))
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

        # Load all items
        items_result = await session.execute(
            select(AssessmentItem)
            .join(AssessmentTheme)
            .where(AssessmentTheme.template_id == template.id)
        )
        all_items = items_result.scalars().all()

        # Load themes
        themes_result = await session.execute(
            select(AssessmentTheme).where(AssessmentTheme.template_id == template.id)
        )
        all_themes = themes_result.scalars().all()
        {t.id: t for t in all_themes}

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
            print(f"  Created tenant: {tenant.name} (qf={t_data['quality_factor']:.2f})")

            # Users
            users = []
            for u_data in USERS_BY_TENANT.get(t_data["slug"], []):
                user = User(
                    tenant_id=tenant.id,
                    email=u_data["email"],
                    password_hash=pwd_context.hash(PASSWORD),
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
        total_theme_scores = 0
        total_reports = 0

        for t_data in TENANTS:
            slug = t_data["slug"]
            tenant = tenant_map[slug]
            qf = t_data["quality_factor"]
            inst_type = t_data["institution_type"]
            tier = t_data["subscription_tier"]
            users = user_map[slug]
            admin_user = next((u for u in users if u.role == "tenant_admin"), users[0])
            assessor = next((u for u in users if u.role == "assessor"), admin_user)
            reviewer = next((u for u in users if u.role == "reviewer"), None)

            year_indices = YEARS_BY_TIER[tier]

            for year_idx in year_indices:
                year = ACADEMIC_YEARS[year_idx]
                status = STATUS_BY_YEAR_IDX[year_idx]

                base_date = now - timedelta(days=(3 - year_idx) * 365)
                base_date - timedelta(days=random.randint(30, 90))
                submitted_at = (
                    base_date - timedelta(days=random.randint(5, 25)) if status != "draft" else None
                )

                assessment = Assessment(
                    tenant_id=tenant.id,
                    template_id=template.id,
                    academic_year=year,
                    status=status,
                    submitted_at=submitted_at,
                    submitted_by=assessor.id if status != "draft" else None,
                    reviewed_by=reviewer.id
                    if reviewer and status in ("under_review", "scored", "report_generated")
                    else None,
                )
                session.add(assessment)
                await session.flush()
                total_assessments += 1

                # --- Responses ---
                items_to_fill = (
                    all_items
                    if status != "draft"
                    else random.sample(list(all_items), k=int(len(all_items) * 0.4))
                )

                for item in items_to_fill:
                    value = generate_response_value(item, year_idx, qf)
                    if value is None:
                        continue

                    ai_score = None
                    ai_feedback = None
                    scored_at = None

                    if status in ("scored", "report_generated"):
                        ai_score = _qf_item_score(qf)
                        ai_feedback = f"This response demonstrates a solid understanding of {item.label.lower()}. "
                        if ai_score >= 80:
                            ai_feedback += (
                                "The evidence provided is comprehensive and well-articulated."
                            )
                        elif ai_score >= 65:
                            ai_feedback += "Additional detail on implementation outcomes would strengthen the response."
                        else:
                            ai_feedback += (
                                "Consider providing more specific evidence and measurable outcomes."
                            )
                        scored_at = (
                            submitted_at + timedelta(hours=random.randint(2, 48))
                            if submitted_at
                            else None
                        )

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

                # --- Theme Scores ---
                if status in ("scored", "report_generated"):
                    overall_weighted = 0.0
                    analyses = _get_theme_analyses(qf)

                    for theme in all_themes:
                        norm_score = _qf_theme_score(qf, theme.slug, inst_type)
                        weighted = round(norm_score * theme.weight, 2)
                        overall_weighted += weighted

                        analysis_data = analyses.get(theme.slug, {})
                        analysis_text = (
                            f"{analysis_data.get('summary', 'Performance in this area is satisfactory.')}\n\n"
                            f"Strengths:\n"
                            + "\n".join(
                                f"- {s}"
                                for s in analysis_data.get(
                                    "strengths", ["Good overall performance"]
                                )
                            )
                            + "\n\nAreas for improvement:\n"
                            + "\n".join(
                                f"- {a}"
                                for a in analysis_data.get(
                                    "areas_for_improvement", ["Continue to enhance"]
                                )
                            )
                        )

                        theme_score = ThemeScore(
                            assessment_id=assessment.id,
                            theme_id=theme.id,
                            normalised_score=norm_score,
                            weighted_score=weighted,
                            ai_analysis=analysis_text,
                        )
                        session.add(theme_score)
                        total_theme_scores += 1

                    assessment.overall_score = round(overall_weighted, 1)

                # --- Report ---
                if status == "report_generated":
                    overall = assessment.overall_score or 75.0
                    analyses = _get_theme_analyses(qf)
                    report = AssessmentReport(
                        assessment_id=assessment.id,
                        version=1,
                        executive_summary=_gen_executive_summary(overall, tenant.name, year, qf),
                        theme_analyses={
                            theme.slug: analyses.get(theme.slug, {"summary": "Analysis pending"})
                            for theme in all_themes
                        },
                        improvement_recommendations=_gen_recommendations(overall, qf),
                        generated_by="claude-opus-4-6",
                    )
                    session.add(report)
                    total_reports += 1

                score_str = (
                    f" (score: {assessment.overall_score})" if assessment.overall_score else ""
                )
                print(f"    {tenant.name}: {year} -> {status}{score_str}")

        # ---------------------------------------------------------------
        # 3. Benchmark snapshots — 12 countries + Global
        # ---------------------------------------------------------------
        benchmark_count = 0
        metric_names = [
            "overall_score",
            "teaching_learning",
            "student_experience",
            "governance",
            "impact",
            "financial",
        ]
        benchmark_countries = [
            "United Kingdom",
            "Australia",
            "United Arab Emirates",
            "Singapore",
            "Switzerland",
            "Ireland",
            "Malaysia",
            "India",
            "Oman",
            "Botswana",
            "Fiji",
            "Global",
        ]

        for year in ACADEMIC_YEARS:
            for country in benchmark_countries:
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
        total_users = sum(len(v) for v in USERS_BY_TENANT.values()) + 1  # +1 for platform admin
        total_partners = sum(len(v) for v in PARTNERS_BY_TENANT.values())

        print()
        print("=" * 70)
        print("  Realistic Test Data Seeded Successfully")
        print("=" * 70)
        print(f"  Tenants        : {len(TENANTS)}")
        print(f"  Users          : {total_users}")
        print(f"  Partners       : {total_partners}")
        print(f"  Assessments    : {total_assessments}")
        print(f"  Responses      : {total_responses}")
        print(f"  Theme Scores   : {total_theme_scores}")
        print(f"  Reports        : {total_reports}")
        print(f"  Benchmarks     : {benchmark_count}")
        print()
        print("  Tenants by tier and quality_factor:")
        for t in TENANTS:
            print(f"    {t['subscription_tier']:12s}  qf={t['quality_factor']:.2f}  {t['name']}")
        print()
        print("  Assessment statuses by tier:")
        for tier, indices in YEARS_BY_TIER.items():
            years_str = ", ".join(f"{ACADEMIC_YEARS[i]}={STATUS_BY_YEAR_IDX[i]}" for i in indices)
            print(f"    {tier:12s}: {years_str}")
        print()
        print("  Login credentials (all verified, password: DemoPass123!):")
        for slug, users_list in USERS_BY_TENANT.items():
            tenant_name = next(t["name"] for t in TENANTS if t["slug"] == slug)
            print(f"\n  {tenant_name}:")
            for u in users_list:
                print(f"    {u['role']:20s} {u['email']}")
        print("\n  Platform Admin:")
        print(
            f"    {'platform_admin':20s} {PLATFORM_ADMIN['email']}  (password: {PLATFORM_ADMIN['password']})"
        )
        print()
        print("=" * 70)


if __name__ == "__main__":
    asyncio.run(seed())
