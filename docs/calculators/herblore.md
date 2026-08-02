# Herblore Calculator — Spec

Transcribed from `Herblore Calculator.xlsx` (Sheet1), plus Torstol — the real 14th herb in the OSRS progression, absent from the original 13-column sheet. See Open Question 4.

**Question answered:** *"I have these herbs banked. How much of the XP to my target level do they cover, and how much is left over?"*

## Source spreadsheet layout

| Column | Meaning |
|---|---|
| A | Herb name |
| B | Quantity banked |
| C | XP per potion for that herb |
| D | `= C × B` — XP that herb is worth |

Plus a small block to the right:

```
Target XP    I1 = 737627
Current XP   I2 = 468437
XP Banked    I4 = SUM(D:D)   = 201030
XP Needed    I5 = I1 − I2    = 269190
Remaining    I7 = I5 − I4    =  68160
```

## Logic

```
xp_banked    = Σ (quantity[herb] × xp_per_potion[herb])
xp_needed    = xp_at(target_level) − current_xp
xp_remaining = xp_needed − xp_banked
```

Note the spreadsheet takes a target **XP**; the API takes a target **level** and converts it via the shared XP table (`app/core/xp_table.py`). The sheet's 737,627 is exactly level 70, so this is a faithful substitution.

## XP per potion

These are the values from column C. All were checked against in-game values and match, with one exception noted under Open Questions.

| Herb | XP per potion | Potion (inferred) |
|---|---|---|
| Guam | 25 | Attack potion |
| Marrentill | 37.5 | Antipoison |
| Tarromin | 50 | Strength potion |
| Harralander | 67.5 | Energy potion |
| Ranarr | 87.5 | Prayer potion |
| Irit | 100 | Super attack |
| Avantoe | 117.5 | Super energy |
| Kwuarm | 125 | Super strength |
| Snapdragon | 142.5 | Super restore |
| Cadantine | 150 | Super defence |
| Lantadyme | 157.5 | Anti-fire potion |
| Toadflax | 180 | Saradomin brew |
| Dwarf weed | 162.5 | Ranging potion |
| Torstol | 150 | Super combat potion |

**XP values are fractional** (67.5, 87.5, …), so all XP fields must be floats, not ints. This is a real property of Herblore, not a rounding artefact.

All values verified directly against the OSRS Wiki. Several herbs have more than one real recipe (see Open Question 2) — the sheet's choice is kept where it's a genuinely valid recipe, even when it isn't the lowest-level option for that herb.

## Proposed API

`POST /api/calculators/herblore`

Request — all 14 herb quantities required (the original sheet's 13, plus `torstol`), per the manual-entry decision in `PROJECT.md`:

```json
{
  "current_xp": 468437,
  "target_level": 70,
  "herbs": {
    "guam": 22, "marrentill": 59, "tarromin": 208, "harralander": 150,
    "ranarr": 63, "irit": 266, "avantoe": 290, "kwuarm": 344,
    "snapdragon": 29, "cadantine": 306, "lantadyme": 77,
    "toadflax": 4, "dwarf_weed": 51, "torstol": 0
  }
}
```

Response:

```json
{
  "xp_banked": 203642.5,
  "xp_needed": 269190,
  "xp_remaining": 65547.5,
  "xp_surplus": 0.0,
  "breakdown": [
    { "herb": "guam", "quantity": 22, "xp_per_potion": 25.0, "xp": 550.0 }
  ]
}
```

`breakdown` mirrors the spreadsheet's column D and gives the frontend a table to render rather than three bare numbers.

`xp_needed`, `xp_remaining` and `xp_surplus` are computed from one total rather than the sheet's two independent subtractions, so the two negative-value cases from Open Question 3 compose correctly instead of producing two disagreeing "surplus" concepts:

```
total_available = current_xp + xp_banked
xp_needed        = max(0, xp_at(target_level) - current_xp)
xp_remaining      = max(0, xp_at(target_level) - total_available)
xp_surplus        = max(0, total_available - xp_at(target_level))
```

Validation (Pydantic constraints → automatic 422):

- `current_xp`: `ge=0, le=200_000_000`
- `target_level`: `ge=1, le=99`
- herb quantities: `ge=0`

## Worked example — use as the first test

Directly from the spreadsheet, so it verifies the port rather than the implementation's own assumptions.

**Input:** `current_xp = 468437`, `target_level = 70`, herb quantities as in the request above.

**Per-herb XP:**

| Herb | Qty | XP/potion | XP |
|---|---|---|---|
| Guam | 22 | 25 | 550 |
| Marrentill | 59 | 37.5 | 2,212.5 |
| Tarromin | 208 | 50 | 10,400 |
| Harralander | 150 | 67.5 | 10,125 |
| Ranarr | 63 | 87.5 | 5,512.5 |
| Irit | 266 | 100 | 26,600 |
| Avantoe | 290 | 117.5 | 34,075 |
| Kwuarm | 344 | 125 | 43,000 |
| Snapdragon | 29 | 142.5 | 4,132.5 |
| Cadantine | 306 | 150 | 45,900 |
| Lantadyme | 77 | 157.5 | 12,127.5 |
| Toadflax | 4 | 180 | 720 |
| Dwarf weed | 51 | 162.5 | 8,287.5 |
| Torstol | 0 | 150 | 0 |

**Expected output:**

```
xp_banked    = 203642.5
xp_needed    = 737627 − 468437 = 269190
xp_remaining = 737627 − (468437 + 203642.5) = 65547.5
xp_surplus   = 0.0
```

Useful supporting assertions: `xp_at(70) == 737627`, and `current_xp = 468437` sits in level 65 (level 66 starts at 496,254). `torstol = 0` here since the original spreadsheet has no data for it — a separate test covers a nonzero Torstol quantity.

## Scope — what this deliberately does not model

The spreadsheet is a pure XP-coverage calculation. It ignores:

- **Secondary ingredients** — assumes you have the eye of newt, limpwurt roots etc. to match
- **The unfinished-potion step** — herb → unf potion grants no XP, so it doesn't affect the total
- **Grimy vs. clean herbs** — cleaning XP is not counted; each herb is assumed to become exactly one potion
- **Cost** — no GP anywhere, unlike the Fletching sheet

## Open Questions

1. ~~**Marrentill is 0, not 37.5.**~~ **Resolved:** fixed to 37.5 (real in-game Antipoison value), matching every other herb in the sheet. Worked example below updated accordingly.

2. **Several herbs make more than one potion.** The sheet fixed one choice per herb, but e.g. Harralander can be Restore (62.5), Energy (67.5 — the sheet's pick) or Combat (84); Ranarr can be Defence (75) or Prayer (87.5). (Toadflax was ambiguous between Agility (80) and Saradomin brew (180) — confirmed as Saradomin brew, 180.) Should the potion choice per herb be a request parameter with the sheet's values as defaults, mirroring how prices are handled? That would make the calculator meaningfully more useful, at the cost of a larger request body. Deferred — out of scope for the initial port, which mirrors the sheet's fixed choices exactly.

3. ~~**Negative results.**~~ **Resolved:** clamp both `xp_needed` and `xp_remaining` to 0, expose the excess as a single `xp_surplus` field computed from `current_xp + xp_banked` as one total, rather than two independent surplus concepts. See the formula under **Proposed API** above.

4. ~~**Torstol missing.**~~ **Resolved:** the original sheet only has 13 herb columns, but the real OSRS Herblore progression has 14 — Torstol was never in the source spreadsheet at all. Added as a 14th required field (`torstol`) rather than left out, since the calculator's purpose is real herb-XP coverage, not sheet fidelity for its own sake. Torstol has two real recipes (Zamorak brew, level 78, 175 XP; Super combat potion, level 90, 150 XP) — Super combat potion was picked.
