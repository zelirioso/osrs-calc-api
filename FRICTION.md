# FRICTION.md

Log of where Claude Code stumbled and the fix, per `PROJECT.md`'s plan for steps 4–9: *"whenever Claude Code hits real friction ... add to CLAUDE.md in the moment and log it in FRICTION.md."*

Reconstructed retroactively after steps 1–9 were already complete, rather than logged live — a gap in itself (see the last entry below). Organized by category, not strictly chronological.

## Environment / tooling

- **pytest couldn't import `app`.** `ModuleNotFoundError: No module named 'app'`. The project deliberately isn't installed as a package, so pytest had no repo root on `sys.path`. Fix: `[tool.pytest.ini_options] pythonpath = ["."]` in `pyproject.toml`.

- **TypeScript 7 didn't auto-discover `@types/node`.** `Cannot find name 'process'` in `playwright.config.ts` despite `@types/node` being installed. This very new (native Go-ported) TypeScript major version doesn't auto-include `@types/*` packages the way earlier versions did. Fix: explicit `"types": ["node"]` in `tsconfig.json`.

- **Vite's default `localhost` binding resolved to IPv6, breaking Playwright's healthcheck.** The frontend `webServer` entry timed out after 60s because Vite bound `localhost` (which resolved to `::1`) while Playwright's healthcheck hit `127.0.0.1`. Fix: explicit `--host 127.0.0.1` on every server-boot command (uvicorn and Vite both) — including the standalone `npm run dev` script, not just `playwright.config.ts`.

- **Root `tsconfig.json` had no DOM lib.** `page.evaluate()` callbacks run in-browser, so referencing `HTMLInputElement` inside one failed type-checking under a Node-only `lib: ["ES2022"]`. Fix: added `"DOM"` to `lib`.

- **VS Code's Playwright extension doesn't reliably drive the multi-server `webServer` array.** Clicking the sidebar's test-run button produced `ERR_CONNECTION_REFUSED` across the board — twice in this project — because the extension didn't start both servers the way `npx playwright test` (CLI) does. Workaround, not a repo-side fix: start `npm run dev` manually in a terminal first, so `reuseExistingServer` lets the extension connect to already-running servers instead of trying (and failing) to start its own.

## Frontend code

- **React's `FormEvent` is deprecated.** Doesn't correspond to any real DOM event; a form's `onSubmit` handler actually receives `SubmitEvent`. `@types/react` flags this now. Fix: use `SubmitEvent`.

- **Classic controlled-number-input bug.** Binding an input directly to `number` state with `setState(Number(e.target.value))` on every keystroke fights the user when clearing a field or retyping leading digits, since React re-imposes the numeric default mid-edit. Fix: keep the raw string in state, convert to `Number` only at submit time.

- **Dark-mode default was inverted.** Added `prefers-color-scheme: light` as "a nicety for anyone who wants it," but that's exactly what fires for anyone on a normal light-mode OS — the common case — so the page rendered light by default, backwards from what was asked. Fix: removed the light override; dark is unconditional.

## Data verification (Herblore XP values)

- **A single WebFetch summarization pass is not reliable for exact numeric game data.** Three herb XP values needed real correction after being wrong but *internally consistent* — tests passed either way, since the maths doesn't know a value is factually wrong: Marrentill (0 → 37.5), Toadflax (80 was confirmed a real recipe, but the wrong one — should've been Saradomin brew, 180), Lantadyme (157.5 → 172.5, mislabeled Anti-fire instead of Magic potion). Two different broad-summarization fetches of the same wiki page even gave inconsistent "primary recipe" picks for the same herb. Fix/lesson: for anything going into a worked example or test — not just casual browsing — verify with a targeted, literal-extraction fetch of the specific item's own wiki page, not a broad summarization fetch. Now the standing rule in `CLAUDE.md`'s "After every change" section.

## Process

- **This file didn't exist until now.** `PROJECT.md` calls for logging friction live, throughout steps 4–9, specifically so step 10 (revisiting repo conventions) reviews real evidence instead of starting from nothing. It got skipped in the moment and reconstructed from memory afterward instead — later, fuzzier, and easier to under-report than a log kept in real time would have been.
