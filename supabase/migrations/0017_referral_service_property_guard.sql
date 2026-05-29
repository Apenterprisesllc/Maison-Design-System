-- ─── Keep a referral's suggested service within its own property ───────────
--
-- referrals.suggested_service_id references services(id) with no guarantee the
-- service belongs to referrals.property_id, so a manager could attach a service
-- from a different building. A CHECK constraint cannot run a subquery, so we
-- validate with a trigger on insert/update. NULL is allowed (no suggestion),
-- and global services (services.property_id IS NULL) are valid for any property.

create or replace function validate_referral_service_property() returns trigger
language plpgsql as $$
declare
  svc_property uuid;
begin
  if new.suggested_service_id is not null then
    select property_id into svc_property
    from services
    where id = new.suggested_service_id;

    if svc_property is not null and svc_property <> new.property_id then
      raise exception
        'suggested_service_id % does not belong to property %',
        new.suggested_service_id, new.property_id
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists referral_service_property_trg on referrals;
create trigger referral_service_property_trg
  before insert or update of suggested_service_id, property_id on referrals
  for each row execute function validate_referral_service_property();
