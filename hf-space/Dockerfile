FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV COQUI_TOS_AGREED=1
ENV PORT=7860
ENV TTS_HOME=/tmp/coqui-tts-cache
ENV XDG_DATA_HOME=/tmp/coqui-data
ENV HF_HOME=/tmp/huggingface
ENV TRANSFORMERS_CACHE=/tmp/huggingface/transformers

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg espeak-ng libsndfile1 git curl build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && pip install --no-cache-dir -r /app/requirements.txt

COPY app.py /app/app.py
RUN mkdir -p /app/speakers
COPY speakers /app/speakers

EXPOSE 7860
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]
