import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

export type UserRole = 'institution_admin' | 'super_admin';

export interface AuthState {
  user: User | null;
  role: UserRole | null;
  institutionId: string | null;
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
  loading: true,
  error: null,
  signIn: async () => null,
  signOut: async () => {},
  verifySession: async () => false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    role: null,
    institutionId: null,
    loading: true,
    error: null,
  });

  const syncAuth = useCallback(async (user: User | null) => {
    if (!user) {
      setState({ user: null, role: null, institutionId: null, loading: false, error: null });
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, institution_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (profileError || !profile) {
      setState({ user: null, role: null, institutionId: null, loading: false, error: 'Your profile was not found. Please contact FOODEXA Support.' });
      await supabase.auth.signOut();
      return;
    }

    const dbRole = profile.role as UserRole;

    if (dbRole === 'super_admin') {
      setState({
        user,
        role: 'super_admin',
        institutionId: null,
        loading: false,
        error: null,
      });
      return;
    }

    if (dbRole !== 'institution_admin') {
      setState({ user: null, role: null, institutionId: null, loading: false, error: 'You do not have permission to access the Institution Dashboard.' });
      await supabase.auth.signOut();
      return;
    }

    if (!profile.institution_id) {
      setState({ user: null, role: null, institutionId: null, loading: false, error: 'No institution has been assigned to your account.' });
      await supabase.auth.signOut();
      return;
    }

    const { data: institution, error: instError } = await supabase
      .from('institutions')
      .select('id')
      .eq('id', profile.institution_id)
      .single();

    if (instError || !institution) {
      setState({ user: null, role: null, institutionId: null, loading: false, error: 'The linked institution could not be found.' });
      await supabase.auth.signOut();
      return;
    }

    setState({
      user,
      role: 'institution_admin',
      institutionId: profile.institution_id,
      loading: false,
      error: null,
    });
  }, []);

  const verifySession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        setState({ user: null, role: null, institutionId: null, loading: false, error: 'No active session' });
        return false;
      }
      await syncAuth(session.user);
      return true;
    } catch (error) {
      console.error('[Auth] Session verification error:', error);
      setState({ user: null, role: null, institutionId: null, loading: false, error: 'Session verification failed' });
      return false;
    }
  }, [syncAuth]);

  useEffect(() => {
    void verifySession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (_event === 'SIGNED_OUT') {
        setState({ user: null, role: null, institutionId: null, loading: false, error: null });
      } else if (session) {
        syncAuth(session.user);
      }
    });

    return () => listener?.subscription.unsubscribe();
  }, [syncAuth, verifySession]);

  const signIn = async (email: string, password: string): Promise<string | null> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setState((prev) => ({ ...prev, loading: false, error: error.message }));
      return error.message;
    }
    await syncAuth(data.user);
    return null;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setState({ user: null, role: null, institutionId: null, loading: false, error: null });
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
