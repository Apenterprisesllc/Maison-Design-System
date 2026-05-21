import { expect, test } from '@playwright/test';
import { ACCOUNTS, signInAsAdmin, signInAsManager, signInAsResident } from './helpers';

test.describe('Sign-in flow', () => {
  test('manager signs in and lands on the operations pipeline', async ({ page }) => {
    await signInAsManager(page);
    await expect(page.getByRole('heading', { name: /pipeline/i })).toBeVisible();
  });

  test('super admin signs in and lands on the platform overview', async ({ page }) => {
    await signInAsAdmin(page);
    await expect(page.getByRole('heading', { name: /overview/i })).toBeVisible();
    await expect(page.getByText(/properties/i).first()).toBeVisible();
  });

  test('residential resident signs in and sees the residential catalogue', async ({ page }) => {
    await signInAsResident(page, 'residential');
    await expect(page.getByText(/deep cleaning/i)).toBeVisible();
  });

  test('rejects manager credentials at the resident sign-in with shortcut', async ({ page }) => {
    await page.goto('/sign-in/resident?track=residential');
    await page.getByLabel('Email').fill(ACCOUNTS.manager.email);
    await page.getByLabel('Password').fill(ACCOUNTS.manager.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText(/reserved for residents/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /go to manager sign-in/i })).toBeVisible();
  });

  test('rejects commercial credentials when track=residential is enforced', async ({ page }) => {
    await page.goto('/sign-in/resident?track=residential');
    await page.getByLabel('Email').fill(ACCOUNTS.commercial.email);
    await page.getByLabel('Password').fill(ACCOUNTS.commercial.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText(/registered for the commercial portal/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /go to commercial sign-in/i })).toBeVisible();
  });
});
