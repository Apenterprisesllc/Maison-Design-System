import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import {
  Button,
  CountUp,
  Eyebrow,
  Hairline,
  Icon,
  BrandMark,
  Marquee,
  Modal,
  Reveal,
  SplitHeading,
  useLucide,
  useReveal,
} from '../components';
import { BUILDINGS } from '../data/buildings';
import { IMAGERY } from '../data/imagery';
import { TESTIMONIALS } from '../data/testimonials';

export function Landing() {
  const heroHairlineRef = useRef<HTMLDivElement>(null);
  const heroImgRef = useRef<HTMLImageElement>(null);
  const pinSectionRef = useRef<HTMLDivElement>(null);
  const pinFrameRef = useRef<HTMLDivElement>(null);
  const mainRef = useReveal<HTMLElement>({ y: 28, stagger: 0.08, rootMargin: '0px 0px -8% 0px' });
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const navigate = useNavigate();
  useLucide();

  const pickTrack = (track: 'residential' | 'commercial') => {
    setScheduleOpen(false);
    navigate(`/sign-in/resident?track=${track}`);
  };

  useGSAP(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    // Hero hairline grows from 0 → full width
    if (heroHairlineRef.current) {
      gsap.fromTo(
        heroHairlineRef.current,
        { scaleX: 0 },
        { scaleX: 1, duration: 1.2, ease: 'expo.out', delay: 0.2, transformOrigin: 'left center' },
      );
    }

    // Hero image: subtle parallax y on scroll
    if (heroImgRef.current) {
      gsap.to(heroImgRef.current, {
        yPercent: -10,
        ease: 'none',
        scrollTrigger: {
          trigger: heroImgRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
        },
      });
    }

    // Preview frames — cross-fade as the section enters the viewport
    if (pinFrameRef.current) {
      const frames = pinFrameRef.current.querySelectorAll<HTMLElement>('[data-preview-frame]');
      if (frames.length) {
        gsap.set(frames, { opacity: 0 });
        gsap.set(frames[0], { opacity: 1 });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: pinFrameRef.current,
            start: 'top 75%',
            end: 'bottom 25%',
            scrub: 0.8,
          },
        });

        for (let i = 1; i < frames.length; i++) {
          tl.to(frames[i - 1], { opacity: 0, duration: 1 });
          tl.to(frames[i], { opacity: 1, duration: 1 }, '<');
        }
      }
    }
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '20px clamp(20px, 4vw, 56px)',
          borderBottom: '1px solid var(--color-taupe)',
          position: 'sticky',
          top: 0,
          background: 'rgba(244, 247, 250, 0.85)',
          backdropFilter: 'blur(12px)',
          zIndex: 20,
        }}
      >
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            textDecoration: 'none',
            border: 0,
            color: 'var(--color-charcoal)',
          }}
          aria-label="AP Enterprises home"
        >
          <BrandMark size={40} />
        </Link>
        <div style={{ flex: 1 }} />
        <nav
          aria-label="Top navigation"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 32,
            fontFamily: 'var(--font-sans)',
            fontSize: 12,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--color-mist)',
          }}
        >
          <a href="#standard" style={{ border: 0, textDecoration: 'none', color: 'inherit' }} className="desktop-only">
            The Standard
          </a>
          <a href="#process" style={{ border: 0, textDecoration: 'none', color: 'inherit' }} className="desktop-only">
            How We Work
          </a>
          <Link
            to="/sign-in/manager"
            style={{ border: 0, textDecoration: 'none', color: 'inherit' }}
          >
            Operations
          </Link>
        </nav>
      </header>

      {/* ── HERO ───────────────────────────────────────────────────────── */}
      <main id="main" ref={mainRef} style={{ flex: 1 }}>
        <section
          style={{
            position: 'relative',
            maxWidth: 1440,
            margin: '0 auto',
            padding: 'clamp(40px, 5vw, 72px) clamp(20px, 4vw, 56px) clamp(56px, 6vw, 88px)',
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.05fr) minmax(0, 0.95fr)',
            gap: 'clamp(32px, 5vw, 72px)',
            alignItems: 'center',
          }}
          className="hero-grid"
        >
          <div>
            <Eyebrow>Members · By Invitation</Eyebrow>
            <SplitHeading
              as="h1"
              className="display-xl"
              style={{ marginTop: 14, color: 'var(--color-charcoal)' }}
            >
              The standard your residence is held to.
            </SplitHeading>
            <div
              ref={heroHairlineRef}
              style={{
                width: 80,
                height: 1,
                background: 'var(--color-champagne)',
                margin: '28px 0 24px',
                transformOrigin: 'left center',
              }}
            />
            <Reveal delay={0.6}>
              <p
                className="lead"
                style={{ color: 'var(--color-mist)', maxWidth: 500, margin: 0, fontSize: 17 }}
              >
                AP Enterprises is a private members service for luxury residential communities.
                Window service, deep cleaning, valet, landscaping — arranged on your calendar,
                attended to by a single building concierge.
              </p>
            </Reveal>

            <Reveal delay={0.8}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  marginTop: 32,
                  flexWrap: 'wrap',
                }}
              >
                <Button
                  variant="primary"
                  size="lg"
                  iconAfter="arrow-right"
                  onClick={() => setScheduleOpen(true)}
                >
                  Schedule Your Service
                </Button>
                <Link to="/sign-in/manager" style={{ border: 0, textDecoration: 'none' }}>
                  <Button variant="secondary" size="lg">
                    For Property Managers
                  </Button>
                </Link>
              </div>
            </Reveal>

            <Reveal delay={1.0}>
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 12,
                  color: 'var(--color-mist-soft)',
                  marginTop: 24,
                  maxWidth: 460,
                  lineHeight: 1.65,
                }}
              >
                Memberships are extended through the building. Residents of AP-stewarded
                properties receive credentials at move-in.
              </p>
            </Reveal>
          </div>

          <Reveal as="figure" delay={0.3} y={32}>
            <div
              style={{
                margin: 0,
                position: 'relative',
                aspectRatio: '5 / 6',
                overflow: 'hidden',
                borderRadius: 4,
                border: '1px solid var(--color-taupe)',
                boxShadow: 'var(--shadow-2)',
              }}
              className="hero-figure"
            >
              <img
                ref={heroImgRef}
                src={IMAGERY.hero}
                alt="Luxury residential tower at golden hour"
                style={{
                  width: '100%',
                  height: '115%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
              {/* Subtle vignette */}
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'linear-gradient(180deg, rgba(10,10,10,0) 45%, rgba(10,10,10,0.55) 100%)',
                  pointerEvents: 'none',
                }}
              />
              {/* Editorial caption */}
              <figcaption
                style={{
                  position: 'absolute',
                  left: 20,
                  bottom: 20,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  color: 'var(--color-cream)',
                }}
              >
                <span
                  style={{
                    width: 24,
                    height: 1,
                    background: 'var(--color-champagne)',
                  }}
                />
                <span
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 10,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                  }}
                >
                  The Arden · 14th Floor
                </span>
              </figcaption>
              {/* Top-right index marker — editorial flourish */}
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: 20,
                  right: 20,
                  fontFamily: 'var(--font-serif)',
                  fontSize: 11,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'rgba(244,247,250,0.85)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span>NO. 01</span>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: 'var(--color-champagne)',
                  }}
                />
              </div>
            </div>
          </Reveal>
        </section>

        {/* ── BUILDINGS MARQUEE ──────────────────────────────────────── */}
        <section
          aria-labelledby="properties-heading"
          style={{
            borderTop: '1px solid var(--color-taupe)',
            borderBottom: '1px solid var(--color-taupe)',
            padding: '32px 0 28px',
            background: 'var(--color-cream-deep)',
          }}
        >
          <div
            style={{
              maxWidth: 1440,
              margin: '0 auto',
              padding: '0 clamp(20px, 4vw, 56px) 16px',
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: 24,
              flexWrap: 'wrap',
            }}
          >
            <Eyebrow>Properties Under Stewardship</Eyebrow>
            <span
              id="properties-heading"
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 16,
                color: 'var(--color-mist)',
              }}
            >
              Ten residences · Three coasts
            </span>
          </div>

          <Marquee duration={48} gap={64}>
            {BUILDINGS.map((b) => (
              <div
                key={b.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: 4,
                  paddingInline: 8,
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: 28,
                    fontWeight: 300,
                    color: 'var(--color-charcoal)',
                    letterSpacing: '-0.01em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {b.name}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 10,
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    color: 'var(--color-mist)',
                  }}
                >
                  {b.city}
                </span>
              </div>
            ))}
          </Marquee>
        </section>

        {/* ── HOW WE WORK ────────────────────────────────────────────── */}
        <section
          id="process"
          aria-labelledby="process-heading"
          style={{
            maxWidth: 1240,
            margin: '0 auto',
            padding: 'clamp(56px, 7vw, 96px) clamp(20px, 4vw, 56px)',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.4fr)',
              gap: 56,
              alignItems: 'start',
            }}
            className="two-col"
          >
            <div>
              <Eyebrow>How We Work</Eyebrow>
              <h2
                id="process-heading"
                className="display-md"
                style={{ marginTop: 16, color: 'var(--color-charcoal)' }}
              >
                Three steps. Then the residence is in trust.
              </h2>
            </div>
            <ol
              style={{
                listStyle: 'none',
                margin: 0,
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 40,
              }}
            >
              {[
                {
                  n: '01',
                  h: 'Stewardship begins at move-in.',
                  p: 'The building enrols a residence. AP Enterprises credentials arrive with the keys. Your standing visit cadence is set with the concierge in twenty minutes.',
                },
                {
                  n: '02',
                  h: 'Schedule on the calendar.',
                  p: 'Open the directory. Pick a service, a date, a window. Notes for the attendant travel with the booking. The front desk is informed automatically.',
                },
                {
                  n: '03',
                  h: 'Attended to in silence.',
                  p: 'The attendant is admitted, the service is performed, the receipt is filed. Your account holds a complete record. You are not asked twice.',
                },
              ].map((step) => (
                <li
                  key={step.n}
                  data-reveal
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '80px 1fr',
                    gap: 32,
                    alignItems: 'baseline',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontWeight: 300,
                      fontSize: 40,
                      color: 'var(--color-champagne-deep)',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {step.n}
                  </span>
                  <div>
                    <h3
                      style={{
                        fontFamily: 'var(--font-serif)',
                        fontWeight: 400,
                        fontSize: 26,
                        margin: 0,
                        lineHeight: 1.2,
                        color: 'var(--color-charcoal)',
                      }}
                    >
                      {step.h}
                    </h3>
                    <Hairline width={32} margin="14px 0 18px" />
                    <p
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: 16,
                        color: 'var(--color-mist)',
                        lineHeight: 1.7,
                        margin: 0,
                      }}
                    >
                      {step.p}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── PREVIEW (cross-fade on scroll, no pin) ─────────────────── */}
        <section
          ref={pinSectionRef}
          aria-label="Product preview"
          style={{
            background: 'var(--color-ink)',
            color: 'var(--color-cream)',
          }}
        >
          <div
            style={{
              maxWidth: 1440,
              margin: '0 auto',
              padding: 'clamp(56px, 7vw, 96px) clamp(20px, 4vw, 56px)',
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 0.85fr) minmax(0, 1.6fr)',
              gap: 'clamp(32px, 5vw, 64px)',
              alignItems: 'center',
            }}
            className="pin-grid"
          >
            <div>
              <Eyebrow color="rgba(244,247,250,0.7)">What it looks like</Eyebrow>
              <h2
                className="display-md"
                style={{
                  marginTop: 14,
                  color: 'var(--color-cream)',
                }}
              >
                Infrastructure for stewardship.
              </h2>
              <div
                style={{
                  width: 48,
                  height: 1,
                  background: 'var(--color-champagne)',
                  margin: '20px 0 16px',
                }}
              />
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 15,
                  color: 'rgba(244,247,250,0.78)',
                  lineHeight: 1.65,
                  margin: 0,
                  maxWidth: 420,
                }}
              >
                Two surfaces, one system. Residents see a directory and a calendar. Managers see
                a pipeline, a ledger, and a quarter.
              </p>
            </div>

            <div
              ref={pinFrameRef}
              style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '16 / 10',
                overflow: 'hidden',
                border: '1px solid rgba(196,151,62,0.3)',
                borderRadius: 4,
              }}
            >
              {[IMAGERY.preview1, IMAGERY.preview2, IMAGERY.preview3].map((src, i) => (
                <img
                  key={i}
                  data-preview-frame
                  src={src}
                  alt=""
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ── STATS ──────────────────────────────────────────────────── */}
        <section
          style={{
            background: 'var(--color-cream-deep)',
            padding: 'clamp(56px, 7vw, 96px) clamp(20px, 4vw, 56px)',
            borderBottom: '1px solid var(--color-taupe)',
          }}
        >
          <div style={{ maxWidth: 1240, margin: '0 auto' }}>
            <Eyebrow>By the Quarter</Eyebrow>
            <h2
              className="display-md"
              style={{ marginTop: 14, color: 'var(--color-charcoal)', maxWidth: 720 }}
            >
              A standard you can read in numbers.
            </h2>
            <div
              style={{
                width: 48,
                height: 1,
                background: 'var(--color-champagne)',
                margin: '24px 0 40px',
              }}
            />
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 32,
              }}
              className="stats-grid"
            >
              <Stat to={240} sup="+" label="Residences in trust" />
              <Stat to={1840} label="Visits this quarter" />
              <Stat to={98} sup="%" label="On-time arrivals" />
              <Stat to={10} label="Cities across the U.S." />
            </div>
          </div>
        </section>

        {/* ── TESTIMONIAL ────────────────────────────────────────────── */}
        <section
          aria-label="From residents"
          style={{
            position: 'relative',
            background: 'var(--color-ink)',
            color: 'var(--color-cream)',
            padding: 'clamp(64px, 8vw, 120px) clamp(20px, 4vw, 56px)',
            overflow: 'hidden',
          }}
        >
          <img
            src={IMAGERY.testimonialBackdrop}
            alt=""
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.18,
              filter: 'grayscale(0.6) brightness(0.5)',
            }}
          />
          <div
            style={{
              position: 'relative',
              maxWidth: 1240,
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 28,
            }}
          >
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: -24,
                left: -8,
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(120px, 18vw, 260px)',
                lineHeight: 0.7,
                color: 'var(--color-champagne)',
                opacity: 0.18,
                fontWeight: 300,
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            >
              "
            </div>
            <Eyebrow color="rgba(244,247,250,0.7)">From Residents</Eyebrow>
            <SplitHeading
              as="blockquote"
              onScroll
              splitBy="words"
              stagger={0.04}
              style={{
                fontFamily: 'var(--font-serif)',
                fontWeight: 300,
                fontSize: 'clamp(28px, 4.2vw, 52px)',
                lineHeight: 1.18,
                letterSpacing: '-0.02em',
                color: 'var(--color-cream)',
                margin: 0,
                maxWidth: 1040,
                position: 'relative',
              }}
            >
              {TESTIMONIALS[0].quote}
            </SplitHeading>
            <Reveal delay={0.4}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  paddingTop: 16,
                  borderTop: '1px solid rgba(196,151,62,0.35)',
                  maxWidth: 600,
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: 17,
                      color: 'var(--color-cream)',
                    }}
                  >
                    {TESTIMONIALS[0].attribution}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: 12,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'rgba(244,247,250,0.6)',
                      marginTop: 4,
                    }}
                  >
                    {TESTIMONIALS[0].role} · {TESTIMONIALS[0].building}
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── THE STANDARD GRID ──────────────────────────────────────── */}
        <section
          id="standard"
          aria-labelledby="standard-heading"
          style={{
            maxWidth: 1440,
            margin: '0 auto',
            padding: 'clamp(56px, 7vw, 96px) clamp(20px, 4vw, 56px)',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
              gap: 40,
              alignItems: 'end',
              marginBottom: 40,
            }}
            className="two-col"
          >
            <div>
              <Eyebrow>The Standard</Eyebrow>
              <h2
                id="standard-heading"
                className="display-md"
                style={{ marginTop: 14, color: 'var(--color-charcoal)' }}
              >
                A residence held to a single line.
              </h2>
            </div>
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 15,
                color: 'var(--color-mist)',
                lineHeight: 1.65,
                margin: 0,
                maxWidth: 480,
              }}
            >
              Six categories of service, each with a vetted vendor, a published procedure, and a
              published price. The building's concierge is the only point of contact.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 20,
            }}
            className="standard-grid"
          >
            {[
              { src: IMAGERY.detail1, label: 'Glazing' },
              { src: IMAGERY.detail2, label: 'Housekeeping' },
              { src: IMAGERY.detail3, label: 'Stone Care' },
              { src: IMAGERY.detail4, label: 'Joinery' },
              { src: IMAGERY.detail5, label: 'Grounds' },
              { src: IMAGERY.detail6, label: 'Front Door' },
            ].map((cell) => (
              <figure
                key={cell.label}
                data-reveal
                style={{
                  position: 'relative',
                  margin: 0,
                  aspectRatio: '4 / 5',
                  overflow: 'hidden',
                  border: '1px solid var(--color-taupe)',
                  borderRadius: 4,
                }}
              >
                <img
                  src={cell.src}
                  alt={cell.label}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 800ms var(--ease-editorial)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.03)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                />
                <figcaption
                  style={{
                    position: 'absolute',
                    left: 16,
                    bottom: 16,
                    padding: '6px 12px',
                    background: 'rgba(10, 10, 10, 0.6)',
                    backdropFilter: 'blur(6px)',
                    color: 'var(--color-cream)',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 10,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                  }}
                >
                  {cell.label}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* ── CLOSING CTA ────────────────────────────────────────────── */}
        <section
          style={{
            maxWidth: 1240,
            margin: '0 auto',
            padding: 'clamp(48px, 6vw, 88px) clamp(20px, 4vw, 56px)',
            textAlign: 'center',
            borderTop: '1px solid var(--color-taupe)',
          }}
        >
          <Eyebrow>By Invitation</Eyebrow>
          <h2
            className="display-md"
            style={{ marginTop: 14, marginInline: 'auto', maxWidth: 760 }}
          >
            If your building stewards with AP Enterprises, your access is already pending.
          </h2>
          <div
            style={{
              width: 48,
              height: 1,
              background: 'var(--color-champagne)',
              margin: '24px auto',
            }}
          />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Button
              variant="primary"
              size="lg"
              iconAfter="arrow-right"
              onClick={() => setScheduleOpen(true)}
            >
              Schedule Your Service
            </Button>
            <Link to="/sign-in/manager" style={{ border: 0, textDecoration: 'none' }}>
              <Button variant="secondary" size="lg">
                For Property Managers
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <ScheduleTrackModal
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        onPick={pickTrack}
      />

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <footer
        style={{
          background: 'var(--color-ink)',
          color: 'rgba(244, 247, 250, 0.7)',
          padding: 'clamp(48px, 6vw, 72px) clamp(20px, 4vw, 56px) 28px',
        }}
      >
        <div
          style={{
            maxWidth: 1440,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.4fr) repeat(3, minmax(0, 1fr))',
            gap: 40,
          }}
          className="footer-grid"
        >
          <div>
            <BrandMark size={56} dark />
            <p
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 16,
                marginTop: 16,
                color: 'rgba(244,247,250,0.85)',
                lineHeight: 1.6,
                maxWidth: 320,
              }}
            >
              Quiet stewardship for residences of consequence.
            </p>
          </div>
          <FooterCol
            heading="For Residents"
            links={['Sign In', 'How It Works', 'Catalogue', 'Concierge Help']}
          />
          <FooterCol
            heading="For Managers"
            links={['Operations', 'Onboarding', 'Vendor Network', 'Reporting']}
          />
          <FooterCol heading="Legal" links={['Privacy', 'Terms', 'Accessibility', 'Press']} />
        </div>
        <div
          style={{
            maxWidth: 1440,
            margin: '48px auto 0',
            paddingTop: 20,
            borderTop: '1px solid rgba(196,151,62,0.25)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontFamily: 'var(--font-sans)',
            fontSize: 12,
            letterSpacing: '0.04em',
            color: 'rgba(244,247,250,0.55)',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <span>© AP Enterprises · {new Date().getFullYear()}</span>
          <span>By invitation · Members only</span>
        </div>
      </footer>

      {/* Component-local responsive overrides (kept here so JSX stays in one file) */}
      <style>{`
        @media (max-width: 1023px) {
          .hero-grid, .two-col, .pin-grid, .footer-grid { grid-template-columns: 1fr !important; }
          .standard-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 40px !important; }
        }
        @media (max-width: 640px) {
          .standard-grid { grid-template-columns: 1fr !important; }
          .stats-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function Stat({ to, sup, label }: { to: number; sup?: string; label: string }) {
  return (
    <div data-reveal>
      <div
        style={{
          fontFamily: 'var(--font-serif)',
          fontWeight: 300,
          fontSize: 'clamp(48px, 6vw, 72px)',
          letterSpacing: '-0.02em',
          lineHeight: 1,
          color: 'var(--color-charcoal)',
        }}
      >
        <CountUp to={to} />
        {sup && (
          <span style={{ fontSize: '0.4em', color: 'var(--color-champagne-deep)', marginLeft: 4 }}>
            {sup}
          </span>
        )}
      </div>
      <div
        style={{
          width: 28,
          height: 1,
          background: 'var(--color-champagne)',
          margin: '20px 0 14px',
        }}
      />
      <div
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 11,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--color-mist)',
        }}
      >
        {label}
      </div>
    </div>
  );
}

function ScheduleTrackModal({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (track: 'residential' | 'commercial') => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow="Schedule a Service"
      title="Which kind of property do you steward?"
      width={620}
    >
      <p
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 14,
          color: 'var(--color-mist)',
          lineHeight: 1.65,
          margin: '0 0 24px',
          maxWidth: 480,
        }}
      >
        Choose the track that matches the residence or facility. The catalogue and
        scheduling cadence will adjust to suit.
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 16,
        }}
        className="track-grid"
      >
        <TrackCard
          icon="home"
          label="Residencial"
          description="Private residences, condos, and luxury homes. Recurring or on-demand."
          onClick={() => onPick('residential')}
        />
        <TrackCard
          icon="building-2"
          label="Comercial"
          description="Offices, restaurants, hotels, Airbnb, post-construction, and events."
          onClick={() => onPick('commercial')}
        />
      </div>
      <style>{`
        @media (max-width: 560px) {
          .track-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </Modal>
  );
}

function TrackCard({
  icon,
  label,
  description,
  onClick,
}: {
  icon: string;
  label: string;
  description: string;
  onClick: () => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        textAlign: 'left',
        cursor: 'pointer',
        background: hover ? 'rgba(196,151,62,0.06)' : 'var(--bg-surface)',
        border: '1px solid ' + (hover ? 'var(--color-champagne)' : 'var(--color-taupe)'),
        borderRadius: 6,
        padding: '22px 22px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        transition:
          'background-color var(--dur-state) var(--ease-out), border-color var(--dur-state) var(--ease-out), transform var(--dur-snap) var(--ease-out)',
        transform: hover ? 'translateY(-2px)' : 'translateY(0)',
      }}
    >
      <span
        style={{
          width: 40,
          height: 40,
          borderRadius: 4,
          background: 'var(--color-ink)',
          color: 'var(--color-cream)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={icon} size={20} />
      </span>
      <span
        style={{
          fontFamily: 'var(--font-serif)',
          fontWeight: 400,
          fontSize: 22,
          lineHeight: 1.15,
          color: 'var(--color-charcoal)',
          letterSpacing: '-0.01em',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 13,
          color: 'var(--color-mist)',
          lineHeight: 1.55,
        }}
      >
        {description}
      </span>
      <span
        style={{
          marginTop: 'auto',
          paddingTop: 8,
          fontFamily: 'var(--font-sans)',
          fontSize: 11,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--color-champagne-deep)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        Continue
        <Icon name="arrow-right" size={14} />
      </span>
    </button>
  );
}

function FooterCol({ heading, links }: { heading: string; links: string[] }) {
  return (
    <div>
      <div
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 11,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--color-champagne)',
          marginBottom: 16,
        }}
      >
        {heading}
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {links.map((l) => (
          <li key={l}>
            <a
              href="#"
              style={{
                color: 'rgba(244,247,250,0.75)',
                fontFamily: 'var(--font-sans)',
                fontSize: 14,
                textDecoration: 'none',
                border: 0,
              }}
            >
              {l}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
