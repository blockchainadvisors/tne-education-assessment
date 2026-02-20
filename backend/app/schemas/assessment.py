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
    theme_id: uuid.UUID | None = None
    code: str
    label: str
    description: str | None = None
    help_text: str | None = None
    field_type: str
    field_config: dict | None = None
    scoring_rubric: dict | None = None
    weight: float
    is_required: bool
    display_order: int
    depends_on: str | None = None

    # Frontend-compatible aliases extracted from field_config
    order: int = 0
    options: list | None = None
    validation: dict | None = None
    sub_fields: list | None = None
    calculation_formula: str | None = None
    is_scoreable: bool = False
    max_score: float | None = None
    scoring_criteria: dict | None = None

    def model_post_init(self, __context: object) -> None:
        fc = self.field_config or {}
        self.order = self.display_order
        self.is_scoreable = self.scoring_rubric is not None
        self.scoring_criteria = self.scoring_rubric

        # Extract options for multi_select / dropdown
        if "options" in fc:
            raw_opts = fc["options"]
            self.options = [
                {"label": o, "value": o} if isinstance(o, str) else o
                for o in raw_opts
            ]

        # Build validation dict from field_config constraints
        validation: dict = {}
        if self.is_required:
            validation["required"] = True
        for key in ("min", "min_value"):
            if key in fc:
                validation["min_value"] = fc[key]
        for key in ("max", "max_value"):
            if key in fc:
                validation["max_value"] = fc[key]
        if "max_length" in fc:
            validation["max_length"] = fc["max_length"]
        if "accepted_types" in fc:
            validation["allowed_file_types"] = fc["accepted_types"]
        if "max_size_mb" in fc:
            validation["max_file_size_mb"] = fc["max_size_mb"]
        if validation:
            self.validation = validation

        # Extract calculation formula
        if "formula" in fc:
            self.calculation_formula = fc["formula"]

        # Extract depends_on as list for frontend
        if "depends_on" in fc:
            self.depends_on = fc["depends_on"]  # type: ignore[assignment]

        # Build sub_fields for complex types
        if self.field_type == "multi_year_gender":
            self.sub_fields = [{
                "key": "years",
                "label": fc.get("label", "Value"),
                "field_type": "numeric",
            }]
        elif self.field_type == "salary_bands":
            bands = fc.get("bands", [])
            currencies = fc.get("currencies", [])
            self.sub_fields = [{
                "key": "bands",
                "label": "Salary Bands",
                "field_type": "salary_bands",
                "options": [{"label": b, "value": b} for b in bands],
                "currencies": currencies,
            }]


class ThemeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    template_id: uuid.UUID | None = None
    name: str
    slug: str
    description: str | None = None
    weight: float
    display_order: int
    items: list[ItemResponse] = []

    # Frontend-compatible aliases
    code: str = ""
    order: int = 0
    max_score: float | None = None

    def model_post_init(self, __context: object) -> None:
        self.code = self.slug
        self.order = self.display_order


class AssessmentTemplateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    version: str
    description: str | None = None
    is_active: bool
    themes: list[ThemeResponse] = []
    created_at: datetime | None = None


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
    tenant_id: uuid.UUID
    template_id: uuid.UUID
    academic_year: str
    status: str
    overall_score: float | None = None
    submitted_at: datetime | None = None
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
