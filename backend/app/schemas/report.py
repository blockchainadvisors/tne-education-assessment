from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    assessment_id: uuid.UUID
    version: int
    executive_summary: str | None = None
    theme_analyses: dict | None = None
    improvement_recommendations: dict | None = None
    pdf_storage_key: str | None = None
    created_at: datetime
