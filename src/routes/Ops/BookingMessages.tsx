import { useCallback, useEffect, useState } from 'react';
import { useToast } from '../../components';
import { useAuth } from '../../lib/auth';
import {
  listMessagesForBooking,
  sendMessage,
  subscribeToBookingMessages,
} from '../../lib/api/messages';
import type { AttendantMessageRow } from '../../lib/types/db';
import { OpsButton, OpsEyebrow } from './OpsPrimitives';

interface Props {
  bookingId: string;
  attendantName: string;
}

export function BookingMessages({ bookingId, attendantName }: Props) {
  const { profile } = useAuth();
  const toast = useToast();
  const [messages, setMessages] = useState<AttendantMessageRow[]>([]);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      const rows = await listMessagesForBooking(bookingId);
      setMessages(rows);
    } catch (err) {
      console.error('[messages] load failed', err);
    }
  }, [bookingId]);

  useEffect(() => {
    load();
    const unsub = subscribeToBookingMessages(bookingId, () => load());
    return unsub;
  }, [bookingId, load]);

  async function onSend() {
    if (!body.trim() || sending) return;
    setSending(true);
    try {
      await sendMessage(bookingId, body.trim());
      setBody('');
      toast.success(`Note logged for ${attendantName}.`);
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not send.';
      toast.error(message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ marginTop: 22 }}>
      <OpsEyebrow>Messages · {attendantName}</OpsEyebrow>

      {messages.length === 0 && (
        <p
          style={{
            margin: '8px 0 0',
            fontFamily: 'var(--font-sans)',
            fontSize: 12,
            color: 'var(--color-mist-soft)',
          }}
        >
          No notes yet. Use the field below to log an instruction or update.
        </p>
      )}

      {messages.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
          {messages.map((m) => (
            <div
              key={m.id}
              style={{
                padding: '10px 12px',
                background:
                  m.sender_id === profile?.id
                    ? 'var(--color-cream-deep)'
                    : 'var(--bg-surface)',
                border: '1px solid var(--color-taupe-soft)',
                borderRadius: 4,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 10,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--color-mist)',
                  marginBottom: 4,
                }}
              >
                <span>{m.sender_id === profile?.id ? 'You' : 'Other'}</span>
                <span>{new Date(m.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 13,
                  color: 'var(--color-charcoal)',
                  lineHeight: 1.55,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {m.body}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="e.g. Buzz at 2104; the doorman has the key."
          rows={2}
          maxLength={2000}
          style={{
            flex: 1,
            fontFamily: 'var(--font-sans)',
            fontSize: 13,
            color: 'var(--color-charcoal)',
            background: 'transparent',
            border: '1px solid var(--color-taupe)',
            borderRadius: 4,
            padding: '8px 10px',
            outline: 'none',
            resize: 'vertical',
            minHeight: 56,
          }}
        />
        <OpsButton
          variant="primary"
          icon="send"
          disabled={!body.trim() || sending}
          onClick={onSend}
        >
          {sending ? 'Sending' : 'Send'}
        </OpsButton>
      </div>
    </div>
  );
}
