// @ts-nocheck
// Deno Edge Function — runs in Supabase, NOT in the browser bundle.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface Body {
  property_id: string;
  unit_id: string;
  email: string;
  full_name: string;
  phone?: string | null;
  temp_password: string;
  role: 'owner' | 'tenant' | 'manager' | 'contact';
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

  // Caller client — uses the JWT to identify who is invoking us.
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: callerUser, error: callerErr } = await callerClient.auth.getUser();
  if (callerErr || !callerUser?.user) {
    return json({ error: 'Invalid session.' }, 401);
  }

  const { data: callerProfile, error: profErr } = await callerClient
    .from('profiles')
    .select('role, primary_property_id')
    .eq('id', callerUser.user.id)
    .single();
  if (profErr || !callerProfile) {
    return json({ error: 'Caller profile not found.' }, 403);
  }
  if (callerProfile.role !== 'property_manager' && callerProfile.role !== 'super_admin') {
    return json({ error: 'Only property managers can create residents.' }, 403);
  }

  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body || !body.email || !body.temp_password || !body.full_name || !body.unit_id || !body.property_id) {
    return json({ error: 'Missing required fields.' }, 400);
  }

  // Managers can only create users for their own property.
  if (
    callerProfile.role === 'property_manager' &&
    callerProfile.primary_property_id !== body.property_id
  ) {
    return json({ error: 'Cannot create users for a different property.' }, 403);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Verify the unit belongs to the claimed property.
  const { data: unit, error: unitErr } = await admin
    .from('units')
    .select('id, property_id')
    .eq('id', body.unit_id)
    .single();
  if (unitErr || !unit) return json({ error: 'Unit not found.' }, 404);
  if (unit.property_id !== body.property_id) {
    return json({ error: 'Unit does not belong to the given property.' }, 400);
  }

  // Create the auth user with metadata that the on_auth_user_created trigger reads.
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: body.email,
    password: body.temp_password,
    email_confirm: true,
    user_metadata: {
      full_name: body.full_name,
      role: 'resident',
      must_change_password: true,
    },
  });
  if (createErr || !created.user) {
    return json({ error: createErr?.message ?? 'Could not create user.' }, 400);
  }

  // Patch the profile with property + temp-password flag (in case the trigger
  // didn't pick up must_change_password from metadata).
  const { error: updErr } = await admin
    .from('profiles')
    .update({
      primary_property_id: body.property_id,
      primary_track: unit.id ? null : null, // resolved later from primary unit
      full_name: body.full_name,
      phone: body.phone ?? null,
      must_change_password: true,
    })
    .eq('id', created.user.id);
  if (updErr) {
    await admin.auth.admin.deleteUser(created.user.id);
    return json({ error: updErr.message }, 500);
  }

  // Link the user to the unit.
  const { error: memberErr } = await admin.from('unit_members').insert({
    unit_id: body.unit_id,
    user_id: created.user.id,
    role: body.role,
    is_primary: true,
  });
  if (memberErr) {
    await admin.auth.admin.deleteUser(created.user.id);
    return json({ error: memberErr.message }, 500);
  }

  // Bump primary_track on profile to match the unit's kind.
  const { data: unitFull } = await admin.from('units').select('kind').eq('id', body.unit_id).single();
  if (unitFull?.kind) {
    await admin.from('profiles').update({ primary_track: unitFull.kind }).eq('id', created.user.id);
  }

  return json({ user_id: created.user.id }, 200);
});

function json(payload: unknown, status: number): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}
