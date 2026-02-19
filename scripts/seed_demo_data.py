"""Seed the database with demo data for testing.

Creates:
- 2 tenants (for multi-tenancy testing)
- Users with different roles
- Partner institutions
- Sample assessments with responses

Run: cd backend && python -m scripts.seed_demo_data
"""

import asyncio
import sys
import uuid
from pathlib import Path

from passlib.context import CryptContext

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from app.database import engine, async_session_factory, Base  # noqa: E402
from app.models.tenant import Tenant, PartnerInstitution  # noqa: E402
from app.models.user import User  # noqa: E402
from app.models.assessment import Assessment, AssessmentTemplate  # noqa: E402

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def seed():
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session_factory() as session:
        # Check if demo data already exists
        from sqlalchemy import select

        result = await session.execute(select(Tenant).where(Tenant.slug == "demo-university"))
        if result.scalar_one_or_none():
            print("Demo data already exists. Skipping.")
            return

        # Tenant 1: Demo University
        tenant1 = Tenant(
            name="Demo University",
            slug="demo-university",
            country="United Kingdom",
            institution_type="University",
            subscription_tier="professional",
        )
        session.add(tenant1)
        await session.flush()

        # Tenant 2: Global Institute
        tenant2 = Tenant(
            name="Global Institute of Technology",
            slug="global-institute",
            country="United Arab Emirates",
            institution_type="University",
            subscription_tier="enterprise",
        )
        session.add(tenant2)
        await session.flush()

        # Users for Tenant 1
        users = [
            User(
                tenant_id=tenant1.id,
                email="admin@demo-university.ac.uk",
                password_hash=pwd_context.hash("password123"),
                full_name="Sarah Johnson",
                role="tenant_admin",
            ),
            User(
                tenant_id=tenant1.id,
                email="assessor@demo-university.ac.uk",
                password_hash=pwd_context.hash("password123"),
                full_name="James Wilson",
                role="assessor",
            ),
            User(
                tenant_id=tenant1.id,
                email="reviewer@demo-university.ac.uk",
                password_hash=pwd_context.hash("password123"),
                full_name="Emily Chen",
                role="reviewer",
            ),
        ]
        for u in users:
            session.add(u)

        # Platform admin (no tenant)
        platform_admin = User(
            tenant_id=tenant1.id,
            email="platform@tne-academy.com",
            password_hash=pwd_context.hash("admin123"),
            full_name="Platform Admin",
            role="platform_admin",
        )
        session.add(platform_admin)

        # Users for Tenant 2
        t2_admin = User(
            tenant_id=tenant2.id,
            email="admin@global-institute.edu",
            password_hash=pwd_context.hash("password123"),
            full_name="Ahmed Al-Rashid",
            role="tenant_admin",
        )
        session.add(t2_admin)

        # Partners for Tenant 1
        partners = [
            PartnerInstitution(
                tenant_id=tenant1.id,
                name="Singapore Institute of Technology",
                country="Singapore",
                position=1,
            ),
            PartnerInstitution(
                tenant_id=tenant1.id,
                name="University of Kuala Lumpur",
                country="Malaysia",
                position=2,
            ),
        ]
        for p in partners:
            session.add(p)

        # Create assessment if template exists
        template_result = await session.execute(
            select(AssessmentTemplate).where(AssessmentTemplate.is_active.is_(True))
        )
        template = template_result.scalar_one_or_none()

        if template:
            assessment = Assessment(
                tenant_id=tenant1.id,
                template_id=template.id,
                academic_year="2024-25",
                status="draft",
            )
            session.add(assessment)

        await session.commit()
        print("Demo data seeded successfully!")
        print(f"  Tenant 1: {tenant1.name} (slug: {tenant1.slug})")
        print(f"  Tenant 2: {tenant2.name} (slug: {tenant2.slug})")
        print(f"  Admin login: admin@demo-university.ac.uk / password123")
        print(f"  Platform admin: platform@tne-academy.com / admin123")


if __name__ == "__main__":
    asyncio.run(seed())
