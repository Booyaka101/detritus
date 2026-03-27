---
description: Self-documenting code - naming, extraction, readability rules for AI
category: patterns
triggers:
  - naming
  - function name
  - rename
  - readability
  - self-documenting
  - extract function
  - inline code
  - coding style
  - code style
when: Writing or modifying any code - names must reflect current behavior, inline operations should be extracted into named functions
related:
  - state-management
---

# Self-Documenting Code

> ## ⚠️ AUTOMATIC TRIGGER RULE
>
> When writing or modifying code, Cascade MUST ensure:
> 1. **Every function name describes its current behavior** — not its historical or intended behavior
> 2. **Inline multi-step operations are extracted** into named functions
> 3. **Side effects are visible in the name** — if it writes, deletes, or schedules, the name says so

---

## 1. Names Must Reflect Current Behavior

A function name is a contract. If the behavior changes, the name must change.

### Rule: If a function no longer does what its name says, rename it immediately

```go
// ❌ ResetMetrics used to reset immediately, now it schedules a deferred reset
func ResetMetrics(server *ooo.Server) {
    ooo.Set(server, "pending/reset/metrics", PendingReset{Pending: true})
}

// ✅ Name reflects actual behavior
func ScheduleResetMetrics(server *ooo.Server) {
    ooo.Set(server, "pending/reset/metrics", PendingReset{Pending: true})
}
```

### Rule: Side effects must be visible in the name

```go
// ❌ Name suggests read-only, but it writes
func GetOrCreateUser(db *sql.DB, name string) User { ... }

// ✅ Side effect is clear
func EnsureUser(db *sql.DB, name string) User { ... }
```

### Rule: Deferred vs immediate must be distinguished

```go
// ✅ Clear distinction between immediate and scheduled
func ResetMetrics(server *ooo.Server)         { ... } // zeros metrics now
func ScheduleResetMetrics(server *ooo.Server)  { ... } // sets flag for later
```

---

## 2. Extract Inline Operations

When multiple steps are performed inline, extract them into a named function that describes the combined operation.

### Rule: If a block of code has a describable purpose, it should be a function

```go
// ❌ Inline multi-step operation
metrics := GetMetrics(server)
metrics.Count++
SetMetrics(server, metrics)

// ✅ Extracted with clear name
func IncrementMetrics(server *ooo.Server) {
    metrics := GetMetrics(server)
    metrics.Count++
    SetMetrics(server, metrics)
}
```

### Rule: Conditional mutation blocks should be functions

```go
// ❌ Inline conditional logic scattered across caller
pending, err := ooo.Get[PendingReset](server, key)
if err == nil {
    SetMetrics(server, Metrics{})
    ooo.Delete(server, key)
} else {
    metrics := GetMetrics(server)
    metrics.Count++
    SetMetrics(server, metrics)
}

// ✅ Extracted: caller just says what it wants
MetricsTick(server, true)
```

---

## 3. Naming Conventions

| Pattern | Convention | Example |
|---------|-----------|---------|
| Immediate action | Verb + Noun | `ResetMetrics`, `SetMetrics` |
| Deferred/scheduled action | `Schedule` + Verb + Noun | `ScheduleResetMetrics` |
| Conditional tick/step | Noun + `Tick` | `MetricsTick` |
| Predicate check | `Is`/`Has`/`Can` + Noun | `IsReady`, `HasPending` |

---

## 4. When Refactoring

1. **Change behavior → change name** in the same commit
2. **Update all callers** — never leave a caller using a stale name
3. **If two functions now exist** (immediate + deferred), ensure both names make the distinction obvious
4. **Search the codebase** for all usages before renaming — use grep, not assumptions
