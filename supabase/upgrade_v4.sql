-- Upgrade v4: full editable site texts
create table if not exists public.site_texts (
  key text primary key,
  section text not null default 'custom',
  label text,
  value text not null default '',
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

alter table public.site_texts enable row level security;

drop policy if exists site_texts_public_select on public.site_texts;
create policy site_texts_public_select on public.site_texts for select to anon, authenticated using (true);

drop policy if exists site_texts_admin_all on public.site_texts;
create policy site_texts_admin_all on public.site_texts for all to authenticated using (public.is_admin()) with check (public.is_admin());

insert into public.site_texts(section, key, label, value)
values
('nav','nav_home','زر القائمة: الرئيسية','الرئيسية'),
('nav','nav_studio','زر القائمة: الاستوديو','الاستوديو'),
('nav','nav_voices','زر القائمة: الأصوات','الأصوات'),
('nav','nav_pricing','زر القائمة: الخطة','الخطة'),
('nav','nav_about','زر القائمة: من نحن','من نحن'),
('nav','nav_contact','زر القائمة: الدعم','الدعم'),
('nav','nav_account','زر القائمة: حسابي','حسابي'),
('nav','nav_admin','زر القائمة: الإدارة','الإدارة'),
('nav','nav_login','زر الدخول','دخول'),
('nav','nav_logout','زر الخروج','خروج'),
('home','home_eyebrow','الرئيسية: الشارة الصغيرة','تحويل النص العربي إلى صوت'),
('home','home_title','الرئيسية: العنوان الرئيسي','حوّل النص العربي إلى ملف صوتي واضح'),
('home','home_subtitle','الرئيسية: الوصف تحت العنوان','اكتب النص العربي، اختر الصوت المتاح، ثم حمّل ملف WAV جاهزًا للاستخدام.'),
('home','home_primary_cta','الرئيسية: زر البدء','ابدأ التحويل الآن'),
('home','home_secondary_cta','الرئيسية: زر الأصوات','عرض الأصوات'),
('home','home_demo_label','الرئيسية: عنوان البطاقة التجريبية','نص تجريبي'),
('home','home_demo_text','الرئيسية: نص البطاقة التجريبية','مرحبًا، هذه تجربة صوتية عربية واضحة.'),
('home','home_demo_button','الرئيسية: زر البطاقة التجريبية','افتح الاستوديو'),
('home','home_features_title','الرئيسية: عنوان المزايا','مزايا الخدمة'),
('home','home_features_subtitle','الرئيسية: وصف المزايا','يمكنك تعديل هذا القسم كاملًا من لوحة الإدارة.'),
('home','home_feature_1_title','الرئيسية: ميزة 1 عنوان','تحويل عربي'),
('home','home_feature_1_text','الرئيسية: ميزة 1 نص','واجهة مخصصة لإدخال النص العربي وتوليد ملف صوتي.'),
('home','home_feature_2_title','الرئيسية: ميزة 2 عنوان','تحميل WAV'),
('home','home_feature_2_text','الرئيسية: ميزة 2 نص','الخادم الحالي يخرج ملف WAV فقط.'),
('home','home_feature_3_title','الرئيسية: ميزة 3 عنوان','حساب مستخدم'),
('home','home_feature_3_text','الرئيسية: ميزة 3 نص','تسجيل دخول وحساب شخصي وسجل تحويلات عند الربط.'),
('home','home_about_title','الرئيسية: عنوان التعريف','خدمة عربية بسيطة وواضحة'),
('home','home_about_text','الرئيسية: نص التعريف','اكتب هنا وصفك الحقيقي للموقع وخدمتك ورسالتك للمستخدمين.'),
('home','home_social_title','الرئيسية: عنوان التواصل','تابعنا'),
('home','home_social_text','الرئيسية: نص التواصل','روابط التواصل تظهر كأيقونات فقط ويمكن تعديلها من لوحة الإدارة.'),
('studio','studio_title','الاستوديو: العنوان','استوديو التحويل'),
('studio','studio_subtitle','الاستوديو: الوصف','أدخل النص واختر الصوت ثم حمّل الملف الصوتي.'),
('studio','studio_text_label','الاستوديو: عنوان حقل النص','النص العربي'),
('studio','studio_placeholder','الاستوديو: النص الافتراضي','مرحبًا، هذه تجربة قصيرة للصوت العربي.'),
('studio','studio_voice_label','الاستوديو: اختيار الصوت','الصوت'),
('studio','studio_speed_label','الاستوديو: السرعة','السرعة'),
('studio','studio_format_label','الاستوديو: الصيغة','الصيغة'),
('studio','studio_generate_button','الاستوديو: زر التوليد','توليد وتحميل WAV'),
('studio','studio_generating','الاستوديو: أثناء التوليد','جاري التوليد...'),
('studio','studio_login_hint','الاستوديو: تنبيه تسجيل الدخول','يمكنك استخدام الاستوديو بدون تسجيل دخول ضمن الحد المسموح.'),
('studio','studio_success','الاستوديو: رسالة النجاح','تم توليد وتحميل الصوت.'),
('studio','studio_error_missing_text','الاستوديو: خطأ النص الفارغ','اكتب النص أولًا.'),
('studio','studio_error_missing_endpoint','الاستوديو: خطأ رابط XTTS','لم يتم ضبط رابط VITE_XTTS_API_URL.'),
('voices','voices_title','الأصوات: العنوان','الأصوات المتاحة'),
('voices','voices_subtitle','الأصوات: الوصف','كل صوت يجب أن يقابله ملف WAV مرجعي موجود على خادم XTTS.'),
('voices','voices_empty','الأصوات: لا توجد أصوات','لا توجد أصوات مفعلة حاليًا.'),
('voices','voices_select_button','الأصوات: زر الاستخدام','استخدم هذا الصوت'),
('pricing','pricing_title','الخطة: العنوان','الخطة والدعم'),
('pricing','pricing_subtitle','الخطة: الوصف','استخدم الخدمة مجانًا، ويمكنك دعم المشروع بتبرع اختياري.'),
('pricing','free_plan_title','الخطة المجانية: العنوان','مجاني'),
('pricing','free_plan_price','الخطة المجانية: السعر','0$'),
('pricing','free_plan_description','الخطة المجانية: الوصف','تحويل النص العربي إلى ملف WAV ضمن حدود الاستخدام المتاحة.'),
('pricing','free_plan_feature_1','الخطة المجانية: ميزة 1','تحويل نص إلى صوت'),
('pricing','free_plan_feature_2','الخطة المجانية: ميزة 2','تحميل WAV'),
('pricing','free_plan_feature_3','الخطة المجانية: ميزة 3','حساب مستخدم اختياري'),
('pricing','donation_plan_title','التبرع: العنوان','تبرع اختياري'),
('pricing','donation_plan_description','التبرع: الوصف','يمكنك دعم استمرار الخدمة والتطوير.'),
('pricing','donation_button','التبرع: نص الزر','تبرع الآن'),
('account','account_title','الحساب: العنوان','حسابي'),
('account','account_subtitle','الحساب: الوصف','إدارة حسابك ومراجعة سجل التحويلات.'),
('account','login_title','الحساب: عنوان الدخول','تسجيل الدخول'),
('account','email_label','الحساب: البريد','البريد الإلكتروني'),
('account','password_label','الحساب: كلمة المرور','كلمة المرور'),
('account','login_button','الحساب: زر الدخول','دخول'),
('account','signup_button','الحساب: زر إنشاء الحساب','إنشاء حساب'),
('account','jobs_title','الحساب: عنوان السجل','سجل التحويلات'),
('account','jobs_empty','الحساب: لا يوجد سجل','لا توجد تحويلات محفوظة بعد.'),
('contact','contact_title','الدعم: العنوان','الدعم والتواصل'),
('contact','contact_subtitle','الدعم: الوصف','أرسل رسالتك وسنراجعها من لوحة الإدارة.'),
('contact','contact_name','الدعم: الاسم','الاسم'),
('contact','contact_email','الدعم: البريد','البريد الإلكتروني'),
('contact','contact_topic','الدعم: الموضوع','الموضوع'),
('contact','contact_message','الدعم: الرسالة','الرسالة'),
('contact','contact_send','الدعم: زر الإرسال','إرسال الرسالة'),
('contact','contact_success','الدعم: رسالة النجاح','تم إرسال رسالتك.'),
('footer','footer_summary','الفوتر: وصف الموقع','منصة عربية لتحويل النص إلى كلام. يمكنك تعديل هذا النص من لوحة الإدارة.'),
('footer','footer_site_links','الفوتر: عنوان روابط الموقع','الموقع'),
('footer','footer_legal_links','الفوتر: عنوان الروابط القانونية','القانوني'),
('footer','footer_social_links','الفوتر: عنوان التواصل','التواصل'),
('footer','footer_rights','الفوتر: الحقوق','جميع الحقوق محفوظة.')
on conflict (key) do update set
  section = excluded.section,
  label = excluded.label,
  value = case
    when public.site_texts.value is null or public.site_texts.value = '' then excluded.value
    else public.site_texts.value
  end,
  updated_at = now();

-- Clean the public-facing old home settings so v4 only reads site_texts for text.
insert into public.site_settings(key, value)
values ('site', '{}'::jsonb)
on conflict (key) do nothing;

update public.site_settings
set value = value || '{
  "brand_name":"Anos TTS",
  "site_domain":"anos-tts.netlify.app",
  "donation_enabled":true,
  "donation_amount":5,
  "donation_currency":"USD",
  "donation_provider":"PayPal",
  "donation_url":"https://www.paypal.com/"
}'::jsonb,
updated_at = now()
where key = 'site';
