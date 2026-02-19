from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


# ---------------------------------------------------------------------------
# Template / Theme / Item response schemas
# ---------------------------------------------------------------------------

class ItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    code: str
    label: str
    description: str | None = None
    field_type: str
    field_config: dict | None = None
    scoring_rubric: dict | None = None
    weight: float
    is_required: bool
    display_order: int
    depends_on: str | None = None


class ThemeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    slug: str
    description: str | None = None
    weight: float
    display_order: int
    items: list[ItemResponse] = []


class AssessmentTemplateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    version: str
    description: str | None = None
    is_active: bool
    themes: list[ThemeResponse] = []


# ---------------------------------------------------------------------------
# Assessment CRUD schemas
# ---------------------------------------------------------------------------

class AssessmentCreate(BaseModel):
    template_id: uuid.UUID
    academic_year: str


class AssessmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    template_id: uuid.UUID
    academic_year: str
    status: str
    overall_score: float | None = None
    submitted_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class AssessmentListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    academic_year: str
    status: str
    overall_score: float | None = None
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# Assessment Response (answer) schemas
# ---------------------------------------------------------------------------

class ResponseSave(BaseModel):
    item_id: uuid.UUID
    partner_id: uuid.UUID | None = None
    value: dict | None = None


class ResponseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    assessment_id: uuid.UUID
    item_id: uuid.UUID
    partner_id: uuid.UUID | None = None
    value: dict | None = None
    ai_score: float | None = None
    ai_feedback: str | None = None
    created_at: datetime
    updated_at: datetime


class BulkResponseSave(BaseModel):
    responses: list[ResponseSave]
