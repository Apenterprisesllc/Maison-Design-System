// @ts-nocheck
// Deno Edge Function — creates platform staff (super_admin or property_manager).
// Caller must be a super_admin. Idempotent: returns the existing user id if
// the email is already registered.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface Body {
  email: string;
  full_name: string;
  phone?: string | null;
  temp_password: string;
  role: 'super_admin' | 'property_manager';
  property_id?: string | null; // required when role = property_manager
}

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
    return json({ error: 'Only super admins can create staff users.' }, 403);
  }

  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body || !body.email || !body.temp_password || !body.full_name || !body.role) {
    return json({ error: 'Missing required fields.' }, 400);
  }
  if (body.role === 'property_manager' && !body.property_id) {
    return json({ error: 'property_id is required for property_manager.' }, 400);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Verify the property exists when assigning a manager.
  if (body.property_id) {
    const { data: prop, error: propErr } = await admin
      .from('properties')
      .select('id')
      .eq('id', body.property_id)
      .single();
    if (propErr || !prop) return json({ error: 'Property not found.' }, 404);
  }

  // Idempotent: if email already exists, return it.
  const { data: existing } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const match = existing?.users.find(
    (u) => u.email?.toLowerCase() === body.email.toLowerCase(),
  );

  let userId: string;
  if (match) {
    userId = match.id;
  } else {
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: body.email,
      password: body.temp_password,
      email_confirm: true,
      user_metadata: {
        full_name: body.full_name,
        role: body.role,
        must_change_password: true,
      },
    });
    if (createErr || !created.user) {
      return json({ error: createErr?.message ?? 'Could not create user.' }, 400);
    }
    userId = created.user.id;
  }

  const { error: updErr } = await admin
    .from('profiles')
    .update({
      role: body.role,
      full_name: body.full_name,
      phone: body.phone ?? null,
      primary_property_id: body.property_id ?? null,
      must_change_password: !match, // existing users keep their flag
    })
    .eq('id', userId);
  if (updErr) {
    if (!match) await admin.auth.admin.deleteUser(userId);
    return json({ error: updErr.message }, 500);
  }

  return json({ user_id: userId, already_existed: !!match }, 200);
});

function json(payload: unknown, status: number): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}
