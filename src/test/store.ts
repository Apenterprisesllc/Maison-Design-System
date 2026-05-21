/**
 * In-memory Supabase fake used by the MSW handlers. Reset between every
 * test via afterEach() in src/test/setup.ts.
 */
import type {
  AttendantMessageRow,
  AttendantRow,
  BookingRow,
  NotificationRow,
  ProfileRow,
  PropertyRow,
  ServiceRow,
  UnitMemberRow,
  UnitRow,
} from '../lib/types/db';
import {
  TEST_ADMIN,
  TEST_ATTENDANT,
  TEST_BOOKING,
  TEST_COMMERCIAL_CLIENT,
  TEST_COMMERCIAL_MEMBERSHIP,
  TEST_FIRST_LOGIN_RESIDENT,
  TEST_MANAGER,
  TEST_PROPERTY,
  TEST_RESIDENT,
  TEST_RESIDENT_MEMBERSHIP,
  TEST_SERVICE_DEEP,
  TEST_SERVICE_OFFICE_NIGHT,
  TEST_UNIT_1402,
  TEST_UNIT_C02,
} from './fixtures';

export interface FakeUser {
  id: string;
  email: string;
  password: string;
  metadata: Record<string, unknown>;
}

export interface FakeSession {
  access_token: string;
  refresh_token: string;
  user_id: string;
  expires_at: number;
}

interface Store {
  users: FakeUser[];
  sessions: Record<string, FakeSession>;
  profiles: ProfileRow[];
  properties: PropertyRow[];
  units: UnitRow[];
  unitMembers: UnitMemberRow[];
  services: ServiceRow[];
  attendants: AttendantRow[];
  bookings: BookingRow[];
  messages: AttendantMessageRow[];
  notifications: NotificationRow[];
}

let store: Store = freshStore();

function freshStore(): Store {
  return {
    users: [
      { id: TEST_ADMIN.id, email: TEST_ADMIN.email, password: 'AdminPass2026!', metadata: {} },
      { id: TEST_MANAGER.id, email: TEST_MANAGER.email, password: 'ArdenManager2026!', metadata: {} },
      { id: TEST_RESIDENT.id, email: TEST_RESIDENT.email, password: 'ResidentPass2026!', metadata: {} },
      {
        id: TEST_COMMERCIAL_CLIENT.id,
        email: TEST_COMMERCIAL_CLIENT.email,
        password: 'CommercialPass2026!',
        metadata: {},
      },
      {
        id: TEST_FIRST_LOGIN_RESIDENT.id,
        email: TEST_FIRST_LOGIN_RESIDENT.email,
        password: 'TempPass2026!',
        metadata: {},
      },
    ],
    sessions: {},
    profiles: [
      TEST_ADMIN,
      TEST_MANAGER,
      TEST_RESIDENT,
      TEST_COMMERCIAL_CLIENT,
      TEST_FIRST_LOGIN_RESIDENT,
    ].map((p) => ({ ...p })),
    properties: [{ ...TEST_PROPERTY }],
    units: [{ ...TEST_UNIT_1402 }, { ...TEST_UNIT_C02 }],
    unitMembers: [{ ...TEST_RESIDENT_MEMBERSHIP }, { ...TEST_COMMERCIAL_MEMBERSHIP }],
    services: [{ ...TEST_SERVICE_DEEP }, { ...TEST_SERVICE_OFFICE_NIGHT }],
    attendants: [{ ...TEST_ATTENDANT }],
    bookings: [{ ...TEST_BOOKING }],
    messages: [],
    notifications: [],
  };
}

export function getStore(): Store {
  return store;
}

export function resetStore(): void {
  store = freshStore();
}

let tokenCounter = 0;
export function mintSession(userId: string): FakeSession {
  tokenCounter += 1;
  const session: FakeSession = {
    access_token: `access-${tokenCounter}-${userId}`,
    refresh_token: `refresh-${tokenCounter}-${userId}`,
    user_id: userId,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
  };
  store.sessions[session.access_token] = session;
  return session;
}

export function findUserByEmail(email: string): FakeUser | undefined {
  return store.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function findUserBySession(accessToken: string | null | undefined): FakeUser | undefined {
  if (!accessToken) return undefined;
  const session = store.sessions[accessToken];
  if (!session) return undefined;
  return store.users.find((u) => u.id === session.user_id);
}
