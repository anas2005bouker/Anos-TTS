import { createClient } from '@supabase/supabase-js'
import WebSocket from 'ws'
const json = (status, body) => ({ statusCode: status, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

function env(name) { return process.env[name] || '' }
function adminClient() {
  const url = env('SUPABASE_URL') || env('VITE_SUPABASE_URL')
  const key = env('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) throw new Error('Missing SUPABASE_URL/VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  return createClient(url, key, { auth: { persistSession: false }, realtime: { transport: WebSocket } })
}
async function requireAdmin(event, supabase) {
  const auth = event.headers.authorization || event.headers.Authorization || ''
  const token = auth.replace(/^Bearer\s+/i, '')
  if (!token) throw new Error('Missing Authorization token')
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) throw new Error('Invalid session')
  const { data: profile, error: profileError } = await supabase.from('profiles').select('role,status,email').eq('id', data.user.id).maybeSingle()
  if (profileError) throw profileError
  if (!profile || profile.role !== 'admin' || profile.status === 'blocked') throw new Error('Admin permission required')
  return { user: data.user, profile }
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' })
  try {
    const supabase = adminClient()
    await requireAdmin(event, supabase)
    const body = JSON.parse(event.body || '{}')
    const action = body.action || 'list'

    if (action === 'list') {
      const page = Number(body.page || 1)
      const perPage = Math.min(Number(body.perPage || 100), 1000)
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
      if (error) throw error
      const authUsers = data.users || []
      const ids = authUsers.map(u => u.id)
      let profiles = []
      if (ids.length) {
        const { data: profileRows, error: profileError } = await supabase.from('profiles').select('*').in('id', ids)
        if (profileError) throw profileError
        profiles = profileRows || []
      }
      const byId = Object.fromEntries(profiles.map(p => [p.id, p]))
      const users = authUsers.map(u => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        role: byId[u.id]?.role || 'user',
        status: byId[u.id]?.status || 'active',
        full_name: byId[u.id]?.full_name || u.user_metadata?.full_name || ''
      }))
      return json(200, { users })
    }

    if (action === 'update') {
      const { user_id, patch } = body
      if (!user_id || !patch) return json(400, { error: 'user_id and patch are required' })
      const allowed = {}
      if (['user','admin'].includes(patch.role)) allowed.role = patch.role
      if (['active','blocked'].includes(patch.status)) allowed.status = patch.status
      if (typeof patch.full_name === 'string') allowed.full_name = patch.full_name.slice(0, 120)
      const { error } = await supabase.from('profiles').update({ ...allowed, updated_at: new Date().toISOString() }).eq('id', user_id)
      if (error) throw error
      return json(200, { ok: true })
    }

    return json(400, { error: 'Unknown action' })
  } catch (error) {
    return json(400, { error: error.message || 'Admin function failed' })
  }
}
