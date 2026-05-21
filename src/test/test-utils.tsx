import { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../lib/auth';
import { supabase } from '../lib/supabase';

interface ProviderOptions {
  /** Initial route for MemoryRouter. Default '/'. */
  route?: string;
  /** Wrap in AuthProvider. Default true. */
  withAuth?: boolean;
}

export function renderWithProviders(
  ui: ReactElement,
  { route = '/', withAuth = true, ...renderOptions }: ProviderOptions & Omit<RenderOptions, 'wrapper'> = {},
) {
  function Wrapper({ children }: { children: ReactNode }) {
    const router = <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>;
    return withAuth ? <AuthProvider>{router}</AuthProvider> : router;
  }
  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * Sign in via the real (MSW-backed) auth flow. Returns when the session is
 * persisted, so an AuthProvider that mounts afterwards will resolve to
 * `authenticated` immediately.
 */
export async function signInAs(email: string, password: string) {
  await supabase.auth.signOut().catch(() => undefined);
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Test sign-in failed: ${error.message}`);
}

/** Force a clean session between tests that share a render context. */
export async function signOutForTest() {
  await supabase.auth.signOut().catch(() => undefined);
}
