import { createClient } from '@supabase/supabase-js'
import WebSocket from 'ws'
const json = (status, body) => ({ statusCode: status, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
const env = (name) => process.env[name] || ''
export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' })
  try {
    const body = JSON.parse(event.body || '{}')
    if (!env('ADMIN_BOOTSTRAP_TOKEN') || body.token !== env('ADMIN_BOOTSTRAP_TOKEN')) return json(403, { error: 'Invalid bootstrap token' })
    const email = String(body.email || '').trim().toLowerCase()
    if (!email) return json(400, { error: 'Email is required' })
    const url = env('SUPABASE_URL') || env('VITE_SUPABASE_URL')
    const key = env('SUPABASE_SERVICE_ROLE_KEY')
    if (!url || !key) return json(400, { error: 'Missing Supabase server variables' })
    const supabase = createClient(url, key, { auth: { persistSession: false }, realtime: { transport: WebSocket } })
    const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
    if (error) throw error
    const user = (data.users || []).find(u => (u.email || '').toLowerCase() === email)
    if (!user) return json(404, { error: 'User not found. Sign up first, then run bootstrap again.' })
    const { error: upsertError } = await supabase.from('profiles').upsert({ id: user.id, email, role: 'admin', status: 'active', updated_at: new Date().toISOString() })
    if (upsertError) throw upsertError
    return json(200, { ok: true, message: `${email} is now admin` })
  } catch (error) {
    return json(400, { error: error.message || 'Bootstrap failed' })
  }
}
