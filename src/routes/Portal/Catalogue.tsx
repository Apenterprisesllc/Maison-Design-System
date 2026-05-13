import { Eyebrow, Hairline, useLucide, useReveal } from '../../components';
import { usePortal } from './context';
import { ServiceCard } from './ServiceCard';

export function Catalogue() {
  const { resident, catalogue, greeting } = usePortal();
  const ref = useReveal<HTMLDivElement>({ y: 32, stagger: 0.08 });
  useLucide();
  const first = resident.name.split(' ')[0];

  return (
    <main
      style={{
        maxWidth: 1240,
        margin: '0 auto',
        padding: 'clamp(48px, 7vw, 88px) clamp(20px, 4vw, 56px) 120px',
      }}
    >
      <Eyebrow>{`${greeting}, ${first}`}</Eyebrow>
      <h1
        className="display-md"
        style={{
          marginTop: 12,
          color: 'var(--color-charcoal)',
          maxWidth: 720,
        }}
      >
        The standard your residence is held to.
      </h1>
      <Hairline width={64} margin="28px 0 48px" />

      <div
        ref={ref}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 24,
        }}
        className="catalogue-grid"
      >
        {catalogue.map((s) => (
          <ServiceCard key={s.id} service={s} />
        ))}
      </div>

      <style>{`
        @media (max-width: 1023px) { .catalogue-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 640px)  { .catalogue-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </main>
  );
}
