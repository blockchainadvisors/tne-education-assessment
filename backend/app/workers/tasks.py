"""Celery background tasks for AI pipeline operations and email sending."""

from app.workers.celery_app import celery_app


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


@celery_app.task(name="process_document")
def process_document(file_upload_id: str) -> dict:
    """Process an uploaded document through the document intelligence pipeline.

    Pipeline: Extract text -> Classify -> Extract structured data -> Check completeness
    """
    # Phase 2: Implementation
    return {"status": "pending_implementation", "file_upload_id": file_upload_id}


@celery_app.task(name="score_assessment")
def score_assessment(assessment_id: str) -> dict:
    """Score an assessment using the AI scoring pipeline.

    Pipeline: Numeric scoring -> Text scoring (Claude) -> Consistency check -> Theme aggregation
    """
    # Phase 3: Implementation
    return {"status": "pending_implementation", "assessment_id": assessment_id}


@celery_app.task(name="generate_report")
def generate_report(assessment_id: str) -> dict:
    """Generate an AI-powered assessment report.

    Pipeline: Section-by-section Claude -> Jinja2 HTML -> WeasyPrint PDF
    """
    # Phase 3: Implementation
    return {"status": "pending_implementation", "assessment_id": assessment_id}


@celery_app.task(name="compute_risk_prediction")
def compute_risk_prediction(assessment_id: str) -> dict:
    """Compute risk predictions for an assessment.

    Phase 1: Rule-based risk scoring
    Phase 3: ML-based predictions with SHAP explanations
    """
    # Phase 4: Implementation
    return {"status": "pending_implementation", "assessment_id": assessment_id}
