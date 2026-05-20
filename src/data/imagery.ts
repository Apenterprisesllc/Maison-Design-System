/**
 * Curated Unsplash imagery for AP Enterprises. All photos are Unsplash-licensed
 * (free for commercial use, no attribution required by license — but credit
 * the photographers in production). Replace with brand photography before
 * launch.
 *
 * Selection brief: luxury architecture, marble + brass interiors, warm
 * grade, hospitality moments. No people pointing at laptops.
 */

const UNSPLASH = 'https://images.unsplash.com';

function img(id: string, w: number = 1800, q: number = 80): string {
  return `${UNSPLASH}/${id}?auto=format&fit=crop&w=${w}&q=${q}`;
}

export const IMAGERY = {
  // Hero — luxury residential tower facade at golden hour
  hero: img('photo-1545324418-cc1a3fa10c00', 2400),

  // Sign-in atmospheres
  signinResident: img('photo-1600607687939-ce8a6c25118c', 1600),
  signinCommercial: img('photo-1497366216548-37526070297c', 1600), // modern office lobby, golden hour
  signinManager: img('photo-1582719508461-905c673771fd', 1600),

  // The Standard grid — 6 detail moments
  detail1: img('photo-1600210492486-724fe5c67fb0', 1400), // marble + brass
  detail2: img('photo-1600585154340-be6161a56a0c', 1400), // bedroom suite
  detail3: img('photo-1600566753190-17f0baa2a6c3', 1400), // bath detail
  detail4: img('photo-1600585154526-990dced4db0d', 1400), // kitchen
  detail5: img('photo-1600607687920-4e2a09cf159d', 1400), // window
  detail6: img('photo-1600121848594-d8644e57abab', 1400), // dining

  // Testimonial backdrop — atmospheric / abstract
  testimonialBackdrop: img('photo-1517248135467-4c7edcad34c4', 2400),

  // Portal service-card imagery — residential
  serviceWindow: img('photo-1600585154340-be6161a56a0c', 900),
  serviceDeep: img('photo-1556228720-195a672e8a03', 900),
  serviceHousekeeping: img('photo-1581578731548-c64695cc6952', 900), // bedroom linens, hospitality
  serviceMarble: img('photo-1615873968403-89e068629265', 900),       // polished stone surface
  serviceDisinfecting: img('photo-1584467735815-f778f274e296', 900), // gloved hand, sterile surface
  serviceMoveinout: img('photo-1560448204-e02f11c3d0e2', 900),       // empty bright residence

  // Portal service-card imagery — commercial
  servicePostConstruction: img('photo-1581094794329-c8112a89af12', 900), // raw build-out interior
  serviceOfficeNight: img('photo-1497366754035-f200968a6e72', 900),       // empty office, blue hour
  serviceRestaurantNight: img('photo-1414235077428-338989a2e8c0', 900),   // dim restaurant interior
  serviceCommercial: img('photo-1497366811353-6870744d04b2', 900),        // glass office lobby
  serviceEpoxy: img('photo-1581094271901-8022df4466f9', 900),             // glossy industrial floor
  serviceEvents: img('photo-1519671482749-fd09be7ccebf', 900),            // banquet hall set
  serviceRealEstate: img('photo-1568605114967-8130f3a36994', 900),        // staged living room

  // Legacy aliases (kept for any lingering imports)
  servicePressure: img('photo-1599751449128-eb7249c3d6b1', 900),
  serviceHandy: img('photo-1567361808960-dec9cb578182', 900),
  serviceValet: img('photo-1593941707882-a5bba14938c7', 900),
  serviceGarden: img('photo-1416879595882-3373a0480b5b', 900),

  // Pinned section — Portal/Ops screenshots (atmospheric stand-ins until
  // we have real product captures)
  preview1: img('photo-1631679706909-1844bbd07221', 1600),
  preview2: img('photo-1600880292203-757bb62b4baf', 1600),
  preview3: img('photo-1517502884422-41eaead166d4', 1600),
};
