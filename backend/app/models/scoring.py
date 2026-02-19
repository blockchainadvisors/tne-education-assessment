import uuid
from datetime import datetime

from sqlalchemy import Float, Text, DateTime, ForeignKey, func, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ThemeScore(Base):
    __tablename__ = "theme_scores"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assessment_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("assessments.id"), index=True
    )
    theme_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("assessment_themes.id")
    )
    normalised_score: Mapped[float | None] = mapped_column(Float)  # 0-100
    weighted_score: Mapped[float | None] = mapped_column(Float)
    ai_analysis: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("assessment_id", "theme_id", name="uq_theme_score"),
    )

    assessment: Mapped["Assessment"] = relationship(back_populates="theme_scores")  # noqa: F821
