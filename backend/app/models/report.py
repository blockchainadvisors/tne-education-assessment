import uuid
from datetime import datetime

from sqlalchemy import Integer, String, Text, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class AssessmentReport(Base):
    __tablename__ = "assessment_reports"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assessment_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("assessments.id"), index=True
    )
    version: Mapped[int] = mapped_column(Integer, default=1)
    executive_summary: Mapped[str | None] = mapped_column(Text)
    theme_analyses: Mapped[dict | None] = mapped_column(JSONB)
    improvement_recommendations: Mapped[dict | None] = mapped_column(JSONB)
    pdf_storage_key: Mapped[str | None] = mapped_column(String(500))
    generated_by: Mapped[str] = mapped_column(String(100), default="system")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    assessment: Mapped["Assessment"] = relationship(back_populates="report")  # noqa: F821
