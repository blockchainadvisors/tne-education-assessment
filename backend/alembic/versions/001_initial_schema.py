"""Initial schema - all Phase 1 tables.

Revision ID: 001
Revises:
Create Date: 2026-02-19

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Tenants
    op.create_table(
        "tenants",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("slug", sa.String(100), unique=True, nullable=False, index=True),
        sa.Column("country", sa.String(100), nullable=False),
        sa.Column("institution_type", sa.String(100)),
        sa.Column("subscription_tier", sa.String(50), server_default="free"),
        sa.Column("settings", postgresql.JSONB),
        sa.Column("is_active", sa.Boolean, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Users
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id"), nullable=False, index=True),
        sa.Column("email", sa.String(255), unique=True, nullable=False, index=True),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("role", sa.String(50), nullable=False),
        sa.Column("is_active", sa.Boolean, server_default="true"),
        sa.Column("last_login", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Partner Institutions
    op.create_table(
        "partner_institutions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False, index=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("country", sa.String(100), nullable=False),
        sa.Column("position", sa.Integer, server_default="1"),
        sa.Column("is_active", sa.Boolean, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Assessment Templates
    op.create_table(
        "assessment_templates",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("version", sa.String(50), nullable=False),
        sa.Column("description", sa.Text),
        sa.Column("is_active", sa.Boolean, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Assessment Themes
    op.create_table(
        "assessment_themes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("template_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("assessment_templates.id"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("slug", sa.String(100), nullable=False),
        sa.Column("description", sa.Text),
        sa.Column("weight", sa.Float, server_default="0.2"),
        sa.Column("display_order", sa.Integer, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Assessment Items
    op.create_table(
        "assessment_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("theme_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("assessment_themes.id"), nullable=False),
        sa.Column("code", sa.String(20), unique=True, nullable=False),
        sa.Column("label", sa.Text, nullable=False),
        sa.Column("description", sa.Text),
        sa.Column("field_type", sa.String(50), nullable=False),
        sa.Column("field_config", postgresql.JSONB),
        sa.Column("scoring_rubric", postgresql.JSONB),
        sa.Column("weight", sa.Float, server_default="1.0"),
        sa.Column("is_required", sa.Boolean, server_default="true"),
        sa.Column("display_order", sa.Integer, nullable=False),
        sa.Column("depends_on", sa.String(20)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Assessments
    op.create_table(
        "assessments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id"), nullable=False, index=True),
        sa.Column("template_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("assessment_templates.id"), nullable=False),
        sa.Column("academic_year", sa.String(20), nullable=False),
        sa.Column("status", sa.String(30), server_default="draft"),
        sa.Column("overall_score", sa.Float),
        sa.Column("submitted_at", sa.DateTime(timezone=True)),
        sa.Column("submitted_by", postgresql.UUID(as_uuid=True)),
        sa.Column("reviewed_by", postgresql.UUID(as_uuid=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("tenant_id", "academic_year", name="uq_tenant_academic_year"),
    )

    # Assessment Responses
    op.create_table(
        "assessment_responses",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("assessment_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("assessments.id"), nullable=False, index=True),
        sa.Column("item_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("assessment_items.id"), nullable=False),
        sa.Column("partner_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("partner_institutions.id")),
        sa.Column("value", postgresql.JSONB),
        sa.Column("ai_score", sa.Float),
        sa.Column("ai_feedback", sa.Text),
        sa.Column("scored_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("assessment_id", "item_id", "partner_id", name="uq_response_item_partner"),
    )

    # File Uploads
    op.create_table(
        "file_uploads",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False, index=True),
        sa.Column("assessment_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("assessments.id"), nullable=False, index=True),
        sa.Column("response_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("assessment_responses.id")),
        sa.Column("original_filename", sa.String(500), nullable=False),
        sa.Column("storage_key", sa.String(500), unique=True, nullable=False),
        sa.Column("content_type", sa.String(100), nullable=False),
        sa.Column("file_size", sa.Integer, nullable=False),
        sa.Column("document_type", sa.String(100)),
        sa.Column("extracted_data", postgresql.JSONB),
        sa.Column("extraction_status", sa.String(30), server_default="pending"),
        sa.Column("extraction_error", sa.Text),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Theme Scores
    op.create_table(
        "theme_scores",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("assessment_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("assessments.id"), nullable=False, index=True),
        sa.Column("theme_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("assessment_themes.id"), nullable=False),
        sa.Column("normalised_score", sa.Float),
        sa.Column("weighted_score", sa.Float),
        sa.Column("ai_analysis", sa.Text),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("assessment_id", "theme_id", name="uq_theme_score"),
    )

    # Assessment Reports
    op.create_table(
        "assessment_reports",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("assessment_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("assessments.id"), nullable=False, index=True),
        sa.Column("version", sa.Integer, server_default="1"),
        sa.Column("executive_summary", sa.Text),
        sa.Column("theme_analyses", postgresql.JSONB),
        sa.Column("improvement_recommendations", postgresql.JSONB),
        sa.Column("pdf_storage_key", sa.String(500)),
        sa.Column("generated_by", sa.String(100), server_default="system"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Benchmark Snapshots
    op.create_table(
        "benchmark_snapshots",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("academic_year", sa.String(20), nullable=False),
        sa.Column("country", sa.String(100)),
        sa.Column("theme_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("assessment_themes.id")),
        sa.Column("metric_name", sa.String(100), nullable=False),
        sa.Column("percentile_10", sa.Float),
        sa.Column("percentile_25", sa.Float),
        sa.Column("percentile_50", sa.Float),
        sa.Column("percentile_75", sa.Float),
        sa.Column("percentile_90", sa.Float),
        sa.Column("sample_size", sa.Integer, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("academic_year", "country", "theme_id", "metric_name", name="uq_benchmark_snapshot"),
    )

    # AI Jobs
    op.create_table(
        "ai_jobs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("assessment_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("assessments.id"), nullable=False, index=True),
        sa.Column("job_type", sa.String(50), nullable=False),
        sa.Column("status", sa.String(30), server_default="queued"),
        sa.Column("progress", sa.Float, server_default="0.0"),
        sa.Column("result_data", postgresql.JSONB),
        sa.Column("error_message", sa.Text),
        sa.Column("started_at", sa.DateTime(timezone=True)),
        sa.Column("completed_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("ai_jobs")
    op.drop_table("benchmark_snapshots")
    op.drop_table("assessment_reports")
    op.drop_table("theme_scores")
    op.drop_table("file_uploads")
    op.drop_table("assessment_responses")
    op.drop_table("assessments")
    op.drop_table("assessment_items")
    op.drop_table("assessment_themes")
    op.drop_table("assessment_templates")
    op.drop_table("partner_institutions")
    op.drop_table("users")
    op.drop_table("tenants")
