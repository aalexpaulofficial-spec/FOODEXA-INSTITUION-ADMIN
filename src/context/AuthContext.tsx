import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

export type UserRole = 'institution_admin' | 'super_admin';

export interface AuthState {
  user: User | null;
  role: UserRole | null;
  institutionId: string | null;
  fullName: string | null;
  email: string | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  verifySession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  institutionId: null,
  fullName: null,
  email: null,
  loading: true,
  error: null,
  signIn: async () => null,
  signOut: async () => {},
  verifySession: async () => false,
});

const AUTH_TIMEOUT_MS = 10000;

function withTimeout<T>(promise: PromiseLike<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    role: null,
    institutionId: null,
    fullName: null,
    email: null,
    loading: true,
    error: null,
  });

  const initialSessionHandled = useRef(false);

  const syncAuth = useCallback(async (user: User | null) => {
    if (!user) {
      setState({ user: null, role: null, institutionId: null, fullName: null, email: null, loading: false, error: null });
      return;
    }

    try {
      const { data: profile, error: profileError } = await withTimeout(
        supabase
          .from('profiles')
          .select('role, institution_id, full_name, email')
          .eq('user_id', user.id)
          .limit(1)
          .single(),
        AUTH_TIMEOUT_MS,
        'Profile fetch'
      );

      if (profileError || !profile) {
        console.error('[Auth] Profile not found for user:', user.id, profileError);
        setState({ user: null, role: null, institutionId: null, fullName: null, email: null, loading: false, error: 'Profile not found. Please contact FOODEXA Support.' });
        await supabase.auth.signOut();
        return;
      }

      const dbRole = profile.role as UserRole;
      const dbFullName = profile.full_name || '';
      const dbEmail = profile.email || user.email || '';

      if (dbRole === 'super_admin') {
        setState({
          user,
          role: 'super_admin',
          institutionId: null,
          fullName: dbFullName,
          email: dbEmail,
          loading: false,
          error: null,
        });
        return;
      }

      if (dbRole !== 'institution_admin') {
        setState({ user: null, role: null, institutionId: null, fullName: null, email: null, loading: false, error: 'Access denied. You do not have permission to access the Institution Dashboard.' });
        await supabase.auth.signOut();
        return;
      }

      if (!profile.institution_id) {
        setState({ user: null, role: null, institutionId: null, fullName: null, email: null, loading: false, error: 'No institution has been assigned to your account.' });
        await supabase.auth.signOut();
        return;
      }

      const { data: institution, error: instError } = await withTimeout(
        supabase
          .from('institutions')
          .select('id')
          .eq('id', profile.institution_id)
          .single(),
        AUTH_TIMEOUT_MS,
        'Institution fetch'
      );

      if (instError || !institution) {
        console.error('[Auth] Institution not found:', profile.institution_id, instError);
        setState({ user: null, role: null, institutionId: null, fullName: null, email: null, loading: false, error: 'Institution not found. Please contact FOODEXA Support.' });
        await supabase.auth.signOut();
        return;
      }

      setState({
        user,
        role: 'institution_admin',
        institutionId: profile.institution_id,
        fullName: dbFullName,
        email: dbEmail,
        loading: false,
        error: null,
      });
    } catch (err) {
      console.error('[Auth] syncAuth error:', err);
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      setState({ user: null, role: null, institutionId: null, fullName: null, email: null, loading: false, error: msg });
    }
  }, []);

  const verifySession = useCallback(async (): Promise<boolean> => {
    try {
      const { data: { session }, error } = await withTimeout(
        supabase.auth.getSession(),
        AUTH_TIMEOUT_MS,
        'Session fetch'
      );
      if (error || !session) {
        setState({ user: null, role: null, institutionId: null, fullName: null, email: null, loading: false, error: null });
        return false;
      }
      await syncAuth(session.user);
      return true;
    } catch (err) {
      console.error('[Auth] Session verification error:', err);
      setState({ user: null, role: null, institutionId: null, fullName: null, email: null, loading: false, error: 'Session verification failed. Please try again.' });
      return false;
    }
  }, [syncAuth]);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      await verifySession();
      if (!cancelled) {
        initialSessionHandled.current = true;
      }
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;

      if (event === 'SIGNED_OUT') {
        initialSessionHandled.current = false;
        setState({ user: null, role: null, institutionId: null, fullName: null, email: null, loading: false, error: null });
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          syncAuth(session.user);
        }
      } else if (event === 'INITIAL_SESSION') {
        if (!initialSessionHandled.current && session?.user) {
          syncAuth(session.user);
        }
      }
    });

    return () => {
      cancelled = true;
      listener?.subscription.unsubscribe();
    };
  }, [syncAuth, verifySession]);

  const signIn = async (email: string, password: string): Promise<string | null> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setState((prev) => ({ ...prev, loading: false, error: error.message }));
        return error.message;
      }
      await syncAuth(data.user);
      return null;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign in failed';
      setState((prev) => ({ ...prev, loading: false, error: msg }));
      return msg;
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      initialSessionHandled.current = false;
      setState({ user: null, role: null, institutionId: null, fullName: null, email: null, loading: false, error: null });
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, signIn, signOut, verifySession }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

export function useRequireAuth(requiredRole: UserRole | UserRole[]) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return false;
  }

  if (!user) {
    return false;
  }

  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(role as UserRole);
  }

  return role === requiredRole;
}
