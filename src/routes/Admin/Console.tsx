import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CountBadge, useLucide, useReveal } from '../../components';
import { useAdmin } from './context';
import { Overview } from './Overview';
import { BuildingsCalendarStrip } from './BuildingsCalendarStrip';
import { NewBookingsFeed } from './NewBookingsFeed';
import { OpsCard, OpsEyebrow, OpsHairline } from '../Ops/OpsPrimitives';
import { getPropertyNewCounts } from '../../lib/api/propertyReviewState';
import { supabase } from '../../lib/supabase';
import type { ProfileRow } from '../../lib/types/db';

/**
 * Admin Console — the consolidated command center.
 *   - Top: weekly calendar of bookings by building.
 *   - Middle left: managers list with notification badges.
 *   - Middle right: latest scheduled bookings feed.
 *   - Bottom: Properties + KPIs (the legacy Overview content).
 */
export function Console() {
  const ref = useReveal<HTMLDivElement>({ y: 16, stagger: 0.06, rootMargin: '0px 0px -2% 0px' });
  useLucide();

  return (
    <div
      ref={ref}
      style={{ padding: 'clamp(24px, 4vw, 40px) clamp(20px, 4vw, 40px) 80px', maxWidth: 1440, margin: '0 auto' }}
    >
      <div>
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
          Console
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
          The week at a glance: every building's schedule, your managers,
          the latest bookings to confirm. Drill into any cell to deep-dive.
        </p>
      </div>
      <OpsHairline width={64} margin="24px 0 28px" />

      {/* Top: Calendar */}
      <div data-reveal style={{ marginBottom: 24 }}>
        <BuildingsCalendarStrip />
      </div>

      {/* Middle: Managers left, Bookings feed right */}
      <div
        className="console-mid"
        data-reveal
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.2fr)',
          gap: 20,
          marginBottom: 32,
          alignItems: 'stretch',
        }}
      >
        <ManagersCompactList />
        <NewBookingsFeed />
      </div>

      {/* Bottom: Properties + KPIs (Overview content) */}
      <div data-reveal>
        <Overview />
      </div>

      <style>{`
        @media (max-width: 1023px) {
          .console-mid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

// ─── Managers compact list ─────────────────────────────────────────────────

interface ManagerRow {
  profile: ProfileRow;
  propertyName: string | null;
  count: number;
}

function ManagersCompactList() {
  const navigate = useNavigate();
  const { properties } = useAdmin();
  const [managers, setManagers] = useState<ProfileRow[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'property_manager')
        .order('full_name');
      if (cancelled) return;
      if (error) {
        console.error('[console/managers] load failed', error);
        setManagers([]);
      } else {
        setManagers(data ?? []);
      }
      try {
        const rows = await getPropertyNewCounts();
        const map: Record<string, number> = {};
        for (const r of rows) map[r.property_id] = r.new_count;
        if (!cancelled) setCounts(map);
      } catch (err) {
        console.error('[console/managers] counts failed', err);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const rows: ManagerRow[] = managers.map((m) => {
    const property = properties.find((p) => p.property.id === m.primary_property_id);
    const count = m.primary_property_id ? counts[m.primary_property_id] ?? 0 : 0;
    return {
      profile: m,
      propertyName: property?.property.name ?? null,
      count,
    };
  });

  return (
    <OpsCard padding={0} style={{ overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
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
          <OpsEyebrow>Stewardship</OpsEyebrow>
          <h2
            style={{
              fontFamily: 'Fraunces, serif',
              fontWeight: 400,
              fontSize: 22,
              margin: '4px 0 0',
              color: '#1A1A1A',
            }}
          >
            Property managers
          </h2>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/managers')}
          style={{
            background: 'transparent',
            border: 0,
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
            fontSize: 11,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--color-champagne-deep)',
          }}
        >
          Manage →
        </button>
      </div>

      <OpsHairline color="transparent" width="100%" margin="0" />

      {loading ? (
        <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--color-mist)', fontSize: 12 }}>
          Loading…
        </div>
      ) : rows.length === 0 ? (
        <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--color-mist)', fontSize: 13 }}>
          No managers assigned yet.
        </div>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, flex: 1, overflowY: 'auto' }}>
          {rows.map((r) => (
            <li
              key={r.profile.id}
              onClick={() => navigate('/admin/managers')}
              style={{
                padding: '14px 20px',
                borderTop: '1px solid var(--color-taupe-soft)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                transition: 'background-color var(--dur-state) var(--ease-out)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(196,151,62,0.06)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: r.count > 0 ? 'var(--color-champagne)' : 'var(--color-taupe)',
                  color: r.count > 0 ? '#1A1A1A' : '#4A4A4A',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'Fraunces, serif',
                  fontSize: 13,
                  flexShrink: 0,
                }}
              >
                {initials(r.profile.full_name)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                  <span
                    style={{
                      fontFamily: 'Fraunces, serif',
                      fontSize: 15,
                      color: '#1A1A1A',
                      fontWeight: r.count > 0 ? 500 : 400,
                    }}
                  >
                    {r.profile.full_name}
                  </span>
                  <CountBadge count={r.count} />
                </div>
                <div
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: 11,
                    color: '#8A8378',
                    marginTop: 2,
                  }}
                >
                  {r.propertyName ?? 'No property assigned'}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </OpsCard>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
}
