---
description: Mermaid diagram reference - syntax, types, and when to use each diagram
category: planning
triggers:
  - diagram
  - mermaid
  - flowchart
  - sequence diagram
  - ER diagram
  - state diagram
  - class diagram
  - gantt
  - architecture
  - data model
  - visual
when: User asks for diagrams, or planning context requires visual representation of architecture, data flow, or state
related:
  - plan/analyze
  - plan/export
---

# Mermaid Diagram Reference

> **Agent-facing**: Use Mermaid fenced code blocks (` ```mermaid `) for all diagrams.
> Never use ASCII art for anything beyond 3-4 boxes.
> Never generate images or use external diagram tools.

---

## When to Use Which Diagram

| Planning need | Diagram type | Trigger |
|--------------|-------------|---------|
| System architecture, component layout | `flowchart` | "how components connect", "architecture" |
| Request/response flow, API calls, timing | `sequenceDiagram` | "flow between services", "API sequence", "who calls what" |
| Data model, schema, relationships | `erDiagram` | "data model", "schema", "entities", "relationships" |
| Lifecycle, transitions, modes | `stateDiagram-v2` | "states", "transitions", "lifecycle", "modes" |
| Type hierarchy, interfaces, methods | `classDiagram` | "class structure", "interfaces", "inheritance" |
| Timeline, phases, dependencies | `gantt` | "phases", "timeline", "milestones", "schedule" |
| Proportions, distribution | `pie` | "breakdown", "distribution", "percentage" |
| Brainstorming, topic exploration | `mindmap` | "brainstorm", "explore", "overview of topics" |

---

## Syntax Quick Reference

### Flowchart

```mermaid
flowchart TD
    A[Client] -->|HTTP| B[API Gateway]
    B --> C{Auth?}
    C -->|Yes| D[Service]
    C -->|No| E[401 Unauthorized]
    D --> F[(Database)]
```

Node shapes:
- `[text]` — rectangle
- `(text)` — rounded
- `{text}` — diamond (decision)
- `[(text)]` — cylinder (database)
- `((text))` — circle

Direction: `TD` (top-down), `LR` (left-right), `BT` (bottom-top), `RL` (right-left)

---

### Sequence Diagram

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server
    participant DB as Database
    C->>S: POST /items
    S->>DB: INSERT item
    DB-->>S: OK
    S-->>C: 201 Created
```

Arrow types:
- `->>` solid with arrowhead
- `-->>` dashed with arrowhead
- `--)` solid async
- `---)` dashed async

Blocks: `alt`/`else`, `loop`, `opt`, `par`, `critical`, `break`

---

### ER Diagram

```mermaid
erDiagram
    USER ||--o{ ORDER : places
    ORDER ||--|{ LINE_ITEM : contains
    PRODUCT ||--o{ LINE_ITEM : "appears in"
    USER {
        string id PK
        string name
        string email
    }
    ORDER {
        string id PK
        string user_id FK
        datetime created
    }
```

Cardinality: `||` exactly one, `o|` zero or one, `}|` one or more, `}o` zero or more

---

### State Diagram

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Connecting: connect()
    Connecting --> Connected: onOpen
    Connecting --> Idle: onError
    Connected --> Idle: disconnect()
    Connected --> Reconnecting: onClose
    Reconnecting --> Connected: onOpen
    Reconnecting --> Idle: maxRetries
```

Special states: `[*]` start/end, `state "Name" as alias`

Composite: `state GroupName { ... }`

---

### Class Diagram

```mermaid
classDiagram
    class Server {
        +Storage storage
        +Start() error
        +Close()
    }
    class Storage {
        <<interface>>
        +Get(key) Object
        +Set(key, data) error
        +Delete(key) error
    }
    Server --> Storage : uses
```

Visibility: `+` public, `-` private, `#` protected

Relations: `-->` dependency, `--|>` inheritance, `..|>` implementation, `--*` composition, `--o` aggregation

---

### Gantt

```mermaid
gantt
    title Implementation Plan
    dateFormat YYYY-MM-DD
    section Phase 1
        Design           :a1, 2025-01-01, 5d
        Core impl        :a2, after a1, 10d
    section Phase 2
        Integration      :b1, after a2, 7d
        Testing          :b2, after b1, 5d
```

Task types: `:active`, `:done`, `:crit` (critical path), `:milestone`

---

### Pie

```mermaid
pie title Request Distribution
    "GET" : 45
    "POST" : 30
    "PUT" : 15
    "DELETE" : 10
```

---

### Mindmap

```mermaid
mindmap
    root((System))
        API
            REST
            WebSocket
        Storage
            Memory
            Embedded
        Auth
            JWT
            Roles
```

---

## Anti-Patterns

| Do NOT | Do instead |
|--------|-----------|
| ASCII art for anything beyond 3-4 boxes | Mermaid fenced code block |
| External tools (draw.io, Excalidraw) | Mermaid in markdown |
| Image generation / screenshots | Text-based Mermaid |
| Overly complex single diagram (>20 nodes) | Split into multiple focused diagrams |
| Diagram without context | Always precede with a sentence explaining what the diagram shows |
| Decorative diagrams | Every diagram must convey information not already in the text |

---

## Rules

1. **Always use ` ```mermaid ` fenced code blocks** — renders natively in GitHub, VS Code, Windsurf
2. **One diagram per concept** — don't combine architecture + data model + state in one diagram
3. **Label all arrows** — unlabeled arrows force the reader to guess
4. **Use aliases for long names** — `participant S as AuthService` not `participant AuthenticationService`
5. **Direction matters** — use `LR` for flows/pipelines, `TD` for hierarchies/architectures
