# TNE Quality Assessment & Benchmarking Platform

A SaaS platform for Transnational Education (TNE) quality assessment and benchmarking. Collects structured assessment data across 5 themes (~52 items), auto-calculates metrics, uses AI for scoring/analysis/report generation/document intelligence, and enables benchmarking against anonymised peers.

## Tech Stack

- **Backend**: Python 3.11+ / FastAPI / SQLAlchemy (async) / PostgreSQL / Celery / Redis
- **Frontend**: Next.js 15 / React 19 / TypeScript / Tailwind CSS / React Query / Recharts
- **AI**: Anthropic Claude API (scoring, reports, document intelligence) + scikit-learn/XGBoost (predictive models)
- **Infrastructure**: Docker Compose / MinIO (S3) / GitHub Actions CI

## Quick Start

```bash
# Start infrastructure (postgres, redis, minio)
cd infrastructure && docker compose up -d postgres redis minio

# Backend setup
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env  # Edit with your settings

# Run migrations
alembic upgrade head

# Seed assessment template (52 items across 5 themes)
python -m scripts.seed_assessment_template

# Seed demo data (optional)
python -m scripts.seed_demo_data

# Start backend
uvicorn app.main:app --reload

# Frontend setup (new terminal)
cd frontend
npm install
npm run dev
```

Backend runs at http://localhost:8000 (API docs at http://localhost:8000/api/docs)
Frontend runs at http://localhost:3000

## Project Structure

```
tne-education-assessment/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entry point
│   │   ├── config.py            # pydantic-settings configuration
│   │   ├── database.py          # SQLAlchemy async engine + session
│   │   ├── dependencies.py      # Auth, tenant, role dependencies
│   │   ├── models/              # 8 SQLAlchemy ORM models
│   │   ├── schemas/             # 9 Pydantic schema modules (28 schemas)
│   │   ├── api/v1/              # 10 FastAPI routers
│   │   ├── services/            # Business logic (assessment, calculation, scoring, etc.)
│   │   ├── ai/                  # AI pipeline
│   │   │   ├── claude_client.py # Anthropic API wrapper (retry, cache, cost tracking)
│   │   │   ├── scoring/         # Numeric, binary, text, timeseries, consistency scorers
│   │   │   ├── reports/         # Section-by-section report generation
│   │   │   ├── documents/       # Extract, classify, completeness pipeline
│   │   │   ├── predictive/      # Rule-based risk scoring engine
│   │   │   └── prompts/         # All prompt templates
│   │   ├── workers/             # Celery background tasks
│   │   └── middleware/          # Tenant isolation (PostgreSQL RLS)
│   ├── alembic/                 # Database migrations
│   └── tests/
├── frontend/
│   └── src/
│       ├── app/                 # Next.js App Router (auth + dashboard pages)
│       ├── components/          # Forms (12 field renderers), dashboard, reports
│       ├── hooks/               # useAutoSave, useAssessment, useFileUpload
│       └── lib/                 # API client, types, calculations
├── infrastructure/
│   └── docker-compose.yml       # postgres, redis, minio, backend, celery, frontend
├── scripts/
│   ├── seed_assessment_template.py  # Seeds 52 assessment items
│   └── seed_demo_data.py           # Seeds demo tenants, users, partners
└── .github/workflows/ci.yml
```

## Assessment Themes (5 themes, 52 items)

| Theme | Weight | Items | Item Types |
|-------|--------|-------|------------|
| Teaching & Learning | 25% | 15 | numeric, text, auto-calc, multi-year, yes/no |
| Student Experience & Outcomes | 25% | 12 | percentage, text, multi-select, file upload |
| Governance & Quality Assurance | 20% | 10 | file upload, text, yes/no conditional |
| Impact & Engagement | 15% | 8 | text, multi-year, yes/no, short text |
| Financial Sustainability | 15% | 7 | multi-year, percentage, text, salary bands |

## Key Features

- **Multi-tenancy**: Shared DB with `tenant_id` isolation + PostgreSQL RLS
- **JWT Auth**: HS256 access (15min) + refresh (7day) tokens, RBAC (5 roles)
- **12 Field Types**: Dynamic form rendering with data-driven templates
- **Auto-calculations**: SSR, PhD%, flying faculty%, gender splits, trends
- **AI Scoring**: Algorithmic (numeric) + Claude API (text rubric evaluation)
- **Document Intelligence**: Upload -> extract -> classify -> assess completeness
- **Report Generation**: Section-by-section Claude API -> HTML -> PDF
- **Risk Predictions**: Rule-based engine (Phase 1), ML models (Phase 3)
- **Benchmarking**: Anonymised percentile comparisons against peers

## API Endpoints

```
POST   /api/v1/auth/register        # Create tenant + first admin
POST   /api/v1/auth/login           # JWT login
POST   /api/v1/auth/refresh         # Token refresh
GET    /api/v1/tenants/current      # Current tenant
GET    /api/v1/assessments/templates # List templates with items
POST   /api/v1/assessments          # Create assessment
PUT    /api/v1/assessments/{id}/responses/{item_id}  # Save response (auto-save)
POST   /api/v1/assessments/{id}/submit  # Submit for review
POST   /api/v1/assessments/{id}/scores/trigger-scoring  # Trigger AI scoring
POST   /api/v1/assessments/{id}/report/generate  # Generate report
GET    /api/v1/benchmarks/compare/{id}  # Peer comparison
```
