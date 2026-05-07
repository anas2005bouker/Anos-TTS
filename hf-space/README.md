---
title: Sawti XTTS API
emoji: 🎙️
colorFrom: indigo
colorTo: blue
sdk: docker
app_port: 7860
pinned: false
---

# Sawti XTTS API

FastAPI endpoint for the Netlify site.

Endpoint:

- `GET /health`
- `POST /tts`

Required secret/variable:

- `XTTS_SERVER_API_KEY` optional, put the same value in Netlify as `XTTS_API_KEY`.

Important: add at least one licensed speaker sample as `speakers/default.wav` or upload it to the Space repo. XTTS-v2 needs a speaker reference voice.
