"""Assessment CRUD service with tenant isolation.

Provides async methods for creating, reading, listing, submitting, and
updating assessment status with proper tenant-scoped queries.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.assessment import Assessment, AssessmentResponse, AssessmentItem


# Valid status transitions: current_status -> set of allowed next statuses
VALID_TRANSITIONS = {
    "draft": {"submitted"},
    "submitted": {"under_review"},
    "under_review": {"scored"},
    "scored": {"report_generated"},
    "report_generated": set(),
}


async def create_assessment(
    db: AsyncSession,
    tenant_id: uuid.UUID,
    template_id: uuid.UUID,
    academic_year: str,
) -> Assessment:
    """Create a new assessment for a tenant.

    Args:
        db: Async database session.
        tenant_id: The tenant owning this assessment.
        template_id: The assessment template to use.
        academic_year: Academic year string, e.g. "2024-25".

    Returns:
        The newly created Assessment instance.
    """
    assessment = Assessment(
        tenant_id=tenant_id,
        template_id=template_id,
        academic_year=academic_year,
        status="draft",
    )
    db.add(assessment)
    await db.flush()
    return assessment


async def get_assessment(
    db: AsyncSession,
    assessment_id: uuid.UUID,
    tenant_id: uuid.UUID,
) -> Assessment | None:
    """Get an assessment by ID with tenant isolation check.

    Args:
        db: Async database session.
        assessment_id: The assessment to retrieve.
        tenant_id: The tenant scope for isolation.

    Returns:
        The Assessment if found and belongs to the tenant, else None.
    """
    result = await db.execute(
        select(Assessment).where(
            Assessment.id == assessment_id,
            Assessment.tenant_id == tenant_id,
        )
    )
    return result.scalar_one_or_none()


async def list_assessments(
    db: AsyncSession,
    tenant_id: uuid.UUID,
) -> list[Assessment]:
    """List all assessments for a tenant, ordered by created_at descending.

    Args:
        db: Async database session.
        tenant_id: The tenant scope for isolation.

    Returns:
        List of Assessment instances ordered by most recent first.
    """
    result = await db.execute(
        select(Assessment)
        .where(Assessment.tenant_id == tenant_id)
        .order_by(Assessment.created_at.desc())
    )
    return list(result.scalars().all())


async def submit_assessment(
    db: AsyncSession,
    assessment_id: uuid.UUID,
    tenant_id: uuid.UUID,
    user_id: uuid.UUID,
) -> Assessment:
    """Submit an assessment after validating all required items have responses.

    Changes the assessment status to "submitted", sets submitted_at and
    submitted_by fields.

    Args:
        db: Async database session.
        assessment_id: The assessment to submit.
        tenant_id: The tenant scope for isolation.
        user_id: The user performing the submission.

    Returns:
        The updated Assessment instance.

    Raises:
        ValueError: If assessment not found, not in draft status, or has
            missing required responses.
    """
    assessment = await get_assessment(db, assessment_id, tenant_id)
    if assessment is None:
        raise ValueError("Assessment not found")

    if assessment.status != "draft":
        raise ValueError(
            f"Cannot submit assessment in '{assessment.status}' status; must be 'draft'"
        )

    # Get all required items for this assessment's template
    required_items_result = await db.execute(
        select(AssessmentItem)
        .where(AssessmentItem.is_required.is_(True))
        .join(
            Assessment,
            Assessment.template_id == AssessmentItem.theme.property.mapper.class_.template_id,
        )
    )
    # Use a simpler approach: get required items via theme -> template
    from app.models.assessment import AssessmentTheme

    required_items_result = await db.execute(
        select(AssessmentItem)
        .join(AssessmentTheme, AssessmentItem.theme_id == AssessmentTheme.id)
        .where(
            AssessmentTheme.template_id == assessment.template_id,
            AssessmentItem.is_required.is_(True),
        )
    )
    required_items = required_items_result.scalars().all()

    # Get existing responses for this assessment
    responses_result = await db.execute(
        select(AssessmentResponse.item_id).where(
            AssessmentResponse.assessment_id == assessment_id,
        )
    )
    responded_item_ids = {row for row in responses_result.scalars().all()}

    # Validate that all required items have responses
    missing = [
        item.code
        for item in required_items
        if item.id not in responded_item_ids
    ]
    if missing:
        raise ValueError(
            f"Missing responses for required items: {', '.join(missing)}"
        )

    assessment.status = "submitted"
    assessment.submitted_at = datetime.now(timezone.utc)
    assessment.submitted_by = user_id

    await db.flush()
    return assessment


async def update_status(
    db: AsyncSession,
    assessment_id: uuid.UUID,
    tenant_id: uuid.UUID,
    new_status: str,
) -> Assessment:
    """Update the status of an assessment with transition validation.

    Valid transitions: draft -> submitted -> under_review -> scored -> report_generated

    Args:
        db: Async database session.
        assessment_id: The assessment to update.
        tenant_id: The tenant scope for isolation.
        new_status: The target status to transition to.

    Returns:
        The updated Assessment instance.

    Raises:
        ValueError: If assessment not found or the status transition is invalid.
    """
    assessment = await get_assessment(db, assessment_id, tenant_id)
    if assessment is None:
        raise ValueError("Assessment not found")

    allowed = VALID_TRANSITIONS.get(assessment.status, set())
    if new_status not in allowed:
        raise ValueError(
            f"Invalid status transition: '{assessment.status}' -> '{new_status}'. "
            f"Allowed transitions from '{assessment.status}': {allowed or 'none'}"
        )

    assessment.status = new_status
    await db.flush()
    return assessment
