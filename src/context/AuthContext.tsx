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

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('user_profiles')
      .select('role, institution_id')
      .eq('id', userId)
      .single();
    return data;
  }, []);

  const syncAuth = useCallback(async (user: User | null) => {
    if (!user) {
      setState({ user: null, role: null, institutionId: null, loading: false, error: null });
      return;
    }
    const profile = await fetchProfile(user.id);
    const dbRole = profile?.role as UserRole;
    
    // Read preference from login screen
    const storedPref = localStorage.getItem('foodexa_role_preference') as UserRole | null;
    
    // Fallback logic if user_profiles doesn't exist or has no role
    let finalRole: UserRole = dbRole;
    if (!finalRole) {
      if (storedPref === 'super_admin' || user.email === 'youngholyspiritteam@gmail.com') {
        finalRole = 'super_admin';
      } else {
        finalRole = 'institution_admin';
      }
    }

    setState({
      user,
      role: finalRole,
      institutionId: profile?.institution_id || null,
      loading: false,
      error: null,
    });
  }, [fetchProfile]);

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
