-- ============================================================================
-- AP Enterprises Members — seed data
-- Idempotent: safe to run multiple times.
-- ============================================================================

-- ─── Properties ─────────────────────────────────────────────────────────────

insert into properties (slug, name, city, address, unit_count)
values
  ('the-arden', 'The Arden', 'Miami', '1200 Brickell Bay Dr, Miami, FL', 240)
on conflict (slug) do nothing;

-- ─── Services (global catalogue: property_id = null) ───────────────────────
-- 6 residential + 7 commercial, mirroring src/routes/Portal/data.ts.

with target as (select null::uuid as property_id)
insert into services (slug, track, name, kicker, icon, tone, price_cents, cadence, description, property_id, sort_order)
select s.slug, s.track::client_track, s.name, s.kicker, s.icon, s.tone::service_tone, s.price_cents, s.cadence::service_cadence, s.description, t.property_id, s.sort_order
from target t
cross join (values
  ('deep',              'residential', 'Deep Cleaning',          'Housekeeping', 'sparkles',     'stone', 32000, 'monthly',       'A full residence clean by a two-person team. Linens included on request.', 10),
  ('housekeeping',      'residential', 'Housekeeping',           'Weekly Care',  'broom',        'ink',   18000, 'weekly',        'Standing weekly visit. Floors, baths, kitchen, and surface dressing — quiet, attentive, complete.', 20),
  ('marble',            'residential', 'Marble Polishing',       'Stone Care',   'gem',          'wood',  42000, 'on_request',    'Diamond polishing for marble, travertine, and limestone. Restores the finish without aggressive grinding.', 30),
  ('window',            'residential', 'Window Service',         'Glazing',      'panel-top',    'ink',   24000, 'quarterly',     'Interior and exterior cleaning, including hardware polish on operable windows.', 40),
  ('disinfecting',      'residential', 'Disinfecting',           'Sanitation',   'shield-check', 'stone', 22000, 'on_request',    'Hospital-grade disinfecting for high-touch surfaces, kitchens, and shared baths.', 50),
  ('moveinout',         'residential', 'Move-In / Move-Out',     'Turnover',     'key-round',    'wood',  38000, 'once',          'Full residence turnover — appliances, cabinetry interiors, and floor finishing. Ready for the next chapter.', 60),
  ('post-construction', 'commercial',  'Post-Construction',      'Punch List',   'construction', 'wood',  62000, 'project_based', 'Final clean after build-out — dust pull, debris haul, fixture polish. Ready for the certificate of occupancy.', 10),
  ('office-night',      'commercial',  'After-Hours Office',     'Nightly',      'building-2',   'ink',   29000, 'nightly',       'Discreet overnight crews. Desks, glass, breakrooms, restrooms — the floor reset by 6 a.m.', 20),
  ('restaurant-night',  'commercial',  'After-Hours Restaurant', 'Hospitality',  'utensils',     'wood',  34000, 'nightly',       'Front-of-house, line, and back-of-house. Grease, glass, floors — sanitized before doors open.', 30),
  ('commercial',        'commercial',  'Commercial Cleaning',    'Standing',     'briefcase',    'ink',   24000, 'weekly',        'Weekly standing service for offices, showrooms, and lobbies. One point of contact, one consistent crew.', 40),
  ('epoxy',             'commercial',  'Epoxy Floor Service',    'Floor Coating','layers',       'stone', 98000, 'on_request',    'Industrial epoxy installation and restoration for garages, warehouses, and back-of-house. Cured and ready in 48 hours.', 50),
  ('events',            'commercial',  'Events Cleaning',        'Pre / Post',   'party-popper', 'wood',  46000, 'per_event',     'Pre-event setup polish and post-event reset. Banquet halls, galleries, rooftops — out by load-out.', 60),
  ('real-estate',       'commercial',  'Real Estate Turnover',   'Listings',     'home',         'stone', 36000, 'per_listing',   'Listing prep and post-closing reset. Photo-ready in a single visit; Airbnb turns included.', 70)
) as s(slug, track, name, kicker, icon, tone, price_cents, cadence, description, sort_order)
on conflict do nothing;

-- ─── Attendants (scoped to The Arden) ──────────────────────────────────────

with prop as (select id from properties where slug = 'the-arden')
insert into attendants (name, property_id)
select n, prop.id
from prop, (values
  ('Hudson & Co.'),
  ('Marble & Linen'),
  ('Hollis Grounds'),
  ('Doorman Services'),
  ('Atelier Restoration')
) as a(n)
on conflict do nothing;

-- ─── Units (The Arden seed directory) ──────────────────────────────────────

with prop as (select id from properties where slug = 'the-arden')
insert into units (property_id, external_id, floor, kind, status, since)
select prop.id, u.external_id, u.floor, u.kind::client_track, u.status::unit_status, u.since
from prop, (values
  ('PH-02', 'Penthouse', 'residential', 'active', '2021'),
  ('PH-03', 'Penthouse', 'residential', 'active', '2022'),
  ('2104',  '21',        'residential', 'active', '2024'),
  ('1801',  '18',        'residential', 'active', '2024'),
  ('1606',  '16',        'residential', 'active', '2022'),
  ('1402',  '14',        'residential', 'active', '2025'),
  ('1204',  '12',        'residential', 'active', '2023'),
  ('1107',  '11',        'residential', 'paused', '2026'),
  ('0903',  '9',         'residential', 'active', '2024'),
  ('0809',  '8',         'residential', 'active', '2023'),
  ('0708',  '7',         'residential', 'active', '2024'),
  ('0512',  '5',         'residential', 'active', '2025'),
  ('C-01',  'Lobby',     'commercial',  'active', '2023'),
  ('C-02',  'Ground',    'commercial',  'active', '2024')
) as u(external_id, floor, kind, status, since)
on conflict (property_id, external_id) do nothing;

-- ============================================================================
-- BOOTSTRAP NOTE
-- ----------------------------------------------------------------------------
-- After running migrations + seed, manually bootstrap roles via Studio:
--
--   1. In Dashboard → Authentication → Add user
--      `admin@apenterprises.example` (any password).
--   2. SQL editor:
--        update profiles
--           set role = 'super_admin'
--         where email = 'admin@apenterprises.example';
--
--   3. Create a property manager via Dashboard → Add user.
--   4. SQL:
--        update profiles
--           set role = 'property_manager',
--               primary_property_id = (select id from properties where slug = 'the-arden')
--         where email = 'manager@thearden.example';
--
-- Residents are then created in-app via the Ops "Add Entry" form
-- (which calls the `create-resident-user` Edge Function).
-- ============================================================================
