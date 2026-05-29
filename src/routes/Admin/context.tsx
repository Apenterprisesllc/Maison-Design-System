import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import {
  listPropertiesWithStats,
  type PropertyStats,
} from '../../lib/api/properties';
import { listAllReferrals } from '../../lib/api/referrals';

export interface AdminContextValue {
  loading: boolean;
  properties: PropertyStats[];
  /** Pending referrals awaiting AP follow-up — drives the nav badge. */
  pendingReferrals: number;
  /** Aggregate KPIs across all properties. */
  totals: {
    properties: number;
    units: number;
    activeBookings: number;
    residents: number;
    managers: number;
  };
  refresh: () => Promise<void>;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [properties, setProperties] = useState<PropertyStats[]>([]);
  const [pendingReferrals, setPendingReferrals] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const [data, referrals] = await Promise.all([
        listPropertiesWithStats(),
        listAllReferrals(),
      ]);
      setProperties(data);
      setPendingReferrals(referrals.filter((r) => r.status === 'pending').length);
    } catch (err) {
      console.error('[admin] load failed', err);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Realtime: subscribe to changes on any table that feeds Overview stats.
  // Debounce refresh so a burst of changes doesn't fire a query storm.
  const debounceRef = useRef<number | null>(null);
  useEffect(() => {
    if (!profile) return;
    const tables = ['properties', 'units', 'bookings', 'unit_members', 'profiles', 'referrals'];
    const channels = tables.map((table) =>
      supabase
        .channel(`admin:${table}`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
          if (debounceRef.current !== null) window.clearTimeout(debounceRef.current);
          debounceRef.current = window.setTimeout(() => {
            refresh();
          }, 500);
        })
        .subscribe(),
    );
    return () => {
      if (debounceRef.current !== null) window.clearTimeout(debounceRef.current);
      channels.forEach((c) => supabase.removeChannel(c));
    };
  }, [profile, refresh]);

  const totals = useMemo(() => {
    return properties.reduce(
      (acc, p) => ({
        properties: acc.properties + 1,
        units: acc.units + p.units_total,
        activeBookings: acc.activeBookings + p.bookings_active,
        residents: acc.residents + p.residents_total,
        managers: acc.managers + (p.manager_email ? 1 : 0),
      }),
      { properties: 0, units: 0, activeBookings: 0, residents: 0, managers: 0 },
    );
  }, [properties]);

  const value = useMemo<AdminContextValue>(
    () => ({ loading, properties, pendingReferrals, totals, refresh }),
    [loading, properties, pendingReferrals, totals, refresh],
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin(): AdminContextValue {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used inside <AdminProvider>');
  return ctx;
}
