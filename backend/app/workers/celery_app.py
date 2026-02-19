"""Celery application configuration."""

from celery import Celery

from app.config import settings

celery_app = Celery(
    "tne_assessment",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
)

# Auto-discover tasks in these modules
celery_app.autodiscover_tasks(["app.workers"])
