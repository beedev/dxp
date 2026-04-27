"""search_kb — reads kbgen's kb.chunk + kb.article via pgvector cosine similarity.

kbgen writes these tables; the assistant reads them to answer user questions
about the knowledge base. Vector space is shared (OpenAI text-embedding-3-small
1536-dim) so the same embeddings flow through both services.
"""

from __future__ import annotations

from typing import Any

from sqlalchemy import text

from src.agents.tools.search import get_embedding
from src.db.session import async_session_factory


async def search_kb(
    query: str,
    *,
    category: str | None = None,
    limit: int = 10,
) -> list[dict[str, Any]]:
    """Return the top-k KB chunks whose embeddings best match `query`.

    Results are grouped to the best chunk per article (DISTINCT ON) and ordered
    by relevance. Only PUSHED/IMPORTED/APPROVED articles are visible — drafts
    in review stay hidden from end-user chat.
    """
    if not query.strip():
        return []

    vec = await get_embedding(query)
    vec_literal = "[" + ",".join(f"{v:.7f}" for v in vec) + "]"

    where_extra = ""
    params: dict[str, Any] = {"limit": limit}
    if category:
        where_extra = " AND a.category = :category"
        params["category"] = category

    sql = text(
        f"""
        SELECT * FROM (
            SELECT DISTINCT ON (c.article_id)
                c.id            AS chunk_id,
                c.article_id    AS article_id,
                c.content       AS preview,
                1 - (c.embedding <=> '{vec_literal}'::vector) AS relevance,
                a.title, a.category, a.source_ticket_id, a.itsm_kb_id, a.status
            FROM kb.chunk c
            JOIN kb.article a ON a.id = c.article_id
            WHERE a.status IN ('PUSHED','IMPORTED','APPROVED')
            {where_extra}
            ORDER BY c.article_id, c.embedding <=> '{vec_literal}'::vector
        ) t
        ORDER BY t.relevance DESC
        LIMIT :limit
        """
    )

    async with async_session_factory() as session:
        result = await session.execute(sql, params)
        rows = result.mappings().all()

    return [
        {
            "article_id": str(r["article_id"]),
            "chunk_id": str(r["chunk_id"]),
            "title": r["title"],
            "category": r["category"],
            "preview": _snip(r["preview"]),
            "relevance": float(r["relevance"]),
            "source_ticket_id": r["source_ticket_id"],
            "itsm_kb_id": r["itsm_kb_id"],
            "status": r["status"],
        }
        for r in rows
    ]


def _snip(s: str, max_len: int = 400) -> str:
    t = (s or "").strip().replace("\n", " ")
    return t if len(t) <= max_len else t[: max_len - 1].rstrip() + "…"
