import { useEffect, useId, useState } from 'react';
import { Field, Modal, useToast } from '../../components';
import { OpsButton, OpsEyebrow } from '../Ops/OpsPrimitives';
import { createStaffUser, generateTempPassword } from '../../lib/api/adminUsers';
import { useAdmin } from './context';

export interface AddManagerModalProps {
  open: boolean;
  onClose: () => void;
  prefillPropertyId?: string | null;
}

export function AddManagerModal({ open, onClose, prefillPropertyId }: AddManagerModalProps) {
  const toast = useToast();
  const { properties, refresh } = useAdmin();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);
  const propertySelectId = useId();
  const tempPasswordId = useId();

  useEffect(() => {
    if (!open) return;
    setEmail('');
    setFullName('');
    setPropertyId(prefillPropertyId ?? '');
    setTempPassword(generateTempPassword());
    setError(null);
    setCredentials(null);
  }, [open, prefillPropertyId]);

  async function save() {
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      return setError('Use a valid email.');
    }
    if (!fullName.trim()) return setError('Full name is required.');
    if (!propertyId) return setError('Pick a property.');
    if (!tempPassword || tempPassword.length < 10) {
      return setError('Temporary password must be at least 10 characters.');
    }
    setError(null);
    setSaving(true);
    try {
      const result = await createStaffUser({
        email: email.trim(),
        full_name: fullName.trim(),
        temp_password: tempPassword,
        role: 'property_manager',
        property_id: propertyId,
      });
      if (result.already_existed) {
        toast.info(`User existed already — kept their password and updated property.`);
        await refresh();
        onClose();
      } else {
        setCredentials({ email: email.trim(), password: tempPassword });
        toast.success('Manager created.');
        await refresh();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not create manager.';
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  async function copyPassword() {
    if (!credentials) return;
    try {
      await navigator.clipboard.writeText(credentials.password);
      toast.success('Password copied.');
    } catch {
      toast.info('Copy manually — clipboard access was blocked.');
    }
  }

  function dismiss() {
    setCredentials(null);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={credentials ? dismiss : onClose}
      eyebrow={credentials ? 'Share once' : 'Platform'}
      title={credentials ? 'Temporary password' : 'Add a property manager'}
      width={560}
      footer={
        credentials ? (
          <>
            <OpsButton variant="ghost" icon="copy" onClick={copyPassword}>
              Copy Password
            </OpsButton>
            <OpsButton variant="primary" icon="check" onClick={dismiss}>
              Done
            </OpsButton>
          </>
        ) : (
          <>
            <OpsButton variant="ghost" onClick={onClose} disabled={saving}>
              Cancel
            </OpsButton>
            <OpsButton variant="primary" icon="user-plus" onClick={save} disabled={saving}>
              {saving ? 'Creating' : 'Create Manager'}
            </OpsButton>
          </>
        )
      }
    >
      {credentials ? (
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
            Share these credentials with the property manager. They will be required to set a
            new password on first sign in. This screen is the only time the password is shown.
          </p>
          <CredRow label="Email" value={credentials.email} />
          <CredRow label="Temporary password" value={credentials.password} mono />
          <CredRow label="Sign in URL" value={`${window.location.origin}/sign-in/manager`} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Field
            label="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Jane Doe"
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="manager@thearden.com"
              required
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label htmlFor={propertySelectId}>
                <OpsEyebrow>Assign to property</OpsEyebrow>
              </label>
              <select
                id={propertySelectId}
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
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
                <option value="">Pick a property…</option>
                {properties.map((p) => (
                  <option key={p.property.id} value={p.property.id}>
                    {p.property.name} · {p.property.city}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor={tempPasswordId}>
              <OpsEyebrow>Temporary password</OpsEyebrow>
            </label>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input
                id={tempPasswordId}
                value={tempPassword}
                onChange={(e) => setTempPassword(e.target.value)}
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
                onClick={() => setTempPassword(generateTempPassword())}
              >
                Regenerate
              </OpsButton>
            </div>
            <p
              style={{
                marginTop: 8,
                fontFamily: 'var(--font-sans)',
                fontSize: 12,
                color: 'var(--color-mist-soft)',
                lineHeight: 1.5,
              }}
            >
              Shown once after creation. The manager is forced to change it on first sign in.
            </p>
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
