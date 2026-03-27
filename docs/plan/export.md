---
description: Generate planning documents with diagrams and export to PDF
category: planning
triggers:
  - export
  - planning document
  - generate document
  - PDF
  - export plan
  - write document
  - architecture document
  - design document
when: User wants a polished planning document with diagrams, exported as .md and .pdf
related:
  - plan/analyze
  - plan/diagrams
---

# Planning Document Export

> ## THIS COMMAND IMPLEMENTS DIRECTLY
>
> When `/plan-export` is invoked:
> 1. Gather context from the current conversation, prior `/plan` output, or provided materials
> 2. Generate a structured `.md` document with Mermaid diagrams
> 3. Convert to PDF
> 4. Output both files

---

## Step 1: Check Tooling

Verify PDF conversion tool is available. If not, install it.

**Primary tool**: `npx @ml-lubich/markpdf`

```bash
# Check if npx is available
npx --version
```

If `npx` is not found:
- Tell the user: "Node.js is required for PDF export. Install from https://nodejs.org/"
- Still generate the `.md` file — PDF conversion can happen later

If npx is available, the tool will auto-download on first use. No global install needed.

---

## Step 2: Gather Context

Sources of planning content (check in order):
1. **Explicit input** — user provided text, requirements, or a file to export
2. **Current conversation** — prior `/plan` analysis output in this session
3. **Existing docs** — `.md` files the user points to

If no context is available, ask: "What should this planning document cover?"

---

## Step 3: Generate Document

### File naming
- Infer from context: `{topic}-planning.md` (e.g., `auth-migration-planning.md`)
- If user provides a name, use it exactly
- Default location: project root (unless user specifies otherwise)

### Structure template

Use these sections as **guidelines** — adapt to what the context actually contains. Skip sections that don't apply. Add sections the context demands.

```markdown
# {Title}

## Overview

{1-3 paragraphs: what this plan covers, why it matters, key constraints}

## Architecture

{System-level view of components and their relationships}

```mermaid
flowchart TD
    ...
```

## Data Model

{Entity definitions and relationships — only if the plan involves data}

```mermaid
erDiagram
    ...
```

## Flow

{Key request/response flows or process sequences}

```mermaid
sequenceDiagram
    ...
```

## State Lifecycle

{State transitions — only if the plan involves stateful components}

```mermaid
stateDiagram-v2
    ...
```

## Implementation Phases

```mermaid
gantt
    ...
```

| Phase | Description | Dependencies |
|-------|------------|-------------|
| 1     | ...        | None        |
| 2     | ...        | Phase 1     |

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| ...  | ...    | ...       |

## Open Questions

- {Unresolved decisions}
```

### Diagram rules

Follow `plan/diagrams` guidance:
- Use Mermaid fenced code blocks for all diagrams
- One diagram per concept — don't combine architecture + data model
- Label all arrows
- Precede each diagram with a sentence explaining what it shows
- Skip diagram types that don't apply to the context

---

## Step 4: Export to PDF

After writing the `.md` file, convert to PDF:

```bash
npx @ml-lubich/markpdf {filename}.md -o {filename}.pdf
```

If `markpdf` fails, try fallback:

```bash
npx md-to-pdf {filename}.md
```

If both fail, inform the user:
- The `.md` file is complete and ready
- PDF can be generated manually or with an alternative tool

---

## Step 5: Output

Report to the user:
- Path to the generated `.md` file
- Path to the generated `.pdf` file (if successful)
- Brief summary of what sections were included and why

---

## Anti-Patterns

| Do NOT | Do instead |
|--------|-----------|
| Generate a document without context | Ask what to cover |
| Include every section regardless of relevance | Adapt structure to context |
| Use ASCII art | Use Mermaid (see `plan/diagrams`) |
| Write prose-heavy paragraphs | Prefer tables, lists, and diagrams |
| Commit scripts to the repo for PDF conversion | Use npx (ephemeral, no install) |
| Generate only PDF without .md source | Always output both |
| Use generic filenames like `plan.md` | Infer descriptive name from content |
