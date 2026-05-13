/**
 * Time-of-day-aware greeting prefix.
 *
 * Boundaries:
 *   05:00 – 11:59 → "Good morning"
 *   12:00 – 17:59 → "Good afternoon"
 *   18:00 – 04:59 → "Good evening"
 *
 * Late-night (00:00 – 04:59) intentionally rolls into "evening" rather than
 * "morning" — for a luxury service, "Good morning, Eleanor" at 2am would
 * read as a misfire.
 */
export function getGreeting(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 18) return 'Good afternoon';
  return 'Good evening';
}
