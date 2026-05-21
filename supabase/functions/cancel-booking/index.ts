// @ts-nocheck
// Deno Edge Function — centralised cancellation with business rules.
// Residents have no RLS UPDATE on bookings; this function lets them cancel
// when allowed and lets managers cancel with the same code path.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface Body {
  id: string;
  reason?: string | null;
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
  const { data: caller, error: callerErr } = await callerClient.auth.getUser();
  if (callerErr || !caller?.user) {
    return json({ error: 'Invalid session.' }, 401);
  }

  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body?.id) return json({ error: 'Missing booking id.' }, 400);

  // RLS-aware fetch — caller can only see bookings they're allowed to.
  const { data: booking, error: lookErr } = await callerClient
    .from('bookings')
    .select('id, property_id, unit_id, created_by, status, scheduled_at')
    .eq('id', body.id)
    .maybeSingle();
  if (lookErr || !booking) return json({ error: 'Booking not found.' }, 404);

  if (booking.status === 'cancelled') return json({ ok: true }, 200);
  if (booking.status === 'closed') return json({ error: 'Booking already closed.' }, 422);

  const hoursUntil = (new Date(booking.scheduled_at).getTime() - Date.now()) / 3_600_000;
  if (booking.status === 'enroute' && hoursUntil < 2) {
    return json({ error: 'Attendant is en route. Contact the front desk.' }, 422);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: updErr } = await admin
    .from('bookings')
    .update({
      status: 'cancelled',
      cancelled_reason: body.reason ?? null,
      cancelled_at: new Date().toISOString(),
    })
    .eq('id', body.id);
  if (updErr) return json({ error: updErr.message }, 500);

  return json({ ok: true }, 200);
});

function json(payload: unknown, status: number): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}
