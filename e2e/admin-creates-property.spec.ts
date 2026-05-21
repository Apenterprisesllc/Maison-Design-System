import { expect, test } from '@playwright/test';
import { signInAsAdmin } from './helpers';

test('super admin adds a new property and assigns a manager', async ({ page }) => {
  await signInAsAdmin(page);

  // Add Property.
  await page.getByRole('button', { name: /add property/i }).click();
  const addDialog = page.getByRole('dialog', { name: /add a property/i });
  await addDialog.getByLabel(/property name/i).fill('One Beacon Tower');
  await addDialog.getByLabel(/city/i).fill('Boston');
  await addDialog.getByRole('button', { name: /add property/i }).click();

  // New row appears in the Properties table. Multiple matches are expected
  // (table cell + dropdown option + modal preview), so use `.first()`.
  await expect(page.getByText('One Beacon Tower').first()).toBeVisible();
  await expect(page.getByText('Boston').first()).toBeVisible();

  // The Add Property modal keeps an aria-hidden wrapper in the DOM for the
  // duration of its exit transition (var(--dur-layout)). Wait it out so the
  // next click reaches the Add Manager button instead of the closing backdrop.
  await page.waitForTimeout(400);

  // Add Manager for the new property.
  await page.getByRole('button', { name: /add manager/i }).click();
  const mgrDialog = page.getByRole('dialog', { name: /add a property manager/i });
  await mgrDialog.getByLabel(/full name/i).fill('Beacon Manager');
  await mgrDialog.getByLabel(/email/i).fill('manager@beacon.test');
  // selectOption needs exact label or value; pull the value from the option
  // we just created and select by value to avoid whitespace fragility.
  const beaconValue = await mgrDialog
    .locator('option', { hasText: 'One Beacon Tower' })
    .first()
    .getAttribute('value');
  await mgrDialog.getByLabel(/assign to property/i).selectOption(beaconValue!);
  await mgrDialog.getByRole('button', { name: /create manager/i }).click();

  // Credentials screen shows once.
  await expect(page.getByText(/temporary password/i)).toBeVisible();
  await expect(page.getByText(/manager@beacon\.test/i)).toBeVisible();
});
