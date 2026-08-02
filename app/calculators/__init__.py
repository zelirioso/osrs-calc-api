from fastapi import APIRouter

from app.calculators import fletching, giants_foundry, herblore

routers: list[APIRouter] = [
    herblore.router,
    fletching.router,
    giants_foundry.router,
]
