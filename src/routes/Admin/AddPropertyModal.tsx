import { useEffect, useState } from 'react';
import { Field, Modal, useToast } from '../../components';
import { OpsButton, OpsEyebrow } from '../Ops/OpsPrimitives';
import { createProperty } from '../../lib/api/properties';
import { useAdmin } from './context';

export interface AddPropertyModalProps {
  open: boolean;
  onClose: () => void;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function AddPropertyModal({ open, onClose }: AddPropertyModalProps) {
  const toast = useToast();
  const { refresh } = useAdmin();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [unitCount, setUnitCount] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName('');
    setSlug('');
    setSlugTouched(false);
    setCity('');
    setAddress('');
    setUnitCount('');
    setError(null);
  }, [open]);

  // Auto-derive slug from name unless the user has touched it manually.
  useEffect(() => {
    if (!slugTouched) setSlug(slugify(name));
  }, [name, slugTouched]);

  async function save() {
    if (!name.trim()) return setError('Name is required.');
    if (!slug.trim()) return setError('Slug is required.');
    if (!city.trim()) return setError('City is required.');

    setError(null);
    setSaving(true);
    try {
      await createProperty({
        slug: slug.trim(),
        name: name.trim(),
        city: city.trim(),
        address: address.trim() || null,
        unit_count: unitCount ? parseInt(unitCount, 10) || 0 : 0,
      });
      await refresh();
      toast.success(`${name} added to the platform.`);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not create property.';
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow="Platform"
      title="Add a property"
      width={560}
      footer={
        <>
          <OpsButton variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </OpsButton>
          <OpsButton variant="primary" icon="plus" onClick={save} disabled={saving}>
            {saving ? 'Saving' : 'Add Property'}
          </OpsButton>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 13,
            color: 'var(--color-mist)',
            margin: 0,
            lineHeight: 1.65,
          }}
        >
          A new property is empty: zero units, zero managers. After creating it, assign a
          property manager and they can populate the directory from Operations.
        </p>

        <Field
          label="Property name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. One Beacon Tower"
          required
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Field
            label="Slug"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugTouched(true);
            }}
            placeholder="auto-generated"
            required
          />
          <Field
            label="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Boston"
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
          type="text"
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

        <div style={{ marginTop: 4 }}>
          <OpsEyebrow>Preview</OpsEyebrow>
          <div
            style={{
              marginTop: 8,
              padding: '10px 14px',
              background: 'var(--color-cream-deep)',
              border: '1px solid var(--color-taupe)',
              borderRadius: 6,
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
              color: 'var(--color-mist)',
            }}
          >
            <strong style={{ color: 'var(--color-charcoal)', fontFamily: 'var(--font-serif)' }}>
              {name || 'Property name'}
            </strong>{' '}
            · {city || 'City'} · /{slug || 'slug'}
          </div>
        </div>
      </div>
    </Modal>
  );
}
