from fastapi import APIRouter
from fastapi.staticfiles import StaticFiles
from app.api import health, search, documents

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(search.router)
api_router.include_router(documents.router)
