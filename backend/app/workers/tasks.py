"""Celery background tasks for AI pipeline operations and email sending."""

import asyncio
import uuid
from datetime import datetime, timezone

from app.workers.celery_app import celery_app


def _run_async(coro):
    """Run an async coroutine from a sync Celery task.

    Disposes the engine's connection pool first to avoid 'Future attached to
    a different loop' errors when Celery reuses a forked worker process across
    multiple tasks (each calling asyncio.run with a fresh event loop).
    """
    from app.database import engine

    engine.sync_engine.dispose(close=False)
    return asyncio.run(coro)


async def _update_job_status(
    job_id: uuid.UUID,
    status: str,
    result_data: dict | None = None,
    error_message: str | None = None,
    progress: float | None = None,
):
    """Update an AIJob record's status."""
    from app.database import async_session_factory
    from app.models.ai_job import AIJob

    async with async_session_factory() as session:
        from sqlalchemy import select

        result = await session.execute(select(AIJob).where(AIJob.id == job_id))
        job = result.scalar_one_or_none()
        if not job:
            return
        job.status = status
        if result_data is not None:
            job.result_data = result_data
        if error_message is not None:
            job.error_message = error_message
        if progress is not None:
            job.progress = progress
        if status == "processing" and job.started_at is None:
            job.started_at = datetime.now(timezone.utc)
        if status in ("completed", "failed"):
            job.completed_at = datetime.now(timezone.utc)
        await session.commit()


# ---------------------------------------------------------------------------
# Email tasks
# ---------------------------------------------------------------------------

@celery_app.task(name="send_verification_email")
def send_verification_email_task(to_email: str, full_name: str, token: str) -> dict:
    """Send an email verification email via Celery worker."""
    from app.services.email_service import send_verification_email

    send_verification_email(to_email, full_name, token)
    return {"status": "sent", "to": to_email}


@celery_app.task(name="send_magic_link_email")
def send_magic_link_email_task(to_email: str, token: str) -> dict:
    """Send a magic link email via Celery worker."""
    from app.services.email_service import send_magic_link_email

    send_magic_link_email(to_email, token)
    return {"status": "sent", "to": to_email}


# ---------------------------------------------------------------------------
# Document intelligence pipeline
# ---------------------------------------------------------------------------

@celery_app.task(name="process_document", bind=True)
def process_document(self, file_upload_id: str, job_id: str | None = None) -> dict:
    """Process an uploaded document through the document intelligence pipeline."""

    async def _run(file_upload_id: str, job_id: str | None):
        from app.database import async_session_factory
        from app.ai.documents.pipeline import process_document as run_pipeline

        if job_id:
            await _update_job_status(uuid.UUID(job_id), "processing", progress=0.1)

        async with async_session_factory() as session:
            try:
                result = await run_pipeline(session, uuid.UUID(file_upload_id))
                await session.commit()

                if job_id:
                    await _update_job_status(
                        uuid.UUID(job_id), "completed", result_data=result, progress=1.0
                    )
                return result
            except Exception as e:
                await session.rollback()
                if job_id:
                    await _update_job_status(
                        uuid.UUID(job_id), "failed", error_message=str(e)
                    )
                raise

    return _run_async(_run(file_upload_id, job_id))


# ---------------------------------------------------------------------------
# AI scoring pipeline
# ---------------------------------------------------------------------------

@celery_app.task(name="score_assessment", bind=True)
def score_assessment(self, assessment_id: str, job_id: str | None = None) -> dict:
    """Score an assessment using the AI scoring pipeline.

    Pipeline: Numeric → Binary → Text (Claude) → Timeseries → Consistency → Aggregation
    """

    async def _run(assessment_id: str, job_id: str | None):
        from app.database import async_session_factory
        from app.ai.scoring.orchestrator import score_assessment as run_scoring
        from app.models.assessment import Assessment

        if job_id:
            await _update_job_status(uuid.UUID(job_id), "processing", progress=0.1)

        async with async_session_factory() as session:
            try:
                result = await run_scoring(session, uuid.UUID(assessment_id))

                # Update assessment status
                from sqlalchemy import select

                assess_result = await session.execute(
                    select(Assessment).where(Assessment.id == uuid.UUID(assessment_id))
                )
                assessment = assess_result.scalar_one_or_none()
                if assessment:
                    assessment.status = "scored"

                await session.commit()

                if job_id:
                    await _update_job_status(
                        uuid.UUID(job_id), "completed", result_data=result, progress=1.0
                    )
                return result
            except Exception as e:
                await session.rollback()
                if job_id:
                    await _update_job_status(
                        uuid.UUID(job_id), "failed", error_message=str(e)
                    )
                raise

    return _run_async(_run(assessment_id, job_id))


# ---------------------------------------------------------------------------
# Report generation pipeline
# ---------------------------------------------------------------------------

@celery_app.task(name="generate_report", bind=True)
def generate_report(self, assessment_id: str, job_id: str | None = None) -> dict:
    """Generate an AI-powered assessment report.

    Pipeline: Section-by-section Claude → store in DB (PDF generation deferred)
    """

    async def _run(assessment_id: str, job_id: str | None):
        from app.database import async_session_factory
        from app.ai.reports.orchestrator import generate_report as run_report_gen
        from app.models.assessment import Assessment

        if job_id:
            await _update_job_status(uuid.UUID(job_id), "processing", progress=0.1)

        async with async_session_factory() as session:
            try:
                report = await run_report_gen(session, uuid.UUID(assessment_id))

                # Update assessment status
                from sqlalchemy import select

                assess_result = await session.execute(
                    select(Assessment).where(Assessment.id == uuid.UUID(assessment_id))
                )
                assessment = assess_result.scalar_one_or_none()
                if assessment:
                    assessment.status = "report_generated"

                await session.commit()

                result = {
                    "report_id": str(report.id),
                    "version": report.version,
                    "assessment_id": assessment_id,
                }

                if job_id:
                    await _update_job_status(
                        uuid.UUID(job_id), "completed", result_data=result, progress=1.0
                    )
                return result
            except Exception as e:
                await session.rollback()
                if job_id:
                    await _update_job_status(
                        uuid.UUID(job_id), "failed", error_message=str(e)
                    )
                raise

    return _run_async(_run(assessment_id, job_id))


# ---------------------------------------------------------------------------
# Risk prediction
# ---------------------------------------------------------------------------

@celery_app.task(name="compute_risk_prediction", bind=True)
def compute_risk_prediction(self, assessment_id: str, job_id: str | None = None) -> dict:
    """Compute risk predictions for an assessment using rule-based scoring."""

    async def _run(assessment_id: str, job_id: str | None):
        from app.database import async_session_factory
        from app.ai.predictive.rule_based import compute_risk_score
        from app.models.assessment import Assessment
        from app.models.scoring import ThemeScore
        from app.models.assessment import AssessmentTheme, AssessmentResponse, AssessmentItem
        from sqlalchemy import select

        if job_id:
            await _update_job_status(uuid.UUID(job_id), "processing", progress=0.1)

        async with async_session_factory() as session:
            try:
                # Load assessment
                assess_result = await session.execute(
                    select(Assessment).where(Assessment.id == uuid.UUID(assessment_id))
                )
                assessment = assess_result.scalar_one_or_none()
                if not assessment:
                    raise ValueError(f"Assessment {assessment_id} not found")

                # Load theme scores to build metrics dict
                scores_result = await session.execute(
                    select(ThemeScore).where(
                        ThemeScore.assessment_id == uuid.UUID(assessment_id)
                    )
                )
                theme_scores = scores_result.scalars().all()

                # Load themes for slug mapping
                themes_result = await session.execute(
                    select(AssessmentTheme).where(
                        AssessmentTheme.template_id == assessment.template_id
                    )
                )
                themes = themes_result.scalars().all()
                themes_by_id = {t.id: t for t in themes}

                # Build metrics dict from theme scores
                metrics: dict = {}
                for ts in theme_scores:
                    theme = themes_by_id.get(ts.theme_id)
                    if theme and ts.normalised_score is not None:
                        slug = theme.slug
                        if "financial" in slug:
                            metrics["financial"] = ts.normalised_score
                        elif "governance" in slug:
                            metrics["governance"] = ts.normalised_score

                # Try to extract specific metrics from assessment responses
                items_result = await session.execute(
                    select(AssessmentItem).join(AssessmentTheme).where(
                        AssessmentTheme.template_id == assessment.template_id
                    )
                )
                items = items_result.scalars().all()
                items_by_id = {i.id: i for i in items}

                responses_result = await session.execute(
                    select(AssessmentResponse).where(
                        AssessmentResponse.assessment_id == uuid.UUID(assessment_id)
                    )
                )
                responses = responses_result.scalars().all()

                for resp in responses:
                    item = items_by_id.get(resp.item_id)
                    if not item or resp.value is None:
                        continue
                    code = item.code.lower()
                    val = resp.value
                    if isinstance(val, dict):
                        val = val.get("value", val)
                    try:
                        if "ssr" in code:
                            metrics["ssr"] = float(val)
                        elif "phd" in code and "pct" in code:
                            metrics["phd_pct"] = float(val)
                        elif "retention" in code:
                            metrics["retention_rate"] = float(val)
                    except (ValueError, TypeError):
                        continue

                result = compute_risk_score(metrics)

                if job_id:
                    await _update_job_status(
                        uuid.UUID(job_id), "completed", result_data=result, progress=1.0
                    )
                return result
            except Exception as e:
                if job_id:
                    await _update_job_status(
                        uuid.UUID(job_id), "failed", error_message=str(e)
                    )
                raise

    return _run_async(_run(assessment_id, job_id))
