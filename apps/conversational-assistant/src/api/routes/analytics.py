"""Analytics dashboard endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.models import AgentSession, AgentStep, Order, Message
from src.db.session import get_db

router = APIRouter()


@router.get("/analytics/dashboard")
async def get_dashboard(db: AsyncSession = Depends(get_db)):
    """Agent performance metrics for the analytics dashboard."""
    # Total sessions
    sessions_result = await db.execute(select(func.count(AgentSession.id)))
    total_sessions = sessions_result.scalar() or 0

    # Completed orders
    orders_result = await db.execute(select(func.count(Order.id)))
    total_orders = orders_result.scalar() or 0

    # Average steps per session
    steps_result = await db.execute(
        select(func.count(AgentStep.id)).group_by(AgentStep.session_id)
    )
    step_counts = steps_result.scalars().all()
    avg_steps = sum(step_counts) / len(step_counts) if step_counts else 0

    # Average agent step duration
    duration_result = await db.execute(
        select(func.avg(AgentStep.duration_ms)).where(AgentStep.duration_ms.isnot(None))
    )
    avg_duration = duration_result.scalar() or 0

    # Tool usage distribution
    tool_result = await db.execute(
        select(AgentStep.tool_name, func.count(AgentStep.id))
        .where(AgentStep.tool_name.isnot(None))
        .group_by(AgentStep.tool_name)
        .order_by(func.count(AgentStep.id).desc())
    )
    tool_usage = {row[0]: row[1] for row in tool_result.all()}

    # Agent usage distribution
    agent_result = await db.execute(
        select(AgentStep.agent_name, func.count(AgentStep.id))
        .group_by(AgentStep.agent_name)
        .order_by(func.count(AgentStep.id).desc())
    )
    agent_usage = {row[0]: row[1] for row in agent_result.all()}

    # Conversion rate
    conversion_rate = (total_orders / total_sessions * 100) if total_sessions > 0 else 0

    return {
        "total_sessions": total_sessions,
        "total_orders": total_orders,
        "conversion_rate": round(conversion_rate, 1),
        "avg_steps_per_session": round(avg_steps, 1),
        "avg_step_duration_ms": round(avg_duration, 1),
        "tool_usage": tool_usage,
        "agent_usage": agent_usage,
    }
