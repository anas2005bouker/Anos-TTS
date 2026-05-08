import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { supabase, hasSupabaseConfig } from './lib/supabase.js'
import { downloadBase64Audio } from './lib/api.js'
import './styles.css'

const defaultSettings = {
  brand_name: 'Anos TTS',
  site_domain: 'anos-tts.netlify.app',
  support_email: 'support@example.com',
  legal_email: 'legal@example.com',
  max_chars_guest: 300,
  max_chars_user: 2500,
  maintenance_mode: false,
  announcement: '',
  donation_enabled: true,
  donation_amount: 5,
  donation_currency: 'USD',
  donation_provider: 'PayPal',
  donation_url: 'https://www.paypal.com/',
  primary_color: '#67e8f9'
}

const defaultTexts = [
  ['nav','nav_home','زر القائمة: الرئيسية','الرئيسية'],
  ['nav','nav_studio','زر القائمة: الاستوديو','الاستوديو'],
  ['nav','nav_voices','زر القائمة: الأصوات','الأصوات'],
  ['nav','nav_pricing','زر القائمة: الخطة','الخطة'],
  ['nav','nav_about','زر القائمة: من نحن','من نحن'],
  ['nav','nav_contact','زر القائمة: الدعم','الدعم'],
  ['nav','nav_account','زر القائمة: حسابي','حسابي'],
  ['nav','nav_admin','زر القائمة: الإدارة','الإدارة'],
  ['nav','nav_login','زر الدخول','دخول'],
  ['nav','nav_logout','زر الخروج','خروج'],

  ['home','home_eyebrow','الرئيسية: الشارة الصغيرة','تحويل النص العربي إلى صوت'],
  ['home','home_title','الرئيسية: العنوان الرئيسي','حوّل النص العربي إلى ملف صوتي واضح'],
  ['home','home_subtitle','الرئيسية: الوصف تحت العنوان','اكتب النص العربي، اختر الصوت المتاح، ثم حمّل ملف WAV جاهزًا للاستخدام.'],
  ['home','home_primary_cta','الرئيسية: زر البدء','ابدأ التحويل الآن'],
  ['home','home_secondary_cta','الرئيسية: زر الأصوات','عرض الأصوات'],
  ['home','home_demo_label','الرئيسية: عنوان البطاقة التجريبية','نص تجريبي'],
  ['home','home_demo_text','الرئيسية: نص البطاقة التجريبية','مرحبًا، هذه تجربة صوتية عربية واضحة.'],
  ['home','home_demo_button','الرئيسية: زر البطاقة التجريبية','افتح الاستوديو'],
  ['home','home_features_title','الرئيسية: عنوان المزايا','مزايا الخدمة'],
  ['home','home_features_subtitle','الرئيسية: وصف المزايا','يمكنك تعديل هذا القسم كاملًا من لوحة الإدارة.'],
  ['home','home_feature_1_title','الرئيسية: ميزة 1 عنوان','تحويل عربي'],
  ['home','home_feature_1_text','الرئيسية: ميزة 1 نص','واجهة مخصصة لإدخال النص العربي وتوليد ملف صوتي.'],
  ['home','home_feature_2_title','الرئيسية: ميزة 2 عنوان','تحميل WAV'],
  ['home','home_feature_2_text','الرئيسية: ميزة 2 نص','الخادم الحالي يخرج ملف WAV فقط.'],
  ['home','home_feature_3_title','الرئيسية: ميزة 3 عنوان','حساب مستخدم'],
  ['home','home_feature_3_text','الرئيسية: ميزة 3 نص','تسجيل دخول وحساب شخصي وسجل تحويلات عند الربط.'],
  ['home','home_about_title','الرئيسية: عنوان التعريف','خدمة عربية بسيطة وواضحة'],
  ['home','home_about_text','الرئيسية: نص التعريف','اكتب هنا وصفك الحقيقي للموقع وخدمتك ورسالتك للمستخدمين.'],
  ['home','home_social_title','الرئيسية: عنوان التواصل','تابعنا'],
  ['home','home_social_text','الرئيسية: نص التواصل','روابط التواصل تظهر كأيقونات فقط ويمكن تعديلها من لوحة الإدارة.'],

  ['studio','studio_title','الاستوديو: العنوان','استوديو التحويل'],
  ['studio','studio_subtitle','الاستوديو: الوصف','أدخل النص واختر الصوت ثم حمّل الملف الصوتي.'],
  ['studio','studio_text_label','الاستوديو: عنوان حقل النص','النص العربي'],
  ['studio','studio_placeholder','الاستوديو: النص الافتراضي','مرحبًا، هذه تجربة قصيرة للصوت العربي.'],
  ['studio','studio_voice_label','الاستوديو: اختيار الصوت','الصوت'],
  ['studio','studio_speed_label','الاستوديو: السرعة','السرعة'],
  ['studio','studio_format_label','الاستوديو: الصيغة','الصيغة'],
  ['studio','studio_generate_button','الاستوديو: زر التوليد','توليد وتحميل WAV'],
  ['studio','studio_generating','الاستوديو: أثناء التوليد','جاري التوليد...'],
  ['studio','studio_login_hint','الاستوديو: تنبيه تسجيل الدخول','يمكنك استخدام الاستوديو بدون تسجيل دخول ضمن الحد المسموح.'],
  ['studio','studio_success','الاستوديو: رسالة النجاح','تم توليد وتحميل الصوت.'],
  ['studio','studio_error_missing_text','الاستوديو: خطأ النص الفارغ','اكتب النص أولًا.'],
  ['studio','studio_error_missing_endpoint','الاستوديو: خطأ رابط XTTS','لم يتم ضبط رابط VITE_XTTS_API_URL.'],

  ['voices','voices_title','الأصوات: العنوان','الأصوات المتاحة'],
  ['voices','voices_subtitle','الأصوات: الوصف','كل صوت يجب أن يقابله ملف WAV مرجعي موجود على خادم XTTS.'],
  ['voices','voices_empty','الأصوات: لا توجد أصوات','لا توجد أصوات مفعلة حاليًا.'],
  ['voices','voices_select_button','الأصوات: زر الاستخدام','استخدم هذا الصوت'],

  ['pricing','pricing_title','الخطة: العنوان','الخطة والدعم'],
  ['pricing','pricing_subtitle','الخطة: الوصف','استخدم الخدمة مجانًا، ويمكنك دعم المشروع بتبرع اختياري.'],
  ['pricing','free_plan_title','الخطة المجانية: العنوان','مجاني'],
  ['pricing','free_plan_price','الخطة المجانية: السعر','0$'],
  ['pricing','free_plan_description','الخطة المجانية: الوصف','تحويل النص العربي إلى ملف WAV ضمن حدود الاستخدام المتاحة.'],
  ['pricing','free_plan_feature_1','الخطة المجانية: ميزة 1','تحويل نص إلى صوت'],
  ['pricing','free_plan_feature_2','الخطة المجانية: ميزة 2','تحميل WAV'],
  ['pricing','free_plan_feature_3','الخطة المجانية: ميزة 3','حساب مستخدم اختياري'],
  ['pricing','donation_plan_title','التبرع: العنوان','تبرع اختياري'],
  ['pricing','donation_plan_description','التبرع: الوصف','يمكنك دعم استمرار الخدمة والتطوير.'],
  ['pricing','donation_button','التبرع: نص الزر','تبرع الآن'],

  ['account','account_title','الحساب: العنوان','حسابي'],
  ['account','account_subtitle','الحساب: الوصف','إدارة حسابك ومراجعة سجل التحويلات.'],
  ['account','login_title','الحساب: عنوان الدخول','تسجيل الدخول'],
  ['account','email_label','الحساب: البريد','البريد الإلكتروني'],
  ['account','password_label','الحساب: كلمة المرور','كلمة المرور'],
  ['account','login_button','الحساب: زر الدخول','دخول'],
  ['account','signup_button','الحساب: زر إنشاء الحساب','إنشاء حساب'],
  ['account','jobs_title','الحساب: عنوان السجل','سجل التحويلات'],
  ['account','jobs_empty','الحساب: لا يوجد سجل','لا توجد تحويلات محفوظة بعد.'],

  ['contact','contact_title','الدعم: العنوان','الدعم والتواصل'],
  ['contact','contact_subtitle','الدعم: الوصف','أرسل رسالتك وسنراجعها من لوحة الإدارة.'],
  ['contact','contact_name','الدعم: الاسم','الاسم'],
  ['contact','contact_email','الدعم: البريد','البريد الإلكتروني'],
  ['contact','contact_topic','الدعم: الموضوع','الموضوع'],
  ['contact','contact_message','الدعم: الرسالة','الرسالة'],
  ['contact','contact_send','الدعم: زر الإرسال','إرسال الرسالة'],
  ['contact','contact_success','الدعم: رسالة النجاح','تم إرسال رسالتك.'],

  ['footer','footer_summary','الفوتر: وصف الموقع','منصة عربية لتحويل النص إلى كلام. يمكنك تعديل هذا النص من لوحة الإدارة.'],
  ['footer','footer_site_links','الفوتر: عنوان روابط الموقع','الموقع'],
  ['footer','footer_legal_links','الفوتر: عنوان الروابط القانونية','القانوني'],
  ['footer','footer_social_links','الفوتر: عنوان التواصل','التواصل'],
  ['footer','footer_rights','الفوتر: الحقوق','جميع الحقوق محفوظة.']
].map(([section, key, label, value]) => ({ section, key, label, value }))

const textSections = {
  nav: 'القائمة', home: 'الرئيسية', studio: 'الاستوديو', voices: 'الأصوات', pricing: 'الخطة', account: 'الحساب', contact: 'الدعم', footer: 'الفوتر', custom: 'مخصص'
}

const fallbackSocials = [
  { id: 'youtube', platform: 'youtube', icon: 'youtube', url: 'https://youtube.com/', label: 'YouTube', is_active: true, sort_order: 1 },
  { id: 'x', platform: 'x', icon: 'x', url: 'https://x.com/', label: 'X', is_active: true, sort_order: 2 }
]
const fallbackVoices = [
  { id: 'default', name: 'الصوت الأساسي', language: 'ar', accent: 'عربي عام', description: 'الصوت الافتراضي.', model_voice_id: 'default', is_active: true, sort_order: 1, sample_text: 'مرحبًا، هذه تجربة قصيرة للصوت العربي.' }
]
const defaultPages = [
  { slug: 'about', title: 'من نحن', body: 'اكتب هنا نص صفحة من نحن من لوحة الإدارة.', sort_order: 1 },
  { slug: 'support', title: 'الدعم', body: 'اكتب هنا نص صفحة الدعم من لوحة الإدارة.', sort_order: 2 },
  { slug: 'terms', title: 'شروط الاستخدام', body: 'اكتب هنا شروط الاستخدام من لوحة الإدارة.', sort_order: 3 },
  { slug: 'privacy', title: 'سياسة الخصوصية', body: 'اكتب هنا سياسة الخصوصية من لوحة الإدارة.', sort_order: 4 },
  { slug: 'disclaimer', title: 'إخلاء المسؤولية', body: 'اكتب هنا إخلاء المسؤولية من لوحة الإدارة.', sort_order: 5 },
  { slug: 'voice-policy', title: 'سياسة الأصوات', body: 'اكتب هنا سياسة الأصوات من لوحة الإدارة.', sort_order: 6 }
]
const legalRoutes = { about:'about', support:'support', terms:'terms', privacy:'privacy', disclaimer:'disclaimer', 'voice-policy':'voice-policy', cookies:'cookies', dmca:'dmca' }

function cx(...items){ return items.filter(Boolean).join(' ') }
function fmt(v){ return v ? new Date(v).toLocaleString('ar') : '-' }
function toMap(rows){ return Object.fromEntries(rows.map(r => [r.key, r.value])) }
function T(texts, key){ return texts[key] ?? defaultTexts.find(x => x.key === key)?.value ?? key }
function newId(){ return Math.random().toString(36).slice(2) }

function Icon({ name='dot', size=22 }){
  const p={width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round','aria-hidden':'true'}
  const f={width:size,height:size,viewBox:'0 0 24 24',fill:'currentColor','aria-hidden':'true'}
  switch(name){
    case 'wave': return <svg {...p}><path d="M2 12h2l2-7 4 14 3-9 2 4h7"/></svg>
    case 'mic': return <svg {...p}><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v3"/></svg>
    case 'play': return <svg {...f}><path d="M8 5v14l11-7z"/></svg>
    case 'download': return <svg {...p}><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>
    case 'user': return <svg {...p}><path d="M20 21a8 8 0 1 0-16 0"/><circle cx="12" cy="7" r="4"/></svg>
    case 'settings': return <svg {...p}><path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1a7 7 0 0 0-1.7-1L14.5 3h-5l-.3 3.1a7 7 0 0 0-1.7 1l-2.4-1-2 3.4 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.4-1a7 7 0 0 0 1.7 1l.3 3.1h5l.3-3.1a7 7 0 0 0 1.7-1l2.4 1 2-3.4-2-1.5c.1-.3.1-.7.1-1Z"/></svg>
    case 'shield': return <svg {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-5"/></svg>
    case 'file': return <svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/></svg>
    case 'mail': return <svg {...p}><path d="M4 4h16v16H4z"/><path d="m22 6-10 7L2 6"/></svg>
    case 'heart': return <svg {...f}><path d="M12 21s-7-4.4-9.6-8.9C.6 9 1.4 5.3 4.5 4.1 6.4 3.4 8.6 4 10 5.7 11.4 4 13.6 3.4 15.5 4.1c3.1 1.2 3.9 4.9 2.1 8C19 16.6 12 21 12 21Z"/></svg>
    case 'trash': return <svg {...p}><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 15H6L5 6"/></svg>
    case 'save': return <svg {...p}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8"/><path d="M7 3v5h8"/></svg>
    default: return <svg {...p}><circle cx="12" cy="12" r="8"/></svg>
  }
}
function SocialIcon({ icon, size=20 }){
  const key=String(icon||'website').toLowerCase()
  const fill=(children)=><svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">{children}</svg>
  const stroke=(children)=><svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
  if(key.includes('youtube')) return fill(<path d="M23 7.3a3 3 0 0 0-2.1-2.1C19 4.7 12 4.7 12 4.7s-7 0-8.9.5A3 3 0 0 0 1 7.3 31 31 0 0 0 .5 12 31 31 0 0 0 1 16.7a3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.7 31 31 0 0 0-.5-4.7ZM9.8 15.3V8.7L15.6 12Z"/> )
  if(key.includes('instagram')) return stroke(<><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/></>)
  if(key.includes('facebook')) return fill(<path d="M14 8h3V4h-3c-3.3 0-5 2-5 5v3H6v4h3v8h4v-8h3.2l.8-4h-4V9c0-.7.3-1 1-1Z"/> )
  if(key.includes('telegram')) return fill(<path d="M22 3 2.7 10.5c-1.3.5-1.3 1.3-.2 1.6l5 1.6 11.5-7.2c.5-.3 1-.2.6.2l-9.3 8.4-.3 5c.5 0 .7-.2 1-.5l2.4-2.3 5 3.7c.9.5 1.6.2 1.8-.9Z"/> )
  if(key.includes('whatsapp')) return fill(<path d="M12 2a9.8 9.8 0 0 0-8.4 14.9L2.5 22l5.2-1.1A9.9 9.9 0 1 0 12 2Zm5.6 14.1c-.2.6-1.2 1.1-1.7 1.2-.5.1-1.2.2-3.6-.8-3-1.2-5-4.4-5.2-4.6-.1-.2-1.2-1.6-1.2-3s.8-2.1 1.1-2.4c.2-.3.6-.4.8-.4h.6c.2 0 .5 0 .7.5.2.6.9 2 .9 2.2.1.2.1.4 0 .6-.2.4-.4.5-.6.8-.2.2-.4.4-.2.7.2.3.8 1.3 1.7 2.1 1.2 1.1 2.1 1.4 2.4 1.6.3.1.5.1.7-.1.2-.3.8-1 1-1.3.2-.3.4-.3.7-.2.3.1 1.8.9 2.1 1 .3.2.5.3.6.4.1.2.1.9-.1 1.5Z"/> )
  if(key.includes('github')) return fill(<path d="M12 2a10 10 0 0 0-3.2 19c.5.1.7-.2.7-.5v-2c-3 .7-3.6-1.2-3.6-1.2-.5-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 0 1.6 1.1 1.6 1.1.9 1.6 2.4 1.1 3 .9.1-.7.4-1.1.7-1.4-2.4-.3-4.9-1.2-4.9-5.2 0-1.1.4-2.1 1.1-2.8-.1-.3-.5-1.4.1-2.8 0 0 .9-.3 2.9 1.1A10 10 0 0 1 12 5.8c.9 0 1.8.1 2.6.4 2-1.4 2.9-1.1 2.9-1.1.6 1.4.2 2.5.1 2.8.7.7 1.1 1.7 1.1 2.8 0 4-2.5 4.9-4.9 5.2.4.3.8 1 .8 2v2.9c0 .3.2.6.8.5A10 10 0 0 0 12 2Z"/> )
  if(key.includes('paypal')) return fill(<path d="M7.2 21h-4L7.3 3h7.2c3.8 0 6.2 2 5.7 5.2-.5 3.6-3.2 5.8-7.3 5.8H9.4Zm3-10.4h2.4c1.8 0 3-.9 3.2-2.4.2-1.2-.6-2-2.3-2h-2.7Z"/> )
  if(key.includes('mail')) return <Icon name="mail" size={size}/>
  if(key.includes('x')||key.includes('twitter')) return fill(<path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3l-5-7.2L6.2 22H3.1l7.3-8.4L2.8 2h6.4l4.5 6.5Z"/> )
  return <Icon name="link" size={size}/>
}

function App(){
  const [route,setRoute]=useState(location.hash.replace('#','')||'home')
  const [settings,setSettings]=useState(defaultSettings)
  const [textRows,setTextRows]=useState(defaultTexts)
  const texts=useMemo(()=>toMap(textRows),[textRows])
  const t=(key)=>T(texts,key)
  const [socials,setSocials]=useState(fallbackSocials)
  const [voices,setVoices]=useState(fallbackVoices)
  const [pages,setPages]=useState(defaultPages)
  const [session,setSession]=useState(null)
  const [profile,setProfile]=useState(null)
  const [jobs,setJobs]=useState([])
  const [toast,setToast]=useState('')
  const [loading,setLoading]=useState(false)
  const notify=(msg)=>{ setToast(msg); clearTimeout(window.__toast); window.__toast=setTimeout(()=>setToast(''),4200) }
  const go=(r)=>{ location.hash=r }

  useEffect(()=>{ const fn=()=>setRoute(location.hash.replace('#','')||'home'); window.addEventListener('hashchange',fn); return()=>window.removeEventListener('hashchange',fn)},[])
  useEffect(()=>{ if(!hasSupabaseConfig) return; boot(); const {data}=supabase.auth.onAuthStateChange((_e,s)=>{ setSession(s); if(s?.user){ loadProfile(s.user.id); loadJobs(s.user.id)} else {setProfile(null);setJobs([])} }); return()=>data.subscription.unsubscribe() },[])

  async function boot(){ setLoading(true); try{ const {data}=await supabase.auth.getSession(); setSession(data.session); await loadContent(); if(data.session?.user){ await loadProfile(data.session.user.id); await loadJobs(data.session.user.id)} }catch(e){ notify(e.message) }finally{ setLoading(false) } }
  async function loadContent(){
    const [s,tx,so,v,p]=await Promise.all([
      supabase.from('site_settings').select('value').eq('key','site').maybeSingle(),
      supabase.from('site_texts').select('*').order('section').order('key'),
      supabase.from('social_links').select('*').order('sort_order',{ascending:true}),
      supabase.from('voice_presets').select('*').order('sort_order',{ascending:true}),
      supabase.from('legal_pages').select('*').order('sort_order',{ascending:true})
    ])
    if(s.data?.value) setSettings({...defaultSettings,...s.data.value})
    if(!tx.error && tx.data?.length) setTextRows(mergeTextRows(tx.data))
    if(so.data) setSocials(so.data.length?so.data:fallbackSocials)
    if(v.data) setVoices(v.data.length?v.data:fallbackVoices)
    if(p.data) setPages(p.data.length?p.data:defaultPages)
  }
  function mergeTextRows(rows){
    const m=new Map(defaultTexts.map(r=>[r.key,r]));
    rows.forEach(r=>m.set(r.key,{...m.get(r.key),...r,value:r.value??''}))
    return [...m.values()].sort((a,b)=>(a.section||'').localeCompare(b.section||'') || a.key.localeCompare(b.key))
  }
  async function loadProfile(uid){ const {data}=await supabase.from('profiles').select('*').eq('id',uid).maybeSingle(); setProfile(data) }
  async function loadJobs(uid){ const {data}=await supabase.from('tts_jobs').select('*').eq('user_id',uid).order('created_at',{ascending:false}).limit(30); setJobs(data||[]) }

  const isAdmin=profile?.role==='admin' && profile?.status==='active'
  const activeSocials=socials.filter(s=>s.is_active!==false)
  const activeVoices=voices.filter(v=>v.is_active!==false)
  return <div className="app" dir="rtl">
    {toast&&<div className="toast">{toast}</div>}{loading&&<div className="loading">تحميل...</div>}
    <Header route={route} go={go} settings={settings} session={session} profile={profile} t={t} onSignOut={async()=>{ await supabase.auth.signOut(); notify('تم تسجيل الخروج') }}/>
    {settings.maintenance_mode&&<div className="banner danger">{settings.announcement||'الخدمة في وضع صيانة مؤقت.'}</div>}
    {route==='home'&&<Home t={t} socials={activeSocials} go={go}/>} 
    {route==='studio'&&<Studio t={t} settings={settings} voices={activeVoices} session={session} profile={profile} notify={notify} onJob={()=>session?.user&&loadJobs(session.user.id)}/>} 
    {route==='voices'&&<Voices t={t} voices={activeVoices} go={go}/>} 
    {route==='pricing'&&<Pricing t={t} settings={settings} go={go}/>} 
    {route==='dashboard'&&<Dashboard t={t} session={session} profile={profile} jobs={jobs} go={go} notify={notify}/>} 
    {route==='admin'&&<Admin isAdmin={isAdmin} session={session} settings={settings} setSettings={setSettings} textRows={textRows} setTextRows={setTextRows} socials={socials} setSocials={setSocials} voices={voices} setVoices={setVoices} pages={pages} setPages={setPages} notify={notify} reload={loadContent}/>} 
    {legalRoutes[route]&&<Legal pages={pages} slug={legalRoutes[route]}/>} 
    {route==='contact'&&<Contact t={t} settings={settings} socials={activeSocials} session={session} notify={notify}/>} 
    <Footer t={t} settings={settings} socials={activeSocials} pages={pages} go={go}/>
  </div>
}

function Header({route,go,settings,session,profile,t,onSignOut}){
  const [open,setOpen]=useState(false)
  const links=[['home',t('nav_home')],['studio',t('nav_studio')],['voices',t('nav_voices')],['pricing',t('nav_pricing')],['about',t('nav_about')],['contact',t('nav_contact')]]
  return <header className="header"><button className="brand" onClick={()=>go('home')}><span className="logo"><Icon name="wave"/></span><span><b>{settings.brand_name}</b><small>{settings.site_domain}</small></span></button><nav className={cx('nav',open&&'open')}>{links.map(([id,label])=><button key={id} className={route===id?'active':''} onClick={()=>{go(id);setOpen(false)}}>{label}</button>)}{session&&<button className={route==='dashboard'?'active':''} onClick={()=>{go('dashboard');setOpen(false)}}>{t('nav_account')}</button>}{profile?.role==='admin'&&<button className={route==='admin'?'active adminLink':'adminLink'} onClick={()=>{go('admin');setOpen(false)}}>{t('nav_admin')}</button>}</nav><div className="actions">{session?<button className="ghost" onClick={onSignOut}>{t('nav_logout')}</button>:<button className="primary small" onClick={()=>go('dashboard')}>{t('nav_login')}</button>}<button className="menu" onClick={()=>setOpen(!open)}>☰</button></div></header>
}
function Home({t,socials,go}){
  const features=[[t('home_feature_1_title'),t('home_feature_1_text'),'mic'],[t('home_feature_2_title'),t('home_feature_2_text'),'download'],[t('home_feature_3_title'),t('home_feature_3_text'),'user']]
  return <main><section className="hero section"><div className="heroText"><div className="eyebrow">{t('home_eyebrow')}</div><h1>{t('home_title')}</h1><p>{t('home_subtitle')}</p><div className="heroActions"><button className="primary" onClick={()=>go('studio')}>{t('home_primary_cta')}</button><button className="secondary" onClick={()=>go('voices')}>{t('home_secondary_cta')}</button></div></div><div className="heroPanel"><div className="miniStudio"><div className="dots"><i/><i/><i/></div><label>{t('home_demo_label')}</label><div className="fakeTextarea">{t('home_demo_text')}</div><button onClick={()=>go('studio')}><Icon name="play" size={18}/>{t('home_demo_button')}</button></div></div></section><section className="section"><div className="pageHead"><h1>{t('home_features_title')}</h1><p>{t('home_features_subtitle')}</p></div><div className="grid3">{features.map(([title,text,icon])=><div className="card" key={title}><span className="cardIcon"><Icon name={icon}/></span><h3>{title}</h3><p>{text}</p></div>)}</div></section><section className="section split"><div><div className="eyebrow">{t('home_about_title')}</div><p>{t('home_about_text')}</p></div><div className="socialsOnly"><h2>{t('home_social_title')}</h2><p>{t('home_social_text')}</p><Socials socials={socials}/></div></section></main>
}
function Studio({t,settings,voices,session,profile,notify,onJob}){
  const [text,setText]=useState(t('studio_placeholder')); const [voice,setVoice]=useState(voices[0]?.model_voice_id||'default'); const [speed,setSpeed]=useState(1); const [busy,setBusy]=useState(false); const [audio,setAudio]=useState(null); const limit=session?Number(settings.max_chars_user||2500):Number(settings.max_chars_guest||300)
  async function generate(){
    if(!text.trim()) return notify(t('studio_error_missing_text'))
    if(text.length>limit) return notify(`النص أطول من الحد المسموح: ${limit}`)
    const directUrl=import.meta.env.VITE_XTTS_API_URL
    if(!directUrl) return notify(t('studio_error_missing_endpoint'))
    setBusy(true); setAudio(null)
    try{ const res=await fetch(directUrl,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,language:'ar',voice_id:voice||'default',speed:Number(speed||1),format:'wav',return_base64:true})}); const data=await res.json().catch(()=>({})); if(!res.ok) throw new Error(data.detail||`XTTS ${res.status}`); if(!data.audio_base64) throw new Error('audio_base64 مفقود'); setAudio(data.audio_base64); downloadBase64Audio(data.audio_base64,`anos-tts-${Date.now()}.wav`,'audio/wav'); notify(t('studio_success')); if(session?.user){ supabase.from('tts_jobs').insert({user_id:session.user.id,input_text:text,voice_id:voice,format:'wav',speed,chars:text.length,status:'completed'}).then(()=>onJob?.()) }}catch(e){ notify(e.message) }finally{ setBusy(false) }
  }
  return <main className="section page"><div className="pageHead"><h1>{t('studio_title')}</h1><p>{t('studio_subtitle')}</p></div><div className="studioLayout"><aside className="card sidePanel"><p>{t('studio_login_hint')}</p><div className="stat"><span>WAV</span><b>{text.length}/{limit}</b></div></aside><section className="studioCard card"><label>{t('studio_text_label')}</label><textarea value={text} onChange={e=>setText(e.target.value)} /><div className="controls"><label className="field"><span>{t('studio_voice_label')}</span><select value={voice} onChange={e=>setVoice(e.target.value)}>{voices.map(v=><option key={v.id||v.model_voice_id} value={v.model_voice_id||'default'}>{v.name}</option>)}</select></label><label className="field"><span>{t('studio_speed_label')}</span><input type="number" step="0.1" min="0.7" max="1.3" value={speed} onChange={e=>setSpeed(e.target.value)}/></label><label className="field"><span>{t('studio_format_label')}</span><input value="WAV" disabled /></label></div><button className="primary wide" onClick={generate} disabled={busy}>{busy?t('studio_generating'):t('studio_generate_button')}</button>{audio&&<div className="audioBox"><audio controls src={`data:audio/wav;base64,${audio}`}/><button className="secondary" onClick={()=>downloadBase64Audio(audio,`anos-tts-${Date.now()}.wav`,'audio/wav')}>{t('studio_generate_button')}</button></div>}</section></div></main>
}
function Voices({t,voices,go}){ return <main className="section page"><div className="pageHead"><h1>{t('voices_title')}</h1><p>{t('voices_subtitle')}</p></div><div className="voiceGrid">{voices.length?voices.map(v=><div className="card voice" key={v.id||v.model_voice_id}><div className="voiceTop"><span className="cardIcon"><Icon name="mic"/></span><small>{v.language}</small></div><h3>{v.name}</h3><b>{v.accent}</b><p>{v.description}</p><button className="primary" onClick={()=>go('studio')}>{t('voices_select_button')}</button></div>):<p>{t('voices_empty')}</p>}</div></main> }
function Pricing({t,settings}){ const donationText=`${settings.donation_amount||5} ${settings.donation_currency||'USD'}`; return <main className="section page"><div className="pageHead"><h1>{t('pricing_title')}</h1><p>{t('pricing_subtitle')}</p></div><div className="plans"><div className="card plan"><h3>{t('free_plan_title')}</h3><div className="price">{t('free_plan_price')}</div><p>{t('free_plan_description')}</p><ul><li>{t('free_plan_feature_1')}</li><li>{t('free_plan_feature_2')}</li><li>{t('free_plan_feature_3')}</li></ul></div><div className="card plan featured"><h3>{t('donation_plan_title')}</h3><div className="price">{donationText}</div><p>{t('donation_plan_description')}</p>{settings.donation_enabled&&<a className="primary" href={settings.donation_url} target="_blank" rel="noreferrer">{t('donation_button')}</a>}</div></div></main> }
function Dashboard({t,session,profile,jobs,go,notify}){ const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[busy,setBusy]=useState(false); async function auth(mode){ if(!email||!password) return notify('أدخل البريد وكلمة المرور'); setBusy(true); try{ const r=mode==='login'?await supabase.auth.signInWithPassword({email,password}):await supabase.auth.signUp({email,password}); if(r.error) throw r.error; notify(mode==='login'?'تم تسجيل الدخول':'تم إنشاء الحساب. قد تحتاج تأكيد البريد.') }catch(e){ notify(e.message) }finally{setBusy(false)} } if(!session) return <main className="section authPage"><div className="card auth"><h1>{t('login_title')}</h1><input placeholder={t('email_label')} value={email} onChange={e=>setEmail(e.target.value)}/><input type="password" placeholder={t('password_label')} value={password} onChange={e=>setPassword(e.target.value)}/><button className="primary wide" disabled={busy} onClick={()=>auth('login')}>{t('login_button')}</button><button className="linkBtn" onClick={()=>auth('signup')}>{t('signup_button')}</button></div></main>; return <main className="section page"><div className="pageHead"><h1>{t('account_title')}</h1><p>{t('account_subtitle')}</p></div><div className="dashboardGrid"><div className="card"><h3>{session.user.email}</h3><p>{profile?.role||'user'} · {profile?.status||'active'}</p></div><div className="card"><h3>{t('jobs_title')}</h3>{jobs.length?jobs.map(j=><div className="stat" key={j.id}><span>{j.chars} حرف</span><b>{j.status}</b></div>):<p>{t('jobs_empty')}</p>}</div></div></main> }
function Contact({t,settings,socials,session,notify}){ const [form,setForm]=useState({name:'',email:session?.user?.email||'',topic:'support',message:''}); async function submit(){ if(!form.message.trim()) return notify('اكتب الرسالة'); const {error}=await supabase.from('support_tickets').insert({...form,user_id:session?.user?.id||null}); if(error) return notify(error.message); setForm({...form,message:''}); notify(t('contact_success')) } return <main className="section page"><div className="pageHead"><h1>{t('contact_title')}</h1><p>{t('contact_subtitle')}</p></div><div className="contactGrid"><div className="card contactForm"><input placeholder={t('contact_name')} value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/><input placeholder={t('contact_email')} value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/><input placeholder={t('contact_topic')} value={form.topic} onChange={e=>setForm({...form,topic:e.target.value})}/><textarea placeholder={t('contact_message')} value={form.message} onChange={e=>setForm({...form,message:e.target.value})}/><button className="primary" onClick={submit}>{t('contact_send')}</button></div><div className="card"><h3>{settings.support_email}</h3><Socials socials={socials}/></div></div></main> }
function Legal({pages,slug}){ const page=pages.find(p=>p.slug===slug)||defaultPages.find(p=>p.slug===slug)||{title:'صفحة',body:''}; return <main className="section page"><article className="legalBody card"><h1>{page.title}</h1><p>{page.body}</p></article></main> }
function Socials({socials}){ return <div className="socials">{socials.map(s=><a key={s.id||s.url} href={s.url} target="_blank" rel="noreferrer" title={s.label||s.platform} aria-label={s.label||s.platform}><SocialIcon icon={s.icon||s.platform}/></a>)}</div> }
function Footer({t,settings,socials,pages,go}){ return <footer className="footer"><div><h3>{settings.brand_name}</h3><p>{t('footer_summary')}</p><p>© {new Date().getFullYear()} {t('footer_rights')}</p></div><div><h4>{t('footer_site_links')}</h4>{[['home',t('nav_home')],['studio',t('nav_studio')],['voices',t('nav_voices')],['pricing',t('nav_pricing')]].map(([id,label])=><button key={id} onClick={()=>go(id)}>{label}</button>)}</div><div><h4>{t('footer_legal_links')}</h4>{pages.map(p=><button key={p.slug} onClick={()=>go(p.slug)}>{p.title}</button>)}<h4>{t('footer_social_links')}</h4><Socials socials={socials}/></div></footer> }

function Admin({isAdmin,session,settings,setSettings,textRows,setTextRows,socials,setSocials,voices,setVoices,pages,setPages,notify,reload}){
  const [tab,setTab]=useState('texts')
  if(!session) return <main className="section page"><div className="card"><h1>سجل الدخول أولًا</h1></div></main>
  if(!isAdmin) return <main className="section page"><div className="card"><h1>هذا القسم للمدير فقط</h1></div></main>
  const tabs=[['texts','النصوص'],['settings','الإعدادات'],['socials','التواصل'],['voices','الأصوات'],['pages','الصفحات'],['users','المستخدمون'],['jobs','التحويلات']]
  return <main className="section page"><div className="pageHead"><h1>لوحة الإدارة</h1><p>من هنا تعدّل النصوص والمحتوى والروابط والإعدادات.</p></div><div className="adminLayout"><aside className="adminTabs">{tabs.map(([id,label])=><button key={id} className={tab===id?'active':''} onClick={()=>setTab(id)}>{label}</button>)}</aside><section className="card adminCard">{tab==='texts'&&<TextAdmin rows={textRows} setRows={setTextRows} notify={notify}/>} {tab==='settings'&&<SettingsAdmin settings={settings} setSettings={setSettings} notify={notify}/>} {tab==='socials'&&<SocialAdmin socials={socials} setSocials={setSocials} notify={notify}/>} {tab==='voices'&&<VoiceAdmin voices={voices} setVoices={setVoices} notify={notify}/>} {tab==='pages'&&<PagesAdmin pages={pages} setPages={setPages} notify={notify}/>} {tab==='users'&&<UsersAdmin/>} {tab==='jobs'&&<JobsAdmin/>}</section></div></main>
}
function TextAdmin({rows,setRows,notify}){
  const [section,setSection]=useState('home'),[q,setQ]=useState('')
  const filtered=rows.filter(r=>(section==='all'||r.section===section)&&(!q||`${r.key} ${r.label} ${r.value}`.toLowerCase().includes(q.toLowerCase())))
  function update(key,patch){ setRows(rows.map(r=>r.key===key?{...r,...patch}:r)) }
  async function saveAll(){ const payload=rows.map(r=>({key:r.key,section:r.section||'custom',label:r.label||r.key,value:r.value||'',updated_at:new Date().toISOString()})); const {error}=await supabase.from('site_texts').upsert(payload,{onConflict:'key'}); if(error) return notify(error.message); notify('تم حفظ كل النصوص') }
  async function initDefaults(){ const payload=defaultTexts.map(r=>({...r,updated_at:new Date().toISOString()})); const {error}=await supabase.from('site_texts').upsert(payload,{onConflict:'key'}); if(error) return notify(error.message); setRows(payload); notify('تم تهيئة النصوص الافتراضية') }
  function add(){ const key=`custom_${Date.now()}`; setRows([{section:'custom',key,label:'نص مخصص',value:''},...rows]); setSection('custom') }
  return <div><h2>إدارة كل نصوص الموقع</h2><p className="adminNote">أي نص في الصفحة الرئيسية أو القائمة أو الاستوديو أو الخطة أو الحساب أو الفوتر يُعدل من هنا. الصفحات الطويلة مثل الخصوصية والشروط تُعدل من تبويب الصفحات.</p><div className="adminToolbar"><select value={section} onChange={e=>setSection(e.target.value)}><option value="all">كل الأقسام</option>{Object.entries(textSections).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select><input placeholder="بحث في النصوص" value={q} onChange={e=>setQ(e.target.value)}/><button onClick={add}>إضافة نص</button><button onClick={initDefaults}>تهيئة النصوص</button><button className="primary" onClick={saveAll}><Icon name="save" size={18}/> حفظ الكل</button></div><div className="textEditor">{filtered.map(r=><div className="textRow" key={r.key}><div><small>{textSections[r.section]||r.section}</small><b>{r.label}</b><code>{r.key}</code></div><input value={r.label||''} onChange={e=>update(r.key,{label:e.target.value})}/><select value={r.section||'custom'} onChange={e=>update(r.key,{section:e.target.value})}>{Object.entries(textSections).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select><textarea value={r.value||''} onChange={e=>update(r.key,{value:e.target.value})}/></div>)}</div></div>
}
function SettingsAdmin({settings,setSettings,notify}){ async function save(){ const {error}=await supabase.from('site_settings').upsert({key:'site',value:settings,updated_at:new Date().toISOString()}); if(error) return notify(error.message); notify('تم حفظ الإعدادات') } const fields=['brand_name','site_domain','support_email','legal_email','max_chars_guest','max_chars_user','donation_amount','donation_currency','donation_provider','donation_url']; return <div><h2>إعدادات الموقع والدفع</h2><div className="formGrid">{fields.map(k=><label className="field" key={k}><span>{k}</span><input value={settings[k]??''} onChange={e=>setSettings({...settings,[k]:e.target.value})}/></label>)}<label className="check"><input type="checkbox" checked={!!settings.donation_enabled} onChange={e=>setSettings({...settings,donation_enabled:e.target.checked})}/> تفعيل التبرع</label><label className="check"><input type="checkbox" checked={!!settings.maintenance_mode} onChange={e=>setSettings({...settings,maintenance_mode:e.target.checked})}/> وضع الصيانة</label><label className="field"><span>announcement</span><textarea value={settings.announcement||''} onChange={e=>setSettings({...settings,announcement:e.target.value})}/></label></div><button className="primary" onClick={save}>حفظ الإعدادات</button></div> }
function SocialAdmin({socials,setSocials,notify}){ function update(i,patch){ setSocials(socials.map((s,idx)=>idx===i?{...s,...patch}:s)) } async function save(){ const payload=socials.map(s=>({platform:s.platform||s.icon||'website',label:s.label||s.platform,icon:s.icon||'website',url:s.url||'#',sort_order:Number(s.sort_order||10),is_active:s.is_active!==false})); const {error}=await supabase.from('social_links').upsert(payload); if(error) return notify(error.message); notify('تم حفظ روابط التواصل') } return <div><h2>روابط التواصل</h2><button onClick={()=>setSocials([{id:newId(),platform:'website',label:'رابط جديد',icon:'website',url:'https://',sort_order:10,is_active:true},...socials])}>إضافة رابط</button><div>{socials.map((s,i)=><div className="editRow" key={s.id||i}><input value={s.platform||''} onChange={e=>update(i,{platform:e.target.value})}/><input value={s.label||''} onChange={e=>update(i,{label:e.target.value})}/><input value={s.icon||''} onChange={e=>update(i,{icon:e.target.value})}/><input value={s.url||''} onChange={e=>update(i,{url:e.target.value})}/><input value={s.sort_order||0} onChange={e=>update(i,{sort_order:e.target.value})}/><label><input type="checkbox" checked={s.is_active!==false} onChange={e=>update(i,{is_active:e.target.checked})}/> مفعل</label><button onClick={()=>setSocials(socials.filter((_,idx)=>idx!==i))}><Icon name="trash"/></button></div>)}</div><button className="primary" onClick={save}>حفظ روابط التواصل</button></div> }
function VoiceAdmin({voices,setVoices,notify}){ function update(i,patch){ setVoices(voices.map((v,idx)=>idx===i?{...v,...patch}:v)) } async function save(){ const payload=voices.map(v=>({name:v.name||'صوت',language:v.language||'ar',accent:v.accent||'',description:v.description||'',model_voice_id:v.model_voice_id||'default',sample_text:v.sample_text||'',sort_order:Number(v.sort_order||10),is_active:v.is_active!==false})); const {error}=await supabase.from('voice_presets').upsert(payload); if(error) return notify(error.message); notify('تم حفظ الأصوات') } return <div><h2>الأصوات</h2><p className="adminNote">لكي يظهر صوت مختلف فعلًا يجب رفع ملف WAV بنفس الاسم على Hugging Face داخل مجلد speakers. مثال: layan.wav ثم ضع هنا model_voice_id = layan.</p><button onClick={()=>setVoices([{id:newId(),name:'صوت جديد',language:'ar',accent:'',description:'',model_voice_id:'default',sample_text:'',sort_order:10,is_active:true},...voices])}>إضافة صوت</button>{voices.map((v,i)=><div className="voiceEdit" key={v.id||i}><div className="formGrid"><label className="field"><span>الاسم</span><input value={v.name||''} onChange={e=>update(i,{name:e.target.value})}/></label><label className="field"><span>language</span><input value={v.language||'ar'} onChange={e=>update(i,{language:e.target.value})}/></label><label className="field"><span>model_voice_id / اسم ملف WAV</span><input value={v.model_voice_id||''} onChange={e=>update(i,{model_voice_id:e.target.value})}/></label><label className="field"><span>الوصف</span><textarea value={v.description||''} onChange={e=>update(i,{description:e.target.value})}/></label></div><label className="check"><input type="checkbox" checked={v.is_active!==false} onChange={e=>update(i,{is_active:e.target.checked})}/> مفعل</label><button className="dangerBtn" onClick={()=>setVoices(voices.filter((_,idx)=>idx!==i))}>حذف</button></div>)}<button className="primary" onClick={save}>حفظ الأصوات</button></div> }
function PagesAdmin({pages,setPages,notify}){ const [slug,setSlug]=useState(pages[0]?.slug||'about'); const page=pages.find(p=>p.slug===slug)||pages[0]||{}; function patch(patch){ setPages(pages.map(x=>x.slug===page.slug?{...x,...patch}:x)) } async function save(){ const payload=pages.map(p=>({slug:p.slug,title:p.title,body:p.body,sort_order:Number(p.sort_order||10)})); const {error}=await supabase.from('legal_pages').upsert(payload,{onConflict:'slug'}); if(error) return notify(error.message); notify('تم حفظ الصفحات') } function add(){ const s=`page-${Date.now()}`; setPages([{slug:s,title:'صفحة جديدة',body:'',sort_order:10},...pages]); setSlug(s) } return <div><h2>الصفحات الثابتة</h2><div className="pageManager"><select value={page.slug||''} onChange={e=>setSlug(e.target.value)}>{pages.map(p=><option key={p.slug} value={p.slug}>{p.title}</option>)}</select><button onClick={add}>إضافة صفحة</button></div>{page&&<div className="formGrid"><label className="field"><span>slug</span><input value={page.slug||''} onChange={e=>patch({slug:e.target.value})}/></label><label className="field"><span>العنوان</span><input value={page.title||''} onChange={e=>patch({title:e.target.value})}/></label><label className="field"><span>المحتوى</span><textarea value={page.body||''} onChange={e=>patch({body:e.target.value})}/></label></div>}<button className="primary" onClick={save}>حفظ الصفحات</button></div> }
function UsersAdmin(){ const [users,setUsers]=useState([]); useEffect(()=>{ supabase.functions?null:null; supabase.from('profiles').select('*').order('created_at',{ascending:false}).then(({data})=>setUsers(data||[]))},[]); return <div><h2>المستخدمون</h2><div className="table">{users.map(u=><div className="tr" key={u.id}><span>{u.email}</span><span>{u.role}</span><span>{u.status}</span><span>{fmt(u.created_at)}</span></div>)}</div></div> }
function JobsAdmin(){ const [jobs,setJobs]=useState([]); useEffect(()=>{ supabase.from('tts_jobs').select('*').order('created_at',{ascending:false}).limit(80).then(({data})=>setJobs(data||[]))},[]); return <div><h2>التحويلات</h2><div className="table">{jobs.map(j=><div className="tr" key={j.id}><span>{j.chars} حرف</span><span>{j.status}</span><span>{j.voice_id}</span><span>{fmt(j.created_at)}</span></div>)}</div></div> }

createRoot(document.getElementById('root')).render(<App />)
