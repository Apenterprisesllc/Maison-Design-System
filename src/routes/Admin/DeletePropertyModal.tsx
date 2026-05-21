import { useEffect, useState } from 'react';
import { Modal, useToast } from '../../components';
import { OpsButton } from '../Ops/OpsPrimitives';
import { deleteProperty, describePropertyDependencies } from '../../lib/api/properties';
import type { PropertyRow } from '../../lib/types/db';
import { useAdmin } from './context';

export interface DeletePropertyModalProps {
  open: boolean;
  property: PropertyRow | null;
  onClose: () => void;
}

export function DeletePropertyModal({ open, property, onClose }: DeletePropertyModalProps) {
  const toast = useToast();
  const { refresh } = useAdmin();
  const [confirmText, setConfirmText] = useState('');
  const [deps, setDeps] = useState<{ units: number; bookings: number } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !property) return;
    setConfirmText('');
    setDeps(null);
    setError(null);
    describePropertyDependencies(property.id)
      .then(setDeps)
      .catch(() => setDeps({ units: 0, bookings: 0 }));
  }, [open, property]);

  async function confirm() {
    if (!property) return;
    if (confirmText.trim() !== property.name) {
      return setError(`Type the property name (${property.name}) to confirm.`);
    }
    setError(null);
    setDeleting(true);
    try {
      await deleteProperty(property.id);
      await refresh();
      toast.success(`${property.name} deleted.`);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow="Destructive"
      title={property ? `Delete ${property.name}?` : 'Delete property'}
      width={480}
      footer={
        <>
          <OpsButton variant="ghost" onClick={onClose} disabled={deleting}>
            Cancel
          </OpsButton>
          <OpsButton
            variant="primary"
            icon="trash-2"
            onClick={confirm}
            disabled={deleting || !property || confirmText.trim() !== (property?.name ?? '')}
          >
            {deleting ? 'Deleting' : 'Delete Property'}
          </OpsButton>
        </>
      }
    >
      {property && (
        <div>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 14,
              color: 'var(--color-mist)',
              lineHeight: 1.65,
              margin: '0 0 14px',
            }}
          >
            This will permanently remove the property record. Every unit and
            booking attached to it cascades and is also deleted.
          </p>
          {deps && (deps.units > 0 || deps.bookings > 0) && (
            <div
              style={{
                background: 'rgba(196,151,62,0.08)',
                border: '1px solid var(--color-champagne)',
                borderRadius: 4,
                padding: '12px 14px',
                marginBottom: 14,
                fontFamily: 'var(--font-sans)',
                fontSize: 13,
                color: 'var(--color-charcoal)',
              }}
            >
              <strong>Heads up:</strong> {deps.units} unit{deps.units === 1 ? '' : 's'} and{' '}
              {deps.bookings} active booking{deps.bookings === 1 ? '' : 's'} will be removed.
            </div>
          )}
          <label
            style={{
              display: 'block',
              fontFamily: 'var(--font-sans)',
              fontSize: 12,
              color: 'var(--color-mist)',
              marginBottom: 6,
            }}
          >
            Type <strong>{property.name}</strong> to confirm:
          </label>
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={property.name}
            style={{
              width: '100%',
              fontFamily: 'var(--font-sans)',
              fontSize: 14,
              padding: '10px 12px',
              border: '1px solid var(--color-taupe)',
              borderRadius: 4,
              outline: 'none',
              background: 'transparent',
              color: 'var(--color-charcoal)',
            }}
          />
          {error && (
            <div
              role="alert"
              style={{
                marginTop: 12,
                fontFamily: 'var(--font-sans)',
                fontSize: 13,
                color: 'var(--color-status-danger)',
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
