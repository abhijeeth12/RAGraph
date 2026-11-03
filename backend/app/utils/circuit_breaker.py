"""
Asynchronous Circuit Breaker implementation for third-party service calls.
Protects local worker pools from exhaustion during external provider outages.
"""
from __future__ import annotations
import asyncio
import time
from enum import Enum
from typing import Callable, Any, Optional
from loguru import logger


class CircuitState(str, Enum):
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"


class CircuitBreakerOpenError(Exception):
    """Raised when an operation is rejected by an open circuit breaker."""
    def __init__(self, name: str, retry_after: float):
        super().__init__(f"Circuit breaker '{name}' is OPEN. Retry after {retry_after:.1f}s.")
        self.name = name
        self.retry_after = retry_after


class AsyncCircuitBreaker:
    def __init__(
        self,
        name: str,
        failure_threshold: int = 5,
        cooldown_seconds: float = 30.0,
        expected_exceptions: tuple = (Exception,),
    ):
        self.name = name
        self.failure_threshold = failure_threshold
        self.cooldown_seconds = cooldown_seconds
        self.expected_exceptions = expected_exceptions

        self._state = CircuitState.CLOSED
        self._failure_count = 0
        self._last_state_change = time.time()
        self._lock = asyncio.Lock()

    @property
    def state(self) -> CircuitState:
        if self._state == CircuitState.OPEN:
            if time.time() - self._last_state_change >= self.cooldown_seconds:
                return CircuitState.HALF_OPEN
        return self._state

    async def call(self, func: Callable, *args: Any, **kwargs: Any) -> Any:
        async with self._lock:
            current_state = self.state
            if current_state == CircuitState.OPEN:
                retry_after = max(0.0, self.cooldown_seconds - (time.time() - self._last_state_change))
                logger.warning(f"[CIRCUIT-BREAKER] {self.name} is OPEN — fast failing request. Retry after {retry_after:.1f}s")
                raise CircuitBreakerOpenError(self.name, retry_after)
            elif current_state == CircuitState.HALF_OPEN:
                self._state = CircuitState.HALF_OPEN

        try:
            result = await func(*args, **kwargs)
            async with self._lock:
                if self._state == CircuitState.HALF_OPEN or self._failure_count > 0:
                    logger.info(f"[CIRCUIT-BREAKER] {self.name} recovered to CLOSED state.")
                    self._state = CircuitState.CLOSED
                    self._failure_count = 0
                    self._last_state_change = time.time()
            return result
        except self.expected_exceptions as exc:
            async with self._lock:
                self._failure_count += 1
                logger.warning(
                    f"[CIRCUIT-BREAKER] {self.name} recorded failure {self._failure_count}/{self.failure_threshold}: {exc}"
                )
                if self._failure_count >= self.failure_threshold or self._state == CircuitState.HALF_OPEN:
                    self._state = CircuitState.OPEN
                    self._last_state_change = time.time()
                    logger.error(f"[CIRCUIT-BREAKER] {self.name} threshold tripped -> OPEN for {self.cooldown_seconds}s")
            raise exc


# Pre-configured circuit breakers for external third-party services
google_oauth_circuit_breaker = AsyncCircuitBreaker(
    name="google_oauth",
    failure_threshold=5,
    cooldown_seconds=30.0,
)

llm_circuit_breaker = AsyncCircuitBreaker(
    name="llm_provider",
    failure_threshold=5,
    cooldown_seconds=30.0,
)
