# صوتي AI - نسخة Netlify + Supabase + XTTS

موقع عربي لتحويل النص إلى كلام باستخدام خادم XTTS-v2 خارجي، مع لوحة إدارة كاملة.

## النشر السريع

1. ارفع ملفات المشروع إلى GitHub.
2. اربط المستودع مع Netlify.
3. في Supabase نفذ `supabase/schema.sql` إذا كان المشروع جديدًا.
4. إذا كنت حدّثت من نسخة سابقة، نفذ `supabase/upgrade_v2.sql`.
5. في Netlify أضف:

```text
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_XTTS_API_URL=https://anas2005bouker-anostts.hf.space/tts
VITE_PUBLIC_SITE_URL=https://YOUR-SITE.netlify.app
SUPABASE_SERVICE_ROLE_KEY=...
ADMIN_BOOTSTRAP_TOKEN=...
```

## ملاحظات

- الإخراج الحالي WAV فقط.
- تعدد الأصوات يتم برفع ملفات WAV إلى Hugging Face Space داخل `speakers/` ثم ربط اسم الملف من لوحة الإدارة.
- راجع `docs/UPGRADE_V2_AR.md` للتحديثات المهمة.
