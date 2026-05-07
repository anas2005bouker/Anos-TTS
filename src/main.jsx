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
  hero_title: 'حوّل النص العربي إلى صوت بشري طبيعي',
  hero_subtitle: 'منصة عربية احترافية لتحويل النص إلى كلام مع لوحة إدارة، حسابات مستخدمين، أصوات، سجل تحويلات، وروابط اجتماعية قابلة للتعديل.',
  cta_primary: 'ابدأ التحويل الآن',
  cta_secondary: 'ادخل لوحة الإدارة',
  max_chars_guest: 300,
  max_chars_user: 2500,
  allow_demo_mode: true,
  maintenance_mode: false,
  announcement: 'نسخة جاهزة للربط مع Supabase وNetlify وXTTS-v2.'
}

const fallbackSocials = [
  { id: 'x', platform: 'X / Twitter', url: 'https://x.com/', label: 'تابعنا على X', is_active: true, sort_order: 1 },
  { id: 'youtube', platform: 'YouTube', url: 'https://youtube.com/', label: 'قناتنا', is_active: true, sort_order: 2 },
  { id: 'linkedin', platform: 'LinkedIn', url: 'https://linkedin.com/', label: 'LinkedIn', is_active: true, sort_order: 3 }
]

const fallbackVoices = [
  { id: 'ar-fahad', name: 'فهد', language: 'ar', accent: 'فصحى هادئة', description: 'مناسب للشروحات والتعليم والبودكاست.', model_voice_id: 'default_male_ar', is_active: true, sort_order: 1 },
  { id: 'ar-layan', name: 'ليان', language: 'ar', accent: 'فصحى إعلامية', description: 'صوت ناعم واضح للمقالات والفيديوهات.', model_voice_id: 'default_female_ar', is_active: true, sort_order: 2 },
  { id: 'ar-rashid', name: 'راشد', language: 'ar', accent: 'خليجي خفيف', description: 'مناسب للإعلانات والمحتوى القصير.', model_voice_id: 'gulf_male_ar', is_active: true, sort_order: 3 }
]

const defaultLegal = [
  { slug: 'terms', title: 'شروط الاستخدام', body: 'باستخدامك للموقع، توافق على عدم إنشاء محتوى مضلل أو منتحل أو مخالف للقوانين. يجب أن تملك حق استخدام النصوص والأصوات التي ترفعها.' },
  { slug: 'privacy', title: 'سياسة الخصوصية', body: 'نستخدم بيانات الحساب والنصوص والملفات الصوتية فقط لتشغيل الخدمة وتحسينها. يمكنك طلب حذف بياناتك عبر الدعم.' },
  { slug: 'voice-policy', title: 'سياسة الأصوات', body: 'لا يسمح برفع أو استنساخ صوت شخص حقيقي دون موافقته الصريحة. يحق للإدارة تعطيل أي حساب مخالف.' },
  { slug: 'cookies', title: 'سياسة الكوكيز', body: 'نستخدم ملفات كوكيز ضرورية لتسجيل الدخول والأمان، وقد نستخدم تحليلات مجهولة لتحسين الأداء.' },
  { slug: 'dmca', title: 'DMCA وطلبات الإزالة', body: 'لأصحاب الحقوق إرسال بلاغ إزالة عبر البريد القانوني، وستتم مراجعة البلاغات وتجميد المحتوى محل النزاع عند الحاجة.' }
]

function cx(...items) { return items.filter(Boolean).join(' ') }
function fmtDate(v) { return v ? new Date(v).toLocaleString('ar') : '-' }

function App() {
  const [route, setRoute] = useState(location.hash.replace('#','') || 'home')
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
    window.__toastTimer = window.setTimeout(() => setToast(''), 3800)
  }

  useEffect(() => {
    const onHash = () => setRoute(location.hash.replace('#','') || 'home')
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    if (!hasSupabaseConfig) return
    boot()
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      if (nextSession?.user) loadProfile(nextSession.user.id)
      else { setProfile(null); setJobs([]) }
    })
    return () => data.subscription.unsubscribe()
  }, [])

  async function boot() {
    setLoading(true)
    try {
      const { data: sessionRes } = await supabase.auth.getSession()
      setSession(sessionRes.session)
      await Promise.all([loadContent(), sessionRes.session?.user ? loadProfile(sessionRes.session.user.id) : null])
      if (sessionRes.session?.user) await loadJobs(sessionRes.session.user.id)
    } catch (err) { notify(err.message) }
    finally { setLoading(false) }
  }

  async function loadContent() {
    const [settingsRes, socialRes, voicesRes, legalRes] = await Promise.all([
      supabase.from('site_settings').select('value').eq('key','site').maybeSingle(),
      supabase.from('social_links').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('voice_presets').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('legal_pages').select('*').order('sort_order')
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
    const { data, error } = await supabase.from('tts_jobs').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20)
    if (!error) setJobs(data || [])
  }

  function go(next) { location.hash = next }

  const isAdmin = profile?.role === 'admin' && profile?.status !== 'blocked'
  const activeVoices = voices.filter(v => v.is_active !== false)

  return (
    <div className="app">
      {toast && <div className="toast">{toast}</div>}
      <Header route={route} go={go} settings={settings} session={session} profile={profile} onSignOut={async()=>{ await supabase?.auth.signOut(); notify('تم تسجيل الخروج') }} />
      {!hasSupabaseConfig && <Banner text="الموقع يعمل الآن في وضع العرض لأن مفاتيح Supabase لم تضاف بعد. بعد النشر أضف المتغيرات وسيعمل التسجيل ولوحة الإدارة." />}
      {settings.maintenance_mode && <Banner danger text="وضع الصيانة مفعل من لوحة الإدارة. يظهر هذا التنبيه للزوار." />}
      {route === 'home' && <Home settings={settings} socials={socials} voices={activeVoices} go={go} />}
      {route === 'studio' && <Studio settings={settings} voices={activeVoices} session={session} profile={profile} onJob={()=> session?.user && loadJobs(session.user.id)} notify={notify} />}
      {route === 'voices' && <Voices voices={activeVoices} />}
      {route === 'pricing' && <Pricing settings={settings} />}
      {route === 'dashboard' && <Dashboard session={session} profile={profile} jobs={jobs} go={go} notify={notify} />}
      {route === 'admin' && <Admin session={session} profile={profile} isAdmin={isAdmin} settings={settings} setSettings={setSettings} socials={socials} setSocials={setSocials} voices={voices} setVoices={setVoices} legalPages={legalPages} setLegalPages={setLegalPages} notify={notify} reloadContent={loadContent} />}
      {route === 'legal' && <Legal legalPages={legalPages} settings={settings} />}
      {route === 'contact' && <Contact session={session} settings={settings} socials={socials} notify={notify} />}
      <Footer settings={settings} socials={socials} legalPages={legalPages} go={go} />
      {loading && <div className="loading">تحميل...</div>}
    </div>
  )
}

function Header({ route, go, settings, session, profile, onSignOut }) {
  const [open, setOpen] = useState(false)
  const links = [
    ['home','الرئيسية'], ['studio','الاستوديو'], ['voices','الأصوات'], ['pricing','الخطة'], ['legal','القانوني'], ['contact','تواصل']
  ]
  return <header className="header">
    <button className="brand" onClick={()=>go('home')}><span className="logo">≋</span><span><b>{settings.brand_name}</b><small>{settings.site_domain}</small></span></button>
    <nav className={cx('nav', open && 'open')}>{links.map(([id,label]) => <button key={id} onClick={()=>{go(id);setOpen(false)}} className={route===id?'active':''}>{label}</button>)}{session && <button onClick={()=>{go('dashboard');setOpen(false)}} className={route==='dashboard'?'active':''}>حسابي</button>}{profile?.role==='admin' && <button onClick={()=>{go('admin');setOpen(false)}} className={route==='admin'?'active admin-link':''}>Admin</button>}</nav>
    <div className="actions">{session ? <button className="ghost" onClick={onSignOut}>خروج</button> : <button className="primary small" onClick={()=>go('dashboard')}>دخول</button>}<button className="menu" onClick={()=>setOpen(!open)}>☰</button></div>
  </header>
}

function Banner({ text, danger }) { return <div className={cx('banner', danger && 'danger')}>{text}</div> }

function Home({ settings, socials, voices, go }) {
  return <main>
    <section className="hero">
      <div className="heroText">
        <div className="pill">✦ {settings.announcement}</div>
        <h1>{settings.hero_title}</h1>
        <p>{settings.hero_subtitle}</p>
        <div className="heroActions"><button className="primary" onClick={()=>go('studio')}>{settings.cta_primary}</button><button className="secondary" onClick={()=>go('dashboard')}>إنشاء حساب</button></div>
        <div className="stats"><Stat n="RTL" t="تصميم عربي"/><Stat n="Admin" t="لوحة إدارة"/><Stat n="XTTS" t="ربط صوت"/></div>
      </div>
      <div className="glass preview"><h3>معاينة الاستوديو</h3><div className="wave"><span/><span/><span/><span/><span/></div><p>النص العربي ← تنظيف وتشكيل ← صوت طبيعي ← تحميل MP3/WAV</p><button className="primary wide" onClick={()=>go('studio')}>افتح الاستوديو</button></div>
    </section>
    <section className="section"><Title eyebrow="ما الذي تم تجهيزه؟" title="موقع SaaS عربي كامل وليس صفحة بسيطة" text="كل قسم مطلوب للإطلاق الأولي: تسويق، أداة، حسابات، إدارة، قانون، تواصل، وروابط اجتماعية قابلة للتعديل."/><div className="grid4">{[['🎙️','استوديو TTS','توليد، سرعة، صيغة، صوت، وسجل تحويلات.'],['👤','حسابات مستخدمين','تسجيل ودخول عبر Supabase مع ملفات مستخدمين.'],['🛠️','لوحة Admin','إدارة الإعدادات والروابط والأصوات والمستخدمين.'],['⚖️','صفحات قانونية','خصوصية، شروط، كوكيز، DMCA، وسياسة الأصوات.']].map(c=><Card key={c[1]} icon={c[0]} title={c[1]} text={c[2]}/>)}</div></section>
    <section className="section split"><div><Title eyebrow="أصوات" title="أصوات عربية قابلة للإدارة" text="تستطيع تعديل الأصوات وأسمائها ووصفها من لوحة الإدارة بعد ربط Supabase."/></div><div className="voiceList">{voices.slice(0,3).map(v=><VoiceCard key={v.id} v={v}/>)}</div></section>
    <section className="section"><Title eyebrow="روابط تواصل" title="كل روابطك الاجتماعية من لوحة Admin" text="لا تحتاج تعديل الكود لتغيير يوتيوب أو X أو لينكدإن أو تيك توك، كل شيء محفوظ في قاعدة البيانات."/><div className="socials">{socials.map(s=><a key={s.id} href={s.url} target="_blank">{s.platform}</a>)}</div></section>
  </main>
}
function Stat({n,t}){return <div className="stat"><b>{n}</b><span>{t}</span></div>}
function Title({eyebrow,title,text}){return <div className="title"><span>{eyebrow}</span><h2>{title}</h2><p>{text}</p></div>}
function Card({icon,title,text}){return <div className="card"><div className="cardIcon">{icon}</div><h3>{title}</h3><p>{text}</p></div>}
function VoiceCard({v}){return <div className="voiceCard"><div className="voiceAvatar">◉</div><h3>{v.name}</h3><small>{v.accent}</small><p>{v.description}</p><span>{v.language}</span></div>}

function Studio({ settings, voices, session, profile, onJob, notify }) {
  const [text,setText]=useState('مرحبًا، هذه تجربة لتحويل النص العربي إلى صوت طبيعي وواضح باستخدام الذكاء الاصطناعي.')
  const [voice,setVoice]=useState(voices[0]?.id || 'ar-fahad')
  const [format,setFormat]=useState('wav')
  const [speed,setSpeed]=useState(1)
  const [busy,setBusy]=useState(false)
  const [result,setResult]=useState(null)
  const limit = session ? Number(settings.max_chars_user || 2500) : Number(settings.max_chars_guest || 300)
  const selectedVoice = voices.find(v=>v.id===voice) || voices[0]
  async function generate(){
    if(!text.trim()) return notify('اكتب النص أولًا')
    if(text.length > limit) return notify(`النص أطول من الحد المسموح: ${limit} حرف`)
    setBusy(true); setResult(null)
    try{
      const token = session?.access_token
      const data = await callFunction('generate-tts', { text, voice_id: selectedVoice?.model_voice_id || voice, format, speed, language:'ar' }, token)
      setResult(data)
      if(data.audio_base64) downloadBase64Audio(data.audio_base64, `sawti-${Date.now()}.${format}`, data.content_type || 'audio/wav')
      onJob?.()
      notify(data.demo ? 'تم تنفيذ تجربة وهمية لأن XTTS_API_URL غير مضاف' : 'تم توليد الصوت')
    }catch(err){ notify(err.message) }
    finally{ setBusy(false) }
  }
  return <main className="page"><Title eyebrow="استوديو التحويل" title="حوّل النص إلى كلام" text="هذا القسم يتصل بـ Netlify Function، ثم بخادم XTTS-v2 عند إضافة XTTS_API_URL."/>
    <div className="studioGrid"><div className="panel"><label>النص العربي</label><textarea value={text} onChange={e=>setText(e.target.value)} maxLength={limit+1000}/><div className="counter">{text.length} / {limit} حرف</div><div className="formGrid"><Field label="الصوت"><select value={voice} onChange={e=>setVoice(e.target.value)}>{voices.map(v=><option key={v.id} value={v.id}>{v.name} - {v.accent}</option>)}</select></Field><Field label="الصيغة"><select value={format} onChange={e=>setFormat(e.target.value)}><option value="wav">WAV</option><option value="mp3">MP3</option><option value="ogg">OGG</option></select></Field><Field label={`السرعة ${speed}x`}><input type="range" min="0.7" max="1.3" step="0.1" value={speed} onChange={e=>setSpeed(e.target.value)}/></Field></div><div className="hint">مهم: دقة العربية تتحسن جدًا إذا أضفت تشكيلًا للنص أو قاموس أسماء في الخادم.</div><button className="primary wide" onClick={generate} disabled={busy}>{busy?'جاري التوليد...':'توليد وتحميل الصوت'}</button>{result && <ResultBox result={result}/>}</div><aside className="panel side"><h3>معلومات التشغيل</h3><ul><li>المحرك: XTTS-v2 endpoint</li><li>قاعدة البيانات: Supabase</li><li>التخزين: Supabase Storage</li><li>الحماية: RLS + Netlify Functions</li></ul><button className="secondary wide" onClick={()=>location.hash='dashboard'}>{session?'عرض سجل التحويلات':'تسجيل الدخول لحفظ السجل'}</button></aside></div>
  </main>
}
function ResultBox({result}){return <div className="result"><b>{result.demo?'وضع تجريبي':'نتيجة جاهزة'}</b><p>{result.message || 'تم تجهيز الطلب.'}</p>{result.signed_url && <a className="primary" href={result.signed_url} target="_blank">فتح رابط الصوت</a>}</div>}
function Field({label,children}){return <div className="field"><label>{label}</label>{children}</div>}
function Voices({voices}){return <main className="page"><Title eyebrow="الأصوات" title="مكتبة الأصوات العربية" text="هذه القائمة قابلة للتعديل من Admin: اسم الصوت، الوصف، ترتيب الظهور، ومعرف الصوت في الخادم."/><div className="grid3">{voices.map(v=><VoiceCard key={v.id} v={v}/>)}</div></main>}
function Pricing({settings}){return <main className="page"><Title eyebrow="الخطة" title="مجاني كبداية، والحدود قابلة للإدارة" text="الحدود اليومية وأحجام النصوص يمكن تعديلها من لوحة Admin بدل تعديل الكود."/><div className="grid3"><Plan name="زائر" price="مجاني" items={[`حتى ${settings.max_chars_guest} حرف`,`معاينة محدودة`,`بدون سجل دائم`]}/><Plan name="مستخدم" price="مجاني" featured items={[`حتى ${settings.max_chars_user} حرف`,`حفظ السجل`,`تحميل الصوت`]}/><Plan name="ترخيص خاص" price="لاحقًا" items={['عند الحصول على ترخيص XTTS','API موسع','حدود أعلى']}/></div></main>}
function Plan({name,price,items,featured}){return <div className={cx('plan',featured&&'featured')}><h3>{name}</h3><b>{price}</b>{items.map(i=><p key={i}>✓ {i}</p>)}<button className={featured?'dark':'primary'}>اختيار</button></div>}

function Dashboard({ session, profile, jobs, go, notify }) {
  if(!hasSupabaseConfig) return <AuthNeeded title="أضف Supabase أولًا" text="بعد إضافة مفاتيح Supabase سيعمل التسجيل والدخول ولوحة المستخدمين." />
  if(!session) return <AuthBox notify={notify}/>
  return <main className="page"><Title eyebrow="حسابي" title={`مرحبًا ${profile?.full_name || profile?.email || ''}`} text="هذه هي لوحة المستخدم: سجل تحويلاته وحالة طلباته وبيانات حسابه."/><div className="grid3"><Card icon="📦" title={jobs.length} text="طلب محفوظ"/><Card icon="🔐" title={profile?.role || 'user'} text="صلاحية الحساب"/><Card icon="✅" title={profile?.status || 'active'} text="حالة الحساب"/></div><div className="panel"><h3>سجل التحويلات</h3><Table rows={jobs} cols={[['created_at','التاريخ',fmtDate],['input_text','النص',v=>(v||'').slice(0,60)],['status','الحالة'],['format','الصيغة']]} empty="لا توجد تحويلات بعد."/></div>{profile?.role==='admin' && <button className="primary" onClick={()=>go('admin')}>فتح لوحة الإدارة</button>}</main>
}
function AuthNeeded({title,text}){return <main className="page"><div className="panel center"><h2>{title}</h2><p>{text}</p></div></main>}
function AuthBox({notify}){
  const [mode,setMode]=useState('signin'),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[name,setName]=useState(''),[busy,setBusy]=useState(false)
  async function submit(e){e.preventDefault();setBusy(true);try{if(mode==='signup'){const {error}=await supabase.auth.signUp({email,password,options:{data:{full_name:name}}}); if(error) throw error; notify('تم إنشاء الحساب. قد تحتاج تأكيد البريد حسب إعدادات Supabase.')}else{const {error}=await supabase.auth.signInWithPassword({email,password}); if(error) throw error; notify('تم تسجيل الدخول')}}catch(err){notify(err.message)}finally{setBusy(false)}}
  return <main className="page"><div className="auth panel"><h2>{mode==='signin'?'تسجيل الدخول':'إنشاء حساب'}</h2><form onSubmit={submit}>{mode==='signup'&&<input placeholder="الاسم" value={name} onChange={e=>setName(e.target.value)}/>}<input placeholder="البريد الإلكتروني" value={email} onChange={e=>setEmail(e.target.value)} required/><input placeholder="كلمة المرور" type="password" value={password} onChange={e=>setPassword(e.target.value)} required/><button className="primary wide" disabled={busy}>{busy?'انتظر...':mode==='signin'?'دخول':'تسجيل'}</button></form><button className="link" onClick={()=>setMode(mode==='signin'?'signup':'signin')}>{mode==='signin'?'ليس لديك حساب؟ أنشئ حسابًا':'لديك حساب؟ سجل الدخول'}</button></div></main>
}

function Admin(props){
  const { session, profile, isAdmin, notify } = props
  const [tab,setTab]=useState('overview')
  if(!hasSupabaseConfig) return <AuthNeeded title="لوحة الإدارة تنتظر Supabase" text="أضف متغيرات Supabase، نفذ schema.sql، ثم اجعل حسابك Admin." />
  if(!session) return <AuthBox notify={notify}/>
  if(!isAdmin) return <AuthNeeded title="ليست لديك صلاحية Admin" text="بعد إنشاء حسابك، نفذ ملف supabase/make_admin.sql مرة واحدة لترقية بريدك إلى مدير." />
  const tabs=[['overview','نظرة عامة'],['settings','إعدادات الموقع'],['socials','السوشيال'],['voices','الأصوات'],['users','المستخدمون'],['jobs','التحويلات'],['legal','القانوني'],['tickets','الدعم'],['system','النظام']]
  return <main className="page admin"><Title eyebrow="Admin" title="لوحة إدارة الموقع كاملة" text="من هنا تدير الموقع، المستخدمين، الأصوات، الروابط الاجتماعية، الصفحات القانونية، التذاكر، وسجل التحويلات."/><div className="adminLayout"><aside className="adminTabs">{tabs.map(t=><button key={t[0]} onClick={()=>setTab(t[0])} className={tab===t[0]?'active':''}>{t[1]}</button>)}</aside><section className="adminContent">{tab==='overview'&&<AdminOverview {...props}/>} {tab==='settings'&&<AdminSettings {...props}/>} {tab==='socials'&&<AdminSocials {...props}/>} {tab==='voices'&&<AdminVoices {...props}/>} {tab==='users'&&<AdminUsers {...props}/>} {tab==='jobs'&&<AdminJobs {...props}/>} {tab==='legal'&&<AdminLegal {...props}/>} {tab==='tickets'&&<AdminTickets {...props}/>} {tab==='system'&&<AdminSystem />}</section></div></main>
}
function AdminOverview({settings,socials,voices}){return <div className="grid3"><Card icon="⚙️" title="الإعدادات" text={settings.brand_name}/><Card icon="🔗" title={socials.length} text="رابط اجتماعي"/><Card icon="🎙️" title={voices.length} text="صوت"/></div>}
function AdminSettings({settings,setSettings,notify,reloadContent}){
  const [draft,setDraft]=useState(settings),[saving,setSaving]=useState(false)
  function set(k,v){setDraft({...draft,[k]:v})}
  async function save(){setSaving(true);try{const {error}=await supabase.from('site_settings').upsert({key:'site',value:draft},{onConflict:'key'}); if(error) throw error; setSettings(draft); await reloadContent(); notify('تم حفظ إعدادات الموقع')}catch(e){notify(e.message)}finally{setSaving(false)}}
  return <div className="panel"><h3>إعدادات الموقع العامة</h3><div className="formGrid"><Field label="اسم الموقع"><input value={draft.brand_name||''} onChange={e=>set('brand_name',e.target.value)}/></Field><Field label="الدومين"><input value={draft.site_domain||''} onChange={e=>set('site_domain',e.target.value)}/></Field><Field label="بريد الدعم"><input value={draft.support_email||''} onChange={e=>set('support_email',e.target.value)}/></Field><Field label="بريد قانوني"><input value={draft.legal_email||''} onChange={e=>set('legal_email',e.target.value)}/></Field></div><Field label="عنوان الصفحة الرئيسية"><input value={draft.hero_title||''} onChange={e=>set('hero_title',e.target.value)}/></Field><Field label="الوصف الرئيسي"><textarea value={draft.hero_subtitle||''} onChange={e=>set('hero_subtitle',e.target.value)}/></Field><div className="formGrid"><Field label="حد الزائر"><input type="number" value={draft.max_chars_guest||0} onChange={e=>set('max_chars_guest',Number(e.target.value))}/></Field><Field label="حد المستخدم"><input type="number" value={draft.max_chars_user||0} onChange={e=>set('max_chars_user',Number(e.target.value))}/></Field><label className="check"><input type="checkbox" checked={!!draft.maintenance_mode} onChange={e=>set('maintenance_mode',e.target.checked)}/> وضع الصيانة</label><label className="check"><input type="checkbox" checked={!!draft.allow_demo_mode} onChange={e=>set('allow_demo_mode',e.target.checked)}/> وضع التجربة</label></div><button className="primary" onClick={save} disabled={saving}>{saving?'حفظ...':'حفظ الإعدادات'}</button></div>
}
function AdminSocials({socials,setSocials,notify,reloadContent}){
  const [draft,setDraft]=useState({platform:'',label:'',url:'',sort_order:10,is_active:true})
  async function add(){try{const {error}=await supabase.from('social_links').insert(draft); if(error) throw error; setDraft({platform:'',label:'',url:'',sort_order:10,is_active:true}); await reloadContent(); const {data}=await supabase.from('social_links').select('*').order('sort_order'); setSocials(data||[]); notify('تمت إضافة الرابط')}catch(e){notify(e.message)}}
  async function del(id){try{const {error}=await supabase.from('social_links').delete().eq('id',id); if(error) throw error; await reloadContent(); setSocials(socials.filter(s=>s.id!==id)); notify('تم حذف الرابط')}catch(e){notify(e.message)}}
  return <div className="panel"><h3>إدارة روابط مواقع التواصل</h3><div className="formGrid"><input placeholder="المنصة" value={draft.platform} onChange={e=>setDraft({...draft,platform:e.target.value})}/><input placeholder="الوسم" value={draft.label} onChange={e=>setDraft({...draft,label:e.target.value})}/><input placeholder="الرابط" value={draft.url} onChange={e=>setDraft({...draft,url:e.target.value})}/><input type="number" placeholder="الترتيب" value={draft.sort_order} onChange={e=>setDraft({...draft,sort_order:Number(e.target.value)})}/></div><button className="primary" onClick={add}>إضافة رابط</button><SimpleList items={socials} render={s=><><b>{s.platform}</b><span>{s.url}</span><button onClick={()=>del(s.id)}>حذف</button></>}/></div>
}
function AdminVoices({voices,setVoices,notify,reloadContent}){
  const empty={name:'',language:'ar',accent:'',description:'',model_voice_id:'',sort_order:10,is_active:true}
  const [draft,setDraft]=useState(empty)
  async function add(){try{const {error}=await supabase.from('voice_presets').insert(draft); if(error) throw error; setDraft(empty); const {data}=await supabase.from('voice_presets').select('*').order('sort_order'); setVoices(data||[]); await reloadContent(); notify('تمت إضافة الصوت')}catch(e){notify(e.message)}}
  async function toggle(v){try{const {error}=await supabase.from('voice_presets').update({is_active:!v.is_active}).eq('id',v.id); if(error) throw error; setVoices(voices.map(x=>x.id===v.id?{...x,is_active:!x.is_active}:x)); notify('تم تحديث الصوت')}catch(e){notify(e.message)}}
  return <div className="panel"><h3>إدارة الأصوات</h3><div className="formGrid"><input placeholder="اسم الصوت" value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})}/><input placeholder="اللهجة" value={draft.accent} onChange={e=>setDraft({...draft,accent:e.target.value})}/><input placeholder="معرف الصوت في XTTS" value={draft.model_voice_id} onChange={e=>setDraft({...draft,model_voice_id:e.target.value})}/><input type="number" value={draft.sort_order} onChange={e=>setDraft({...draft,sort_order:Number(e.target.value)})}/></div><textarea placeholder="الوصف" value={draft.description} onChange={e=>setDraft({...draft,description:e.target.value})}/><button className="primary" onClick={add}>إضافة صوت</button><SimpleList items={voices} render={v=><><b>{v.name}</b><span>{v.accent} · {v.model_voice_id}</span><button onClick={()=>toggle(v)}>{v.is_active?'تعطيل':'تفعيل'}</button></>}/></div>
}
function AdminUsers({session,notify}){
  const [users,setUsers]=useState([]),[loading,setLoading]=useState(false)
  async function load(){setLoading(true);try{const data=await callFunction('admin-users',{action:'list'},session.access_token); setUsers(data.users||[])}catch(e){notify(e.message)}finally{setLoading(false)}}
  useEffect(()=>{load()},[])
  async function update(user,patch){try{await callFunction('admin-users',{action:'update',user_id:user.id,patch},session.access_token); await load(); notify('تم تحديث المستخدم')}catch(e){notify(e.message)}}
  return <div className="panel"><h3>إدارة المستخدمين</h3><button className="secondary" onClick={load}>{loading?'تحميل...':'تحديث القائمة'}</button><Table rows={users} cols={[['email','البريد'],['role','الدور'],['status','الحالة'],['created_at','تاريخ التسجيل',fmtDate],['actions','إجراء',(v,row)=><div className="rowActions"><button onClick={()=>update(row,{role:row.role==='admin'?'user':'admin'})}>{row.role==='admin'?'جعله مستخدم':'جعله Admin'}</button><button onClick={()=>update(row,{status:row.status==='blocked'?'active':'blocked'})}>{row.status==='blocked'?'إلغاء الحظر':'حظر'}</button></div>]]} empty="لا توجد بيانات"/></div>
}
function AdminJobs({notify}){const [rows,setRows]=useState([]);useEffect(()=>{supabase.from('tts_jobs').select('*, profiles(email)').order('created_at',{ascending:false}).limit(100).then(({data,error})=>error?notify(error.message):setRows(data||[]))},[]);return <div className="panel"><h3>كل التحويلات</h3><Table rows={rows} cols={[['created_at','التاريخ',fmtDate],['profiles','المستخدم',v=>v?.email||'-'],['input_text','النص',v=>(v||'').slice(0,70)],['status','الحالة'],['format','الصيغة']]} empty="لا توجد تحويلات"/></div>}
function AdminLegal({legalPages,setLegalPages,notify}){const [selected,setSelected]=useState(legalPages[0]?.slug||'terms');const page=legalPages.find(p=>p.slug===selected)||legalPages[0];const [body,setBody]=useState(page?.body||'');useEffect(()=>{setBody((legalPages.find(p=>p.slug===selected)||{}).body||'')},[selected,legalPages]);async function save(){try{const {error}=await supabase.from('legal_pages').update({body,updated_at:new Date().toISOString()}).eq('slug',selected); if(error) throw error; setLegalPages(legalPages.map(p=>p.slug===selected?{...p,body}:p)); notify('تم حفظ الصفحة القانونية')}catch(e){notify(e.message)}}return <div className="panel"><h3>الصفحات القانونية</h3><select value={selected} onChange={e=>setSelected(e.target.value)}>{legalPages.map(p=><option key={p.slug} value={p.slug}>{p.title}</option>)}</select><textarea className="tall" value={body} onChange={e=>setBody(e.target.value)}/><button className="primary" onClick={save}>حفظ الصفحة</button></div>}
function AdminTickets({notify}){const [rows,setRows]=useState([]);useEffect(()=>{supabase.from('support_tickets').select('*').order('created_at',{ascending:false}).limit(100).then(({data,error})=>error?notify(error.message):setRows(data||[]))},[]);async function close(id){const {error}=await supabase.from('support_tickets').update({status:'closed'}).eq('id',id); if(error) notify(error.message); else setRows(rows.map(r=>r.id===id?{...r,status:'closed'}:r))}return <div className="panel"><h3>رسائل الدعم</h3><Table rows={rows} cols={[['created_at','التاريخ',fmtDate],['email','البريد'],['topic','الموضوع'],['message','الرسالة',v=>(v||'').slice(0,80)],['status','الحالة'],['x','إجراء',(v,row)=><button onClick={()=>close(row.id)}>إغلاق</button>]]} empty="لا توجد رسائل"/></div>}
function AdminSystem(){return <div className="panel"><h3>حالة النظام</h3><ul><li>VITE_SUPABASE_URL: مطلوب في Netlify.</li><li>VITE_SUPABASE_ANON_KEY: مطلوب في Netlify.</li><li>SUPABASE_SERVICE_ROLE_KEY: مطلوب لوظائف Admin، ولا يوضع داخل المتصفح.</li><li>XTTS_API_URL: مطلوب لتوليد الصوت الحقيقي.</li><li>ALLOW_DEMO_MODE: اجعله true أثناء الاختبار، false عند الإنتاج.</li></ul></div>}
function SimpleList({items,render}){return <div className="simpleList">{items.map(item=><div className="simpleItem" key={item.id || item.slug}>{render(item)}</div>)}</div>}
function Table({rows,cols,empty}){if(!rows?.length)return <p className="empty">{empty}</p>;return <div className="tableWrap"><table><thead><tr>{cols.map(c=><th key={c[1]}>{c[1]}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={r.id||i}>{cols.map(c=><td key={c[0]}>{c[2]?c[2](r[c[0]],r):r[c[0]]}</td>)}</tr>)}</tbody></table></div>}

function Legal({legalPages,settings}){return <main className="page"><Title eyebrow="القانوني" title="الصفحات القانونية" text={`للتواصل القانوني: ${settings.legal_email}`}/><div className="grid2">{legalPages.map(p=><article className="panel" key={p.slug}><h3>{p.title}</h3><p>{p.body}</p></article>)}</div></main>}
function Contact({session,settings,socials,notify}){const [form,setForm]=useState({name:'',email:session?.user?.email||'',topic:'support',message:''});async function submit(e){e.preventDefault();try{if(!hasSupabaseConfig) return notify('أضف Supabase لتفعيل نموذج التواصل');const {error}=await supabase.from('support_tickets').insert({...form,user_id:session?.user?.id||null});if(error) throw error; setForm({...form,message:''}); notify('تم إرسال الرسالة')}catch(err){notify(err.message)}}return <main className="page"><Title eyebrow="تواصل" title="الدعم والبلاغات" text={`الدعم: ${settings.support_email} · القانوني: ${settings.legal_email}`}/><div className="contactGrid"><form className="panel" onSubmit={submit}><input placeholder="الاسم" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/><input placeholder="البريد" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/><select value={form.topic} onChange={e=>setForm({...form,topic:e.target.value})}><option value="support">دعم فني</option><option value="legal">قانوني</option><option value="abuse">بلاغ إساءة</option><option value="license">ترخيص</option></select><textarea placeholder="رسالتك" value={form.message} onChange={e=>setForm({...form,message:e.target.value})}/><button className="primary">إرسال</button></form><div className="panel"><h3>روابط التواصل</h3>{socials.map(s=><a className="socialLine" href={s.url} target="_blank" key={s.id}>{s.platform} ←</a>)}</div></div></main>}
function Footer({settings,socials,legalPages,go}){return <footer><div><b>{settings.brand_name}</b><p>{settings.hero_subtitle}</p></div><div>{['home','studio','voices','pricing','legal','contact'].map(x=><button key={x} onClick={()=>go(x)}>{x}</button>)}</div><div>{socials.filter(s=>s.is_active!==false).map(s=><a key={s.id} href={s.url} target="_blank">{s.platform}</a>)}</div><small>© 2026 {settings.brand_name}. جميع الحقوق محفوظة.</small></footer>}

createRoot(document.getElementById('root')).render(<App />)
