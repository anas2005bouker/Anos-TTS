-- Sawti AI upgrade v2
-- Run this in Supabase SQL Editor if you already ran the previous schema.

alter table public.social_links add column if not exists icon text not null default 'website';
alter table public.voice_presets add column if not exists sample_text text;

update public.site_settings
set value = value || '{
  "hero_title":"حوّل النص العربي إلى صوت طبيعي خلال ثوانٍ",
  "hero_subtitle":"استوديو عربي بسيط واحترافي لتحويل النص إلى ملف صوتي WAV باستخدام XTTS-v2، مع حسابات مستخدمين ولوحة إدارة كاملة.",
  "cta_primary":"جرّب التحويل الآن",
  "cta_secondary":"استكشف الأصوات",
  "announcement":"خدمة تحويل نص عربي إلى صوت بجودة عالية",
  "free_plan_title":"الخطة المجانية",
  "free_plan_description":"تحويل النصوص العربية إلى WAV ضمن حدود عادلة.",
  "donation_enabled":true,
  "donation_amount":5,
  "donation_currency":"USD",
  "donation_provider":"PayPal",
  "donation_url":"https://www.paypal.com/",
  "donation_button_text":"تبرع بـ 5 دولار",
  "donation_description":"ادعم استمرار الخدمة وتطوير أصوات عربية أفضل.",
  "footer_summary":"منصة عربية لتحويل النص إلى كلام بواجهة واضحة، حسابات مستخدمين، ولوحة إدارة قابلة للتخصيص."
}'::jsonb,
updated_at = now()
where key = 'site';

update public.social_links set icon = 'x' where lower(platform) like '%x%' or lower(platform) like '%twitter%';
update public.social_links set icon = 'youtube' where lower(platform) like '%youtube%';
update public.social_links set icon = 'instagram' where lower(platform) like '%instagram%';
update public.social_links set icon = 'tiktok' where lower(platform) like '%tiktok%';
update public.social_links set icon = 'linkedin' where lower(platform) like '%linkedin%';
update public.social_links set icon = 'telegram' where lower(platform) like '%telegram%';
update public.social_links set icon = 'whatsapp' where lower(platform) like '%whatsapp%' or platform like '%واتساب%';
update public.social_links set icon = 'github' where lower(platform) like '%github%';

-- Hide previously seeded fake voices. The real available voice is the default WAV on the XTTS server.
update public.voice_presets
set is_active = false, updated_at = now()
where model_voice_id in ('default_male_ar','default_female_ar','gulf_male_ar','warm_female_ar');

insert into public.voice_presets(name,language,accent,description,model_voice_id,sample_text,sort_order,is_active)
values ('الصوت الأساسي','ar','عربي عام','الصوت المرجعي الحالي المتوفر على خادم XTTS. أضف ملفات WAV أخرى في Hugging Face لإنشاء أصوات متعددة فعلية.','default','مرحبا، هذه تجربة صوتية قصيرة.',1,true);

insert into public.legal_pages(slug,title,body,sort_order) values
('about','من نحن','صوتي AI منصة عربية لتحويل النص إلى كلام، تهدف إلى تقديم تجربة سهلة وواضحة للمستخدمين وصناع المحتوى.',1),
('disclaimer','إخلاء المسؤولية','الخدمة تعتمد على نماذج ذكاء اصطناعي وقد تنتج أخطاء في النطق أو التشكيل. يتحمل المستخدم مسؤولية مراجعة المخرجات قبل استخدامها.',4),
('support','الدعم والمساعدة','يمكنك التواصل معنا عبر نموذج الدعم في الموقع أو البريد الإلكتروني المخصص للدعم.',5)
on conflict (slug) do update set title = excluded.title, body = excluded.body, sort_order = excluded.sort_order, updated_at = now();
