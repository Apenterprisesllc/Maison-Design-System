import type {
  AttendantRow,
  BookingRow,
  ProfileRow,
  PropertyRow,
  ServiceRow,
  UnitMemberRow,
  UnitRow,
} from '../lib/types/db';

export const TEST_PROPERTY: PropertyRow = {
  id: 'prop-arden-uuid',
  slug: 'the-arden',
  name: 'The Arden',
  city: 'Miami',
  address: '1200 Brickell Bay Dr',
  unit_count: 240,
  cover_image: null,
  active: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

export const TEST_ADMIN: ProfileRow = {
  id: 'admin-uuid',
  role: 'super_admin',
  full_name: 'AP Enterprises Admin',
  display_name: null,
  email: 'admin@apenterprises.test',
  phone: null,
  avatar_path: null,
  primary_track: null,
  primary_property_id: null,
  must_change_password: false,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

export const TEST_MANAGER: ProfileRow = {
  id: 'manager-uuid',
  role: 'property_manager',
  full_name: 'Arden Property Manager',
  display_name: null,
  email: 'manager@thearden.test',
  phone: null,
  avatar_path: null,
  primary_track: null,
  primary_property_id: TEST_PROPERTY.id,
  must_change_password: false,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

export const TEST_RESIDENT: ProfileRow = {
  id: 'resident-uuid',
  role: 'resident',
  full_name: 'Eleanor Ashcombe',
  display_name: null,
  email: 'resident@thearden.test',
  phone: null,
  avatar_path: null,
  primary_track: 'residential',
  primary_property_id: TEST_PROPERTY.id,
  must_change_password: false,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

export const TEST_COMMERCIAL_CLIENT: ProfileRow = {
  id: 'cafe-uuid',
  role: 'resident',
  full_name: 'Arden Café & Bar',
  display_name: null,
  email: 'cafe@thearden.test',
  phone: null,
  avatar_path: null,
  primary_track: 'commercial',
  primary_property_id: TEST_PROPERTY.id,
  must_change_password: false,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

export const TEST_FIRST_LOGIN_RESIDENT: ProfileRow = {
  ...TEST_RESIDENT,
  id: 'first-login-uuid',
  email: 'firstlogin@thearden.test',
  full_name: 'First Login User',
  must_change_password: true,
};

export const TEST_UNIT_1402: UnitRow = {
  id: 'unit-1402-uuid',
  property_id: TEST_PROPERTY.id,
  external_id: '1402',
  floor: '14',
  kind: 'residential',
  status: 'active',
  notes: null,
  visits: 11,
  since: '2025',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

export const TEST_UNIT_C02: UnitRow = {
  id: 'unit-c02-uuid',
  property_id: TEST_PROPERTY.id,
  external_id: 'C-02',
  floor: 'Ground',
  kind: 'commercial',
  status: 'active',
  notes: null,
  visits: 6,
  since: '2024',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

export const TEST_RESIDENT_MEMBERSHIP: UnitMemberRow = {
  id: 'member-resident-uuid',
  unit_id: TEST_UNIT_1402.id,
  user_id: TEST_RESIDENT.id,
  role: 'owner',
  is_primary: true,
  created_at: '2026-01-01T00:00:00Z',
};

export const TEST_COMMERCIAL_MEMBERSHIP: UnitMemberRow = {
  id: 'member-commercial-uuid',
  unit_id: TEST_UNIT_C02.id,
  user_id: TEST_COMMERCIAL_CLIENT.id,
  role: 'manager',
  is_primary: true,
  created_at: '2026-01-01T00:00:00Z',
};

export const TEST_SERVICE_DEEP: ServiceRow = {
  id: 'svc-deep-uuid',
  slug: 'deep',
  track: 'residential',
  name: 'Deep Cleaning',
  kicker: 'Housekeeping',
  icon: 'sparkles',
  tone: 'stone',
  price_cents: 32000,
  cadence: 'monthly',
  description: 'A full residence clean by a two-person team.',
  photo_path: null,
  property_id: null,
  active: true,
  sort_order: 10,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

export const TEST_SERVICE_OFFICE_NIGHT: ServiceRow = {
  id: 'svc-office-night-uuid',
  slug: 'office-night',
  track: 'commercial',
  name: 'After-Hours Office',
  kicker: 'Nightly',
  icon: 'building-2',
  tone: 'ink',
  price_cents: 29000,
  cadence: 'nightly',
  description: 'Discreet overnight crews.',
  photo_path: null,
  property_id: null,
  active: true,
  sort_order: 20,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

export const TEST_ATTENDANT: AttendantRow = {
  id: 'attendant-hudson-uuid',
  name: 'Hudson & Co.',
  property_id: TEST_PROPERTY.id,
  contact_email: null,
  contact_phone: null,
  active: true,
  created_at: '2026-01-01T00:00:00Z',
};

export const TEST_BOOKING: BookingRow = {
  id: 'booking-uuid',
  reference: 'B-4001',
  property_id: TEST_PROPERTY.id,
  unit_id: TEST_UNIT_1402.id,
  service_id: TEST_SERVICE_DEEP.id,
  attendant_id: TEST_ATTENDANT.id,
  created_by: TEST_RESIDENT.id,
  scheduled_at: '2026-06-15T14:30:00Z',
  duration_min: 90,
  status: 'scheduled',
  price_cents: 32000,
  service_snapshot: { slug: 'deep', name: 'Deep Cleaning', kicker: 'Housekeeping' },
  resident_snapshot: {
    full_name: 'Eleanor Ashcombe',
    display_name: 'Ashcombe, E.',
    unit: { external_id: '1402' },
    attendant: { name: 'Hudson & Co.' },
  },
  note: null,
  cancelled_reason: null,
  cancelled_at: null,
  arrived_at: null,
  assignee_name: null,
  is_guest: false,
  guest_name: null,
  guest_phone: null,
  guest_address: null,
  created_at: '2026-05-01T00:00:00Z',
  updated_at: '2026-05-01T00:00:00Z',
};
