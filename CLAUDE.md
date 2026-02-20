# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TNE Quality Assessment & Benchmarking Platform — a multi-tenant SaaS for evaluating transnational education partnerships. Institutions fill out 52 assessment items across 5 themes, AI scores text responses, generates reports, and benchmarks against peers.

## Development Commands

### Backend (FastAPI)
```bash
cd backend
pip install -e ".[dev]"                     # Install with dev deps
uvicorn app.main:app --reload --port 8000   # Dev server
ruff check app/                             # Lint
ruff format app/                            # Format
pytest tests/                               # Run tests
pytest tests/test_auth.py -k "test_login"   # Single test
alembic upgrade head                        # Run migrations
alembic revision --autogenerate -m "desc"   # Create migration
```

### Frontend (Next.js)
```bash
cd frontend
npm install                                 # Install deps
npm run dev                                 # Dev server (port 3000)
npm run build                               # Production build
npm run lint                                # ESLint
```

### Infrastructure (Docker)
```bash
cd infrastructure
docker compose up -d postgres redis minio mailpit   # Start deps only
docker compose up --build                            # Full stack (production mode)
docker compose down -v                               # Tear down with volumes
```

### Seed Data
```bash
cd backend
python -m scripts.seed_assessment_template   # Assessment template (required first)
python -m scripts.seed_demo_data             # Demo users + assessments
python -m scripts.seed_realistic_data        # Realistic multi-tenant data
python -m scripts.seed_e2e_data              # E2E test fixtures
```

### E2E Tests (Playwright)
```bash
cd e2e
npx playwright install                       # Install browsers (first time)
npx playwright test                          # Run all tests
npx playwright test tests/03-assessment-lifecycle.spec.ts  # Single spec
BASE_URL=https://tne.badev.tools npx playwright test       # Against deployed
```

## Architecture

### Backend (`backend/app/`)
- **Entry**: `main.py` — FastAPI app with CORS, 11 routers mounted at `/api/v1`
- **Config**: `config.py` — pydantic-settings `Settings` class, reads from env vars / `.env`
- **Auth**: `dependencies.py` — `get_current_user`, `get_tenant`, `require_role()` dependency injectors. JWT HS256, 15-min access + 7-day refresh tokens. Roles: `platform_admin`, `tenant_admin`, `assessor`, `institution_user`, `reviewer`
- **Models**: `models/` — 8 SQLAlchemy async models (user, tenant, assessment, scoring, report, benchmark, file_upload, ai_job). All have `tenant_id` for multi-tenancy
- **Schemas**: `schemas/` — Pydantic v2 schemas, one file per domain
- **Services**: `services/` — Business logic layer (assessment, scoring, calculation, benchmark, report, email, token)
- **AI Pipeline**: `ai/` — `claude_client.py` (shared Anthropic client with retry/cache/cost tracking), sub-packages for scoring, reports, documents, predictive analytics, and prompt templates
- **Workers**: `workers/` — Celery app + tasks wired to AI pipelines
- **Migrations**: `alembic/` with async engine in `env.py`

### Frontend (`frontend/src/`)
- **App Router**: `app/` with route groups `(auth)` (login, register, verify-email, magic-link) and `(dashboard)` (dashboard, assessments, benchmarks, admin)
- **API Client**: `lib/api-client.ts` — Axios-based client with JWT interceptor (auto-refresh on 401)
- **Types**: `lib/types.ts` — TypeScript interfaces matching backend schemas
- **Hooks**: `hooks/` — React Query hooks (`useAssessment.ts`, `useDashboardData.ts`)
- **Forms**: `components/forms/field-renderers/` — 12 field type renderers for the assessment form
- **Charts**: `components/charts/GaugeChart.tsx` — Custom SVG semi-circle gauge
- **Dashboard**: `components/dashboard/` — 7 dashboard widget components
- **UI**: `components/ui/` — Shared primitives (Alert, Badge, StatusBadge, PageHeader, EmptyState)

### Data Model
- **Multi-tenant**: `tenant_id` on all data tables, enforced at app layer + row-level security
- **Assessment template**: 52 items across 5 themes — Teaching & Learning (TL), Student Experience (SE), Governance (GV), Information Management (IM), Finance (FN)
- **12 field types**: short_text, long_text, numeric, percentage, yes_no_conditional, dropdown, multi_select, file_upload, multi_year_gender, partner_specific, auto_calculated, salary_bands
- **Workflow**: draft → submitted → under_review → scored → report_generated

### Docker Production
- `infrastructure/docker-compose.yml` — 7 services: postgres, redis, minio, mailpit, migrate (alembic), backend, celery-worker, frontend
- `migrate` service runs `alembic upgrade head` before backend starts (uses `service_completed_successfully`)
- `NEXT_PUBLIC_API_URL` is a build-time arg baked into the JS bundle — must be set correctly at `docker compose build`
- Backend Dockerfile requires `ENV PYTHONPATH=/app` for module resolution
- Production domain: `tne.badev.tools` (frontend), `tne-api.badev.tools` (backend API)

## Key Patterns

- All backend config is via environment variables (pydantic-settings), never hardcoded
- AI calls always go through `app/ai/claude_client.py` — never instantiate Anthropic client directly
- Frontend uses React Query for all server state — no local state for fetched data
- Assessment form field renderers follow a consistent interface in `field-renderers/`
- Recharts for BarChart/AreaChart; custom SVG for gauge charts
- `next.config.ts` has `output: "standalone"` for Docker deployment
