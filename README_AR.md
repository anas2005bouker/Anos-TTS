# اقرأ هذا أولًا

إذا كنت تريد النشر من المتصفح بدون تشغيل محلي، ابدأ بهذا الملف:

`docs/DEPLOY_NO_LOCAL_AR.md`

هذا المشروع يحتوي واجهة Netlify + Supabase + لوحة Admin، ويحتوي أيضًا مجلد `hf-space` لتشغيل XTTS-v2 كخادم منفصل حتى تحصل على `XTTS_API_URL`.

---

# صوتي AI - موقع تحويل النص العربي إلى صوت

هذا مشروع جاهز للنشر على Netlify مع Supabase:

- React + Vite
- Netlify Functions
- Supabase Auth
- Supabase Database + RLS
- Supabase Storage
- لوحة مستخدم
- لوحة Admin كاملة
- إدارة روابط مواقع التواصل من لوحة Admin
- إدارة الأصوات والإعدادات والصفحات القانونية والمستخدمين والطلبات
- رابط جاهز مع خادم XTTS-v2 خارجي عبر `XTTS_API_URL`

## المهم جدًا

لا تضع `SUPABASE_SERVICE_ROLE_KEY` داخل ملفات الموقع أو داخل GitHub. ضعها فقط في Netlify Environment Variables.

## أسرع طريق نشر بدون تشغيل محلي

1. أنشئ مشروعًا في Supabase.
2. افتح SQL Editor في Supabase.
3. انسخ محتوى الملف `supabase/schema.sql` كاملًا وشغله مرة واحدة.
4. أنشئ مستودع GitHub جديدًا وارفع ملفات هذا المشروع إليه من واجهة GitHub.
5. افتح Netlify > Add new site > Import an existing project > GitHub.
6. اختر المستودع. الإعدادات موجودة في `netlify.toml` ولن تحتاج غالبًا لتعديل Build settings.
7. أضف Environment Variables في Netlify.
8. اضغط Deploy.
9. افتح الموقع، أنشئ حسابًا ببريدك.
10. ارجع إلى Supabase SQL Editor وشغل `supabase/make_admin.sql` بعد استبدال البريد ببريدك.
11. ارجع للموقع وافتح `/#admin`.

## متغيرات Netlify المطلوبة

ضعها من Netlify > Site configuration > Environment variables:

```txt
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
VITE_PUBLIC_SITE_URL=https://YOUR_SITE.netlify.app
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
XTTS_API_URL=https://YOUR_XTTS_SERVER/tts
XTTS_API_KEY=OPTIONAL_SECRET
ALLOW_DEMO_MODE=true
ADMIN_BOOTSTRAP_TOKEN=CHANGE_THIS_LONG_RANDOM_SECRET
```

`XTTS_API_URL` ليس مطلوبًا لرؤية الموقع ولوحة الإدارة. لكنه مطلوب لتوليد صوت حقيقي.

## أين أعدل روابط التواصل؟

بعد جعل حسابك Admin:

`/#admin` > السوشيال

يمكنك إضافة/حذف روابط X وYouTube وTikTok وLinkedIn وGitHub أو أي منصة أخرى.

## أين أعدل نصوص الموقع؟

`/#admin` > إعدادات الموقع

## أين أعدل الصفحات القانونية؟

`/#admin` > القانوني

## أين أدير المستخدمين؟

`/#admin` > المستخدمون

هذه الصفحة تعمل عبر Netlify Function لأنها تحتاج `SUPABASE_SERVICE_ROLE_KEY` ولا يمكن تنفيذها من المتصفح مباشرة.

## أين أربط XTTS-v2؟

جهز خادم XTTS خارجي يعطي endpoint مثل:

```txt
POST https://YOUR_XTTS_SERVER/tts
```

ثم ضع الرابط في Netlify Environment Variable:

```txt
XTTS_API_URL=https://YOUR_XTTS_SERVER/tts
```

يوجد مثال داخل مجلد `xtts-server`.

## ملاحظات إنتاجية

- Netlify مناسب للواجهة والوظائف الخفيفة، لكنه ليس مكانًا مناسبًا لتشغيل نموذج XTTS-v2 الثقيل نفسه.
- شغل XTTS-v2 على خادم GPU/CPU منفصل، واجعل Netlify Function تتصل به.
- عند الإطلاق الحقيقي اجعل `ALLOW_DEMO_MODE=false`.
- تأكد من وضع ترخيص XTTS-v2 كتابة قبل الاستخدام التجاري.
