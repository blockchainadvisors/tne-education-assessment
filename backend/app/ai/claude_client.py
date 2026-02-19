"""Anthropic Claude API wrapper with retry, caching, and cost tracking."""

import hashlib
import json
import time
from functools import lru_cache

import anthropic
import structlog
from tenacity import retry, stop_after_attempt, wait_exponential

from app.config import settings

logger = structlog.get_logger()

# Simple in-memory cache with TTL (7 days)
_cache: dict[str, tuple[dict, float]] = {}
_CACHE_TTL = 7 * 24 * 3600  # 7 days in seconds


def _cache_key(model: str, messages: list[dict], system: str | None = None) -> str:
    """Generate a deterministic cache key from request parameters."""
    payload = json.dumps({"model": model, "messages": messages, "system": system}, sort_keys=True)
    return hashlib.sha256(payload.encode()).hexdigest()


def _get_cached(key: str) -> dict | None:
    """Get a cached response if still within TTL."""
    if key in _cache:
        result, timestamp = _cache[key]
        if time.time() - timestamp < _CACHE_TTL:
            return result
        del _cache[key]
    return None


def _set_cached(key: str, result: dict) -> None:
    """Store a result in the cache."""
    _cache[key] = (result, time.time())


@lru_cache(maxsize=1)
def get_client() -> anthropic.Anthropic:
    """Get a singleton Anthropic client."""
    return anthropic.Anthropic(api_key=settings.anthropic_api_key)


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=30),
    reraise=True,
)
def call_claude(
    messages: list[dict],
    system: str | None = None,
    model: str | None = None,
    max_tokens: int = 4096,
    temperature: float = 0.0,
    use_cache: bool = True,
) -> dict:
    """Call Claude API with retry logic and optional caching.

    Args:
        messages: List of message dicts with role and content.
        system: Optional system prompt.
        model: Model to use (defaults to settings.anthropic_model).
        max_tokens: Maximum tokens in response.
        temperature: Sampling temperature (0 for deterministic scoring).
        use_cache: Whether to use response caching.

    Returns:
        Dict with 'content' (str), 'usage' (dict), and 'model' (str).
    """
    model = model or settings.anthropic_model

    # Check cache first
    if use_cache:
        cache_key = _cache_key(model, messages, system)
        cached = _get_cached(cache_key)
        if cached is not None:
            logger.info("claude_cache_hit", cache_key=cache_key[:12])
            return cached

    client = get_client()

    kwargs = {
        "model": model,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "messages": messages,
    }
    if system:
        kwargs["system"] = system

    logger.info(
        "claude_api_call",
        model=model,
        num_messages=len(messages),
        max_tokens=max_tokens,
    )

    response = client.messages.create(**kwargs)

    result = {
        "content": response.content[0].text if response.content else "",
        "usage": {
            "input_tokens": response.usage.input_tokens,
            "output_tokens": response.usage.output_tokens,
        },
        "model": response.model,
        "stop_reason": response.stop_reason,
    }

    # Estimate cost (Sonnet pricing as of 2025)
    input_cost = response.usage.input_tokens * 0.003 / 1000
    output_cost = response.usage.output_tokens * 0.015 / 1000
    result["estimated_cost_usd"] = round(input_cost + output_cost, 6)

    logger.info(
        "claude_api_response",
        input_tokens=response.usage.input_tokens,
        output_tokens=response.usage.output_tokens,
        estimated_cost=result["estimated_cost_usd"],
    )

    # Cache the result
    if use_cache:
        _set_cached(cache_key, result)

    return result
