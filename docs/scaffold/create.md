---
description: Create a new project - full-stack web app or backend service
category: scaffold
triggers:
  - create app
  - new app
  - build app
  - make app
  - web app
  - new project
  - create project
  - new service
  - create service
  - scaffold
  - build me
  - make me
  - full-stack
  - frontend
  - backend
  - react app
  - desktop app
when: User wants to create a new application or service from scratch
related:
  - ooo-package
  - ooo-auth
  - ooo-client-js
---

# Create a New Project

> ## ⚠️ INTERACTIVE WORKFLOW
>
> When this workflow triggers, you MUST ask the user questions before generating any code.
> Do NOT skip questions. Do NOT assume answers. Present multiple-choice options.
> Infer a sensible project name from what the user described, but confirm it.

---

## Step 1: Ask the User

Present these questions in order. Use multiple-choice prompts where indicated.

### Q1: Project Name

"What should the project be called?"

Free text. Used as directory name and Go module name. Suggest a name based on what the user described.

### Q2: User Interface

"Do you want a user interface (frontend)?"

- **Yes** — Full-stack: Go backend + React frontend
- **No** — Backend only: Go API service

### Q3: Authentication (only if Q2 = Yes)

"Do you want user authentication (login/registration)?"

- **Yes** — JWT auth with login, registration, token refresh
- **No** — Open access, simple landing page

### Q4: Desktop Support (only if Q2 = Yes)

"Do you want desktop application support (native window)?"

- **Yes** — Can run as desktop app via webview (requires system libraries)
- **No** — Web-only application

---

## Step 2: Generate Project

### Storage Decision (AI-facing — never ask the user)

Always use ko with layered storage (memory + embedded). This is the default for all new projects — zero external dependencies, works everywhere.

If the user later describes needs for millions of historical records or long-term data retention, suggest adding nopog alongside ooo at that point. See the `ooo-nopog` doc. This is never a scaffolding question.

---

### Path A: Backend Only (No UI)

Create this directory structure:

```
<name>/
├── main.go
├── dockerfile
└── router/
    ├── router.go
    └── startup.go
```

#### router/router.go

```go
package router

import "github.com/benitogf/ooo"

type Opt struct {
	// Service-specific configuration
}

func Routes(server *ooo.Server, opt Opt) {
	// Define filters and custom endpoints here
	// server.OpenFilter("items/*")
	// server.ReadObjectFilter("config", ooo.NoopObjectFilter)
	// server.WriteFilter("items/*", myValidator)
	// server.AfterWriteFilter("items/*", ooo.NoopNotify)
}
```

#### router/startup.go

```go
package router

import "github.com/benitogf/ooo"

func OnStartup(server *ooo.Server, opt Opt) {
	// Background tasks and startup logic
}
```

#### main.go

```go
package main

import (
	"flag"
	"strconv"

	"<module>/router"
	"github.com/benitogf/ko"
	"github.com/benitogf/network"
	"github.com/benitogf/ooo"
	"github.com/benitogf/ooo/storage"
	"github.com/gorilla/mux"
)

var dataPath = flag.String("dataPath", "db/data", "data storage path")
var port = flag.Int("port", 8888, "service port")
var silence = flag.Bool("silence", true, "silence output")

func main() {
	flag.Parse()

	server := &ooo.Server{
		Silence: *silence,
		Storage: storage.New(storage.LayeredConfig{
			Memory:   storage.NewMemoryLayer(),
			Embedded: ko.NewEmbeddedStorage(*dataPath),
		}),
		Router: mux.NewRouter(),
		Client: network.NewHttpClient(),
	}

	opt := router.Opt{}
	router.Routes(server, opt)
	server.Start("0.0.0.0:" + strconv.Itoa(*port))
	router.OnStartup(server, opt)
	server.WaitClose()
}
```

Replace `<module>` with the Go module name (typically the project name).

#### dockerfile

```dockerfile
# build stage
FROM golang:alpine AS build-env
RUN apk --no-cache add build-base git gcc
ADD go.mod /src/go.mod
ADD go.sum /src/go.sum
ADD <name> /src/<name>
RUN cd /src/<name> && go build

# final stage
FROM alpine
RUN apk --no-cache add tzdata
WORKDIR /app
COPY --from=build-env /src/<name>/<name> /app/
ENV SILENCE true
ENTRYPOINT ./<name> -silence=$SILENCE
EXPOSE 8888
```

Replace `<name>` with the project name. Add additional `ADD` lines for any packages the service imports from the monorepo. Add `ENV` and flag mappings to `ENTRYPOINT` for each flag.

#### Initialize

```bash
go mod init <name>
go mod tidy
```

#### Verify

```bash
go run . -port=8888
```

**Skip to Step 3.**

---

### Path B: Full-Stack (With UI)

#### Fetch Boilerplate

Download the [mono](https://github.com/benitogf/mono) boilerplate:

```bash
wget -q https://github.com/benitogf/mono/archive/refs/heads/master.zip -O mono.zip
unzip -q mono.zip
```

Copy these files and directories from `mono-master/` into the project directory:

- `main.go`
- `router/` (entire directory)
- `package.json`
- `vite.config.js`
- `index.html`
- `src/` (entire directory)
- `public/` (entire directory, if present)
- `reload` (dev helper script)

Create `.gitignore` with standard Node + Go ignores. Replace `mono` / `mono.exe` references with the project name.

Do **NOT** copy: `embeder/`, `spa/`, `webview/`, `go.mod`, `go.sum`, `README.md`, `LICENSE`, `use.sh`, `windows-build`

Clean up the zip and extracted directory after copying.

#### Update Module & Imports

Initialize the Go module:

```bash
go mod init <name>
```

In `main.go`, update the local router import:

- Change `"github.com/benitogf/mono/router"` → `"<name>/router"`

Keep these as external dependencies (they are library packages in the mono module):

- `"github.com/benitogf/mono/spa"`
- `"github.com/benitogf/mono/webview"` (only if desktop = yes)

Run `go mod tidy` to resolve dependency versions.

#### Update Scripts

In the `reload` script, replace `./mono` with `./<name>`.

---

### Feature Modifications

Apply the sections below based on the user's answers. These are additive — apply all that match.

---

#### If Auth = No

##### Backend (main.go)

Remove:

- Import: `"github.com/benitogf/auth"`
- Flags: `key`, `authPath`
- Auth storage setup: `authStorage` variable, `authStorage.Start()`, `storage.WatchStorageNoop(authStorage)`, the `auth.New(...)` call
- `autho.Routes(server)` call

The main server storage (for app data) stays unchanged.

##### Frontend — Delete Files

- `src/auth/` directory (Login.js, Logout.js, Setup.js)
- `src/AutoLogout.js`

##### Frontend — Simplify App.js

Remove auth-related functionality:

- Remove imports: `useAuthorize`, `Login`, `Logout`, `Setup`, `AutoLogout`, `autoLogoutTime`
- Remove state: `authorize`, `status` checks, auto-logout timer, `isAuthenticated` logic
- Remove auth-related effects (`authorize()` calls, `window.onstorage` auth handling)
- Keep: theme, settings drawer, Navbar, WebSocket connection (`useSubscribe`)

Replace auth-gated routing with open routing:

- Root `/` renders a simple landing page with welcome message and navigation to dashboard
- `/dashboard/*` renders Dashboard directly (no auth check)
- Remove `/login`, `/logout`, `/setup` routes

##### Frontend — Simplify Dashboard.js

Remove the `isAuthenticated` prop check and the `<Navigate to='/login' />` redirect. The dashboard renders unconditionally.

##### Frontend — Simplify api.js

- Remove the `authorize` and `useAuthorize` functions
- In `fetch`, `put`, `publish`, `unpublish` — remove Bearer token headers and token refresh logic. Keep them as simple HTTP wrappers using the `api` (ky) instance.
- In `useSubscribe` — don't pass token to the ooo client constructor
- Keep: `prefixUrl`, `api` instance, `useSubscribe` hook, `usePublish`

##### Frontend — Simplify Navbar.js

Remove login/logout navigation items. Keep other navigation (settings, theme toggle).

---

#### If Auth = Yes

Use the mono boilerplate files as-is. No modifications needed — auth is included by default.

---

#### If Desktop = No

##### Backend (main.go)

Remove:

- Import: `"github.com/benitogf/mono/webview"`
- Variable: `var view webview.Window`
- Flags: `ui`, `windowWidth`, `windowHeight`, `debugWebview`
- The `if *ui { ... }` block that creates and runs the webview window
- Webview cleanup in `OnClose`: `if *ui && view != nil { defer view.Terminate() }`

Keep: SPA server (`spa.Start`), SPA flags (`spaPort`, `spaHost`, `spaProtocol`), embed FS, the `cleanup()` function.

---

#### If Desktop = Yes

Use the mono boilerplate `main.go` as-is for webview support. No modifications needed.

Note: Desktop support requires system libraries on Linux:

```bash
sudo apt install pkg-config libgtk-3-dev libwebkit2gtk-4.1-dev
```

---

## Step 3: Implement App Logic

After the scaffold is generated, implement the user's actual requirements:

### Backend

Use ooo filters to define your data model and access patterns. See the `ooo-package` doc for full reference.

Common patterns:

```go
func Routes(server *ooo.Server, opt Opt) {
    // Open CRUD access to a path
    server.OpenFilter("items/*")

    // Read-only access
    server.ReadObjectFilter("status", ooo.NoopObjectFilter)
    server.ReadListFilter("logs/*", ooo.NoopListFilter)

    // Validate before write
    server.WriteFilter("items/*", func(index string, data json.RawMessage) (json.RawMessage, error) {
        var item Item
        if err := json.Unmarshal(data, &item); err != nil {
            return nil, err
        }
        if item.Name == "" {
            return nil, errors.New("name required")
        }
        return data, nil
    })

    // React to writes
    server.AfterWriteFilter("items/*", func(index string) {
        log.Println("item written:", index)
    })

    // Auto-cleanup old entries
    server.LimitFilter("logs/*", ooo.LimitFilterConfig{Limit: 100})
}
```

Use type-safe helpers for server-side data access:

```go
item, err := ooo.Get[MyType](server, "items/123")
items, err := ooo.GetList[MyType](server, "items/*")
err := ooo.Set(server, "items/123", myData)
index, err := ooo.Push(server, "items/*", newItem)
err := ooo.Delete(server, "items/123")
```

### Frontend (if UI)

The frontend uses `ooo-client` for real-time WebSocket subscriptions and `ky` for HTTP requests. See the `ooo-client-js` doc for full reference.

The `useSubscribe` hook in `src/api.js` provides real-time data:

```javascript
const [items, socket] = useSubscribe('items/*')
```

Use `publish` / `unpublish` for mutations:

```javascript
await publish('items/*', { name: 'New Item' })
await unpublish('items/123')
```

Add new pages in `src/dashboard/Router.js` and menu items in `src/dashboard/Menu.js`.

---

## Step 4: Development

### Backend only

```bash
go run . -port=8888
```

### Full-stack

```bash
# Terminal 1: Frontend dev server (hot reload on port 3000)
npm start

# Terminal 2: Backend dev server
go run main.go -ui=false -port=8888
```

### Build & Run

```bash
# Frontend build (outputs to build/)
npm run build

# Run as web server (API + embedded SPA)
go run main.go -ui=false

# Build single binary
go build
./<name>
```

---

## Checklist

- [ ] Project name set in all files (module, imports, scripts, dockerfile)
- [ ] Filters defined for all data paths in `router/router.go`
- [ ] Frontend pages added in `src/dashboard/Router.js`
- [ ] Menu items added in `src/dashboard/Menu.js`
- [ ] Test locally: backend serves data, frontend displays it
- [ ] `npm run build` succeeds
- [ ] `go build` produces working binary

---

## Related Docs

- `ooo-package` — Server setup, filters, CRUD, WebSocket subscriptions
- `ooo-auth` — JWT authentication details (if auth enabled)
- `ooo-client-js` — JavaScript WebSocket client, React hooks
- `ooo-nopog` — Long-term historical data storage (add later if needed)
