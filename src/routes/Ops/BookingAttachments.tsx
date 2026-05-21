import { useCallback, useEffect, useState } from 'react';
import { useToast } from '../../components';
import { useAuth } from '../../lib/auth';
import {
  listAttachmentsForBooking,
  signedUrlFor,
  uploadAttachment,
} from '../../lib/api/attachments';
import type { AttachmentKind, BookingAttachmentRow } from '../../lib/types/db';
import { OpsButton, OpsEyebrow } from './OpsPrimitives';

export interface BookingAttachmentsProps {
  bookingId: string;
  canUpload: boolean;
}

interface Item {
  row: BookingAttachmentRow;
  signedUrl?: string;
}

const KIND_LABEL: Record<AttachmentKind, string> = {
  before: 'Before',
  after: 'After',
  incident: 'Incident',
  invoice: 'Invoice',
  other: 'Other',
};

export function BookingAttachments({ bookingId, canUpload }: BookingAttachmentsProps) {
  const { user } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await listAttachmentsForBooking(bookingId);
      const withUrls = await Promise.all(
        rows.map(async (row) => ({
          row,
          signedUrl: await signedUrlFor(row.storage_path, 3600).catch(() => undefined),
        })),
      );
      setItems(withUrls);
    } catch (err) {
      console.error('[attachments] load failed', err);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    if (bookingId) refresh();
  }, [bookingId, refresh]);

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>, kind: AttachmentKind) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !user) return;
    setUploading(true);
    try {
      await uploadAttachment({ bookingId, file, kind, uploadedBy: user.id });
      toast.success(`${KIND_LABEL[kind]} photo uploaded.`);
      await refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed.';
      toast.error(message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ marginTop: 22 }}>
      <OpsEyebrow>Attachments</OpsEyebrow>

      {items.length === 0 && !loading && (
        <p
          style={{
            margin: '8px 0 0',
            fontFamily: 'var(--font-sans)',
            fontSize: 12,
            color: 'var(--color-mist-soft)',
          }}
        >
          No photos yet.
        </p>
      )}

      {items.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 10,
            marginTop: 12,
          }}
        >
          {items.map((it) => (
            <a
              key={it.row.id}
              href={it.signedUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                position: 'relative',
                display: 'block',
                border: '1px solid var(--color-taupe)',
                borderRadius: 4,
                overflow: 'hidden',
                aspectRatio: '4 / 3',
                background: 'var(--color-cream-deep)',
                textDecoration: 'none',
              }}
            >
              {it.signedUrl && (
                <img
                  src={it.signedUrl}
                  alt={it.row.caption ?? KIND_LABEL[it.row.kind]}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              )}
              <span
                style={{
                  position: 'absolute',
                  top: 6,
                  left: 6,
                  fontFamily: 'var(--font-sans)',
                  fontSize: 10,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--color-cream)',
                  background: 'rgba(10,10,10,0.55)',
                  padding: '3px 8px',
                  borderRadius: 2,
                }}
              >
                {KIND_LABEL[it.row.kind]}
              </span>
            </a>
          ))}
        </div>
      )}

      {canUpload && (
        <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          <UploadButton label="Add Before" kind="before" onPick={onPickFile} disabled={uploading} />
          <UploadButton label="Add After" kind="after" onPick={onPickFile} disabled={uploading} />
        </div>
      )}
    </div>
  );
}

function UploadButton({
  label,
  kind,
  onPick,
  disabled,
}: {
  label: string;
  kind: AttachmentKind;
  onPick: (e: React.ChangeEvent<HTMLInputElement>, kind: AttachmentKind) => void;
  disabled: boolean;
}) {
  const id = `attach-${kind}`;
  return (
    <>
      <input
        id={id}
        type="file"
        accept="image/*"
        onChange={(e) => onPick(e, kind)}
        style={{ display: 'none' }}
      />
      <label htmlFor={id} style={{ display: 'inline-flex' }}>
        <OpsButton
          variant="ghost"
          icon="image-plus"
          disabled={disabled}
          onClick={(e?: React.MouseEvent) => {
            (e as React.MouseEvent | undefined)?.preventDefault();
            document.getElementById(id)?.click();
          }}
        >
          {label}
        </OpsButton>
      </label>
    </>
  );
}
