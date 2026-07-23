"""
Unified LLM Provider Service for CampusIQ RAG Pipeline.

Abstracts LLM provider integrations (Groq) with central configuration loading via settings,
exponential backoff, transient error retry strategies, health checks, and Retrieval-Only mode support.
"""

from abc import ABC, abstractmethod
import logging
import threading
import time
from typing import Any, Generator, Optional

from app.core.config import settings
from app.core.exceptions import CampusIQException

# Set up module logger
logger = logging.getLogger(__name__)


class LLMProviderError(CampusIQException):
    """Exception raised when LLM inference or API communication fails."""

    pass


class AuthenticationError(LLMProviderError):
    """Exception raised when LLM API authentication fails."""

    pass


def is_groq_configured() -> bool:
    """
    Check if GROQ_API_KEY is configured in settings.

    Returns:
        True if GROQ_API_KEY is present and non-empty, False otherwise.
    """
    api_key = settings.GROQ_API_KEY
    return bool(api_key and isinstance(api_key, str) and api_key.strip())


def get_masked_api_key() -> str:
    """
    Return masked API key string for secure logging.
    """
    key = settings.GROQ_API_KEY or ""
    if not key or len(key) < 8:
        return "[NOT CONFIGURED]"
    return f"{key[:4]}...{key[-4:]}"


class BaseLLMProvider(ABC):
    """Abstract Base Class for LLM Provider implementations."""

    @abstractmethod
    def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> str:
        """Synchronously generate completion response text."""
        pass

    @abstractmethod
    def check_health(self) -> bool:
        """Return True if LLM provider service is healthy and reachable."""
        pass


class GroqLLMProvider(BaseLLMProvider):
    """
    Groq API LLM Provider implementation configured via central settings.
    """

    def __init__(self):
        self._client: Any = None
        self._lock = threading.Lock()

    def _get_client(self) -> Any:
        if self._client is not None:
            return self._client

        with self._lock:
            if self._client is None:
                if not is_groq_configured():
                    logger.warning("GROQ_API_KEY is not configured in settings. Operating in Retrieval-Only mode.")
                    raise AuthenticationError(
                        "GROQ_API_KEY configuration is missing. Set GROQ_API_KEY in .env or environment."
                    )

                api_key = settings.GROQ_API_KEY.strip()
                masked_key = get_masked_api_key()

                try:
                    from groq import Groq  # type: ignore

                    logger.info("Initializing Groq client singleton with API Key (%s)...", masked_key)
                    self._client = Groq(api_key=api_key)
                    logger.info("Groq client initialized successfully.")
                except ImportError as err:
                    logger.error("groq package is missing. Install with 'pip install groq'.")
                    raise LLMProviderError("groq package is missing from environment.") from err
                except Exception as exc:
                    logger.exception("Failed to instantiate Groq client: %s", str(exc))
                    raise LLMProviderError(f"Failed to initialize Groq client: {exc}") from exc

        return self._client

    def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> str:
        if not system_prompt or not system_prompt.strip():
            raise ValueError("system_prompt must be a non-empty string.")
        if not user_prompt or not user_prompt.strip():
            raise ValueError("user_prompt must be a non-empty string.")

        target_model = model or settings.GROQ_MODEL
        target_temp = temperature if temperature is not None else settings.TEMPERATURE
        target_max_tokens = max_tokens if max_tokens is not None else settings.MAX_OUTPUT_TOKENS

        client = self._get_client()
        messages = [
            {"role": "system", "content": system_prompt.strip()},
            {"role": "user", "content": user_prompt.strip()},
        ]

        max_retries = 3
        backoff_delay = 0.5

        for attempt in range(1, max_retries + 1):
            start_time = time.perf_counter()
            try:
                response = client.chat.completions.create(
                    model=target_model,
                    messages=messages,
                    temperature=target_temp,
                    max_tokens=target_max_tokens,
                )
                elapsed_ms = (time.perf_counter() - start_time) * 1000.0

                usage = getattr(response, "usage", None)
                if usage:
                    prompt_tokens = getattr(usage, "prompt_tokens", 0)
                    comp_tokens = getattr(usage, "completion_tokens", 0)
                    total_tokens = getattr(usage, "total_tokens", 0)
                    logger.info(
                        "Groq completion finished in %.2f ms (Tokens: %d prompt, %d completion, %d total).",
                        elapsed_ms,
                        prompt_tokens,
                        comp_tokens,
                        total_tokens,
                    )
                else:
                    logger.info("Groq completion finished in %.2f ms.", elapsed_ms)

                content = response.choices[0].message.content
                return (content or "").strip()

            except Exception as exc:
                elapsed_ms = (time.perf_counter() - start_time) * 1000.0
                err_msg = str(exc).lower()

                if "invalid_api_key" in err_msg or "unauthorized" in err_msg or "401" in err_msg:
                    logger.error("Groq Authentication error: %s", str(exc))
                    raise AuthenticationError(f"Groq API authentication failed: {exc}") from exc

                logger.warning(
                    "Groq API attempt %d/%d failed in %.2f ms: %s",
                    attempt,
                    max_retries,
                    elapsed_ms,
                    str(exc),
                )

                if attempt == max_retries:
                    logger.exception("Groq API calls exhausted all %d retries.", max_retries)
                    raise LLMProviderError(f"Groq API failed after retries: {exc}") from exc

                time.sleep(backoff_delay)
                backoff_delay *= 2.0

        raise LLMProviderError("Groq API call failed unexpectedly.")

    def check_health(self) -> bool:
        """Check health of Groq service."""
        if not is_groq_configured():
            return False
        try:
            client = self._get_client()
            client.models.list()
            return True
        except Exception as exc:
            logger.warning("Groq health check failed: %s", str(exc))
            return False


# Singleton provider instance
_provider_instance = GroqLLMProvider()


def get_llm_provider() -> BaseLLMProvider:
    """Get singleton instance of active LLM Provider."""
    return _provider_instance


def generate_response(
    system_prompt: str,
    user_prompt: str,
    model: Optional[str] = None,
    temperature: Optional[float] = None,
    max_tokens: Optional[int] = None,
) -> str:
    """
    Public entrypoint for generating LLM completions.
    Delegates to active provider instance.
    """
    provider = get_llm_provider()
    return provider.generate(
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        model=model,
        temperature=temperature,
        max_tokens=max_tokens,
    )


def check_llm_health() -> bool:
    """Check health of LLM Provider."""
    try:
        return _provider_instance.check_health()
    except Exception:
        return False
