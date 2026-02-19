"""Benchmarking comparison endpoints."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_tenant
from app.models.assessment import Assessment
from app.models.tenant import Tenant
from app.schemas.benchmark import BenchmarkCompareResponse, BenchmarkMetric
from app.services.benchmark_service import get_benchmark_comparison

router = APIRouter(prefix="/benchmarks")


@router.get("/compare/{assessment_id}", response_model=BenchmarkCompareResponse)
async def compare_assessment(
    assessment_id: uuid.UUID,
    country: str | None = None,
    tenant: Tenant = Depends(get_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Compare an assessment's scores against anonymised peer benchmarks."""
    result = await db.execute(
        select(Assessment).where(
            Assessment.id == assessment_id, Assessment.tenant_id == tenant.id
        )
    )
    assessment = result.scalar_one_or_none()
    if not assessment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found")

    comparisons = await get_benchmark_comparison(
        db,
        assessment_id=assessment_id,
        academic_year=assessment.academic_year,
        country=country,
    )

    metrics = [
        BenchmarkMetric(
            metric_name=c["metric_name"],
            percentile_10=c["percentile_10"],
            percentile_25=c["percentile_25"],
            percentile_50=c["percentile_50"],
            percentile_75=c["percentile_75"],
            percentile_90=c["percentile_90"],
            sample_size=c["sample_size"],
            institution_value=c["institution_value"],
        )
        for c in comparisons
    ]

    return BenchmarkCompareResponse(
        academic_year=assessment.academic_year,
        country=country,
        metrics=metrics,
    )
