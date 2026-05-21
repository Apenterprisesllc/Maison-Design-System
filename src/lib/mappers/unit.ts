import type { ProfileRow, UnitMemberRole, UnitRow } from '../types/db';
import type { OpsUnit, UnitRole } from '../../routes/Ops/data';

export interface UnitWithMembers {
  row: UnitRow;
  members: Array<{ profile: ProfileRow; role: UnitMemberRole; is_primary: boolean }>;
}

function makeSurname(full: string): string {
  const trimmed = full.trim();
  if (!trimmed) return '';
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0]!;
  const last = parts[parts.length - 1]!;
  const initial = parts[0]!.charAt(0).toUpperCase();
  return `${last}, ${initial}.`;
}

export function residentSurnameForUnit(unit: UnitWithMembers): string {
  const primary = unit.members.find((m) => m.is_primary) ?? unit.members[0];
  if (primary) return primary.profile.display_name ?? makeSurname(primary.profile.full_name);
  return unit.row.kind === 'commercial' ? 'Commercial' : 'Resident';
}

export function residentFullForUnit(unit: UnitWithMembers): string {
  const primary = unit.members.find((m) => m.is_primary) ?? unit.members[0];
  if (primary) return primary.profile.full_name;
  return unit.row.kind === 'commercial' ? 'Commercial contact' : 'Pending resident';
}

export function toOpsUnit(unit: UnitWithMembers): OpsUnit {
  const primary = unit.members.find((m) => m.is_primary) ?? unit.members[0];
  const result: OpsUnit = {
    id: unit.row.external_id,
    floor: unit.row.floor,
    resident: residentSurnameForUnit(unit),
    residentFull: residentFullForUnit(unit),
    status: unit.row.status,
    visits: unit.row.visits,
    since: unit.row.since,
    kind: unit.row.kind,
  };
  if (primary) {
    if (primary.profile.email) result.email = primary.profile.email;
    if (primary.profile.phone) result.phone = primary.profile.phone;
    result.role = primary.role as UnitRole;
  } else {
    result.role = unit.row.kind === 'commercial' ? 'manager' : 'owner';
  }
  if (unit.row.notes) result.notes = unit.row.notes;
  return result;
}
