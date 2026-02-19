import uuid
from datetime import datetime

from sqlalchemy import String, Integer, Float, Text, DateTime, ForeignKey, func, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class AssessmentTemplate(Base):
    __tablename__ = "assessment_templates"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255))
    version: Mapped[str] = mapped_column(String(50))
    description: Mapped[str | None] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    themes: Mapped[list["AssessmentTheme"]] = relationship(
        back_populates="template", order_by="AssessmentTheme.display_order"
    )
    assessments: Mapped[list["Assessment"]] = relationship(back_populates="template")


class AssessmentTheme(Base):
    __tablename__ = "assessment_themes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    template_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("assessment_templates.id")
    )
    name: Mapped[str] = mapped_column(String(255))
    slug: Mapped[str] = mapped_column(String(100))
    description: Mapped[str | None] = mapped_column(Text)
    weight: Mapped[float] = mapped_column(Float, default=0.2)
    display_order: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    template: Mapped["AssessmentTemplate"] = relationship(back_populates="themes")
    items: Mapped[list["AssessmentItem"]] = relationship(
        back_populates="theme", order_by="AssessmentItem.display_order"
    )


class AssessmentItem(Base):
    __tablename__ = "assessment_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    theme_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("assessment_themes.id")
    )
    code: Mapped[str] = mapped_column(String(20), unique=True)  # e.g., "TL01", "SE05"
    label: Mapped[str] = mapped_column(Text)
    description: Mapped[str | None] = mapped_column(Text)
    field_type: Mapped[str] = mapped_column(String(50))
    # 12 types: short_text, long_text, numeric, percentage, yes_no_conditional,
    # dropdown, multi_select, file_upload, multi_year_gender, partner_specific,
    # auto_calculated, salary_bands
    field_config: Mapped[dict | None] = mapped_column(JSONB, default=dict)
    scoring_rubric: Mapped[dict | None] = mapped_column(JSONB, default=dict)
    weight: Mapped[float] = mapped_column(Float, default=1.0)
    is_required: Mapped[bool] = mapped_column(default=True)
    display_order: Mapped[int] = mapped_column(Integer)
    depends_on: Mapped[str | None] = mapped_column(String(20))  # parent item code for conditionals
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    theme: Mapped["AssessmentTheme"] = relationship(back_populates="items")
    responses: Mapped[list["AssessmentResponse"]] = relationship(back_populates="item")


class Assessment(Base):
    __tablename__ = "assessments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenants.id"), index=True
    )
    template_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("assessment_templates.id")
    )
    academic_year: Mapped[str] = mapped_column(String(20))  # e.g. "2024-25"
    status: Mapped[str] = mapped_column(
        String(30), default="draft"
    )  # draft, submitted, under_review, scored, report_generated
    overall_score: Mapped[float | None] = mapped_column(Float)
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    submitted_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    __table_args__ = (
        UniqueConstraint("tenant_id", "academic_year", name="uq_tenant_academic_year"),
    )

    tenant: Mapped["Tenant"] = relationship(back_populates="assessments")  # noqa: F821
    template: Mapped["AssessmentTemplate"] = relationship(back_populates="assessments")
    responses: Mapped[list["AssessmentResponse"]] = relationship(back_populates="assessment")
    theme_scores: Mapped[list["ThemeScore"]] = relationship(back_populates="assessment")  # noqa: F821
    report: Mapped["AssessmentReport | None"] = relationship(back_populates="assessment")  # noqa: F821


class AssessmentResponse(Base):
    __tablename__ = "assessment_responses"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assessment_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("assessments.id"), index=True
    )
    item_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("assessment_items.id")
    )
    partner_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("partner_institutions.id")
    )
    value: Mapped[dict | None] = mapped_column(JSONB)
    ai_score: Mapped[float | None] = mapped_column(Float)
    ai_feedback: Mapped[str | None] = mapped_column(Text)
    scored_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    __table_args__ = (
        UniqueConstraint("assessment_id", "item_id", "partner_id", name="uq_response_item_partner"),
    )

    assessment: Mapped["Assessment"] = relationship(back_populates="responses")
    item: Mapped["AssessmentItem"] = relationship(back_populates="responses")
