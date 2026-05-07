# النشر من المتصفح فقط - بدون تشغيل محلي

هذا هو المسار الذي تحتاجه فعليًا:

1. GitHub للموقع.
2. Supabase لقاعدة البيانات وتسجيل الدخول.
3. Netlify لنشر الواجهة والـ Functions.
4. Hugging Face Space أو خادم خارجي لتشغيل XTTS-v2.

## لماذا يوجد XTTS_API_URL؟

XTTS-v2 ليس ملف JavaScript ولا يعمل داخل Supabase أو Netlify كواجهة فقط. هو نموذج Python كبير يحتاج خادمًا منفصلًا. لذلك الموقع يتصل بهذا الخادم عبر رابط API.

قيمة `XTTS_API_URL` هي الرابط النهائي لهذا الخادم، مثل:

```txt
https://USERNAME-sawti-xtts.hf.space/tts
```

لا تحصل على هذا الرابط من Supabase. تحصل عليه بعد نشر مجلد `hf-space` كـ Hugging Face Space.

## رفع الموقع إلى GitHub من الصفحة التي أنت فيها

1. افتح ملف ZIP على جهازك وفك الضغط.
2. ادخل داخل المجلد الناتج، وليس المجلد الأب.
3. في GitHub، من صفحة المستودع الفارغ اضغط `uploading an existing file`.
4. اسحب كل الملفات والمجلدات إلى الصفحة:
   - src
   - public
   - netlify
   - supabase
   - hf-space
   - package.json
   - netlify.toml
   - index.html
   - vite.config.js
   - README_AR.md
5. اكتب رسالة Commit مثل: `Initial Sawti AI project`.
6. اضغط `Commit changes`.

## نشر XTTS-v2 على Hugging Face Space للحصول على XTTS_API_URL

1. افتح huggingface.co وسجل الدخول.
2. اختر `New Space`.
3. الاسم المقترح: `sawti-xtts`.
4. اختر SDK: `Docker`.
5. اجعل Space عامًا أو خاصًا حسب رغبتك.
6. بعد إنشاء Space، ارفع محتويات مجلد `hf-space` فقط إلى Space.
7. ارفع ملف صوت مرجعي مرخّص باسم `speakers/default.wav`.
8. من Settings داخل Space أضف Secret اختياري:

```txt
XTTS_SERVER_API_KEY=اكتب_كلمة_سر_طويلة
```

9. انتظر حتى ينتهي Build.
10. افتح:

```txt
https://USERNAME-sawti-xtts.hf.space/health
```

إذا رأيت JSON وفيه `has_default_speaker: true` فالخادم جاهز.

11. رابط الموقع الذي تضعه في Netlify هو:

```txt
XTTS_API_URL=https://USERNAME-sawti-xtts.hf.space/tts
XTTS_API_KEY=نفس_قيمة_XTTS_SERVER_API_KEY
```

## نشر الموقع على Netlify

1. افتح Netlify.
2. Add new site.
3. Import from GitHub.
4. اختر مستودع الموقع.
5. Netlify سيقرأ `netlify.toml` تلقائيًا.
6. أضف المتغيرات:

```txt
VITE_SUPABASE_URL=من Supabase Project URL
VITE_SUPABASE_ANON_KEY=من Supabase anon/publishable key
SUPABASE_SERVICE_ROLE_KEY=من Supabase service_role/secret key
VITE_PUBLIC_SITE_URL=https://YOUR-SITE.netlify.app
XTTS_API_URL=https://USERNAME-sawti-xtts.hf.space/tts
XTTS_API_KEY=نفس سر XTTS إن وضعته
ALLOW_DEMO_MODE=false
ADMIN_BOOTSTRAP_TOKEN=اكتب_كلمة_سر_مؤقتة
```

7. اضغط Deploy.

## جعل حسابك Admin

1. افتح موقعك المنشور.
2. افتح `/#dashboard` وأنشئ حسابًا.
3. من Supabase SQL Editor افتح `supabase/make_admin.sql`.
4. بدّل البريد ببريد حسابك.
5. شغّل SQL.
6. افتح `/#admin`.

## ملاحظات مهمة جدًا

- لا تضع `SUPABASE_SERVICE_ROLE_KEY` في الكود أبدًا. فقط في Netlify Environment Variables.
- لا تضع صوت شخص حقيقي في `speakers/default.wav` بدون إذنه.
- لو لم ترفع `default.wav` لن يستطيع XTTS توليد صوت، لأن XTTS-v2 يحتاج صوتًا مرجعيًا.
- إن كان Hugging Face Space على CPU مجانيًا فقد يكون بطيئًا. للتجربة يكفي، لكن للمنتج الجاد تحتاج GPU أو خادم أقوى.
