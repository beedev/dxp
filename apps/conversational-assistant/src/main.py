"""Agentic Commerce API — FastAPI entry point."""

import redis.asyncio as redis
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.routes import chat, config_builder, data_pipeline, sessions, products, users, orders, analytics, readiness, uploads, voice
from src.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup and shutdown events."""
    # Startup: initialize Redis connection pool
    app.state.redis = redis.from_url(settings.redis_url, decode_responses=True)
    yield
    # Shutdown: close Redis
    await app.state.redis.close()


app = FastAPI(
    title="Agentic Commerce API",
    description="AI-powered autonomous shopping assistant with multi-agent orchestration",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS — restrict to known portal origins in production.
# In development, allow common localhost ports.
_ALLOWED_ORIGINS = [
    "http://localhost:4200",  # insurance portal
    "http://localhost:4300",  # payer portal
    "http://localhost:4400",  # wealth portal
    "http://localhost:4500",  # ace hardware portal
    "http://localhost:4600",  # playground
    "http://localhost:3000",  # generic dev
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket chat route at root level (not behind /api prefix)
app.include_router(chat.router, tags=["chat"])
app.include_router(sessions.router, prefix="/api", tags=["sessions"])
app.include_router(products.router, prefix="/api", tags=["products"])
app.include_router(users.router, prefix="/api", tags=["users"])
app.include_router(orders.router, prefix="/api", tags=["orders"])
app.include_router(analytics.router, prefix="/api", tags=["analytics"])
app.include_router(readiness.router, tags=["readiness"])
app.include_router(uploads.router, tags=["uploads"])
app.include_router(voice.router, tags=["voice"])
app.include_router(config_builder.router, tags=["config-builder"])
app.include_router(data_pipeline.router, tags=["data-pipeline"])


@app.get("/health")
async def health():
    return {"status": "ok", "service": "agentic-commerce-api"}
