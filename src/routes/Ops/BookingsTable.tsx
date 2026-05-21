import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { Icon, useLucide, useToast } from '../../components';
import { buildCsv, downloadCsv } from '../../utils/csv';
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
  { key: 'enroute', label: 'En Route' },
  { key: 'active', label: 'In Progress' },
  { key: 'closed', label: 'Closed' },
  { key: 'cancelled', label: 'Cancelled' },
];

export function BookingsTable() {
  useLucide();
  const toast = useToast();
  const { bookings, search, setSearch, openBooking, openNewBooking, openPalette, propertyName } = useOps();
  const [filter, setFilter] = useState<FilterKey>('all');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bookings.filter((b) => {
      if (filter !== 'all' && b.status !== filter) return false;
      if (!q) return true;
      return [b.reference, b.unit, b.resident, b.service, b.attendant]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [bookings, search, filter]);

  function exportCsv() {
    const csv = buildCsv<OpsBooking>(filtered, [
      { header: 'Ref', accessor: (b) => b.reference },
      { header: 'Date', accessor: (b) => b.date },
      { header: 'Time', accessor: (b) => b.time },
      { header: 'Residence', accessor: (b) => b.unit },
      { header: 'Resident', accessor: (b) => b.resident },
      { header: 'Service', accessor: (b) => b.service },
      { header: 'Attendant', accessor: (b) => b.attendant },
      { header: 'Status', accessor: (b) => STATUS_LABEL[b.status] },
      { header: 'Charge', accessor: (b) => b.price },
      { header: 'Note', accessor: (b) => b.note ?? '' },
    ]);
    downloadCsv(`apenterprises-bookings-${Date.now()}.csv`, csv);
    toast.success(`${filtered.length} bookings exported.`);
  }

  return (
    <div style={{ padding: 'clamp(20px, 4vw, 32px) clamp(20px, 4vw, 32px) 56px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <OpsEyebrow>{propertyName} · Operations</OpsEyebrow>
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
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <OpsButton variant="ghost" icon="filter" onClick={openPalette}>
            Search
          </OpsButton>
          <OpsButton variant="ghost" icon="download" onClick={exportCsv}>
            Export CSV
          </OpsButton>
          <OpsButton variant="primary" icon="plus" onClick={() => openNewBooking()}>
            New Booking
          </OpsButton>
        </div>
      </div>
      <OpsHairline width={48} margin="20px 0 24px" />

      {/* Inline search */}
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
          placeholder="Search bookings by ID, residence, resident, service…"
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

      {/* Filter tabs */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          marginBottom: 18,
          borderBottom: '1px solid var(--color-taupe)',
          flexWrap: 'wrap',
        }}
      >
        {TABS.map((t) => {
          const active = t.key === filter;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setFilter(t.key)}
              style={{
                background: 'transparent',
                border: 0,
                cursor: 'pointer',
                padding: '10px 16px 12px',
                fontFamily: 'Inter, sans-serif',
                fontSize: 13,
                color: active ? '#1A1A1A' : '#8A8378',
                fontWeight: active ? 500 : 400,
                borderBottom: active ? '1px solid #C4973E' : '1px solid transparent',
                marginBottom: -1,
                whiteSpace: 'nowrap',
                transition: 'color var(--dur-state) var(--ease-out), border-color var(--dur-state) var(--ease-out)',
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <OpsCard padding={0} style={{ overflow: 'hidden' }}>
        <div className="table-scroll">
          <table
            style={{
              width: '100%',
              minWidth: 920,
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
                {['Ref', 'Date', 'Time', 'Residence', 'Resident', 'Service', 'Attendant', 'Status', ''].map(
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
              {filtered.map((b, i) => (
                <tr
                  key={b.id}
                  onClick={() => openBooking(b.id)}
                  style={{
                    cursor: 'pointer',
                    borderBottom:
                      i < filtered.length - 1 ? '1px solid var(--color-taupe-soft)' : undefined,
                    background: i % 2 === 1 ? 'rgba(241,236,224,0.35)' : 'transparent',
                    transition: 'background-color var(--dur-state) var(--ease-out)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(196,151,62,0.06)')}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      i % 2 === 1 ? 'rgba(241,236,224,0.35)' : 'transparent';
                  }}
                >
                  <td style={td}>{b.reference}</td>
                  <td style={td}>{b.date}</td>
                  <td style={{ ...td, fontFamily: 'Fraunces, serif', fontSize: 14 }}>{b.time}</td>
                  <td style={td}>{b.unit}</td>
                  <td style={td}>{b.resident}</td>
                  <td style={td}>{b.service}</td>
                  <td style={{ ...td, color: '#4A4A4A' }}>{b.attendant}</td>
                  <td style={td}>
                    <OpsPill tone={STATUS_TONE[b.status]}>{STATUS_LABEL[b.status]}</OpsPill>
                  </td>
                  <td style={{ ...td, color: '#8A8378' }}>
                    <OpsIcon name="chevron-right" size={14} />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ ...td, textAlign: 'center', padding: '48px 14px', color: 'var(--color-mist)' }}>
                    No bookings match the current filter or search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </OpsCard>

      <div
        style={{
          marginTop: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontFamily: 'Inter, sans-serif',
          fontSize: 12,
          color: 'var(--color-mist)',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <span>
          Showing {filtered.length} of {bookings.length} bookings
        </span>
      </div>
    </div>
  );
}
