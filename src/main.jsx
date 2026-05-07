import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { supabase, hasSupabaseConfig } from './lib/supabase.js'
import { callFunction, downloadBase64Audio } from './lib/api.js'
import './styles.css'

const defaultSettings = {
  brand_name: 'صوتي AI',
  site_domain: 'sawti.ai',
  support_email: 'support@sawti.ai',
  legal_email: 'legal@sawti.ai',
  hero_title: 'حوّل النص العربي إلى صوت طبيعي خلال ثوانٍ',
  hero_subtitle: 'استوديو عربي بسيط واحترافي لتحويل النص إلى ملف صوتي WAV باستخدام XTTS-v2، مع حسابات مستخدمين ولوحة إدارة كاملة.',
  cta_primary: 'جرّب التحويل الآن',
  cta_secondary: 'استكشف الأصوات',
  max_chars_guest: 300,
  max_chars_user: 2500,
  maintenance_mode: false,
  announcement: 'خدمة تحويل نص عربي إلى صوت بجودة عالية',
  free_plan_title: 'الخطة المجانية',
  free_plan_description: 'تحويل النصوص العربية إلى WAV ضمن حدود عادلة.',
  donation_enabled: true,
  donation_amount: 5,
  donation_currency: 'USD',
  donation_provider: 'PayPal',
  donation_url: 'https://www.paypal.com/',
  donation_button_text: 'تبرع بـ 5 دولار',
  donation_description: 'ادعم استمرار الخدمة وتطوير أصوات عربية أفضل.',
  footer_summary: 'منصة عربية لتحويل النص إلى كلام بواجهة واضحة، حسابات مستخدمين، ولوحة إدارة قابلة للتخصيص.'
}

const fallbackSocials = [
  { id: 'x', platform: 'X', icon: 'x', url: 'https://x.com/', label: 'X', is_active: true, sort_order: 1 },
  { id: 'youtube', platform: 'YouTube', icon: 'youtube', url: 'https://youtube.com/', label: 'YouTube', is_active: true, sort_order: 2 },
  { id: 'instagram', platform: 'Instagram', icon: 'instagram', url: 'https://instagram.com/', label: 'Instagram', is_active: true, sort_order: 3 },
  { id: 'telegram', platform: 'Telegram', icon: 'telegram', url: 'https://telegram.org/', label: 'Telegram', is_active: true, sort_order: 4 }
]

const fallbackVoices = [
  {
    id: 'default',
    name: 'الصوت الأساسي',
    language: 'ar',
    accent: 'عربي عام',
    description: 'الصوت المرجعي الحالي المتوفر على خادم XTTS. أضف ملفات WAV أخرى في Hugging Face لإنشاء أصوات متعددة فعلية.',
    model_voice_id: 'default',
    is_active: true,
    sort_order: 1,
    sample_text: 'مرحبا، هذه تجربة صوتية قصيرة.'
  }
]

const defaultLegal = [
  { slug: 'about', title: 'من نحن', body: 'صوتي AI منصة عربية لتحويل النص إلى كلام، تهدف إلى تقديم تجربة سهلة وواضحة للمستخدمين وصناع المحتوى.' },
  { slug: 'terms', title: 'شروط الاستخدام', body: 'باستخدامك للموقع، توافق على استخدام الخدمة بطريقة قانونية وعدم إنشاء محتوى منتحل أو مضلل أو مخالف للأنظمة.' },
  { slug: 'privacy', title: 'سياسة الخصوصية', body: 'نستخدم بيانات الحساب والنصوص وطلبات التحويل لتشغيل الخدمة وتحسينها، ولا نبيع بيانات المستخدمين.' },
  { slug: 'disclaimer', title: 'إخلاء المسؤولية', body: 'الخدمة تعتمد على نماذج ذكاء اصطناعي وقد تنتج أخطاء في النطق أو التشكيل. يتحمل المستخدم مسؤولية مراجعة المخرجات قبل استخدامها.' },
  { slug: 'support', title: 'الدعم والمساعدة', body: 'يمكنك التواصل معنا عبر نموذج الدعم في الموقع أو البريد الإلكتروني المخصص للدعم.' },
  { slug: 'voice-policy', title: 'سياسة الأصوات', body: 'لا يسمح برفع أو استخدام صوت شخص حقيقي دون موافقته الصريحة. أي استخدام مخالف قد يؤدي إلى تعطيل الحساب.' },
  { slug: 'cookies', title: 'سياسة الكوكيز', body: 'نستخدم ملفات كوكيز ضرورية لتسجيل الدخول والأمان وتحسين تجربة الاستخدام.' },
  { slug: 'dmca', title: 'DMCA وطلبات الإزالة', body: 'يمكن لأصحاب الحقوق إرسال بلاغات إزالة عبر البريد القانوني، وستتم مراجعة البلاغات واتخاذ الإجراء المناسب.' }
]

const socialOptions = ['x', 'youtube', 'instagram', 'tiktok', 'facebook', 'linkedin', 'telegram', 'whatsapp', 'github', 'discord', 'paypal', 'mail', 'website']
const routeToLegal = { about: 'about', terms: 'terms', privacy: 'privacy', disclaimer: 'disclaimer', cookies: 'cookies', 'voice-policy': 'voice-policy', dmca: 'dmca' }

function cx(...items) { return items.filter(Boolean).join(' ') }
function fmtDate(v) { return v ? new Date(v).toLocaleString('ar') : '-' }
function safeNumber(v, fallback = 0) { const n = Number(v); return Number.isFinite(n) ? n : fallback }

function Icon({ name, size = 22 }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': 'true' }
  const fillCommon = { width: size, height: size, viewBox: '0 0 24 24', fill: 'currentColor', 'aria-hidden': 'true' }
  switch (name) {
    case 'mic': return <svg {...common}><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v3"/></svg>
    case 'wave': return <svg {...common}><path d="M2 12h2l2-7 4 14 3-9 2 4h7"/></svg>
    case 'play': return <svg {...fillCommon}><path d="M8 5v14l11-7z"/></svg>
    case 'download': return <svg {...common}><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>
    case 'shield': return <svg {...common}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-5"/></svg>
    case 'user': return <svg {...common}><path d="M20 21a8 8 0 1 0-16 0"/><circle cx="12" cy="7" r="4"/></svg>
    case 'users': return <svg {...common}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    case 'settings': return <svg {...common}><path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 .6 1.65 1.65 0 0 0-.4 1.08V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-.6-1 1.65 1.65 0 0 0-1.08-.4H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06A2 2 0 1 1 7.04 4.3l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-.6 1.65 1.65 0 0 0 .4-1.08V3a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 15 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.36.13.67.34.9.6.25.3.38.69.38 1.08V11a2 2 0 1 1 0 4h-.09c-.39 0-.78.13-1.08.38-.26.23-.47.54-.6.9Z"/></svg>
    case 'link': return <svg {...common}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
    case 'file': return <svg {...common}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/></svg>
    case 'heart': return <svg {...fillCommon}><path d="M12 21s-7-4.4-9.6-8.9C.6 9 1.4 5.3 4.5 4.1 6.4 3.4 8.6 4 10 5.7 11.4 4 13.6 3.4 15.5 4.1c3.1 1.2 3.9 4.9 2.1 8C19 16.6 12 21 12 21Z"/></svg>
    case 'mail': return <svg {...common}><path d="M4 4h16v16H4z"/><path d="m22 6-10 7L2 6"/></svg>
    case 'check': return <svg {...common}><path d="m20 6-11 11-5-5"/></svg>
    case 'alert': return <svg {...common}><path d="M10.3 3.5 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.5a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
    case 'spark': return <svg {...common}><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8Z"/><path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8Z"/></svg>
    default: return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M8 12h8"/></svg>
  }
}

function SocialIcon({ icon, label, size = 21 }) {
  const key = String(icon || label || 'website').toLowerCase()
  const svg = (children, fill = true) => <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill={fill ? 'currentColor' : 'none'} stroke={fill ? 'none' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
  if (key.includes('youtube')) return svg(<path d="M23 7.3a3 3 0 0 0-2.1-2.1C19 4.7 12 4.7 12 4.7s-7 0-8.9.5A3 3 0 0 0 1 7.3 31 31 0 0 0 .5 12 31 31 0 0 0 1 16.7a3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.7 31 31 0 0 0-.5-4.7ZM9.8 15.3V8.7L15.6 12Z" />)
  if (key.includes('instagram')) return svg(<><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2"/><circle cx="17.5" cy="6.5" r="1.2" /></>, false)
  if (key.includes('tiktok')) return svg(<path d="M17 4c.6 2.7 2.2 4.3 5 4.6v3.2c-1.8.1-3.4-.4-5-1.4v5.8c0 3.8-2.6 6.3-6.3 6.3-3.2 0-5.8-2.4-5.8-5.6 0-3.5 2.7-5.9 6.4-5.6v3.4c-1.6-.2-2.7.6-2.7 2 0 1.2 1 2 2.2 2 1.5 0 2.5-.9 2.5-2.7V4Z" />)
  if (key.includes('facebook')) return svg(<path d="M14 8h3V4h-3c-3.3 0-5 2-5 5v3H6v4h3v8h4v-8h3.2l.8-4h-4V9c0-.7.3-1 1-1Z" />)
  if (key.includes('linkedin')) return svg(<><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3Z"/><path d="M9 9h3.8v1.7h.1c.5-1 1.9-2 3.9-2 4.1 0 4.9 2.7 4.9 6.3v6h-4v-5.3c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9V21H9Z"/></>)
  if (key.includes('telegram')) return svg(<path d="M22 3 2.7 10.5c-1.3.5-1.3 1.3-.2 1.6l5 1.6 11.5-7.2c.5-.3 1-.2.6.2l-9.3 8.4-.3 5c.5 0 .7-.2 1-.5l2.4-2.3 5 3.7c.9.5 1.6.2 1.8-.9Z" />)
  if (key.includes('whatsapp')) return svg(<path d="M12 2a9.8 9.8 0 0 0-8.4 14.9L2.5 22l5.2-1.1A9.9 9.9 0 1 0 12 2Zm5.6 14.1c-.2.6-1.2 1.1-1.7 1.2-.5.1-1.2.2-3.6-.8-3-1.2-5-4.4-5.2-4.6-.1-.2-1.2-1.6-1.2-3s.8-2.1 1.1-2.4c.2-.3.6-.4.8-.4h.6c.2 0 .5 0 .7.5.2.6.9 2 .9 2.2.1.2.1.4 0 .6-.2.4-.4.5-.6.8-.2.2-.4.4-.2.7.2.3.8 1.3 1.7 2.1 1.2 1.1 2.1 1.4 2.4 1.6.3.1.5.1.7-.1.2-.3.8-1 1-1.3.2-.3.4-.3.7-.2.3.1 1.8.9 2.1 1 .3.2.5.3.6.4.1.2.1.9-.1 1.5Z" />)
  if (key.includes('github')) return svg(<path d="M12 2a10 10 0 0 0-3.2 19c.5.1.7-.2.7-.5v-2c-3 .7-3.6-1.2-3.6-1.2-.5-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 0 1.6 1.1 1.6 1.1.9 1.6 2.4 1.1 3 .9.1-.7.4-1.1.7-1.4-2.4-.3-4.9-1.2-4.9-5.2 0-1.1.4-2.1 1.1-2.8-.1-.3-.5-1.4.1-2.8 0 0 .9-.3 2.9 1.1A10 10 0 0 1 12 5.8c.9 0 1.8.1 2.6.4 2-1.4 2.9-1.1 2.9-1.1.6 1.4.2 2.5.1 2.8.7.7 1.1 1.7 1.1 2.8 0 4-2.5 4.9-4.9 5.2.4.3.8 1 .8 2v2.9c0 .3.2.6.8.5A10 10 0 0 0 12 2Z" />)
  if (key.includes('paypal')) return svg(<path d="M7.2 21h-4L7.3 3h7.2c3.8 0 6.2 2 5.7 5.2-.5 3.6-3.2 5.8-7.3 5.8H9.4Zm3-10.4h2.4c1.8 0 3-.9 3.2-2.4.2-1.2-.6-2-2.3-2h-2.7Z" />)
  if (key.includes('mail')) return <Icon name="mail" size={size} />
  if (key.includes('x') || key.includes('twitter')) return svg(<path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3l-5-7.2L6.2 22H3.1l7.3-8.4L2.8 2h6.4l4.5 6.5Z" />)
  return <Icon name="link" size={size} />
}

function App() {
  const [route, setRoute] = useState(location.hash.replace('#', '') || 'home')
  const [settings, setSettings] = useState(defaultSettings)
  const [socials, setSocials] = useState(fallbackSocials)
  const [voices, setVoices] = useState(fallbackVoices)
  const [legalPages, setLegalPages] = useState(defaultLegal)
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [jobs, setJobs] = useState([])
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(false)

  function notify(message) {
    setToast(message)
    window.clearTimeout(window.__toastTimer)
    window.__toastTimer = window.setTimeout(() => setToast(''), 4200)
  }

  useEffect(() => {
    const onHash = () => setRoute(location.hash.replace('#', '') || 'home')
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    if (!hasSupabaseConfig) return
    boot()
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      if (nextSession?.user) {
        loadProfile(nextSession.user.id)
        loadJobs(nextSession.user.id)
      } else {
        setProfile(null)
        setJobs([])
      }
    })
    return () => data.subscription.unsubscribe()
  }, [])

  async function boot() {
    setLoading(true)
    try {
      const { data: sessionRes } = await supabase.auth.getSession()
      setSession(sessionRes.session)
      await loadContent()
      if (sessionRes.session?.user) {
        await loadProfile(sessionRes.session.user.id)
        await loadJobs(sessionRes.session.user.id)
      }
    } catch (err) {
      notify(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function loadContent() {
    const [settingsRes, socialRes, voicesRes, legalRes] = await Promise.all([
      supabase.from('site_settings').select('value').eq('key', 'site').maybeSingle(),
      supabase.from('social_links').select('*').order('sort_order', { ascending: true }),
      supabase.from('voice_presets').select('*').order('sort_order', { ascending: true }),
      supabase.from('legal_pages').select('*').order('sort_order', { ascending: true })
    ])
    if (settingsRes.data?.value) setSettings({ ...defaultSettings, ...settingsRes.data.value })
    if (socialRes.data?.length) setSocials(socialRes.data)
    if (voicesRes.data?.length) setVoices(voicesRes.data)
    if (legalRes.data?.length) setLegalPages(legalRes.data)
  }

  async function loadProfile(userId) {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    if (error) throw error
    setProfile(data)
    return data
  }

  async function loadJobs(userId) {
    if (!userId) return
    const { data } = await supabase.from('tts_jobs').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(30)
    setJobs(data || [])
  }

  function go(next) { location.hash = next }

  const isAdmin = profile?.role === 'admin' && profile?.status === 'active'
  const activeVoices = voices.filter(v => v.is_active !== false)
  const activeSocials = socials.filter(s => s.is_active !== false)

  return (
    <div className="app" dir="rtl">
      {toast && <div className="toast">{toast}</div>}
      <Header route={route} go={go} settings={settings} session={session} profile={profile} onSignOut={async () => { await supabase?.auth.signOut(); notify('تم تسجيل الخروج') }} />
      {settings.maintenance_mode && <Banner danger text="الخدمة في وضع صيانة مؤقت. بعض الوظائف قد لا تكون متاحة الآن." />}
      {route === 'home' && <Home settings={settings} socials={activeSocials} voices={activeVoices} go={go} />}
      {route === 'studio' && <Studio settings={settings} voices={activeVoices} session={session} profile={profile} notify={notify} onJob={() => session?.user && loadJobs(session.user.id)} />}
      {route === 'voices' && <Voices voices={activeVoices} go={go} />}
      {route === 'pricing' && <Pricing settings={settings} go={go} />}
      {route === 'dashboard' && <Dashboard session={session} profile={profile} jobs={jobs} go={go} notify={notify} />}
      {route === 'admin' && <Admin session={session} profile={profile} isAdmin={isAdmin} settings={settings} setSettings={setSettings} socials={socials} setSocials={setSocials} voices={voices} setVoices={setVoices} legalPages={legalPages} setLegalPages={setLegalPages} notify={notify} reloadContent={loadContent} />}
      {(routeToLegal[route] || route === 'legal') && <Legal legalPages={legalPages} settings={settings} slug={routeToLegal[route]} />}
      {(route === 'contact' || route === 'support') && <Contact session={session} settings={settings} socials={activeSocials} notify={notify} />}
      <Footer settings={settings} socials={activeSocials} legalPages={legalPages} go={go} />
      {loading && <div className="loading">تحميل...</div>}
    </div>
  )
}

function Header({ route, go, settings, session, profile, onSignOut }) {
  const [open, setOpen] = useState(false)
  const links = [
    ['home', 'الرئيسية'], ['studio', 'الاستوديو'], ['voices', 'الأصوات'], ['pricing', 'الخطة'], ['about', 'من نحن'], ['support', 'الدعم']
  ]
  return <header className="header">
    <button className="brand" onClick={() => go('home')}>
      <span className="logo"><Icon name="wave" size={25} /></span>
      <span><b>{settings.brand_name}</b><small>{settings.site_domain}</small></span>
    </button>
    <nav className={cx('nav', open && 'open')}>
      {links.map(([id, label]) => <button key={id} onClick={() => { go(id); setOpen(false) }} className={route === id ? 'active' : ''}>{label}</button>)}
      {session && <button onClick={() => { go('dashboard'); setOpen(false) }} className={route === 'dashboard' ? 'active' : ''}>حسابي</button>}
      {profile?.role === 'admin' && <button onClick={() => { go('admin'); setOpen(false) }} className={route === 'admin' ? 'active admin-link' : 'admin-link'}>الإدارة</button>}
    </nav>
    <div className="actions">
      {session ? <button className="ghost" onClick={onSignOut}>خروج</button> : <button className="primary small" onClick={() => go('dashboard')}>دخول</button>}
      <button className="menu" onClick={() => setOpen(!open)} aria-label="القائمة">☰</button>
    </div>
  </header>
}

function Banner({ text, danger }) { return <div className={cx('banner', danger && 'danger')}>{text}</div> }
function SectionTitle({ eyebrow, title, text }) { return <div className="title"><span>{eyebrow}</span><h2>{title}</h2>{text && <p>{text}</p>}</div> }
function Stat({ n, t }) { return <div className="stat"><b>{n}</b><span>{t}</span></div> }
function Card({ icon = 'spark', title, text }) { return <div className="card"><div className="cardIcon"><Icon name={icon} /></div><h3>{title}</h3><p>{text}</p></div> }

function Home({ settings, socials, voices, go }) {
  return <main>
    <section className="hero">
      <div className="heroText">
        <div className="pill"><Icon name="spark" size={18} /> {settings.announcement}</div>
        <h1>{settings.hero_title}</h1>
        <p>{settings.hero_subtitle}</p>
        <div className="heroActions">
          <button className="primary" onClick={() => go('studio')}><Icon name="mic" />{settings.cta_primary}</button>
          <button className="secondary" onClick={() => go('voices')}>{settings.cta_secondary}</button>
        </div>
        <div className="stats"><Stat n="WAV" t="إخراج مستقر" /><Stat n="XTTS" t="محرك الصوت" /><Stat n="Admin" t="إدارة كاملة" /></div>
      </div>
      <div className="glass preview">
        <div className="previewHeader"><span><Icon name="wave" /></span><div><b>استوديو عربي</b><small>تحويل مباشر إلى ملف صوتي</small></div></div>
        <div className="waveBars"><i /><i /><i /><i /><i /><i /><i /></div>
        <div className="miniSteps"><span>النص</span><span>الصوت</span><span>WAV</span></div>
        <button className="primary wide" onClick={() => go('studio')}><Icon name="play" /> افتح الاستوديو</button>
      </div>
    </section>

    <section className="section">
      <SectionTitle eyebrow="منصة جاهزة للإطلاق" title="واجهة واضحة بدون رسائل داخلية للمستخدم" text="الزائر يرى خدمة رسمية فقط: تحويل، أصوات فعلية، خطط واضحة، دعم، وصفحات قانونية. التفاصيل التقنية تظهر داخل لوحة الإدارة فقط." />
      <div className="grid4">
        <Card icon="mic" title="تحويل عربي" text="واجهة مخصصة للنص العربي مع عداد حروف وسرعة قراءة وتحميل WAV." />
        <Card icon="user" title="حساب مستخدم" text="تسجيل دخول، بيانات حساب، وسجل تحويلات عند ربط Supabase." />
        <Card icon="settings" title="لوحة إدارة" text="إدارة الموقع والروابط والخطط والصفحات والأصوات من مكان واحد." />
        <Card icon="shield" title="ثقة وقانون" text="شروط وخصوصية وإخلاء مسؤولية ودعم وسياسة أصوات واضحة." />
      </div>
    </section>

    <section className="section split">
      <div><SectionTitle eyebrow="الأصوات" title="اعرض فقط الأصوات المتوفرة فعليًا" text="كل بطاقة صوت في الموقع يجب أن تقابل ملف WAV مرجعيًا موجودًا على خادم XTTS، لا مجرد أسماء وهمية." /><button className="secondary" onClick={() => go('voices')}>عرض الأصوات</button></div>
      <div className="voiceList">{voices.slice(0, 2).map(v => <VoiceCard key={v.id} v={v} />)}</div>
    </section>

    <section className="section compact">
      <SectionTitle eyebrow="تابعنا" title="روابط التواصل تظهر كأيقونات فقط" text="يمكن تعديل الرابط والاسم والأيقونة والترتيب من لوحة الإدارة." />
      <SocialIconRow socials={socials} />
    </section>
  </main>
}

function VoiceCard({ v, compact = false }) {
  return <div className={cx('voiceCard', compact && 'compact')}>
    <div className="voiceTop"><div className="voiceAvatar"><Icon name="mic" /></div><span>{v.language || 'ar'}</span></div>
    <h3>{v.name}</h3>
    <small>{v.accent || 'عربي'}</small>
    <p>{v.description}</p>
    {v.model_voice_id && <em>ملف الصوت: {v.model_voice_id}</em>}
  </div>
}

function SocialIconRow({ socials }) {
  return <div className="socialIconRow">{socials.map(s => <a className="socialButton" href={s.url} target="_blank" rel="noreferrer" key={s.id} title={s.label || s.platform} aria-label={s.label || s.platform}><SocialIcon icon={s.icon || s.platform} /></a>)}</div>
}

function Studio({ settings, voices, session, onJob, notify }) {
  const [text, setText] = useState('مرحبًا، هذه تجربة لتحويل النص العربي إلى صوت طبيعي وواضح باستخدام الذكاء الاصطناعي.')
  const [voice, setVoice] = useState(voices[0]?.id || 'default')
  const [speed, setSpeed] = useState(1)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const limit = session ? safeNumber(settings.max_chars_user, 2500) : safeNumber(settings.max_chars_guest, 300)
  const selectedVoice = voices.find(v => v.id === voice) || voices[0] || fallbackVoices[0]

  useEffect(() => { if (!voices.find(v => v.id === voice) && voices[0]) setVoice(voices[0].id) }, [voices])

  async function saveJob(status, extra = {}) {
    if (!hasSupabaseConfig || !session?.user) return
    await supabase.from('tts_jobs').insert({
      user_id: session.user.id,
      input_text: text,
      voice_id: selectedVoice?.model_voice_id || 'default',
      format: 'wav',
      speed: Number(speed || 1),
      chars: text.length,
      status,
      ...extra
    })
    onJob?.()
  }

  async function generate() {
    if (!text.trim()) return notify('اكتب النص أولًا')
    if (text.length > limit) return notify(`النص أطول من الحد المسموح: ${limit} حرف`)
    const directUrl = import.meta.env.VITE_XTTS_API_URL
    if (!directUrl) return notify('خدمة توليد الصوت غير مفعلة حاليًا')
    setBusy(true)
    setResult(null)
    try {
      const response = await fetch(directUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          language: selectedVoice?.language || 'ar',
          voice_id: selectedVoice?.model_voice_id || 'default',
          speed: Number(speed || 1),
          format: 'wav',
          return_base64: true
        })
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.detail || payload.error || `XTTS server returned ${response.status}`)
      if (!payload.audio_base64) throw new Error('لم يرجع محرك الصوت ملفًا صالحًا')
      const data = { ok: true, audio_base64: payload.audio_base64, content_type: 'audio/wav', message: 'تم توليد الصوت بنجاح.' }
      setResult(data)
      downloadBase64Audio(payload.audio_base64, `sawti-${Date.now()}.wav`, 'audio/wav')
      await saveJob('completed')
      notify('تم توليد وتحميل الصوت')
    } catch (err) {
      await saveJob('failed', { error: err.message })
      notify(err.message || 'فشل توليد الصوت')
    } finally {
      setBusy(false)
    }
  }

  return <main className="page">
    <SectionTitle eyebrow="استوديو التحويل" title="حوّل النص إلى كلام" text="اكتب النص، اختر الصوت المتاح، ثم حمّل ملف WAV مباشرة." />
    <div className="studioGrid">
      <section className="panel studioPanel">
        <label>النص العربي</label>
        <textarea value={text} onChange={e => setText(e.target.value)} maxLength={limit + 1000} placeholder="اكتب النص هنا..." />
        <div className={cx('counter', text.length > limit && 'danger')}>{text.length} / {limit} حرف</div>
        <div className="formGrid">
          <Field label="الصوت">
            <select value={voice} onChange={e => setVoice(e.target.value)}>{voices.map(v => <option key={v.id} value={v.id}>{v.name} — {v.accent}</option>)}</select>
          </Field>
          <Field label={`السرعة ${speed}x`}>
            <input type="range" min="0.7" max="1.3" step="0.1" value={speed} onChange={e => setSpeed(e.target.value)} />
          </Field>
        </div>
        <div className="formatBadge"><Icon name="file" size={18} /> صيغة الإخراج الحالية: WAV</div>
        <button className="primary wide large" onClick={generate} disabled={busy}>{busy ? 'جاري التوليد...' : <><Icon name="download" /> توليد وتحميل الصوت</>}</button>
        {result && <ResultBox result={result} />}
      </section>
      <aside className="panel sideCard">
        <h3>الصوت المحدد</h3>
        <VoiceCard v={selectedVoice} compact />
        <div className="noteBox"><Icon name="shield" size={18} /> استخدم فقط أصواتًا تملك حق استعمالها.</div>
        <button className="secondary wide" onClick={() => location.hash = session ? 'dashboard' : 'dashboard'}>{session ? 'فتح سجل التحويلات' : 'تسجيل الدخول لحفظ السجل'}</button>
      </aside>
    </div>
  </main>
}
function Field({ label, children }) { return <div className="field"><label>{label}</label>{children}</div> }
function ResultBox({ result }) { return <div className="result"><b>الصوت جاهز</b><p>{result.message}</p>{result.audio_base64 && <audio controls src={`data:audio/wav;base64,${result.audio_base64}`} />}</div> }

function Voices({ voices, go }) {
  return <main className="page">
    <SectionTitle eyebrow="الأصوات" title="الأصوات المتاحة فعليًا" text="كل صوت هنا مرتبط بملف WAV مرجعي على خادم XTTS. عند إضافة ملف صوتي جديد على Hugging Face، أضف بياناته من لوحة الإدارة." />
    <div className="grid3">{voices.map(v => <VoiceCard key={v.id} v={v} />)}</div>
    <div className="centerBlock"><button className="primary" onClick={() => go('studio')}><Icon name="mic" /> جرّب أحد الأصوات</button></div>
  </main>
}

function Pricing({ settings, go }) {
  return <main className="page">
    <SectionTitle eyebrow="الخطة" title="خطة واضحة بدون تعقيد" text="الخدمة مجانية، ومن يريد دعم استمرارها يمكنه التبرع عبر الرابط الذي تحدده من لوحة الإدارة." />
    <div className="pricingGrid">
      <Plan icon="check" name={settings.free_plan_title || 'الخطة المجانية'} price="مجاني" items={[`حتى ${settings.max_chars_guest} حرف للزائر`, `حتى ${settings.max_chars_user} حرف للمستخدم`, 'تحميل WAV', 'استخدام عادل للخدمة']} action="ابدأ الآن" onClick={() => go('studio')} featured />
      {settings.donation_enabled && <Plan icon="heart" name="الدعم الاختياري" price={`${settings.donation_amount || 5} ${settings.donation_currency || 'USD'}`} items={[settings.donation_description || 'ادعم استمرار الخدمة', `الدفع عبر ${settings.donation_provider || 'PayPal'}`, 'لا يغيّر الخطة الحالية', 'يساعد في تحسين الخدمة']} action={settings.donation_button_text || 'تبرع الآن'} href={settings.donation_url} />}
    </div>
  </main>
}
function Plan({ icon, name, price, items, action, onClick, href, featured }) {
  const Button = href ? 'a' : 'button'
  return <div className={cx('plan', featured && 'featured')}>
    <div className="planIcon"><Icon name={icon} /></div><h3>{name}</h3><b>{price}</b>
    {items.map(i => <p key={i}><Icon name="check" size={16} /> {i}</p>)}
    <Button className={featured ? 'dark wide' : 'primary wide'} onClick={onClick} href={href || undefined} target={href ? '_blank' : undefined} rel="noreferrer">{action}</Button>
  </div>
}

function Dashboard({ session, profile, jobs, go, notify }) {
  if (!hasSupabaseConfig) return <AuthNeeded title="الحسابات غير مفعلة" text="يلزم ربط Supabase لتفعيل التسجيل ولوحة الحساب." />
  if (!session) return <AuthBox notify={notify} />
  const totalChars = jobs.reduce((sum, job) => sum + safeNumber(job.chars, 0), 0)
  const completed = jobs.filter(j => j.status === 'completed').length
  return <main className="page">
    <SectionTitle eyebrow="حسابي" title="لوحة الحساب" text="إدارة حسابك ومراجعة سجل التحويلات الخاصة بك." />
    <div className="accountHero panel">
      <div className="profileBadge"><Icon name="user" size={36} /></div>
      <div><h2>{profile?.full_name || session.user.email}</h2><p>{session.user.email}</p></div>
      <button className="secondary" onClick={() => go('studio')}>تحويل جديد</button>
    </div>
    <div className="grid4">
      <Card icon="file" title={jobs.length} text="كل الطلبات" />
      <Card icon="check" title={completed} text="طلبات مكتملة" />
      <Card icon="wave" title={totalChars.toLocaleString('ar')} text="إجمالي الحروف" />
      <Card icon="shield" title={profile?.status || 'active'} text="حالة الحساب" />
    </div>
    <div className="panel"><div className="panelTitle"><h3>سجل التحويلات</h3><button className="secondary small" onClick={() => go('studio')}>طلب جديد</button></div><Table rows={jobs} cols={[[ 'created_at', 'التاريخ', fmtDate ], [ 'input_text', 'النص', v => (v || '').slice(0, 80) ], [ 'voice_id', 'الصوت' ], [ 'status', 'الحالة' ], [ 'format', 'الصيغة' ]]} empty="لا توجد تحويلات بعد." /></div>
    {profile?.role === 'admin' && <button className="primary" onClick={() => go('admin')}>فتح لوحة الإدارة</button>}
  </main>
}
function AuthNeeded({ title, text }) { return <main className="page"><div className="panel center"><h2>{title}</h2><p>{text}</p></div></main> }
function AuthBox({ notify }) {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(e) {
    e.preventDefault(); setBusy(true)
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })
        if (error) throw error
        notify('تم إنشاء الحساب. تحقق من بريدك إذا كان تأكيد البريد مفعّلًا.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        notify('تم تسجيل الدخول')
      }
    } catch (err) { notify(err.message) } finally { setBusy(false) }
  }
  return <main className="page authPage"><div className="auth panel"><div className="authIcon"><Icon name="user" /></div><h2>{mode === 'signin' ? 'تسجيل الدخول' : 'إنشاء حساب'}</h2><form onSubmit={submit}>{mode === 'signup' && <input placeholder="الاسم" value={name} onChange={e => setName(e.target.value)} />}<input placeholder="البريد الإلكتروني" value={email} onChange={e => setEmail(e.target.value)} /><input type="password" placeholder="كلمة المرور" value={password} onChange={e => setPassword(e.target.value)} /><button className="primary wide" disabled={busy}>{busy ? 'انتظر...' : mode === 'signin' ? 'دخول' : 'إنشاء حساب'}</button></form><button className="link" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>{mode === 'signin' ? 'ليس لديك حساب؟ أنشئ حسابًا' : 'لديك حساب؟ سجّل الدخول'}</button></div></main>
}

function Admin(props) {
  const { session, isAdmin } = props
  const [tab, setTab] = useState('overview')
  if (!hasSupabaseConfig) return <AuthNeeded title="Supabase غير متصل" text="لوحة الإدارة تحتاج ربط Supabase أولًا." />
  if (!session) return <AuthBox notify={props.notify} />
  if (!isAdmin) return <AuthNeeded title="غير مصرح" text="هذه الصفحة مخصصة للمدير فقط." />
  const tabs = [
    ['overview', 'نظرة عامة', 'settings'], ['site', 'الموقع', 'settings'], ['payments', 'الدعم المالي', 'heart'], ['socials', 'التواصل', 'link'], ['voices', 'الأصوات', 'mic'], ['users', 'المستخدمون', 'users'], ['jobs', 'التحويلات', 'file'], ['tickets', 'الدعم', 'mail'], ['pages', 'الصفحات', 'file'], ['system', 'النظام', 'shield']
  ]
  return <main className="page admin"><SectionTitle eyebrow="Admin" title="لوحة الإدارة" text="كل إعدادات الموقع والمحتوى من هنا." /><div className="adminLayout"><aside className="adminTabs">{tabs.map(([id, label, icon]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}><Icon name={icon} size={18} /> {label}</button>)}</aside><section className="adminContent">{tab === 'overview' && <AdminOverview {...props} />}{tab === 'site' && <AdminSettings {...props} />}{tab === 'payments' && <AdminPayments {...props} />}{tab === 'socials' && <AdminSocials {...props} />}{tab === 'voices' && <AdminVoices {...props} />}{tab === 'users' && <AdminUsers session={session} notify={props.notify} />}{tab === 'jobs' && <AdminJobs notify={props.notify} />}{tab === 'tickets' && <AdminTickets notify={props.notify} />}{tab === 'pages' && <AdminLegal {...props} />}{tab === 'system' && <AdminSystem />}</section></div></main>
}
function AdminOverview({ settings, socials, voices }) { return <div><div className="grid4"><Card icon="settings" title={settings.brand_name} text="اسم الموقع" /><Card icon="link" title={socials.length} text="رابط تواصل" /><Card icon="mic" title={voices.length} text="صوت في قاعدة البيانات" /><Card icon="heart" title={settings.donation_enabled ? 'مفعل' : 'متوقف'} text="الدعم المالي" /></div><div className="panel"><h3>ملاحظات إدارية</h3><p>تعدد الأصوات في XTTS لا يتم من خلال رقم سحري. كل صوت حقيقي يحتاج ملف WAV مرجعيًا داخل خادم Hugging Face، ثم تربطه من تبويب الأصوات باسم الملف.</p></div></div> }
function AdminSettings({ settings, setSettings, notify }) {
  const [draft, setDraft] = useState(settings)
  useEffect(() => setDraft(settings), [settings])
  async function save() { try { const { error } = await supabase.from('site_settings').upsert({ key: 'site', value: draft, updated_at: new Date().toISOString() }); if (error) throw error; setSettings(draft); notify('تم حفظ إعدادات الموقع') } catch (e) { notify(e.message) } }
  return <div className="panel adminForm"><h3>إعدادات الموقع العامة</h3><div className="formGrid"><Field label="اسم الموقع"><input value={draft.brand_name || ''} onChange={e => setDraft({ ...draft, brand_name: e.target.value })} /></Field><Field label="الدومين"><input value={draft.site_domain || ''} onChange={e => setDraft({ ...draft, site_domain: e.target.value })} /></Field><Field label="بريد الدعم"><input value={draft.support_email || ''} onChange={e => setDraft({ ...draft, support_email: e.target.value })} /></Field><Field label="البريد القانوني"><input value={draft.legal_email || ''} onChange={e => setDraft({ ...draft, legal_email: e.target.value })} /></Field></div><Field label="عنوان الصفحة الرئيسية"><input value={draft.hero_title || ''} onChange={e => setDraft({ ...draft, hero_title: e.target.value })} /></Field><Field label="وصف الصفحة الرئيسية"><textarea value={draft.hero_subtitle || ''} onChange={e => setDraft({ ...draft, hero_subtitle: e.target.value })} /></Field><Field label="رسالة صغيرة أعلى العنوان"><input value={draft.announcement || ''} onChange={e => setDraft({ ...draft, announcement: e.target.value })} /></Field><div className="formGrid"><Field label="حد حروف الزائر"><input type="number" value={draft.max_chars_guest || 300} onChange={e => setDraft({ ...draft, max_chars_guest: Number(e.target.value) })} /></Field><Field label="حد حروف المستخدم"><input type="number" value={draft.max_chars_user || 2500} onChange={e => setDraft({ ...draft, max_chars_user: Number(e.target.value) })} /></Field></div><label className="check"><input type="checkbox" checked={!!draft.maintenance_mode} onChange={e => setDraft({ ...draft, maintenance_mode: e.target.checked })} /> تفعيل وضع الصيانة</label><button className="primary" onClick={save}>حفظ إعدادات الموقع</button></div>
}
function AdminPayments({ settings, setSettings, notify }) {
  const [draft, setDraft] = useState(settings)
  useEffect(() => setDraft(settings), [settings])
  async function save() { try { const { error } = await supabase.from('site_settings').upsert({ key: 'site', value: draft, updated_at: new Date().toISOString() }); if (error) throw error; setSettings(draft); notify('تم حفظ إعدادات الدعم المالي') } catch (e) { notify(e.message) } }
  return <div className="panel adminForm"><h3>الخطة والتبرع</h3><label className="check"><input type="checkbox" checked={!!draft.donation_enabled} onChange={e => setDraft({ ...draft, donation_enabled: e.target.checked })} /> إظهار خيار التبرع</label><div className="formGrid"><Field label="قيمة التبرع"><input type="number" value={draft.donation_amount || 5} onChange={e => setDraft({ ...draft, donation_amount: Number(e.target.value) })} /></Field><Field label="العملة"><input value={draft.donation_currency || 'USD'} onChange={e => setDraft({ ...draft, donation_currency: e.target.value })} /></Field><Field label="مزود الدفع"><input value={draft.donation_provider || 'PayPal'} onChange={e => setDraft({ ...draft, donation_provider: e.target.value })} /></Field><Field label="نص الزر"><input value={draft.donation_button_text || ''} onChange={e => setDraft({ ...draft, donation_button_text: e.target.value })} /></Field></div><Field label="رابط الدفع"><input value={draft.donation_url || ''} onChange={e => setDraft({ ...draft, donation_url: e.target.value })} /></Field><Field label="وصف التبرع"><textarea value={draft.donation_description || ''} onChange={e => setDraft({ ...draft, donation_description: e.target.value })} /></Field><button className="primary" onClick={save}>حفظ الخطة والتبرع</button></div>
}
function AdminSocials({ socials, setSocials, notify }) {
  const empty = { platform: '', icon: 'website', label: '', url: '', sort_order: socials.length + 1, is_active: true }
  const [editing, setEditing] = useState(empty)
  function edit(row) { setEditing({ ...row }) }
  async function save() { try { const payload = { ...editing, sort_order: safeNumber(editing.sort_order, 1), is_active: editing.is_active !== false }; let result; if (payload.id) result = await supabase.from('social_links').update(payload).eq('id', payload.id).select('*').single(); else result = await supabase.from('social_links').insert(payload).select('*').single(); if (result.error) throw result.error; const saved = result.data; setSocials(payload.id ? socials.map(s => s.id === saved.id ? saved : s) : [...socials, saved]); setEditing(empty); notify('تم حفظ رابط التواصل') } catch (e) { notify(e.message) } }
  async function remove(row, hard = false) { try { const res = hard ? await supabase.from('social_links').delete().eq('id', row.id) : await supabase.from('social_links').update({ is_active: false }).eq('id', row.id); if (res.error) throw res.error; setSocials(hard ? socials.filter(s => s.id !== row.id) : socials.map(s => s.id === row.id ? { ...s, is_active: false } : s)); notify(hard ? 'تم الحذف النهائي' : 'تم إخفاء الرابط') } catch (e) { notify(e.message) } }
  return <div className="adminGrid"><div className="panel adminForm"><h3>{editing.id ? 'تعديل رابط' : 'إضافة رابط'}</h3><div className="formGrid"><Field label="المنصة"><input value={editing.platform || ''} onChange={e => setEditing({ ...editing, platform: e.target.value })} /></Field><Field label="الأيقونة"><select value={editing.icon || 'website'} onChange={e => setEditing({ ...editing, icon: e.target.value })}>{socialOptions.map(x => <option key={x} value={x}>{x}</option>)}</select></Field></div><Field label="الرابط"><input value={editing.url || ''} onChange={e => setEditing({ ...editing, url: e.target.value })} /></Field><div className="formGrid"><Field label="اسم داخلي / وصف"><input value={editing.label || ''} onChange={e => setEditing({ ...editing, label: e.target.value })} /></Field><Field label="الترتيب"><input type="number" value={editing.sort_order || 1} onChange={e => setEditing({ ...editing, sort_order: Number(e.target.value) })} /></Field></div><label className="check"><input type="checkbox" checked={editing.is_active !== false} onChange={e => setEditing({ ...editing, is_active: e.target.checked })} /> مفعل</label><div className="rowActions"><button className="primary" onClick={save}>حفظ</button><button className="secondary" onClick={() => setEditing(empty)}>جديد</button></div></div><div className="panel"><h3>روابط التواصل</h3><div className="socialAdminList">{socials.map(s => <div className="socialAdminItem" key={s.id}><span className="socialButton"><SocialIcon icon={s.icon || s.platform} /></span><div><b>{s.platform}</b><small>{s.url}</small><em>{s.is_active ? 'ظاهر' : 'مخفي'}</em></div><div className="rowActions"><button onClick={() => edit(s)}>تعديل</button><button onClick={() => remove(s)}>إخفاء</button><button onClick={() => remove(s, true)}>حذف</button></div></div>)}</div></div></div>
}
function AdminVoices({ voices, setVoices, notify }) {
  const empty = { name: '', language: 'ar', accent: '', description: '', model_voice_id: 'default', sample_text: '', sort_order: voices.length + 1, is_active: true }
  const [editing, setEditing] = useState(empty)
  function edit(row) { setEditing({ ...row }) }
  async function save() { try { const payload = { ...editing, sort_order: safeNumber(editing.sort_order, 1), is_active: editing.is_active !== false }; let result; if (payload.id) result = await supabase.from('voice_presets').update(payload).eq('id', payload.id).select('*').single(); else result = await supabase.from('voice_presets').insert(payload).select('*').single(); if (result.error) throw result.error; const saved = result.data; setVoices(payload.id ? voices.map(v => v.id === saved.id ? saved : v) : [...voices, saved]); setEditing(empty); notify('تم حفظ الصوت') } catch (e) { notify(e.message) } }
  async function remove(row) { try { const { error } = await supabase.from('voice_presets').update({ is_active: false }).eq('id', row.id); if (error) throw error; setVoices(voices.map(v => v.id === row.id ? { ...v, is_active: false } : v)); notify('تم إخفاء الصوت') } catch (e) { notify(e.message) } }
  return <div className="adminGrid"><div className="panel adminForm"><h3>{editing.id ? 'تعديل صوت' : 'إضافة صوت'}</h3><div className="noteBox"><Icon name="alert" size={18} /> تعدد الأصوات في XTTS يعني وجود ملفات WAV متعددة داخل Hugging Face Space، مثل default.wav وlayan.wav. هنا تكتب اسم الملف بدون ‎.wav أو معه.</div><div className="formGrid"><Field label="اسم الصوت الظاهر"><input value={editing.name || ''} onChange={e => setEditing({ ...editing, name: e.target.value })} /></Field><Field label="اللغة"><input value={editing.language || 'ar'} onChange={e => setEditing({ ...editing, language: e.target.value })} /></Field><Field label="اللهجة / الأسلوب"><input value={editing.accent || ''} onChange={e => setEditing({ ...editing, accent: e.target.value })} /></Field><Field label="ملف الصوت المرجعي على الخادم"><input value={editing.model_voice_id || 'default'} onChange={e => setEditing({ ...editing, model_voice_id: e.target.value })} placeholder="default أو layan.wav" /></Field></div><Field label="الوصف"><textarea value={editing.description || ''} onChange={e => setEditing({ ...editing, description: e.target.value })} /></Field><div className="formGrid"><Field label="نص تجربة اختياري"><input value={editing.sample_text || ''} onChange={e => setEditing({ ...editing, sample_text: e.target.value })} /></Field><Field label="الترتيب"><input type="number" value={editing.sort_order || 1} onChange={e => setEditing({ ...editing, sort_order: Number(e.target.value) })} /></Field></div><label className="check"><input type="checkbox" checked={editing.is_active !== false} onChange={e => setEditing({ ...editing, is_active: e.target.checked })} /> مفعل</label><div className="rowActions"><button className="primary" onClick={save}>حفظ الصوت</button><button className="secondary" onClick={() => setEditing(empty)}>جديد</button></div></div><div className="panel"><h3>الأصوات</h3><div className="voiceList">{voices.map(v => <div className="voiceManage" key={v.id}><VoiceCard v={v} compact /><div className="rowActions"><button onClick={() => edit(v)}>تعديل</button><button onClick={() => remove(v)}>إخفاء</button></div></div>)}</div></div></div>
}
function AdminUsers({ session, notify }) { const [rows, setRows] = useState([]); const [loading, setLoading] = useState(false); async function load() { setLoading(true); try { const data = await callFunction('admin-users', { action: 'list' }, session.access_token); setRows(data.users || []) } catch (e) { notify(e.message) } finally { setLoading(false) } } useEffect(() => { load() }, []); async function updateUser(row, patch) { try { await callFunction('admin-users', { action: 'update', user_id: row.id, patch }, session.access_token); setRows(rows.map(r => r.id === row.id ? { ...r, ...patch } : r)); notify('تم تحديث المستخدم') } catch (e) { notify(e.message) } } return <div className="panel"><div className="panelTitle"><h3>إدارة المستخدمين</h3><button className="secondary small" onClick={load}>{loading ? 'تحميل...' : 'تحديث'}</button></div><Table rows={rows} cols={[[ 'email', 'البريد' ], [ 'full_name', 'الاسم' ], [ 'role', 'الدور' ], [ 'status', 'الحالة' ], [ 'created_at', 'التسجيل', fmtDate ], [ 'x', 'إجراء', (_v, row) => <div className="rowActions"><button onClick={() => updateUser(row, { role: row.role === 'admin' ? 'user' : 'admin' })}>{row.role === 'admin' ? 'إزالة Admin' : 'جعله Admin'}</button><button onClick={() => updateUser(row, { status: row.status === 'blocked' ? 'active' : 'blocked' })}>{row.status === 'blocked' ? 'تفعيل' : 'حظر'}</button></div> ]]} empty="لا يوجد مستخدمون" /></div> }
function AdminJobs({ notify }) { const [rows, setRows] = useState([]); useEffect(() => { supabase.from('tts_jobs').select('*, profiles(email)').order('created_at', { ascending: false }).limit(100).then(({ data, error }) => error ? notify(error.message) : setRows(data || [])) }, []); return <div className="panel"><h3>كل التحويلات</h3><Table rows={rows} cols={[[ 'created_at', 'التاريخ', fmtDate ], [ 'profiles', 'المستخدم', v => v?.email || '-' ], [ 'input_text', 'النص', v => (v || '').slice(0, 70) ], [ 'voice_id', 'الصوت' ], [ 'status', 'الحالة' ], [ 'format', 'الصيغة' ]]} empty="لا توجد تحويلات" /></div> }
function AdminTickets({ notify }) { const [rows, setRows] = useState([]); useEffect(() => { supabase.from('support_tickets').select('*').order('created_at', { ascending: false }).limit(100).then(({ data, error }) => error ? notify(error.message) : setRows(data || [])) }, []); async function close(id) { const { error } = await supabase.from('support_tickets').update({ status: 'closed' }).eq('id', id); if (error) notify(error.message); else setRows(rows.map(r => r.id === id ? { ...r, status: 'closed' } : r)) } return <div className="panel"><h3>رسائل الدعم</h3><Table rows={rows} cols={[[ 'created_at', 'التاريخ', fmtDate ], [ 'email', 'البريد' ], [ 'topic', 'الموضوع' ], [ 'message', 'الرسالة', v => (v || '').slice(0, 100) ], [ 'status', 'الحالة' ], [ 'x', 'إجراء', (_v, row) => <button onClick={() => close(row.id)}>إغلاق</button> ]]} empty="لا توجد رسائل" /></div> }
function AdminLegal({ legalPages, setLegalPages, notify }) { const [selected, setSelected] = useState(legalPages[0]?.slug || 'about'); const page = legalPages.find(p => p.slug === selected) || legalPages[0] || {}; const [draft, setDraft] = useState(page); useEffect(() => { setDraft(legalPages.find(p => p.slug === selected) || {}) }, [selected, legalPages]); async function save() { try { const { error } = await supabase.from('legal_pages').update({ title: draft.title, body: draft.body, updated_at: new Date().toISOString() }).eq('slug', selected); if (error) throw error; setLegalPages(legalPages.map(p => p.slug === selected ? { ...p, title: draft.title, body: draft.body } : p)); notify('تم حفظ الصفحة') } catch (e) { notify(e.message) } } return <div className="panel adminForm"><h3>إدارة الصفحات</h3><Field label="الصفحة"><select value={selected} onChange={e => setSelected(e.target.value)}>{legalPages.map(p => <option key={p.slug} value={p.slug}>{p.title}</option>)}</select></Field><Field label="العنوان"><input value={draft.title || ''} onChange={e => setDraft({ ...draft, title: e.target.value })} /></Field><Field label="المحتوى"><textarea className="tall" value={draft.body || ''} onChange={e => setDraft({ ...draft, body: e.target.value })} /></Field><button className="primary" onClick={save}>حفظ الصفحة</button></div> }
function AdminSystem() { return <div className="panel"><h3>حالة الربط</h3><div className="systemGrid"><StatusLine label="Supabase" ok={hasSupabaseConfig} /><StatusLine label="XTTS Direct URL" ok={!!import.meta.env.VITE_XTTS_API_URL} /><StatusLine label="Public Site URL" ok={!!import.meta.env.VITE_PUBLIC_SITE_URL} /></div><div className="noteBox"><Icon name="alert" size={18} /> لا تعرض هذه المعلومات في صفحات المستخدمين. تظهر هنا فقط للمدير.</div></div> }
function StatusLine({ label, ok }) { return <div className={cx('statusLine', ok ? 'ok' : 'bad')}><span>{label}</span><b>{ok ? 'مفعّل' : 'غير مفعّل'}</b></div> }

function Table({ rows, cols, empty }) { if (!rows?.length) return <p className="empty">{empty}</p>; return <div className="tableWrap"><table><thead><tr>{cols.map(c => <th key={c[1]}>{c[1]}</th>)}</tr></thead><tbody>{rows.map((r, i) => <tr key={r.id || i}>{cols.map(([key, _label, render]) => <td key={key}>{render ? render(r[key], r) : String(r[key] ?? '-')}</td>)}</tr>)}</tbody></table></div> }

function Legal({ legalPages, settings, slug }) {
  const pages = slug ? legalPages.filter(p => p.slug === slug) : legalPages
  const title = slug ? (pages[0]?.title || 'الصفحة') : 'الصفحات القانونية'
  return <main className="page"><SectionTitle eyebrow="القانوني" title={title} text={`للتواصل القانوني: ${settings.legal_email}`} /><div className="grid2">{pages.map(p => <article className="panel legalArticle" key={p.slug}><h3>{p.title}</h3><p>{p.body}</p></article>)}</div></main>
}
function Contact({ session, settings, socials, notify }) {
  const [form, setForm] = useState({ name: '', email: session?.user?.email || '', topic: 'support', message: '' })
  async function submit(e) { e.preventDefault(); try { if (!hasSupabaseConfig) return notify('نموذج الدعم غير متاح مؤقتًا'); const { error } = await supabase.from('support_tickets').insert({ ...form, user_id: session?.user?.id || null }); if (error) throw error; setForm({ ...form, message: '' }); notify('تم إرسال الرسالة') } catch (err) { notify(err.message) } }
  return <main className="page"><SectionTitle eyebrow="الدعم" title="كيف يمكننا مساعدتك؟" text={`الدعم: ${settings.support_email}`} /><div className="contactGrid"><form className="panel" onSubmit={submit}><input placeholder="الاسم" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /><input placeholder="البريد" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /><select value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })}><option value="support">دعم فني</option><option value="legal">قانوني</option><option value="abuse">بلاغ إساءة</option><option value="license">ترخيص</option></select><textarea placeholder="اكتب رسالتك" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} /><button className="primary">إرسال الرسالة</button></form><aside className="panel"><h3>قنوات التواصل</h3><p>يمكنك استخدام النموذج أو التواصل عبر الروابط الرسمية.</p><SocialIconRow socials={socials} /><div className="supportMails"><span>{settings.support_email}</span><span>{settings.legal_email}</span></div></aside></div></main>
}
function Footer({ settings, socials, legalPages, go }) {
  const legalLinks = ['about', 'terms', 'privacy', 'disclaimer', 'voice-policy', 'cookies', 'dmca']
  return <footer><div><b>{settings.brand_name}</b><p>{settings.footer_summary || settings.hero_subtitle}</p><SocialIconRow socials={socials} /></div><div><h4>الموقع</h4>{[['home', 'الرئيسية'], ['studio', 'الاستوديو'], ['voices', 'الأصوات'], ['pricing', 'الخطة'], ['support', 'الدعم']].map(([id, label]) => <button key={id} onClick={() => go(id)}>{label}</button>)}</div><div><h4>القانوني</h4>{legalLinks.map(slug => <button key={slug} onClick={() => go(slug)}>{(legalPages.find(p => p.slug === slug) || {}).title || slug}</button>)}</div><small>© 2026 {settings.brand_name}. جميع الحقوق محفوظة.</small></footer>
}

createRoot(document.getElementById('root')).render(<App />)
