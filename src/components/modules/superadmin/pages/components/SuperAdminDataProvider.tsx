import React, { createContext, useContext } from 'react';
import { useSupabaseData, InstitutionRequest, SupabaseInstitution, AuditLog, PlatformNotification, GlobalSearchResult, ApprovalResult, ApprovalCredentials, ApprovalDraft } from '../../../../../hooks/useSupabaseData';

export interface SuperAdminContextType {
  institutionRequests: InstitutionRequest[];
  approvedInstitutions: SupabaseInstitution[];
  loading: boolean;
  error: string | null;
  isRealtime: boolean;
  totalStudents: number;
  totalOrders: number;
  totalVendors: number;
  totalRevenue: number;
  auditLogs: AuditLog[];
  notifications: PlatformNotification[];
  unreadCount: number;
  prepareApproval: (id: string) => Promise<ApprovalDraft>;
  approveRequest: (id: string, credentials?: ApprovalCredentials) => Promise<ApprovalResult>;
  rejectRequest: (id: string, reason?: string) => Promise<void>;
  requestChanges: (id: string, notes: string) => Promise<void>;
  disableInstitution: (id: string) => Promise<void>;
  suspendInstitution: (id: string) => Promise<void>;
  activateInstitution: (id: string) => Promise<void>;
  deleteInstitution: (id: string) => Promise<void>;
  updateInstitution: (id: string, updates: Partial<SupabaseInstitution>) => Promise<void>;
  editRequest: (id: string, updates: Partial<InstitutionRequest>) => Promise<void>;
  createAuditLog: (action: string, target: string, targetId?: string, details?: string) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  globalSearch: (term: string) => Promise<GlobalSearchResult[]>;
  refresh: () => void;
}

const SuperAdminDataContext = createContext<SuperAdminContextType | null>(null);

export const useSuperAdminData = () => {
  const ctx = useContext(SuperAdminDataContext);
  if (!ctx) throw new Error('useSuperAdminData must be used within SuperAdminDataProvider');
  return ctx;
};

export const SuperAdminDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const data = useSupabaseData();
  return (
    <SuperAdminDataContext.Provider value={data}>
      {children}
    </SuperAdminDataContext.Provider>
  );
};
