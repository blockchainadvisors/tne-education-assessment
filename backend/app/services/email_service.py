"""SMTP email service with Jinja2 template rendering."""

import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path

from jinja2 import Environment, FileSystemLoader

from app.config import settings

_templates_dir = Path(__file__).resolve().parent.parent / "templates" / "email"
_jinja_env = Environment(loader=FileSystemLoader(str(_templates_dir)), autoescape=True)


def _send_email(to_email: str, subject: str, html_body: str) -> None:
    """Send an HTML email via SMTP."""
    msg = MIMEMultipart("alternative")
    msg["From"] = f"{settings.smtp_from_name} <{settings.smtp_from_email}>"
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.attach(MIMEText(html_body, "html"))

    if settings.smtp_use_tls:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            server.starttls()
            server.send_message(msg)
    else:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            server.send_message(msg)


def send_verification_email(to_email: str, full_name: str, token: str) -> None:
    """Send an email verification email."""
    verify_url = f"{settings.frontend_url}/verify-email?token={token}"
    template = _jinja_env.get_template("verify_email.html")
    html = template.render(
        full_name=full_name,
        verify_url=verify_url,
        app_name=settings.app_name,
    )
    _send_email(to_email, f"Verify your email - {settings.app_name}", html)


def send_magic_link_email(to_email: str, token: str) -> None:
    """Send a magic link login email."""
    magic_url = f"{settings.frontend_url}/magic-link?token={token}"
    template = _jinja_env.get_template("magic_link.html")
    html = template.render(
        magic_url=magic_url,
        app_name=settings.app_name,
        expire_minutes=settings.magic_link_token_expire_minutes,
    )
    _send_email(to_email, f"Sign in to {settings.app_name}", html)
