/**
 * MSW handlers that mimic the slice of Supabase REST + Auth + Functions APIs
 * our app touches. Not a full Supabase reimplementation — just enough to test
 * the flows that exist today. Add handlers as needed.
 */
import { HttpResponse, http } from 'msw';
import { findUserByEmail, findUserBySession, getStore, mintSession } from './store';
import type { Json, ProfileRow } from '../lib/types/db';

const BASE = 'https://test.supabase.co';

function authedUser(request: Request) {
  const auth = request.headers.get('Authorization');
  const token = auth?.startsWith('Bearer ') ? auth.slice('Bearer '.length) : undefined;
  return findUserBySession(token);
}

function parseEq(value: string | null): { op: string; value: string } | null {
  if (!value) return null;
  const [op, ...rest] = value.split('.');
  return { op: op ?? 'eq', value: rest.join('.') };
}

function applyEqFilters<T extends Record<string, unknown>>(
  rows: T[],
  url: URL,
  fields: (keyof T)[],
): T[] {
  let out = rows;
  for (const field of fields) {
    const filter = parseEq(url.searchParams.get(String(field)));
    if (filter && (filter.op === 'eq' || filter.op === 'is')) {
      const value = filter.value === 'null' ? null : filter.value;
      out = out.filter((row) => row[field] === value);
    }
  }
  return out;
}

/**
 * Supabase JS adds `Accept: application/vnd.pgrst.object+json` for `.single()`
 * and `.maybeSingle()`. PostgREST returns a single object in that case, not
 * an array. Mirror that behaviour so the SDK is happy.
 */
function respondRows<T>(rows: T[], request: Request, status = 200): Response {
  const accept = request.headers.get('Accept') ?? '';
  if (accept.includes('application/vnd.pgrst.object+json')) {
    if (rows.length === 0) {
      return HttpResponse.json(
        {
          code: 'PGRST116',
          details: 'The result contains 0 rows',
          message: 'JSON object requested, multiple (or no) rows returned',
        },
        { status: 406 },
      );
    }
    return HttpResponse.json(rows[0] as never, { status });
  }
  return HttpResponse.json(rows as never, { status });
}

export const handlers = [
  // ─── Auth ────────────────────────────────────────────────────────────────

  http.post(`${BASE}/auth/v1/token`, async ({ request }) => {
    const url = new URL(request.url);
    if (url.searchParams.get('grant_type') !== 'password') {
      return HttpResponse.json({ error: 'unsupported_grant_type' }, { status: 400 });
    }
    const body = (await request.json()) as { email?: string; password?: string };
    const user = findUserByEmail(body.email ?? '');
    if (!user || user.password !== body.password) {
      return HttpResponse.json(
        { error: 'invalid_grant', error_description: 'Invalid login credentials' },
        { status: 400 },
      );
    }
    const session = mintSession(user.id);
    return HttpResponse.json({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_in: 3600,
      token_type: 'bearer',
      user: { id: user.id, email: user.email, user_metadata: user.metadata },
    });
  }),

  http.get(`${BASE}/auth/v1/user`, ({ request }) => {
    const user = authedUser(request);
    if (!user) return HttpResponse.json({ msg: 'unauthorized' }, { status: 401 });
    return HttpResponse.json({ id: user.id, email: user.email, user_metadata: user.metadata });
  }),

  http.post(`${BASE}/auth/v1/logout`, () => HttpResponse.json({}, { status: 204 })),

  http.put(`${BASE}/auth/v1/user`, async ({ request }) => {
    const user = authedUser(request);
    if (!user) return HttpResponse.json({ msg: 'unauthorized' }, { status: 401 });
    const body = (await request.json()) as { password?: string };
    if (body.password) user.password = body.password;
    return HttpResponse.json({ id: user.id, email: user.email, user_metadata: user.metadata });
  }),

  // ─── REST: profiles ──────────────────────────────────────────────────────

  http.get(`${BASE}/rest/v1/profiles`, ({ request }) => {
    const url = new URL(request.url);
    const rows = applyEqFilters(getStore().profiles, url, ['id', 'role', 'primary_property_id']);
    return respondRows(rows, request);
  }),

  http.patch(`${BASE}/rest/v1/profiles`, async ({ request }) => {
    const url = new URL(request.url);
    const filter = parseEq(url.searchParams.get('id'));
    const body = (await request.json()) as Partial<ProfileRow>;
    const store = getStore();
    const updated: ProfileRow[] = [];
    store.profiles = store.profiles.map((p) => {
      if (filter && p.id === filter.value) {
        const next = { ...p, ...body, updated_at: new Date().toISOString() };
        updated.push(next);
        return next;
      }
      return p;
    });
    return respondRows(updated, request);
  }),

  // ─── REST: properties ────────────────────────────────────────────────────

  http.get(`${BASE}/rest/v1/properties`, ({ request }) => {
    const url = new URL(request.url);
    const rows = applyEqFilters(getStore().properties, url, ['id', 'slug']);
    return respondRows(rows, request);
  }),

  http.post(`${BASE}/rest/v1/properties`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const now = new Date().toISOString();
    const row = {
      id: `prop-${Math.random().toString(36).slice(2, 8)}`,
      slug: String(body.slug ?? ''),
      name: String(body.name ?? ''),
      city: String(body.city ?? ''),
      address: (body.address as string | null) ?? null,
      unit_count: Number(body.unit_count ?? 0),
      cover_image: null,
      active: true,
      created_at: now,
      updated_at: now,
    };
    getStore().properties.push(row);
    return respondRows([row], request, 201);
  }),

  // ─── REST: services ──────────────────────────────────────────────────────

  http.get(`${BASE}/rest/v1/services`, ({ request }) => {
    const url = new URL(request.url);
    let rows = getStore().services.filter((s) => s.active);
    const track = parseEq(url.searchParams.get('track'));
    if (track) rows = rows.filter((s) => s.track === track.value);
    return respondRows(rows, request);
  }),

  // ─── REST: units ─────────────────────────────────────────────────────────

  http.get(`${BASE}/rest/v1/units`, ({ request }) => {
    const url = new URL(request.url);
    let rows = applyEqFilters(getStore().units, url, ['id', 'property_id', 'external_id']);
    // Support the joined select: ?select=*,members:unit_members(*,profile:profiles(*))
    if (url.searchParams.get('select')?.includes('unit_members')) {
      const { unitMembers, profiles } = getStore();
      rows = rows.map((u) => ({
        ...u,
        members: unitMembers
          .filter((m) => m.unit_id === u.id)
          .map((m) => ({
            role: m.role,
            is_primary: m.is_primary,
            profile: profiles.find((p) => p.id === m.user_id) ?? null,
          })),
      })) as never;
    }
    return respondRows(rows, request);
  }),

  http.post(`${BASE}/rest/v1/units`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const now = new Date().toISOString();
    const row = {
      id: `unit-${Math.random().toString(36).slice(2, 8)}`,
      property_id: String(body.property_id ?? ''),
      external_id: String(body.external_id ?? ''),
      floor: String(body.floor ?? ''),
      kind: (body.kind ?? 'residential') as 'residential' | 'commercial',
      status: (body.status ?? 'active') as 'active' | 'paused',
      notes: (body.notes as string | null) ?? null,
      visits: 0,
      since: String(new Date().getFullYear()),
      created_at: now,
      updated_at: now,
    };
    getStore().units.push(row);
    return respondRows([row], request, 201);
  }),

  http.patch(`${BASE}/rest/v1/units`, async ({ request }) => {
    const url = new URL(request.url);
    const filter = parseEq(url.searchParams.get('id'));
    const body = (await request.json()) as Record<string, unknown>;
    const store = getStore();
    const updated = [] as typeof store.units;
    store.units = store.units.map((u) => {
      if (filter && u.id === filter.value) {
        const next = { ...u, ...body, updated_at: new Date().toISOString() };
        updated.push(next);
        return next;
      }
      return u;
    });
    return respondRows(updated, request);
  }),

  http.delete(`${BASE}/rest/v1/units`, ({ request }) => {
    const url = new URL(request.url);
    const filter = parseEq(url.searchParams.get('id'));
    if (!filter) return HttpResponse.json([], { status: 200 });
    const store = getStore();
    store.units = store.units.filter((u) => u.id !== filter.value);
    return HttpResponse.json([], { status: 200 });
  }),

  // ─── REST: unit_members ──────────────────────────────────────────────────

  http.get(`${BASE}/rest/v1/unit_members`, ({ request }) => {
    const url = new URL(request.url);
    const select = url.searchParams.get('select') ?? '';
    let rows = applyEqFilters(getStore().unitMembers, url, ['unit_id', 'user_id']);
    if (select.includes('units')) {
      const { units } = getStore();
      rows = rows.map((m) => {
        const embedded = units.find((u) => u.id === m.unit_id) ?? null;
        // Surface BOTH possible keys so we cover the two select shapes:
        //   `unit:units(*)`     → key 'unit'  (aliased)
        //   `units!inner(...)`  → key 'units' (raw)
        return { ...m, units: embedded, unit: embedded };
      }) as never;
    }
    return respondRows(rows, request);
  }),

  http.post(`${BASE}/rest/v1/unit_members`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const row = {
      id: `member-${Math.random().toString(36).slice(2, 8)}`,
      unit_id: String(body.unit_id ?? ''),
      user_id: String(body.user_id ?? ''),
      role: (body.role ?? 'owner') as 'owner' | 'tenant' | 'manager' | 'contact',
      is_primary: Boolean(body.is_primary ?? true),
      created_at: new Date().toISOString(),
    };
    getStore().unitMembers.push(row);
    return respondRows([row], request, 201);
  }),

  // ─── REST: attendants ────────────────────────────────────────────────────

  http.get(`${BASE}/rest/v1/attendants`, ({ request }) => {
    const url = new URL(request.url);
    const rows = applyEqFilters(getStore().attendants, url, ['property_id', 'active']);
    return respondRows(rows, request);
  }),

  // ─── REST: bookings ──────────────────────────────────────────────────────

  http.get(`${BASE}/rest/v1/bookings`, ({ request }) => {
    const url = new URL(request.url);
    const rows = applyEqFilters(getStore().bookings, url, ['property_id', 'unit_id', 'created_by']);
    return respondRows(rows, request);
  }),

  http.post(`${BASE}/rest/v1/bookings`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const now = new Date().toISOString();
    const store = getStore();
    const refIndex = store.bookings.length + 1;
    const row = {
      id: `bk-${Math.random().toString(36).slice(2, 8)}`,
      reference: `B-${4000 + refIndex}`,
      property_id: String(body.property_id ?? ''),
      unit_id: String(body.unit_id ?? ''),
      service_id: String(body.service_id ?? ''),
      attendant_id: (body.attendant_id as string | null) ?? null,
      created_by: String(body.created_by ?? ''),
      scheduled_at: String(body.scheduled_at ?? now),
      duration_min: Number(body.duration_min ?? 60),
      status: 'scheduled' as const,
      price_cents: Number(body.price_cents ?? 0),
      service_snapshot: (body.service_snapshot ?? {}) as Json,
      resident_snapshot: (body.resident_snapshot ?? {}) as Json,
      note: (body.note as string | null) ?? null,
      cancelled_reason: null,
      cancelled_at: null,
      arrived_at: null,
      created_at: now,
      updated_at: now,
    };
    store.bookings.unshift(row);
    return respondRows([row], request, 201);
  }),

  http.patch(`${BASE}/rest/v1/bookings`, async ({ request }) => {
    const url = new URL(request.url);
    const filter = parseEq(url.searchParams.get('id'));
    const body = (await request.json()) as Record<string, unknown>;
    const store = getStore();
    const updated = [] as typeof store.bookings;
    store.bookings = store.bookings.map((b) => {
      if (filter && b.id === filter.value) {
        const next = { ...b, ...body, updated_at: new Date().toISOString() };
        updated.push(next);
        return next;
      }
      return b;
    });
    return respondRows(updated, request);
  }),

  // ─── REST: attendant_messages ────────────────────────────────────────────

  http.get(`${BASE}/rest/v1/attendant_messages`, ({ request }) => {
    const url = new URL(request.url);
    const rows = applyEqFilters(getStore().messages, url, ['booking_id', 'sender_id']);
    return respondRows(rows, request);
  }),

  http.post(`${BASE}/rest/v1/attendant_messages`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const row = {
      id: `msg-${Math.random().toString(36).slice(2, 8)}`,
      booking_id: String(body.booking_id ?? ''),
      sender_id: String(body.sender_id ?? ''),
      body: String(body.body ?? ''),
      created_at: new Date().toISOString(),
    };
    getStore().messages.push(row);
    return respondRows([row], request, 201);
  }),

  // ─── REST: notifications ─────────────────────────────────────────────────

  http.get(`${BASE}/rest/v1/notifications`, ({ request }) => {
    const url = new URL(request.url);
    const rows = applyEqFilters(getStore().notifications, url, ['user_id']);
    return respondRows(rows, request);
  }),

  http.patch(`${BASE}/rest/v1/notifications`, async ({ request }) => {
    const url = new URL(request.url);
    const filter = parseEq(url.searchParams.get('id'));
    const body = (await request.json()) as Record<string, unknown>;
    const store = getStore();
    const updated = [] as typeof store.notifications;
    store.notifications = store.notifications.map((n) => {
      if (filter && n.id === filter.value) {
        const next = { ...n, ...body };
        updated.push(next);
        return next;
      }
      return n;
    });
    return respondRows(updated, request);
  }),

  // ─── REST: properties update/delete ──────────────────────────────────────

  http.patch(`${BASE}/rest/v1/properties`, async ({ request }) => {
    const url = new URL(request.url);
    const filter = parseEq(url.searchParams.get('id'));
    const body = (await request.json()) as Record<string, unknown>;
    const store = getStore();
    const updated = [] as typeof store.properties;
    store.properties = store.properties.map((p) => {
      if (filter && p.id === filter.value) {
        const next = { ...p, ...body, updated_at: new Date().toISOString() };
        updated.push(next);
        return next;
      }
      return p;
    });
    return respondRows(updated, request);
  }),

  http.delete(`${BASE}/rest/v1/properties`, ({ request }) => {
    const url = new URL(request.url);
    const filter = parseEq(url.searchParams.get('id'));
    if (!filter) return HttpResponse.json([], { status: 200 });
    const store = getStore();
    store.properties = store.properties.filter((p) => p.id !== filter.value);
    return HttpResponse.json([], { status: 200 });
  }),

  // ─── Edge Functions ──────────────────────────────────────────────────────

  http.post(`${BASE}/functions/v1/cancel-booking`, async ({ request }) => {
    const body = (await request.json()) as { id?: string; reason?: string };
    if (!body.id) return HttpResponse.json({ error: 'Missing booking id.' }, { status: 400 });
    const store = getStore();
    store.bookings = store.bookings.map((b) =>
      b.id === body.id
        ? {
            ...b,
            status: 'cancelled' as const,
            cancelled_reason: body.reason ?? null,
            cancelled_at: new Date().toISOString(),
          }
        : b,
    );
    return HttpResponse.json({ ok: true });
  }),

  http.post(`${BASE}/functions/v1/create-resident-user`, async ({ request }) => {
    const body = (await request.json()) as {
      email: string;
      full_name: string;
      temp_password: string;
      unit_id: string;
      property_id: string;
      role: 'owner' | 'tenant' | 'manager' | 'contact';
    };
    const store = getStore();
    const newUserId = `user-${Math.random().toString(36).slice(2, 8)}`;
    store.users.push({
      id: newUserId,
      email: body.email,
      password: body.temp_password,
      metadata: { full_name: body.full_name, role: 'resident', must_change_password: true },
    });
    const unit = store.units.find((u) => u.id === body.unit_id);
    store.profiles.push({
      id: newUserId,
      role: 'resident',
      full_name: body.full_name,
      display_name: null,
      email: body.email,
      phone: null,
      avatar_path: null,
      primary_track: unit?.kind ?? 'residential',
      primary_property_id: body.property_id,
      must_change_password: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    store.unitMembers.push({
      id: `member-${Math.random().toString(36).slice(2, 8)}`,
      unit_id: body.unit_id,
      user_id: newUserId,
      role: body.role,
      is_primary: true,
      created_at: new Date().toISOString(),
    });
    return HttpResponse.json({ user_id: newUserId });
  }),

  http.post(`${BASE}/functions/v1/manage-staff-user`, async ({ request }) => {
    const body = (await request.json()) as { action: string; user_id: string; [k: string]: unknown };
    const store = getStore();
    if (body.action === 'update') {
      const patch: Record<string, unknown> = {};
      if (typeof body.full_name === 'string') patch.full_name = body.full_name;
      if (body.property_id !== undefined) patch.primary_property_id = body.property_id;
      if (body.phone !== undefined) patch.phone = body.phone;
      store.profiles = store.profiles.map((p) =>
        p.id === body.user_id ? { ...p, ...patch, updated_at: new Date().toISOString() } : p,
      );
      return HttpResponse.json({ ok: true });
    }
    if (body.action === 'reset_password') {
      const user = store.users.find((u) => u.id === body.user_id);
      if (user) user.password = String(body.temp_password ?? '');
      store.profiles = store.profiles.map((p) =>
        p.id === body.user_id ? { ...p, must_change_password: true } : p,
      );
      return HttpResponse.json({ ok: true });
    }
    if (body.action === 'delete') {
      store.users = store.users.filter((u) => u.id !== body.user_id);
      store.profiles = store.profiles.filter((p) => p.id !== body.user_id);
      return HttpResponse.json({ ok: true });
    }
    return HttpResponse.json({ error: 'unknown action' }, { status: 400 });
  }),

  http.post(`${BASE}/functions/v1/create-staff-user`, async ({ request }) => {
    const body = (await request.json()) as {
      email: string;
      full_name: string;
      temp_password: string;
      role: 'super_admin' | 'property_manager';
      property_id?: string | null;
    };
    const store = getStore();
    const newUserId = `user-${Math.random().toString(36).slice(2, 8)}`;
    store.users.push({
      id: newUserId,
      email: body.email,
      password: body.temp_password,
      metadata: { full_name: body.full_name, role: body.role },
    });
    store.profiles.push({
      id: newUserId,
      role: body.role,
      full_name: body.full_name,
      display_name: null,
      email: body.email,
      phone: null,
      avatar_path: null,
      primary_track: null,
      primary_property_id: body.property_id ?? null,
      must_change_password: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    return HttpResponse.json({ user_id: newUserId, already_existed: false });
  }),
];
