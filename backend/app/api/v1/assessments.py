"""Assessment CRUD and workflow endpoints."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import get_current_user, get_tenant, require_role
from app.models.assessment import Assessment, AssessmentTemplate, AssessmentTheme
from app.models.tenant import Tenant
from app.models.user import User
from app.schemas.assessment import (
    AssessmentCreate,
    AssessmentListResponse,
    AssessmentOut,
    AssessmentTemplateResponse,
)
from app.services.assessment_service import (
    create_assessment,
    get_assessment,
    list_assessments,
    submit_assessment,
    update_status,
)

router = APIRouter(prefix="/assessments")


# ---------------------------------------------------------------------------
# Templates
# ---------------------------------------------------------------------------

@router.get("/templates", response_model=list[AssessmentTemplateResponse])
async def list_templates(
    _user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all active assessment templates with their themes and items."""
    result = await db.execute(
        select(AssessmentTemplate)
        .where(AssessmentTemplate.is_active.is_(True))
        .options(selectinload(AssessmentTemplate.themes).selectinload(AssessmentTheme.items))
    )
    return result.scalars().unique().all()


@router.get("/templates/{template_id}", response_model=AssessmentTemplateResponse)
async def get_template(
    template_id: uuid.UUID,
    _user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single assessment template with all themes and items."""
    result = await db.execute(
        select(AssessmentTemplate)
        .where(AssessmentTemplate.id == template_id)
        .options(selectinload(AssessmentTemplate.themes).selectinload(AssessmentTheme.items))
    )
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
    return template


# ---------------------------------------------------------------------------
# Assessment CRUD
# ---------------------------------------------------------------------------

@router.get("", response_model=list[AssessmentListResponse])
async def list_assessments_endpoint(
    tenant: Tenant = Depends(get_tenant),
    db: AsyncSession = Depends(get_db),
):
    """List all assessments for the current tenant."""
    return await list_assessments(db, tenant.id)


@router.post("", response_model=AssessmentOut, status_code=status.HTTP_201_CREATED)
async def create_assessment_endpoint(
    body: AssessmentCreate,
    tenant: Tenant = Depends(get_tenant),
    _user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new assessment for the current tenant."""
    return await create_assessment(db, tenant.id, body.template_id, body.academic_year)


@router.get("/{assessment_id}", response_model=AssessmentOut)
async def get_assessment_endpoint(
    assessment_id: uuid.UUID,
    tenant: Tenant = Depends(get_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific assessment."""
    assessment = await get_assessment(db, assessment_id, tenant.id)
    if not assessment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found")
    return assessment


# ---------------------------------------------------------------------------
# Workflow
# ---------------------------------------------------------------------------

@router.post("/{assessment_id}/submit", response_model=AssessmentOut)
async def submit_assessment_endpoint(
    assessment_id: uuid.UUID,
    tenant: Tenant = Depends(get_tenant),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Submit an assessment for review."""
    return await submit_assessment(db, assessment_id, tenant.id, current_user.id)


@router.post("/{assessment_id}/status/{new_status}", response_model=AssessmentOut)
async def change_status_endpoint(
    assessment_id: uuid.UUID,
    new_status: str,
    tenant: Tenant = Depends(get_tenant),
    _user: User = Depends(require_role("platform_admin", "tenant_admin", "reviewer")),
    db: AsyncSession = Depends(get_db),
):
    """Change assessment status (reviewer/admin only)."""
    return await update_status(db, assessment_id, tenant.id, new_status)
