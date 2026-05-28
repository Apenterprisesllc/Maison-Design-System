import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import {
  BrandMark,
  Button,
  Eyebrow,
  Hairline,
  Spinner,
  useLucide,
  useToast,
} from '../../components';
import { bookingIcsFilename, buildIcs, downloadIcs } from '../../utils/ics';
import { share } from '../../utils/share';
import { getGuestBookingById, getPropertyBySlug } from '../../lib/api/guestBookings';
import type { BookingRow } from '../../lib/types/db';
import type { Resident } from '../Portal/types';

function formatScheduled(iso: string): { dateLabel: string; timeLabel: string } {
  const d = new Date(iso);
  const dateLabel = d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const timeLabel = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  return { dateLabel, timeLabel };
}

interface Snapshot {
  full_name?: string;
  display_name?: string;
  unit?: { external_id?: string };
}

export function GuestConfirmation() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  useLucide();

  const [booking, setBooking] = useState<BookingRow | null>(null);
  const [propertyName, setPropertyName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkRef = useRef<SVGPathElement>(null);
  const circleRef = useRef<SVGCircleElement>(null);

  useGSAP(
    () => {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduceMotion || !circleRef.current || !checkRef.current) return;
      const tl = gsap.timeline({ delay: 0.15 });
      tl.fromTo(
        circleRef.current,
        { drawSVG: '0%' },
        { drawSVG: '100%', duration: 0.8, ease: 'expo.out' },
      ).fromTo(
        checkRef.current,
        { drawSVG: '0%' },
        { drawSVG: '100%', duration: 0.5, ease: 'power2.out' },
        '-=0.2',
      );
    },
    { dependencies: [bookingId] },
  );

  useEffect(() => {
    if (!bookingId) {
      navigate('/book', { replace: true });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const row = await getGuestBookingById(bookingId);
        if (cancelled) return;
        if (!row) {
          navigate('/book', { replace: true });
          return;
        }
        setBooking(row);
        // Best-effort property name (the row only has property_id).
        const { data: prop } = await import('../../lib/supabase').then(({ supabase }) =>
          supabase
            .from('properties')
            .select('slug, name')
            .eq('id', row.property_id)
            .maybeSingle(),
        );
        if (!cancelled && prop) {
          setPropertyName(prop.name);
          // Hydrate slug for share link
          if (prop.slug) {
            // no-op, slug accessed when needed
          }
        }
        // Verify the property is still reachable (active flag)
        if (!cancelled && prop?.slug) {
          await getPropertyBySlug(prop.slug);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load booking.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bookingId, navigate]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <Spinner />
      </div>
    );
  }
  if (error || !booking) {
    return (
      <main style={{ padding: 48, textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-status-danger)' }}>
          {error ?? 'Booking not found.'}
        </p>
      </main>
    );
  }

  const { dateLabel, timeLabel } = formatScheduled(booking.scheduled_at);
  const svc = (booking.service_snapshot ?? {}) as { name?: string; kicker?: string };
  const snap = (booking.resident_snapshot ?? {}) as Snapshot;
  const guestName = booking.guest_name ?? snap.full_name ?? 'Guest';
  const unitLabel = snap.unit?.external_id ?? '';
  const arrival = `Your attendant arrives ${dateLabel} at ${timeLabel}.`;
  const price = Math.round(booking.price_cents / 100);

  function onAddToCalendar() {
    if (!booking) return;
    const resident: Resident = {
      building: propertyName || 'Your community',
      residence: unitLabel || '—',
      name: guestName,
      track: 'residential',
    };
    const ics = buildIcs(
      {
        id: booking.reference,
        dateLabel,
        time: timeLabel,
        serviceName: svc.name ?? 'AP Enterprises Visit',
        attendant: 'AP Enterprises',
        note: booking.note ?? undefined,
        price,
      },
      resident,
    );
    downloadIcs(
      bookingIcsFilename({
        id: booking.reference,
        dateLabel,
        time: timeLabel,
        serviceName: svc.name ?? 'visit',
        attendant: 'AP Enterprises',
        note: booking.note ?? undefined,
        price,
      }),
      ics,
    );
    toast.success('Calendar event downloaded.');
  }

  async function onShare() {
    if (!booking) return;
    const url = `${window.location.origin}/book/confirm/${booking.id}`;
    const result = await share({
      title: `${svc.name ?? 'AP Enterprises'} · ${propertyName}`,
      text: arrival,
      url,
    });
    if (result.kind === 'copied') toast.success('Link copied to clipboard.');
    else if (result.kind === 'error') toast.error('Could not share. Try again.');
    else if (result.kind === 'unsupported') toast.info('Sharing is not supported on this browser.');
  }

  function onPrint() {
    window.print();
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '20px clamp(20px, 4vw, 56px)',
          borderBottom: '1px solid var(--color-taupe)',
        }}
      >
        <Link
          to="/"
          aria-label="AP Enterprises home"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            textDecoration: 'none',
            border: 0,
            color: 'var(--color-charcoal)',
          }}
        >
          <BrandMark size={40} />
        </Link>
      </header>

      <main
        data-print-receipt-root
        style={{
          maxWidth: 720,
          width: '100%',
          margin: '0 auto',
          padding: 'clamp(56px, 8vw, 88px) 24px 120px',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <svg
            width="64"
            height="64"
            viewBox="0 0 64 64"
            fill="none"
            aria-hidden="true"
            style={{ display: 'inline-block' }}
          >
            <circle
              ref={circleRef}
              cx="32"
              cy="32"
              r="29"
              stroke="var(--color-champagne)"
              strokeWidth="1.5"
            />
            <path
              ref={checkRef}
              d="M20 33 L29 42 L44 24"
              stroke="var(--color-champagne-deep)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
          <Eyebrow>Confirmed</Eyebrow>
        </div>
        <h1
          style={{
            textAlign: 'center',
            fontFamily: 'var(--font-serif)',
            fontWeight: 300,
            fontSize: 'clamp(28px, 4vw, 44px)',
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
            color: 'var(--color-charcoal)',
            margin: '10px auto 0',
            maxWidth: 600,
          }}
        >
          {arrival}
        </h1>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Hairline width={64} margin="20px 0 32px" />
        </div>

        <div
          data-print-receipt
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--color-taupe)',
            borderRadius: 8,
            boxShadow: 'var(--shadow-1)',
            padding: 'clamp(24px, 4vw, 40px)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <RowL label="Reference" value={booking.reference} />
            <RowL label="Service" value={svc.name ?? '—'} />
            <RowL label="Date" value={dateLabel} />
            <RowL label="Time" value={timeLabel} />
            <RowL label="Community" value={propertyName || '—'} />
            {unitLabel && <RowL label="Unit" value={unitLabel} />}
            <RowL label="Name" value={guestName} />
            {booking.guest_phone && <RowL label="Phone" value={booking.guest_phone} />}
            {booking.guest_address && <RowL label="Address" value={booking.guest_address} />}
            {booking.note && <RowL label="Note" value={booking.note} />}
          </div>
          <Hairline color="var(--color-taupe)" width="100%" margin="24px 0 20px" />
          <div
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}
          >
            <span
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 11,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: 'var(--color-mist)',
              }}
            >
              Charged after visit
            </span>
            <span
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 28,
                fontWeight: 300,
                color: 'var(--color-charcoal)',
              }}
            >
              ${price}
            </span>
          </div>
        </div>

        <p
          style={{
            textAlign: 'center',
            fontFamily: 'var(--font-sans)',
            fontSize: 13,
            color: 'var(--color-mist)',
            margin: '28px auto 0',
            maxWidth: 460,
            lineHeight: 1.65,
          }}
        >
          Save this page or screenshot the reference. We'll call the number on file before
          arrival to confirm access.
        </p>

        <div
          data-print-hide
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 12,
            marginTop: 32,
            flexWrap: 'wrap',
          }}
        >
          <Button variant="secondary" icon="calendar-plus" onClick={onAddToCalendar}>
            Add to Calendar
          </Button>
          <Button variant="secondary" icon="share-2" onClick={onShare}>
            Share
          </Button>
          <Button variant="secondary" icon="download" onClick={onPrint}>
            Save Receipt
          </Button>
        </div>

        <div
          data-print-hide
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: 24,
          }}
        >
          <Button variant="quiet" onClick={() => navigate('/book')}>
            Schedule another visit
          </Button>
        </div>
      </main>
    </div>
  );
}

function RowL({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '140px 1fr',
        gap: 16,
        alignItems: 'baseline',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 11,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--color-mist)',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 15,
          color: 'var(--color-charcoal)',
          wordBreak: 'break-word',
        }}
      >
        {value}
      </span>
    </div>
  );
}
