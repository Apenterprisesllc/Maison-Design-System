-- ─── Aggregate property stats server-side ─────────────────────────────────
--
-- The /admin console previously built its property table by fetching ALL
-- units, ALL bookings, ALL unit_members and ALL manager profiles globally and
-- joining them in JavaScript (O(n²) over every row in the database just to
-- render a handful of property cards). This RPC pushes the aggregation into
-- Postgres so the client fetches one compact row per property.
--
-- Only super admins use the admin console; the function returns no rows for
-- anyone else. It is security-definer (RLS on the base tables is bypassed
-- inside), so the is_super_admin() guard is what enforces access.

create or replace function get_properties_with_stats()
returns table (
  property_id     uuid,
  units_total     int,
  units_active    int,
  bookings_total  int,
  bookings_active int,
  residents_total int,
  manager_email   text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id as property_id,
    coalesce(u.units_total, 0)::int,
    coalesce(u.units_active, 0)::int,
    coalesce(b.bookings_total, 0)::int,
    coalesce(b.bookings_active, 0)::int,
    coalesce(m.residents_total, 0)::int,
    mgr.email
  from properties p
  left join lateral (
    select count(*) as units_total,
           count(*) filter (where status = 'active') as units_active
    from units
    where property_id = p.id
  ) u on true
  left join lateral (
    select count(*) as bookings_total,
           count(*) filter (
             where status in ('scheduled', 'confirmed', 'enroute', 'active')
           ) as bookings_active
    from bookings
    where property_id = p.id
  ) b on true
  left join lateral (
    select count(*) as residents_total
    from unit_members um
    join units un on un.id = um.unit_id
    where un.property_id = p.id
  ) m on true
  left join lateral (
    select email
    from profiles
    where role = 'property_manager'
      and primary_property_id = p.id
    order by email
    limit 1
  ) mgr on true
  where is_super_admin()
  order by p.name;
$$;

notify pgrst, 'reload schema';
