"""Assessment response (answer) save/retrieve endpoints."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user, get_tenant
from app.models.assessment import Assessment, AssessmentItem, AssessmentResponse
from app.models.tenant import Tenant
from app.models.user import User
from app.schemas.assessment import BulkResponseSave, ResponseOut, ResponseSave
from app.services.calculation_service import run_auto_calculations

router = APIRouter(prefix="/assessments/{assessment_id}/responses")


async def _get_assessment_or_404(
    db: AsyncSession, assessment_id: uuid.UUID, tenant_id: uuid.UUID
) -> Assessment:
    result = await db.execute(
        select(Assessment).where(
            Assessment.id == assessment_id, Assessment.tenant_id == tenant_id
        )
    )
    assessment = result.scalar_one_or_none()
    if not assessment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found")
    if assessment.status not in ("draft", "under_review"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot edit responses when status is '{assessment.status}'",
        )
    return assessment


@router.get("", response_model=list[ResponseOut])
async def list_responses(
    assessment_id: uuid.UUID,
    tenant: Tenant = Depends(get_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Get all responses for an assessment."""
    # Verify tenant owns this assessment
    result = await db.execute(
        select(Assessment).where(
            Assessment.id == assessment_id, Assessment.tenant_id == tenant.id
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found")

    responses = await db.execute(
        select(AssessmentResponse).where(AssessmentResponse.assessment_id == assessment_id)
    )
    return responses.scalars().all()


@router.put("/{item_id}", response_model=ResponseOut)
async def save_response(
    assessment_id: uuid.UUID,
    item_id: uuid.UUID,
    body: ResponseSave,
    tenant: Tenant = Depends(get_tenant),
    _user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Save or update a single response (auto-save endpoint)."""
    assessment = await _get_assessment_or_404(db, assessment_id, tenant.id)

    # Verify item exists
    item_result = await db.execute(select(AssessmentItem).where(AssessmentItem.id == item_id))
    item = item_result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

    # Upsert response
    result = await db.execute(
        select(AssessmentResponse).where(
            AssessmentResponse.assessment_id == assessment.id,
            AssessmentResponse.item_id == item_id,
            AssessmentResponse.partner_id == body.partner_id,
        )
    )
    response = result.scalar_one_or_none()

    if response:
        response.value = body.value
    else:
        response = AssessmentResponse(
            assessment_id=assessment.id,
            item_id=item_id,
            partner_id=body.partner_id,
            value=body.value,
        )
        db.add(response)

    await db.flush()

    # Trigger auto-calculations if this item feeds into a calculated field
    if item.field_type == "auto_calculated" and item.field_config:
        # Get all responses for this assessment to use as calculation inputs
        all_resp_result = await db.execute(
            select(AssessmentResponse, AssessmentItem)
            .join(AssessmentItem)
            .where(AssessmentResponse.assessment_id == assessment.id)
        )
        resp_map = {}
        for resp_row, item_row in all_resp_result.all():
            resp_map[item_row.code] = resp_row.value or {}
        calculated = run_auto_calculations(item.code, resp_map)
        if calculated is not None:
            response.value = {"value": calculated}
            await db.flush()

    return response


@router.put("", response_model=list[ResponseOut])
async def bulk_save_responses(
    assessment_id: uuid.UUID,
    body: BulkResponseSave,
    tenant: Tenant = Depends(get_tenant),
    _user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Bulk save multiple responses at once."""
    assessment = await _get_assessment_or_404(db, assessment_id, tenant.id)

    saved = []
    for resp_data in body.responses:
        result = await db.execute(
            select(AssessmentResponse).where(
                AssessmentResponse.assessment_id == assessment.id,
                AssessmentResponse.item_id == resp_data.item_id,
                AssessmentResponse.partner_id == resp_data.partner_id,
            )
        )
        response = result.scalar_one_or_none()

        if response:
            response.value = resp_data.value
        else:
            response = AssessmentResponse(
                assessment_id=assessment.id,
                item_id=resp_data.item_id,
                partner_id=resp_data.partner_id,
                value=resp_data.value,
            )
            db.add(response)
        saved.append(response)

    await db.flush()
    return saved
