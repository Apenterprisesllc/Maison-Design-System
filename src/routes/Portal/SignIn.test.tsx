import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SignIn } from './SignIn';
import { renderWithProviders, signOutForTest } from '../../test/test-utils';

async function fillAndSubmit(email: string, password: string) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(/email/i), email);
  await user.type(screen.getByLabelText(/password/i), password);
  await user.click(screen.getByRole('button', { name: /sign in/i }));
}

describe('SignIn (resident portal form)', () => {
  it('shows field-level validation when the email is empty', async () => {
    await signOutForTest();
    renderWithProviders(<SignIn onSignIn={() => undefined} />);
    await userEvent.setup().click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findAllByText('Required.')).toHaveLength(2);
  });

  it('translates Supabase "invalid login" into a friendly message', async () => {
    await signOutForTest();
    renderWithProviders(<SignIn onSignIn={() => undefined} />);
    await fillAndSubmit('resident@thearden.test', 'WRONG');
    expect(
      await screen.findByText(/email and password do not match/i),
    ).toBeInTheDocument();
  });

  it('rejects a property_manager and offers a shortcut to the manager sign-in', async () => {
    await signOutForTest();
    const onSignIn = vi.fn();
    renderWithProviders(<SignIn onSignIn={onSignIn} />);
    await fillAndSubmit('manager@thearden.test', 'ArdenManager2026!');
    expect(
      await screen.findByText(/reserved for residents/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /go to manager sign-in/i }),
    ).toBeInTheDocument();
    expect(onSignIn).not.toHaveBeenCalled();
  });

  it('rejects a residential account when expectedTrack is commercial', async () => {
    await signOutForTest();
    const onSignIn = vi.fn();
    renderWithProviders(<SignIn onSignIn={onSignIn} expectedTrack="commercial" />);
    await fillAndSubmit('resident@thearden.test', 'ResidentPass2026!');
    expect(
      await screen.findByText(/registered for the residential portal/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /go to residential sign-in/i }),
    ).toBeInTheDocument();
    expect(onSignIn).not.toHaveBeenCalled();
  });

  it('calls onSignIn when a residential account matches expectedTrack=residential', async () => {
    await signOutForTest();
    const onSignIn = vi.fn();
    renderWithProviders(<SignIn onSignIn={onSignIn} expectedTrack="residential" />);
    await fillAndSubmit('resident@thearden.test', 'ResidentPass2026!');
    await vi.waitFor(() => expect(onSignIn).toHaveBeenCalledOnce());
  });

  it('accepts any matching resident when expectedTrack is null (neutral)', async () => {
    await signOutForTest();
    const onSignIn = vi.fn();
    renderWithProviders(<SignIn onSignIn={onSignIn} expectedTrack={null} />);
    await fillAndSubmit('cafe@thearden.test', 'CommercialPass2026!');
    await vi.waitFor(() => expect(onSignIn).toHaveBeenCalledOnce());
  });
});
