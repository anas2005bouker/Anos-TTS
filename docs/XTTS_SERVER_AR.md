# ربط XTTS-v2

الموقع لا يشغل XTTS-v2 داخل Netlify. السبب أن النموذج ثقيل ويحتاج Python وPyTorch وقد يحتاج GPU، بينما Netlify Functions مخصصة للوظائف الخفيفة.

المسار الصحيح:

```txt
الموقع على Netlify
↓
/api/generate-tts
↓
XTTS_API_URL
↓
خادم XTTS-v2 خارجي
```

## شكل الطلب المتوقع

Netlify Function ترسل JSON:

```json
{
  "text": "مرحبا",
  "language": "ar",
  "voice_id": "default_female_ar",
  "speed": 1,
  "format": "wav"
}
```

## شكل الرد المقبول

إما ملف صوت binary مباشرة:

```txt
Content-Type: audio/wav
```

أو JSON:

```json
{
  "audio_base64": "..."
}
```

## مثال الخادم

انظر مجلد:

```txt
xtts-server/
```

هذا مثال مبدئي ويحتاج خادم مناسب وذاكرة كافية.
