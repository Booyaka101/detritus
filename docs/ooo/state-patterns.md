---
description: Server-side state management using ooo typed CRUD and persistent flags
category: core
triggers:
  - ooo state
  - ooo metrics
  - ooo pending
  - ooo flag
  - ooo.Get state
  - ooo.Set state
  - pending reset
  - metrics tick
when: Managing server-side state (metrics, flags, scheduled actions) through ooo's typed CRUD helpers
related:
  - ooo/package
  - patterns/state-management
  - patterns/coding-style
---

# Server-Side State with ooo

This doc covers how to apply state mutation patterns (see `patterns/state-management`) using ooo's typed CRUD helpers. ooo storage paths act as persistent key-value state, and `ooo.Get`/`ooo.Set`/`ooo.Delete` provide the typed access layer.

---

## Typed State Access

Use generic helpers instead of raw JSON to avoid marshal/unmarshal boilerplate:

```go
// Read typed state
metrics, err := ooo.Get[Metrics](server, "metrics/myservice")

// Write typed state
ooo.Set(server, "metrics/myservice", Metrics{Count: 42})

// Delete state
ooo.Delete(server, "metrics/myservice")
```

---

## Metrics Tick Pattern

A common pattern: on each tick, check for a pending reset flag before incrementing. One function owns the decision.

```go
const pendingKey = "pending/reset/metrics/myservice"

func MetricsTick(server *ooo.Server, increment bool) {
    _, err := ooo.Get[PendingReset](server, pendingKey)
    if err == nil {
        ResetMetrics(server)
    }
    if increment {
        metrics, _ := ooo.Get[Metrics](server, "metrics/myservice")
        metrics.Count++
        ooo.Set(server, "metrics/myservice", metrics)
    }
}

func ResetMetrics(server *ooo.Server) {
    ooo.Set(server, "metrics/myservice", Metrics{})
    ooo.Delete(server, pendingKey)
}

func ScheduleResetMetrics(server *ooo.Server) {
    ooo.Set(server, pendingKey, PendingReset{Pending: true})
}
```

Key points:
- `MetricsTick` is the single writer — callers don't decide what to write
- `ResetMetrics` deletes the pending flag to prevent double-reset
- `ScheduleResetMetrics` is idempotent — setting the flag twice is harmless

---

## Conditional Writes

Avoid writing to ooo storage when the value hasn't changed:

```go
func UpdateStatus(server *ooo.Server, status string) {
    current, err := ooo.Get[Status](server, "status")
    if err == nil && current.Value == status {
        return // no-op
    }
    ooo.Set(server, "status", Status{Value: status})
}
```

---

## Path Conventions for State

ooo paths serve as the key namespace. Use consistent conventions:

| State type | Path pattern | Example |
|-----------|-------------|---------|
| Pending action | `pending/{action}/{domain}/{service}` | `pending/reset/metrics/myservice` |
| Domain state | `{domain}/{service}` | `metrics/myservice` |
| Settings | `settings` | `settings` |

All paths used for state should have appropriate filters registered (see `ooo/package` for `OpenFilter`, `WriteFilter`, etc.).
