---
name: error-handling-patterns
description: Master error handling patterns across languages including exceptions, Result types, error propagation, and graceful degradation to build resilient applications. Use when implementing error handling, designing APIs, or improving application reliability.
---

# Error Handling Patterns

Build resilient applications with robust error handling strategies that gracefully handle failures and provide excellent debugging experiences.

---

## When to Use This Skill

- Implementing error handling in new features
- Designing error-resilient APIs and boundaries
- Debugging production issues and tracing failure modes
- Improving application reliability and fault tolerance
- Creating actionable error messages for users and developers
- Implementing retry, timeout, and circuit breaker patterns
- Handling asynchronous and concurrent errors
- Building fault-tolerant distributed systems

---

## Core Concepts

### 1. Error Handling Philosophies

- **Exceptions**: Traditional `try-catch`, disrupts control flow. Best for unexpected conditions, operational faults, or deep call-stack errors.
- **Result Types**: Explicit `Result<T, E>` / discriminated unions (`{ success: true, data } | { success: false, error }`). Functional approach that forces the caller to explicitly handle potential failures.
- **Error Codes**: C-style return values. Discouraged unless required by low-level or C-ABI interfaces.
- **Option / Maybe Types**: For nullable or optional values without an explicit error reason.

#### When to Use Each:
- **Exceptions**: Unexpected errors, unhandled edge cases, disk/network failures, system-level exceptional conditions.
- **Result Types**: Domain/expected errors, validation failures, business logic branches where failure is a normal outcome.
- **Panics / Crashes / Process Exits**: Truly unrecoverable conditions, fatal programmer errors, invariant violations (e.g., corrupted memory, missing required build-time configs).

### 2. Error Categories

- **Recoverable Errors**:
  - Network timeouts and transient connection drops
  - Missing temporary files or cache misses
  - Invalid user input or validation errors
  - API rate limits (HTTP 429)
  - Downstream service temporary unavailability
- **Unrecoverable Errors**:
  - Out of memory (OOM)
  - Stack overflow
  - Programming bugs (type mismatches, null pointers, missing properties)
  - Critical configuration corruption

---

## Best Practices

1. **Fail Fast**: Validate inputs and invariants early at system boundaries.
2. **Preserve Context**: Include stack traces, operation metadata, user/request IDs, and timestamps. Use error chaining (`from err` in Python, `{ cause }` in JavaScript).
3. **Meaningful Messages**: Explain clearly what happened, the context, and what the consumer or user can do to fix it.
4. **Log Appropriately**:
   - High severity / unexpected errors $\rightarrow$ log with stack trace.
   - Expected domain errors (e.g., invalid login, expected validation fail) $\rightarrow$ do not spam error logs.
5. **Handle at the Right Level**: Only catch an error if you can meaningfully handle it, enrich it with context, or transform it for the caller.
6. **Clean Up Resources**: Always release resources using deterministic cleanup (`finally`, Python context managers `with`, Go `defer`, or modern `using`/Disposable patterns).
7. **Don't Swallow Errors**: Never write an empty catch block. Either handle, log, or re-throw.
8. **Type-Safe Errors**: Use typed error hierarchies or discriminated unions instead of generic strings.

---

## Worked Examples

### Comprehensive Python Example (Chaining & Wrapping)

```python
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class ApplicationError(Exception):
    """Base application exception."""
    def __init__(self, message: str, code: str = "INTERNAL_ERROR"):
        super().__init__(message)
        self.code = code

class ValidationError(ApplicationError):
    def __init__(self, message: str):
        super().__init__(message, code="VALIDATION_ERROR")

class NotFoundError(ApplicationError):
    def __init__(self, resource: str, resource_id: str):
        super().__init__(f"{resource} '{resource_id}' not found", code="NOT_FOUND")

class ExternalServiceError(ApplicationError):
    def __init__(self, message: str, service: str, details: Optional[dict] = None):
        super().__init__(message, code="EXTERNAL_SERVICE_ERROR")
        self.service = service
        self.details = details or {}

def process_order(order_id: str) -> Order:
    """Process order with comprehensive error handling."""
    try:
        # 1. Validate input (Fail fast)
        if not order_id:
            raise ValidationError("Order ID is required")

        # 2. Fetch order
        order = db.get_order(order_id)
        if not order:
            raise NotFoundError("Order", order_id)

        # 3. Process payment with error wrapping
        try:
            payment_result = payment_service.charge(order.total)
        except PaymentServiceError as e:
            logger.error(f"Payment failed for order {order_id}: {e}")
            raise ExternalServiceError(
                "Payment processing failed",
                service="payment_service",
                details={"order_id": order_id, "amount": order.total}
            ) from e

        # 4. Update order state
        order.status = "completed"
        order.payment_id = payment_result.id
        db.save(order)

        return order

    except ApplicationError:
        # Re-raise known application domain errors without mangling
        raise
    except Exception as e:
        # Catch and log truly unexpected exceptions with full context
        logger.exception(f"Unexpected error processing order {order_id}")
        raise ApplicationError("Order processing failed", code="INTERNAL_ERROR") from e
```

### TypeScript / Modern JavaScript Example (Result Type & Error Cause)

```typescript
type Result<T, E> = 
  | { success: true; data: T }
  | { success: false; error: E };

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = "ApiError";
  }
}

// Result pattern for expected failures
export async function validateApiKey(apiKey?: string): Promise<Result<string, string>> {
  if (!apiKey || apiKey.trim().length === 0) {
    return { success: false, error: "API key is required" };
  }
  return { success: true, data: apiKey.trim() };
}

// Exception wrapping with modern 'cause' chaining
export async function fetchExternalData(url: string): Promise<any> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new ApiError(`HTTP request failed with status ${response.status}`, response.status);
    }
    return await response.json();
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError("Failed to reach external service", 502, { cause: err });
  }
}
```

---

## Common Pitfalls

- **Catching Too Broadly**: Catching top-level exceptions (`except Exception:`, `catch (e) {}`) too low in the stack hides syntax and programming bugs.
- **Empty Catch Blocks**: Silently swallowing errors leaves systems in broken, untraceable intermediate states.
- **Logging and Re-throwing**: Logging an error at every layer of the call stack causes log flooding and duplicate alarms.
- **Not Cleaning Up Resources**: Failing to close files, database connections, or mutexes during error exits causes resource exhaustion.
- **Poor Error Messages**: Vague messages like `"An error occurred"` make debugging nearly impossible.
- **Returning Magic Error Codes**: Prefer typed exceptions or explicit `Result` objects over returning integers (e.g. `-1`) or magic strings.
- **Ignoring Asynchronous Errors**: Unhandled promise rejections or unawaited async operations crash processes or silently disappear.
