import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLucide } from '../../components';
import { supabase } from '../../lib/supabase';
import type { BookingRow } from '../../lib/types/db';
import { useAdmin } from './context';
import { OpsCard, OpsEyebrow, OpsHairline, OpsPill } from '../Ops/OpsPrimitives';
import type { OpsPillTone } from '../Ops/OpsPrimitives';

const STATUS_LABEL: Record<string, string> = {
  scheduled: 'Scheduled',
  confirmed: 'Confirmed',
  enroute: 'En Route',
  active: 'In Progress',
  closed: 'Closed',
  cancelled: 'Cancelled',
};

const STATUS_TONE: Record<string, OpsPillTone> = {
  scheduled: 'info',
  confirmed: 'success',
  enroute: 'warning',
  active: 'success',
  closed: 'neutral',
  cancelled: 'danger',
};

interface FeedRow {
  id: string;
  reference: string;
  property_id: string;
  client_name: string;
  service_name: string;
  scheduled_at: string;
  status: string;
  created_at: string;
}

function readSnap(value: unknown): { name?: string; full_name?: string } {
  if (!value || typeof value !== 'object') return {};
  return value as { name?: string; full_name?: string };
}

function toFeedRow(b: BookingRow): FeedRow {
  const svc = readSnap(b.service_snapshot);
  const res = readSnap(b.resident_snapshot);
  return {
    id: b.id,
    reference: b.reference,
    property_id: b.property_id,
    client_name: b.guest_name ?? res.full_name ?? 'Resident',
    service_name: svc.name ?? '—',
    scheduled_at: b.scheduled_at,
    status: b.status,
    created_at: b.created_at,
  };
}

/**
 * Latest scheduled / confirmed bookings across every property. Lives on the
 * /admin Console as the right-hand column. Click a row → drill into the
 * bookings table filtered by reference.
 */
export function NewBookingsFeed() {
  const navigate = useNavigate();
  const { properties } = useAdmin();
  const [rows, setRows] = useState<FeedRow[]>([]);
  const [loading, setLoading] = useState(true);
  useLucide();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .in('status', ['scheduled', 'confirmed'])
        .order('created_at', { ascending: false })
        .limit(12);
      if (cancelled) return;
      if (error) {
        console.error('[admin/feed] load failed', error);
        setRows([]);
      } else {
        setRows((data ?? []).map(toFeedRow));
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const propertyNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of properties) map.set(p.property.id, p.property.name);
    return map;
  }, [properties]);

  return (
    <OpsCard padding={0} style={{ overflow: 'hidden', height: '100%' }}>
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--color-taupe)',
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <OpsEyebrow>Latest activity</OpsEyebrow>
          <h2
            style={{
              fontFamily: 'Fraunces, serif',
              fontWeight: 400,
              fontSize: 22,
              margin: '4px 0 0',
              color: '#1A1A1A',
            }}
          >
            New bookings
          </h2>
        </div>
        <span
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 11,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--color-mist)',
          }}
        >
          {rows.length} pending
        </span>
      </div>

      <OpsHairline color="transparent" width="100%" margin="0" />

      {loading ? (
        <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--color-mist)', fontSize: 12 }}>
          Loading…
        </div>
      ) : rows.length === 0 ? (
        <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--color-mist)', fontSize: 13, lineHeight: 1.6 }}>
          No scheduled bookings right now.
        </div>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {rows.map((r) => {
            const scheduled = new Date(r.scheduled_at);
            const label = scheduled.toLocaleString('en-US', {
              month: 'short',
              day: '2-digit',
              hour: 'numeric',
              minute: '2-digit',
            });
            return (
              <li
                key={r.id}
                onClick={() => navigate(`/admin/bookings?property=${r.property_id}&ref=${r.reference}`)}
                style={{
                  padding: '14px 20px',
                  borderTop: '1px solid var(--color-taupe-soft)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  transition: 'background-color var(--dur-state) var(--ease-out)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(196,151,62,0.06)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
                  <span style={{ fontFamily: 'Fraunces, serif', fontSize: 15, color: '#1A1A1A' }}>
                    {r.client_name} — {r.service_name}
                  </span>
                  <OpsPill tone={STATUS_TONE[r.status] ?? 'neutral'}>
                    {STATUS_LABEL[r.status] ?? r.status}
                  </OpsPill>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: 11,
                    color: '#8A8378',
                    letterSpacing: '0.04em',
                  }}
                >
                  <span>{propertyNameById.get(r.property_id) ?? '—'}</span>
                  <span>{label}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </OpsCard>
  );
}
