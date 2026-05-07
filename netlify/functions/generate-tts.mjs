import { createClient } from '@supabase/supabase-js'
import WebSocket from 'ws'
const json = (status, body) => ({ statusCode: status, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
const env = (name) => process.env[name] || ''
function adminClient() {
  const url = env('SUPABASE_URL') || env('VITE_SUPABASE_URL')
  const key = env('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}
async function getUser(event, supabase) {
  const auth = event.headers.authorization || event.headers.Authorization || ''
  const token = auth.replace(/^Bearer\s+/i, '')
  if (!token || !supabase) return null
  const { data } = await supabase.auth.getUser(token)
  return data?.user || null
}
function safeExt(format) { return ['wav','mp3','ogg'].includes(format) ? format : 'wav' }

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' })
  const started = Date.now()
  let jobId = null
  let supabase = null
  try {
    const body = JSON.parse(event.body || '{}')
    const text = String(body.text || '').trim()
    const format = safeExt(String(body.format || 'wav').toLowerCase())
    const voiceId = String(body.voice_id || 'default_ar')
    const speed = Number(body.speed || 1)
    const language = String(body.language || 'ar')
    if (!text) return json(400, { error: 'Text is required' })
    supabase = adminClient()
    const user = await getUser(event, supabase)

    let settings = { max_chars_guest: 300, max_chars_user: 2500 }
    if (supabase) {
      const { data } = await supabase.from('site_settings').select('value').eq('key','site').maybeSingle()
      settings = { ...settings, ...(data?.value || {}) }
    }
    const limit = user ? Number(settings.max_chars_user || 2500) : Number(settings.max_chars_guest || 300)
    if (text.length > limit) return json(400, { error: `Text exceeds allowed limit of ${limit} characters` })

    if (supabase && user) {
      const { data, error } = await supabase.from('tts_jobs').insert({
        user_id: user.id,
        input_text: text,
        voice_id: voiceId,
        format,
        speed,
        chars: text.length,
        status: 'queued'
      }).select('id').single()
      if (error) throw error
      jobId = data.id
    }

    const xttsUrl = env('XTTS_API_URL')
    const allowDemo = env('ALLOW_DEMO_MODE') !== 'false'
    if (!xttsUrl) {
      if (supabase && jobId) await supabase.from('tts_jobs').update({ status: 'demo', duration_ms: Date.now() - started }).eq('id', jobId)
      if (!allowDemo) return json(400, { error: 'XTTS_API_URL is not configured' })
      return json(200, { demo: true, job_id: jobId, message: 'XTTS_API_URL غير مضاف بعد. تم تنفيذ الطلب كوضع تجريبي دون توليد صوت حقيقي.' })
    }

    if (supabase && jobId) await supabase.from('tts_jobs').update({ status: 'processing' }).eq('id', jobId)
    const res = await fetch(xttsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(env('XTTS_API_KEY') ? { Authorization: `Bearer ${env('XTTS_API_KEY')}` } : {})
      },
      body: JSON.stringify({ text, language, voice_id: voiceId, speed, format })
    })
    if (!res.ok) throw new Error(`XTTS server returned ${res.status}`)

    const contentType = res.headers.get('content-type') || (format === 'mp3' ? 'audio/mpeg' : 'audio/wav')
    let audioBuffer
    let audioBase64
    if (contentType.includes('application/json')) {
      const payload = await res.json()
      audioBase64 = payload.audio_base64 || payload.audio || null
      if (!audioBase64) throw new Error('XTTS JSON response did not include audio_base64')
      audioBuffer = Buffer.from(audioBase64, 'base64')
    } else {
      const arr = await res.arrayBuffer()
      audioBuffer = Buffer.from(arr)
      audioBase64 = audioBuffer.toString('base64')
    }

    let signedUrl = null
    let audioPath = null
    if (supabase && user && jobId) {
      audioPath = `${user.id}/${jobId}.${format}`
      const { error: uploadError } = await supabase.storage.from('tts-audio').upload(audioPath, audioBuffer, { contentType, upsert: true })
      if (uploadError) throw uploadError
      const { data: signed, error: signedError } = await supabase.storage.from('tts-audio').createSignedUrl(audioPath, 3600)
      if (signedError) throw signedError
      signedUrl = signed.signedUrl
      await supabase.from('tts_jobs').update({ status: 'completed', audio_path: audioPath, duration_ms: Date.now() - started }).eq('id', jobId)
    }

    return json(200, {
      ok: true,
      job_id: jobId,
      signed_url: signedUrl,
      audio_path: audioPath,
      audio_base64: signedUrl ? undefined : audioBase64,
      content_type: contentType,
      message: signedUrl ? 'تم توليد الصوت وحفظه مؤقتًا.' : 'تم توليد الصوت.'
    })
  } catch (error) {
    if (supabase && jobId) await supabase.from('tts_jobs').update({ status: 'failed', error: error.message, duration_ms: Date.now() - started }).eq('id', jobId)
    return json(400, { error: error.message || 'TTS generation failed' })
  }
}
