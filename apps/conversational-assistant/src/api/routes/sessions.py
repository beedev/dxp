"""Session management endpoints."""

import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.security import require_api_key
from src.db.models import AgentSession, Message, AgentStep
from src.db.session import get_db

router = APIRouter()


class CreateSessionRequest(BaseModel):
    user_id: str


class SessionResponse(BaseModel):
    id: str
    user_id: str
    status: str

    class Config:
        from_attributes = True


@router.post("/sessions", response_model=SessionResponse)
async def create_session(
    req: CreateSessionRequest,
    db: AsyncSession = Depends(get_db),
    _auth=Depends(require_api_key),
):
    session = AgentSession(user_id=uuid.UUID(req.user_id))
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return SessionResponse(id=str(session.id), user_id=str(session.user_id), status=session.status)


@router.get("/sessions/{session_id}")
async def get_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    _auth=Depends(require_api_key),
):
    result = await db.execute(
        select(AgentSession).where(AgentSession.id == uuid.UUID(session_id))
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return {
        "id": str(session.id),
        "user_id": str(session.user_id),
        "status": session.status,
        "context": session.context,
        "created_at": session.created_at.isoformat(),
    }


@router.get("/sessions/{session_id}/messages")
async def get_messages(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    _auth=Depends(require_api_key),
):
    result = await db.execute(
        select(Message)
        .where(Message.session_id == uuid.UUID(session_id))
        .order_by(Message.created_at)
    )
    messages = result.scalars().all()
    return [
        {
            "id": str(m.id),
            "role": m.role,
            "content": m.content,
            "metadata": m.metadata_,
            "created_at": m.created_at.isoformat(),
        }
        for m in messages
    ]


@router.get("/sessions/{session_id}/steps")
async def get_steps(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    _auth=Depends(require_api_key),
):
    result = await db.execute(
        select(AgentStep)
        .where(AgentStep.session_id == uuid.UUID(session_id))
        .order_by(AgentStep.created_at)
    )
    steps = result.scalars().all()
    return [
        {
            "id": str(s.id),
            "agent_name": s.agent_name,
            "step_type": s.step_type,
            "tool_name": s.tool_name,
            "input": s.input,
            "output": s.output,
            "duration_ms": s.duration_ms,
            "created_at": s.created_at.isoformat(),
        }
        for s in steps
    ]
