import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLucide, useToast } from '../../components';
import { useAdmin } from './context';
import { OpsButton, OpsCard, OpsEyebrow, OpsHairline, OpsPill } from '../Ops/OpsPrimitives';
import type { OpsPillTone } from '../Ops/OpsPrimitives';
import {
  listAllReferrals,
  setCommissionStatus as apiSetCommission,
  updateReferralStatus as apiUpdateStatus,
} from '../../lib/api/referrals';
import { supabase } from '../../lib/supabase';
import { subscribeToReferrals } from '../../lib/realtime/bookings';
import type {
  CommissionStatus,
  ProfileRow,
  ReferralRow,
  ReferralStatus,
  ServiceRow,
} from '../../lib/types/db';

const STATUS_LABEL: Record<ReferralStatus, string> = {
  pending: 'Pending',
  contacted: 'Contacted',
  booked: 'Booked',
  completed: 'Completed',
  declined: 'Declined',
};

const STATUS_TONE: Record<ReferralStatus, OpsPillTone> = {
  pending: 'info',
  contacted: 'warning',
  booked: 'success',
  completed: 'success',
  declined: 'danger',
};

const COMMISSION_LABEL: Record<CommissionStatus, string> = {
  pending: 'Pending payment',
  paid: 'Paid',
};

const COMMISSION_TONE: Record<CommissionStatus, OpsPillTone> = {
  pending: 'warning',
  paid: 'success',
};

const STATUS_ORDER: ReferralStatus[] = ['pending', 'contacted', 'booked', 'completed', 'declined'];

export function AdminReferrals() {
  useLucide();
  const toast = useToast();
  const { properties } = useAdmin();
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [managers, setManagers] = useState<Record<string, ProfileRow>>({});
  const [services, setServices] = useState<Record<string, ServiceRow>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | ReferralStatus>('all');

  const load = useCallback(async () => {
    try {
      const rows = await listAllReferrals();
      setReferrals(rows);
      // Fetch the manager profiles and services in parallel — small fan-out
      // since the queue is rarely huge.
      const managerIds = Array.from(new Set(rows.map((r) => r.referrer_id)));
      const serviceIds = Array.from(
        new Set(rows.map((r) => r.suggested_service_id).filter(Boolean) as string[]),
      );
      const [{ data: mgrData }, { data: svcData }] = await Promise.all([
        managerIds.length
          ? supabase.from('profiles').select('*').in('id', managerIds)
          : Promise.resolve({ data: [] as ProfileRow[] }),
        serviceIds.length
          ? supabase.from('services').select('*').in('id', serviceIds)
          : Promise.resolve({ data: [] as ServiceRow[] }),
      ]);
      const mgrMap: Record<string, ProfileRow> = {};
      for (const m of mgrData ?? []) mgrMap[m.id] = m;
      setManagers(mgrMap);
      const svcMap: Record<string, ServiceRow> = {};
      for (const s of svcData ?? []) svcMap[s.id] = s;
      setServices(svcMap);
    } catch (err) {
      console.error('[admin/referrals] load failed', err);
      toast.error('Could not load referrals.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  // Live update: new referrals and status changes land without a manual reload.
  useEffect(() => {
    const unsub = subscribeToReferrals(() => {
      load();
    });
    return unsub;
  }, [load]);

  const propertyNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of properties) map.set(p.property.id, p.property.name);
    return map;
  }, [properties]);

  const filtered = useMemo(() => {
    if (filter === 'all') return referrals;
    return referrals.filter((r) => r.status === filter);
  }, [referrals, filter]);

  async function setStatus(id: string, status: ReferralStatus) {
    const prev = referrals.find((r) => r.id === id);
    if (!prev) return;
    setReferrals((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
    try {
      await apiUpdateStatus(id, status);
      toast.success(`Marked as ${STATUS_LABEL[status]}.`);
    } catch (err) {
      setReferrals((rs) => rs.map((r) => (r.id === id ? prev : r)));
      toast.error(err instanceof Error ? err.message : 'Could not update.');
    }
  }

  async function toggleCommission(id: string) {
    const prev = referrals.find((r) => r.id === id);
    if (!prev) return;
    const next: CommissionStatus = prev.commission_status === 'paid' ? 'pending' : 'paid';
    setReferrals((rs) => rs.map((r) => (r.id === id ? { ...r, commission_status: next } : r)));
    try {
      await apiSetCommission(id, next);
      toast.success(next === 'paid' ? 'Commission marked paid.' : 'Commission marked pending.');
    } catch (err) {
      setReferrals((rs) => rs.map((r) => (r.id === id ? prev : r)));
      toast.error(err instanceof Error ? err.message : 'Could not update.');
    }
  }

  return (
    <div style={{ padding: 'clamp(24px, 4vw, 40px) clamp(20px, 4vw, 40px) 80px', maxWidth: 1440, margin: '0 auto' }}>
      <OpsEyebrow>AP Enterprises · Platform</OpsEyebrow>
      <h1
        style={{
          fontFamily: 'Fraunces, serif',
          fontWeight: 300,
          fontSize: 'clamp(32px, 4vw, 42px)',
          letterSpacing: '-0.02em',
          margin: '6px 0 0',
          color: '#1A1A1A',
        }}
      >
        Referrals
      </h1>
      <p
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 14,
          color: '#4A4A4A',
          margin: '10px 0 0',
          maxWidth: 640,
          lineHeight: 1.6,
        }}
      >
        Leads handed off by property managers. Contact the prospect, book the
        service in the Pipeline, and toggle the commission flag once paid.
      </p>
      <OpsHairline width={64} margin="24px 0 28px" />

      {/* Filters */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        <FilterChip label="All" active={filter === 'all'} onClick={() => setFilter('all')} />
        {STATUS_ORDER.map((s) => (
          <FilterChip
            key={s}
            label={STATUS_LABEL[s]}
            active={filter === s}
            onClick={() => setFilter(s)}
          />
        ))}
      </div>

      <OpsCard padding={0} style={{ overflow: 'hidden' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontFamily: 'Inter, sans-serif',
            fontVariantNumeric: 'tabular-nums',
            minWidth: 980,
          }}
        >
          <thead>
            <tr style={{ background: 'var(--color-cream-deep)' }}>
              {['Ref', 'Date', 'Manager', 'Property', 'Client', 'Phone', 'Service', 'Status', 'Commission', 'Actions'].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: 'left',
                    padding: '12px 14px',
                    fontSize: 10,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: '#4A4A4A',
                    fontWeight: 500,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={10} style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--color-mist)', fontSize: 12 }}>
                  Loading…
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={10} style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--color-mist)', fontSize: 13 }}>
                  No referrals match this filter.
                </td>
              </tr>
            )}
            {filtered.map((r, i) => {
              const manager = managers[r.referrer_id];
              const service = r.suggested_service_id ? services[r.suggested_service_id] : null;
              const created = new Date(r.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: '2-digit',
                year: 'numeric',
              });
              return (
                <tr
                  key={r.id}
                  style={{
                    borderTop: '1px solid var(--color-taupe-soft)',
                    background: i % 2 === 1 ? 'rgba(241,236,224,0.35)' : 'transparent',
                  }}
                >
                  <td style={{ ...td, fontFamily: 'Fraunces, serif', fontSize: 14 }}>{r.reference}</td>
                  <td style={td}>{created}</td>
                  <td style={td}>{manager?.full_name ?? '—'}</td>
                  <td style={td}>{propertyNameById.get(r.property_id) ?? '—'}</td>
                  <td style={{ ...td, fontFamily: 'Fraunces, serif', fontSize: 14 }}>{r.referred_name}</td>
                  <td style={td}>{r.referred_phone}</td>
                  <td style={td}>{service?.name ?? '—'}</td>
                  <td style={td}>
                    <OpsPill tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</OpsPill>
                  </td>
                  <td style={td}>
                    <button
                      type="button"
                      onClick={() => toggleCommission(r.id)}
                      title="Toggle commission status"
                      style={{ background: 'transparent', border: 0, padding: 0, cursor: 'pointer' }}
                    >
                      <OpsPill tone={COMMISSION_TONE[r.commission_status]}>
                        {COMMISSION_LABEL[r.commission_status]}
                      </OpsPill>
                    </button>
                  </td>
                  <td style={{ ...td, whiteSpace: 'nowrap' }}>
                    {r.status === 'pending' && (
                      <>
                        <OpsButton
                          variant="ghost"
                          icon="phone"
                          onClick={() => setStatus(r.id, 'contacted')}
                        >
                          Contacted
                        </OpsButton>
                        <span style={{ display: 'inline-block', width: 6 }} />
                      </>
                    )}
                    {(r.status === 'pending' || r.status === 'contacted') && (
                      <>
                        <OpsButton
                          variant="ghost"
                          icon="calendar-check"
                          onClick={() => setStatus(r.id, 'booked')}
                        >
                          Booked
                        </OpsButton>
                        <span style={{ display: 'inline-block', width: 6 }} />
                      </>
                    )}
                    {r.status === 'booked' && (
                      <>
                        <OpsButton
                          variant="ghost"
                          icon="check"
                          onClick={() => setStatus(r.id, 'completed')}
                        >
                          Completed
                        </OpsButton>
                        <span style={{ display: 'inline-block', width: 6 }} />
                      </>
                    )}
                    {(r.status === 'pending' || r.status === 'contacted' || r.status === 'booked') && (
                      <OpsButton
                        variant="ghost"
                        icon="x"
                        onClick={() => setStatus(r.id, 'declined')}
                      >
                        Declined
                      </OpsButton>
                    )}
                    {r.note && <span title={r.note} style={{ marginLeft: 6, color: '#8A8378', fontSize: 11, cursor: 'help' }}>note</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </OpsCard>
    </div>
  );
}

const td = {
  padding: '13px 14px',
  fontSize: 13,
  color: '#1A1A1A',
  verticalAlign: 'middle' as const,
};

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: 12,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        padding: '6px 12px',
        border: '1px solid ' + (active ? '#1A1A1A' : 'var(--color-taupe)'),
        borderRadius: 4,
        background: active ? '#1A1A1A' : 'transparent',
        color: active ? '#F4F7FA' : '#4A4A4A',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}
