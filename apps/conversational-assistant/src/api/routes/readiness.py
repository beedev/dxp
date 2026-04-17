"""Readiness Monitor endpoint."""

from fastapi import APIRouter

from src.services.readiness import compute_readiness

router = APIRouter()


@router.get("/api/readiness")
async def get_readiness() -> dict:
    """Return the agent-readiness score and breakdown."""
    return await compute_readiness()
