import math

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.core.xp_table import xp_at
from app.models import StrictModel

NAME = "fletching"

# Verified against the OSRS Wiki -- see docs/calculators/fletching.md "Logic".
XP_PER_LOG_CUT = 20  # fletching 1 maple log into shafts, level 45
SHAFTS_PER_LOG = 60
XP_PER_HEADLESS_ARROW = 1  # shaft + feather, level 1
XP_PER_BROAD_ARROW = 10  # headless arrow + broad arrowhead, level 52

XP_PER_BANKED_SHAFT = XP_PER_HEADLESS_ARROW + XP_PER_BROAD_ARROW  # 11
XP_PER_LOG = XP_PER_LOG_CUT + SHAFTS_PER_LOG * XP_PER_BANKED_SHAFT  # 680

DEFAULT_FEATHER_PRICE = 3.5099
DEFAULT_BROAD_ARROWHEAD_PRICE = 55.0


class Request(StrictModel):
    current_xp: int = Field(ge=0, le=200_000_000)
    target_level: int = Field(ge=1, le=99)
    banked_arrow_shafts: int = Field(default=0, ge=0)
    feather_price: float = Field(default=DEFAULT_FEATHER_PRICE, ge=0)
    broad_arrowhead_price: float = Field(default=DEFAULT_BROAD_ARROWHEAD_PRICE, ge=0)


class Response(BaseModel):
    xp_needed: int
    logs_needed: int
    shafts_used_from_banked: int
    shafts_remaining_banked: int
    feathers_needed: int
    broad_arrowheads_needed: int
    feather_cost: float
    broad_arrowhead_cost: float
    total_cost: float


def calculate(request: Request) -> Response:
    target_xp = xp_at(request.target_level)
    xp_needed = max(0, target_xp - request.current_xp)

    max_banked_xp = request.banked_arrow_shafts * XP_PER_BANKED_SHAFT

    if max_banked_xp >= xp_needed:
        shafts_used_from_banked = math.ceil(xp_needed / XP_PER_BANKED_SHAFT)
        logs_needed = 0
    else:
        shafts_used_from_banked = request.banked_arrow_shafts
        logs_needed = math.ceil((xp_needed - max_banked_xp) / XP_PER_LOG)

    shafts_remaining_banked = request.banked_arrow_shafts - shafts_used_from_banked
    total_shafts_processed = shafts_used_from_banked + logs_needed * SHAFTS_PER_LOG

    feather_cost = total_shafts_processed * request.feather_price
    broad_arrowhead_cost = total_shafts_processed * request.broad_arrowhead_price

    return Response(
        xp_needed=xp_needed,
        logs_needed=logs_needed,
        shafts_used_from_banked=shafts_used_from_banked,
        shafts_remaining_banked=shafts_remaining_banked,
        feathers_needed=total_shafts_processed,
        broad_arrowheads_needed=total_shafts_processed,
        feather_cost=feather_cost,
        broad_arrowhead_cost=broad_arrowhead_cost,
        total_cost=feather_cost + broad_arrowhead_cost,
    )


router = APIRouter(prefix=f"/api/calculators/{NAME}", tags=[NAME])


@router.post("")
def fletching_endpoint(request: Request) -> Response:
    return calculate(request)
