-- ============================================================================
-- Placeholder communities for the public guest booking flow.
--
-- These are stand-ins until the client provides the real list. The slugs are
-- stable so app code can link to them, but the names can be updated freely
-- with `update properties set name = ... where slug = ...;`.
--
-- Idempotent.
-- ============================================================================

insert into properties (slug, name, city, address, unit_count, cover_image)
values
  ('club-riviera-miami',        'Club Riviera Miami',         'Miami',       '480 NE 31st St, Miami, FL',              6, null),
  ('coastal-palms-residences',  'Coastal Palms Residences',   'Miami Beach', '2100 Collins Ave, Miami Beach, FL',      6, null),
  ('solana-estates',            'Solana Estates',             'Coral Gables','3400 Granada Blvd, Coral Gables, FL',    5, null),
  ('bayshore-heights',          'Bayshore Heights',           'Miami',       '2600 S Bayshore Dr, Miami, FL',          6, null),
  ('marina-pointe-club',        'Marina Pointe Club',         'Aventura',    '20000 E Country Club Dr, Aventura, FL',  6, null),
  ('royal-palm-quarter',        'Royal Palm Quarter',         'Palm Beach',  '160 Royal Palm Way, Palm Beach, FL',     5, null),
  ('sunset-harbor-club',        'Sunset Harbor Club',         'Miami Beach', '1800 Sunset Harbour Dr, Miami Beach, FL',6, null),
  ('cypress-grove-plaza',       'Cypress Grove Commercial Plaza','Doral',    '8200 NW 25th St, Doral, FL',             6, null)
on conflict (slug) do nothing;

-- ─── Units per property ─────────────────────────────────────────────────────
-- A mix of residential apartments and commercial spaces; external_id values
-- match what an end-user would write on a delivery slip ("Apt 401", "Suite 03",
-- "Penthouse A", "Local 2"). All start as active so they appear in the
-- guest unit picker.

-- Club Riviera Miami — luxury condo, mostly residential, one ground retail
with prop as (select id from properties where slug = 'club-riviera-miami')
insert into units (property_id, external_id, floor, kind, status, since)
select prop.id, u.external_id, u.floor, u.kind::client_track, 'active'::unit_status, u.since
from prop, (values
  ('Apt 1801', '18', 'residential', '2023'),
  ('Apt 1604', '16', 'residential', '2024'),
  ('Apt 1207', '12', 'residential', '2024'),
  ('Apt 0902', '9',  'residential', '2025'),
  ('PH A',     'Penthouse', 'residential', '2022'),
  ('Suite L1', 'Lobby',     'commercial',  '2023')
) as u(external_id, floor, kind, since)
on conflict (property_id, external_id) do nothing;

-- Coastal Palms Residences — oceanfront condos
with prop as (select id from properties where slug = 'coastal-palms-residences')
insert into units (property_id, external_id, floor, kind, status, since)
select prop.id, u.external_id, u.floor, u.kind::client_track, 'active'::unit_status, u.since
from prop, (values
  ('Apt 2105', '21', 'residential', '2024'),
  ('Apt 1903', '19', 'residential', '2023'),
  ('Apt 1410', '14', 'residential', '2024'),
  ('Apt 1102', '11', 'residential', '2025'),
  ('Apt 0708', '7',  'residential', '2023'),
  ('Cabana 04','Ground','commercial','2024')
) as u(external_id, floor, kind, since)
on conflict (property_id, external_id) do nothing;

-- Solana Estates — gated single-family community, residential only
with prop as (select id from properties where slug = 'solana-estates')
insert into units (property_id, external_id, floor, kind, status, since)
select prop.id, u.external_id, u.floor, u.kind::client_track, 'active'::unit_status, u.since
from prop, (values
  ('House 12', 'Ground', 'residential', '2022'),
  ('House 24', 'Ground', 'residential', '2023'),
  ('House 33', 'Ground', 'residential', '2024'),
  ('House 48', 'Ground', 'residential', '2024'),
  ('House 60', 'Ground', 'residential', '2025')
) as u(external_id, floor, kind, since)
on conflict (property_id, external_id) do nothing;

-- Bayshore Heights — mixed-use
with prop as (select id from properties where slug = 'bayshore-heights')
insert into units (property_id, external_id, floor, kind, status, since)
select prop.id, u.external_id, u.floor, u.kind::client_track, 'active'::unit_status, u.since
from prop, (values
  ('Apt 2901', '29', 'residential', '2024'),
  ('Apt 2406', '24', 'residential', '2023'),
  ('Apt 1808', '18', 'residential', '2024'),
  ('Apt 1102', '11', 'residential', '2025'),
  ('Suite 03', 'Ground', 'commercial', '2023'),
  ('Suite 07', 'Ground', 'commercial', '2024')
) as u(external_id, floor, kind, since)
on conflict (property_id, external_id) do nothing;

-- Marina Pointe Club — country-club condos with restaurant/spa retail
with prop as (select id from properties where slug = 'marina-pointe-club')
insert into units (property_id, external_id, floor, kind, status, since)
select prop.id, u.external_id, u.floor, u.kind::client_track, 'active'::unit_status, u.since
from prop, (values
  ('Apt 1502', '15', 'residential', '2023'),
  ('Apt 1208', '12', 'residential', '2024'),
  ('Apt 0904', '9',  'residential', '2024'),
  ('Apt 0506', '5',  'residential', '2025'),
  ('Restaurant','Ground','commercial','2023'),
  ('Spa Suite','Ground','commercial','2024')
) as u(external_id, floor, kind, since)
on conflict (property_id, external_id) do nothing;

-- Royal Palm Quarter — boutique residential
with prop as (select id from properties where slug = 'royal-palm-quarter')
insert into units (property_id, external_id, floor, kind, status, since)
select prop.id, u.external_id, u.floor, u.kind::client_track, 'active'::unit_status, u.since
from prop, (values
  ('Apt 401', '4', 'residential', '2023'),
  ('Apt 402', '4', 'residential', '2024'),
  ('Apt 301', '3', 'residential', '2024'),
  ('Apt 302', '3', 'residential', '2025'),
  ('Apt 201', '2', 'residential', '2024')
) as u(external_id, floor, kind, since)
on conflict (property_id, external_id) do nothing;

-- Sunset Harbor Club — waterfront condos + marina retail
with prop as (select id from properties where slug = 'sunset-harbor-club')
insert into units (property_id, external_id, floor, kind, status, since)
select prop.id, u.external_id, u.floor, u.kind::client_track, 'active'::unit_status, u.since
from prop, (values
  ('Apt 1602', '16', 'residential', '2023'),
  ('Apt 1108', '11', 'residential', '2024'),
  ('Apt 0805', '8',  'residential', '2024'),
  ('Apt 0403', '4',  'residential', '2025'),
  ('Marina Office', 'Ground', 'commercial', '2023'),
  ('Cafe Local',    'Ground', 'commercial', '2024')
) as u(external_id, floor, kind, since)
on conflict (property_id, external_id) do nothing;

-- Cypress Grove Commercial Plaza — pure commercial / office park
with prop as (select id from properties where slug = 'cypress-grove-plaza')
insert into units (property_id, external_id, floor, kind, status, since)
select prop.id, u.external_id, u.floor, u.kind::client_track, 'active'::unit_status, u.since
from prop, (values
  ('Suite 100', 'Ground', 'commercial', '2022'),
  ('Suite 110', 'Ground', 'commercial', '2023'),
  ('Suite 200', '2',      'commercial', '2024'),
  ('Suite 210', '2',      'commercial', '2024'),
  ('Suite 300', '3',      'commercial', '2025'),
  ('Suite 310', '3',      'commercial', '2025')
) as u(external_id, floor, kind, since)
on conflict (property_id, external_id) do nothing;

-- ─── Sync unit_count on each placeholder property ───────────────────────────

update properties p
   set unit_count = sub.cnt
  from (
    select property_id, count(*)::int as cnt
      from units
     group by property_id
  ) sub
 where p.id = sub.property_id
   and p.slug in (
     'club-riviera-miami', 'coastal-palms-residences', 'solana-estates',
     'bayshore-heights', 'marina-pointe-club', 'royal-palm-quarter',
     'sunset-harbor-club', 'cypress-grove-plaza'
   );
