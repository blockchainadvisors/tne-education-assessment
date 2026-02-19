"""Seed the database with E2E test data.

Creates verified users (email_verified=True) for each role so that
Playwright tests can log in immediately without going through email
verification.

Run: cd backend && python -m scripts.seed_e2e_data
Reset: cd backend && python -m scripts.seed_e2e_data --reset
"""

import asyncio
import sys
from datetime import datetime, timezone
from pathlib import Path

from passlib.context import CryptContext

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from app.database import engine, async_session_factory, Base  # noqa: E402
from app.models.tenant import Tenant, PartnerInstitution  # noqa: E402
from app.models.user import User  # noqa: E402
from app.models.assessment import Assessment, AssessmentTemplate  # noqa: E402

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ---------------------------------------------------------------------------
# E2E test data constants (must match e2e/fixtures/test-data.ts)
# ---------------------------------------------------------------------------

E2E_TENANT_SLUG = "e2e-test-university"
E2E_TENANT_2_SLUG = "e2e-other-institute"

USERS_DATA = [
    {
        "email": "e2e-admin@demo-university.ac.uk",
        "password": "TestPass123!",
        "full_name": "E2E Admin User",
        "role": "tenant_admin",
        "tenant_slug": E2E_TENANT_SLUG,
    },
    {
        "email": "e2e-assessor@demo-university.ac.uk",
        "password": "TestPass123!",
        "full_name": "E2E Assessor User",
        "role": "assessor",
        "tenant_slug": E2E_TENANT_SLUG,
    },
    {
        "email": "e2e-reviewer@demo-university.ac.uk",
        "password": "TestPass123!",
        "full_name": "E2E Reviewer User",
        "role": "reviewer",
        "tenant_slug": E2E_TENANT_SLUG,
    },
    {
        "email": "e2e-platform@tne-academy.com",
        "password": "AdminPass123!",
        "full_name": "E2E Platform Admin",
        "role": "platform_admin",
        "tenant_slug": E2E_TENANT_SLUG,
    },
]

PARTNERS_DATA = [
    {"name": "E2E Partner Singapore", "country": "Singapore", "position": 1},
    {"name": "E2E Partner Malaysia", "country": "Malaysia", "position": 2},
]


async def reset_e2e_data(session):
    """Remove all E2E test data."""
    from sqlalchemy import select, delete

    # Find E2E tenants
    for slug in [E2E_TENANT_SLUG, E2E_TENANT_2_SLUG]:
        result = await session.execute(select(Tenant).where(Tenant.slug == slug))
        tenant = result.scalar_one_or_none()
        if tenant:
            # Delete users for this tenant
            await session.execute(
                delete(User).where(User.tenant_id == tenant.id)
            )
            # Delete partners for this tenant
            await session.execute(
                delete(PartnerInstitution).where(
                    PartnerInstitution.tenant_id == tenant.id
                )
            )
            # Delete assessments for this tenant
            await session.execute(
                delete(Assessment).where(Assessment.tenant_id == tenant.id)
            )
            # Delete the tenant
            await session.execute(
                delete(Tenant).where(Tenant.id == tenant.id)
            )

    # Also delete any users with e2e emails that may be orphaned
    await session.execute(
        delete(User).where(User.email.like("e2e-%"))
    )

    await session.commit()
    print("E2E data reset complete.")


async def seed():
    reset = "--reset" in sys.argv

    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session_factory() as session:
        if reset:
            await reset_e2e_data(session)

        from sqlalchemy import select

        # Check if E2E data already exists
        result = await session.execute(
            select(Tenant).where(Tenant.slug == E2E_TENANT_SLUG)
        )
        if result.scalar_one_or_none():
            print("E2E data already exists. Use --reset to recreate.")
            return

        # -----------------------------------------------------------------
        # Tenant 1: E2E Test University
        # -----------------------------------------------------------------
        tenant1 = Tenant(
            name="E2E Test University",
            slug=E2E_TENANT_SLUG,
            country="United Kingdom",
            institution_type="University",
            subscription_tier="professional",
        )
        session.add(tenant1)
        await session.flush()

        # -----------------------------------------------------------------
        # Tenant 2: E2E Other Institute (for cross-tenant tests)
        # -----------------------------------------------------------------
        tenant2 = Tenant(
            name="E2E Other Institute",
            slug=E2E_TENANT_2_SLUG,
            country="Australia",
            institution_type="University",
            subscription_tier="free",
        )
        session.add(tenant2)
        await session.flush()

        tenant_map = {
            E2E_TENANT_SLUG: tenant1,
            E2E_TENANT_2_SLUG: tenant2,
        }

        # -----------------------------------------------------------------
        # Users — all email_verified=True and is_active=True
        # -----------------------------------------------------------------
        now = datetime.now(timezone.utc)
        for user_data in USERS_DATA:
            tenant = tenant_map[user_data["tenant_slug"]]
            user = User(
                tenant_id=tenant.id,
                email=user_data["email"],
                password_hash=pwd_context.hash(user_data["password"]),
                full_name=user_data["full_name"],
                role=user_data["role"],
                is_active=True,
                email_verified=True,
                email_verified_at=now,
            )
            session.add(user)

        # Also create a cross-tenant admin for isolation tests
        t2_admin = User(
            tenant_id=tenant2.id,
            email="e2e-admin@other-institute.edu",
            password_hash=pwd_context.hash("TestPass123!"),
            full_name="E2E Other Admin",
            role="tenant_admin",
            is_active=True,
            email_verified=True,
            email_verified_at=now,
        )
        session.add(t2_admin)

        # -----------------------------------------------------------------
        # Partners for Tenant 1
        # -----------------------------------------------------------------
        for p_data in PARTNERS_DATA:
            partner = PartnerInstitution(
                tenant_id=tenant1.id,
                name=p_data["name"],
                country=p_data["country"],
                position=p_data["position"],
            )
            session.add(partner)

        # -----------------------------------------------------------------
        # Create a draft assessment if template exists
        # -----------------------------------------------------------------
        template_result = await session.execute(
            select(AssessmentTemplate).where(
                AssessmentTemplate.is_active.is_(True)
            )
        )
        template = template_result.scalar_one_or_none()

        if template:
            assessment = Assessment(
                tenant_id=tenant1.id,
                template_id=template.id,
                academic_year="2024-2025",
                status="draft",
            )
            session.add(assessment)
            print(f"  Created draft assessment (template: {template.name})")

        await session.commit()

        print("\nE2E seed data created successfully!")
        print(f"  Tenant 1: {tenant1.name} (slug: {tenant1.slug})")
        print(f"  Tenant 2: {tenant2.name} (slug: {tenant2.slug})")
        print(f"  Users created: {len(USERS_DATA) + 1} (all email_verified=True)")
        print(f"  Partners: {len(PARTNERS_DATA)}")
        print()
        print("Credentials:")
        for u in USERS_DATA:
            print(f"  {u['role']:20s} {u['email']:45s} / {u['password']}")


if __name__ == "__main__":
    asyncio.run(seed())
