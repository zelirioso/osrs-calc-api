# OSRS Stats Calculator — Project Requirements

## Background
Currently using Excel spreadsheets to run calculations for various OSRS stats. Goal is to convert this into a proper application, starting minimal and growing over time.

## Core Requirements

1. **API**
   - Accepts input numbers/parameters and returns calculated results
   - Optional lightweight frontend that can be run locally via command line with minimal setup

2. **Modularity**
   - Must be easy to add new calculators over time
   - Adding a new calculator should not require modifying existing ones
   - Should support compiling/aggregating stats across calculators

3. **Test suite (Playwright)**
   - Used to test the API and/or frontend
   - Primary goal: learning how Playwright works and how it's set up (not just coverage)

4. **CI Pipeline**
   - GitHub Actions workflow to run the test suite automatically

## Primary Learning Aims

This project exists mainly as a vehicle for two learning goals — feature/scope decisions should be weighed against whether they serve these:

1. **Learning Playwright basics** — how it's set up, how it tests APIs vs. browsers, how a suite is structured
2. **Learning to better utilise Claude Code** — already used at work, but wants a fresh/low-stakes project to practice setting up things like skills, rules (e.g. CLAUDE.md), and other repo conventions that make a codebase easier for Claude Code to work in

### Secondary Learning Aims

Lower priority than the two above, but real benefits of the tech choices made:

- **FastAPI** — low-cost pickup since it maps closely to REST concepts already known
- **React** — chosen over plain HTML/JS specifically because it's a skill more likely to transfer to future work

## Constraints / Preferences

- Wants Claude to explain reasoning/steps along the way, not just produce finished code
- Will use Claude Code (Pro plan) for this project

## Decisions Made So Far

| Component | Choice | Reasoning |
|---|---|---|
| API | Python + FastAPI | Easy modular routing per calculator, free interactive docs, gentle learning curve; also a low-cost bonus learning thread since it maps closely to REST concepts already known |
| Frontend | React (Vite) | Revisited from initial plain-HTML/JS choice — more setup (npm/build step), but is a skill that transfers elsewhere, which was preferred over lowest-friction |
| Test framework | Playwright, TypeScript | Strongest docs/community in TS/JS; Playwright supports both API testing (`request` fixture) and browser/E2E testing in one tool |
| CI | GitHub Actions | Free for public repos; ample free minutes for private repos |
| Port order | Fletching → Giants Foundry Bar → Herblore | Order as originally listed; no reason to change it |
| Hiscores integration | Yes | Auto-fill current XP values instead of manual entry |
| GE price integration | No | Not needed |
| Wiki shop price integration | Yes | Useful input for calculators |
| Claude Code | Yes, will use it | Fits the learning aim of practicing Claude Code on a fresh project; requires Pro plan |

## Data Source Research (OSRS-specific)

- **Official Hiscores API (Jagex)**: live lookup by player name (levels, XP, boss KC, clue counts). No CORS headers, so must be called server-side, not from the browser directly. No formal published rate limit — community convention is to stay conservative (a few requests per minute) to avoid being throttled or blocked.
  - Concrete use: can replace manually-entered current XP values in calculators — auto-fill from a player lookup instead of typing them in.
  - Fetch design: not tied to a single fixed character — the app must accept an RSN (username) input. Lookup fires on submitting a username (not on page load, since there's no data until a username is provided), rather than continuously polling — hiscores only update on player logout anyway, so a single fetch per entered username is sufficient. Decided: remember the last-used username locally (client-side) between sessions for convenience — fine to do since it's just a username, not sensitive data.
- **OSRS Wiki API**: has shop prices (distinct from GE prices) and XP-boundary data for skill levels, plus Grand Exchange prices (not used per decision above).
  - Concrete use: also has shop prices (distinct from GE prices) and XP-boundary data for skill levels (i.e. XP required to reach a given level) — both useful inputs for calculators.
- **RuneLite plugin API**: exposes *live* in-game state while playing, distinct from hiscores snapshots — flagged as a possible future enhancement, not a starting requirement.
  - Specifically for **banked items**: no standalone external API for this — bank contents only exist inside the client while logged in with the bank open. Would require writing (or adapting) a RuneLite plugin that pushes bank data out locally (e.g. HTTP call/webhook) while playing. Bigger lift than hiscores or GE price lookups; noted as a possible future data source, not committed to.
    - Checked: the WikiSync plugin (quest/diary/skill sync) and the OSRS Wiki DPS calculator's "Load From Client" gear import are both real, but neither exposes bank contents — they cover equipment/skills/quests only. Confirmed the general pattern is viable though: a third-party companion plugin exists that writes bank, inventory, equipment, and other player data to local JSON files for another local process to read. Would need a similar custom (or adapted) plugin to get banked items specifically.
- **Decided**: Hiscores API (for XP auto-fill) and Wiki shop prices/XP-boundary data will both be integrated. Grand Exchange price data will not be used.

## Existing Spreadsheet Calculators (to port)

- Fletching Calculator
- Giants Foundry Bar Calculator
- Herblore Calculator

Note: many OSRS calculators already exist elsewhere in the community — these three are the custom ones actually needed beyond what's already available. More may be added later.

## Future Calculator Ideas (not based on existing spreadsheets, not part of current plan)

Parked for later — not scoped, not committed, not part of the v1 build order above.

- **Time to max calculator** — noted as tricky (not yet scoped further)
- **Golem crafting calculator** — noted that a good community version is likely to be released soon, which may affect whether it's worth building
- **Mastering Mixology calculator** — noted that someone else already has a screenshot/version of this, similar consideration to golem crafting on whether it's worth duplicating

## Proposed Project Structure (draft, not yet built)

```
osrs-calc-api/
├── app/
│   ├── main.py              # FastAPI app, registers calculator routers
│   ├── calculators/
│   │   ├── __init__.py      # registry — new calculator = new file here
│   │   ├── fletching.py
│   │   ├── giants_foundry.py
│   │   └── herblore.py
│   ├── integrations/
│   │   ├── hiscores.py      # fetch player XP from the official Hiscores API
│   │   └── wiki.py          # fetch shop prices / XP-boundary data from the OSRS Wiki API
│   └── models.py            # shared request/response schemas
├── frontend/                 # React (Vite) app
│   ├── src/
│   │   ├── App.jsx
│   │   └── components/       # one component set per calculator, mirrors app/calculators/
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── tests/
│   ├── api/                 # Playwright API tests (request fixture)
│   └── e2e/                 # Playwright browser tests against frontend
├── .github/workflows/test.yml
└── requirements.txt
```

## Suggested Execution Order (proposed, not yet started)

Ordered to front-load the two learning aims (Playwright, Claude Code repo conventions) rather than leaving them until the end:

1. **Set up an isolated dev environment** — devcontainer/Docker scoped to just this project folder (running inside WSL), so Claude Code has no reach into home files or other projects. Do this before anything else so all subsequent work happens inside the boundary from the start.
2. **Scaffold the repo with Claude Code** — set up the FastAPI skeleton, folder structure, and a *minimal* CLAUDE.md covering only what's already certain (tech stack, folder structure, "calculators are self-contained modules," how to run tests). This is real practice, not guessing, since it's already decided.
3. **Build one calculator end-to-end (Fletching)** — API endpoint + manual-input only (no hiscores/wiki yet). Proves the modular calculator pattern works before repeating it two more times.
4. **Write the first Playwright API test** against that one endpoint — the core Playwright learning starts here, on the simplest possible surface.
5. **Add the minimal frontend** (React/Vite form) for the Fletching calculator, then a Playwright E2E/browser test against it — second half of the Playwright learning (API testing vs. browser testing).
6. **Wire up GitHub Actions** to run the Playwright suite — small and mechanical once step 4–5 exist, but good to do early so every subsequent calculator is covered by CI automatically.
7. **Port Giants' Foundry Bar and Herblore calculators** — repeat the now-proven pattern (calculator + API test + frontend + E2E test), which should get faster each time since the scaffolding already exists. Throughout steps 3–7: whenever Claude Code hits real friction (misunderstands the calculator pattern, forgets the test convention, etc.), add to CLAUDE.md in the moment rather than banking it for later — this reactive, iterative updating is the main practice ground for the repo-conventions learning aim.
8. **Add Hiscores integration** — RSN input field, fetch-on-submit (not page load), remember last-used username locally for convenience; auto-fills XP values for whichever calculators use them.
9. **Add Wiki integration** — shop prices / XP-boundary data.
10. **Revisit Claude Code repo conventions** — a deliberate pass over what accumulated organically in CLAUDE.md during steps 3–7, deciding if anything's worth upgrading further (e.g. a recurring instruction becomes a slash command, or a repeated pattern becomes a custom skill). This is polishing what's already there, not starting from scratch.

## Open Questions / Things Still Being Considered

- Which Claude Code repo conventions to set up and experiment with (e.g. CLAUDE.md, custom skills, slash commands) — still undecided what's actually best/worth trying here
- Anything else not yet identified — this doc to be updated as scope firms up