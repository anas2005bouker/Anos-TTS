-- Anos TTS v3 cleanup and homepage CMS upgrade
-- Run this once in Supabase SQL Editor after uploading the v3 files.

insert into public.site_settings(key, value)
values ('site', '{}'::jsonb)
on conflict (key) do nothing;

update public.site_settings
set value = value || '{
  "brand_name":"Anos TTS",
  "site_domain":"ANOS TTS",
  "support_email":"support@example.com",
  "legal_email":"legal@example.com",
  "home_eyebrow":"تحويل نص عربي إلى صوت",
  "hero_title":"حوّل النص العربي إلى صوت واضح خلال ثوانٍ",
  "hero_subtitle":"اكتب النص، اختر الصوت، ثم حمّل ملف WAV جاهزًا للاستخدام في الفيديوهات والدروس والمحتوى الصوتي.",
  "cta_primary":"ابدأ التحويل الآن",
  "cta_secondary":"استمع للأصوات",
  "home_badge_1_title":"واجهة عربية",
  "home_badge_1_text":"تصميم بسيط وواضح للنص العربي.",
  "home_badge_2_title":"تحميل مباشر",
  "home_badge_2_text":"ملف WAV جاهز بعد التوليد.",
  "home_badge_3_title":"حساب محفوظ",
  "home_badge_3_text":"سجل تحويلاتك داخل حسابك.",
  "feature_1_title":"تحويل سريع",
  "feature_1_text":"انسخ النص العربي وشغّل التحويل بواجهة مباشرة بدون تعقيد.",
  "feature_2_title":"أصوات مرجعية",
  "feature_2_text":"يمكن للمنصة استخدام أصوات مرجعية مرخّصة لإنتاج نبرة مختلفة.",
  "feature_3_title":"خصوصية أوضح",
  "feature_3_text":"صفحات قانونية ونموذج دعم وحساب مستخدم منظم.",
  "home_about_title":"منصة عربية بسيطة لتحويل النص إلى صوت",
  "home_about_text":"Anos TTS يقدّم تجربة مباشرة لإنشاء ملفات صوتية عربية من النصوص، مع لوحة حساب للمستخدم ولوحة إدارة للمحتوى والروابط والإعدادات.",
  "voices_section_title":"الأصوات المتوفرة",
  "voices_section_text":"اختر من الأصوات المتاحة في الموقع. كل صوت يجب أن يكون مرتبطًا بملف صوت مرجعي مرخّص.",
  "social_section_title":"تابعنا",
  "social_section_text":"روابطنا الرسمية تظهر هنا كأيقونات فقط.",
  "max_chars_guest":300,
  "max_chars_user":2500,
  "maintenance_mode":false,
  "announcement":"",
  "free_plan_title":"الخطة المجانية",
  "free_plan_description":"تحويل النصوص العربية إلى ملف WAV ضمن حدود استخدام عادلة.",
  "donation_enabled":true,
  "donation_amount":5,
  "donation_currency":"USD",
  "donation_provider":"PayPal",
  "donation_url":"https://www.paypal.com/",
  "donation_button_text":"تبرع بـ 5 دولار",
  "donation_description":"تبرع اختياري لدعم استمرار الخدمة وتطويرها.",
  "footer_summary":"منصة عربية لتحويل النص إلى كلام بواجهة واضحة وحسابات مستخدمين وإدارة محتوى قابلة للتخصيص."
}'::jsonb,
updated_at = now()
where key = 'site';

-- Keep only real default voice visible unless you add real WAV files.
update public.voice_presets
set is_active = false
where coalesce(model_voice_id, '') not in ('default', 'default.wav');

insert into public.voice_presets(name, language, accent, description, model_voice_id, sample_text, sort_order, is_active)
values ('الصوت الأساسي', 'ar', 'عربي عام', 'الصوت الافتراضي المتاح حاليًا.', 'default', 'مرحبًا، هذه تجربة قصيرة للصوت العربي.', 1, true)
on conflict do nothing;

-- Replace public legal/support pages with clean user-facing pages.
insert into public.legal_pages(slug, title, body, sort_order) values
('about','من نحن','Anos TTS منصة عربية لتحويل النص إلى كلام، تهدف إلى تقديم تجربة بسيطة وواضحة لإنشاء ملفات صوتية من النصوص العربية.',1),
('support','الدعم','يمكنك إرسال طلب دعم من صفحة الدعم، وسنراجع الرسالة في أقرب وقت ممكن.',2),
('terms','شروط الاستخدام','باستخدامك للموقع، توافق على استخدام الخدمة بطريقة قانونية وعدم إنشاء محتوى مضلل أو منتحل أو مخالف.',3),
('privacy','سياسة الخصوصية','نستخدم بيانات الحساب وطلبات التحويل لتشغيل الخدمة وتحسينها. لا نبيع بيانات المستخدمين.',4),
('disclaimer','إخلاء المسؤولية','المخرجات الصوتية قد تحتوي على أخطاء في النطق أو القراءة. يجب مراجعة الملف الصوتي قبل نشره أو استخدامه.',5),
('voice-policy','سياسة الأصوات','لا يسمح باستخدام صوت شخص حقيقي دون إذن صريح منه. يتحمل المستخدم مسؤولية امتلاك حقوق استخدام أي صوت مرجعي.',6),
('cookies','سياسة الكوكيز','نستخدم ملفات كوكيز ضرورية لتسجيل الدخول والأمان وتحسين تجربة الاستخدام.',7),
('dmca','DMCA وطلبات الإزالة','يمكن لأصحاب الحقوق إرسال بلاغات إزالة عبر البريد القانوني، وستتم مراجعة البلاغات واتخاذ الإجراء المناسب.',8)
on conflict (slug) do update set title = excluded.title, body = excluded.body, sort_order = excluded.sort_order, updated_at = now();

-- Normalize social icon names; links remain editable in Admin.
update public.social_links set icon = lower(coalesce(icon, platform, 'website'));
