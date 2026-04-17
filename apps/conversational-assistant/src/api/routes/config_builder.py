"""Config Builder — LLM-powered agent configuration generator.

POST /api/agent-configs/generate
    { description: "I need an agent for a pet supply store..." }
    → { config: { ...generated JSON config... } }

POST /api/agent-configs/save
    { config: { ...edited config... } }
    → { id: "pet-supply", saved: true }

The LLM reads the user's natural-language description and produces a
complete persona config (voice, clarifiers, playbooks, UI hints) that
matches the format our framework expects.
"""

import json
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from openai import AsyncOpenAI
from pydantic import BaseModel

from src.api.security import require_admin_key
from src.config import settings

router = APIRouter()

CONFIGS_DIR = Path(__file__).resolve().parent.parent.parent.parent / "configs"


# ── Example config for the LLM to learn from ───────────────────────────────

EXAMPLE_CONFIG = {
    "id": "example-retail",
    "name": "Example Shopping Assistant",
    "persona": {
        "domain_summary": "a retail store",
        "voice": "friendly, knowledgeable, practical",
        "tone_rules": [
            "Be concrete with product names and prices",
            "Ask before acting on anything irreversible",
        ],
    },
    "clarifying_question_examples": {
        "general_shopping": {
            "trigger_examples": ["find", "need", "looking for"],
            "questions": [
                "What specific type are you looking for?",
                "Do you have a budget in mind?",
                "Any brand preferences?",
            ],
        }
    },
    "project_playbooks": {
        "description": "For matching project types, search EVERY listed category.",
        "example_project": {
            "trigger_keywords": ["project", "setup"],
            "categories_to_search": [
                "primary item",
                "accessories",
                "tools needed",
                "safety gear",
            ],
        },
    },
    "ui": {
        "title": "AI Assistant",
        "subtitle": "I help you find what you need",
        "greeting": "How can I help you today?",
        "greeting_subtitle": "Tell me what you're looking for",
        "suggestions": [
            "Find me a product",
            "Help me with a project",
            "What deals are available?",
        ],
    },
}


GENERATION_PROMPT = """You are a configuration expert for an AI shopping/service assistant platform.

Given a user's natural-language description of their business and what they want their
AI assistant to do, generate a complete JSON configuration file.

The configuration must follow this EXACT structure (study the example carefully):

```json
{example}
```

RULES:
1. The "id" should be a lowercase-kebab-case slug derived from the business name
2. "persona.domain_summary" is one short sentence describing the business
3. "persona.voice" describes the brand personality in 5-15 words
4. "persona.tone_rules" are 3-6 concrete behavioral rules
5. "clarifying_question_examples" should have 2-5 scenario categories, each with:
   - trigger_examples: 3-5 keywords that signal this scenario
   - questions: 2-4 focused clarifying questions an expert would ask
6. "project_playbooks" should have 2-4 common project/workflow types, each with:
   - trigger_keywords: 3-5 keywords
   - categories_to_search: 5-12 specific categories/items to search for
7. "ui.suggestions" should have 4-6 compelling starter prompts relevant to the domain
8. Be SPECIFIC to the domain — not generic. A pet store should mention breeds, ages,
   health conditions. An electronics store should mention specs, compatibility, warranties.
9. Include a "domain_tags" array with 2-4 lowercase tags describing the vertical
   (e.g., ["retail", "hardware", "diy"] or ["insurance", "claims"]).

Return ONLY the JSON object, no markdown code fences, no explanation.
""".format(example=json.dumps(EXAMPLE_CONFIG, indent=2))


DOMAIN_SCOPING_PROMPT = """
IMPORTANT CONSTRAINT: This configuration is for a portal in the "{domain}" domain.
The generated config MUST be relevant to this domain. If the user's description
mentions a completely different vertical (e.g., "insurance" on a retail portal),
generate a config that stays within the "{domain}" domain and politely note in
the persona that it focuses on {domain}-related topics.

The "domain_tags" field MUST include "{domain}" as one of its tags.
"""


class GenerateRequest(BaseModel):
    description: str
    portal_domain: str = "retail"


class SaveRequest(BaseModel):
    config: dict
    portal_domain: str = "retail"


@router.post("/api/agent-configs/generate")
async def generate_config(req: GenerateRequest, _auth=Depends(require_admin_key)) -> dict:
    """Use the LLM to generate a persona config scoped to the portal's domain."""
    desc = (req.description or "").strip()
    if not desc:
        raise HTTPException(status_code=400, detail="description is required")
    if len(desc) > 5000:
        desc = desc[:5000]

    domain = req.portal_domain or "retail"

    client = AsyncOpenAI(api_key=settings.openai_api_key)
    try:
        resp = await client.chat.completions.create(
            model=settings.llm_model,
            messages=[
                {"role": "system", "content": GENERATION_PROMPT + DOMAIN_SCOPING_PROMPT.format(domain=domain)},
                {"role": "user", "content": desc},
            ],
            temperature=0.3,
            max_tokens=4000,
        )
        raw = resp.choices[0].message.content or ""
        # Strip markdown fences if the LLM added them
        raw = raw.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.strip()
        if raw.endswith("```"):
            raw = raw[:-3].strip()

        config = json.loads(raw)
        return {"config": config}
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=500,
            detail=f"LLM returned invalid JSON: {str(e)[:200]}. Raw: {raw[:500]}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Generation failed: {str(e)[:200]}"
        )


@router.post("/api/agent-configs/save")
async def save_config(req: SaveRequest, _auth=Depends(require_admin_key)) -> dict:
    """Save a generated/edited config to the configs directory."""
    config = req.config
    config_id = config.get("id")
    if not config_id or not isinstance(config_id, str):
        raise HTTPException(status_code=400, detail="config must have an 'id' field")

    # Ensure domain_tags include the portal's domain
    domain = req.portal_domain or "retail"
    tags = config.get("domain_tags", [])
    if domain not in tags:
        tags.append(domain)
        config["domain_tags"] = tags

    # Sanitize id for filename
    safe_id = "".join(c for c in config_id if c.isalnum() or c in "-_").lower()
    if not safe_id:
        raise HTTPException(status_code=400, detail="invalid config id")

    path = CONFIGS_DIR / f"{safe_id}.json"
    CONFIGS_DIR.mkdir(parents=True, exist_ok=True)

    with open(path, "w") as f:
        json.dump(config, f, indent=2)

    return {"id": safe_id, "saved": True, "path": str(path)}
