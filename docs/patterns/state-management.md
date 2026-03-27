---
description: State mutation patterns - single-writer, consolidation, no wasted writes
category: patterns
triggers:
  - state management
  - state mutation
  - wasted write
  - double write
  - overwrite
  - single writer
  - consolidate
  - counter
  - increment
  - clear
  - pending
  - flag
  - schedule
  - defer
when: Writing code that reads, modifies, or writes shared state (metrics, flags, state, settings)
related:
  - patterns/coding-style
  - ooo/package
---

# State Mutation Patterns

> ## ⚠️ AUTOMATIC TRIGGER RULE
>
> When writing code that mutates shared state, Cascade MUST:
> 1. **Never write a value that will be immediately overwritten** — consolidate into one write
> 2. **Use a single function** for conditional mutations on the same state
> 3. **Deferred actions use persistent flags** — not in-memory state that can be lost

---

## 1. No Wasted Writes

If two writes to the same key happen in sequence and the second overwrites the first, the first write is wasted.

### Rule: Consolidate sequential writes into one

```go
// ❌ Two writes — first is wasted
metrics := GetMetrics(server)
metrics.Count++
SetMetrics(server, metrics)   // write 1
// ... then later in same flow:
SetMetrics(server, Metrics{}) // write 2 overwrites write 1

// ✅ Single function decides what to write
func MetricsTick(server *ooo.Server, increment bool) {
    _, err := ooo.Get[PendingReset](server, pendingKey)
    if err == nil {
        ResetMetrics(server)
    }
    if increment {
        metrics := GetMetrics(server)
        metrics.Count++
        SetMetrics(server, metrics)
    }
}
```

### Rule: Read state before deciding whether to write

```go
// ❌ Always writes, even when value hasn't changed
func UpdateStatus(server *ooo.Server, status string) {
    ooo.Set(server, "status", Status{Value: status})
}

// ✅ Only writes when needed
func UpdateStatus(server *ooo.Server, status string) {
    current, err := ooo.Get[Status](server, "status")
    if err == nil && current.Value == status {
        return
    }
    ooo.Set(server, "status", Status{Value: status})
}
```

---

## 2. Single Writer Per State Mutation

When a state value can be mutated by multiple conditions (increment, clear, reset), consolidate into one function that handles all cases.

### Rule: One function owns the decision of what to write

```go
// ❌ Caller decides — logic scattered
if shouldReset {
    SetMetrics(server, Metrics{})
} else if shouldIncrement {
    m := GetMetrics(server)
    m.Count++
    SetMetrics(server, m)
}

// ✅ Single function owns it
MetricsTick(server, shouldIncrement)
```

### Rule: Cleanup related state in the same function

```go
// ✅ ResetMetrics owns all side effects of resetting
func ResetMetrics(server *ooo.Server) {
    SetMetrics(server, Metrics{})
    ooo.Delete(server, pendingKey) // also cancels any pending schedule
}
```

---

## 3. Deferred Actions via Persistent Flags

When an action should happen later (e.g., "reset on next state transition"), use a persistent flag in storage.

### Rule: Use storage flags, not in-memory state

```go
// ❌ In-memory flag — lost on restart
var pendingReset bool

// ✅ Persistent flag in storage
func ScheduleResetMetrics(server *ooo.Server) {
    ooo.Set(server, "pending/reset/metrics/myservice", PendingReset{Pending: true})
}
```

### Rule: The consumer of the flag must delete it after acting

```go
func MetricsTick(server *ooo.Server, increment bool) {
    _, err := ooo.Get[PendingReset](server, pendingKey)
    if err == nil {
        ResetMetrics(server) // ResetMetrics deletes the flag internally
    }
    if increment {
        metrics := GetMetrics(server)
        metrics.Count++
        SetMetrics(server, metrics)
    }
}
```

### Rule: Immediate actions must cancel pending deferred actions

If an immediate clear happens, any pending scheduled clear must be cancelled — otherwise the flag persists and causes a spurious clear later.

```go
// ✅ Immediate reset also deletes pending flag
func ResetMetrics(server *ooo.Server) {
    SetMetrics(server, Metrics{})
    ooo.Delete(server, pendingKey)
}
```

---

## 4. Flag Naming Conventions

| Pattern | Key Format | Example |
|---------|-----------|---------|
| Pending action | `pending/{action}/{domain}/{variant}` | `pending/reset/metrics/myservice` |
| State value | `{domain}/{variant}` | `metrics/myservice` |
| Settings | `settings` | `settings` |

---

## 5. Edge Cases to Consider

1. **Deferred reset on already-zero state**: The reset is a no-op but the flag still gets consumed — the increment must not be skipped
2. **Multiple schedules before consumption**: Idempotent — setting the flag twice is harmless
3. **Immediate action while flag is pending**: Immediate action must delete the flag to prevent double-reset
