# CLAUDE.md

Conventions for working in this repo. Full rationale and decisions live in `PROJECT.md` — this file is just the actionable subset.

## Tech stack

- **Backend**: Python 3.12, FastAPI, managed with `uv` (`pyproject.toml` / `uv.lock`)
- **Frontend**: React + TypeScript (Vite) — not yet scaffolded
- **Lint/format**: ruff
- **Tests**: pytest for calculator maths (unit, no HTTP); Playwright (TypeScript) for the API contract and browser E2E — not yet scaffolded

## Running things

- Install deps: `uv sync`
- Run the API: `uv run uvicorn app.main:app --reload`
- Lint: `uv run ruff check .`
- Format: `uv run ruff format .`
- Run pytest: `uv run pytest`

## Folder structure

```
app/
├── main.py             # FastAPI app; includes every router in the calculators registry
├── calculators/
│   ├── __init__.py     # registry — `routers: list[APIRouter]`
│   └── <name>.py        # one calculator per file (herblore.py, fletching.py, ...)
├── core/                # shared game data (XP table, default prices) — never duplicated per calculator
└── models.py            # StrictModel — base for Request models, forbids extra fields
```

## Calculator module contract

Every calculator lives in `app/calculators/<name>.py` and exposes exactly:

| Symbol | Type | Purpose |
|---|---|---|
| `NAME` | `str` | URL slug, e.g. `"herblore"` |
| `Request` | `app.models.StrictModel` | Input schema, with validation as field constraints |
| `Response` | `BaseModel` | Output schema |
| `calculate` | `(Request) -> Response` | The maths. Pure — no network, no file access, no clock |
| `router` | `APIRouter` | Thin wrapper that calls `calculate`, mounted at `/api/calculators/<name>` |

Rules:

- `calculate` must be pure — no I/O, no clock. This is what makes it unit-testable in pytest without a server, and what keeps E2E tests deterministic.
- `Request` (and any nested input models) inherit from `app.models.StrictModel`, not `BaseModel` directly, so a typo'd or unexpected field 422s instead of being silently dropped.
- Prices and other economic values are optional `Request` fields with sensible defaults, never hardcoded inside `calculate`.
- Shared game data (XP table, default prices) lives in `app/core/`, never duplicated per calculator.
- Registering a new calculator is one import + one append to the `routers` list in `app/calculators/__init__.py`. No other file changes. Explicit over auto-discovery — the wiring stays greppable.
