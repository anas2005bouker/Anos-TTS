-- Sawti AI Supabase schema
-- Run this once in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'user' check (role in ('user','admin')),
  status text not null default 'active' check (status in ('active','blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

create table if not exists public.social_links (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  label text,
  icon text not null default 'website',
  url text not null,
  sort_order int not null default 10,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.voice_presets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  language text not null default 'ar',
  accent text,
  description text,
  model_voice_id text,
  sample_text text,
  sort_order int not null default 10,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.legal_pages (
  slug text primary key,
  title text not null,
  body text not null,
  sort_order int not null default 10,
  updated_at timestamptz not null default now()
);

create table if not exists public.tts_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  input_text text not null,
  voice_id text,
  format text not null default 'wav',
  speed numeric not null default 1,
  chars int not null default 0,
  status text not null default 'queued' check (status in ('queued','processing','completed','failed','demo')),
  audio_path text,
  error text,
  duration_ms int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text,
  email text,
  topic text not null default 'support',
  message text not null,
  status text not null default 'open' check (status in ('open','pending','closed')),
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_table text,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_profiles on public.profiles;
create trigger touch_profiles before update on public.profiles for each row execute function public.touch_updated_at();
drop trigger if exists touch_social_links on public.social_links;
create trigger touch_social_links before update on public.social_links for each row execute function public.touch_updated_at();
drop trigger if exists touch_voice_presets on public.voice_presets;
create trigger touch_voice_presets before update on public.voice_presets for each row execute function public.touch_updated_at();
drop trigger if exists touch_tts_jobs on public.tts_jobs;
create trigger touch_tts_jobs before update on public.tts_jobs for each row execute function public.touch_updated_at();
drop trigger if exists touch_support_tickets on public.support_tickets;
create trigger touch_support_tickets before update on public.support_tickets for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role, status)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name',''), 'user', 'active')
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and status = 'active'
  );
$$;

alter table public.profiles enable row level security;
alter table public.site_settings enable row level security;
alter table public.social_links enable row level security;
alter table public.voice_presets enable row level security;
alter table public.legal_pages enable row level security;
alter table public.tts_jobs enable row level security;
alter table public.support_tickets enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin());
drop policy if exists profiles_admin_update on public.profiles;
create policy profiles_admin_update on public.profiles for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists profiles_admin_insert on public.profiles;
create policy profiles_admin_insert on public.profiles for insert to authenticated with check (public.is_admin());

drop policy if exists site_settings_public_select on public.site_settings;
create policy site_settings_public_select on public.site_settings for select to anon, authenticated using (true);
drop policy if exists site_settings_admin_all on public.site_settings;
create policy site_settings_admin_all on public.site_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists social_public_select on public.social_links;
create policy social_public_select on public.social_links for select to anon, authenticated using (is_active = true or public.is_admin());
drop policy if exists social_admin_all on public.social_links;
create policy social_admin_all on public.social_links for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists voices_public_select on public.voice_presets;
create policy voices_public_select on public.voice_presets for select to anon, authenticated using (is_active = true or public.is_admin());
drop policy if exists voices_admin_all on public.voice_presets;
create policy voices_admin_all on public.voice_presets for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists legal_public_select on public.legal_pages;
create policy legal_public_select on public.legal_pages for select to anon, authenticated using (true);
drop policy if exists legal_admin_all on public.legal_pages;
create policy legal_admin_all on public.legal_pages for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists jobs_owner_insert on public.tts_jobs;
create policy jobs_owner_insert on public.tts_jobs for insert to authenticated with check (user_id = auth.uid());
drop policy if exists jobs_owner_or_admin_select on public.tts_jobs;
create policy jobs_owner_or_admin_select on public.tts_jobs for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists jobs_admin_all on public.tts_jobs;
create policy jobs_admin_all on public.tts_jobs for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists tickets_any_insert on public.support_tickets;
create policy tickets_any_insert on public.support_tickets for insert to anon, authenticated with check (true);
drop policy if exists tickets_owner_or_admin_select on public.support_tickets;
create policy tickets_owner_or_admin_select on public.support_tickets for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists tickets_admin_all on public.support_tickets;
create policy tickets_admin_all on public.support_tickets for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists audit_admin_select on public.audit_logs;
create policy audit_admin_select on public.audit_logs for select to authenticated using (public.is_admin());
drop policy if exists audit_admin_insert on public.audit_logs;
create policy audit_admin_insert on public.audit_logs for insert to authenticated with check (public.is_admin());

insert into public.site_settings(key, value) values ('site', '{
  "brand_name":"صوتي AI",
  "site_domain":"sawti.ai",
  "support_email":"support@sawti.ai",
  "legal_email":"legal@sawti.ai",
  "hero_title":"حوّل النص العربي إلى صوت طبيعي خلال ثوانٍ",
  "hero_subtitle":"استوديو عربي بسيط واحترافي لتحويل النص إلى ملف صوتي WAV باستخدام XTTS-v2، مع حسابات مستخدمين ولوحة إدارة كاملة.",
  "cta_primary":"جرّب التحويل الآن",
  "cta_secondary":"استكشف الأصوات",
  "max_chars_guest":300,
  "max_chars_user":2500,
  "maintenance_mode":false,
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
}'::jsonb) on conflict (key) do nothing;

insert into public.social_links(platform,label,icon,url,sort_order,is_active) values
('X','X','x','https://x.com/',1,true),
('YouTube','YouTube','youtube','https://youtube.com/',2,true),
('Instagram','Instagram','instagram','https://instagram.com/',3,true),
('Telegram','Telegram','telegram','https://telegram.org/',4,true),
('WhatsApp','WhatsApp','whatsapp','https://whatsapp.com/',5,true)
on conflict do nothing;

insert into public.voice_presets(name,language,accent,description,model_voice_id,sample_text,sort_order,is_active) values
('الصوت الأساسي','ar','عربي عام','الصوت المرجعي الحالي المتوفر على خادم XTTS. أضف ملفات WAV أخرى في Hugging Face لإنشاء أصوات متعددة فعلية.','default','مرحبا، هذه تجربة صوتية قصيرة.',1,true)
on conflict do nothing;

insert into public.legal_pages(slug,title,body,sort_order) values
('about','من نحن','صوتي AI منصة عربية لتحويل النص إلى كلام، تهدف إلى تقديم تجربة سهلة وواضحة للمستخدمين وصناع المحتوى.',1),
('terms','شروط الاستخدام','باستخدامك للموقع، توافق على استخدام الخدمة بطريقة قانونية وعدم إنشاء محتوى منتحل أو مضلل أو مخالف للأنظمة.',2),
('privacy','سياسة الخصوصية','نستخدم بيانات الحساب والنصوص وطلبات التحويل لتشغيل الخدمة وتحسينها، ولا نبيع بيانات المستخدمين.',3),
('disclaimer','إخلاء المسؤولية','الخدمة تعتمد على نماذج ذكاء اصطناعي وقد تنتج أخطاء في النطق أو التشكيل. يتحمل المستخدم مسؤولية مراجعة المخرجات قبل استخدامها.',4),
('support','الدعم والمساعدة','يمكنك التواصل معنا عبر نموذج الدعم في الموقع أو البريد الإلكتروني المخصص للدعم.',5),
('voice-policy','سياسة الأصوات','لا يسمح برفع أو استخدام صوت شخص حقيقي دون موافقته الصريحة. أي استخدام مخالف قد يؤدي إلى تعطيل الحساب.',6),
('cookies','سياسة الكوكيز','نستخدم ملفات كوكيز ضرورية لتسجيل الدخول والأمان وتحسين تجربة الاستخدام.',7),
('dmca','DMCA وطلبات الإزالة','يمكن لأصحاب الحقوق إرسال بلاغات إزالة عبر البريد القانوني، وستتم مراجعة البلاغات واتخاذ الإجراء المناسب.',8)
on conflict (slug) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('tts-audio','tts-audio',false,52428800,array['audio/mpeg','audio/wav','audio/ogg','audio/x-wav'])
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('voice-samples','voice-samples',false,20971520,array['audio/mpeg','audio/wav','audio/ogg','audio/x-wav'])
on conflict (id) do nothing;

drop policy if exists storage_tts_owner_select on storage.objects;
create policy storage_tts_owner_select on storage.objects for select to authenticated using (
  bucket_id = 'tts-audio' and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists storage_voice_owner_all on storage.objects;
create policy storage_voice_owner_all on storage.objects for all to authenticated using (
  bucket_id = 'voice-samples' and (storage.foldername(name))[1] = auth.uid()::text
) with check (
  bucket_id = 'voice-samples' and (storage.foldername(name))[1] = auth.uid()::text
);
