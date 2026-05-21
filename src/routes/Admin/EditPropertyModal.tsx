import { useEffect, useState } from 'react';
import { Field, Modal, useToast } from '../../components';
import { OpsButton } from '../Ops/OpsPrimitives';
import { slugExists, updateProperty } from '../../lib/api/properties';
import type { PropertyRow } from '../../lib/types/db';
import { useAdmin } from './context';

export interface EditPropertyModalProps {
  open: boolean;
  property: PropertyRow | null;
  onClose: () => void;
}

export function EditPropertyModal({ open, property, onClose }: EditPropertyModalProps) {
  const toast = useToast();
  const { refresh } = useAdmin();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [unitCount, setUnitCount] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !property) return;
    setName(property.name);
    setSlug(property.slug);
    setCity(property.city);
    setAddress(property.address ?? '');
    setUnitCount(String(property.unit_count));
    setError(null);
  }, [open, property]);

  async function save() {
    if (!property) return;
    if (!name.trim()) return setError('Name is required.');
    if (!slug.trim()) return setError('Slug is required.');
    if (!city.trim()) return setError('City is required.');

    if (slug !== property.slug) {
      const exists = await slugExists(slug.trim(), property.id);
      if (exists) return setError('A different property already uses that slug.');
    }

    setError(null);
    setSaving(true);
    try {
      await updateProperty(property.id, {
        name: name.trim(),
        slug: slug.trim(),
        city: city.trim(),
        address: address.trim() || null,
        unit_count: unitCount ? parseInt(unitCount, 10) || 0 : 0,
      });
      await refresh();
      toast.success(`${name} updated.`);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow="Platform"
      title={property ? `Edit ${property.name}` : 'Edit property'}
      width={560}
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
          label="Property name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Field
            label="Slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
          />
          <Field
            label="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
          />
        </div>
        <Field
          label="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="optional"
        />
        <Field
          label="Total units"
          value={unitCount}
          onChange={(e) => setUnitCount(e.target.value.replace(/\D/g, ''))}
          placeholder="e.g. 240"
        />
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
