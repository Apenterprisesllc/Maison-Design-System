/**
 * Bootstrap the AP Enterprises Supabase project with seed users.
 *
 *   npm run bootstrap
 *
 * Reads creds from .env.local. Idempotent — running it twice is safe:
 *   - Existing auth users keep their password (we don't overwrite).
 *   - Profiles + memberships are upserted to the latest role / property.
 *
 * Creates:
 *   1. A super_admin                 (BOOTSTRAP_ADMIN_*).
 *   2. A property_manager            (BOOTSTRAP_MANAGER_*) for property slug.
 *   3. A residential resident        (BOOTSTRAP_RESIDENT_*) attached to a unit.
 *   4. A commercial client           (BOOTSTRAP_CLIENT_*) attached to a unit.
 *
 * Run via: node --env-file=.env.local scripts/bootstrap.mjs
 * Or just: npm run bootstrap
 */

import { createClient } from '@supabase/supabase-js';

const URL = process.env.VITE_SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !SERVICE) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local.');
  process.exit(1);
}

const supabase = createClient(URL, SERVICE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const staff = [
  {
    label: 'super_admin',
    email: process.env.BOOTSTRAP_ADMIN_EMAIL,
    password: process.env.BOOTSTRAP_ADMIN_PASSWORD,
    fullName: process.env.BOOTSTRAP_ADMIN_NAME,
    role: 'super_admin',
    propertySlug: null,
  },
  {
    label: 'property_manager',
    email: process.env.BOOTSTRAP_MANAGER_EMAIL,
    password: process.env.BOOTSTRAP_MANAGER_PASSWORD,
    fullName: process.env.BOOTSTRAP_MANAGER_NAME,
    role: 'property_manager',
    propertySlug: process.env.BOOTSTRAP_MANAGER_PROPERTY_SLUG,
  },
];

const residents = [
  {
    label: 'residential resident',
    email: process.env.BOOTSTRAP_RESIDENT_EMAIL,
    password: process.env.BOOTSTRAP_RESIDENT_PASSWORD,
    fullName: process.env.BOOTSTRAP_RESIDENT_NAME,
    propertySlug: process.env.BOOTSTRAP_RESIDENT_PROPERTY_SLUG,
    unitExternalId: process.env.BOOTSTRAP_RESIDENT_UNIT,
    track: 'residential',
    memberRole: 'owner',
  },
  {
    label: 'commercial client',
    email: process.env.BOOTSTRAP_CLIENT_EMAIL,
    password: process.env.BOOTSTRAP_CLIENT_PASSWORD,
    fullName: process.env.BOOTSTRAP_CLIENT_NAME,
    propertySlug: process.env.BOOTSTRAP_CLIENT_PROPERTY_SLUG,
    unitExternalId: process.env.BOOTSTRAP_CLIENT_UNIT,
    track: 'commercial',
    memberRole: 'manager',
  },
];

// ─── helpers ────────────────────────────────────────────────────────────────

async function findOrCreateUser(email, password, fullName, role) {
  const { data: existing } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
  const match = existing?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (match) return { userId: match.id, created: false };

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role },
  });
  if (error) throw error;
  return { userId: data.user.id, created: true };
}

async function resolveProperty(slug) {
  if (!slug) return null;
  const { data, error } = await supabase
    .from('properties')
    .select('id, name')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

async function resolveUnit(propertyId, externalId) {
  const { data, error } = await supabase
    .from('units')
    .select('id, external_id, kind')
    .eq('property_id', propertyId)
    .eq('external_id', externalId)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

// ─── staff (super_admin + manager) ──────────────────────────────────────────

for (const a of staff) {
  if (!a.email || !a.password || !a.fullName) {
    console.error(`Skipping ${a.label}: missing BOOTSTRAP_${a.label.toUpperCase()}_* env vars.`);
    continue;
  }
  console.log(`\n[${a.label}] ${a.email}`);

  try {
    const { userId, created } = await findOrCreateUser(a.email, a.password, a.fullName, a.role);
    console.log(created ? '   user created' : '   user already exists — keeping current password');

    let propertyId = null;
    if (a.propertySlug) {
      const prop = await resolveProperty(a.propertySlug);
      if (!prop) {
        console.error(`   property slug "${a.propertySlug}" not found — skipping link`);
      } else {
        propertyId = prop.id;
        console.log(`   linked to property ${prop.name}`);
      }
    }

    const { error: profErr } = await supabase
      .from('profiles')
      .update({
        role: a.role,
        full_name: a.fullName,
        primary_property_id: propertyId,
        must_change_password: false,
      })
      .eq('id', userId);
    if (profErr) {
      console.error('   profile update failed:', profErr.message);
    } else {
      console.log(`   profile set to role=${a.role}`);
    }
  } catch (err) {
    console.error('   failed:', err.message);
  }
}

// ─── residents (residential + commercial) ───────────────────────────────────

for (const r of residents) {
  if (!r.email || !r.password || !r.fullName || !r.propertySlug || !r.unitExternalId) {
    console.error(`Skipping ${r.label}: missing required BOOTSTRAP_* env vars.`);
    continue;
  }
  console.log(`\n[${r.label}] ${r.email}`);

  try {
    const prop = await resolveProperty(r.propertySlug);
    if (!prop) {
      console.error(`   property slug "${r.propertySlug}" not found`);
      continue;
    }
    const unit = await resolveUnit(prop.id, r.unitExternalId);
    if (!unit) {
      console.error(`   unit "${r.unitExternalId}" not found in ${prop.name}`);
      continue;
    }
    if (unit.kind !== r.track) {
      console.error(
        `   unit "${r.unitExternalId}" is ${unit.kind}, but ${r.label} expects ${r.track} — skipping`,
      );
      continue;
    }

    const { userId, created } = await findOrCreateUser(r.email, r.password, r.fullName, 'resident');
    console.log(created ? '   user created' : '   user already exists — keeping current password');

    const { error: profErr } = await supabase
      .from('profiles')
      .update({
        role: 'resident',
        full_name: r.fullName,
        primary_property_id: prop.id,
        primary_track: r.track,
        must_change_password: false,
      })
      .eq('id', userId);
    if (profErr) {
      console.error('   profile update failed:', profErr.message);
      continue;
    }

    // unit_members has unique(unit_id, user_id) — upsert via delete-and-insert.
    const { error: delErr } = await supabase
      .from('unit_members')
      .delete()
      .eq('unit_id', unit.id)
      .eq('user_id', userId);
    if (delErr) {
      console.error('   could not clear prior membership:', delErr.message);
      continue;
    }
    const { error: memErr } = await supabase.from('unit_members').insert({
      unit_id: unit.id,
      user_id: userId,
      role: r.memberRole,
      is_primary: true,
    });
    if (memErr) {
      console.error('   could not attach to unit:', memErr.message);
      continue;
    }
    console.log(`   linked to unit ${unit.external_id} of ${prop.name} (${r.track})`);
  } catch (err) {
    console.error('   failed:', err.message);
  }
}

// ─── summary ────────────────────────────────────────────────────────────────

console.log('\nDone. Credentials to share with the client:\n');
const all = [...staff, ...residents];
for (const a of all) {
  if (!a.email || !a.password) continue;
  console.log(`  ${a.label}`);
  console.log(`    email:    ${a.email}`);
  console.log(`    password: ${a.password}`);
  console.log();
}
console.log('Sign in at:');
console.log('  super_admin       → /sign-in/manager  → /admin');
console.log('  property_manager  → /sign-in/manager  → /ops');
console.log('  residents         → /sign-in/resident → /portal');
