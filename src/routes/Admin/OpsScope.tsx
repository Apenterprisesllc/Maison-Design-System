import { useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLucide } from '../../components';
import { useAdmin } from './context';
import { OpsProvider, useOps } from '../Ops/context';
import { BookingDetailDrawer } from '../Ops/BookingDetailDrawer';
import { UnitDetailDrawer } from '../Ops/UnitDetailDrawer';
import { NewBookingModal } from '../Ops/NewBookingModal';
import { CommandPalette } from '../Ops/CommandPalette';
import { OpsEyebrow, OpsIcon } from '../Ops/OpsPrimitives';

/**
 * Wraps an admin-side ops view (Pipeline, Bookings, Residences, Reports) with
 * an OpsProvider scoped to a selected property. Renders a property picker at
 * the top so the super admin can swap properties without leaving the page.
 * The OpsProvider reads `?property=<uuid>` from the URL — this scope sets a
 * sane default when nothing is selected.
 */
export function AdminOpsScope({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <OpsProvider>
      <ScopeBody title={title} description={description}>
        {children}
      </ScopeBody>
    </OpsProvider>
  );
}

function ScopeBody({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const { togglePalette } = useOps();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        togglePalette();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [togglePalette]);

  return (
    <>
      <div style={{ padding: 'clamp(20px, 4vw, 32px) clamp(20px, 4vw, 32px) 80px' }}>
        <PropertyHeader title={title} description={description} />
        <div style={{ marginTop: 24 }}>{children}</div>
      </div>
      <BookingDetailDrawer />
      <UnitDetailDrawer />
      <NewBookingModal />
      <CommandPalette />
    </>
  );
}

function PropertyHeader({ title, description }: { title: string; description?: string }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { properties } = useAdmin();
  useLucide();

  const selected = searchParams.get('property') ?? '';
  const activeProperties = useMemo(
    () => properties.filter((p) => p.property.active).map((p) => p.property),
    [properties],
  );

  // Default the dropdown to the first active property if nothing in URL.
  useEffect(() => {
    if (!selected && activeProperties.length > 0) {
      const next = new URLSearchParams(searchParams);
      next.set('property', activeProperties[0]!.id);
      setSearchParams(next, { replace: true });
    }
  }, [selected, activeProperties, searchParams, setSearchParams]);

  function onChange(id: string) {
    const next = new URLSearchParams(searchParams);
    if (id) next.set('property', id);
    else next.delete('property');
    setSearchParams(next);
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 16,
        flexWrap: 'wrap',
        marginBottom: 8,
      }}
    >
      <div>
        <OpsEyebrow>AP Enterprises · Platform</OpsEyebrow>
        <h1
          style={{
            fontFamily: 'Fraunces, serif',
            fontWeight: 300,
            fontSize: 'clamp(28px, 4vw, 38px)',
            letterSpacing: '-0.02em',
            margin: '6px 0 0',
            color: '#1A1A1A',
          }}
        >
          {title}
        </h1>
        {description && (
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
            {description}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 10,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--color-mist)',
          }}
        >
          Property
        </span>
        <div style={{ position: 'relative' }}>
          <select
            value={selected}
            onChange={(e) => onChange(e.target.value)}
            style={{
              appearance: 'none',
              WebkitAppearance: 'none',
              fontFamily: 'Fraunces, serif',
              fontSize: 16,
              color: 'var(--color-charcoal)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--color-taupe)',
              borderRadius: 4,
              padding: '8px 30px 8px 12px',
              minWidth: 240,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {activeProperties.length === 0 && <option value="">No properties</option>}
            {activeProperties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              right: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              color: 'var(--color-mist)',
              display: 'inline-flex',
            }}
          >
            <OpsIcon name="chevron-down" size={14} />
          </span>
        </div>
      </div>
    </div>
  );
}
