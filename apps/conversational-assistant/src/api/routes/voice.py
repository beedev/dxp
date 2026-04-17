"""Voice I/O — Whisper transcription + OpenAI TTS.

POST /api/voice/transcribe
    multipart file (audio/webm, audio/wav, audio/mp3, audio/mp4, audio/ogg)
    → { text: "transcribed text" }

POST /api/voice/synthesize
    { text: "...", voice?: "alloy|echo|fable|onyx|nova|shimmer" }
    → audio/mpeg binary stream

Uses OpenAI's Whisper-1 model for STT and TTS-1 for synthesis.
"""

import io

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from openai import AsyncOpenAI
from pydantic import BaseModel

from src.config import settings

router = APIRouter()

# Accept the set of audio MIME types browsers commonly record as
ALLOWED_AUDIO_PREFIXES = ("audio/",)
MAX_AUDIO_BYTES = 25 * 1024 * 1024  # 25 MB (Whisper's limit)

# Voices OpenAI TTS currently supports
TTS_VOICES = {"alloy", "echo", "fable", "onyx", "nova", "shimmer"}


@router.post("/api/voice/transcribe")
async def transcribe(
    file: UploadFile = File(...),
    language: str | None = Form(default=None),
) -> dict:
    """Transcribe an uploaded audio clip using Whisper."""
    if not any(
        (file.content_type or "").startswith(p) for p in ALLOWED_AUDIO_PREFIXES
    ):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported audio type: {file.content_type}",
        )

    data = await file.read()
    if len(data) > MAX_AUDIO_BYTES:
        raise HTTPException(status_code=400, detail="Audio too large (max 25MB)")

    client = AsyncOpenAI(api_key=settings.openai_api_key)
    # The Python SDK wants a file-like object with a `.name` attribute for the
    # multipart upload to infer format.
    bio = io.BytesIO(data)
    # Use the original filename; if missing, pick an extension based on mime
    bio.name = file.filename or f"audio.{(file.content_type or 'webm').split('/')[-1]}"

    kwargs: dict = {"model": "whisper-1", "file": bio}
    if language:
        kwargs["language"] = language

    try:
        resp = await client.audio.transcriptions.create(**kwargs)
        return {"text": resp.text}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Transcription failed: {str(e)[:200]}"
        )


class SynthesizeRequest(BaseModel):
    text: str
    voice: str = "nova"


@router.post("/api/voice/synthesize")
async def synthesize(req: SynthesizeRequest) -> StreamingResponse:
    """Convert text to speech using OpenAI TTS. Returns MP3 audio stream."""
    text = (req.text or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="text is required")
    if len(text) > 4096:
        text = text[:4096]

    voice = req.voice if req.voice in TTS_VOICES else "nova"

    client = AsyncOpenAI(api_key=settings.openai_api_key)
    try:
        resp = await client.audio.speech.create(
            model="tts-1",
            voice=voice,
            input=text,
            response_format="mp3",
        )
        audio_bytes = resp.content
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"TTS failed: {str(e)[:200]}"
        )

    return StreamingResponse(
        iter([audio_bytes]),
        media_type="audio/mpeg",
        headers={"Content-Disposition": 'inline; filename="speech.mp3"'},
    )
