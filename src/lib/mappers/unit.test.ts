import { describe, expect, it } from 'vitest';
import { residentFullForUnit, residentSurnameForUnit, toOpsUnit } from './unit';
import type { UnitWithMembers } from './unit';
import { TEST_RESIDENT, TEST_RESIDENT_MEMBERSHIP, TEST_UNIT_1402, TEST_UNIT_C02 } from '../../test/fixtures';

function unitWith(members: UnitWithMembers['members'] = []): UnitWithMembers {
  return { row: TEST_UNIT_1402, members };
}

const withPrimaryResident: UnitWithMembers = {
  row: TEST_UNIT_1402,
  members: [
    {
      profile: TEST_RESIDENT,
      role: TEST_RESIDENT_MEMBERSHIP.role,
      is_primary: TEST_RESIDENT_MEMBERSHIP.is_primary,
    },
  ],
};

describe('residentSurnameForUnit', () => {
  it('formats the primary member as "Lastname, F."', () => {
    expect(residentSurnameForUnit(withPrimaryResident)).toBe('Ashcombe, E.');
  });

  it('falls back to "Resident" / "Commercial" when no members are attached', () => {
    expect(residentSurnameForUnit(unitWith())).toBe('Resident');
    expect(residentSurnameForUnit({ row: TEST_UNIT_C02, members: [] })).toBe('Commercial');
  });

  it('uses display_name when set instead of regenerating the surname', () => {
    const surname = residentSurnameForUnit({
      row: TEST_UNIT_1402,
      members: [
        {
          profile: { ...TEST_RESIDENT, display_name: 'Custom, X.' },
          role: 'owner',
          is_primary: true,
        },
      ],
    });
    expect(surname).toBe('Custom, X.');
  });
});

describe('residentFullForUnit', () => {
  it('returns the primary member full_name', () => {
    expect(residentFullForUnit(withPrimaryResident)).toBe('Eleanor Ashcombe');
  });

  it('returns a placeholder when there is no primary member', () => {
    expect(residentFullForUnit(unitWith())).toBe('Pending resident');
    expect(residentFullForUnit({ row: TEST_UNIT_C02, members: [] })).toBe('Commercial contact');
  });
});

describe('toOpsUnit', () => {
  it('uses external_id as id and projects member fields', () => {
    const opsUnit = toOpsUnit(withPrimaryResident);
    expect(opsUnit).toMatchObject({
      id: '1402',
      floor: '14',
      resident: 'Ashcombe, E.',
      residentFull: 'Eleanor Ashcombe',
      kind: 'residential',
      status: 'active',
      role: 'owner',
    });
  });

  it('falls back to defaults when no member is attached', () => {
    const opsUnit = toOpsUnit(unitWith());
    expect(opsUnit.resident).toBe('Resident');
    expect(opsUnit.role).toBe('owner');
    expect(opsUnit.email).toBeUndefined();
    expect(opsUnit.phone).toBeUndefined();
  });
});
