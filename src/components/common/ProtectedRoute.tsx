import React from 'react';
import { useAuth, UserRole } from '../../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ 
  children, 
  requiredRole,
  fallback
}: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-sm text-zinc-400">Verifying role...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex items-center justify-center">
        <div className="max-w-md w-full p-8 bg-[#0C0C0E] rounded-2xl border border-zinc-800 text-center">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-red-400 text-xl">!</span>
          </div>
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-zinc-400 text-sm">Please sign in to access this page.</p>
        </div>
      </div>
    );
  }

  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!roles.includes(role as UserRole)) {
      if (fallback) return <>{fallback}</>;
      const correctDashboard = role === 'super_admin' ? 'Super Admin Dashboard' : 'Institution Dashboard';
      return (
        <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex items-center justify-center">
          <div className="max-w-md w-full p-8 bg-[#0C0C0E] rounded-2xl border border-zinc-800 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-amber-400 text-xl">!</span>
            </div>
            <h2 className="text-xl font-bold mb-2">Unauthorized Access</h2>
            <p className="text-zinc-400 text-sm">
              You do not have permission to access this area. 
              Redirecting to {correctDashboard}...
            </p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}