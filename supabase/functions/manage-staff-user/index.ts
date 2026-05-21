// @ts-nocheck
// Deno Edge Function — manage existing staff users (update / reset password /
// delete). Caller must be super_admin.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface UpdateBody {
  action: 'update';
  user_id: string;
  full_name?: string;
  property_id?: string | null;
  phone?: string | null;
}
interface ResetBody {
  action: 'reset_password';
  user_id: string;
  temp_password: string;
}
interface DeleteBody {
  action: 'delete';
  user_id: string;
}
type Body = UpdateBody | ResetBody | DeleteBody;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    return json({ error: 'Edge function secrets not configured.' }, 500);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'Missing Authorization header.' }, 401);

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: callerUser, error: callerErr } = await callerClient.auth.getUser();
  if (callerErr || !callerUser?.user) {
    return json({ error: 'Invalid session.' }, 401);
  }

  const { data: callerProfile } = await callerClient
    .from('profiles')
    .select('role')
    .eq('id', callerUser.user.id)
    .single();
  if (!callerProfile || callerProfile.role !== 'super_admin') {
    return json({ error: 'Only super admins can manage staff users.' }, 403);
  }

  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body || !body.action || !body.user_id) {
    return json({ error: 'Missing action or user_id.' }, 400);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  if (body.action === 'update') {
    const patch: Record<string, unknown> = {};
    if (typeof body.full_name === 'string') patch.full_name = body.full_name;
    if (body.property_id !== undefined) patch.primary_property_id = body.property_id;
    if (body.phone !== undefined) patch.phone = body.phone;
    if (Object.keys(patch).length === 0) {
      return json({ ok: true }, 200);
    }
    const { error } = await admin.from('profiles').update(patch).eq('id', body.user_id);
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true }, 200);
  }

  if (body.action === 'reset_password') {
    if (!body.temp_password || body.temp_password.length < 10) {
      return json({ error: 'Temporary password must be at least 10 characters.' }, 400);
    }
    const { error: passErr } = await admin.auth.admin.updateUserById(body.user_id, {
      password: body.temp_password,
    });
    if (passErr) return json({ error: passErr.message }, 500);
    const { error: flagErr } = await admin
      .from('profiles')
      .update({ must_change_password: true })
      .eq('id', body.user_id);
    if (flagErr) return json({ error: flagErr.message }, 500);
    return json({ ok: true }, 200);
  }

  if (body.action === 'delete') {
    if (body.user_id === callerUser.user.id) {
      return json({ error: 'Cannot delete your own account from this endpoint.' }, 400);
    }
    const { error } = await admin.auth.admin.deleteUser(body.user_id);
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true }, 200);
  }

  return json({ error: 'Unknown action.' }, 400);
});

function json(payload: unknown, status: number): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}
