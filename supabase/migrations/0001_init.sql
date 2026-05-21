-- ============================================================================
-- AP Enterprises Members — initial schema
-- Tables, enums, triggers, sequences, helper functions.
-- RLS policies live in 0002_rls.sql; storage in 0003_storage_policies.sql.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ─── Enums ──────────────────────────────────────────────────────────────────

create type user_role         as enum ('super_admin', 'property_manager', 'resident', 'attendant');
create type client_track      as enum ('residential', 'commercial');
create type unit_role         as enum ('owner', 'tenant', 'manager', 'contact');
create type unit_status       as enum ('active', 'paused');
create type booking_status    as enum ('scheduled', 'enroute', 'active', 'closed', 'cancelled');
create type service_cadence   as enum (
  'once', 'on_request', 'weekly', 'monthly', 'quarterly',
  'seasonal', 'nightly', 'per_event', 'per_visit', 'per_listing', 'project_based'
);
create type service_tone      as enum ('ink', 'stone', 'wood');
create type attachment_kind   as enum ('before', 'after', 'incident', 'invoice', 'other');
create type notification_kind as enum (
  'booking_created', 'booking_status_changed', 'booking_cancelled',
  'unit_invited', 'password_reset'
);

-- ─── Generic updated_at trigger ─────────────────────────────────────────────

create or replace function touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ─── properties ─────────────────────────────────────────────────────────────

create table properties (
  id          uuid        primary key default gen_random_uuid(),
  slug        text        not null unique,
  name        text        not null,
  city        text        not null,
  address     text,
  unit_count  integer     not null default 0,
  cover_image text,
  active      boolean     not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index properties_slug_idx on properties(slug);
create trigger properties_touch before update on properties
  for each row execute function touch_updated_at();

-- ─── profiles (extends auth.users) ──────────────────────────────────────────

create table profiles (
  id                   uuid         primary key references auth.users(id) on delete cascade,
  role                 user_role    not null default 'resident',
  full_name            text         not null,
  display_name         text,
  email                text         not null,
  phone                text,
  avatar_path          text,
  primary_track        client_track,
  primary_property_id  uuid         references properties(id) on delete set null,
  must_change_password boolean      not null default false,
  created_at           timestamptz  not null default now(),
  updated_at           timestamptz  not null default now()
);
create index profiles_role_idx     on profiles(role);
create index profiles_property_idx on profiles(primary_property_id);
create unique index profiles_email_idx on profiles(lower(email));
create trigger profiles_touch before update on profiles
  for each row execute function touch_updated_at();

-- Auto-create a profile row whenever a new auth.users row is inserted.
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role, must_change_password)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(nullif(new.raw_user_meta_data->>'role', '')::user_role, 'resident'),
    coalesce((new.raw_user_meta_data->>'must_change_password')::boolean, false)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ─── units ──────────────────────────────────────────────────────────────────

create table units (
  id          uuid         primary key default gen_random_uuid(),
  property_id uuid         not null references properties(id) on delete cascade,
  external_id text         not null,
  floor       text         not null,
  kind        client_track not null,
  status      unit_status  not null default 'active',
  notes       text,
  visits      integer      not null default 0,
  since       text         not null default to_char(now(), 'YYYY'),
  created_at  timestamptz  not null default now(),
  updated_at  timestamptz  not null default now(),
  unique (property_id, external_id)
);
create index units_property_idx on units(property_id);
create index units_status_idx   on units(status);
create trigger units_touch before update on units
  for each row execute function touch_updated_at();

-- ─── unit_members (resident ↔ unit) ─────────────────────────────────────────

create table unit_members (
  id         uuid        primary key default gen_random_uuid(),
  unit_id    uuid        not null references units(id) on delete cascade,
  user_id    uuid        not null references auth.users(id) on delete cascade,
  role       unit_role   not null default 'owner',
  is_primary boolean     not null default true,
  created_at timestamptz not null default now(),
  unique (unit_id, user_id)
);
create index unit_members_user_idx on unit_members(user_id);
create index unit_members_unit_idx on unit_members(unit_id);

-- ─── services (catalogue) ───────────────────────────────────────────────────

create table services (
  id          uuid            primary key default gen_random_uuid(),
  slug        text            not null,
  track       client_track    not null,
  name        text            not null,
  kicker      text            not null,
  icon        text            not null,
  tone        service_tone    not null default 'ink',
  price_cents integer         not null check (price_cents >= 0),
  cadence     service_cadence not null default 'on_request',
  description text            not null,
  photo_path  text,
  property_id uuid            references properties(id) on delete cascade,
  active      boolean         not null default true,
  sort_order  integer         not null default 0,
  created_at  timestamptz     not null default now(),
  updated_at  timestamptz     not null default now()
);
create unique index services_slug_scope_idx
  on services (slug, coalesce(property_id, '00000000-0000-0000-0000-000000000000'::uuid));
create index services_track_idx    on services(track);
create index services_property_idx on services(property_id);
create trigger services_touch before update on services
  for each row execute function touch_updated_at();

-- ─── attendants (vendor companies) ──────────────────────────────────────────

create table attendants (
  id            uuid        primary key default gen_random_uuid(),
  name          text        not null,
  property_id   uuid        references properties(id) on delete cascade,
  contact_email text,
  contact_phone text,
  active        boolean     not null default true,
  created_at    timestamptz not null default now()
);
create unique index attendants_unique on attendants(coalesce(property_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(name));

-- ─── bookings ───────────────────────────────────────────────────────────────

create sequence if not exists booking_reference_seq start 4000;

create table bookings (
  id                uuid            primary key default gen_random_uuid(),
  reference         text            not null unique,
  property_id       uuid            not null references properties(id) on delete restrict,
  unit_id           uuid            not null references units(id) on delete restrict,
  service_id        uuid            not null references services(id) on delete restrict,
  attendant_id      uuid            references attendants(id) on delete set null,
  created_by        uuid            not null references auth.users(id),
  scheduled_at      timestamptz     not null,
  duration_min      integer         not null default 60 check (duration_min > 0),
  status            booking_status  not null default 'scheduled',
  price_cents       integer         not null check (price_cents >= 0),
  service_snapshot  jsonb           not null default '{}'::jsonb,
  resident_snapshot jsonb           not null default '{}'::jsonb,
  note              text,
  cancelled_reason  text,
  cancelled_at      timestamptz,
  created_at        timestamptz     not null default now(),
  updated_at        timestamptz     not null default now()
);
create index bookings_property_date_idx on bookings(property_id, scheduled_at);
create index bookings_unit_idx          on bookings(unit_id);
create index bookings_status_idx        on bookings(status);
create index bookings_created_by_idx    on bookings(created_by);
create trigger bookings_touch before update on bookings
  for each row execute function touch_updated_at();

create or replace function set_booking_reference() returns trigger
language plpgsql as $$
begin
  if new.reference is null or new.reference = '' then
    new.reference := 'B-' || nextval('booking_reference_seq')::text;
  end if;
  return new;
end;
$$;
create trigger booking_reference_trg
  before insert on bookings
  for each row execute function set_booking_reference();

-- ─── booking_status_events (audit log) ──────────────────────────────────────

create table booking_status_events (
  id          uuid            primary key default gen_random_uuid(),
  booking_id  uuid            not null references bookings(id) on delete cascade,
  from_status booking_status,
  to_status   booking_status  not null,
  changed_by  uuid            not null references auth.users(id),
  reason      text,
  created_at  timestamptz     not null default now()
);
create index booking_status_events_booking_idx
  on booking_status_events(booking_id, created_at desc);

create or replace function log_booking_status() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into booking_status_events (booking_id, from_status, to_status, changed_by)
    values (new.id, null, new.status, coalesce(new.created_by, auth.uid()));
  elsif tg_op = 'UPDATE' and old.status is distinct from new.status then
    insert into booking_status_events (booking_id, from_status, to_status, changed_by, reason)
    values (new.id, old.status, new.status, coalesce(auth.uid(), new.created_by), new.cancelled_reason);
  end if;
  return new;
end;
$$;
create trigger booking_status_trg
  after insert or update of status on bookings
  for each row execute function log_booking_status();

-- ─── booking_attachments ────────────────────────────────────────────────────

create table booking_attachments (
  id           uuid            primary key default gen_random_uuid(),
  booking_id   uuid            not null references bookings(id) on delete cascade,
  kind         attachment_kind not null default 'after',
  storage_path text            not null,
  caption      text,
  uploaded_by  uuid            not null references auth.users(id),
  created_at   timestamptz     not null default now()
);
create index booking_attachments_booking_idx on booking_attachments(booking_id);

-- ─── notifications (queue for Edge Functions) ───────────────────────────────

create table notifications (
  id         uuid              primary key default gen_random_uuid(),
  user_id    uuid              references auth.users(id) on delete cascade,
  kind       notification_kind not null,
  payload    jsonb             not null default '{}'::jsonb,
  sent_at    timestamptz,
  created_at timestamptz       not null default now()
);
create index notifications_unsent_idx on notifications(created_at) where sent_at is null;

-- ─── Helper functions used by RLS policies ──────────────────────────────────

create or replace function is_super_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'super_admin'
  );
$$;

create or replace function is_manager_of(p_property uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
      and role = 'property_manager'
      and primary_property_id = p_property
  );
$$;

create or replace function is_unit_member(p_unit uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from unit_members
    where unit_id = p_unit and user_id = auth.uid()
  );
$$;

-- Enable Realtime publication for bookings (Pipeline drag-drop sync).
alter publication supabase_realtime add table bookings;
alter publication supabase_realtime add table booking_status_events;
