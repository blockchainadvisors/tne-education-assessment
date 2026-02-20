from __future__ import annotations

import uuid

from pydantic import BaseModel, ConfigDict


class ItemScoreResponse(BaseModel):
    item_code: str
    item_label: str
    field_type: str
    ai_score: float | None = None
    ai_feedback: str | None = None


class ThemeScoreResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    theme_id: uuid.UUID
    theme_name: str = ""
    theme_code: str = ""
    normalised_score: float | None = None
    weighted_score: float | None = None
    score: float | None = None
    max_score: float = 100.0
    percentage: float = 0.0
    ai_analysis: str | None = None
    item_scores: list[ItemScoreResponse] = []


class AssessmentScoresResponse(BaseModel):
    assessment_id: uuid.UUID
    overall_score: float | None = None
    overall_max_score: float = 100.0
    overall_percentage: float = 0.0
    theme_scores: list[ThemeScoreResponse] = []
    scored_at: str | None = None
