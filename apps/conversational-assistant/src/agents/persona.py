"""Persona loader — domain-specific agent personality from a config file.

The config file defines:
- Brand voice (tone, style, vocabulary)
- Clarifying-question examples a domain expert would ask
- UI hints (title, suggestions, greeting)

This is the ONLY place domain specifics live. To onboard a new deployment
(insurance, wealth, healthcare), drop a new JSON file in `configs/` — no
code changes needed.
"""

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

CONFIGS_DIR = Path(__file__).resolve().parent.parent.parent / "configs"


@lru_cache(maxsize=16)
def load_persona(config_id: str) -> dict[str, Any]:
    """Load a persona config by id (filename without .json)."""
    path = CONFIGS_DIR / f"{config_id}.json"
    if not path.exists():
        raise FileNotFoundError(f"Persona config not found: {path}")
    with open(path) as f:
        return json.load(f)


def render_persona_prompt(config: dict[str, Any]) -> str:
    """Render a persona config as a prompt-ready markdown block.

    The output is appended to the generic framework to produce the final
    system prompt. Only includes domain-specific guidance — NO reasoning
    rules (those live in framework.py).
    """
    persona = config.get("persona", {})
    voice = persona.get("voice", "helpful and professional")
    domain_summary = persona.get("domain_summary", "an assistant service")
    tone_rules = persona.get("tone_rules", [])

    parts: list[str] = []

    # Voice section
    parts.append("# Your Persona")
    parts.append(
        f"You're an AI assistant for {domain_summary}. "
        f"Your voice: {voice}."
    )
    if tone_rules:
        parts.append("\nTone rules:")
        for rule in tone_rules:
            parts.append(f"- {rule}")

    # Clarifying question examples (what a domain expert would ask)
    question_examples = config.get("clarifying_question_examples", {})
    if question_examples:
        parts.append("\n# Good Clarifying Questions (when a project is vague)")
        parts.append("An expert asks just enough to size up the job:")
        for category_name, category_cfg in question_examples.items():
            triggers = category_cfg.get("trigger_examples", [])
            questions = category_cfg.get("questions", [])
            label = category_name.replace("_", " ").title()
            trigger_str = (
                f" ({', '.join(triggers)})" if triggers else ""
            )
            parts.append(f"\n**{label}**{trigger_str}:")
            for q in questions:
                parts.append(f"- {q}")
        parts.append(
            "\n**Ask 2-3 questions, not 10.** Keep it conversational. If the user's "
            "request already gave you enough to act on, skip the questions and execute."
        )

    # Project playbook (authoritative category checklists)
    playbooks = config.get("project_playbooks", {})
    if playbooks:
        parts.append("\n# PROJECT PLAYBOOKS (Authoritative Checklists)")
        parts.append(
            playbooks.get(
                "description",
                "For matching project types, search EVERY listed category — don't skip.",
            )
        )
        for playbook_name, playbook_cfg in playbooks.items():
            if not isinstance(playbook_cfg, dict):
                continue
            if not playbook_cfg.get("categories_to_search"):
                continue
            label = playbook_name.replace("_", " ").title()
            triggers = playbook_cfg.get("trigger_keywords", [])
            trigger_str = (
                f" (trigger keywords: {', '.join(triggers)})" if triggers else ""
            )
            parts.append(f"\n**{label}**{trigger_str}:")
            for cat in playbook_cfg["categories_to_search"]:
                parts.append(f"- {cat}")
        parts.append(
            "\nWhen a project query matches one of these playbooks, search EACH listed "
            "category. Don't cherry-pick. If a category returns nothing, report that in "
            "your response."
        )

    return "\n".join(parts)


def build_system_prompt(framework: str, config: dict[str, Any]) -> str:
    """Combine the generic framework with the domain persona addendum."""
    return framework + "\n\n" + render_persona_prompt(config)
