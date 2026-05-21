import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { CountUp, Field, useLucide, useReveal } from '../../components';
import {
  Kpi,
  OpsButton,
  OpsCard,
  OpsEyebrow,
  OpsHairline,
  OpsIcon,
  OpsPill,
} from '../Ops/OpsPrimitives';
import { useAdmin } from './context';
import { AddPropertyModal } from './AddPropertyModal';
import { AddManagerModal } from './AddManagerModal';
import { EditPropertyModal } from './EditPropertyModal';
import { DeletePropertyModal } from './DeletePropertyModal';
import type { PropertyRow } from '../../lib/types/db';

const td: CSSProperties = {
  padding: '14px 16px',
  fontSize: 13,
  color: '#1A1A1A',
  verticalAlign: 'middle',
};

export function Overview() {
  useLucide();
  const navigate = useNavigate();
  const { properties, totals, loading } = useAdmin();
  const ref = useReveal<HTMLDivElement>({ y: 16, stagger: 0.04, rootMargin: '0px 0px -2% 0px' });
  const [addPropertyOpen, setAddPropertyOpen] = useState(false);
  const [addManagerOpen, setAddManagerOpen] = useState(false);
  const [prefillPropertyId, setPrefillPropertyId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<PropertyRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PropertyRow | null>(null);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return properties;
    return properties.filter(
      (p) =>
        p.property.name.toLowerCase().includes(q) ||
        p.property.city.toLowerCase().includes(q) ||
        p.property.slug.toLowerCase().includes(q),
    );
  }, [properties, search]);

  function openOpsAs(propertyId: string) {
    navigate(`/ops?property=${propertyId}`);
  }

  function addManagerFor(propertyId: string | null) {
    setPrefillPropertyId(propertyId);
    setAddManagerOpen(true);
  }

  const propertiesWithoutManager = totals.properties - totals.managers;
  const managersDelta =
    propertiesWithoutManager === 0
      ? 'All assigned'
      : propertiesWithoutManager === 1
        ? '1 property without a manager'
        : `${propertiesWithoutManager} properties without a manager`;

  return (
    <div ref={ref} style={{ padding: 'clamp(24px, 4vw, 40px) clamp(20px, 4vw, 40px) 80px', maxWidth: 1320, margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
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
            Overview
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
            Every property under AP Enterprises stewardship. Add new buildings, invite
            their managers, and drill into any property's operations.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <OpsButton
            variant="ghost"
            icon="user-plus"
            onClick={() => addManagerFor(null)}
          >
            Add Manager
          </OpsButton>
          <OpsButton variant="primary" icon="plus" onClick={() => setAddPropertyOpen(true)}>
            Add Property
          </OpsButton>
        </div>
      </div>
      <OpsHairline width={64} margin="24px 0 32px" />

      {/* KPIs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
          marginBottom: 32,
        }}
        className="platform-kpis"
      >
        <Kpi
          label="Properties"
          value={<CountUp to={totals.properties} duration={1.0} />}
          delta={totals.properties === 0 ? 'None yet' : 'Active'}
          deltaTone={totals.properties === 0 ? 'warning' : 'success'}
        />
        <Kpi
          label="Active Bookings"
          value={<CountUp to={totals.activeBookings} duration={1.2} />}
          delta="across all properties"
          deltaTone="neutral"
        />
        <Kpi
          label="Residents"
          value={<CountUp to={totals.residents} duration={1.2} />}
          delta="with portal access"
          deltaTone="neutral"
        />
        <Kpi
          label="Managers"
          value={<CountUp to={totals.managers} duration={1.0} />}
          delta={managersDelta}
          deltaTone={propertiesWithoutManager > 0 ? 'warning' : 'success'}
        />
      </div>

      {/* Properties table */}
      <OpsCard padding={0} style={{ overflow: 'hidden' }}>
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--color-taupe)',
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
          }}
        >
          <h2
            style={{
              fontFamily: 'Fraunces, serif',
              fontWeight: 400,
              fontSize: 22,
              margin: 0,
              color: '#1A1A1A',
            }}
          >
            Properties
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search properties"
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 13,
                padding: '6px 10px',
                border: '1px solid var(--color-taupe)',
                borderRadius: 4,
                outline: 'none',
                background: 'transparent',
                color: 'var(--color-charcoal)',
                width: 200,
              }}
            />
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 11,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--color-mist)',
              }}
            >
              {filtered.length} of {properties.length}
            </span>
          </div>
        </div>

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
              <tr style={{ background: 'var(--color-cream-deep)' }}>
                {['Property', 'City', 'Address', 'Units', 'Active Bookings', 'Residents', 'Manager', ''].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: 'left',
                      padding: '12px 16px',
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
              {!loading && filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    style={{
                      padding: '48px 24px',
                      textAlign: 'center',
                      color: 'var(--color-mist)',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    {properties.length === 0
                      ? <>No properties yet. Click <strong>Add Property</strong> to onboard the first one.</>
                      : 'No properties match the search.'}
                  </td>
                </tr>
              )}
              {filtered.map((p, i) => (
                <tr
                  key={p.property.id}
                  data-reveal
                  style={{
                    borderTop: i === 0 ? '0' : '1px solid var(--color-taupe-soft)',
                    background: i % 2 === 1 ? 'rgba(241,236,224,0.35)' : 'transparent',
                  }}
                >
                  <td style={{ ...td, fontFamily: 'Fraunces, serif', fontSize: 16 }}>
                    {p.property.name}
                    <div
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: 11,
                        color: '#8A8378',
                        marginTop: 3,
                        letterSpacing: '0.04em',
                      }}
                    >
                      /{p.property.slug}
                    </div>
                  </td>
                  <td style={td}>{p.property.city}</td>
                  <td style={{ ...td, color: '#4A4A4A', fontSize: 12, maxWidth: 220 }}>
                    {p.property.address ?? <span style={{ color: '#A8A095' }}>—</span>}
                  </td>
                  <td style={td}>
                    <span style={{ fontFamily: 'Fraunces, serif', fontSize: 15 }}>{p.units_total}</span>
                    {p.units_total > 0 && (
                      <span style={{ color: '#8A8378', marginLeft: 6, fontSize: 11 }}>
                        ({p.units_active} active)
                      </span>
                    )}
                  </td>
                  <td style={td}>
                    <span style={{ fontFamily: 'Fraunces, serif', fontSize: 15 }}>
                      {p.bookings_active}
                    </span>
                    {p.bookings_total > 0 && (
                      <span style={{ color: '#8A8378', marginLeft: 6, fontSize: 11 }}>
                        of {p.bookings_total} total
                      </span>
                    )}
                  </td>
                  <td style={td}>{p.residents_total}</td>
                  <td style={td}>
                    {p.manager_email ? (
                      <span style={{ color: '#4A4A4A', fontSize: 12 }}>{p.manager_email}</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => addManagerFor(p.property.id)}
                        style={{
                          background: 'transparent',
                          border: 0,
                          padding: 0,
                          cursor: 'pointer',
                          fontFamily: 'Inter, sans-serif',
                        }}
                      >
                        <OpsPill tone="warning">+ Assign</OpsPill>
                      </button>
                    )}
                  </td>
                  <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <RowAction
                      icon="external-link"
                      label="Open Ops"
                      onClick={() => openOpsAs(p.property.id)}
                    />
                    <RowAction icon="pencil" label="Edit" onClick={() => setEditTarget(p.property)} />
                    <RowAction icon="trash-2" label="Delete" tone="danger" onClick={() => setDeleteTarget(p.property)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </OpsCard>

      <AddPropertyModal open={addPropertyOpen} onClose={() => setAddPropertyOpen(false)} />
      <AddManagerModal
        open={addManagerOpen}
        onClose={() => {
          setAddManagerOpen(false);
          setPrefillPropertyId(null);
        }}
        prefillPropertyId={prefillPropertyId}
      />
      <EditPropertyModal
        open={!!editTarget}
        property={editTarget}
        onClose={() => setEditTarget(null)}
      />
      <DeletePropertyModal
        open={!!deleteTarget}
        property={deleteTarget}
        onClose={() => setDeleteTarget(null)}
      />

      <style>{`
        @media (max-width: 1023px) {
          .platform-kpis { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 540px) {
          .platform-kpis { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
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
  const color = tone === 'danger' ? '#7A2E2E' : '#5A5A5A';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      style={{
        background: 'transparent',
        border: '1px solid var(--color-taupe)',
        borderRadius: 4,
        padding: '6px 10px',
        marginLeft: 4,
        cursor: 'pointer',
        color,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontFamily: 'Inter, sans-serif',
        fontSize: 11,
        transition: 'border-color var(--dur-state) var(--ease-out)',
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.borderColor =
          tone === 'danger' ? 'var(--color-status-danger)' : 'var(--color-champagne)')
      }
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-taupe)')}
    >
      <OpsIcon name={icon} size={12} />
      {label}
    </button>
  );
}
