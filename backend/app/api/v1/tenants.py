"""Tenant and partner institution management endpoints."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user, get_tenant, require_role
from app.models.tenant import Tenant, PartnerInstitution
from app.models.user import User
from app.schemas.tenant import (
    TenantResponse,
    TenantUpdate,
    PartnerCreate,
    PartnerResponse,
    PartnerUpdate,
)

router = APIRouter(prefix="/tenants")


@router.get("/current", response_model=TenantResponse)
async def get_current_tenant(tenant: Tenant = Depends(get_tenant)):
    """Get the current user's tenant."""
    return tenant


@router.put("/current", response_model=TenantResponse)
async def update_current_tenant(
    body: TenantUpdate,
    tenant: Tenant = Depends(get_tenant),
    _user: User = Depends(require_role("platform_admin", "tenant_admin")),
    db: AsyncSession = Depends(get_db),
):
    """Update the current tenant's details."""
    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(tenant, key, value)
    await db.flush()
    return tenant


# ---------------------------------------------------------------------------
# Partners
# ---------------------------------------------------------------------------

@router.get("/current/partners", response_model=list[PartnerResponse])
async def list_partners(
    tenant: Tenant = Depends(get_tenant),
    db: AsyncSession = Depends(get_db),
):
    """List all partner institutions for the current tenant."""
    result = await db.execute(
        select(PartnerInstitution)
        .where(PartnerInstitution.tenant_id == tenant.id, PartnerInstitution.is_active.is_(True))
        .order_by(PartnerInstitution.position)
    )
    return result.scalars().all()


@router.post("/current/partners", response_model=PartnerResponse, status_code=status.HTTP_201_CREATED)
async def create_partner(
    body: PartnerCreate,
    tenant: Tenant = Depends(get_tenant),
    _user: User = Depends(require_role("platform_admin", "tenant_admin")),
    db: AsyncSession = Depends(get_db),
):
    """Add a partner institution (max 5 per tenant)."""
    # Check count
    result = await db.execute(
        select(PartnerInstitution).where(
            PartnerInstitution.tenant_id == tenant.id,
            PartnerInstitution.is_active.is_(True),
        )
    )
    if len(result.scalars().all()) >= 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum of 5 partner institutions allowed",
        )

    partner = PartnerInstitution(tenant_id=tenant.id, **body.model_dump())
    db.add(partner)
    await db.flush()
    return partner


@router.put("/current/partners/{partner_id}", response_model=PartnerResponse)
async def update_partner(
    partner_id: uuid.UUID,
    body: PartnerUpdate,
    tenant: Tenant = Depends(get_tenant),
    _user: User = Depends(require_role("platform_admin", "tenant_admin")),
    db: AsyncSession = Depends(get_db),
):
    """Update a partner institution."""
    result = await db.execute(
        select(PartnerInstitution).where(
            PartnerInstitution.id == partner_id,
            PartnerInstitution.tenant_id == tenant.id,
        )
    )
    partner = result.scalar_one_or_none()
    if not partner:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Partner not found")

    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(partner, key, value)
    await db.flush()
    return partner


@router.delete("/current/partners/{partner_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_partner(
    partner_id: uuid.UUID,
    tenant: Tenant = Depends(get_tenant),
    _user: User = Depends(require_role("platform_admin", "tenant_admin")),
    db: AsyncSession = Depends(get_db),
):
    """Soft-delete a partner institution."""
    result = await db.execute(
        select(PartnerInstitution).where(
            PartnerInstitution.id == partner_id,
            PartnerInstitution.tenant_id == tenant.id,
        )
    )
    partner = result.scalar_one_or_none()
    if not partner:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Partner not found")
    partner.is_active = False
    await db.flush()
