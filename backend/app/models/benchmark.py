import uuid
from datetime import datetime

from sqlalchemy import String, Integer, Float, DateTime, ForeignKey, func, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class BenchmarkSnapshot(Base):
    __tablename__ = "benchmark_snapshots"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    academic_year: Mapped[str] = mapped_column(String(20))
    country: Mapped[str | None] = mapped_column(String(100))
    theme_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("assessment_themes.id")
    )
    metric_name: Mapped[str] = mapped_column(String(100))
    percentile_10: Mapped[float | None] = mapped_column(Float)
    percentile_25: Mapped[float | None] = mapped_column(Float)
    percentile_50: Mapped[float | None] = mapped_column(Float)
    percentile_75: Mapped[float | None] = mapped_column(Float)
    percentile_90: Mapped[float | None] = mapped_column(Float)
    sample_size: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint(
            "academic_year", "country", "theme_id", "metric_name",
            name="uq_benchmark_snapshot"
        ),
    )
