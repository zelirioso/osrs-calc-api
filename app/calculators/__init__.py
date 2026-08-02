from fastapi import APIRouter

from app.calculators import fletching, herblore

routers: list[APIRouter] = [
    herblore.router,
    fletching.router,
]
