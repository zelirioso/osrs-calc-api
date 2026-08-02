# OSRS Stats Calculator — Project Requirements

## Background

Currently using Excel spreadsheets to run calculations for various OSRS stats. Goal is to convert this into a proper application, starting minimal and growing over time.

The original spreadsheets are kept at the repo root (`*.xlsx`) as the source of truth for each calculator's logic. Each one is transcribed into `docs/calculators/<name>.md` before being ported.

## Primary Learning Aims

This project exists mainly as a vehicle for two learning goals — feature/scope decisions should be weighed against whether they serve these:

1. **Learning Playwright basics** — how it's set up, how it tests APIs vs. browsers, how a suite is structured
2. **Learning to better utilise Claude Code** — already used at work, but wants a fresh/low-stakes project to practice setting up things like skills, rules (e.g. CLAUDE.md), and other repo conventions that make a codebase easier for Claude Code to work in

### Secondary Learning Aims

Lower priority than the two above, but real benefits of the tech choices made:

- **FastAPI** — low-cost pickup since it maps closely to REST concepts already known (and to Spring Boot, which is already familiar)
- **React + TypeScript** — chosen over plain HTML/JS specifically because it's a skill more likely to transfer to future work

## Core Requirements

1. **API**
   - Accepts input numbers/parameters and returns calculated results
   - Lightweight frontend runnable locally from the command line
   - Note: React + Vite is not the *lowest-friction* frontend option. It was chosen deliberately over plain HTML/JS because the skill transfers — accepting a build step as the cost.

2. **Modularity**
   - Must be easy to add new calculators over time
   - Adding a new calculator = one new file plus one line in the registry; no changes to existing calculators
   - See **Calculator Module Contract** below for the shape every calculator must follow

3. **Test suite**
   - **pytest** covers calculator maths — fast, direct, no HTTP hop
   - **Playwright (TypeScript)** covers the API contract and browser E2E
   - Primary goal is learning how Playwright works and how a suite is set up, not raw coverage. Splitting this way keeps Playwright pointed at what it's actually good at.

4. **CI Pipeline**
   - GitHub Actions workflow running ruff, pytest and the Playwright suite

## Constraints / Preferences

- Wants Claude to explain reasoning/steps along the way, not just produce finished code
- Will use Claude Code (Pro plan) for this project

## Decisions Made

| Component | Choice | Reasoning |
|---|---|---|
| API framework | Python + FastAPI | Easy modular routing per calculator, free interactive docs, gentle learning curve; maps closely to REST and Spring Boot concepts already known |
| Python tooling | uv + `pyproject.toml` | Lockfile means CI installs match local exactly; near-instant installs on every Actions run. Standard `pyproject.toml`, so switching to pip/poetry later costs nothing |
| Linting | ruff | Lint + format in one fast tool, runs in CI. Keeps generated Python consistent without manual style review |
| Frontend | React + TypeScript (Vite) | More setup than plain HTML/JS, but transfers elsewhere. TS over JS because Playwright is already TS — same setup effort, double the return |
| Test framework | pytest + Playwright (TypeScript) | pytest for calculator maths, Playwright for API contract and browser E2E |
| CI | GitHub Actions | Free for public repos |
| Repo visibility | Public | Unlimited Actions minutes; nothing sensitive; usable as a portfolio piece |
| Route shape | `/api/calculators/<name>` | The `/api` prefix is what the Vite proxy keys off. No version segment — single consumer, add `/v2` only if a contract ever breaks |
| Dev wiring | Vite dev proxy | Frontend calls relative `/api/...` paths, so no CORS and no host/port in app code. Vite forwards to uvicorn server-side |
| Process startup | Playwright `webServer` config | Playwright starts both servers, waits for ready, tears them down. Identical locally and in CI, no extra scripts |
| E2E target | Real backend | Calculators are deterministic pure functions with no external calls — nothing flaky to mock. Learn `page.route` when the stretch integrations land |
| Validation errors | Pydantic constraints, default 422 | Rules expressed as field constraints; FastAPI rejects bad input automatically. Near-zero code, and a stable contract for Playwright to assert against |
| Calculator input | Current XP + target **level** | Current XP is a raw number (what Hiscores returns and what's known precisely); target is a level (how goals are actually thought about). The XP table converts level → XP |
| Prices | Optional request params with defaults | Overridable, sensible defaults if omitted. Testable with fixed values, and the Wiki integration later supplies the same field with no contract change |
| XP-per-level table | Hardcoded in `app/core/xp_table.py` | 99 static numbers unchanged since 2001. Zero network calls, zero failure modes, instantly testable. Needed by all three calculators |
| Port order | Herblore → Fletching → Giants' Foundry | Simplest first, since calculator #1 establishes the pattern the others copy. Confirmed by reading the sheets: Herblore is a sum over a lookup table; Giants' Foundry is by far the most complex |
| Hiscores / Wiki integrations | Stretch goals | Neither serves the two primary learning aims. Deferred until steps 1–9 are done |
| GE price integration | No | Not needed |
| Cross-calculator aggregation | Deferred to Future Ideas | Was stated but never designed, and it silently constrains every calculator's response schema. Not worth half-designing into calculator #1 |

## Calculator Module Contract

Every calculator lives in `app/calculators/<name>.py` and exposes exactly:

| Symbol | Type | Purpose |
|---|---|---|
| `NAME` | `str` | URL slug, e.g. `"herblore"` |
| `Request` | `BaseModel` | Input schema, with validation as field constraints |
| `Response` | `BaseModel` | Output schema |
| `calculate` | `(Request) -> Response` | The maths. Pure — no network, no file access, no clock |
| `router` | `APIRouter` | Thin wrapper that calls `calculate` |

Rules:

- `calculate` must be pure. This is what makes it unit-testable in pytest without a server, and what keeps E2E tests deterministic.
- Shared game data (XP table, default prices) lives in `app/core/`, never duplicated per calculator.
- Registration is one line added to `app/calculators/__init__.py`. Explicit over auto-discovery — the wiring stays greppable and traceable.
- Prices and other economic values are optional `Request` fields with defaults, never hardcoded inside `calculate`.

## Data Source Research (OSRS-specific)

- **Official Hiscores API (Jagex)**: live lookup by player name (levels, XP, boss KC, clue counts). No CORS headers, so must be called server-side. No formal published rate limit — community convention is to stay conservative (a few requests per minute).
  - Concrete use: replaces the manually-entered current XP value in every calculator.
  - Fetch design: accepts an RSN (username) input, not a fixed character. Lookup fires on submitting a username, not on page load, and not by polling — hiscores only update on player logout, so one fetch per entered username is sufficient. Remember the last-used username client-side between sessions; it's just a username, not sensitive data.
  - Edge cases to handle: returns `-1` for unranked skills, and 404s for names not on the hiscores at all.
- **OSRS Wiki API**: has shop prices (distinct from GE prices), plus Grand Exchange prices (not used, per decision above).
  - Concrete use: supplies the default prices that calculators currently hardcode.
  - Requires a descriptive User-Agent identifying the app and a contact method. Requests without one get blocked, and it fails in a confusing way.
  - Note: the XP-boundary data is *not* worth fetching — see the hardcoding decision above.
- **RuneLite plugin API**: exposes *live* in-game state while playing, distinct from hiscores snapshots. Possible future enhancement, not a starting requirement.
  - Specifically for **banked items**: no standalone external API exists — bank contents only exist inside the client while logged in with the bank open. Would require writing or adapting a RuneLite plugin that pushes bank data out locally.
  - Checked: the WikiSync plugin and the Wiki DPS calculator's "Load From Client" import are both real, but neither exposes bank contents — equipment/skills/quests only. The general pattern is viable though: a third-party companion plugin exists that writes bank, inventory and equipment data to local JSON files for another local process to read.
  - This is the thing that would eliminate Herblore's 13 manual herb-quantity fields, which is the strongest concrete argument for it.

## Calculators to Port

| Calculator | Source spreadsheet | Spec | Complexity |
|---|---|---|---|
| Herblore | `Herblore Calculator.xlsx` | `docs/calculators/herblore.md` | Sum over a lookup table, one subtraction |
| Fletching | `Fletching Calculator.xlsx` | *not yet written* | Ceilings, unit conversions, costs |
| Giants' Foundry | `Giants Foundry Bar Calculator.xlsx` | *not yet written* | Bar-equivalent inventory across 3 metals, 3 mould scenarios |

Many OSRS calculators already exist in the community — these three are the custom ones actually needed beyond what's available. More may be added later.

## Future Ideas (not scoped, not committed)

- **Cross-calculator aggregation** — compiling/combining stats across calculators. Needs a concrete definition of what's being aggregated before it's worth designing, since it would constrain every calculator's response schema.
- **RuneLite bank integration** — would remove Herblore's manual herb entry entirely.
- **Time to max calculator** — noted as tricky, not yet scoped
- **Golem crafting calculator** — a good community version is likely to be released soon, which may make this redundant
- **Mastering Mixology calculator** — someone else already has a version, same duplication question as golem crafting

## Project Structure

```
osrs-calc-api/
├── app/
│   ├── main.py                    # FastAPI app, mounts calculator routers
│   ├── calculators/
│   │   ├── __init__.py            # registry — new calculator = one line here
│   │   ├── herblore.py
│   │   ├── fletching.py
│   │   └── giants_foundry.py
│   ├── core/
│   │   ├── xp_table.py            # XP per level, hardcoded, shared
│   │   └── prices.py              # default prices, shared
│   └── models.py                  # shared request/response base schemas
├── frontend/                      # React + TypeScript (Vite)
│   ├── src/
│   │   ├── App.tsx
│   │   └── components/            # one component set per calculator
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts             # /api proxy → uvicorn
├── tests/
│   ├── unit/                      # pytest — calculator maths
│   ├── api/                       # Playwright API tests (request fixture)
│   └── e2e/                       # Playwright browser tests
├── docs/calculators/              # transcribed spreadsheet specs
│   └── herblore.md
├── .github/workflows/test.yml
├── playwright.config.ts           # incl. webServer for both processes
├── package.json                   # Playwright deps (separate from frontend/)
├── pyproject.toml
├── uv.lock
├── CLAUDE.md                      # repo conventions for Claude Code
├── FRICTION.md                    # log of where Claude Code stumbled + the fix
└── PROJECT.md                     # this file
```

Note the two `package.json` files: one at root for Playwright (its tests span both API and frontend), one in `frontend/` for the app itself.

## Execution Order

Ordered to front-load the two learning aims rather than leaving them until the end.

1. ~~**Set up an isolated dev environment**~~ — ✅ done. Devcontainer (Python 3.12 + Node + claude-code feature) scoped to this project folder, running inside WSL, so Claude Code has no reach into home files or other projects.
2. ~~**Initialise git and create the public GitHub repo**~~ — ✅ done. Repo pushed to `https://github.com/zelirioso/osrs-calc-api`, `gh` authenticated over HTTPS.
3. ~~**Scaffold the repo with Claude Code**~~ — ✅ done. uv/`pyproject.toml`, FastAPI skeleton, ruff, folder structure, minimal `CLAUDE.md`.
4. ~~**Build Herblore end-to-end**~~ — ✅ done. `app/calculators/herblore.py` + `app/core/xp_table.py`, pytest unit tests against the worked example. Along the way, corrected Marrentill/Toadflax XP values and added Torstol (14th herb) against the OSRS Wiki — see `docs/calculators/herblore.md` Open Questions.
5. ~~**Write the first Playwright API test**~~ — ✅ done. Root-level `package.json`/`tsconfig.json`/`playwright.config.ts` with a `webServer` that boots uvicorn automatically; `tests/api/herblore.spec.ts` covers the worked example plus 422 validation cases.
6. ~~**Add the minimal frontend**~~ — ✅ done. `frontend/` (Vite react-ts), `HerbloreCalculator` form wired to `/api/calculators/herblore` via the Vite dev proxy. `playwright.config.ts` now runs both servers and splits into `api`/`e2e` projects; `tests/e2e/herblore.spec.ts` drives a real browser through the form.
7. ~~**Wire up GitHub Actions**~~ — ✅ done. `.github/workflows/test.yml`, single job: ruff + pytest, then npm installs + root tsc + frontend oxlint/build, then a version-keyed cache for the Playwright browser download before the full suite (both servers boot via `webServer`, same as locally). Also gates on frontend oxlint/tsc/build, beyond the ruff/pytest/Playwright scope originally stated here — a real gap otherwise, since Vite's dev server never type-checks. First run passed clean, 59s.
8. **Port Fletching** — write `docs/calculators/fletching.md` first, then repeat the proven pattern.
9. **Port Giants' Foundry** — same, and last because it's the most complex.
10. **Revisit Claude Code repo conventions** — a deliberate pass over `FRICTION.md` and what accumulated organically in CLAUDE.md, deciding what's worth upgrading (a recurring instruction becomes a slash command, a repeated pattern becomes a custom skill).

Throughout steps 4–9: whenever Claude Code hits real friction (misreads the calculator pattern, forgets the test convention), add to CLAUDE.md **in the moment** and log it in `FRICTION.md`. This reactive, iterative updating is the main practice ground for the repo-conventions learning aim, and the log is what makes step 10 a review of evidence rather than guesswork.

### Stretch (only after step 9)

11. **Hiscores integration** — RSN input, fetch-on-submit, remember last-used username locally; auto-fills the current XP field.
12. **Wiki shop prices** — supplies the default price values calculators currently hold as constants.

Both introduce real network calls, so both need a mocking decision at that point (`respx`/`httpx-mock` for the Python side, `page.route` for E2E). That's a genuinely useful bit of Playwright to learn, which is the main argument for eventually doing them.

## Open Questions

- Which Claude Code repo conventions to set up beyond CLAUDE.md (custom skills, slash commands) — deliberately left open; step 10 decides this from what `FRICTION.md` actually shows.
- Per-calculator spec questions are tracked in each `docs/calculators/*.md` file.
