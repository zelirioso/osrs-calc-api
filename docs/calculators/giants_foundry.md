# Giants' Foundry Calculator — Spec

Transcribed from `Giants Foundry Bar Calculator.xlsx` (Sheet1).

**Question answered:** *"Given the bar-equivalent inventory I have banked (raw bars, raw ore, and existing equipment I could feed into the crucible), how many more swords do I need to forge under each of three metal-pairing strategies to reach my target level, and do I have enough of each metal to sustain that all the way there?"*

## The mechanic (verified against the OSRS Wiki, not assumed)

Giants' Foundry fills a 28-bar crucible per sword commission. Combining **exactly two** metal types (not one, not three) maximizes a "metal score" that feeds into the XP formula alongside how well the resulting mould shape matches the commission — so **XP per sword is not a fixed game constant**, it's an average the player observes over many (RNG-dependent) attempts. The sheet's own label — "Average sword" — reflects this: these are the sheet author's personally-recorded averages, not values this doc can independently verify like Herblore's or Fletching's XP constants.

The sheet models three such 28-bar recipes:

| Recipe | Ratio | Average XP/sword (sheet's value) |
|---|---|---|
| Mithril-heavy | 18 Mithril + 10 Adamant | 15,561 |
| Adamant-heavy | 18 Adamant + 10 Mithril | 16,065 |
| Adamant/Rune | 18 Adamant + 10 Rune | 21,477 |

Per the OSRS Wiki, smithed equipment can be inserted into the crucible instead of raw bars, contributing bar-equivalent value based on what it cost to smith — this is what the item-inventory table below models.

## Source spreadsheet layout

Two item-inventory tables (rows 2–17: Mithril + Adamant; rows 21–36: Rune), each listing the same 13 equipment pieces plus raw Bars and raw Ore:

| Item | Bars to smith (B column) |
|---|---|
| Scimitar, Longsword, Full Helm, Square Shield, Claws | 1 |
| Warhammer, Battleaxe, Chainbody, Kiteshield, 2h, Platelegs, Plateskirt | 2 |
| Platebody | 4 |
| Bars (raw) | 1 |
| Ore (raw) | 1 |

Per row: `Bar Equivalent = (bars to smith) × (quantity owned)`. Totals (row 17 for Mithril/Adamant, row 36 for Rune) sum the column.

Then three ladder tables (rows 3–16, 20–33, 37–50), one per recipe, each row = one level from 86 to 99:

```
xp_needed        = target_level_xp − current_xp
swords_needed     = CEILING(xp_needed / avg_xp_per_sword, 1)
primary_needed    = primary_ratio × swords_needed
secondary_needed  = secondary_ratio × swords_needed
primary_diff      = primary_metal_total_owned − primary_needed
secondary_diff    = secondary_metal_total_owned − secondary_needed
```

`diff` going negative is the sheet's actual point: it tells you at which level, under which strategy, you'd run out of a given metal.

## Design decisions (this calculator needed real back-and-forth, not just transcription)

1. **Item quantities are owned-equipment counts** — e.g. `mithril_items.full_helm = 63` means 63 Mithril Full Helms banked, insertable into the crucible. Confirmed, not assumed.
2. **No adjustment beyond the sheet's own formula** — the Wiki mentions smithed equipment contributes `(bars to smith − 1)` bar-equivalent value, but the sheet computes straight `bars × quantity`. Kept as the sheet has it.
3. **Ladder output, not a single result** — unlike Herblore/Fletching, this calculator takes `current_xp` + `target_level` but returns a full level-by-level table from the player's current level through the target, for all three recipes at once — matching the sheet's own structure, which is built around watching *where* a diff column goes negative, not a single endpoint number.
4. **Average XP per sword is a request field, not a hardcoded constant**, for all three recipes, defaulting to the sheet's own values — since these are empirical, not verifiable game constants, unlike every other per-unit XP value in this project so far.

## Proposed API

`POST /api/calculators/giants-foundry`

Request:

```json
{
  "current_xp": 3599950,
  "target_level": 99,
  "mithril_items": {
    "scimitar": 0, "longsword": 0, "full_helm": 63, "square_shield": 0, "claws": 0,
    "warhammer": 0, "battleaxe": 32, "chainbody": 0, "kiteshield": 0,
    "two_handed_sword": 0, "platelegs": 0, "plateskirt": 0, "platebody": 0,
    "bars": 1499, "ore": 991
  },
  "adamant_items": {
    "scimitar": 19, "longsword": 0, "full_helm": 0, "square_shield": 0, "claws": 0,
    "warhammer": 0, "battleaxe": 256, "chainbody": 2, "kiteshield": 296,
    "two_handed_sword": 0, "platelegs": 32, "plateskirt": 0, "platebody": 45,
    "bars": 1495, "ore": 5328
  },
  "rune_items": {
    "scimitar": 0, "longsword": 0, "full_helm": 0, "square_shield": 0, "claws": 0,
    "warhammer": 0, "battleaxe": 0, "chainbody": 0, "kiteshield": 0,
    "two_handed_sword": 0, "platelegs": 0, "plateskirt": 0, "platebody": 0,
    "bars": 215, "ore": 736
  },
  "mithril_adamant_avg_xp": 15561,
  "adamant_mithril_avg_xp": 16065,
  "adamant_rune_avg_xp": 21477
}
```

Response — one row per level, current level through target, for each of the three ladders:

```json
{
  "mithril_heavy_ladder": [
    { "level": 86, "xp_needed": 0, "swords_needed": 0,
      "mithril_bars_needed": 0, "mithril_bars_remaining": 2617,
      "adamant_bars_needed": 0, "adamant_bars_remaining": 8194 },
    { "level": 87, "xp_needed": 372344, "swords_needed": 24,
      "mithril_bars_needed": 432, "mithril_bars_remaining": 2185,
      "adamant_bars_needed": 240, "adamant_bars_remaining": 7954 }
  ],
  "adamant_heavy_ladder": ["... same row shape, 18 Adamant + 10 Mithril per sword"],
  "adamant_rune_ladder": [
    { "level": 86, "xp_needed": 0, "swords_needed": 0,
      "adamant_bars_needed": 0, "adamant_bars_remaining": 8194,
      "rune_bars_needed": 0, "rune_bars_remaining": 951 },
    { "level": 87, "xp_needed": 372344, "swords_needed": 18,
      "adamant_bars_needed": 324, "adamant_bars_remaining": 7870,
      "rune_bars_needed": 180, "rune_bars_remaining": 771 }
  ]
}
```

Validation (Pydantic constraints → automatic 422):

- `current_xp`: `ge=0, le=200_000_000`
- `target_level`: `ge=1, le=99`
- all item quantities: `ge=0`
- `*_avg_xp` fields: `gt=0`
- unknown/extra fields → 422 (`StrictModel`, same as the other two calculators)

## Worked example — use as the first test

`current_xp = 3599950` sits in level 86 (level 87 starts at 3,972,294). Item quantities exactly as in the request above; `target_level = 99` — the sheet's own full range, chosen so the worked example is verifiable against every one of the sheet's 42 cached ladder rows, not just a subset.

**Totals from owned items** (verified against the sheet's own cached `Totals` row):
`mithril_total = 2617`, `adamant_total = 8194`, `rune_total = 951`.

**Mithril-heavy ladder (18 Mithril + 10 Adamant), full 14 rows — matches the sheet's cached K/L/M/N/O columns exactly, verified programmatically against all 14, not just spot-checked:**

| Level | XP needed | Swords | Mithril needed | Mithril remaining | Adamant needed | Adamant remaining |
|---|---|---|---|---|---|---|
| 86 | 0 | 0 | 0 | 2617 | 0 | 8194 |
| 87 | 372,344 | 24 | 432 | 2185 | 240 | 7954 |
| 88 | 785,826 | 51 | 918 | 1699 | 510 | 7684 |
| 89 | 1,242,345 | 80 | 1440 | 1177 | 800 | 7394 |
| 90 | 1,746,382 | 113 | 2034 | 583 | 1130 | 7064 |
| 91 | 2,302,881 | 148 | 2664 | −47 | 1480 | 6714 |
| 92 | 2,917,303 | 188 | 3384 | −767 | 1880 | 6314 |
| 93 | 3,595,679 | 232 | 4176 | −1559 | 2320 | 5874 |
| 94 | 4,344,664 | 280 | 5040 | −2423 | 2800 | 5394 |
| 95 | 5,171,608 | 333 | 5994 | −3377 | 3330 | 4864 |
| 96 | 6,084,627 | 392 | 7056 | −4439 | 3920 | 4274 |
| 97 | 7,092,679 | 456 | 8208 | −5591 | 4560 | 3634 |
| 98 | 8,205,656 | 528 | 9504 | −6887 | 5280 | 2914 |
| 99 | 9,434,481 | 607 | 10926 | −8309 | 6070 | 2124 |

Mithril runs out (negative remaining) starting at level 91 — the sheet's whole point, made concrete.

**Adamant/Rune ladder, spot-checked (level 87 row, verified against the sheet's cached values):** `xp_needed = 372344`, `swords_needed = 18`, `adamant_bars_needed = 324` (remaining 7870), `rune_bars_needed = 180` (remaining 771).

## Scope — what this deliberately does not model

- **Mould-match/refinement RNG** — average XP per sword is an input, not simulated
- **Coal cost of converting ore into bars** — the sheet treats 1 ore as 1 bar-equivalent directly (a simplifying assumption already present in the source)
- **Buying bars/items** — no cost fields anywhere, same as Herblore; everything here is assumed already banked

## Open Questions

None outstanding — every ambiguity in this one (item-quantity meaning, the Wiki's −1 adjustment, ladder vs. single-result output shape) was resolved before implementation, unlike Herblore/Fletching where some were caught after the fact.
