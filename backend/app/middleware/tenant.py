"""Tenant isolation utilities for PostgreSQL RLS."""

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def set_tenant_context(db: AsyncSession, tenant_id: str) -> None:
    """Set the current tenant context for PostgreSQL RLS policies.

    This should be called at the start of any request that needs
    tenant-scoped data access via Row-Level Security.
    """
    await db.execute(
        text("SET LOCAL app.current_tenant_id = :tid"),
        {"tid": str(tenant_id)},
    )
