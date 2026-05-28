import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { useLucide } from '../../components';
import { useOps } from './context';
import { STATUS_LABEL, STATUS_TONE, type BookingStatus, type OpsBooking } from './data';
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

type FilterKey = 'all' | BookingStatus;

const TABS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'enroute', label: 'En Route' },
  { key: 'active', label: 'In Progress' },
  { key: 'closed', label: 'Closed' },
];

/**
 * Manager view: read-only feed of bookings on their building. No status
 * controls, no new-booking action, no export. Click a row opens a read-only
 * detail drawer (BookingDetailDrawer hides actions when role=property_manager).
 */
export function ManagerBookings() {
  useLucide();
  const { bookings, openBooking, propertyName } = useOps();
  const [filter, setFilter] = useState<FilterKey>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bookings.filter((b) => {
      if (filter !== 'all' && b.status !== filter) return false;
      if (!q) return true;
      return [b.reference, b.unit, b.resident, b.service]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [bookings, search, filter]);

  return (
    <div style={{ padding: 'clamp(20px, 4vw, 32px) clamp(20px, 4vw, 32px) 56px' }}>
      <div>
        <OpsEyebrow>{propertyName} · Activity</OpsEyebrow>
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
          Bookings
        </h1>
        <p
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 14,
            color: '#4A4A4A',
            margin: '10px 0 0',
            maxWidth: 580,
            lineHeight: 1.6,
          }}
        >
          Every service scheduled at your property. AP confirms and dispatches
          these visits — you have visibility into the upcoming calendar.
        </p>
      </div>

      <OpsHairline width={48} margin="20px 0 24px" />

      {/* Filters + search */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          flexWrap: 'wrap',
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap' }}>
          {TABS.map((t) => {
            const active = t.key === filter;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setFilter(t.key)}
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
                  transition: 'all var(--dur-state) var(--ease-out)',
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
        <div style={{ flex: 1 }} />
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 12px',
            border: '1px solid var(--color-taupe)',
            borderRadius: 4,
            background: 'transparent',
            minWidth: 220,
          }}
        >
          <OpsIcon name="search" size={14} color="var(--color-mist)" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Reference, unit, resident, service…"
            style={{
              border: 0,
              outline: 'none',
              background: 'transparent',
              fontFamily: 'Inter, sans-serif',
              fontSize: 13,
              color: 'var(--color-charcoal)',
              flex: 1,
              padding: 0,
            }}
          />
        </div>
      </div>

      <OpsCard padding={0} style={{ overflow: 'hidden' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontFamily: 'Inter, sans-serif',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          <thead>
            <tr style={{ background: 'var(--color-cream-deep)' }}>
              {['Ref', 'Date', 'Time', 'Unit', 'Resident', 'Service', 'Assignee', 'Status'].map((h) => (
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
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  style={{
                    padding: '60px 24px',
                    textAlign: 'center',
                    color: 'var(--color-mist)',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 13,
                  }}
                >
                  No bookings match the current view.
                </td>
              </tr>
            )}
            {filtered.map((b, i) => (
              <BookingRow key={b.id} booking={b} alt={i % 2 === 1} onClick={() => openBooking(b.id)} />
            ))}
          </tbody>
        </table>
      </OpsCard>
    </div>
  );
}

function BookingRow({
  booking,
  alt,
  onClick,
}: {
  booking: OpsBooking;
  alt: boolean;
  onClick: () => void;
}) {
  return (
    <tr
      onClick={onClick}
      style={{
        cursor: 'pointer',
        borderTop: '1px solid var(--color-taupe-soft)',
        background: alt ? 'rgba(241,236,224,0.35)' : 'transparent',
        transition: 'background-color var(--dur-state) var(--ease-out)',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(196,151,62,0.06)')}
      onMouseLeave={(e) =>
        (e.currentTarget.style.background = alt ? 'rgba(241,236,224,0.35)' : 'transparent')
      }
    >
      <td style={{ ...td, fontFamily: 'Fraunces, serif', fontSize: 14 }}>{booking.reference}</td>
      <td style={td}>{booking.date}</td>
      <td style={td}>{booking.time}</td>
      <td style={td}>{booking.unit}</td>
      <td style={td}>{booking.resident}</td>
      <td style={td}>{booking.service}</td>
      <td style={{ ...td, color: '#8A8378' }}>
        {booking.assignee ?? <span style={{ color: 'var(--color-mist-faint)' }}>—</span>}
      </td>
      <td style={td}>
        <OpsPill tone={STATUS_TONE[booking.status]}>{STATUS_LABEL[booking.status]}</OpsPill>
      </td>
    </tr>
  );
}

// Re-export OpsButton so layout files that import it stay happy if needed.
export { OpsButton };
