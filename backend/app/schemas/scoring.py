from __future__ import annotations

import uuid

from pydantic import BaseModel, ConfigDict


class ThemeScoreResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    theme_id: uuid.UUID
    normalised_score: float | None = None
    weighted_score: float | None = None
    ai_analysis: str | None = None


class AssessmentScoresResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    assessment_id: uuid.UUID
    overall_score: float | None = None
    theme_scores: list[ThemeScoreResponse] = []
