"""Upload endpoint — accept files from the portal, store on disk, register
with session for the agent to reference via analyze_upload.
"""

import uuid
from pathlib import Path

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from src.agents.react_tools import SESSION_UPLOADS

router = APIRouter()

UPLOAD_ROOT = Path("/tmp/agentic_uploads")
UPLOAD_ROOT.mkdir(parents=True, exist_ok=True)

ALLOWED_MIME_PREFIXES = ("image/", "application/pdf")
MAX_BYTES = 10 * 1024 * 1024  # 10 MB


@router.post("/api/uploads")
async def upload_file(
    session_id: str = Form(...),
    file: UploadFile = File(...),
) -> dict:
    """Accept a file upload for a session.

    Returns file metadata including a file_id that the agent can reference
    via `analyze_upload`.
    """
    if not any(
        (file.content_type or "").startswith(p) for p in ALLOWED_MIME_PREFIXES
    ):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}. "
            "Supported: images (jpeg/png/webp) and PDFs.",
        )

    # Read into memory (bounded) to enforce size cap
    data = await file.read()
    if len(data) > MAX_BYTES:
        raise HTTPException(status_code=400, detail="File too large (max 10 MB)")

    file_id = str(uuid.uuid4())
    session_dir = UPLOAD_ROOT / session_id
    session_dir.mkdir(parents=True, exist_ok=True)

    safe_name = "".join(
        c for c in (file.filename or "upload") if c.isalnum() or c in "._- "
    )[:80] or "upload"
    dest = session_dir / f"{file_id}_{safe_name}"
    with open(dest, "wb") as f:
        f.write(data)

    record = {
        "id": file_id,
        "filename": file.filename or safe_name,
        "mime_type": file.content_type,
        "size": len(data),
        "path": str(dest),
        "analyzed": False,
        "analysis": "",
    }
    SESSION_UPLOADS.setdefault(session_id, []).append(record)

    # Client-safe subset (don't expose disk path)
    return {
        "id": file_id,
        "filename": record["filename"],
        "mime_type": record["mime_type"],
        "size": record["size"],
    }


@router.delete("/api/uploads/{file_id}")
async def delete_upload(file_id: str, session_id: str) -> dict:
    """Remove an upload from the session."""
    uploads = SESSION_UPLOADS.get(session_id, [])
    record = next((u for u in uploads if u.get("id") == file_id), None)
    if not record:
        raise HTTPException(status_code=404, detail="Upload not found")

    # Remove from disk and session list
    try:
        Path(record["path"]).unlink(missing_ok=True)
    except Exception:
        pass
    SESSION_UPLOADS[session_id] = [u for u in uploads if u.get("id") != file_id]
    return {"ok": True, "file_id": file_id}


@router.get("/api/uploads")
async def list_uploads(session_id: str) -> dict:
    """List uploads for a session (for UI rehydration)."""
    uploads = SESSION_UPLOADS.get(session_id, [])
    return {
        "uploads": [
            {
                "id": u["id"],
                "filename": u["filename"],
                "mime_type": u["mime_type"],
                "size": u["size"],
                "analyzed": u.get("analyzed", False),
            }
            for u in uploads
        ]
    }
