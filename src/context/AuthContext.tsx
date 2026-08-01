import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
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

const AUTH_TIMEOUT_MS = 20000;
const PROFILE_RETRIES = 2;
const PROFILE_RETRY_DELAY_MS = 500;
const REFRESH_BEFORE_EXPIRY_MS = 60 * 1000;

function withTimeout<T>(promise: PromiseLike<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

interface ProfileRow {
  role: string | null;
  institution_id: string | null;
  full_name: string | null;
  email: string | null;
}

const EMPTY_STATE: Omit<AuthState, 'loading'> = {
  user: null,
  role: null,
  institutionId: null,
  fullName: null,
  email: null,
  error: null,
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    ...EMPTY_STATE,
    loading: true,
  });

  const initialSessionHandled = useRef(false);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearState = useCallback((loading = false) => {
    setState({ ...EMPTY_STATE, loading });
  }, []);

  const scheduleSessionRefresh = useCallback((session: Session | null) => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    const expiresAt = session?.expires_at;
    if (!expiresAt) return;

    const expiresInMs = expiresAt * 1000 - Date.now();
    const delayMs = Math.max(0, expiresInMs - REFRESH_BEFORE_EXPIRY_MS);

    refreshTimerRef.current = setTimeout(async () => {
      try {
        const { data, error } = await supabase.auth.refreshSession();
        if (error) {
          console.warn('[Auth] Proactive refresh failed:', error.message);
        }
        if (data.session) {
          scheduleSessionRefresh(data.session);
        }
      } catch (err) {
        console.warn('[Auth] Proactive refresh error:', err);
      }
    }, delayMs);
  }, []);

  // Refresh the session when the tab becomes visible again so background-tab
  // throttling never lets the access token expire while a user is active.
  useEffect(() => {
    const onVisibility = async () => {
      if (document.visibilityState !== 'visible') return;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const expiresInMs = (session.expires_at || 0) * 1000 - Date.now();
      if (expiresInMs < 5 * 60 * 1000) {
        const { error } = await supabase.auth.refreshSession();
        if (error) console.warn('[Auth] Visibility refresh failed:', error.message);
      }
      scheduleSessionRefresh(session);
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onVisibility);
    };
  }, [scheduleSessionRefresh]);

  const resolveAuthState = useCallback(
    async (user: User, opts: { force?: boolean } = {}): Promise<void> => {
      if (!user) {
        clearState();
        return;
      }

      // On TOKEN_REFRESHED we already have a valid role/institution for this
      // user. Do not re-query the DB (and risk a forced logout on a transient
      // network blip) - just refresh the user object.
      if (!opts.force) {
        const hadValidState = state.role && state.user?.id === user.id && !state.loading;
        if (hadValidState) {
          setState((prev) => (prev.user?.id === user.id ? { ...prev, user } : prev));
          return;
        }
      }

      const fetchProfile = async (attempt: number): Promise<ProfileRow | null> => {
        try {
          const { data, error } = await withTimeout(
            supabase
              .from('profiles')
              .select('role, institution_id, full_name, email')
              .eq('user_id', user.id)
              .limit(1)
              .maybeSingle(),
            AUTH_TIMEOUT_MS,
            'Profile fetch'
          );
          if (error || !data) {
            if (attempt < PROFILE_RETRIES) {
              await new Promise((r) => setTimeout(r, PROFILE_RETRY_DELAY_MS));
              return fetchProfile(attempt + 1);
            }
            return null;
          }
          return (data as unknown) as ProfileRow;
        } catch {
          if (attempt < PROFILE_RETRIES) {
            await new Promise((r) => setTimeout(r, PROFILE_RETRY_DELAY_MS));
            return fetchProfile(attempt + 1);
          }
          return null;
        }
      };

      const profile = await fetchProfile(0);
      if (!profile || !profile.role) {
        // Never destroy a valid session on a transient profile failure. If we
        // already have a loaded state for this user, keep it so the dashboard
        // stays usable; otherwise surface a recoverable error screen.
        if (state.user?.id === user.id && state.role) {
          setState((prev) => ({ ...prev, user }));
          return;
        }
        console.error('[Auth] Profile not found for user:', user.id);
        setState({
          ...EMPTY_STATE,
          user,
          loading: false,
          error: 'Profile not found. Please contact FOODEXA Support.',
        });
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
        console.warn('[Auth] Non-admin role attempted access:', dbRole);
        setState({
          ...EMPTY_STATE,
          user,
          loading: false,
          error: 'Access denied. You do not have permission to access the Institution Dashboard.',
        });
        return;
      }

      if (!profile.institution_id) {
        console.warn('[Auth] institution_admin without institution_id:', user.id);
        setState({
          ...EMPTY_STATE,
          user,
          loading: false,
          error: 'No institution has been assigned to your account.',
        });
        return;
      }

      let institutionId: string | null = profile.institution_id;
      try {
        const { data: institution, error: instError } = await withTimeout(
          supabase.from('institutions').select('id').eq('id', profile.institution_id).single(),
          AUTH_TIMEOUT_MS,
          'Institution fetch'
        );
        if (instError || !institution) {
          console.error('[Auth] Institution not found:', profile.institution_id, instError);
        } else {
          institutionId = (institution as { id: string }).id;
        }
      } catch (err) {
        console.error('[Auth] Institution fetch error:', err);
      }

      setState({
        user,
        role: 'institution_admin',
        institutionId,
        fullName: dbFullName,
        email: dbEmail,
        loading: false,
        error: null,
      });
    },
    [state.role, state.user, state.loading, clearState]
  );

  const verifySession = useCallback(async (): Promise<boolean> => {
    try {
      const { data: { session }, error } = await withTimeout(
        supabase.auth.getSession(),
        AUTH_TIMEOUT_MS,
        'Session fetch'
      );
      if (error) {
        console.error('[Auth] getSession error:', error);
        return false;
      }
      if (!session?.user) {
        clearState();
        return false;
      }
      scheduleSessionRefresh(session);
      await resolveAuthState(session.user, { force: true });
      return true;
    } catch (err) {
      console.error('[Auth] Session verification error:', err);
      // Transient failure - keep the current state if we have one; otherwise
      // retry instead of tearing down a valid session.
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await resolveAuthState(session.user, { force: true });
        return true;
      }
      clearState();
      return false;
    }
  }, [resolveAuthState, scheduleSessionRefresh, clearState]);

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
        clearState();
        return;
      }

      if (event === 'TOKEN_REFRESHED') {
        scheduleSessionRefresh(session);
        if (session?.user) {
          resolveAuthState(session.user);
        }
        return;
      }

      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'USER_UPDATED') {
        if (event === 'INITIAL_SESSION' && initialSessionHandled.current) return;
        if (session?.user) {
          scheduleSessionRefresh(session);
          resolveAuthState(session.user, { force: true });
        }
      }
    });

    return () => {
      cancelled = true;
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      listener?.subscription.unsubscribe();
    };
  }, [verifySession, resolveAuthState, scheduleSessionRefresh, clearState]);

  const signIn = async (email: string, password: string): Promise<string | null> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setState((prev) => ({ ...prev, loading: false, error: error.message }));
        return error.message;
      }
      const session = data.session || (await supabase.auth.getSession()).data.session;
      if (session) scheduleSessionRefresh(session);
      await resolveAuthState(data.user, { force: true });
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
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
      clearState();
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
