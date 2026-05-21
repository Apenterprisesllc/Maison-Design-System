import { afterAll, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddPropertyModal } from './AddPropertyModal';
import { AdminProvider } from './context';
import { ToastProvider } from '../../components';
import { renderWithProviders, signInAs, signOutForTest } from '../../test/test-utils';

function Wrap() {
  return (
    <ToastProvider>
      <AdminProvider>
        <AddPropertyModal open onClose={() => undefined} />
      </AdminProvider>
    </ToastProvider>
  );
}

describe('AddPropertyModal', () => {
  it('auto-derives the slug from the property name until the user edits it', async () => {
    await signInAs('admin@apenterprises.test', 'AdminPass2026!');
    renderWithProviders(<Wrap />);

    const user = userEvent.setup();
    const nameField = await screen.findByLabelText(/property name/i);
    const slugField = screen.getByLabelText(/slug/i);

    await user.type(nameField, 'One Beacon Tower');
    expect(slugField).toHaveValue('one-beacon-tower');

    // User edits slug → name changes no longer overwrite it.
    await user.clear(slugField);
    await user.type(slugField, 'beacon');
    await user.type(nameField, ' Extra');
    expect(slugField).toHaveValue('beacon');
  });

  it('blocks save when required fields are empty', async () => {
    await signInAs('admin@apenterprises.test', 'AdminPass2026!');
    renderWithProviders(<Wrap />);
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: /add property/i }));
    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
  });

  afterAll(async () => {
    await signOutForTest();
  });
});
