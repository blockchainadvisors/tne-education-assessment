"""Authentication endpoints: login, register, refresh, logout, email verification, magic links."""

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from jose import jwt, JWTError
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.tenant import Tenant
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    MagicLinkRequest,
    MagicLinkVerifyRequest,
    MessageResponse,
    RefreshRequest,
    RegisterRequest,
    ResendVerificationRequest,
    TokenResponse,
)
from app.services.token_service import (
    check_rate_limit,
    create_email_verification_token,
    create_magic_link_token,
    verify_email_token,
    verify_magic_link_token,
)
from app.workers.tasks import send_magic_link_email_task, send_verification_email_task

router = APIRouter(prefix="/auth")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ---------------------------------------------------------------------------
# Token helpers
# ---------------------------------------------------------------------------

def _create_access_token(user: User) -> str:
    """Create a short-lived access token."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {
        "sub": str(user.id),
        "tenant_id": str(user.tenant_id),
        "role": user.role,
        "type": "access",
        "exp": expire,
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def _create_refresh_token(user: User) -> str:
    """Create a longer-lived refresh token."""
    expire = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
    payload = {
        "sub": str(user.id),
        "type": "refresh",
        "exp": expire,
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def _build_token_response(user: User) -> TokenResponse:
    """Build access + refresh token pair for a user."""
    return TokenResponse(
        access_token=_create_access_token(user),
        refresh_token=_create_refresh_token(user),
    )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate with email + password, return JWT token pair."""
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if user is None or not pwd_context.verify(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )

    if not user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. Please check your inbox for the verification link.",
        )

    # Update last_login timestamp
    user.last_login = datetime.now(timezone.utc)
    await db.flush()

    return _build_token_response(user)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(body: RefreshRequest, db: AsyncSession = Depends(get_db)):
    """Exchange a valid refresh token for a new token pair."""
    try:
        payload = jwt.decode(
            body.refresh_token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is not a refresh token",
        )

    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    return _build_token_response(user)


@router.post("/logout")
async def logout():
    """Log out (client-side token removal).

    Since JWTs are stateless, actual invalidation happens on the client
    by discarding the tokens. A token blocklist can be added later if
    server-side revocation is needed.
    """
    return {"detail": "Successfully logged out"}


@router.post("/register", response_model=MessageResponse)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register a new tenant and its first admin user.

    Creates both a Tenant record and the first User with the ``tenant_admin``
    role. Sends a verification email instead of returning tokens directly.
    """
    # Check for duplicate email
    existing_user = await db.execute(select(User).where(User.email == body.email))
    if existing_user.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    # Check for duplicate tenant slug
    existing_tenant = await db.execute(select(Tenant).where(Tenant.slug == body.tenant_slug))
    if existing_tenant.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Tenant slug already taken",
        )

    # Create tenant
    tenant = Tenant(
        name=body.tenant_name,
        slug=body.tenant_slug,
        country=body.country,
    )
    db.add(tenant)
    await db.flush()  # populate tenant.id

    # Create admin user (email_verified defaults to false)
    user = User(
        tenant_id=tenant.id,
        email=body.email,
        password_hash=pwd_context.hash(body.password),
        full_name=body.full_name,
        role="tenant_admin",
    )
    db.add(user)
    await db.flush()  # populate user.id

    # Send verification email via Celery
    token = create_email_verification_token(str(user.id))
    send_verification_email_task.delay(body.email, body.full_name, token)

    return MessageResponse(
        message="Registration successful. Please check your email to verify your account."
    )


@router.post("/verify-email", response_model=TokenResponse)
async def verify_email(
    token: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """Verify email address using a one-time token. Returns JWT tokens (auto-login)."""
    user_id = verify_email_token(token)
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token",
        )

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    user.email_verified = True
    user.email_verified_at = datetime.now(timezone.utc)
    user.last_login = datetime.now(timezone.utc)
    await db.flush()

    return _build_token_response(user)


@router.post("/resend-verification", response_model=MessageResponse)
async def resend_verification(
    body: ResendVerificationRequest,
    db: AsyncSession = Depends(get_db),
):
    """Resend email verification link. Rate-limited to 3 per 60s per email."""
    # Always return the same message to prevent email enumeration
    success_msg = MessageResponse(
        message="If an account exists with that email, a verification link has been sent."
    )

    if not check_rate_limit("resend_verification", body.email):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Please try again later.",
        )

    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if user is None or user.email_verified:
        return success_msg

    token = create_email_verification_token(str(user.id))
    send_verification_email_task.delay(user.email, user.full_name, token)

    return success_msg


@router.post("/magic-link", response_model=MessageResponse)
async def request_magic_link(
    body: MagicLinkRequest,
    db: AsyncSession = Depends(get_db),
):
    """Send a magic link login email. Only for verified, active users. Rate-limited."""
    # Always return the same message to prevent email enumeration
    success_msg = MessageResponse(
        message="If an account exists with that email, a sign-in link has been sent."
    )

    if not check_rate_limit("magic_link", body.email):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Please try again later.",
        )

    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    # Only send magic link if user exists, is active, and email is verified
    if user is None or not user.is_active or not user.email_verified:
        return success_msg

    token = create_magic_link_token(user.email)
    send_magic_link_email_task.delay(user.email, token)

    return success_msg


@router.post("/magic-link/verify", response_model=TokenResponse)
async def verify_magic_link(
    body: MagicLinkVerifyRequest,
    db: AsyncSession = Depends(get_db),
):
    """Verify a magic link token and return JWT tokens."""
    email = verify_magic_link_token(body.token)
    if email is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired magic link",
        )

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if user is None or not user.is_active or not user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired magic link",
        )

    user.last_login = datetime.now(timezone.utc)
    await db.flush()

    return _build_token_response(user)
