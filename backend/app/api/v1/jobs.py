"""AI job status endpoints for polling background task progress."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.ai_job import AIJob
from app.models.assessment import Assessment
from app.models.user import User
from app.schemas.ai_job import AIJobResponse

router = APIRouter(prefix="/jobs")


@router.get("/{job_id}", response_model=AIJobResponse)
async def get_job_status(
    job_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the status of an AI background job."""
    result = await db.execute(
        select(AIJob)
        .join(Assessment, AIJob.assessment_id == Assessment.id)
        .where(AIJob.id == job_id, Assessment.tenant_id == user.tenant_id)
    )
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    return job
