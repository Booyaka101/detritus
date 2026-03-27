---
description: Install or update detritus MCP knowledge base server
---

# Setup Detritus MCP Server

Detect the user's OS and **shell** before proceeding. On Windows, check if the terminal is PowerShell or a bash-like shell (Git Bash, WSL, MSYS2). Run ONLY the commands matching their platform and shell.

## Step 1: Install the binary

### Linux / macOS / Windows (Git Bash, WSL, MSYS2)

// turbo
```bash
curl -sSL https://raw.githubusercontent.com/benitogf/detritus/main/install.sh | sh
```

### Windows (PowerShell only)

// turbo
```powershell
irm https://raw.githubusercontent.com/benitogf/detritus/main/install.ps1 | iex
```

## Step 2: Verify MCP config

The install script automatically configures `~/.codeium/windsurf/mcp_config.json` (`~` = `%USERPROFILE%` on Windows).

Read the config file and verify the `"detritus"` entry exists with the correct binary path:
- **Linux/macOS**: `/usr/local/bin/detritus`
- **Windows**: `C:/Users/USERNAME/AppData/Local/detritus/detritus.exe` (forward slashes)

## Step 3: Select target project

Check the workspace roots (available from IDE metadata). **Install project files only to the root the user selects.**

- **Single root**: use it directly, no prompt needed.
- **Multiple roots**: list all workspace roots and ask the user which one should receive the MCP workflow files. Install to that root only.

Let `TARGET` be the selected root for the steps below.

## Step 4: Install project files to TARGET

### 4a. Download `.windsurfrules`

If `TARGET/.windsurfrules` does not exist, download it:

#### Linux / macOS / Windows (Git Bash, WSL, MSYS2)

// turbo
```bash
[ ! -f .windsurfrules ] && curl -sSL https://raw.githubusercontent.com/benitogf/detritus/main/templates/.windsurfrules -o .windsurfrules
```

#### Windows (PowerShell only)

// turbo
```powershell
if (-not (Test-Path .windsurfrules)) { irm https://raw.githubusercontent.com/benitogf/detritus/main/templates/.windsurfrules | Set-Content .windsurfrules -Encoding UTF8 }
```

### 4b. Create the setup workflow bootstrapper

Create `TARGET/.windsurf/workflows/detritus/setup-detritus.md` if it doesn't exist:

```markdown
---
description: Install or update detritus MCP knowledge base server
---

Fetch the latest setup instructions from:
https://raw.githubusercontent.com/benitogf/detritus/main/templates/workflows/setup-detritus.md

Read that URL and execute all the steps in the fetched document.
```

### 4c. Create workflow aliases from the installed binary

Run `detritus --list` to get all available document names and descriptions directly from the **on-disk binary**. This bypasses the running MCP server process, which may still be serving stale data from a previous version.

- **Linux/macOS**: `detritus --list`
- **Windows (PowerShell)**: `& "$env:LOCALAPPDATA\detritus\detritus.exe" --list`

The output is tab-separated: `name<TAB>description`, one document per line. Subdirectory docs use `/` in the name (e.g., `scaffold/create`).

For each document, create or update a workflow alias file at `TARGET/.windsurf/workflows/detritus/{alias}.md`:

- **Create** the file if it doesn't exist
- **Update** the description in the frontmatter if it differs from the binary's output

Deriving the alias filename from the document name:

- **Single segment** (e.g., `diagrams`): use as-is → `diagrams.md`
- **Two segments** where first is the group:
  - If the last segment is `index`, use the group name (e.g., `testing/index` → `testing.md`)
  - If the last segment is unique enough, use just the last segment (e.g., `scaffold/create` → `create.md`)
  - If the last segment needs the group for context, join with `-` (e.g., `plan/analyze` → `plan.md`, `plan/export` → `plan-export.md`, `testing/go-backend-async` → `testing-go-backend-async.md`)
- The `kb_get` call inside must always use the **full original name** (e.g., `scaffold/create`, `plan/analyze`)

Special alias mappings (hardcoded):

| Doc name | Alias file | Workflow command |
|----------|-----------|-----------------|
| `plan/analyze` | `plan.md` | `/plan` |
| `plan/export` | `plan-export.md` | `/plan-export` |
| `plan/diagrams` | `diagrams.md` | `/diagrams` |
| `testing/index` | `testing.md` | `/testing` |
| `scaffold/create` | `create.md` | `/create` |
| `meta/truthseeker` | `truthseeker.md` | `/truthseeker` |
| `meta/grow` | `grow.md` | `/grow` |
| `meta/optimize` | `optimize.md` | `/optimize` |
| `ooo/*` | `ooo-{name}.md` | `/ooo-{name}` |
| `testing/go-backend-*` | `testing-go-backend-{name}.md` | `/testing-go-backend-{name}` |
| `patterns/*` | `{name}.md` | `/{name}` |

Each workflow alias file should follow this exact format:

```markdown
---
description: {description from --list}
---

Call kb_get(name="{full_name}") and follow the instructions in the returned document.
```

**If `detritus --list` fails** (binary too old — pre-v1.5.0), fall back to `kb_list()` via MCP. If MCP is also unavailable (first-time install), tell the user to restart Windsurf and re-run `/setup-detritus`.

### 4d. Clean up old flat installations

Previous versions of detritus installed workflow aliases directly into `TARGET/.windsurf/workflows/`. Check if any detritus-created alias files exist there (outside the `detritus/` subfolder).

To identify detritus-created files: use the document names from `detritus --list` (or `kb_list()` as fallback). Any `.md` file in `TARGET/.windsurf/workflows/` whose name (without `.md`) matches a document name or alias name — or is `setup` or `setup-detritus` — is a detritus-created file. Also check for these known old names: `_truthseeker.md`, `scaffold-simple-service.md`, `create-app.md`, `create-service.md`, `setup.md`, `ooo-package.md`, `ooo-auth.md`, `ooo-client-js.md`, `ooo-nopog.md`, `ooo-pivot.md`, `async-events.md`, `go-modern.md`, `coding-style.md`, `state-management.md`.

Also clean up old alias files inside `TARGET/.windsurf/workflows/detritus/` that no longer match any current document. Known old flat names that were restructured into folders: `ooo-package.md`, `ooo-auth.md`, `ooo-client-js.md`, `ooo-nopog.md`, `ooo-pivot.md`, `testing-go-backend-async.md`, `testing-go-backend-e2e.md`, `testing-go-backend-mock.md`, `async-events.md`, `go-modern.md`, `coding-style.md`, `state-management.md`, `plan.md` (replaced by `plan.md` pointing to `plan/analyze`), `scaffold-simple-service.md`.

**Important**: Some old alias filenames (e.g., `ooo-package.md`) match the new alias filenames (e.g., `ooo-package.md` for `ooo/package`). Only delete an alias if its `kb_get` call inside uses an old name that no longer exists. If the content already points to the correct new name, leave it.

Delete only those files. Do **not** delete any other files or folders — those are user-created.

## Step 5: Restart Windsurf

Tell the user to **fully close Windsurf** (File > Exit, not just close the window) and reopen it. After restart, the `kb_list`, `kb_get`, and `kb_search` tools will serve the updated documents.

No re-run is needed — workflow aliases were already created from the installed binary in Step 4c.

## Update

To update to the latest version, re-run all steps. Since Step 4c reads directly from the installed binary (`detritus --list`), new documents are discovered immediately without needing the MCP server to restart first.

## Troubleshooting

### Verify the binary

```bash
detritus --version
```

On Windows:
```powershell
& "$env:LOCALAPPDATA\detritus\detritus.exe" --version
```

This should print `detritus <version>`. If it outputs JSON-RPC or hangs, you have an old binary without `--version` support — re-run Step 1.

### MCP server not loading after restart

1. **Check the config path**: Must be `~/.codeium/windsurf/mcp_config.json` (on Windows: `%USERPROFILE%\.codeium\windsurf\mcp_config.json`)
2. **Check the binary path in config**: Must use **forward slashes** even on Windows (e.g., `C:/Users/Name/AppData/Local/detritus/detritus.exe`)
3. **Full restart required**: File > Exit (or Alt+F4), not just closing the window. On Windows, check Task Manager to ensure all Windsurf processes are stopped
4. **Check MCP panel**: Settings (gear icon) > Cascade > MCP Servers — detritus should appear there
5. **Verify config is valid JSON**: Open `mcp_config.json` in a text editor and check for syntax errors (trailing commas, missing quotes)

### Windows-specific issues

- **Path must use forward slashes** in `mcp_config.json`: `C:/Users/...` not `C:\Users\...`
- **Do not run the binary manually** — it communicates via stdio and will appear to hang. Use `--version` to test
- **Antivirus may block**: Some antivirus software blocks unsigned executables. Add an exception for `%LOCALAPPDATA%\detritus\detritus.exe`
