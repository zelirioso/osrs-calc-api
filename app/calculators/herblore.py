from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.core.xp_table import xp_at
from app.models import StrictModel

NAME = "herblore"

# Column C of the spreadsheet: XP per potion, one fixed choice per herb.
# See docs/calculators/herblore.md for the potion each value corresponds to.
# Ordered by herb identification/cleaning level (Guam 3 ... Torstol 75),
# not the original spreadsheet's column order.
XP_PER_POTION: dict[str, float] = {
    "guam": 25.0,
    "marrentill": 37.5,
    "tarromin": 50.0,
    "harralander": 67.5,
    "ranarr": 87.5,
    "toadflax": 180.0,
    "irit": 100.0,
    "avantoe": 117.5,
    "kwuarm": 125.0,
    "snapdragon": 142.5,
    "cadantine": 150.0,
    "lantadyme": 172.5,
    "dwarf_weed": 162.5,
    "torstol": 150.0,
}


class HerbQuantities(StrictModel):
    guam: int = Field(ge=0)
    marrentill: int = Field(ge=0)
    tarromin: int = Field(ge=0)
    harralander: int = Field(ge=0)
    ranarr: int = Field(ge=0)
    toadflax: int = Field(ge=0)
    irit: int = Field(ge=0)
    avantoe: int = Field(ge=0)
    kwuarm: int = Field(ge=0)
    snapdragon: int = Field(ge=0)
    cadantine: int = Field(ge=0)
    lantadyme: int = Field(ge=0)
    dwarf_weed: int = Field(ge=0)
    torstol: int = Field(ge=0)


class Request(StrictModel):
    current_xp: int = Field(ge=0, le=200_000_000)
    target_level: int = Field(ge=1, le=99)
    herbs: HerbQuantities


class HerbBreakdown(BaseModel):
    herb: str
    quantity: int
    xp_per_potion: float
    xp: float


class Response(BaseModel):
    xp_banked: float
    xp_needed: int
    xp_remaining: float
    xp_surplus: float
    breakdown: list[HerbBreakdown]


def calculate(request: Request) -> Response:
    breakdown = [
        HerbBreakdown(
            herb=herb,
            quantity=quantity,
            xp_per_potion=XP_PER_POTION[herb],
            xp=quantity * XP_PER_POTION[herb],
        )
        for herb, quantity in request.herbs.model_dump().items()
    ]
    xp_banked = sum(item.xp for item in breakdown)

    target_xp = xp_at(request.target_level)
    total_available = request.current_xp + xp_banked

    return Response(
        xp_banked=xp_banked,
        xp_needed=max(0, target_xp - request.current_xp),
        xp_remaining=max(0, target_xp - total_available),
        xp_surplus=max(0, total_available - target_xp),
        breakdown=breakdown,
    )


router = APIRouter(prefix=f"/api/calculators/{NAME}", tags=[NAME])


@router.post("")
def herblore_endpoint(request: Request) -> Response:
    return calculate(request)
