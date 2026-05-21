import { useMemo, useRef, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { useReveal, useToast } from '../../components';
import { CountUp } from '../../components';
import { buildCsv, downloadCsv } from '../../utils/csv';
import { useOps } from './context';
import {
  Kpi,
  OpsButton,
  OpsEyebrow,
  OpsHairline,
  OpsIcon,
  OpsPill,
} from './OpsPrimitives';
import {
  STATUS_LABEL,
  STATUS_TONE,
  type BookingStatus,
  type OpsBooking,
} from './data';

interface Col {
  id: BookingStatus;
  label: string;
}

const COLS: Col[] = [
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'enroute', label: 'En Route' },
  { id: 'active', label: 'In Progress' },
  { id: 'closed', label: 'Closed Today' },
];

const ALL_STATUSES: BookingStatus[] = ['scheduled', 'enroute', 'active', 'closed', 'cancelled'];

export function Pipeline() {
  const toast = useToast();
  const { bookings, openBooking, openNewBooking, setBookingStatus, propertyName } = useOps();
  const ref = useReveal<HTMLDivElement>({ y: 16, stagger: 0.04, rootMargin: '0px 0px -2% 0px' });
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<Set<BookingStatus>>(new Set(ALL_STATUSES));
  const [attendantFilter, setAttendantFilter] = useState<string>('');
  const filtersAnchor = useRef<HTMLDivElement>(null);

  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    [],
  );

  const attendantOptions = useMemo(() => {
    const set = new Set<string>();
    for (const b of bookings) if (b.attendant && b.attendant !== '—') set.add(b.attendant);
    return Array.from(set).sort();
  }, [bookings]);

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      if (!statusFilter.has(b.status)) return false;
      if (attendantFilter && b.attendant !== attendantFilter) return false;
      return true;
    });
  }, [bookings, statusFilter, attendantFilter]);

  const grouped = useMemo(() => {
    const map: Record<BookingStatus, OpsBooking[]> = {
      scheduled: [],
      enroute: [],
      active: [],
      closed: [],
      cancelled: [],
    };
    for (const b of filtered) {
      if (map[b.status]) map[b.status].push(b);
    }
    return map;
  }, [filtered]);

  const visitsToday = filtered.filter((b) => b.status !== 'cancelled').length;
  const onSite = grouped.active.length;
  const awaitingAccess = filtered.filter((b) => b.note?.toLowerCase().includes('awaiting')).length;
  const arrivedBookings = filtered.filter((b) => b.arrivedAt);
  const onTimeBookings = arrivedBookings.filter((b) => {
    if (!b.arrivedAt) return false;
    const arrived = new Date(b.arrivedAt).getTime();
    const scheduled = new Date(b.scheduledAt).getTime();
    // 15 min grace.
    return arrived - scheduled <= 15 * 60 * 1000;
  });
  const onTimePct =
    arrivedBookings.length === 0
      ? 0
      : Math.round((onTimeBookings.length / arrivedBookings.length) * 100);

  const filtersActive = statusFilter.size < ALL_STATUSES.length || !!attendantFilter;

  function toggleStatus(s: BookingStatus) {
    setStatusFilter((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  }

  function clearFilters() {
    setStatusFilter(new Set(ALL_STATUSES));
    setAttendantFilter('');
  }

  function exportPipeline() {
    const csv = buildCsv(filtered, [
      { header: 'Ref', accessor: (b) => b.reference },
      { header: 'Date', accessor: (b) => b.date },
      { header: 'Time', accessor: (b) => b.time },
      { header: 'Residence', accessor: (b) => b.unit },
      { header: 'Resident', accessor: (b) => b.resident },
      { header: 'Service', accessor: (b) => b.service },
      { header: 'Attendant', accessor: (b) => b.attendant },
      { header: 'Status', accessor: (b) => STATUS_LABEL[b.status] },
      { header: 'Price', accessor: (b) => b.price },
    ]);
    downloadCsv(`apenterprises-pipeline-${Date.now()}.csv`, csv);
    toast.success(`${filtered.length} bookings exported.`);
  }

  function onDragStart(e: DragStartEvent) {
    setDraggingId(e.active.id as string);
  }

  async function onDragEnd(e: DragEndEvent) {
    setDraggingId(null);
    if (!e.over) return;
    const id = e.active.id as string;
    const newStatus = e.over.id as BookingStatus;
    const booking = bookings.find((b) => b.id === id);
    if (!booking || booking.status === newStatus) return;
    try {
      await setBookingStatus(id, newStatus);
      toast.success(`${booking.reference} → ${STATUS_LABEL[newStatus]}.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not update. Reverted.';
      toast.error(message);
    }
  }

  const activeBooking = draggingId ? bookings.find((b) => b.id === draggingId) : null;

  return (
    <div
      ref={ref}
      style={{ padding: 'clamp(20px, 4vw, 32px) clamp(20px, 4vw, 32px) 56px' }}
    >
      {/* ── Header ───────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: 8,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <OpsEyebrow>{todayLabel} · {propertyName}</OpsEyebrow>
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
            Pipeline
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', position: 'relative' }} ref={filtersAnchor}>
          <OpsButton
            variant={filtersActive ? 'secondary' : 'ghost'}
            icon="filter"
            onClick={() => setFiltersOpen((v) => !v)}
          >
            {filtersActive ? `Filters · ${[...statusFilter].length}/${ALL_STATUSES.length}` : 'Filters'}
          </OpsButton>
          <OpsButton variant="ghost" icon="download" onClick={exportPipeline}>
            Export
          </OpsButton>
          <OpsButton variant="primary" icon="plus" onClick={() => openNewBooking()}>
            New Booking
          </OpsButton>

          {filtersOpen && (
            <div
              role="dialog"
              aria-label="Pipeline filters"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: 280,
                background: 'var(--bg-surface)',
                border: '1px solid var(--color-taupe)',
                borderRadius: 6,
                boxShadow: 'var(--shadow-2)',
                padding: 16,
                zIndex: 30,
              }}
            >
              <OpsEyebrow>Status</OpsEyebrow>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                {ALL_STATUSES.map((s) => (
                  <label
                    key={s}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      cursor: 'pointer',
                      fontFamily: 'var(--font-sans)',
                      fontSize: 13,
                      color: 'var(--color-charcoal)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={statusFilter.has(s)}
                      onChange={() => toggleStatus(s)}
                    />
                    {STATUS_LABEL[s]}
                  </label>
                ))}
              </div>

              <OpsHairline color="var(--color-taupe-soft)" width="100%" margin="14px 0" />

              <OpsEyebrow>Attendant</OpsEyebrow>
              <select
                value={attendantFilter}
                onChange={(e) => setAttendantFilter(e.target.value)}
                style={{
                  marginTop: 8,
                  width: '100%',
                  padding: '8px 10px',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 13,
                  border: '1px solid var(--color-taupe)',
                  borderRadius: 4,
                  background: 'transparent',
                  color: 'var(--color-charcoal)',
                }}
              >
                <option value="">All</option>
                {attendantOptions.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14 }}>
                <button
                  type="button"
                  onClick={clearFilters}
                  style={{
                    background: 'transparent',
                    border: 0,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 12,
                    color: 'var(--color-mist)',
                    padding: 0,
                  }}
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => setFiltersOpen(false)}
                  style={{
                    background: 'var(--color-ink)',
                    color: 'var(--color-cream)',
                    border: 0,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 12,
                    padding: '6px 12px',
                    borderRadius: 4,
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <OpsHairline width={48} margin="20px 0 28px" />

      {/* ── KPI row ───────────────────────────────────────────── */}
      <div
        className="pipeline-kpis"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
          marginBottom: 28,
        }}
      >
        <Kpi
          label="Visits Today"
          value={<CountUp to={visitsToday} duration={1.4} />}
          delta="+2 vs avg"
          deltaTone="success"
        />
        <Kpi
          label="Attendants On Site"
          value={<CountUp to={onSite} duration={1.2} />}
          delta="of 6 scheduled"
          deltaTone="neutral"
        />
        <Kpi
          label="Awaiting Access"
          value={<CountUp to={awaitingAccess} duration={1.0} />}
          delta={awaitingAccess > 0 ? 'PH-02' : 'None'}
          deltaTone={awaitingAccess > 0 ? 'warning' : 'success'}
        />
        <Kpi
          label="On-Time Arrivals"
          value={<CountUp to={onTimePct} duration={1.6} />}
          sup="%"
          delta={
            arrivedBookings.length === 0
              ? 'Mark arrivals to populate'
              : `${onTimeBookings.length} of ${arrivedBookings.length}`
          }
          deltaTone={arrivedBookings.length === 0 ? 'neutral' : 'success'}
        />
      </div>

      {/* ── Kanban ───────────────────────────────────────────── */}
      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div
          className="pipeline-cols"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}
        >
          {COLS.map((col) => {
            const items = grouped[col.id];
            return (
              <Column key={col.id} col={col} count={items.length}>
                {items.map((item) => (
                  <DraggableCard key={item.id} item={item} onClick={() => openBooking(item.id)} />
                ))}
                {items.length === 0 && <EmptyCol />}
              </Column>
            );
          })}
        </div>

        <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.2, 0.6, 0.2, 1)' }}>
          {activeBooking ? <PipelineCardVisual item={activeBooking} dragging /> : null}
        </DragOverlay>
      </DndContext>

      <style>{`
        @media (max-width: 1023px) {
          .pipeline-kpis { grid-template-columns: repeat(2, 1fr) !important; }
          .pipeline-cols { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 640px) {
          .pipeline-kpis { grid-template-columns: 1fr !important; }
          .pipeline-cols { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

// ─── Column ────────────────────────────────────────────────────────────────

function Column({
  col,
  count,
  children,
}: {
  col: Col;
  count: number;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id });
  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              fontFamily: 'Fraunces, serif',
              fontWeight: 400,
              fontSize: 17,
              color: '#1A1A1A',
            }}
          >
            {col.label}
          </span>
          <OpsPill tone={STATUS_TONE[col.id]} dot={false}>
            {count}
          </OpsPill>
        </div>
        <button
          style={{ background: 'transparent', border: 0, color: '#8A8378', cursor: 'pointer' }}
          aria-label="Column options"
        >
          <OpsIcon name="more-horizontal" size={16} />
        </button>
      </div>
      <OpsHairline width="100%" color="var(--color-taupe)" margin="0 0 12px" />
      <div
        ref={setNodeRef}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          padding: 8,
          margin: -8,
          minHeight: 80,
          borderRadius: 6,
          border: isOver
            ? '1px dashed var(--color-champagne)'
            : '1px dashed transparent',
          background: isOver ? 'rgba(196,151,62,0.06)' : 'transparent',
          transition:
            'background-color var(--dur-state) var(--ease-out), border-color var(--dur-state) var(--ease-out)',
        }}
      >
        {children}
      </div>
    </div>
  );
}

function EmptyCol() {
  return (
    <div
      style={{
        padding: '20px 12px',
        textAlign: 'center',
        fontFamily: 'var(--font-sans)',
        fontSize: 11,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--color-mist-faint)',
        border: '1px dashed var(--color-taupe-soft)',
        borderRadius: 6,
      }}
    >
      Drop here
    </div>
  );
}

// ─── Card ──────────────────────────────────────────────────────────────────

function DraggableCard({ item, onClick }: { item: OpsBooking; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: item.id });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={() => {
        // dnd-kit may swallow click; check if drag happened via isDragging on click time
        if (!isDragging) onClick();
      }}
      style={{
        opacity: isDragging ? 0.35 : 1,
        cursor: isDragging ? 'grabbing' : 'pointer',
      }}
    >
      <PipelineCardVisual item={item} />
    </div>
  );
}

function PipelineCardVisual({
  item,
  dragging,
}: {
  item: OpsBooking;
  dragging?: boolean;
}) {
  return (
    <article
      data-reveal
      style={{
        background: '#FFFFFF',
        border: `1px solid ${dragging ? 'var(--color-champagne)' : '#D9D2C5'}`,
        borderRadius: 6,
        padding: '12px 14px',
        boxShadow: dragging
          ? '0 12px 28px rgba(10,10,10,0.18), 0 2px 6px rgba(10,10,10,0.10)'
          : '0 1px 3px rgba(10,10,10,0.04)',
        transition:
          'border-color 200ms ease, box-shadow 200ms ease, transform 200ms ease',
        transform: dragging ? 'translateY(-2px) rotate(-0.5deg)' : 'translateY(0)',
        willChange: 'transform',
        userSelect: 'none',
      }}
      onMouseEnter={(e) => {
        if (dragging) return;
        e.currentTarget.style.borderColor = '#C4973E';
        e.currentTarget.style.boxShadow =
          '0 6px 16px rgba(10,10,10,0.08), 0 1px 3px rgba(10,10,10,0.06)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        if (dragging) return;
        e.currentTarget.style.borderColor = '#D9D2C5';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(10,10,10,0.04)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div
          style={{
            fontFamily: 'Fraunces, serif',
            fontSize: 17,
            fontWeight: 400,
            color: '#1A1A1A',
          }}
        >
          {item.time}
        </div>
        <div
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 11,
            color: '#8A8378',
            letterSpacing: '0.06em',
          }}
        >
          {item.unit}
        </div>
      </div>
      <div
        style={{
          marginTop: 6,
          fontFamily: 'Inter, sans-serif',
          fontSize: 13,
          color: '#1A1A1A',
        }}
      >
        {item.service}
      </div>
      <div
        style={{
          marginTop: 4,
          fontFamily: 'Inter, sans-serif',
          fontSize: 11,
          color: '#8A8378',
        }}
      >
        {item.resident} · {item.attendant}
      </div>
      {item.note && (
        <div
          style={{
            marginTop: 8,
            paddingTop: 8,
            borderTop: '1px solid var(--color-taupe-soft)',
            fontFamily: 'Inter, sans-serif',
            fontSize: 11,
            color: '#8A6A1F',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <OpsIcon name="alert-triangle" size={12} /> {item.note}
        </div>
      )}
      {item.duration && (
        <div style={{ marginTop: 8 }}>
          <OpsPill tone="success">{item.duration} in progress</OpsPill>
        </div>
      )}
    </article>
  );
}
