from fastapi import APIRouter

from app.calculators import herblore

routers: list[APIRouter] = [
    herblore.router,
]
