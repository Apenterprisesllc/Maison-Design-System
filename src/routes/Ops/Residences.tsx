import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import { Icon, useLucide } from '../../components';
import { useOps } from './context';
import {
  OpsButton,
  OpsCard,
  OpsEyebrow,
  OpsHairline,
  OpsIcon,
  OpsPill,
} from './OpsPrimitives';

const td: CSSProperties = {
  padding: '13px 14px',
  fontSize: 13,
  color: '#1A1A1A',
  verticalAlign: 'middle',
};

export function Residences() {
  useLucide();
  const { units, bookings, search, setSearch, openUnit, openPalette } = useOps();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return units;
    return units.filter((u) =>
      [u.id, u.floor, u.resident, u.residentFull].join(' ').toLowerCase().includes(q),
    );
  }, [units, search]);

  function lastVisit(unitId: string): string | undefined {
    return bookings.find((b) => b.unit === unitId)?.date;
  }

  return (
    <div style={{ padding: 'clamp(20px, 4vw, 32px) clamp(20px, 4vw, 32px) 56px', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <OpsEyebrow>The Arden · {units.length} Units Total</OpsEyebrow>
          <h1
            style={{
              fontFamily: 'Fraunces, serif',
              fontWeight: 300,
              fontSize: 36,
              letterSpacing: '-0.02em',
              margin: '6px 0 0',
              color: '#1A1A1A',
            }}
          >
            Residences
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <OpsButton variant="ghost" icon="search" onClick={openPalette}>
            Quick Find
          </OpsButton>
          <OpsButton variant="ghost" icon="filter">
            Filters
          </OpsButton>
        </div>
      </div>
      <OpsHairline width={48} margin="20px 0 24px" />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--color-taupe)',
          borderRadius: 4,
          marginBottom: 16,
          maxWidth: 480,
        }}
      >
        <Icon name="search" size={14} color="var(--color-mist)" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by unit, floor, or resident name…"
          style={{
            flex: 1,
            border: 0,
            outline: 'none',
            background: 'transparent',
            fontFamily: 'Inter, sans-serif',
            fontSize: 13,
            color: 'var(--color-charcoal)',
          }}
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            aria-label="Clear"
            style={{
              background: 'transparent',
              border: 0,
              cursor: 'pointer',
              color: 'var(--color-mist)',
              padding: 2,
              display: 'flex',
            }}
          >
            <Icon name="x" size={12} />
          </button>
        )}
      </div>

      <OpsCard padding={0} style={{ overflow: 'hidden' }}>
        <div className="table-scroll">
          <table
            style={{
              width: '100%',
              minWidth: 760,
              borderCollapse: 'collapse',
              fontFamily: 'Inter, sans-serif',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <thead>
              <tr
                style={{
                  background: 'var(--color-cream-deep)',
                  borderBottom: '1px solid var(--color-taupe)',
                }}
              >
                {['Unit', 'Floor', 'Resident', 'Status', 'Visits', 'Last Visit', 'Member Since', ''].map(
                  (h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: 'left',
                        padding: '10px 14px',
                        fontSize: 10,
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        color: '#4A4A4A',
                        fontWeight: 500,
                      }}
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <tr
                  key={u.id}
                  onClick={() => openUnit(u.id)}
                  style={{
                    cursor: 'pointer',
                    borderBottom:
                      i < filtered.length - 1 ? '1px solid var(--color-taupe-soft)' : undefined,
                    background: i % 2 === 1 ? 'rgba(241,236,224,0.35)' : 'transparent',
                    transition: 'background-color var(--dur-state) var(--ease-out)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(201,169,97,0.06)')}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      i % 2 === 1 ? 'rgba(241,236,224,0.35)' : 'transparent';
                  }}
                >
                  <td style={{ ...td, fontFamily: 'Fraunces, serif', fontSize: 15 }}>{u.id}</td>
                  <td style={td}>{u.floor}</td>
                  <td style={td}>{u.resident}</td>
                  <td style={td}>
                    <OpsPill tone={u.status === 'active' ? 'success' : 'neutral'}>
                      {u.status === 'active' ? 'Active' : 'Paused'}
                    </OpsPill>
                  </td>
                  <td style={td}>{u.visits}</td>
                  <td style={{ ...td, color: '#4A4A4A' }}>{lastVisit(u.id) ?? '—'}</td>
                  <td style={{ ...td, color: '#4A4A4A' }}>{u.since}</td>
                  <td style={{ ...td, color: '#8A8378' }}>
                    <OpsIcon name="chevron-right" size={14} />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    style={{
                      ...td,
                      textAlign: 'center',
                      padding: '48px 14px',
                      color: 'var(--color-mist)',
                    }}
                  >
                    No residences match the search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </OpsCard>
    </div>
  );
}
