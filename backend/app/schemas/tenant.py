from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


# ---------------------------------------------------------------------------
# Tenant schemas
# ---------------------------------------------------------------------------

class TenantCreate(BaseModel):
    name: str
    slug: str
    country: str
    institution_type: str | None = None
    subscription_tier: str | None = "free"


class TenantUpdate(BaseModel):
    name: str | None = None
    country: str | None = None
    institution_type: str | None = None
    settings: dict | None = None


class TenantResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    slug: str
    country: str
    institution_type: str | None = None
    subscription_tier: str
    settings: dict | None = None
    is_active: bool
    created_at: datetime


# ---------------------------------------------------------------------------
# Partner Institution schemas
# ---------------------------------------------------------------------------

class PartnerCreate(BaseModel):
    name: str
    country: str
    position: int | None = None


class PartnerUpdate(BaseModel):
    name: str | None = None
    country: str | None = None
    position: int | None = None


class PartnerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    name: str
    country: str
    position: int
    is_active: bool
    created_at: datetime
