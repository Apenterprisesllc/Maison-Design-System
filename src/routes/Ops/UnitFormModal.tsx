import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { Field, Modal, useToast } from '../../components';
import { useOps } from './context';
import { OpsButton, OpsEyebrow } from './OpsPrimitives';
import type { OpsUnit, UnitKind, UnitRole } from './data';

export interface UnitFormModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  unit?: OpsUnit | null;
  onClose: () => void;
}

interface FormState {
  id: string;
  floor: string;
  residentFull: string;
  email: string;
  phone: string;
  kind: UnitKind;
  role: UnitRole;
  status: 'active' | 'paused';
  notes: string;
}

const EMPTY: FormState = {
  id: '',
  floor: '',
  residentFull: '',
  email: '',
  phone: '',
  kind: 'residential',
  role: 'owner',
  status: 'active',
  notes: '',
};

function makeSurname(full: string): string {
  const trimmed = full.trim();
  if (!trimmed) return '';
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0]!;
  const last = parts[parts.length - 1]!;
  const initial = parts[0]!.charAt(0).toUpperCase();
  return `${last}, ${initial}.`;
}

export function UnitFormModal({ open, mode, unit, onClose }: UnitFormModalProps) {
  const { createUnit, updateUnit, units } = useOps();
  const toast = useToast();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && unit) {
      setForm({
        id: unit.id,
        floor: unit.floor,
        residentFull: unit.residentFull,
        email: unit.email ?? '',
        phone: unit.phone ?? '',
        kind: unit.kind,
        role: unit.role ?? (unit.kind === 'commercial' ? 'manager' : 'owner'),
        status: unit.status,
        notes: unit.notes ?? '',
      });
    } else {
      setForm(EMPTY);
    }
    setError(null);
  }, [open, mode, unit]);

  const existingIds = useMemo(() => new Set(units.map((u) => u.id)), [units]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    const id = form.id.trim();
    const full = form.residentFull.trim();
    const floor = form.floor.trim();
    if (!id) return setError('Unit / property ID is required.');
    if (!full) return setError('Name is required.');
    if (!floor) return setError('Floor / location is required.');
    if (mode === 'create' && existingIds.has(id)) {
      return setError(`Unit "${id}" already exists.`);
    }

    const payload = {
      id,
      floor,
      resident: makeSurname(full),
      residentFull: full,
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      kind: form.kind,
      role: form.role,
      status: form.status,
      notes: form.notes.trim() || undefined,
    };

    if (mode === 'create') {
      createUnit(payload);
      toast.success(`Added ${full} · ${id}`);
    } else if (unit) {
      updateUnit(unit.id, payload);
      toast.success(`Saved ${full} · ${id}`);
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow={mode === 'create' ? 'Add to Directory' : 'Edit Entry'}
      title={
        mode === 'create'
          ? 'New resident or commercial contact'
          : `Edit ${unit?.residentFull ?? ''}`
      }
      width={580}
      footer={
        <>
          <OpsButton variant="ghost" onClick={onClose}>
            Cancel
          </OpsButton>
          <OpsButton variant="primary" icon={mode === 'create' ? 'plus' : 'check'} onClick={handleSave}>
            {mode === 'create' ? 'Add Entry' : 'Save Changes'}
          </OpsButton>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <OpsEyebrow>Track</OpsEyebrow>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <KindButton
              active={form.kind === 'residential'}
              label="Residencial"
              hint="Resident, condo, home"
              onClick={() => set('kind', 'residential')}
            />
            <KindButton
              active={form.kind === 'commercial'}
              label="Comercial"
              hint="Office, hotel, restaurant"
              onClick={() => set('kind', 'commercial')}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Field
            label={form.kind === 'residential' ? 'Unit ID' : 'Property ID'}
            value={form.id}
            onChange={(e) => set('id', e.target.value)}
            placeholder={form.kind === 'residential' ? 'e.g. 1402' : 'e.g. C-03'}
            required
          />
          <Field
            label={form.kind === 'residential' ? 'Floor' : 'Location'}
            value={form.floor}
            onChange={(e) => set('floor', e.target.value)}
            placeholder={form.kind === 'residential' ? 'e.g. 14' : 'e.g. Lobby'}
            required
          />
        </div>

        <Field
          label={form.kind === 'residential' ? 'Resident name' : 'Contact / Business name'}
          value={form.residentFull}
          onChange={(e) => set('residentFull', e.target.value)}
          placeholder={form.kind === 'residential' ? 'e.g. Eleanor Ashcombe' : 'e.g. Arden Café & Bar'}
          required
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Field
            label="Email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            type="email"
            placeholder="optional"
          />
          <Field
            label="Phone"
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
            type="tel"
            placeholder="optional"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <SelectField
            label="Role"
            value={form.role}
            onChange={(v) => set('role', v as UnitRole)}
            options={
              form.kind === 'residential'
                ? [
                    { value: 'owner', label: 'Owner' },
                    { value: 'tenant', label: 'Tenant' },
                  ]
                : [
                    { value: 'manager', label: 'Manager' },
                    { value: 'contact', label: 'Contact' },
                  ]
            }
          />
          <SelectField
            label="Status"
            value={form.status}
            onChange={(v) => set('status', v as 'active' | 'paused')}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'paused', label: 'Paused' },
            ]}
          />
        </div>

        <div>
          <OpsEyebrow>Notes</OpsEyebrow>
          <textarea
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Access instructions, allergies, gate codes, attendant preferences…"
            rows={3}
            style={textareaStyle}
          />
        </div>

        {error && (
          <div
            role="alert"
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
              color: 'var(--color-status-danger)',
              padding: '8px 12px',
              background: 'rgba(122,46,46,0.06)',
              border: '1px solid rgba(122,46,46,0.25)',
              borderRadius: 4,
            }}
          >
            {error}
          </div>
        )}
      </div>
    </Modal>
  );
}

const textareaStyle: CSSProperties = {
  marginTop: 8,
  width: '100%',
  fontFamily: 'var(--font-sans)',
  fontSize: 14,
  color: 'var(--color-charcoal)',
  background: 'transparent',
  border: '1px solid var(--color-taupe)',
  borderRadius: 4,
  padding: '10px 12px',
  resize: 'vertical',
  outline: 'none',
  lineHeight: 1.55,
};

function KindButton({
  active,
  label,
  hint,
  onClick,
}: {
  active: boolean;
  label: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        cursor: 'pointer',
        textAlign: 'left',
        padding: '12px 14px',
        background: active ? 'var(--color-cream-deep)' : 'var(--bg-surface)',
        border: '1px solid ' + (active ? 'var(--color-champagne)' : 'var(--color-taupe)'),
        borderRadius: 4,
        transition: 'background-color var(--dur-state) var(--ease-out), border-color var(--dur-state) var(--ease-out)',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 16,
          color: 'var(--color-charcoal)',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 11,
          color: 'var(--color-mist)',
          marginTop: 2,
        }}
      >
        {hint}
      </div>
    </button>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <OpsEyebrow>{label}</OpsEyebrow>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 14,
          color: 'var(--color-charcoal)',
          background: 'transparent',
          border: 0,
          borderBottom: '1px solid var(--color-taupe)',
          padding: '10px 0',
          outline: 'none',
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
