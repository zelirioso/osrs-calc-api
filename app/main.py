from fastapi import FastAPI

from app.calculators import routers

app = FastAPI(title="OSRS Calculator API")

for router in routers:
    app.include_router(router)
