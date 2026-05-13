import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Button, Eyebrow, Hairline, useLucide, useToast } from '../../components';
import { bookingIcsFilename, buildIcs, downloadIcs } from '../../utils/ics';
import { share } from '../../utils/share';
import { usePortal } from './context';

export function Confirmation() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { getBookingById, resident } = usePortal();
  const bookingId = params.get('bookingId');
  const booking = bookingId ? getBookingById(bookingId) : undefined;
  useLucide();

  const checkRef = useRef<SVGPathElement>(null);
  const circleRef = useRef<SVGCircleElement>(null);

  // Always run hooks unconditionally — handle null booking inside
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
    if (!booking) {
      // Stale link / refresh — bounce to account
      const t = window.setTimeout(() => navigate('/portal/account', { replace: true }), 0);
      return () => window.clearTimeout(t);
    }
  }, [booking, navigate]);

  if (!booking) return null;

  const arrival = `${booking.attendant} arrives ${booking.dateLabel} at ${booking.time}.`;

  function onAddToCalendar() {
    if (!booking) return;
    const ics = buildIcs(
      {
        id: booking.id,
        dateLabel: booking.dateLabel,
        time: booking.time,
        serviceName: booking.serviceName,
        attendant: booking.attendant,
        note: booking.note,
        price: booking.price,
      },
      resident,
    );
    downloadIcs(
      bookingIcsFilename({
        id: booking.id,
        dateLabel: booking.dateLabel,
        time: booking.time,
        serviceName: booking.serviceName,
        attendant: booking.attendant,
        note: booking.note,
        price: booking.price,
      }),
      ics,
    );
    toast.success('Calendar event downloaded.');
  }

  async function onShare() {
    if (!booking) return;
    const result = await share({
      title: `${booking.serviceName} · Maison`,
      text: arrival,
      url: window.location.href,
    });
    if (result.kind === 'copied') toast.success('Link copied to clipboard.');
    else if (result.kind === 'error') toast.error('Could not share. Try again.');
    else if (result.kind === 'unsupported') toast.info('Sharing is not supported on this browser.');
  }

  function onPrint() {
    window.print();
  }

  return (
    <main
      data-print-receipt-root
      style={{
        maxWidth: 720,
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
          fontSize: 'clamp(32px, 4.5vw, 48px)',
          letterSpacing: '-0.02em',
          lineHeight: 1.12,
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
          <RowL label="Reference" value={booking.id.toUpperCase()} />
          <RowL label="Service" value={booking.serviceName} />
          <RowL label="Date" value={booking.dateLabel} />
          <RowL label="Time" value={booking.time} />
          <RowL label="Residence" value={`${resident.building} · ${resident.residence}`} />
          <RowL label="Attendant" value={booking.attendant} />
          {booking.note && <RowL label="Note" value={booking.note} />}
        </div>
        <Hairline color="var(--color-taupe)" width="100%" margin="24px 0 20px" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
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
              fontSize: 30,
              fontWeight: 300,
              color: 'var(--color-charcoal)',
            }}
          >
            ${booking.price}
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
        A confirmation has been sent to your account on file. The front desk has been notified to
        admit the attendant.
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
          gap: 16,
          marginTop: 24,
          flexWrap: 'wrap',
        }}
      >
        <Button variant="quiet" onClick={() => navigate('/portal/account')}>
          View Your Schedule
        </Button>
        <Button variant="quiet" onClick={() => navigate('/portal')}>
          Return to Catalogue
        </Button>
      </div>
    </main>
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
          fontSize: 16,
          color: 'var(--color-charcoal)',
        }}
      >
        {value}
      </span>
    </div>
  );
}
