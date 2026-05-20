import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Eyebrow, Hairline, Icon, useLucide } from '../../components';
import { useOps } from './context';

interface CommandItem {
  id: string;
  label: string;
  hint: string;
  icon: string;
  /** Group label shown above the row in results. */
  group: 'bookings' | 'residences' | 'navigate' | 'actions';
  run: () => void;
  /** Substring used for fuzzy matching. */
  match: string;
}

const KEY_HINT = navigator.userAgent.toUpperCase().includes('MAC') ? '⌘ K' : 'Ctrl K';

export function CommandPalette() {
  const navigate = useNavigate();
  const {
    paletteOpen,
    closePalette,
    bookings,
    units,
    openBooking,
    openUnit,
    openNewBooking,
  } = useOps();
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  useLucide();

  useEffect(() => {
    if (paletteOpen) {
      setQuery('');
      setHighlight(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [paletteOpen]);

  const items = useMemo<CommandItem[]>(() => {
    const list: CommandItem[] = [];

    // Quick actions
    list.push(
      {
        id: 'new-booking',
        label: 'Schedule a new visit',
        hint: 'Open the New Booking wizard',
        icon: 'plus',
        group: 'actions',
        match: 'new booking schedule visit create',
        run: () => {
          closePalette();
          openNewBooking();
        },
      },
      {
        id: 'go-pipeline',
        label: 'Go to Pipeline',
        hint: 'Today\'s board',
        icon: 'kanban-square',
        group: 'navigate',
        match: 'pipeline board today',
        run: () => {
          closePalette();
          navigate('/ops');
        },
      },
      {
        id: 'go-bookings',
        label: 'Go to Bookings',
        hint: 'All bookings, filterable',
        icon: 'calendar-check',
        group: 'navigate',
        match: 'bookings table list',
        run: () => {
          closePalette();
          navigate('/ops/bookings');
        },
      },
      {
        id: 'go-residences',
        label: 'Go to Residences',
        hint: 'Units and residents',
        icon: 'building-2',
        group: 'navigate',
        match: 'residences units residents',
        run: () => {
          closePalette();
          navigate('/ops/residences');
        },
      },
      {
        id: 'go-reports',
        label: 'Go to Reports',
        hint: 'Quarterly visit volume + KPIs',
        icon: 'chart-no-axes-column',
        group: 'navigate',
        match: 'reports analytics charts',
        run: () => {
          closePalette();
          navigate('/ops/reports');
        },
      },
    );

    // Bookings
    bookings.forEach((b) => {
      list.push({
        id: `b-${b.id}`,
        label: `${b.id} · ${b.service}`,
        hint: `${b.date} ${b.time} · Res. ${b.unit} · ${b.resident}`,
        icon: 'calendar-check',
        group: 'bookings',
        match: `${b.id} ${b.service} ${b.unit} ${b.resident} ${b.attendant}`.toLowerCase(),
        run: () => {
          closePalette();
          openBooking(b.id);
        },
      });
    });

    // Residences
    units.forEach((u) => {
      list.push({
        id: `u-${u.id}`,
        label: `Residence ${u.id} · ${u.resident}`,
        hint: `Floor ${u.floor} · ${u.visits} visits · since ${u.since}`,
        icon: 'building-2',
        group: 'residences',
        match: `${u.id} ${u.resident} ${u.residentFull} floor ${u.floor}`.toLowerCase(),
        run: () => {
          closePalette();
          openUnit(u.id);
        },
      });
    });

    return list;
  }, [bookings, units, navigate, closePalette, openBooking, openUnit, openNewBooking]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // Default: show navigate + actions + first 4 bookings
      const acts = items.filter((i) => i.group === 'actions' || i.group === 'navigate');
      const recent = items.filter((i) => i.group === 'bookings').slice(0, 4);
      return [...acts, ...recent];
    }
    return items.filter((i) => i.match.includes(q));
  }, [items, query]);

  useEffect(() => {
    setHighlight(0);
  }, [query, paletteOpen]);

  useEffect(() => {
    if (!paletteOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closePalette();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlight((i) => Math.min(filtered.length - 1, i + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlight((i) => Math.max(0, i - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const target = filtered[highlight];
        target?.run();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [paletteOpen, filtered, highlight, closePalette]);

  return createPortal(
    <div
      aria-hidden={!paletteOpen}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 80,
        pointerEvents: paletteOpen ? 'auto' : 'none',
      }}
    >
      <div
        onClick={closePalette}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(10, 10, 10, 0.5)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          opacity: paletteOpen ? 1 : 0,
          transition: 'opacity var(--dur-layout) var(--ease-soft)',
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        style={{
          position: 'absolute',
          top: 'clamp(64px, 12vh, 140px)',
          left: '50%',
          transform: paletteOpen
            ? 'translateX(-50%) translateY(0) scale(1)'
            : 'translateX(-50%) translateY(-12px) scale(0.97)',
          opacity: paletteOpen ? 1 : 0,
          width: 'min(640px, calc(100vw - 32px))',
          maxHeight: '70vh',
          background: 'var(--bg-page)',
          border: '1px solid var(--color-taupe)',
          borderRadius: 8,
          boxShadow: 'var(--shadow-3)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          transition:
            'opacity var(--dur-layout) var(--ease-soft), transform var(--dur-layout) var(--ease-soft)',
          willChange: 'transform, opacity',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '16px 20px',
            borderBottom: '1px solid var(--color-taupe)',
          }}
        >
          <Icon name="search" size={18} color="var(--color-mist)" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search bookings, residences, actions…"
            aria-label="Search commands"
            style={{
              flex: 1,
              border: 0,
              outline: 'none',
              background: 'transparent',
              fontFamily: 'var(--font-sans)',
              fontSize: 16,
              color: 'var(--color-charcoal)',
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 10,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--color-mist)',
              border: '1px solid var(--color-taupe)',
              padding: '4px 8px',
              borderRadius: 4,
            }}
          >
            {KEY_HINT}
          </span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {filtered.length === 0 && (
            <div style={{ padding: '24px 20px' }}>
              <Eyebrow>No matches</Eyebrow>
              <p
                style={{
                  margin: '8px 0 0',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 14,
                  color: 'var(--color-mist)',
                }}
              >
                Try a booking ID, residence number, or resident surname.
              </p>
            </div>
          )}
          {filtered.length > 0 && <GroupedList items={filtered} highlight={highlight} setHighlight={setHighlight} />}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '10px 20px',
            borderTop: '1px solid var(--color-taupe)',
            background: 'var(--color-cream-deep)',
            fontFamily: 'var(--font-sans)',
            fontSize: 11,
            letterSpacing: '0.06em',
            color: 'var(--color-mist)',
          }}
        >
          <span>
            <kbd style={kbdStyle}>↑↓</kbd>
            <span style={{ marginLeft: 8 }}>navigate</span>
            <kbd style={{ ...kbdStyle, marginLeft: 16 }}>↵</kbd>
            <span style={{ marginLeft: 8 }}>select</span>
            <kbd style={{ ...kbdStyle, marginLeft: 16 }}>Esc</kbd>
            <span style={{ marginLeft: 8 }}>close</span>
          </span>
          <span style={{ fontFamily: 'var(--font-serif)' }}>AP Enterprises Operations</span>
        </div>
      </div>
    </div>,
    document.body,
  );
}

const kbdStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '2px 6px',
  border: '1px solid var(--color-taupe)',
  borderRadius: 3,
  fontFamily: 'var(--font-sans)',
  fontSize: 10,
  letterSpacing: '0.04em',
  color: 'var(--color-charcoal)',
  background: 'var(--bg-surface)',
};

function GroupedList({
  items,
  highlight,
  setHighlight,
}: {
  items: CommandItem[];
  highlight: number;
  setHighlight: (i: number) => void;
}) {
  const groups: Record<string, { label: string; entries: { item: CommandItem; idx: number }[] }> = {};
  items.forEach((item, idx) => {
    if (!groups[item.group]) {
      groups[item.group] = { label: GROUP_LABEL[item.group], entries: [] };
    }
    groups[item.group]!.entries.push({ item, idx });
  });

  return (
    <div>
      {Object.entries(groups).map(([key, group]) => (
        <div key={key}>
          <div
            style={{
              padding: '8px 20px 4px',
              fontFamily: 'var(--font-sans)',
              fontSize: 10,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--color-mist)',
            }}
          >
            {group.label}
          </div>
          {group.entries.map(({ item, idx }) => (
            <Row
              key={item.id}
              item={item}
              active={idx === highlight}
              onActivate={() => item.run()}
              onHover={() => setHighlight(idx)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

const GROUP_LABEL: Record<CommandItem['group'], string> = {
  actions: 'Actions',
  navigate: 'Navigate',
  bookings: 'Bookings',
  residences: 'Residences',
};

function Row({
  item,
  active,
  onActivate,
  onHover,
}: {
  item: CommandItem;
  active: boolean;
  onActivate: () => void;
  onHover: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onActivate}
      onMouseEnter={onHover}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '12px 20px',
        width: '100%',
        background: active ? 'var(--color-cream-deep)' : 'transparent',
        border: 0,
        cursor: 'pointer',
        transition: 'background-color var(--dur-snap) var(--ease-out)',
        textAlign: 'left',
      }}
    >
      <span
        style={{
          width: 32,
          height: 32,
          borderRadius: 4,
          border: '1px solid var(--color-taupe)',
          background: 'var(--bg-surface)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-mist)',
          flexShrink: 0,
        }}
      >
        <Icon name={item.icon} size={14} />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            display: 'block',
            fontFamily: 'var(--font-sans)',
            fontSize: 14,
            color: 'var(--color-charcoal)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {item.label}
        </span>
        <span
          style={{
            display: 'block',
            fontFamily: 'var(--font-sans)',
            fontSize: 12,
            color: 'var(--color-mist)',
            marginTop: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {item.hint}
        </span>
      </span>
      {active && (
        <Icon name="corner-down-left" size={14} color="var(--color-champagne-deep)" />
      )}
    </button>
  );
}
