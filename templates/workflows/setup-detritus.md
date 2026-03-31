---
description: Install or update detritus MCP knowledge base server
---

# Setup Detritus MCP Server

Detect the user's OS and **shell** before proceeding. On Windows, check if the terminal is PowerShell or a bash-like shell (Git Bash, WSL, MSYS2). Run ONLY the commands matching their platform and shell.

## Step 1: Install the binary

The install script handles **both Windsurf and VS Code** automatically — it writes the MCP config and prompt files for both IDEs.

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

### Windsurf

The install script automatically configures `~/.codeium/windsurf/mcp_config.json` (`~` = `%USERPROFILE%` on Windows).

Read the config file and verify the `"detritus"` entry exists with the correct binary path:
- **Linux/macOS**: `/usr/local/bin/detritus`
- **Windows**: `C:/Users/USERNAME/AppData/Local/detritus/detritus.exe` (forward slashes)

### VS Code

The install script automatically configures the VS Code user-level MCP config. Read the file and verify the `"detritus"` entry exists:
- **Linux (standard)**: `~/.config/Code/User/mcp.json`
- **Linux (VS Code Server)**: `~/.vscode-server/data/User/mcp.json`
- **macOS**: `~/Library/Application Support/Code/User/mcp.json`
- **Windows**: `%APPDATA%\Code\User\mcp.json`

The VS Code config format uses `"servers"` (not `"mcpServers"`):
```json
{
  "servers": {
    "detritus": {
      "command": "/usr/local/bin/detritus",
      "args": []
    }
  }
}
```

Also verify prompt files were written to the `prompts/` subdirectory of the same user dir (e.g., `~/.config/Code/User/prompts/plan.prompt.md`). These are VS Code's slash commands — available in all workspaces without any per-repo setup.

## Step 3: Select target project

Check the workspace roots (available from IDE metadata). **Install project files only to the root the user selects.**

- **Single root**: use it directly, no prompt needed.
- **Multiple roots**: list all workspace roots and ask the user which one should receive the MCP workflow files. Install to that root only.

Let `TARGET` be the selected root for the steps below.

## Step 4: Install project files to TARGET

### 4a. Download `.windsurfrules` and `copilot-instructions.md`

#### Windsurf — `.windsurfrules`

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

#### VS Code — `.github/copilot-instructions.md`

If `TARGET/.github/copilot-instructions.md` does not exist, download it:

#### Linux / macOS / Windows (Git Bash, WSL, MSYS2)

// turbo
```bash
mkdir -p .github && [ ! -f .github/copilot-instructions.md ] && curl -sSL https://raw.githubusercontent.com/benitogf/detritus/main/templates/copilot-instructions.md -o .github/copilot-instructions.md
```

#### Windows (PowerShell only)

// turbo
```powershell
if (-not (Test-Path .github)) { New-Item -ItemType Directory .github | Out-Null }
if (-not (Test-Path .github\copilot-instructions.md)) { irm https://raw.githubusercontent.com/benitogf/detritus/main/templates/copilot-instructions.md | Set-Content .github\copilot-instructions.md -Encoding UTF8 }
```

### 4b. Create the setup bootstrappers

#### Windsurf — `TARGET/.windsurf/workflows/detritus/setup-detritus.md`

Create if it doesn't exist:

```markdown
---
description: Install or update detritus MCP knowledge base server
---

Fetch the latest setup instructions from:
https://raw.githubusercontent.com/benitogf/detritus/main/templates/workflows/setup-detritus.md

Read that URL and execute all the steps in the fetched document.
```

#### VS Code — note

VS Code slash commands (`/plan`, `/testing`, etc.) are user-level prompt files written by the install script to `~/.config/Code/User/prompts/` (or the equivalent on your OS). They are **not** stored per-repo — they are available in all workspaces automatically. No bootstrapper file is needed in the project.

### 4c. Create workflow aliases from the installed binary

Run `detritus --list` to get all available document names and descriptions directly from the **on-disk binary**. This bypasses the running MCP server process, which may still be serving stale data from a previous version.

- **Linux/macOS**: `detritus --list`
- **Windows (PowerShell)**: `& "$env:LOCALAPPDATA\detritus\detritus.exe" --list`

The output is tab-separated: `name<TAB>description`, one document per line. Subdirectory docs use `/` in the name (e.g., `scaffold/create`).

#### Windsurf aliases

For each document, create or update a workflow alias file in the **target project**. Aliases are organized into **subfolders matching the doc group** (first path segment), mirroring the `docs/` layout in the detritus repo.

- **Create** the file if it doesn't exist
- **Update** if the file exists but the description or the `kb_get(name="...")` call inside differs from the expected values

The alias file path is: `TARGET/.windsurf/workflows/detritus/{group}/{alias}.md`

Where `{group}` is the first path segment of the doc name, and `{alias}` is the filename (Windsurf uses only the filename as the slash command, ignoring parent directories).

Alias filename rules:

| Doc name | Alias path (under `detritus/`) | Slash command |
|----------|-------------------------------|---------------|
| `plan/analyze` | `plan/plan.md` | `/plan` |
| `plan/export` | `plan/plan-export.md` | `/plan-export` |
| `plan/diagrams` | `plan/diagrams.md` | `/diagrams` |
| `testing/index` | `testing/testing.md` | `/testing` |
| `testing/go-backend-*` | `testing/testing-go-backend-{name}.md` | `/testing-go-backend-{name}` |
| `scaffold/create` | `scaffold/create.md` | `/create` |
| `meta/truthseeker` | `meta/truthseeker.md` | `/truthseeker` |
| `meta/grow` | `meta/grow.md` | `/grow` |
| `meta/optimize` | `meta/optimize.md` | `/optimize` |
| `meta/research-first` | `meta/research-first.md` | `/research-first` |
| `ooo/*` | `ooo/ooo-{name}.md` | `/ooo-{name}` |
| `patterns/*` | `patterns/{name}.md` | `/{name}` |

General rules:
- **`ooo/*`**: prefix filename with `ooo-` (e.g., `ooo/package` → `ooo/ooo-package.md` → `/ooo-package`)
- **`testing/go-backend-*`**: prefix filename with `testing-` (e.g., `testing/go-backend-async` → `testing/testing-go-backend-async.md`)
- **`testing/index`**: use group name as filename (`testing/testing.md` → `/testing`)
- **`plan/analyze`**: use group name as filename (`plan/plan.md` → `/plan`)
- **All others**: use the last segment as filename
- The `kb_get` call inside must always use the **full original doc name**

Each Windsurf alias file format:

```markdown
---
description: {description from --list}
---

Call kb_get(name="{full_name}") and follow the instructions in the returned document.
```

#### VS Code user-level prompt files

VS Code prompt files (slash commands) are user-level and were already written by the install script. However, to ensure they are up-to-date after a binary update, re-run the install script's VS Code section. The alias filename rules are the same as Windsurf above, but:

- Files go to `~/.config/Code/User/prompts/` (Linux), `~/Library/Application Support/Code/User/prompts/` (macOS), or `%APPDATA%\Code\User\prompts\` (Windows) — **not** inside the project
- Extension is `.prompt.md` instead of `.md`
- Frontmatter includes `agent: agent` and `tools: ["detritus/*"]`

Each VS Code prompt file format:

```markdown
---
description: {description from --list}
agent: agent
tools: ["detritus/*"]
---

Call kb_get(name="{full_name}") and follow the instructions in the returned document.
```

To refresh VS Code prompt files without re-running the full install script, run the appropriate command for your OS/shell:

**Linux / macOS / Windows (Git Bash, WSL, MSYS2)**

// turbo
```bash
curl -sSL https://raw.githubusercontent.com/benitogf/detritus/main/install.sh | sh
```

**Windows (PowerShell)**

// turbo
```powershell
irm https://raw.githubusercontent.com/benitogf/detritus/main/install.ps1 | iex
```

**If `detritus --list` fails** (binary too old — pre-v1.5.0), fall back to `kb_list()` via MCP. If MCP is also unavailable (first-time install), tell the user to restart their IDE and re-run `/setup-detritus`.

### 4d. Clean up old installations

Clean up aliases from previous detritus versions. There are three categories:

#### 1. Flat aliases in `TARGET/.windsurf/workflows/` (outside `detritus/`)

Very old versions installed aliases directly in the workflows root. Delete any `.md` file there whose name matches a known detritus alias or old name: `_truthseeker.md`, `scaffold-simple-service.md`, `create-app.md`, `create-service.md`, `setup.md`, `setup-detritus.md`, `ooo-package.md`, `ooo-auth.md`, `ooo-client-js.md`, `ooo-nopog.md`, `ooo-pivot.md`, `async-events.md`, `go-modern.md`, `coding-style.md`, `state-management.md`, `truthseeker.md`, `plan.md`, `testing.md`, `create.md`, `grow.md`, `optimize.md`.

#### 2. Flat aliases in `TARGET/.windsurf/workflows/detritus/` (root of detritus/)

Previous versions (pre-v1.6.0) placed all aliases flat in the `detritus/` folder. Now aliases live in subfolders (`detritus/ooo/`, `detritus/meta/`, etc.). Delete any `.md` file **directly** in `detritus/` (not in subfolders) that is a detritus-generated alias — i.e., any file other than `setup-detritus.md`. Do **not** delete `setup-detritus.md` (the bootstrapper stays at the root).

To identify: any `.md` file directly in `detritus/` whose content contains `kb_get(name=` is a detritus alias and should be deleted. Also delete known stale names: `ooo-ko.md`, `scaffold-simple-service.md`, `setup.md`.

#### 3. Stale aliases in subfolders

After creating/updating aliases in Step 4c, check each subfolder under `detritus/` for `.md` files whose `kb_get` name no longer appears in `detritus --list` output. Delete those.

**Do not** delete any files or folders outside `detritus/` that are not in the known lists above — those are user-created.

## Step 5: Restart IDEs

### Windsurf
Tell the user to **fully close Windsurf** (File > Exit, not just close the window) and reopen it. After restart, the `kb_list`, `kb_get`, and `kb_search` tools will serve the updated documents.

### VS Code
Tell the user to **reload the VS Code window**: press `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS) and run `Developer: Reload Window`. A full restart is not required — VS Code picks up the user-level MCP config and prompt files on reload.

No re-run is needed — Windsurf aliases were created from the binary in Step 4c, and VS Code prompt files were written by the install script in Step 1.

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

#### Windsurf
1. **Check the config path**: Must be `~/.codeium/windsurf/mcp_config.json` (on Windows: `%USERPROFILE%\.codeium\windsurf\mcp_config.json`)
2. **Check the binary path in config**: Must use **forward slashes** even on Windows (e.g., `C:/Users/Name/AppData/Local/detritus/detritus.exe`)
3. **Full restart required**: File > Exit (or Alt+F4), not just closing the window. On Windows, check Task Manager to ensure all Windsurf processes are stopped
4. **Check MCP panel**: Settings (gear icon) > Cascade > MCP Servers — detritus should appear there
5. **Verify config is valid JSON**: Open `mcp_config.json` in a text editor and check for syntax errors (trailing commas, missing quotes)

#### VS Code
1. **Check the config path**: `~/.config/Code/User/mcp.json` (Linux), `~/Library/Application Support/Code/User/mcp.json` (macOS), `%APPDATA%\Code\User\mcp.json` (Windows)
2. **Config uses `"servers"` key** (not `"mcpServers"`): `{"servers": {"detritus": {"command": "...", "args": []}}}`
3. **Reload window**: `Ctrl+Shift+P` > `Developer: Reload Window`
4. **Trust prompt**: VS Code may ask you to trust the MCP server on first use — click Allow
5. **Check MCP tools**: In Copilot Chat, click the tools icon — `kb_list`, `kb_get`, `kb_search` should appear under detritus
6. **On Linux with VS Code Server**: The install script writes to both `~/.config/Code/User/` and `~/.vscode-server/data/User/` — check whichever one your VS Code instance uses

### Windows-specific issues

- **Path must use forward slashes** in `mcp_config.json` (Windsurf): `C:/Users/...` not `C:\Users\...`
- **Do not run the binary manually** — it communicates via stdio and will appear to hang. Use `--version` to test
- **Antivirus may block**: Some antivirus software blocks unsigned executables. Add an exception for `%LOCALAPPDATA%\detritus\detritus.exe`
- **VS Code on Windows**: The config is at `%APPDATA%\Code\User\mcp.json` (Roaming AppData, not Local)
