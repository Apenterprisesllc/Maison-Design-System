import { useEffect, useState } from 'react';
import { Field, Modal, useToast } from '../../components';
import { OpsButton, OpsEyebrow } from '../Ops/OpsPrimitives';
import { updateStaffUser } from '../../lib/api/adminUsers';
import type { ProfileRow } from '../../lib/types/db';
import { useAdmin } from './context';

export interface EditManagerModalProps {
  open: boolean;
  manager: ProfileRow | null;
  onClose: () => void;
}

export function EditManagerModal({ open, manager, onClose }: EditManagerModalProps) {
  const toast = useToast();
  const { properties, refresh } = useAdmin();
  const [fullName, setFullName] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !manager) return;
    setFullName(manager.full_name);
    setPropertyId(manager.primary_property_id ?? '');
    setPhone(manager.phone ?? '');
    setError(null);
  }, [open, manager]);

  async function save() {
    if (!manager) return;
    if (!fullName.trim()) return setError('Full name is required.');
    if (!propertyId) return setError('Pick a property.');
    setError(null);
    setSaving(true);
    try {
      await updateStaffUser({
        user_id: manager.id,
        full_name: fullName.trim(),
        property_id: propertyId,
        phone: phone.trim() || null,
      });
      await refresh();
      toast.success(`${fullName} updated.`);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow="Platform"
      title={manager ? `Edit ${manager.full_name}` : 'Edit manager'}
      width={540}
      footer={
        <>
          <OpsButton variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </OpsButton>
          <OpsButton variant="primary" icon="check" onClick={save} disabled={saving}>
            {saving ? 'Saving' : 'Save Changes'}
          </OpsButton>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <Field
          label="Full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
        <Field
          label="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="optional"
        />
        <div>
          <OpsEyebrow>Assigned property</OpsEyebrow>
          <select
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            style={{
              marginTop: 8,
              width: '100%',
              padding: '10px 12px',
              fontFamily: 'var(--font-sans)',
              fontSize: 14,
              border: '1px solid var(--color-taupe)',
              borderRadius: 4,
              background: 'transparent',
              color: 'var(--color-charcoal)',
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
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 12,
            color: 'var(--color-mist-soft)',
            margin: 0,
            lineHeight: 1.55,
          }}
        >
          Email is the user's identity — change it from the Supabase Authentication
          dashboard if needed.
        </p>
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
