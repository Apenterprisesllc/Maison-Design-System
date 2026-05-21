import { expect, test } from '@playwright/test';
import { signInAsResident } from './helpers';

test('residential resident books a deep cleaning end-to-end', async ({ page }) => {
  await signInAsResident(page, 'residential');

  // Open the Deep Cleaning service.
  await page.getByRole('link', { name: /schedule deep cleaning/i }).click();
  await expect(page).toHaveURL(/\/portal\/services\/deep\/book/);

  // Pick a date 7 days from today. The calendar uses an aria-label like
  // "Tuesday, May 27" / "Sunday, June 1" — both are valid future dates.
  const target = new Date();
  target.setDate(target.getDate() + 7);
  const targetLabel = target.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  await page.getByRole('button', { name: targetLabel }).click();

  // Pick the first non-disabled time slot. TimeSlots labels look like "9:00 AM".
  await page
    .getByRole('button', { name: /^\d{1,2}:\d{2} (AM|PM)$/ })
    .first()
    .click();

  // Submit.
  await page.getByRole('button', { name: /schedule this visit/i }).click();

  await expect(page).toHaveURL(/\/portal\/services\/deep\/confirm/, { timeout: 10_000 });
  await expect(page.getByText(/confirmed/i).first()).toBeVisible();
});
