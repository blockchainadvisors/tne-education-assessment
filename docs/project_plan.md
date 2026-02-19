# TNE Quality Assessment & Benchmarking SaaS Platform

> Implementation Plan

---

## Context

**TNE Institute** (TNE Academy Ltd, est. Aug 2025) is building the first digital SaaS platform for Transnational Education quality assessment and benchmarking. No such product exists — every current tool is manual (Ecctis TNE QB, QAA QE-TNE) or a static PDF (HEPI Scorecard, TEQSA Toolkit).

**The market:** 653K+ UK TNE students across 173 universities and 228 countries, GBP 3B+ revenue, growing ~8%/year.

**The platform** collects structured assessment data from institutions across 5 themes (~50+ items), auto-calculates metrics, uses AI for scoring / analysis / report generation / document intelligence / predictions, and enables benchmarking against anonymised peers.

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python + FastAPI |
| Database | PostgreSQL |
| Frontend | Next.js (App Router) |
| AI / LLM | Claude API (Anthropic) |
| ML | scikit-learn / XGBoost |
| Task queue | Celery + Redis |
| Object storage | MinIO (S3-compatible) |
| PDF generation | WeasyPrint |

---

## Project Structure

```
tne-education-assessment/
├── backend/
│   ├── alembic/                        # Database migrations
│   ├── app/
│   │   ├── main.py                     # FastAPI entry point
│   │   ├── config.py                   # pydantic-settings
│   │   ├── database.py                 # SQLAlchemy async engine + session
│   │   ├── dependencies.py             # get_db, get_current_user, get_tenant
│   │   ├── models/                     # SQLAlchemy ORM
│   │   │   ├── tenant.py
│   │   │   ├── user.py
│   │   │   ├── assessment.py           # assessments, templates, themes, items, responses
│   │   │   ├── file_upload.py
│   │   │   ├── scoring.py              # theme_scores, item_scores
│   │   │   ├── report.py
│   │   │   ├── benchmark.py
│   │   │   └── ai_job.py
│   │   ├── schemas/                    # Pydantic request/response schemas
│   │   ├── api/v1/                     # FastAPI routers
│   │   │   ├── auth.py
│   │   │   ├── tenants.py
│   │   │   ├── users.py
│   │   │   ├── assessments.py
│   │   │   ├── responses.py
│   │   │   ├── files.py
│   │   │   ├── scoring.py
│   │   │   ├── reports.py
│   │   │   ├── benchmarks.py
│   │   │   └── admin.py
│   │   ├── services/                   # Business logic
│   │   │   ├── assessment_service.py
│   │   │   ├── calculation_service.py  # Auto-calculated fields (SSR, %, etc.)
│   │   │   ├── scoring_service.py
│   │   │   ├── report_service.py
│   │   │   └── benchmark_service.py
│   │   ├── ai/                         # AI pipeline
│   │   │   ├── claude_client.py        # Anthropic API wrapper (retry, cache, audit)
│   │   │   ├── scoring/
│   │   │   │   ├── orchestrator.py     # Coordinates all scorer types
│   │   │   │   ├── numeric.py          # Algorithmic scoring (PhD%, SSR, etc.)
│   │   │   │   ├── binary.py           # Yes/No + evidence quality
│   │   │   │   ├── text.py             # Claude API rubric evaluation
│   │   │   │   ├── timeseries.py       # Multi-year trend scoring
│   │   │   │   ├── consistency.py      # Cross-item validation
│   │   │   │   └── rubrics/            # YAML configs per theme
│   │   │   ├── reports/
│   │   │   │   ├── orchestrator.py     # Section-by-section generation
│   │   │   │   ├── sections.py         # Per-section Claude prompts
│   │   │   │   ├── charts.py           # matplotlib SVG generation
│   │   │   │   ├── pdf_renderer.py     # WeasyPrint HTML → PDF
│   │   │   │   └── templates/          # Jinja2 HTML report templates
│   │   │   ├── documents/
│   │   │   │   ├── pipeline.py         # Upload → extract → classify → assess
│   │   │   │   ├── extractor.py        # PyMuPDF + Tesseract OCR
│   │   │   │   ├── classifier.py       # Claude document type classification
│   │   │   │   └── completeness.py     # Requirements checking
│   │   │   ├── predictive/
│   │   │   │   ├── rule_based.py       # Phase 1: expert-defined risk rules
│   │   │   │   ├── ml_models.py        # Phase 2/3: XGBoost / LogReg
│   │   │   │   ├── features.py         # Feature engineering
│   │   │   │   └── explainability.py   # SHAP values
│   │   │   └── prompts/                # All prompt templates
│   │   ├── workers/                    # Celery background tasks
│   │   └── middleware/                 # Tenant isolation, rate limiting
│   ├── tests/
│   ├── pyproject.toml
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/                        # Next.js App Router
│   │   │   ├── (auth)/
│   │   │   │   ├── login/
│   │   │   │   └── register/
│   │   │   └── (dashboard)/
│   │   │       ├── dashboard/          # Overview, scores, charts
│   │   │       ├── assessments/        # List, new, [id]/edit, [id]/review, [id]/report
│   │   │       ├── benchmarks/         # Peer comparison
│   │   │       └── admin/              # Tenant/template management
│   │   ├── components/
│   │   │   ├── forms/
│   │   │   │   ├── AssessmentForm.tsx
│   │   │   │   ├── ThemeSection.tsx
│   │   │   │   └── field-renderers/    # 12 field types
│   │   │   ├── dashboard/              # ScoreOverview, RadarChart, RiskIndicator
│   │   │   └── reports/                # ReportViewer, ExecutiveSummary, ThemeAnalysis
│   │   ├── lib/                        # api-client.ts, types.ts, calculations.ts
│   │   └── hooks/                      # useAutoSave, useAssessment, useFileUpload
│   ├── package.json
│   └── Dockerfile
├── infrastructure/
│   ├── docker-compose.yml              # postgres, redis, minio, backend, frontend, celery
│   └── docker-compose.prod.yml
├── scripts/
│   ├── seed_assessment_template.py     # Load 50+ items from spreadsheet into DB
│   └── seed_demo_data.py
└── .github/workflows/ci.yml
```

---

## Data Model

### Multi-Tenancy Strategy

Shared database with `tenant_id` column on all tables, enforced at three layers:

1. **Application layer** — tenant_id filtering in all queries
2. **Middleware** — sets PostgreSQL session variable per request
3. **PostgreSQL RLS** — row-level security as defence in depth

### Core Tables

#### `tenants` — One per institution

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| name | VARCHAR | |
| slug | VARCHAR | URL-friendly identifier |
| country | VARCHAR | |
| subscription_tier | ENUM | |
| settings | JSONB | Tenant-specific configuration |

#### `users` — Platform accounts

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| tenant_id | UUID | FK → tenants |
| email | VARCHAR | Unique |
| password_hash | VARCHAR | |
| role | ENUM | `platform_admin`, `tenant_admin`, `assessor`, `institution_user`, `reviewer` |

#### `partner_institutions` — Up to 5 per tenant

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| tenant_id | UUID | FK → tenants |
| name | VARCHAR | |
| country | VARCHAR | |
| position | INT | Display order (1-5) |

#### `assessment_templates` → `assessment_themes` → `assessment_items`

Templates are **data-driven** (not hardcoded). Each item defines:

| Property | Description |
|----------|-------------|
| `field_type` | One of 12 types (see below) |
| `field_config` | JSONB — type-specific config (dropdown options, calculation formula, dependent items, etc.) |
| `scoring_rubric` | JSONB — scoring parameters |
| `display_order` | INT — rendering sequence |

**12 Field Types:** `short_text`, `long_text`, `numeric`, `percentage`, `yes_no_conditional`, `dropdown`, `multi_select`, `file_upload`, `multi_year_gender`, `partner_specific`, `auto_calculated`, `salary_bands`

#### `assessments` — One per institution per academic year

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| tenant_id | UUID | FK → tenants |
| template_id | UUID | FK → assessment_templates |
| academic_year | VARCHAR | e.g. "2025-26" |
| status | ENUM | `draft` → `submitted` → `under_review` → `scored` → `report_generated` |
| overall_score | FLOAT | 0-100 |

#### `assessment_responses` — Individual answers

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| assessment_id | UUID | FK → assessments |
| item_id | UUID | FK → assessment_items |
| partner_id | UUID | FK → partner_institutions (nullable) |
| value | JSONB | Typed by parent item's field_type |
| ai_score | FLOAT | |
| ai_feedback | TEXT | |

#### `file_uploads` — Attached to responses

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| tenant_id | UUID | FK → tenants |
| storage_key | VARCHAR | S3 object key |
| document_type | VARCHAR | AI-classified |
| extracted_data | JSONB | Structured extraction results |
| extraction_status | ENUM | Processing state |

#### `theme_scores` — Per theme per assessment

| Column | Type | Notes |
|--------|------|-------|
| assessment_id | UUID | FK → assessments |
| theme_id | UUID | FK → assessment_themes |
| normalised_score | FLOAT | 0-100 |
| weighted_score | FLOAT | |
| ai_analysis | TEXT | |

#### `assessment_reports` — AI-generated

| Column | Type | Notes |
|--------|------|-------|
| assessment_id | UUID | FK → assessments (unique) |
| executive_summary | TEXT | |
| theme_analyses | JSONB | Per-theme breakdown |
| improvement_recommendations | JSONB | Prioritised actions |
| pdf_storage_key | VARCHAR | S3 key for PDF |

#### `benchmark_snapshots` — Anonymised percentile distributions

| Column | Type | Notes |
|--------|------|-------|
| academic_year | VARCHAR | |
| country | VARCHAR | |
| theme_id | UUID | FK → assessment_themes |
| metric_name | VARCHAR | |
| percentile_10/25/50/75/90 | FLOAT | Distribution values |
| sample_size | INT | |

#### `ai_jobs` — Async job tracking

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| assessment_id | UUID | FK → assessments |
| job_type | VARCHAR | |
| status | ENUM | `queued` → `processing` → `completed` / `failed` |
| result_data | JSONB | |

---

## AI Pipeline Architecture

All AI operations run as **Celery background tasks** (Redis broker). The pipeline chains:

```
Assessment Submission
        │
        ▼
┌──────────────────────┐
│  Document Intelligence│   Automatic on file upload
│  (Claude API)         │   Extract → Classify → Check completeness
└──────────────────────┘
        │
        ▼
┌──────────────────────┐
│  Scoring Engine       │   Triggered by reviewer
│  (Algorithmic +       │   Numeric items: pure math (~30 items)
│   Claude API)         │   Free-text items: LLM rubric eval (~15 items)
└──────────────────────┘   Consistency check: 1 final Claude call
        │
        ├───────────────────┐
        ▼                   ▼
┌───────────────┐   ┌───────────────┐
│  Report Gen   │   │  Predictive   │
│  (Claude API) │   │  Models       │
│  7 sections   │   │  (rule-based  │
│  → HTML → PDF │   │   → XGBoost)  │
└───────────────┘   └───────────────┘
```

### AI Feature 1: Scoring & Analysis

**Numeric items** (PhD%, SSR, retention, salary bands)
- Scored algorithmically against configurable ranges in YAML rubrics
- No LLM cost

**Free-text items** (~15 items)
- Claude API evaluates against 4 rubric dimensions:
  - Relevance (0-25)
  - Specificity (0-25)
  - Evidence of Quality (0-25)
  - Comprehensiveness (0-25)
- `temperature=0`, pinned model version for reproducibility
- Results cached by content hash (7-day TTL)

**Time-series items** (student numbers, placements over 4 years)
- Scored on absolute value + trend (linear regression slope)
- Declining trends receive penalties

**Binary items** (Yes/No + evidence)
- Simple: Yes = 100 / No = 0
- With evidence: `0.3 × binary + 0.7 × evidence_quality`

**Consistency checker**
- Rules engine (~20 cross-item rules) + 1 Claude call for cross-theme inconsistency detection

**Theme aggregation**
- Items → weighted item scores → theme score (0-100) → weighted overall score

| Theme | Weight |
|-------|--------|
| Teaching & Learning | 25% |
| Student Experience | 25% |
| Governance | 20% |
| Impact | 15% |
| Financial | 15% |

**Cost:** ~$0.11 per assessment scoring (~16 Claude API calls using Sonnet)

### AI Feature 2: Report Generation

Generates section-by-section via Claude API:

1. **Executive Summary** — ~500 words, flowing prose, citing specific data
2. **Theme Analysis × 5** — scores, strengths, weaknesses, vs benchmarks
3. **Recommendations** — 6-8 prioritised actions with rationale

PDF via WeasyPrint (HTML/CSS → PDF). Charts as inline SVGs via matplotlib.

Reports are **versioned** (never mutated). Regeneration creates a new version.

**Cost:** ~$0.12 per report (~7 Claude API calls)

### AI Feature 3: Document Intelligence

Triggered automatically on file upload:

1. **Extract text** — PyMuPDF for native PDFs, Tesseract OCR for scans
2. **Classify** — Claude identifies document type (ToR, SOP, org chart, policy, etc.)
3. **Extract structured data** — type-specific prompts pull key fields (board members, meeting frequency, key provisions, etc.)
4. **Check completeness** — does this document satisfy the assessment item's requirements?

Handles non-English documents (Claude supports 100+ languages). Flags low-quality scans.

**Cost:** ~$0.025 per document, ~$0.10 per assessment (3-4 docs)

### AI Feature 4: Predictive Models

| Phase | Trigger | Approach |
|-------|---------|----------|
| **Phase 1** | Day 1 (0-50 assessments) | Rule-based risk engine with expert-defined thresholds |
| **Phase 2** | 50-200 assessments | Logistic regression on score decline / expert labels |
| **Phase 3** | 200+ assessments | XGBoost with calibrated probabilities, 80-120 features, SHAP explanations |

Phase 1 risk rules (examples):
- Financial score < 40 → high risk
- Staff tenure < 2yr + >50% fixed contracts → high risk
- 6 risk factors, weighted → 0-1 risk score with top contributing factors

**Cost:** $0 (no LLM — pure ML/rules, millisecond latency)

### Total AI Cost per Assessment: ~$0.33

| Volume | Monthly Cost |
|--------|-------------|
| 100 assessments/month | ~$36 |
| 1,000 assessments/month | ~$360 |

---

## Authentication & Multi-Tenancy

### JWT Authentication

- **RS256** signed tokens
- **Access token:** 15-minute expiry, stored in memory
- **Refresh token:** 7-day expiry, HttpOnly cookie

### Tenant Isolation (3 layers)

1. App-level `tenant_id` filtering on all queries
2. Middleware sets PostgreSQL session variable per request
3. PostgreSQL RLS as safety net

### GDPR Compliance

- Tenant-scoped S3 prefixes
- Benchmark data is anonymised percentiles only
- Data export + deletion endpoints

---

## API Endpoints

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Login |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Logout |

### Tenants & Partners

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/tenants` | List / create tenants |
| GET/PUT | `/tenants/current` | Current tenant profile |
| GET/POST/PUT/DELETE | `/partners` | Partner institution CRUD |

### Templates & Assessments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/templates` | List templates |
| GET | `/templates/{id}/themes/{id}/items` | Template structure |
| GET/POST | `/assessments` | List / create assessments |
| POST | `/assessments/{id}/submit` | Submit for review |
| POST | `/assessments/{id}/trigger-scoring` | Trigger AI scoring |
| POST | `/assessments/{id}/generate-report` | Generate AI report |

### Responses & Files

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/PUT | `/assessments/{id}/responses/{item_id}` | Save/retrieve (auto-save) |
| PUT | `/responses/bulk` | Bulk update |
| POST | `/assessments/{id}/files` | Upload file |
| GET | `/files/{id}/download` | Download file |
| GET | `/files/{id}/extraction` | View extraction results |

### Scoring, Reports & Benchmarks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/assessments/{id}/scores` | All scores |
| GET | `/scores/themes/{theme_id}` | Theme detail |
| GET | `/assessments/{id}/report` | View report |
| GET | `/assessments/{id}/report/pdf` | Download PDF |
| POST | `/assessments/{id}/report/regenerate` | Regenerate report |
| GET | `/benchmarks/compare` | Peer comparison |
| GET | `/benchmarks/metrics/{name}` | Single metric benchmark |

### Predictions & Jobs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/assessments/{id}/risk` | Risk assessment |
| GET | `/assessments/{id}/predictions` | Predictive model output |
| GET | `/jobs/{job_id}` | Poll async AI job status |

---

## Frontend Key Flows

### Assessment Form (most complex page)

Dynamic form renderer with:

- **ThemeNavigation** sidebar tabs
- **ThemeSection** renders items per theme
- Delegates to **12 field-renderer components**
- **Auto-save** via debounced PUT (2s delay)
- Auto-calculated fields compute locally for instant feedback; backend returns authoritative value

### Dashboard

- Score gauge
- Theme radar chart
- Risk indicator
- Assessment status cards
- Trend lines

### Report Viewer

- Collapsible sections
- Benchmarking charts (institution vs peer percentiles)
- Improvement roadmap
- PDF download

### Benchmarks

- Radar overlay (your scores vs median / 75th percentile)
- Per-metric bar charts
- Country filter

---

## Implementation Phases

### Phase 1: Foundation — Weeks 1-4

- [ ] Project scaffolding: FastAPI + SQLAlchemy + Alembic + Docker Compose (postgres, redis, minio)
- [ ] Data models: tenants, users, templates, themes, items, assessments, responses, file_uploads
- [ ] Auth: JWT login/refresh/logout, role-based access, tenant middleware
- [ ] Assessment CRUD + response save/retrieve (all 12 field types)
- [ ] Auto-calculation service (SSR, gender %, PhD %, etc.)
- [ ] File upload to S3
- [ ] Seed script: all 50+ assessment items from the spreadsheet
- [ ] Next.js scaffold: login, dashboard layout, assessment list, assessment form with all field renderers, auto-save

### Phase 2: Workflow & Document Intelligence — Weeks 5-8

- [ ] Assessment state machine (`draft` → `submitted` → `under_review` → `scored` → `report_generated`)
- [ ] Reviewer role + review endpoints
- [ ] Celery + Redis worker setup
- [ ] Document intelligence pipeline (upload triggers: extract → classify → extract structured → completeness)
- [ ] Claude API client wrapper (retry, cost tracking, caching)
- [ ] AI job tracking
- [ ] Frontend: submission flow, review page, document status indicators, extraction results, progress indicators

### Phase 3: AI Scoring & Reports — Weeks 9-12

- [ ] Scoring engine: numeric + binary + text (Claude) + timeseries + multi-select scorers
- [ ] Theme score aggregation + consistency checker
- [ ] Report generation: section-by-section Claude → Jinja2 HTML → WeasyPrint PDF
- [ ] Scoring rubric YAML configs for all 50+ items
- [ ] Frontend: score results view, AI feedback, report viewer, radar chart, PDF download

### Phase 4: Benchmarking & Predictive Models — Weeks 13-16

- [ ] Benchmark computation (anonymised percentile snapshots from completed assessments)
- [ ] Benchmark API + comparison endpoints
- [ ] Rule-based risk scoring engine (6 weighted risk factors)
- [ ] Feature engineering pipeline + ML model scaffolding
- [ ] SHAP explanations
- [ ] Frontend: benchmarks page, risk dashboard, trajectory charts

### Phase 5: Production Hardening — Weeks 17-20

- [ ] GDPR: data export, deletion pipeline, audit logging
- [ ] PostgreSQL RLS (defence in depth)
- [ ] Rate limiting, performance optimisation
- [ ] CI/CD (GitHub Actions: lint, test, build, deploy)
- [ ] Production deployment (ECS Fargate or simpler VPS + Docker Compose)
- [ ] Onboarding flow, admin panel, accessibility audit

---

## Verification Plan

| # | Test | What to Verify |
|---|------|---------------|
| 1 | **Seed + fill** | Run `seed_assessment_template.py`, create a test institution, fill all 50+ items with realistic data |
| 2 | **Auto-calculations** | SSR, gender %, PhD %, flying faculty % all compute correctly |
| 3 | **Document upload** | Upload sample ToR, SOP, safeguarding policy → verify extraction + classification |
| 4 | **Scoring** | Trigger scoring → numeric scores match rubric ranges, text scores are 0-100 with feedback, consistency flags fire on contradictory data |
| 5 | **Report** | Generate report → all sections populated, PDF renders correctly, benchmarking section shows "insufficient peer data" gracefully |
| 6 | **Predictions** | Rule-based risk engine returns reasonable risk scores with factor breakdown |
| 7 | **Multi-tenancy** | Create 2 tenants → verify complete data isolation (no cross-tenant leakage) |
| 8 | **Auth** | Role-based access (institution_user can't trigger scoring, reviewer can) |
| 9 | **End-to-end** | Full flow: register → create assessment → fill form → upload docs → submit → review → score → generate report → download PDF → view benchmarks |
