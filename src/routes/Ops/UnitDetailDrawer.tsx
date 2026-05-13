import { Button, Drawer, Hairline, useRetained } from '../../components';
import { useOps } from './context';
import { OpsPill } from './OpsPrimitives';
import { STATUS_LABEL, STATUS_TONE } from './data';

export function UnitDetailDrawer() {
  const { selectedUnit, closeUnit, bookings, openNewBooking, openBooking } = useOps();
  const open = !!selectedUnit;
  // Retain the unit during the slide-out so the body doesn't flash empty.
  const renderUnit = useRetained(selectedUnit, 320);

  const history = bookings
    .filter((b) => b.unit === renderUnit?.id)
    .slice(0, 8);

  return (
    <Drawer
      open={open}
      onClose={closeUnit}
      eyebrow="Residence"
      title={renderUnit ? `${renderUnit.id} · ${renderUnit.residentFull}` : ''}
      subtitle={
        renderUnit ? `Floor ${renderUnit.floor} · Member since ${renderUnit.since}` : undefined
      }
      footer={
        renderUnit && (
          <Button
            variant="primary"
            icon="plus"
            onClick={() => {
              openNewBooking(renderUnit.id);
            }}
          >
            Schedule Visit
          </Button>
        )
      }
    >
      {renderUnit && (
        <>
          {/* Stat grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 14,
              marginBottom: 24,
            }}
          >
            <Stat label="Visits · YTD" value={String(renderUnit.visits)} />
            <Stat
              label="Last Visit"
              value={history[0]?.date ?? '—'}
            />
            <Stat
              label="Status"
              value={renderUnit.status === 'active' ? 'Active' : 'Paused'}
            />
          </div>

          {/* Contact */}
          {(renderUnit.email || renderUnit.phone) && (
            <>
              <div
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 11,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: 'var(--color-mist)',
                  marginBottom: 10,
                }}
              >
                Contact
              </div>
              {renderUnit.email && (
                <a
                  href={`mailto:${renderUnit.email}`}
                  style={{
                    display: 'block',
                    fontFamily: 'var(--font-serif)',
                    fontSize: 15,
                    color: 'var(--color-charcoal)',
                    border: 0,
                    textDecoration: 'none',
                    padding: '4px 0',
                  }}
                >
                  {renderUnit.email}
                </a>
              )}
              {renderUnit.phone && (
                <a
                  href={`tel:${renderUnit.phone.replace(/\s/g, '')}`}
                  style={{
                    display: 'block',
                    fontFamily: 'var(--font-serif)',
                    fontSize: 15,
                    color: 'var(--color-charcoal)',
                    border: 0,
                    textDecoration: 'none',
                    padding: '4px 0',
                  }}
                >
                  {renderUnit.phone}
                </a>
              )}
              <Hairline color="var(--color-taupe-soft)" width="100%" margin="20px 0 16px" />
            </>
          )}

          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
            }}
          >
            <h3
              style={{
                fontFamily: 'var(--font-serif)',
                fontWeight: 400,
                fontSize: 18,
                margin: 0,
                color: 'var(--color-charcoal)',
              }}
            >
              Visit History
            </h3>
            <span
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 11,
                letterSpacing: '0.06em',
                color: 'var(--color-mist)',
              }}
            >
              {history.length === bookings.filter((b) => b.unit === renderUnit.id).length
                ? `${history.length} on record`
                : `Showing ${history.length} of ${
                    bookings.filter((b) => b.unit === renderUnit.id).length
                  }`}
            </span>
          </div>

          {history.length === 0 && (
            <p
              style={{
                marginTop: 12,
                fontFamily: 'var(--font-sans)',
                fontSize: 13,
                color: 'var(--color-mist)',
              }}
            >
              No bookings on file for this residence yet.
            </p>
          )}

          {history.length > 0 && (
            <div style={{ marginTop: 10 }}>
              {history.map((b, i) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => openBooking(b.id)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '100px 1fr 100px',
                    width: '100%',
                    gap: 12,
                    alignItems: 'center',
                    padding: '12px 0',
                    background: 'transparent',
                    border: 0,
                    borderBottom:
                      i < history.length - 1 ? '1px solid var(--color-taupe-soft)' : '0',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: 14,
                        color: 'var(--color-charcoal)',
                      }}
                    >
                      {b.date}
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: 11,
                        color: 'var(--color-mist)',
                      }}
                    >
                      {b.time}
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: 13,
                        color: 'var(--color-charcoal)',
                      }}
                    >
                      {b.service}
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: 11,
                        color: 'var(--color-mist)',
                        marginTop: 2,
                      }}
                    >
                      {b.attendant} · ${b.price}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <OpsPill tone={STATUS_TONE[b.status]}>{STATUS_LABEL[b.status]}</OpsPill>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </Drawer>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--color-taupe)',
        borderRadius: 6,
        padding: '14px 16px',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 10,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--color-mist)',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-serif)',
          fontWeight: 300,
          fontSize: 24,
          letterSpacing: '-0.01em',
          lineHeight: 1,
          color: 'var(--color-charcoal)',
          marginTop: 6,
        }}
      >
        {value}
      </div>
    </div>
  );
}
