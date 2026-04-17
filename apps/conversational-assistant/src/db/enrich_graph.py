"""Graph enrichment — STUBBED (Apache AGE removed).

AGE has been removed to simplify deployment. The run() entry point is
kept so callers (setup.sh, scripts) don't break.

Usage:
    python -m src.db.enrich_graph
"""

import asyncio


async def run() -> None:
    print("Graph enrichment skipped (AGE not enabled)")


if __name__ == "__main__":
    asyncio.run(run())
