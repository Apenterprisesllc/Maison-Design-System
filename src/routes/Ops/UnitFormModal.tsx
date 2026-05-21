import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { Field, Modal, useToast } from '../../components';
import { useOps } from './context';
import { OpsButton, OpsEyebrow } from './OpsPrimitives';
import type { OpsUnit, UnitKind, UnitRole } from './data';
import { createUnit as apiCreateUnit, updateUnit as apiUpdateUnit, findUnitByExternalId } from '../../lib/api/units';
import { createResidentUser, generateTempPassword } from '../../lib/api/adminUsers';

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
  createAccess: boolean;
  tempPassword: string;
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
  createAccess: false,
  tempPassword: '',
};


export function UnitFormModal({ open, mode, unit, onClose }: UnitFormModalProps) {
  const { units, propertyId, refresh } = useOps();
  const toast = useToast();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [createdPassword, setCreatedPassword] = useState<{ email: string; password: string } | null>(null);

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
        createAccess: false,
        tempPassword: '',
      });
    } else {
      setForm({ ...EMPTY, tempPassword: generateTempPassword() });
    }
    setError(null);
    setCreatedPassword(null);
  }, [open, mode, unit]);

  const existingIds = useMemo(() => new Set(units.map((u) => u.id)), [units]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  async function handleSave() {
    const id = form.id.trim();
    const full = form.residentFull.trim();
    const floor = form.floor.trim();
    if (!id) return setError('Unit / property ID is required.');
    if (!full) return setError('Name is required.');
    if (!floor) return setError('Floor / location is required.');
    if (mode === 'create' && existingIds.has(id)) {
      return setError(`Unit "${id}" already exists.`);
    }
    if (mode === 'create' && form.createAccess) {
      if (!form.email.trim()) return setError('Email is required to create access.');
      if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return setError('Use a valid email.');
      if (!form.tempPassword || form.tempPassword.length < 10) {
        return setError('Temporary password must be at least 10 characters.');
      }
    }
    if (!propertyId) {
      return setError('No property assigned to this manager.');
    }

    setError(null);
    setSaving(true);
    try {
      if (mode === 'create') {
        const newUnit = await apiCreateUnit({
          property_id: propertyId,
          external_id: id,
          floor,
          kind: form.kind,
          status: form.status,
          notes: form.notes.trim() || null,
        });

        if (form.createAccess && form.email.trim()) {
          try {
            await createResidentUser({
              property_id: propertyId,
              unit_id: newUnit.id,
              email: form.email.trim(),
              full_name: full,
              phone: form.phone.trim() || null,
              temp_password: form.tempPassword,
              role: form.role,
            });
            setCreatedPassword({ email: form.email.trim(), password: form.tempPassword });
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            toast.error(`Unit added but access could not be created: ${message}`);
          }
        }
        await refresh();
        toast.success(`Added ${full} · ${id}`);
        if (!form.createAccess) onClose();
      } else if (unit) {
        const target = await findUnitByExternalId(propertyId, unit.id);
        if (!target) {
          setSaving(false);
          return setError('Unit not found in database.');
        }
        await apiUpdateUnit(target.id, {
          floor,
          kind: form.kind,
          status: form.status,
          notes: form.notes.trim() || null,
        });
        await refresh();
        toast.success(`Saved ${full} · ${id}`);
        onClose();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not save. Try again.';
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  async function copyPassword() {
    if (!createdPassword) return;
    try {
      await navigator.clipboard.writeText(createdPassword.password);
      toast.success('Password copied to clipboard.');
    } catch {
      toast.info('Copy manually — clipboard access was blocked.');
    }
  }

  function dismissAndClose() {
    setCreatedPassword(null);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={createdPassword ? dismissAndClose : onClose}
      eyebrow={
        createdPassword
          ? 'Share these once'
          : mode === 'create'
            ? 'Add to Directory'
            : 'Edit Entry'
      }
      title={
        createdPassword
          ? 'Temporary password'
          : mode === 'create'
            ? 'New resident or commercial contact'
            : `Edit ${unit?.residentFull ?? ''}`
      }
      width={580}
      footer={
        createdPassword ? (
          <>
            <OpsButton variant="ghost" icon="copy" onClick={copyPassword}>
              Copy Password
            </OpsButton>
            <OpsButton variant="primary" icon="check" onClick={dismissAndClose}>
              Done
            </OpsButton>
          </>
        ) : (
          <>
            <OpsButton variant="ghost" onClick={onClose} disabled={saving}>
              Cancel
            </OpsButton>
            <OpsButton
              variant="primary"
              icon={mode === 'create' ? 'plus' : 'check'}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving' : mode === 'create' ? 'Add Entry' : 'Save Changes'}
            </OpsButton>
          </>
        )
      }
    >
      {createdPassword ? (
        <div>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 14,
              color: 'var(--color-mist)',
              lineHeight: 1.65,
              margin: '0 0 18px',
            }}
          >
            Share these credentials with the resident. They will be required to change the
            password on first sign in. This screen is the only time the password is shown.
          </p>
          <CredRow label="Email" value={createdPassword.email} />
          <CredRow label="Temporary password" value={createdPassword.password} mono />
        </div>
      ) : (
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
              placeholder={form.createAccess ? 'required for access' : 'optional'}
              required={form.createAccess}
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

          {mode === 'create' && (
            <div
              style={{
                border: '1px solid var(--color-taupe)',
                borderRadius: 6,
                padding: 14,
                background: 'var(--color-cream-deep)',
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={form.createAccess}
                  onChange={(e) => set('createAccess', e.target.checked)}
                  style={{
                    marginTop: 3,
                    width: 16,
                    height: 16,
                    accentColor: 'var(--color-ink)',
                    cursor: 'pointer',
                  }}
                />
                <span>
                  <span
                    style={{
                      display: 'block',
                      fontFamily: 'var(--font-serif)',
                      fontSize: 15,
                      color: 'var(--color-charcoal)',
                    }}
                  >
                    Create portal access for this resident
                  </span>
                  <span
                    style={{
                      display: 'block',
                      fontFamily: 'var(--font-sans)',
                      fontSize: 12,
                      color: 'var(--color-mist)',
                      marginTop: 4,
                      lineHeight: 1.5,
                    }}
                  >
                    Generates a temporary password the resident must change on first sign in.
                  </span>
                </span>
              </label>

              {form.createAccess && (
                <div style={{ marginTop: 14 }}>
                  <OpsEyebrow>Temporary password</OpsEyebrow>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <input
                      value={form.tempPassword}
                      onChange={(e) => set('tempPassword', e.target.value)}
                      style={{
                        flex: 1,
                        fontFamily: 'var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)',
                        fontSize: 14,
                        color: 'var(--color-charcoal)',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--color-taupe)',
                        borderRadius: 4,
                        padding: '8px 10px',
                        outline: 'none',
                        letterSpacing: '0.04em',
                      }}
                    />
                    <OpsButton
                      variant="ghost"
                      icon="refresh-cw"
                      onClick={() => set('tempPassword', generateTempPassword())}
                    >
                      Regenerate
                    </OpsButton>
                  </div>
                </div>
              )}
            </div>
          )}

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
      )}
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
        transition:
          'background-color var(--dur-state) var(--ease-out), border-color var(--dur-state) var(--ease-out)',
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

function CredRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '160px 1fr',
        gap: 16,
        alignItems: 'baseline',
        padding: '12px 0',
        borderBottom: '1px solid var(--color-taupe-soft)',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 10,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--color-mist)',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: mono
            ? 'var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)'
            : 'var(--font-serif)',
          fontSize: 16,
          color: 'var(--color-charcoal)',
          letterSpacing: mono ? '0.04em' : 'normal',
          wordBreak: 'break-all',
        }}
      >
        {value}
      </span>
    </div>
  );
}
