from __future__ import annotations

import uuid

from pydantic import BaseModel, ConfigDict


class BenchmarkCompareRequest(BaseModel):
    academic_year: str
    country: str | None = None
    theme_id: uuid.UUID | None = None


class BenchmarkMetric(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    metric_name: str
    percentile_10: float | None = None
    percentile_25: float | None = None
    percentile_50: float | None = None
    percentile_75: float | None = None
    percentile_90: float | None = None
    sample_size: int
    institution_value: float | None = None


class BenchmarkCompareResponse(BaseModel):
    academic_year: str
    country: str | None = None
    metrics: list[BenchmarkMetric] = []
