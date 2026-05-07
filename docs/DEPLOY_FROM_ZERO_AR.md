# النشر من الصفر بدون تشغيل محلي

## المرحلة 1: Supabase

1. ادخل إلى Supabase وأنشئ مشروعًا جديدًا.
2. من Project Settings > API انسخ:
   - Project URL
   - anon public key
   - service_role key
3. افتح SQL Editor.
4. افتح ملف `supabase/schema.sql` من هذا المشروع.
5. انسخ كل محتواه وشغله.

هذا ينشئ الجداول والسياسات والتخزين والبيانات الأولية.

## المرحلة 2: GitHub من المتصفح

1. افتح GitHub.
2. أنشئ Repository جديدًا.
3. ارفع كل ملفات المشروع إليه.
4. لا ترفع أي ملف يحتوي أسرارًا حقيقية.
5. ملف `.env.example` مجرد مثال وليس أسرارًا.

## المرحلة 3: Netlify

1. افتح Netlify.
2. Add new site.
3. Import an existing project.
4. اختر GitHub ثم المستودع.
5. لا تحتاج غالبًا لتعديل Build command أو Publish directory لأن `netlify.toml` موجود.
6. أضف Environment Variables.
7. Deploy.

## المرحلة 4: جعل حسابك Admin

1. افتح الموقع المنشور.
2. ادخل إلى `/#dashboard`.
3. أنشئ حسابًا ببريدك.
4. ارجع إلى Supabase SQL Editor.
5. افتح `supabase/make_admin.sql`.
6. استبدل `YOUR_EMAIL_HERE@example.com` ببريدك.
7. شغل الملف.
8. ارجع للموقع وافتح `/#admin`.

## المرحلة 5: ربط الصوت الحقيقي

1. شغل خادم XTTS-v2 خارجيًا.
2. تأكد أنه يستقبل POST JSON ويرجع ملف صوت أو base64.
3. ضع الرابط في Netlify:

```txt
XTTS_API_URL=https://YOUR_XTTS_SERVER/tts
```

4. أعد Deploy.
5. جرّب من `/#studio`.
