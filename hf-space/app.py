import os
import shutil
import base64
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

os.environ["COQUI_TOS_AGREED"] = "1"
MODEL_NAME = os.getenv("XTTS_MODEL", "tts_models/multilingual/multi-dataset/xtts_v2")
USE_GPU = os.getenv("USE_GPU", "false").lower() in {"1", "true", "yes", "on"}
SPEAKER_DIR = Path(os.getenv("SPEAKER_WAV_DIR", "/app/speakers"))
DEFAULT_SPEAKER = SPEAKER_DIR / "default.wav"

os.environ.setdefault("TTS_HOME", "/tmp/coqui-tts-cache")
os.environ.setdefault("XDG_DATA_HOME", "/tmp/coqui-data")
os.environ.setdefault("HF_HOME", "/tmp/huggingface")
os.environ.setdefault("TRANSFORMERS_CACHE", "/tmp/huggingface/transformers")

app = FastAPI(title="Sawti XTTS API", version="1.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

tts_model = None
last_error = None

class TTSRequest(BaseModel):
    text: str
    language: str = "ar"
    voice_id: str = "default"
    speed: float = 1.0
    format: str = "wav"
    return_base64: bool = True


def wipe_model_cache():
    for p in [
        "/tmp/coqui-tts-cache",
        "/tmp/coqui-data",
        "/tmp/huggingface",
        "/root/.local/share/tts",
        "/root/.cache/huggingface",
        "/home/user/.local/share/tts",
        "/home/user/.cache/huggingface",
    ]:
        try:
            if os.path.exists(p):
                shutil.rmtree(p, ignore_errors=True)
        except Exception:
            pass


def load_model(force_clean: bool = False):
    global tts_model, last_error
    if tts_model is not None:
        return tts_model
    if force_clean:
        wipe_model_cache()
    try:
        from TTS.api import TTS
        tts_model = TTS(MODEL_NAME, gpu=USE_GPU)
        last_error = None
        return tts_model
    except Exception as e:
        last_error = str(e)
        bad_cache_markers = ["PytorchStreamReader failed", "invalid header", "archive is corrupted", "failed reading file", "checkpoint"]
        if not force_clean and any(marker.lower() in str(e).lower() for marker in bad_cache_markers):
            wipe_model_cache()
            try:
                from TTS.api import TTS
                tts_model = TTS(MODEL_NAME, gpu=USE_GPU)
                last_error = None
                return tts_model
            except Exception as e2:
                last_error = str(e2)
                raise e2
        raise e


def normalize_voice_id(voice_id: str) -> str:
    raw = (voice_id or "default").strip().replace(".wav", "")
    safe = "".join(ch for ch in raw if ch.isalnum() or ch in {"_", "-"})
    return safe or "default"


def speaker_path(voice_id: str) -> Path:
    safe = normalize_voice_id(voice_id)
    candidate = SPEAKER_DIR / f"{safe}.wav"
    if candidate.exists():
        return candidate
    if DEFAULT_SPEAKER.exists():
        return DEFAULT_SPEAKER
    raise HTTPException(status_code=500, detail="No speaker WAV found. Add speakers/default.wav to the Space.")


def check_key(authorization: Optional[str]):
    api_key = os.getenv("XTTS_SERVER_API_KEY")
    if api_key and authorization != f"Bearer {api_key}":
        raise HTTPException(status_code=401, detail="Unauthorized")


@app.get("/")
def root():
    return {"ok": True, "service": "Sawti XTTS API", "docs": "/docs"}


@app.get("/health")
def health():
    return {
        "ok": last_error is None,
        "model": MODEL_NAME,
        "gpu": USE_GPU,
        "speaker_dir": str(SPEAKER_DIR),
        "available_voices": sorted([p.stem for p in SPEAKER_DIR.glob("*.wav")]),
        "has_default_speaker": DEFAULT_SPEAKER.exists(),
        "model_loaded": tts_model is not None,
        "error": last_error,
    }


@app.post("/reload")
def reload_model(authorization: Optional[str] = Header(None)):
    global tts_model, last_error
    check_key(authorization)
    tts_model = None
    last_error = None
    wipe_model_cache()
    try:
        load_model(force_clean=True)
        return {"ok": True, "message": "Model cache wiped and model reloaded"}
    except Exception as e:
        last_error = str(e)
        raise HTTPException(status_code=500, detail=f"Reload failed: {e}")


@app.post("/tts")
def tts(req: TTSRequest, authorization: Optional[str] = Header(None)):
    check_key(authorization)
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Text is required")
    if len(req.text) > 2500:
        raise HTTPException(status_code=400, detail="Text is too long")
    if req.language.lower() not in {"ar", "en", "fr", "de", "es", "it", "pt", "pl", "tr", "ru", "nl", "cs", "zh-cn", "ja", "ko", "hu", "hi"}:
        raise HTTPException(status_code=400, detail="Unsupported language for XTTS-v2")
    try:
        model = load_model()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load XTTS model: {e}")
    spk = speaker_path(req.voice_id)
    output_path = "/tmp/sawti_output.wav"
    try:
        model.tts_to_file(
            text=req.text.strip(),
            speaker_wav=str(spk),
            language=req.language or "ar",
            file_path=output_path,
            speed=float(req.speed or 1.0),
            split_sentences=True,
        )
        audio_bytes = Path(output_path).read_bytes()
        return JSONResponse({
            "ok": True,
            "format": "wav",
            "voice_id": normalize_voice_id(req.voice_id),
            "content_type": "audio/wav",
            "audio_base64": base64.b64encode(audio_bytes).decode("utf-8"),
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"XTTS generation failed: {e}")
