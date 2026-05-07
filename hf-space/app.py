import base64
import os
import tempfile
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

try:
    from TTS.api import TTS
except Exception as exc:  # shows clearer health error if package/model cannot load
    TTS = None
    IMPORT_ERROR = str(exc)
else:
    IMPORT_ERROR = ""

API_KEY = os.getenv("XTTS_SERVER_API_KEY", "").strip()
MODEL_NAME = os.getenv("XTTS_MODEL", "tts_models/multilingual/multi-dataset/xtts_v2")
USE_GPU = os.getenv("USE_GPU", "false").lower() in {"1", "true", "yes", "on"}
SPEAKER_DIR = Path(os.getenv("SPEAKER_WAV_DIR", "/app/speakers"))
SPEAKER_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="Sawti XTTS API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

_model = None
_model_error: Optional[str] = None

class TTSRequest(BaseModel):
    text: str
    language: str = "ar"
    voice_id: str = "default"
    speed: float = 1.0
    format: str = "wav"
    return_base64: bool = False


def check_key(authorization: Optional[str]) -> None:
    if not API_KEY:
        return
    if authorization != f"Bearer {API_KEY}":
        raise HTTPException(status_code=401, detail="Invalid XTTS API key")


def get_model():
    global _model, _model_error
    if _model is not None:
        return _model
    if TTS is None:
        _model_error = IMPORT_ERROR or "coqui-tts import failed"
        raise HTTPException(status_code=500, detail=_model_error)
    try:
        _model = TTS(MODEL_NAME, gpu=USE_GPU)
        return _model
    except Exception as exc:
        _model_error = str(exc)
        raise HTTPException(status_code=500, detail=f"Failed to load XTTS model: {_model_error}")


def speaker_path(voice_id: str) -> Path:
    safe_voice = "".join(ch for ch in voice_id if ch.isalnum() or ch in {"_", "-"}) or "default"
    candidate = SPEAKER_DIR / f"{safe_voice}.wav"
    if candidate.exists():
        return candidate
    fallback = SPEAKER_DIR / "default.wav"
    if fallback.exists():
        return fallback
    raise HTTPException(
        status_code=400,
        detail="Missing speaker reference. Upload a licensed WAV file as speakers/default.wav or speakers/<voice_id>.wav in the XTTS server/Space.",
    )

@app.get("/")
def root():
    return {"ok": True, "service": "Sawti XTTS API", "docs": "/docs"}

@app.get("/health")
def health():
    return {
        "ok": _model_error is None,
        "model": MODEL_NAME,
        "gpu": USE_GPU,
        "speaker_dir": str(SPEAKER_DIR),
        "has_default_speaker": (SPEAKER_DIR / "default.wav").exists(),
        "model_loaded": _model is not None,
        "error": _model_error,
    }

@app.post("/tts")
def tts(req: TTSRequest, authorization: Optional[str] = Header(default=None)):
    check_key(authorization)
    text = req.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text is required")
    if len(text) > 2500:
        raise HTTPException(status_code=400, detail="Text is too long for this endpoint")
    if req.language.lower() not in {"ar", "en", "fr", "de", "es", "it", "pt", "pl", "tr", "ru", "nl", "cs", "zh-cn", "ja", "ko", "hu", "hi"}:
        raise HTTPException(status_code=400, detail="Unsupported language for XTTS-v2")

    model = get_model()
    spk = speaker_path(req.voice_id)
    out = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
    out.close()

    try:
        model.tts_to_file(
            text=text,
            speaker_wav=str(spk),
            language=req.language,
            file_path=out.name,
            split_sentences=True,
        )
        if req.return_base64:
            data = Path(out.name).read_bytes()
            return JSONResponse({
                "ok": True,
                "content_type": "audio/wav",
                "audio_base64": base64.b64encode(data).decode("ascii"),
            })
        return FileResponse(out.name, media_type="audio/wav", filename="sawti.wav")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"XTTS generation failed: {exc}")
