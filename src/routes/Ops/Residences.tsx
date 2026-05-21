import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { Icon, Modal, useLucide, useToast } from '../../components';
import { useOps } from './context';
import {
  Kpi,
  OpsButton,
  OpsCard,
  OpsEyebrow,
  OpsHairline,
  OpsIcon,
  OpsPill,
} from './OpsPrimitives';
import { UnitFormModal } from './UnitFormModal';
import type { OpsUnit, UnitKind } from './data';

type KindFilter = 'all' | UnitKind;

const td: CSSProperties = {
  padding: '12px 14px',
  fontSize: 13,
  color: '#1A1A1A',
  verticalAlign: 'middle',
};

export function Residences() {
  useLucide();
  const {
    units,
    bookings,
    search,
    setSearch,
    openUnit,
    openPalette,
    deleteUnit,
    toggleUnitStatus,
    propertyName,
  } = useOps();
  const toast = useToast();

  const [kindFilter, setKindFilter] = useState<KindFilter>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingUnit, setEditingUnit] = useState<OpsUnit | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<OpsUnit | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return units.filter((u) => {
      if (kindFilter !== 'all' && u.kind !== kindFilter) return false;
      if (!q) return true;
      return [u.id, u.floor, u.resident, u.residentFull, u.email ?? '', u.phone ?? '']
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [units, search, kindFilter]);

  const residentialCount = units.filter((u) => u.kind === 'residential').length;
  const commercialCount = units.filter((u) => u.kind === 'commercial').length;
  const activeCount = units.filter((u) => u.status === 'active').length;
  const pausedCount = units.length - activeCount;

  function lastVisit(unitId: string): string | undefined {
    return bookings.find((b) => b.unit === unitId)?.date;
  }

  const handleAdd = () => {
    setFormMode('create');
    setEditingUnit(null);
    setFormOpen(true);
  };

  const handleEdit = (u: OpsUnit) => {
    setFormMode('edit');
    setEditingUnit(u);
    setFormOpen(true);
  };

  const handleDelete = (u: OpsUnit) => {
    setConfirmDelete(u);
  };

  const confirmDeletion = async () => {
    if (!confirmDelete) return;
    const name = confirmDelete.residentFull;
    const target = confirmDelete;
    setConfirmDelete(null);
    try {
      await deleteUnit(target.id);
      toast.success(`Removed ${name}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not remove. Try again.';
      toast.error(message);
    }
  };

  return (
    <div style={{ padding: 'clamp(20px, 4vw, 32px) clamp(20px, 4vw, 32px) 56px', position: 'relative' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <OpsEyebrow>{propertyName} · {units.length} Entries</OpsEyebrow>
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
            Property Directory
          </h1>
          <p
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 13,
              color: '#4A4A4A',
              margin: '8px 0 0',
              maxWidth: 560,
              lineHeight: 1.55,
            }}
          >
            Manage every residence and commercial contact under stewardship. Add, edit,
            pause, or remove entries — changes propagate to bookings and the palette.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <OpsButton variant="ghost" icon="search" onClick={openPalette}>
            Quick Find
          </OpsButton>
          <OpsButton variant="primary" icon="user-plus" onClick={handleAdd}>
            Add Entry
          </OpsButton>
        </div>
      </div>
      <OpsHairline width={48} margin="20px 0 24px" />

      {/* KPI strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: 14,
          marginBottom: 24,
        }}
        className="residences-kpis"
      >
        <Kpi label="Residencial" value={String(residentialCount)} />
        <Kpi label="Comercial" value={String(commercialCount)} />
        <Kpi label="Active" value={String(activeCount)} deltaTone="success" />
        <Kpi label="Paused" value={String(pausedCount)} deltaTone="warning" />
      </div>

      {/* Filter chips + search */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap',
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', gap: 6 }}>
          <FilterChip
            active={kindFilter === 'all'}
            onClick={() => setKindFilter('all')}
            label={`All · ${units.length}`}
          />
          <FilterChip
            active={kindFilter === 'residential'}
            onClick={() => setKindFilter('residential')}
            label={`Residencial · ${residentialCount}`}
          />
          <FilterChip
            active={kindFilter === 'commercial'}
            onClick={() => setKindFilter('commercial')}
            label={`Comercial · ${commercialCount}`}
          />
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--color-taupe)',
            borderRadius: 4,
            flex: 1,
            minWidth: 240,
            maxWidth: 480,
          }}
        >
          <Icon name="search" size={14} color="var(--color-mist)" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, floor, name, email…"
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
      </div>

      <OpsCard padding={0} style={{ overflow: 'hidden' }}>
        <div className="table-scroll">
          <table
            style={{
              width: '100%',
              minWidth: 980,
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
                {['ID', 'Floor', 'Name', 'Track', 'Role', 'Status', 'Visits', 'Last Visit', 'Since', 'Actions'].map(
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
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = 'rgba(196,151,62,0.06)')
                  }
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      i % 2 === 1 ? 'rgba(241,236,224,0.35)' : 'transparent';
                  }}
                >
                  <td style={{ ...td, fontFamily: 'Fraunces, serif', fontSize: 15 }}>{u.id}</td>
                  <td style={td}>{u.floor}</td>
                  <td style={td}>
                    <div>{u.resident}</div>
                    {u.email && (
                      <div style={{ fontSize: 11, color: '#8A8378', marginTop: 2 }}>{u.email}</div>
                    )}
                  </td>
                  <td style={td}>
                    <OpsPill tone={u.kind === 'commercial' ? 'info' : 'neutral'}>
                      {u.kind === 'commercial' ? 'Comercial' : 'Residencial'}
                    </OpsPill>
                  </td>
                  <td style={{ ...td, color: '#4A4A4A', textTransform: 'capitalize' }}>
                    {u.role ?? '—'}
                  </td>
                  <td style={td}>
                    <OpsPill tone={u.status === 'active' ? 'success' : 'warning'}>
                      {u.status === 'active' ? 'Active' : 'Paused'}
                    </OpsPill>
                  </td>
                  <td style={td}>{u.visits}</td>
                  <td style={{ ...td, color: '#4A4A4A' }}>{lastVisit(u.id) ?? '—'}</td>
                  <td style={{ ...td, color: '#4A4A4A' }}>{u.since}</td>
                  <td style={{ ...td, whiteSpace: 'nowrap' }} onClick={(e) => e.stopPropagation()}>
                    <RowAction
                      icon={u.status === 'active' ? 'pause-circle' : 'play-circle'}
                      label={u.status === 'active' ? 'Pause' : 'Activate'}
                      onClick={async () => {
                        try {
                          await toggleUnitStatus(u.id);
                          toast.success(
                            u.status === 'active'
                              ? `Paused ${u.residentFull}`
                              : `Activated ${u.residentFull}`,
                          );
                        } catch (err) {
                          const message =
                            err instanceof Error ? err.message : 'Could not update. Try again.';
                          toast.error(message);
                        }
                      }}
                    />
                    <RowAction icon="pencil" label="Edit" onClick={() => handleEdit(u)} />
                    <RowAction
                      icon="trash-2"
                      label="Remove"
                      tone="danger"
                      onClick={() => handleDelete(u)}
                    />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={10}
                    style={{
                      ...td,
                      textAlign: 'center',
                      padding: '48px 14px',
                      color: 'var(--color-mist)',
                    }}
                  >
                    No entries match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </OpsCard>

      <style>{`
        @media (max-width: 1023px) {
          .residences-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
        }
        @media (max-width: 540px) {
          .residences-kpis { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <UnitFormModal
        open={formOpen}
        mode={formMode}
        unit={editingUnit}
        onClose={() => setFormOpen(false)}
      />

      <ConfirmRemoveModal
        unit={confirmDelete}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={confirmDeletion}
      />
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        cursor: 'pointer',
        padding: '7px 12px',
        borderRadius: 999,
        fontFamily: 'Inter, sans-serif',
        fontSize: 12,
        fontWeight: 500,
        letterSpacing: '0.04em',
        background: active ? '#0A0A0A' : 'transparent',
        color: active ? '#F4F7FA' : '#1A1A1A',
        border: '1px solid ' + (active ? '#0A0A0A' : 'var(--color-taupe)'),
        transition:
          'background-color var(--dur-state) var(--ease-out), color var(--dur-state) var(--ease-out), border-color var(--dur-state) var(--ease-out)',
      }}
    >
      {label}
    </button>
  );
}

function RowAction({
  icon,
  label,
  onClick,
  tone = 'default',
}: {
  icon: string;
  label: string;
  onClick: () => void;
  tone?: 'default' | 'danger';
}) {
  const [hover, setHover] = useState(false);
  const color =
    tone === 'danger'
      ? hover
        ? 'var(--color-status-danger)'
        : '#7A2E2E'
      : hover
        ? 'var(--color-ink)'
        : '#5A5A5A';
  const bg =
    tone === 'danger'
      ? hover
        ? 'rgba(122,46,46,0.08)'
        : 'transparent'
      : hover
        ? 'rgba(10,10,10,0.05)'
        : 'transparent';
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-label={label}
      title={label}
      style={{
        background: bg,
        border: 0,
        cursor: 'pointer',
        padding: '6px 7px',
        marginRight: 2,
        borderRadius: 4,
        color,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition:
          'background-color var(--dur-state) var(--ease-out), color var(--dur-state) var(--ease-out)',
      }}
    >
      <OpsIcon name={icon} size={14} />
    </button>
  );
}

function ConfirmRemoveModal({
  unit,
  onCancel,
  onConfirm,
}: {
  unit: OpsUnit | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      open={!!unit}
      onClose={onCancel}
      eyebrow="Confirm"
      title={unit ? `Remove ${unit.residentFull}?` : ''}
      width={460}
      footer={
        <>
          <OpsButton variant="ghost" onClick={onCancel}>
            Cancel
          </OpsButton>
          <OpsButton variant="primary" icon="trash-2" onClick={onConfirm}>
            Remove Entry
          </OpsButton>
        </>
      }
    >
      <p
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 14,
          color: 'var(--color-mist)',
          lineHeight: 1.65,
          margin: 0,
        }}
      >
        This removes the directory entry{unit ? ` for ${unit.id}` : ''} and any bookings
        attached to it. The action is permanent.
      </p>
    </Modal>
  );
}
