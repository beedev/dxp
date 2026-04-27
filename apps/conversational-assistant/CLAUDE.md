# DXP Conversational AI

FastAPI + LangGraph conversational AI backend for DXP portals

## App Registry (auto-managed — do not edit manually)

- **Backend port**: 8002
- **Shared venv**: `~/.appregistry/venvs/ai-full`
- **Activate**: `source ~/.appregistry/venvs/ai-full/bin/activate`
- **Start backend**: `uvicorn src.main:app --host 0.0.0.0 --port {port} --reload`

### Rules for Claude Code
- Do NOT create a project-local venv (no `python -m venv .venv` or `python -m venv venv`)
- Use the shared venv: `source ~/.appregistry/venvs/ai-full/bin/activate`
- Install packages: `source ~/.appregistry/venvs/ai-full/bin/activate && pip install <pkg>`
- Backend server MUST use port **8002**
- Do NOT pick arbitrary port numbers — use the ports listed above

<!-- end-app-registry -->
