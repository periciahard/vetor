// Edge Function opcional: vetor-admin-user
// Use para permitir criar usuários e resetar senha pelo painel do VETOR.
// NÃO coloque SERVICE_ROLE no frontend. Configure no ambiente da função:
// SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders() })
  }
  try {
    const authHeader = req.headers.get('Authorization') || ''
    const userToken = authHeader.replace('Bearer ', '')
    if (!userToken) throw new Error('Usuário não autenticado.')

    const url = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const admin = createClient(url, serviceKey, { auth: { persistSession: false } })
    const asUser = createClient(url, Deno.env.get('SUPABASE_ANON_KEY') || serviceKey, { auth: { persistSession: false }, global: { headers: { Authorization: `Bearer ${userToken}` } } })

    const { data: me, error: meErr } = await asUser.from('perfis').select('id,perfil').single()
    if (meErr || me?.perfil !== 'admin') throw new Error('Apenas admin pode executar esta ação.')

    const body = await req.json()
    const action = body.action

    if (action === 'createUser') {
      const { email, password, nome, perfil, disciplina, senha_temporaria } = body
      const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { nome, perfil } })
      if (error) throw error
      const id = data.user.id
      const { error: pErr } = await admin.from('perfis').upsert({ id, nome, email, perfil, disciplina: disciplina || null, senha_temporaria: senha_temporaria !== false }, { onConflict: 'id' })
      if (pErr) throw pErr
      return json({ ok: true, id, user: data.user })
    }

    if (action === 'resetPassword') {
      const { email, password, senha_temporaria } = body
      const { data: users, error: listErr } = await admin.auth.admin.listUsers()
      if (listErr) throw listErr
      const target = users.users.find((u) => u.email?.toLowerCase() === String(email).toLowerCase())
      if (!target) throw new Error('Usuário não encontrado no Auth.')
      const { error } = await admin.auth.admin.updateUserById(target.id, { password })
      if (error) throw error
      await admin.from('perfis').update({ senha_temporaria: senha_temporaria !== false }).eq('id', target.id)
      return json({ ok: true, id: target.id })
    }

    throw new Error('Ação inválida.')
  } catch (e) {
    return json({ ok: false, error: String(e.message || e) }, 400)
  }
})

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } })
}
