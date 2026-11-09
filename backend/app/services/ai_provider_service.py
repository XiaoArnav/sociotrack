"""
Centralized AI Provider Service.
Connects SocioTrack to genuine foundation model providers:
1. Google Gemini (REST API via generateContent)
2. Groq (REST API via OpenAI-compatible endpoint)
3. OpenAI (REST API via chat completions)

Enforces strict timeout handling, exponential backoff retries, rate-limiting,
structured JSON output validation, and honest fallback tracking without leaking keys.
"""

import asyncio
import json
import logging
import os
import re
import time
from typing import Any, Dict, List, Optional, Type
import httpx
from pydantic import BaseModel, ValidationError

from app.config import settings

logger = logging.getLogger("sociotrack.ai_provider")


# ------------------------------------------------------------------------------
# Exceptions
# ------------------------------------------------------------------------------

class AIProviderError(Exception):
    """Base exception for all AI provider interactions."""
    pass


class AIProviderAuthError(AIProviderError):
    """Raised when API credentials are missing, invalid, or unauthorized."""
    pass


class AIProviderRateLimitError(AIProviderError):
    """Raised when provider returns HTTP 429 Too Many Requests."""
    def __init__(self, message: str, retry_after: Optional[int] = None):
        super().__init__(message)
        self.retry_after = retry_after


class AIProviderTimeoutError(AIProviderError):
    """Raised when provider request exceeds configured timeout."""
    pass


class AIProviderSchemaValidationError(AIProviderError):
    """Raised when model response cannot be parsed or fails schema validation."""
    pass


# ------------------------------------------------------------------------------
# Data Models
# ------------------------------------------------------------------------------

class AIProviderResult(BaseModel):
    """Standardized result returned by AI provider calls."""
    content: str
    structured_data: Optional[Dict[str, Any]] = None
    provider: str  # "gemini" | "groq" | "openai" | "fallback"
    model: str
    is_ai_generated: bool
    latency_ms: float
    fallback_reason: Optional[str] = None
    input_tokens: Optional[int] = None
    output_tokens: Optional[int] = None


# ------------------------------------------------------------------------------
# Helper Utilities
# ------------------------------------------------------------------------------

def _sanitize_key(key: Optional[str]) -> str:
    """Returns a safe, masked representation of a secret key for debugging."""
    if not key:
        return "<none>"
    k = key.strip()
    if len(k) <= 8:
        return "***"
    return f"{k[:4]}...{k[-4:]}"


def _is_placeholder_key(key: Optional[str]) -> bool:
    """Detects whether a key is an unconfigured placeholder."""
    if not key:
        return True
    k = key.strip().lower()
    return (
        k == ""
        or k.startswith("your_")
        or k.startswith("placeholder")
        or k.startswith("sk-placeholder")
        or "changeme" in k
    )


def extract_json_from_text(raw_text: str) -> Dict[str, Any]:
    """
    Robustly extracts and parses JSON from model responses,
    stripping markdown fences (```json ... ```) or prefix prose if present.
    """
    clean = raw_text.strip()

    # Strip standard markdown fences
    if clean.startswith("```"):
        # Match ```json or ```
        match = re.search(r"^```(?:json)?\s*\n?(.*?)\n?```$", clean, re.DOTALL | re.IGNORECASE)
        if match:
            clean = match.group(1).strip()
        else:
            # Fallback split
            clean = clean.split("\n", 1)[1] if "\n" in clean else clean[3:]
            if clean.endswith("```"):
                clean = clean.rsplit("```", 1)[0].strip()

    # If clean text starts with { and ends with }, parse directly
    if clean.startswith("{") and clean.endswith("}"):
        return json.loads(clean)

    # Search for first { to last }
    first_brace = clean.find("{")
    last_brace = clean.rfind("}")
    if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
        candidate = clean[first_brace : last_brace + 1]
        return json.loads(candidate)

    # Attempt direct json.loads as last resort
    return json.loads(clean)


# ------------------------------------------------------------------------------
# Core AI Provider Service
# ------------------------------------------------------------------------------

class AIProviderService:
    """
    Unified client for LLM providers.
    Supports Google Gemini, Groq, and OpenAI with connection pooling.
    """

    def __init__(self):
        self._http_client: Optional[httpx.AsyncClient] = None

    async def get_http_client(self) -> httpx.AsyncClient:
        """Returns or creates a shared persistent httpx.AsyncClient."""
        if self._http_client is None or self._http_client.is_closed:
            self._http_client = httpx.AsyncClient(
                timeout=httpx.Timeout(settings.AI_TIMEOUT_SECONDS, connect=10.0),
                limits=httpx.Limits(max_keepalive_connections=10, max_connections=20),
            )
        return self._http_client

    async def close(self):
        """Closes the underlying HTTP client session."""
        if self._http_client is not None and not self._http_client.is_closed:
            await self._http_client.aclose()
            self._http_client = None

    # --- Provider Key Resolution ---

    def get_gemini_key(self) -> str:
        key = getattr(settings, "GEMINI_API_KEY", "") or getattr(settings, "GOOGLE_API_KEY", "")
        if _is_placeholder_key(key):
            key = os.environ.get("GEMINI_API_KEY", "") or os.environ.get("GOOGLE_API_KEY", "")
        return key.strip() if not _is_placeholder_key(key) else ""

    def get_groq_key(self) -> str:
        key = getattr(settings, "GROQ_API_KEY", "")
        if _is_placeholder_key(key):
            key = os.environ.get("GROQ_API_KEY", "")
        return key.strip() if not _is_placeholder_key(key) else ""

    def get_openai_key(self) -> str:
        key = getattr(settings, "OPENAI_API_KEY", "")
        if _is_placeholder_key(key):
            key = os.environ.get("OPENAI_API_KEY", "")
        return key.strip() if not _is_placeholder_key(key) else ""

    def get_available_providers(self) -> List[str]:
        """Returns list of configured and ready model providers."""
        available = []
        if self.get_gemini_key():
            available.append("gemini")
        if self.get_groq_key():
            available.append("groq")
        if self.get_openai_key():
            available.append("openai")
        return available

    def is_provider_configured(self, provider: Optional[str] = None) -> bool:
        """Checks if a specific or any provider is ready to call."""
        if provider:
            p = provider.lower()
            if p == "gemini":
                return bool(self.get_gemini_key())
            elif p == "groq":
                return bool(self.get_groq_key())
            elif p == "openai":
                return bool(self.get_openai_key())
            return False
        return len(self.get_available_providers()) > 0

    def resolve_provider(self, requested: Optional[str] = None) -> str:
        """Determines which provider to call based on configuration and availability."""
        pref = (requested or settings.AI_PROVIDER or "auto").lower()

        if pref in ("gemini", "groq", "openai"):
            if self.is_provider_configured(pref):
                return pref
            logger.warning(f"Preferred provider '{pref}' has no valid API key configured.")

        # Auto fallback order: Gemini -> Groq -> OpenAI
        if self.is_provider_configured("gemini"):
            return "gemini"
        if self.is_provider_configured("groq"):
            return "groq"
        if self.is_provider_configured("openai"):
            return "openai"

        return "none"

    # --- Provider Invocations ---

    async def _call_gemini_rest(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        model: Optional[str] = None,
        temperature: float = 0.7,
        expect_json: bool = True,
        timeout_seconds: Optional[float] = None,
    ) -> AIProviderResult:
        """Executes real Google Gemini generateContent REST call."""
        key = self.get_gemini_key()
        if not key:
            raise AIProviderAuthError("Google Gemini API key is missing or unconfigured.")

        chosen_model = model or getattr(settings, "GEMINI_MODEL", "gemini-1.5-flash")
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{chosen_model}:generateContent?key={key}"

        # Gemini system instruction + contents payload
        parts = []
        if system_prompt:
            combined = f"SYSTEM INSTRUCTIONS:\n{system_prompt}\n\nUSER PROMPT:\n{prompt}"
            parts.append({"text": combined})
        else:
            parts.append({"text": prompt})

        gen_config: Dict[str, Any] = {"temperature": temperature}
        if expect_json:
            gen_config["responseMimeType"] = "application/json"

        payload = {
            "contents": [{"parts": parts}],
            "generationConfig": gen_config,
        }

        client = await self.get_http_client()
        timeout = timeout_seconds or settings.AI_TIMEOUT_SECONDS
        start_time = time.perf_counter()

        last_error = None
        for attempt in range(settings.AI_MAX_RETRIES + 1):
            try:
                resp = await client.post(url, json=payload, timeout=timeout)
                elapsed_ms = (time.perf_counter() - start_time) * 1000

                if resp.status_code == 200:
                    body = resp.json()
                    candidates = body.get("candidates", [])
                    if not candidates:
                        raise AIProviderError("Gemini returned empty candidate response.")

                    raw_text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                    structured = None
                    try:
                        structured = extract_json_from_text(raw_text)
                    except Exception:
                        if expect_json:
                            raise

                    usage = body.get("usageMetadata", {})
                    return AIProviderResult(
                        content=raw_text,
                        structured_data=structured,
                        provider="gemini",
                        model=chosen_model,
                        is_ai_generated=True,
                        latency_ms=round(elapsed_ms, 2),
                        input_tokens=usage.get("promptTokenCount"),
                        output_tokens=usage.get("candidatesTokenCount"),
                    )

                elif resp.status_code == 429:
                    retry_after = resp.headers.get("Retry-After")
                    delay = int(retry_after) if retry_after and retry_after.isdigit() else 5
                    raise AIProviderRateLimitError(
                        f"Gemini API rate limit exceeded (HTTP 429). Retry after {delay}s.",
                        retry_after=delay,
                    )

                elif resp.status_code in (401, 403):
                    raise AIProviderAuthError(
                        f"Gemini API authentication failed (HTTP {resp.status_code}). Check GEMINI_API_KEY."
                    )

                elif resp.status_code >= 500:
                    last_error = AIProviderError(f"Gemini server error (HTTP {resp.status_code}).")
                    if attempt < settings.AI_MAX_RETRIES:
                        await asyncio.sleep(1.0 * (2 ** attempt))
                        continue
                    raise last_error

                else:
                    raise AIProviderError(f"Gemini API request failed with status {resp.status_code}: {resp.text[:200]}")

            except httpx.TimeoutException as exc:
                if attempt < settings.AI_MAX_RETRIES:
                    await asyncio.sleep(1.0)
                    continue
                raise AIProviderTimeoutError(f"Gemini API request timed out after {timeout}s.") from exc
            except (AIProviderAuthError, AIProviderRateLimitError):
                raise
            except Exception as exc:
                if isinstance(exc, AIProviderError):
                    raise
                last_error = exc
                if attempt < settings.AI_MAX_RETRIES:
                    await asyncio.sleep(1.0)
                    continue
                raise AIProviderError(f"Gemini invocation error: {str(exc)}") from exc

        raise AIProviderError(f"Gemini request failed: {last_error}")

    async def _call_openai_compatible_rest(
        self,
        provider_name: str,
        base_url: str,
        api_key: str,
        model: str,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        expect_json: bool = True,
        timeout_seconds: Optional[float] = None,
    ) -> AIProviderResult:
        """Executes real OpenAI-compatible chat completion REST call (Groq or OpenAI)."""
        if not api_key:
            raise AIProviderAuthError(f"{provider_name.capitalize()} API key is missing or unconfigured.")

        url = f"{base_url.rstrip('/')}/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        payload: Dict[str, Any] = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
        }
        if expect_json:
            payload["response_format"] = {"type": "json_object"}

        client = await self.get_http_client()
        timeout = timeout_seconds or settings.AI_TIMEOUT_SECONDS
        start_time = time.perf_counter()

        last_error = None
        for attempt in range(settings.AI_MAX_RETRIES + 1):
            try:
                resp = await client.post(url, headers=headers, json=payload, timeout=timeout)
                elapsed_ms = (time.perf_counter() - start_time) * 1000

                if resp.status_code == 200:
                    body = resp.json()
                    choices = body.get("choices", [])
                    if not choices:
                        raise AIProviderError(f"{provider_name} returned empty completion choices.")

                    raw_text = choices[0].get("message", {}).get("content", "")
                    structured = None
                    try:
                        structured = extract_json_from_text(raw_text)
                    except Exception:
                        if expect_json:
                            raise
                    usage = body.get("usage", {})

                    return AIProviderResult(
                        content=raw_text,
                        structured_data=structured,
                        provider=provider_name,
                        model=model,
                        is_ai_generated=True,
                        latency_ms=round(elapsed_ms, 2),
                        input_tokens=usage.get("prompt_tokens"),
                        output_tokens=usage.get("completion_tokens"),
                    )

                elif resp.status_code == 429:
                    retry_after = resp.headers.get("Retry-After")
                    delay = int(retry_after) if retry_after and retry_after.isdigit() else 5
                    raise AIProviderRateLimitError(
                        f"{provider_name.capitalize()} rate limit exceeded (HTTP 429). Retry after {delay}s.",
                        retry_after=delay,
                    )

                elif resp.status_code in (401, 403):
                    raise AIProviderAuthError(
                        f"{provider_name.capitalize()} authentication failed (HTTP {resp.status_code})."
                    )

                elif resp.status_code >= 500:
                    last_error = AIProviderError(f"{provider_name} server error (HTTP {resp.status_code}).")
                    if attempt < settings.AI_MAX_RETRIES:
                        await asyncio.sleep(1.0 * (2 ** attempt))
                        continue
                    raise last_error

                else:
                    raise AIProviderError(f"{provider_name} request failed with status {resp.status_code}: {resp.text[:200]}")

            except httpx.TimeoutException as exc:
                if attempt < settings.AI_MAX_RETRIES:
                    await asyncio.sleep(1.0)
                    continue
                raise AIProviderTimeoutError(f"{provider_name} request timed out after {timeout}s.") from exc
            except (AIProviderAuthError, AIProviderRateLimitError):
                raise
            except Exception as exc:
                if isinstance(exc, AIProviderError):
                    raise
                last_error = exc
                if attempt < settings.AI_MAX_RETRIES:
                    await asyncio.sleep(1.0)
                    continue
                raise AIProviderError(f"{provider_name} invocation error: {str(exc)}") from exc

        raise AIProviderError(f"{provider_name} request failed: {last_error}")

    # --- Public Orchestration Method ---

    async def call_ai_model(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        response_schema: Optional[Type[BaseModel]] = None,
        temperature: float = 0.7,
        timeout_seconds: Optional[float] = None,
        provider_override: Optional[str] = None,
        model_override: Optional[str] = None,
        allow_fallback: bool = True,
    ) -> AIProviderResult:
        """
        Public dispatch entry point.
        Selects configured provider, executes model call, and validates response schema.
        """
        provider = self.resolve_provider(provider_override)

        if provider == "none":
            if not allow_fallback:
                raise AIProviderAuthError(
                    "No AI model provider configured. Please provide GEMINI_API_KEY, GROQ_API_KEY, or OPENAI_API_KEY."
                )
            return AIProviderResult(
                content="",
                structured_data=None,
                provider="fallback",
                model="deterministic_fallback",
                is_ai_generated=False,
                latency_ms=0.0,
                fallback_reason="No AI provider configured (set GEMINI_API_KEY, GROQ_API_KEY, or OPENAI_API_KEY).",
            )

        expect_json = response_schema is not None or "json" in (prompt.lower() + (system_prompt or "").lower())

        try:
            if provider == "gemini":
                result = await self._call_gemini_rest(
                    prompt=prompt,
                    system_prompt=system_prompt,
                    model=model_override,
                    temperature=temperature,
                    expect_json=expect_json,
                    timeout_seconds=timeout_seconds,
                )
            elif provider == "groq":
                result = await self._call_openai_compatible_rest(
                    provider_name="groq",
                    base_url="https://api.groq.com/openai/v1",
                    api_key=self.get_groq_key(),
                    model=model_override or getattr(settings, "GROQ_MODEL", "llama-3.3-70b-versatile"),
                    prompt=prompt,
                    system_prompt=system_prompt,
                    temperature=temperature,
                    expect_json=expect_json,
                    timeout_seconds=timeout_seconds,
                )
            elif provider == "openai":
                result = await self._call_openai_compatible_rest(
                    provider_name="openai",
                    base_url="https://api.openai.com/v1",
                    api_key=self.get_openai_key(),
                    model=model_override or getattr(settings, "OPENAI_MODEL", "gpt-4o-mini"),
                    prompt=prompt,
                    system_prompt=system_prompt,
                    temperature=temperature,
                    expect_json=expect_json,
                    timeout_seconds=timeout_seconds,
                )
            else:
                raise AIProviderError(f"Unsupported provider: {provider}")

            # Validate against Pydantic schema if provided
            if response_schema and result.structured_data:
                try:
                    # Validate by instantiating schema
                    response_schema(**result.structured_data)
                except ValidationError as v_err:
                    raise AIProviderSchemaValidationError(
                        f"Model response failed schema validation: {v_err.errors()}"
                    ) from v_err

            return result

        except (AIProviderAuthError, AIProviderRateLimitError, AIProviderTimeoutError, AIProviderSchemaValidationError):
            raise
        except Exception as e:
            if not allow_fallback:
                raise AIProviderError(f"AI generation failed: {str(e)}") from e
            logger.warning(f"AI provider {provider} call failed ({e}). Returning identified fallback.")
            return AIProviderResult(
                content="",
                structured_data=None,
                provider="fallback",
                model="deterministic_fallback",
                is_ai_generated=False,
                latency_ms=0.0,
                fallback_reason=f"Provider {provider} failed: {str(e)}",
            )


# Global singleton instance
ai_provider_service = AIProviderService()
