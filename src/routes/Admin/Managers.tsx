import { useEffect, useMemo, useState } from 'react';
import { useToast } from '../../components';
import { supabase } from '../../lib/supabase';
import { deleteStaffUser, resetStaffPassword } from '../../lib/api/adminUsers';
import type { ProfileRow } from '../../lib/types/db';
import { OpsButton, OpsCard, OpsEyebrow, OpsHairline, OpsPill } from '../Ops/OpsPrimitives';
import { Modal } from '../../components';
import { EditManagerModal } from './EditManagerModal';
import { useAdmin } from './context';

interface ManagerWithProperty {
  profile: ProfileRow;
  propertyName: string;
}

export function Managers() {
  const toast = useToast();
  const { properties, refresh } = useAdmin();
  const [managers, setManagers] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState<ProfileRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProfileRow | null>(null);
  const [resetTarget, setResetTarget] = useState<ProfileRow | null>(null);
  const [resetResult, setResetResult] = useState<{ email: string; password: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'property_manager')
      .order('full_name');
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    setManagers(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const rows: ManagerWithProperty[] = useMemo(() => {
    const map = new Map(properties.map((p) => [p.property.id, p.property.name] as const));
    return managers.map((m) => ({
      profile: m,
      propertyName: m.primary_property_id ? map.get(m.primary_property_id) ?? '—' : '—',
    }));
  }, [managers, properties]);

  async function onResetConfirm() {
    if (!resetTarget) return;
    setBusy(true);
    try {
      const { temp_password } = await resetStaffPassword(resetTarget.id);
      setResetResult({ email: resetTarget.email, password: temp_password });
      setResetTarget(null);
      toast.success('Password reset.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not reset.');
    } finally {
      setBusy(false);
    }
  }

  async function onDeleteConfirm() {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await deleteStaffUser(deleteTarget.id);
      toast.success(`${deleteTarget.full_name} deleted.`);
      setDeleteTarget(null);
      await load();
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete.');
    } finally {
      setBusy(false);
    }
  }

  async function copyPassword() {
    if (!resetResult) return;
    try {
      await navigator.clipboard.writeText(resetResult.password);
      toast.success('Password copied.');
    } catch {
      toast.info('Copy manually.');
    }
  }

  return (
    <div style={{ padding: 'clamp(24px, 4vw, 40px) clamp(20px, 4vw, 40px) 80px', maxWidth: 1320, margin: '0 auto' }}>
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
        Property Managers
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
        Manage stewardship for each property. Reassign, reset temporary passwords, or remove access.
      </p>
      <OpsHairline width={48} margin="20px 0 28px" />

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
            All managers
          </h2>
          <span
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 11,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--color-mist)',
            }}
          >
            {rows.length} stewards
          </span>
        </div>

        <table
          style={{
            width: '100%',
            minWidth: 720,
            borderCollapse: 'collapse',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          <thead>
            <tr style={{ background: 'var(--color-cream-deep)' }}>
              {['Name', 'Email', 'Property', 'Status', ''].map((h) => (
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
            {!loading && rows.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  style={{
                    padding: '48px 24px',
                    textAlign: 'center',
                    color: 'var(--color-mist)',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  No managers yet. Add one from the Overview page.
                </td>
              </tr>
            )}
            {rows.map((r, i) => (
              <tr
                key={r.profile.id}
                style={{
                  borderTop: i === 0 ? 0 : '1px solid var(--color-taupe-soft)',
                  background: i % 2 === 1 ? 'rgba(241,236,224,0.35)' : 'transparent',
                }}
              >
                <td
                  style={{
                    padding: '12px 16px',
                    fontFamily: 'Fraunces, serif',
                    fontSize: 15,
                    color: '#1A1A1A',
                  }}
                >
                  {r.profile.full_name}
                </td>
                <td
                  style={{
                    padding: '12px 16px',
                    fontSize: 12,
                    color: '#4A4A4A',
                  }}
                >
                  {r.profile.email}
                </td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: '#1A1A1A' }}>
                  {r.propertyName}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  {r.profile.must_change_password ? (
                    <OpsPill tone="warning">Pending first login</OpsPill>
                  ) : (
                    <OpsPill tone="success">Active</OpsPill>
                  )}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <OpsButton
                    variant="ghost"
                    icon="pencil"
                    onClick={() => setEditTarget(r.profile)}
                  >
                    Edit
                  </OpsButton>
                  <span style={{ display: 'inline-block', width: 6 }} />
                  <OpsButton
                    variant="ghost"
                    icon="key-round"
                    onClick={() => setResetTarget(r.profile)}
                  >
                    Reset
                  </OpsButton>
                  <span style={{ display: 'inline-block', width: 6 }} />
                  <OpsButton
                    variant="ghost"
                    icon="trash-2"
                    onClick={() => setDeleteTarget(r.profile)}
                  >
                    Delete
                  </OpsButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </OpsCard>

      <EditManagerModal
        open={!!editTarget}
        manager={editTarget}
        onClose={() => {
          setEditTarget(null);
          load();
        }}
      />

      <Modal
        open={!!resetTarget}
        onClose={() => setResetTarget(null)}
        eyebrow="Confirm"
        title={resetTarget ? `Reset password for ${resetTarget.full_name}?` : 'Reset password'}
        width={460}
        footer={
          <>
            <OpsButton variant="ghost" onClick={() => setResetTarget(null)} disabled={busy}>
              Cancel
            </OpsButton>
            <OpsButton variant="primary" icon="key-round" onClick={onResetConfirm} disabled={busy}>
              {busy ? 'Resetting' : 'Reset Password'}
            </OpsButton>
          </>
        }
      >
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 14,
            color: 'var(--color-mist)',
            lineHeight: 1.65,
            margin: 0,
          }}
        >
          A new temporary password will be generated. The manager will be required to change it on next
          sign in.
        </p>
      </Modal>

      <Modal
        open={!!resetResult}
        onClose={() => setResetResult(null)}
        eyebrow="Share once"
        title="Temporary password"
        width={500}
        footer={
          <>
            <OpsButton variant="ghost" icon="copy" onClick={copyPassword}>
              Copy Password
            </OpsButton>
            <OpsButton variant="primary" icon="check" onClick={() => setResetResult(null)}>
              Done
            </OpsButton>
          </>
        }
      >
        {resetResult && (
          <div>
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 14,
                color: 'var(--color-mist)',
                lineHeight: 1.65,
                margin: '0 0 16px',
              }}
            >
              Share these credentials privately. This is the only time the password is shown.
            </p>
            <CredRow label="Email" value={resetResult.email} />
            <CredRow label="Temporary password" value={resetResult.password} mono />
          </div>
        )}
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        eyebrow="Destructive"
        title={deleteTarget ? `Delete ${deleteTarget.full_name}?` : 'Delete manager'}
        width={460}
        footer={
          <>
            <OpsButton variant="ghost" onClick={() => setDeleteTarget(null)} disabled={busy}>
              Cancel
            </OpsButton>
            <OpsButton variant="primary" icon="trash-2" onClick={onDeleteConfirm} disabled={busy}>
              {busy ? 'Deleting' : 'Delete Manager'}
            </OpsButton>
          </>
        }
      >
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 14,
            color: 'var(--color-mist)',
            lineHeight: 1.65,
            margin: 0,
          }}
        >
          The user account is removed from Supabase Auth. Their bookings and audit history stay intact
          but the user can no longer sign in.
        </p>
      </Modal>
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
