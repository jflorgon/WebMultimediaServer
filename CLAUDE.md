# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## System Overview

Distributed multimedia management system composed of four elements:

- **MediaServerApi** — ASP.NET Core REST API (main backend)
- **MediaServerScanner** — Background scanning service (same .NET solution and Docker container as the API)
- **MediaServerFront** — React SPA frontend
- **SQL Server 2022** — Relational database

**Critical:** `MediaServerApi` and `MediaServerScanner` are part of the **same .NET solution** and **same Docker container**. They share projects: `Domain`, `Infrastructure`, `Contracts`, `Core`. The scanner runs as an `IHostedService` (BackgroundService) inside the API process, firing every X minutes per configuration.

### Data Flow

```
Disk/Network → MediaServerScanner (scan + TMDB enrichment) → SQL Server → MediaServerApi (REST) → MediaServerFront (UI)
```

---

## Commands

### Backend

```bash
dotnet restore
dotnet build
dotnet test
dotnet run --project API/
```

### Database Migrations ⚠️ Require approval before running

```bash
dotnet ef migrations add <MigrationName>
dotnet ef database update
```

### Frontend

```bash
npm install
npm run dev
npm run build
```

### Docker

```bash
docker-compose up --build
docker-compose down
```

---

## Architecture

### Backend Solution Structure

```
API/             ← ASP.NET Core entry point
Scanner/         ← BackgroundService (periodic scan)
  Services/      ← Scan logic + TMDB client
  Workers/       ← ScannerWorker
Application/     ← CQRS handlers [shared]
Domain/          ← Domain entities [shared]
Infrastructure/  ← EF Core repositories [shared]
Contracts/       ← DTOs [shared]
Core/            ← Shared helpers and types [shared]
scripts/         ← DB initialization scripts
```

Scanner interval configured in `appsettings.json`:
```json
{
  "Scanner": {
    "IntervalMinutes": 30,
    "MediaPaths": ["\\\\nas\\movies", "\\\\nas\\series"]
  }
}
```

### Frontend Structure

```
src/
  components/
  hooks/
  pages/
  layouts/
  routes/
  services/    ← API clients
  store/       ← Zustand / Redux Toolkit
  i18n/
  types/
  utils/
  config/
```

### Technology Stack

**Backend:** .NET 8/9, C# 12, ASP.NET Core, MediatR (CQRS), Entity Framework Core, FluentValidation, AutoMapper, Newtonsoft.Json (TMDB), Swagger/OpenAPI

**Frontend:** React + TypeScript, Vite, React Router, Zustand/Redux Toolkit, TailwindCSS, Material UI/Ant Design, react-i18next, React Hook Form + Yup, Axios/Fetch, ESLint + Prettier

**Infrastructure:** Docker + Docker Compose, Nginx (frontend), SQL Server 2022

### Docker Ports

| Container | Port |
|---|---|
| SQL Server | 1433 |
| MediaServerApi + MediaServerScanner | 5001 |
| Frontend (Nginx) | — |

---

## API Endpoints

```
GET /api/movies
GET /api/series
GET /api/documentaries
```

---

## Design Patterns

**Backend:** CQRS + MediatR, Repository + EF Core, FluentValidation, AutoMapper, Middleware (error handling + logging)

**Scanner:** Registered as `BackgroundService` in the API's DI container. Reuses the same `Infrastructure` repositories as the API. Scan and TMDB services are injected and decoupled.

**Frontend:** Component-based, custom hooks for reusable logic, API services decoupled from UI.

---

## Code Conventions

### Backend (C#)

- Classes and methods: **PascalCase**
- Variables: **camelCase**
- Interfaces: **`I` prefix** (e.g., `IRepository`)
- Async methods: **`Async` suffix**
- Nullable reference types: enabled

### Frontend (TypeScript/React)

- Components: **PascalCase**
- Hooks: **`use` prefix**
- Strict separation between UI, logic, and services layers

### Commits

Format: `Area: description` — e.g., `API: add series endpoint`, `Scanner: fix TMDB retry logic`

---

## Approval Required

The following require explicit user confirmation before proceeding:

- Database migrations (`dotnet ef migrations add` / `dotnet ef database update`)
- Changes to Docker or CI/CD infrastructure
- Secrets or credentials management

---

## Persistent Memory — Engram

This project uses **[Engram](https://github.com/Gentleman-Programming/engram)** for persistent AI agent memory across sessions (SQLite + FTS5, exposed via MCP stdio).

### MCP Configuration

Add to `.claude/settings.json` (project) or `~/.claude/settings.json` (global):

```json
{
  "mcpServers": {
    "engram": {
      "command": "engram",
      "args": ["mcp"]
    }
  }
}
```

### Session Protocol

**On session start:**
1. Call `mem_context` — recover prior session state
2. Call `mem_search` with terms relevant to current task

**During work — call `mem_save` when:**
- A non-obvious bug is fixed
- An architectural decision is made
- A project pattern or convention is discovered
- Important configuration changes

**On session end — `mem_session_summary` is MANDATORY:**
```
title: Session summary
content:
  Goal: what was intended
  Discoveries: what was found
  Accomplished: what was completed
  Files: main files modified
```

**After context compaction:** Call `mem_context` immediately before continuing.

### Efficient Memory Retrieval (progressive, token-efficient)

```
1. mem_search "auth middleware"      → compact results with IDs
2. mem_timeline observation_id=42   → chronological context
3. mem_get_observation id=42        → full content
```

### Available MCP Tools

| Tool | When to use |
|---|---|
| `mem_save` | After bugfix, arch decision, pattern discovery, config change |
| `mem_search` | Starting work that may overlap prior sessions |
| `mem_context` | Session start or after context compaction |
| `mem_session_summary` | **Mandatory** on session close |
| `mem_timeline` | Chronological context around an observation |
| `mem_get_observation` | Full content of a specific memory |
| `mem_session_start` / `mem_session_end` | Register session boundaries |
| `mem_stats` | Memory system health |

### Sensitive Data

Wrap sensitive values in `<private>...</private>` tags — stripped before writing to the database:
```
Configured with <private>my-secret-api-key</private>
→ Configured with [REDACTED]
```

### Engram CLI

```bash
engram serve          # Start HTTP server (port 7437)
engram mcp            # Start MCP server (stdio transport)
engram tui            # Interactive terminal UI
engram search <query> # Search memories from CLI
engram stats          # Memory system statistics
engram sync           # Export memories as compressed chunk
engram sync --import  # Import chunks from team members
```
