import math

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.core.xp_table import level_at, xp_at
from app.models import StrictModel

NAME = "giants-foundry"

# Bars required to smith one of each item -- matches the sheet's "Bars"
# column exactly, independent of which metal it's made of.
BARS_PER_ITEM: dict[str, int] = {
    "scimitar": 1,
    "longsword": 1,
    "full_helm": 1,
    "square_shield": 1,
    "claws": 1,
    "warhammer": 2,
    "battleaxe": 2,
    "chainbody": 2,
    "kiteshield": 2,
    "two_handed_sword": 2,
    "platelegs": 2,
    "plateskirt": 2,
    "platebody": 4,
    "bars": 1,  # raw bars: 1 bar = 1 bar-equivalent, trivially
    "ore": 1,  # 1 ore = 1 bar-equivalent -- a simplification already in the sheet
}

# The sheet's own empirically-observed averages -- see docs/calculators/
# giants_foundry.md "The mechanic": XP per sword depends on mould-match RNG,
# so unlike every other per-unit XP value in this project, these can't be
# independently verified against the wiki.
DEFAULT_MITHRIL_ADAMANT_AVG_XP = 15561.0  # 18 Mithril + 10 Adamant
DEFAULT_ADAMANT_MITHRIL_AVG_XP = 16065.0  # 18 Adamant + 10 Mithril
DEFAULT_ADAMANT_RUNE_AVG_XP = 21477.0  # 18 Adamant + 10 Rune


class ItemQuantities(StrictModel):
    scimitar: int = Field(ge=0)
    longsword: int = Field(ge=0)
    full_helm: int = Field(ge=0)
    square_shield: int = Field(ge=0)
    claws: int = Field(ge=0)
    warhammer: int = Field(ge=0)
    battleaxe: int = Field(ge=0)
    chainbody: int = Field(ge=0)
    kiteshield: int = Field(ge=0)
    two_handed_sword: int = Field(ge=0)
    platelegs: int = Field(ge=0)
    plateskirt: int = Field(ge=0)
    platebody: int = Field(ge=0)
    bars: int = Field(ge=0)
    ore: int = Field(ge=0)


class Request(StrictModel):
    current_xp: int = Field(ge=0, le=200_000_000)
    target_level: int = Field(ge=1, le=99)
    mithril_items: ItemQuantities
    adamant_items: ItemQuantities
    rune_items: ItemQuantities
    mithril_adamant_avg_xp: float = Field(default=DEFAULT_MITHRIL_ADAMANT_AVG_XP, gt=0)
    adamant_mithril_avg_xp: float = Field(default=DEFAULT_ADAMANT_MITHRIL_AVG_XP, gt=0)
    adamant_rune_avg_xp: float = Field(default=DEFAULT_ADAMANT_RUNE_AVG_XP, gt=0)


class MithrilAdamantRow(BaseModel):
    level: int
    xp_needed: int
    swords_needed: int
    mithril_bars_needed: int
    mithril_bars_remaining: int
    adamant_bars_needed: int
    adamant_bars_remaining: int


class AdamantRuneRow(BaseModel):
    level: int
    xp_needed: int
    swords_needed: int
    adamant_bars_needed: int
    adamant_bars_remaining: int
    rune_bars_needed: int
    rune_bars_remaining: int


class Response(BaseModel):
    mithril_heavy_ladder: list[MithrilAdamantRow]
    adamant_heavy_ladder: list[MithrilAdamantRow]
    adamant_rune_ladder: list[AdamantRuneRow]


def total_bar_equivalent(items: ItemQuantities) -> int:
    return sum(BARS_PER_ITEM[item] * getattr(items, item) for item in BARS_PER_ITEM)


def calculate(request: Request) -> Response:
    current_level = level_at(request.current_xp)

    mithril_total = total_bar_equivalent(request.mithril_items)
    adamant_total = total_bar_equivalent(request.adamant_items)
    rune_total = total_bar_equivalent(request.rune_items)

    mithril_heavy_ladder: list[MithrilAdamantRow] = []
    adamant_heavy_ladder: list[MithrilAdamantRow] = []
    adamant_rune_ladder: list[AdamantRuneRow] = []

    for level in range(current_level, request.target_level + 1):
        xp_needed = max(0, xp_at(level) - request.current_xp)

        swords = math.ceil(xp_needed / request.mithril_adamant_avg_xp)
        mith_needed, adam_needed = 18 * swords, 10 * swords
        mithril_heavy_ladder.append(
            MithrilAdamantRow(
                level=level,
                xp_needed=xp_needed,
                swords_needed=swords,
                mithril_bars_needed=mith_needed,
                mithril_bars_remaining=mithril_total - mith_needed,
                adamant_bars_needed=adam_needed,
                adamant_bars_remaining=adamant_total - adam_needed,
            )
        )

        swords = math.ceil(xp_needed / request.adamant_mithril_avg_xp)
        adam_needed, mith_needed = 18 * swords, 10 * swords
        adamant_heavy_ladder.append(
            MithrilAdamantRow(
                level=level,
                xp_needed=xp_needed,
                swords_needed=swords,
                mithril_bars_needed=mith_needed,
                mithril_bars_remaining=mithril_total - mith_needed,
                adamant_bars_needed=adam_needed,
                adamant_bars_remaining=adamant_total - adam_needed,
            )
        )

        swords = math.ceil(xp_needed / request.adamant_rune_avg_xp)
        adam_needed, rune_needed = 18 * swords, 10 * swords
        adamant_rune_ladder.append(
            AdamantRuneRow(
                level=level,
                xp_needed=xp_needed,
                swords_needed=swords,
                adamant_bars_needed=adam_needed,
                adamant_bars_remaining=adamant_total - adam_needed,
                rune_bars_needed=rune_needed,
                rune_bars_remaining=rune_total - rune_needed,
            )
        )

    return Response(
        mithril_heavy_ladder=mithril_heavy_ladder,
        adamant_heavy_ladder=adamant_heavy_ladder,
        adamant_rune_ladder=adamant_rune_ladder,
    )


router = APIRouter(prefix=f"/api/calculators/{NAME}", tags=[NAME])


@router.post("")
def giants_foundry_endpoint(request: Request) -> Response:
    return calculate(request)
