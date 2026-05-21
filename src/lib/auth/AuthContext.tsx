import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../supabase';
import type { ProfileRow } from '../types/db';

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

export interface AuthContextValue {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  profile: ProfileRow | null;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  changePassword: (newPassword: string) => Promise<{ error?: string }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function loadProfile(userId: string): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) {
    console.error('[auth] profile load failed', error.message);
    return null;
  }
  return data ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const mounted = useRef(true);

  const applySession = useCallback(async (next: Session | null) => {
    if (!mounted.current) return;
    setSession(next);
    if (!next) {
      setProfile(null);
      setStatus('anonymous');
      return;
    }
    const p = await loadProfile(next.user.id);
    if (!mounted.current) return;
    setProfile(p);
    setStatus('authenticated');
  }, []);

  useEffect(() => {
    mounted.current = true;
    supabase.auth.getSession().then(({ data }) => applySession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      applySession(next);
    });
    return () => {
      mounted.current = false;
      sub.subscription.unsubscribe();
    };
  }, [applySession]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return {};
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const changePassword = useCallback(async (newPassword: string) => {
    const { error: updErr } = await supabase.auth.updateUser({ password: newPassword });
    if (updErr) return { error: updErr.message };
    if (session?.user) {
      const { error: profErr } = await supabase
        .from('profiles')
        .update({ must_change_password: false })
        .eq('id', session.user.id);
      if (profErr) return { error: profErr.message };
      const refreshed = await loadProfile(session.user.id);
      if (mounted.current) setProfile(refreshed);
    }
    return {};
  }, [session]);

  const refreshProfile = useCallback(async () => {
    if (!session?.user) return;
    const p = await loadProfile(session.user.id);
    if (mounted.current) setProfile(p);
  }, [session]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      session,
      user: session?.user ?? null,
      profile,
      signIn,
      signOut,
      changePassword,
      refreshProfile,
    }),
    [status, session, profile, signIn, signOut, changePassword, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
