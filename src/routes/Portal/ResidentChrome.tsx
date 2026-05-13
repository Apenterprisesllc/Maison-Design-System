import { Icon, MaisonMark } from '../../components';
import { usePortal } from './context';

export interface ResidentChromeProps {
  onAccount?: () => void;
  onHome?: () => void;
  onSignOut?: () => void;
}

export function ResidentChrome({ onAccount, onHome, onSignOut }: ResidentChromeProps) {
  const { resident } = usePortal();

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '20px clamp(20px, 4vw, 56px)',
        borderBottom: '1px solid var(--color-taupe)',
        background: 'rgba(248, 245, 239, 0.88)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        position: 'sticky',
        top: 0,
        zIndex: 20,
      }}
    >
      <button
        onClick={onHome}
        aria-label="Maison home"
        style={{
          background: 'none',
          border: 0,
          padding: 0,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <MaisonMark size={26} />
        <span
          style={{
            fontFamily: 'var(--font-serif)',
            fontWeight: 400,
            fontSize: 18,
            color: 'var(--color-charcoal)',
            letterSpacing: '0.01em',
          }}
        >
          Maison
        </span>
      </button>
      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ textAlign: 'right' }} className="chrome-residence">
          <div
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 10,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--color-mist)',
            }}
          >
            {resident.building}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 15,
              color: 'var(--color-charcoal)',
              marginTop: 2,
            }}
          >
            Residence {resident.residence}
          </div>
        </div>
        <button
          onClick={onAccount}
          aria-label="Account and schedule"
          style={{
            background: 'transparent',
            border: '1px solid var(--color-taupe)',
            width: 40,
            height: 40,
            borderRadius: 9999,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'border-color var(--dur-state) var(--ease-out)',
          }}
        >
          <Icon name="user" size={18} />
        </button>
        {onSignOut && (
          <button
            onClick={onSignOut}
            aria-label="Sign out"
            title="Sign out"
            style={{
              background: 'transparent',
              border: '1px solid var(--color-taupe)',
              width: 40,
              height: 40,
              borderRadius: 9999,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-mist)',
              transition: 'border-color var(--dur-state) var(--ease-out)',
            }}
          >
            <Icon name="log-out" size={16} />
          </button>
        )}
      </div>

      <style>{`
        @media (max-width: 640px) {
          .chrome-residence { display: none; }
        }
      `}</style>
    </header>
  );
}
