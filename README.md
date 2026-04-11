# detritus

MCP knowledge base server. Exposes coding knowledge as MCP tools (`kb_list`, `kb_get`, `kb_search`) for AI assistants across VS Code, Windsurf, Cursor, Verdent, and Cursor.

## Quick Install

**Linux / macOS / Windows (Git Bash):**
```bash
curl -sSL https://raw.githubusercontent.com/benitogf/detritus/main/install.sh | sh
```

**Windows (PowerShell):**
```powershell
irm https://raw.githubusercontent.com/benitogf/detritus/main/install.ps1 | iex
```

Or download the binary directly from [Releases](https://github.com/benitogf/detritus/releases), place it in your PATH, then run:

```bash
detritus --setup
```

Both methods download the binary and call `detritus --setup`, which auto-detects installed editors and configures:

- **Windsurf**: `~/.codeium/windsurf/mcp_config.json`
- **VS Code**: `mcp.json` + shared prompts/instructions/agent in `~/.copilot/`
- **Cursor**: `mcp.json`
- **Verdent**: `~/.verdent/mcp.json` + `VERDENT.md` rules + skills in `~/.verdent/skills/`

Restart your editor after install.

## Usage

Once installed, the detritus MCP server is available in your editor. Use the slash commands or ask directly:

| Slash command | Knowledge doc |
|---------------|---------------|
| `/truthseeker` | Evidence-based reasoning, push back on assumptions |
| `/plan` | Requirements analysis workflow |
| `/grow` | KB improvement from conversation corrections |
| `/optimize` | KB retrieval optimization |
| `/research-first` | Exhaust resources before asking the user |
| `/testing` | Testing decision table |
| `/line-of-sight` | Flat code style — early returns, no deep nesting |
| `/coding-style` | Naming, error handling, formatting, commits |
| `/go-modern` | Modern Go idioms (1.22+/1.24+) |

## MCP Tools

| Tool | Description |
|------|-------------|
| `kb_list` | List all available documents with descriptions |
| `kb_get` | Get a full document by name |
| `kb_search` | Semantic search across all documents |

## Included Documents

### Principles
- **truthseeker** — Evidence-based reasoning, pushback, intellectual humility
- **research-first** — Exhaust available resources before asking

### Patterns
- **coding-style** — Naming, error handling, formatting, commits
- **go-modern** — Modern Go idioms (1.22+/1.24+)
- **async-events** — Channel-based pub/sub, backpressure
- **state-management** — Single source of truth, immutable updates
- **line-of-sight** — Early returns, flat code structure

### Testing
- **testing** — Testing index and decision table
- **go-backend-async** — Deterministic async testing
- **go-backend-mock** — Minimal mocking at boundaries
- **go-backend-e2e** — End-to-end lifecycle tests

### ooo ecosystem
- **ooo-package** — Server setup, filters, CRUD, WebSocket subscriptions
- **ooo-nopog** — PostgreSQL storage adapter
- **ooo-pivot** — AP distributed multi-instance sync
- **ooo-auth** — JWT authentication
- **ooo-client-js** — JavaScript/React WebSocket client
- **ooo-filters-internals** — Filter bypass, direct storage, LimitFilter internals

## How It Works

All documents are embedded in the binary at compile time (`embed.FS`). No external files or runtime dependencies.

The `kb_get` tool description contains keyword-packed summaries. When the AI sees relevant keywords in your prompt, it automatically calls `kb_get` — no manual invocation needed. Slash commands (`/plan`, `/grow`, etc.) also trigger the relevant doc.

## Troubleshooting

```bash
detritus --version
detritus --setup --dry-run   # preview what would be written without touching disk
```

### Windsurf
1. Config: `~/.codeium/windsurf/mcp_config.json`
2. Binary path uses **forward slashes** (even on Windows)
3. **Full restart** required (File > Exit)

### VS Code
1. Config: `~/.config/Code/User/mcp.json` (Linux), `~/Library/Application Support/Code/User/mcp.json` (macOS)
2. Config uses **`"servers"`** key (not `"mcpServers"`)
3. Run `Developer: Reload Window`

### Cursor
1. Config: `~/.config/Cursor/User/mcp.json` (Linux), `%APPDATA%\Cursor\User\mcp.json` (Windows)
2. Uses **`"mcpServers"`** key

### Verdent
1. Config: `~/.verdent/mcp.json`
2. Rules: `~/.verdent/VERDENT.md`
3. Skills: `~/.verdent/skills/`

## Development

```bash
go generate ./...   # rebuild index + model
go test ./...
go build -o detritus .
```

## Release

Uses [goreleaser](https://goreleaser.com/) for cross-platform builds. Push a tag to trigger GitHub Actions:

```bash
git tag v3.1.0
git push origin v3.1.0
```
