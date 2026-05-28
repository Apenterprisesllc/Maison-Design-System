import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SignInManager } from './SignInManager';
import { renderWithProviders, signOutForTest } from '../test/test-utils';

async function fillAndSubmit(email: string, password: string) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(/email/i), email);
  await user.type(screen.getByLabelText(/password/i), password);
  await user.click(screen.getByRole('button', { name: /enter operations/i }));
}

describe('SignInManager', () => {
  it('rejects a resident account and offers a shortcut to the booking flow', async () => {
    await signOutForTest();
    renderWithProviders(<SignInManager />, { route: '/sign-in/manager' });
    await fillAndSubmit('resident@thearden.test', 'ResidentPass2026!');
    expect(
      await screen.findByText(/residents schedule services without signing in/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /schedule a service/i }),
    ).toBeInTheDocument();
  });

  it('translates invalid credentials into a friendly error', async () => {
    await signOutForTest();
    renderWithProviders(<SignInManager />, { route: '/sign-in/manager' });
    await fillAndSubmit('manager@thearden.test', 'BAD');
    expect(
      await screen.findByText(/email and password do not match/i),
    ).toBeInTheDocument();
  });

  it('requires both email and password', async () => {
    await signOutForTest();
    renderWithProviders(<SignInManager />, { route: '/sign-in/manager' });
    await userEvent.setup().click(screen.getByRole('button', { name: /enter operations/i }));
    expect(await screen.findAllByText('Required.')).toHaveLength(2);
  });
});
