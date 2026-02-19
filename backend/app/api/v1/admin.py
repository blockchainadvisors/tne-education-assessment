"""Admin endpoints for platform management."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_role
from app.models.assessment import Assessment
from app.models.tenant import Tenant
from app.models.user import User

router = APIRouter(prefix="/admin")


@router.get("/stats")
async def platform_stats(
    _user: User = Depends(require_role("platform_admin")),
    db: AsyncSession = Depends(get_db),
):
    """Get platform-wide statistics (platform_admin only)."""
    tenants_count = await db.execute(select(func.count(Tenant.id)))
    users_count = await db.execute(select(func.count(User.id)))
    assessments_count = await db.execute(select(func.count(Assessment.id)))

    return {
        "total_tenants": tenants_count.scalar(),
        "total_users": users_count.scalar(),
        "total_assessments": assessments_count.scalar(),
    }


@router.get("/tenants", response_model=list)
async def list_all_tenants(
    _user: User = Depends(require_role("platform_admin")),
    db: AsyncSession = Depends(get_db),
):
    """List all tenants (platform_admin only)."""
    result = await db.execute(select(Tenant).order_by(Tenant.created_at.desc()))
    tenants = result.scalars().all()
    return [
        {
            "id": str(t.id),
            "name": t.name,
            "slug": t.slug,
            "country": t.country,
            "subscription_tier": t.subscription_tier,
            "is_active": t.is_active,
            "created_at": t.created_at.isoformat() if t.created_at else None,
        }
        for t in tenants
    ]
