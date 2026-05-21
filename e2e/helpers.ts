import { Page, expect } from '@playwright/test';

/**
 * Shared helpers for E2E specs. The Playwright dev server runs with
 * VITE_E2E_MOCK=true so all Supabase calls hit the MSW handlers defined
 * in src/test/handlers.ts. The in-memory store resets on each page reload
 * because the module re-initialises.
 */

export const ACCOUNTS = {
  admin: { email: 'admin@apenterprises.test', password: 'AdminPass2026!' },
  manager: { email: 'manager@thearden.test', password: 'ArdenManager2026!' },
  residential: { email: 'resident@thearden.test', password: 'ResidentPass2026!' },
  commercial: { email: 'cafe@thearden.test', password: 'CommercialPass2026!' },
} as const;

export async function signInAsManager(page: Page) {
  await page.goto('/sign-in/manager');
  await page.getByLabel('Email').fill(ACCOUNTS.manager.email);
  await page.getByLabel('Password').fill(ACCOUNTS.manager.password);
  await page.getByRole('button', { name: /enter operations/i }).click();
  await expect(page).toHaveURL(/\/ops$/);
}

export async function signInAsAdmin(page: Page) {
  await page.goto('/sign-in/manager');
  await page.getByLabel('Email').fill(ACCOUNTS.admin.email);
  await page.getByLabel('Password').fill(ACCOUNTS.admin.password);
  await page.getByRole('button', { name: /enter operations/i }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

export async function signInAsResident(page: Page, kind: 'residential' | 'commercial' = 'residential') {
  await page.goto(`/sign-in/resident?track=${kind}`);
  const account = kind === 'commercial' ? ACCOUNTS.commercial : ACCOUNTS.residential;
  await page.getByLabel('Email').fill(account.email);
  await page.getByLabel('Password').fill(account.password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/portal/);
}
