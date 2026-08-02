# Fletching Calculator — Spec

Transcribed from `Fletching Calculator.xlsx` (Sheet1), plus a banked-arrow-shafts extension not present in the original sheet — see Open Question 2.

**Question answered:** *"How many maple logs do I need to buy (and how much do feathers + broad arrowheads cost) to reach my target Fletching level, optionally starting from arrow shafts I already have banked?"*

## Source spreadsheet layout

The sheet is one formula template, copy-pasted four times (different target levels), all sharing one column layout:

| Row | Meaning |
|---|---|
| `XP` | Current XP |
| `Target XP` | Target XP |
| `XP Needed` | `= Target XP − Current XP` |
| `XP per maple log` | `= 20 + 60×10 + 60` = 680 (see breakdown below) |
| `Number of maple logs needed` | `= CEILING(XP Needed / XP per maple log)` |
| `Numer of feathers/broad arrowheads` | `= logs needed × 60` |
| `Broad Arrow Cost (250/world)` | `= feathers/arrowheads × 55` (+ `÷ 250`: GE buy-limit cycles needed) |
| `Feather Cost` | `= feathers/arrowheads × 3.5099` |
| `Total Cost` | `= Feather Cost + Broad Arrow Cost` |

Of the four copies, two are degenerate (target XP below current XP — stale scratch data left over from earlier checks, before "current XP" got overwritten to today's value without updating the old target). The two valid ones:

| Target level | Current XP | Target XP | Result |
|---|---|---|---|
| 90 | 2,239,474 | 5,346,332 | used as the worked example below |
| 91 | 2,239,474 | 5,902,831 | also valid, not used |

## Logic

The formula's `20 + 60×10 + 60` groups its terms in an order that doesn't match the real step sequence (though addition doesn't care, so the total was never actually wrong). The real chain, verified against the OSRS Wiki:

| Step | Level | XP | Yield |
|---|---|---|---|
| Fletch 1 maple log → arrow shafts | 45 | 20 (per log) | 60 shafts |
| Attach feather → headless arrow | 1 | 1 (per arrow) | 1:1 |
| Attach broad arrowhead → broad arrow | 52 | 10 (per arrow) | 1:1 |

So one maple log, fully processed into 60 broad arrows, is worth `20 + 60×1 + 60×10 = 680` XP — matching the sheet's constant exactly.

**Banked arrow shafts** (not in the original sheet): a shaft you already own skips the log-cutting step (and its 20 XP), but still needs a feather and a broad arrowhead like any other shaft — worth `1 + 10 = 11` XP each rather than a new log's `680 / 60 = 11.33` XP-per-shaft average. Banked shafts are used first, before any new logs are bought:

```
target_xp             = xp_at(target_level)
xp_needed              = max(0, target_xp − current_xp)

xp_per_banked_shaft    = 11        # headless (1) + broad arrow (10), no log XP
xp_per_log             = 680       # 20 + 60 × 11, full chain from a fresh log
max_banked_xp          = banked_arrow_shafts × xp_per_banked_shaft

if max_banked_xp >= xp_needed:
    shafts_used_from_banked = ceil(xp_needed / xp_per_banked_shaft)
    logs_needed              = 0
else:
    shafts_used_from_banked = banked_arrow_shafts
    logs_needed              = ceil((xp_needed − max_banked_xp) / xp_per_log)

shafts_remaining_banked = banked_arrow_shafts − shafts_used_from_banked
total_shafts_processed  = shafts_used_from_banked + logs_needed × 60

feathers_needed          = total_shafts_processed
broad_arrowheads_needed  = total_shafts_processed
```

With `banked_arrow_shafts = 0` this reduces to exactly the sheet's original formula — verified against the level-90 block's real cached values (see worked example).

No log cost, and no shaft cost, are modelled — consistent with the original sheet, which only ever prices feathers and broad arrowheads. Logs (and now banked shafts) are assumed self-supplied, same as Herblore assumes herbs are already banked rather than bought.

## Proposed API

`POST /api/calculators/fletching`

Request:

```json
{
  "current_xp": 2239474,
  "target_level": 90,
  "banked_arrow_shafts": 0,
  "feather_price": 3.5099,
  "broad_arrowhead_price": 55.0
}
```

`feather_price` and `broad_arrowhead_price` are optional, defaulting to the sheet's own values, per the project-wide price-handling convention. `banked_arrow_shafts` is optional, defaulting to 0 (buy everything from scratch, matching the original sheet's behaviour exactly).

Response:

```json
{
  "xp_needed": 3106858,
  "logs_needed": 4569,
  "shafts_used_from_banked": 0,
  "shafts_remaining_banked": 0,
  "feathers_needed": 274140,
  "broad_arrowheads_needed": 274140,
  "feather_cost": 962203.986,
  "broad_arrowhead_cost": 15077700.0,
  "total_cost": 16039903.986
}
```

Validation (Pydantic constraints → automatic 422):

- `current_xp`: `ge=0, le=200_000_000`
- `target_level`: `ge=1, le=99`
- `banked_arrow_shafts`: `ge=0` (no upper bound — matches Herblore's herb-quantity precedent)
- `feather_price`, `broad_arrowhead_price`: `ge=0`
- unknown/extra fields → 422 (`StrictModel`, same as Herblore)

## Worked examples — use as tests

**Example A — matches the sheet exactly** (`banked_arrow_shafts = 0`), verifies the port against the sheet's own cached values, not just the implementation's assumptions.

**Input:** `current_xp = 2239474`, `target_level = 90`, `banked_arrow_shafts = 0`.

```
xp_needed                = 5346332 − 2239474 = 3106858
logs_needed               = ceil(3106858 / 680) = 4569
shafts_used_from_banked   = 0
shafts_remaining_banked   = 0
feathers_needed           = broad_arrowheads_needed = 4569 × 60 = 274140
feather_cost              = 274140 × 3.5099 = 962203.986
broad_arrowhead_cost      = 274140 × 55 = 15077700.0
total_cost                = 16039903.986
```

Every number above matches the spreadsheet's own cached (not recomputed) values exactly.

**Example B — banked shafts partially cover the target**, exercising both branches of the banked-shafts logic in one example: enough banked shafts to reduce the log purchase, but not enough to eliminate it entirely.

**Input:** same as Example A, but `banked_arrow_shafts = 50000`.

```
xp_per_banked_shaft = 11, max_banked_xp = 50000 × 11 = 550000
550000 < 3106858, so all 50000 banked shafts are used, remainder = 3106858 − 550000 = 2556858

logs_needed               = ceil(2556858 / 680) = 3761
shafts_used_from_banked   = 50000
shafts_remaining_banked   = 0
feathers_needed           = broad_arrowheads_needed = 50000 + 3761 × 60 = 275660
feather_cost              = 275660 × 3.5099 = 967539.034
broad_arrowhead_cost      = 275660 × 55 = 15161300.0
total_cost                = 16128839.034
```

Useful supporting assertion: `xp_at(90) == 5346332`, `xp_at(81) == 2192818` (matches the sheet's level-81 block's target exactly, confirming the shared XP table lines up with the spreadsheet's own numbers).

## Scope — what this deliberately does not model

- **Log cost** — logs are assumed self-supplied (via Woodcutting), same as the original sheet
- **Wood types other than maple** — the sheet only ever uses maple logs; other woods have different shaft yields and XP (see Open Question 1)
- **GE buy-limit cycling** — the sheet's `÷ 250` ("worlds needed") column is dropped; it's a shopping-logistics note, not part of the XP/cost calculation itself

## Open Questions

1. **Maple logs only.** The sheet only ever computes for maple logs (level 45, 20 XP, 60 shafts/log). Other wood types (regular through magic) have different shaft yields and XP per log. Should log type become a request parameter, mirroring how Herblore deferred per-herb potion choice? Deferred — out of scope for the initial port, which mirrors the sheet's fixed choice exactly.

2. **Banked arrow shafts.** Not in the original sheet at all — added because the sheet's author (you) confirmed having a large existing stock of arrow shafts, and the log-vs-shaft distinction is a real, well-defined mechanic (verified against the OSRS Wiki: a shaft only needs feather + broad arrowhead, 11 XP, vs. a fresh log's full 680 XP chain). Resolved as described in **Logic** above.
