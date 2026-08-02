# Herblore Calculator — Spec

Transcribed from `Herblore Calculator.xlsx` (Sheet1).

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
| Marrentill | **0** | — see Open Questions |
| Tarromin | 50 | Strength potion |
| Harralander | 67.5 | Energy potion |
| Ranarr | 87.5 | Prayer potion |
| Irit | 100 | Super attack |
| Avantoe | 117.5 | Super energy |
| Kwuarm | 125 | Super strength |
| Snapdragon | 142.5 | Super restore |
| Cadantine | 150 | Super defence |
| Lantadyme | 157.5 | Anti-fire potion |
| Toadflax | 80 | Agility potion |
| Dwarf weed | 162.5 | Ranging potion |

**XP values are fractional** (67.5, 87.5, …), so all XP fields must be floats, not ints. This is a real property of Herblore, not a rounding artefact.

## Proposed API

`POST /api/calculators/herblore`

Request — all 13 herb quantities required, per the manual-entry decision in `PROJECT.md`:

```json
{
  "current_xp": 468437,
  "target_level": 70,
  "herbs": {
    "guam": 22, "marrentill": 59, "tarromin": 208, "harralander": 150,
    "ranarr": 63, "irit": 266, "avantoe": 290, "kwuarm": 344,
    "snapdragon": 29, "cadantine": 306, "lantadyme": 77,
    "toadflax": 4, "dwarf_weed": 51
  }
}
```

Response:

```json
{
  "xp_banked": 201030.0,
  "xp_needed": 269190,
  "xp_remaining": 68160.0,
  "breakdown": [
    { "herb": "guam", "quantity": 22, "xp_per_potion": 25.0, "xp": 550.0 }
  ]
}
```

`breakdown` mirrors the spreadsheet's column D and gives the frontend a table to render rather than three bare numbers.

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
| Marrentill | 59 | 0 | 0 |
| Tarromin | 208 | 50 | 10,400 |
| Harralander | 150 | 67.5 | 10,125 |
| Ranarr | 63 | 87.5 | 5,512.5 |
| Irit | 266 | 100 | 26,600 |
| Avantoe | 290 | 117.5 | 34,075 |
| Kwuarm | 344 | 125 | 43,000 |
| Snapdragon | 29 | 142.5 | 4,132.5 |
| Cadantine | 306 | 150 | 45,900 |
| Lantadyme | 77 | 157.5 | 12,127.5 |
| Toadflax | 4 | 80 | 320 |
| Dwarf weed | 51 | 162.5 | 8,287.5 |

**Expected output:**

```
xp_banked    = 201030.0
xp_needed    = 737627 − 468437 = 269190
xp_remaining = 269190 − 201030 = 68160.0
```

Useful supporting assertions: `xp_at(70) == 737627`, and `current_xp = 468437` sits in level 65 (level 66 starts at 496,254).

## Scope — what this deliberately does not model

The spreadsheet is a pure XP-coverage calculation. It ignores:

- **Secondary ingredients** — assumes you have the eye of newt, limpwurt roots etc. to match
- **The unfinished-potion step** — herb → unf potion grants no XP, so it doesn't affect the total
- **Grimy vs. clean herbs** — cleaning XP is not counted; each herb is assumed to become exactly one potion
- **Cost** — no GP anywhere, unlike the Fletching sheet

## Open Questions

1. **Marrentill is 0, not 37.5.** Every other herb matches its in-game value, but Marrentill → Antipoison is 37.5 XP and the sheet has 0 against a real quantity of 59. Deliberate (not making antipoisons) or an unfilled cell? At 59 herbs it's 2,212.5 XP, so it does move the answer. **Needs confirming before the worked example becomes a test.**

2. **Several herbs make more than one potion.** The sheet fixed one choice per herb, but e.g. Harralander can be Restore (62.5), Energy (67.5 — the sheet's pick) or Combat (84); Ranarr can be Defence (75) or Prayer (87.5); Toadflax can be Agility (80) or Saradomin brew (180). Should the potion choice per herb be a request parameter with the sheet's values as defaults, mirroring how prices are handled? That would make the calculator meaningfully more useful, at the cost of a larger request body.

3. **Negative results.** If banked XP exceeds what's needed, `xp_remaining` goes negative (the Fletching sheet has the same behaviour on its already-passed target). Options: return the negative as-is, or clamp to 0 and add a `xp_surplus` field. Same question for `xp_needed` when `current_xp` already exceeds the target level's XP.
