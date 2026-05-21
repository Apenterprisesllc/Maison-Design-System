import { describe, expect, it } from 'vitest';
import { generateTempPassword } from './adminUsers';

describe('generateTempPassword', () => {
  it('returns a 14-character string', () => {
    expect(generateTempPassword()).toHaveLength(14);
  });

  it('uses only the allowed alphabet (no ambiguous 0/O/1/I/l)', () => {
    // alphabet = ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789
    // excludes uppercase I, O; lowercase l, o; digits 0, 1.
    const password = generateTempPassword();
    expect(password).toMatch(/^[A-HJ-NP-Za-km-np-z2-9]{14}$/);
  });

  it('produces a different password each call (overwhelmingly probable)', () => {
    const samples = new Set(Array.from({ length: 50 }, () => generateTempPassword()));
    // Collisions across 50 samples in 56^14 space are vanishingly unlikely.
    expect(samples.size).toBe(50);
  });
});
