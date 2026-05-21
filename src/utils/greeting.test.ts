import { describe, expect, it } from 'vitest';
import { getGreeting } from './greeting';

function at(hour: number, minute = 0): Date {
  const d = new Date(2026, 4, 21, hour, minute, 0, 0);
  return d;
}

describe('getGreeting', () => {
  it('says good morning between 5:00 and 11:59', () => {
    expect(getGreeting(at(5, 0))).toBe('Good morning');
    expect(getGreeting(at(8))).toBe('Good morning');
    expect(getGreeting(at(11, 59))).toBe('Good morning');
  });

  it('says good afternoon between 12:00 and 17:59', () => {
    expect(getGreeting(at(12, 0))).toBe('Good afternoon');
    expect(getGreeting(at(15))).toBe('Good afternoon');
    expect(getGreeting(at(17, 59))).toBe('Good afternoon');
  });

  it('says good evening from 18:00 through 04:59 (including late night)', () => {
    expect(getGreeting(at(18, 0))).toBe('Good evening');
    expect(getGreeting(at(22))).toBe('Good evening');
    expect(getGreeting(at(0))).toBe('Good evening');
    expect(getGreeting(at(2, 30))).toBe('Good evening');
    expect(getGreeting(at(4, 59))).toBe('Good evening');
  });
});
