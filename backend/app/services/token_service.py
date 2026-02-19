"""Redis-based token service for email verification and magic links."""

import secrets

import redis

from app.config import settings

_redis = redis.from_url(settings.redis_url, decode_responses=True)

# Rate limiting constants
RATE_LIMIT_MAX = 3
RATE_LIMIT_WINDOW = 60  # seconds


def create_email_verification_token(user_id: str) -> str:
    """Create a one-time email verification token (24h TTL)."""
    token = secrets.token_urlsafe(32)
    _redis.setex(
        f"email_verify:{token}",
        settings.email_verify_token_expire_hours * 3600,
        user_id,
    )
    return token


def verify_email_token(token: str) -> str | None:
    """Consume a verification token. Returns user_id or None."""
    key = f"email_verify:{token}"
    user_id = _redis.get(key)
    if user_id:
        _redis.delete(key)
    return user_id


def create_magic_link_token(email: str) -> str:
    """Create a one-time magic link token (15min TTL)."""
    token = secrets.token_urlsafe(32)
    _redis.setex(
        f"magic_link:{token}",
        settings.magic_link_token_expire_minutes * 60,
        email,
    )
    return token


def verify_magic_link_token(token: str) -> str | None:
    """Consume a magic link token. Returns email or None."""
    key = f"magic_link:{token}"
    email = _redis.get(key)
    if email:
        _redis.delete(key)
    return email


def check_rate_limit(action: str, identifier: str) -> bool:
    """Check rate limit. Returns True if allowed, False if exceeded."""
    key = f"rate:{action}:{identifier}"
    current = _redis.get(key)
    if current is not None and int(current) >= RATE_LIMIT_MAX:
        return False
    pipe = _redis.pipeline()
    pipe.incr(key)
    pipe.expire(key, RATE_LIMIT_WINDOW)
    pipe.execute()
    return True
