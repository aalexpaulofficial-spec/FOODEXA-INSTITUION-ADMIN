import { useState, useEffect, useCallback } from 'react';
import { supabase, supabaseAdmin } from '../lib/supabaseClient';

// ---------------------------------------------------------------
// Types for Supabase rows
// ---------------------------------------------------------------
export interface InstitutionRequest {
  id: string;
  institution_name: string;
  campus?: string;
  city?: string;
  state?: string;
  country?: string;
  institution_email: string;
  contact_person: string;
  role?: string;
  phone_number?: string;
  institution_website?: string;
  student_population?: string;
  food_courts_count?: string;
  vendors_count?: string;
  message?: string;
  status: 'pending' | 'active' | 'rejected' | 'suspended' | 'changes_requested' | 'disabled';
  created_at: string;
  plan?: 'Basic' | 'Pro' | 'Enterprise';
  rejection_reason?: string;
  admin_notes?: string;
  institution_code?: string;
}

export interface SupabaseInstitution {
  id: string;
  name: string;
  code?: string;
  students_count?: number;
  vendors_count?: number;
  daily_orders_count?: number;
  monthly_revenue?: number;
  status: 'active' | 'pending_approval' | 'suspended' | 'disabled';
  contact_person?: string;
  email?: string;
  phone?: string;
  joined_date?: string;
  plan?: 'Basic' | 'Pro' | 'Enterprise';
  logo_url?: string;
  type?: string;
  created_at?: string;
  last_login?: string;
  campus?: string;
  city?: string;
  state?: string;
  country?: string;
  institution_website?: string;
  student_population?: number;
  food_courts_count?: number;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  user_name: string;
  action: string;
  target: string;
  target_id?: string;
  details?: string;
  ip_address: string;
  created_at: string;
}

export interface PlatformNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  created_at: string;
}

export interface GlobalSearchResult {
  type: 'institution' | 'request' | 'student' | 'vendor';
  id: string;
  name: string;
  subtitle: string;
  status?: string;
}

export interface ApprovalResult {
  institution_name: string;
  institution_code: string;
  login_email: string;
  temp_password: string;
  approved_at: string;
}

interface UseSupabaseDataReturn {
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
  approveRequest: (id: string) => Promise<ApprovalResult | null>;
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

const REQUESTS_TABLE = 'institution_requests';
const INSTITUTIONS_TABLE = 'institutions';
const STUDENTS_TABLE = 'students';
const ORDERS_TABLE = 'orders';
const VENDORS_TABLE = 'vendors';
const AUDIT_LOGS_TABLE = 'platform_audit_logs';
const NOTIFICATIONS_TABLE = 'platform_notifications';

export function useSupabaseData(): UseSupabaseDataReturn {
  const [institutionRequests, setInstitutionRequests] = useState<InstitutionRequest[]>([]);
  const [approvedInstitutions, setApprovedInstitutions] = useState<SupabaseInstitution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRealtime, setIsRealtime] = useState(false);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalVendors, setTotalVendors] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [notifications, setNotifications] = useState<PlatformNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // ---------------------------------------------------------------
  // Audit Log Helper
  // ---------------------------------------------------------------
  const createAuditLog = useCallback(async (action: string, target: string, targetId?: string, details?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabaseAdmin.from(AUDIT_LOGS_TABLE).insert({
        user_id: user?.id || 'system',
        user_name: user?.email || 'System',
        action,
        target,
        target_id: targetId || null,
        details: details || null,
        ip_address: 'web-client',
      });
    } catch {
      // silently fail - audit logs are non-critical
    }
  }, []);

  // ---------------------------------------------------------------
  // Fetch all data
  // ---------------------------------------------------------------
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch institution requests
      const { data: requests, error: reqErr } = await supabaseAdmin
        .from(REQUESTS_TABLE)
        .select('*')
        .order('created_at', { ascending: false });

      if (reqErr) {
        if (reqErr.code === '42P01') {
          setError(`Table "${REQUESTS_TABLE}" not found in Supabase. Please create it first.`);
        } else {
          setError(reqErr.message);
        }
        setLoading(false);
        return;
      }
      setInstitutionRequests((requests as InstitutionRequest[]) || []);

      // Fetch approved institutions
      const { data: institutions, error: instErr } = await supabaseAdmin
        .from(INSTITUTIONS_TABLE)
        .select('*')
        .order('created_at', { ascending: false });

      if (!instErr) {
        setApprovedInstitutions((institutions as SupabaseInstitution[]) || []);
      }

      // Fetch total counts in parallel
      const [studentRes, orderRes, vendorRes] = await Promise.all([
        supabaseAdmin.from(STUDENTS_TABLE).select('id', { count: 'exact', head: true }),
        supabaseAdmin.from(ORDERS_TABLE).select('id', { count: 'exact', head: true }),
        supabaseAdmin.from(VENDORS_TABLE).select('id', { count: 'exact', head: true }),
      ]);

      setTotalStudents(studentRes.count || 0);
      setTotalOrders(orderRes.count || 0);
      setTotalVendors(vendorRes.count || 0);

      // Calculate total revenue from institutions
      const insts = (institutions as SupabaseInstitution[]) || [];
      const revenue = insts.reduce((sum, inst) => sum + (inst.monthly_revenue || 0), 0);
      setTotalRevenue(revenue);

      // Fetch audit logs
      const { data: logs } = await supabaseAdmin
        .from(AUDIT_LOGS_TABLE)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      setAuditLogs((logs as AuditLog[]) || []);

      // Fetch notifications
      const { data: notifs } = await supabaseAdmin
        .from(NOTIFICATIONS_TABLE)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      setNotifications((notifs as PlatformNotification[]) || []);
      setUnreadCount(((notifs as PlatformNotification[]) || []).filter((n) => !n.read).length);

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error fetching data');
    } finally {
      setLoading(false);
    }
  }, []);

  // ---------------------------------------------------------------
  // Real-time subscription
  // ---------------------------------------------------------------
  useEffect(() => {
    fetchAll();

    const channel = supabase
      .channel('super_admin_realtime_v2')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: REQUESTS_TABLE },
        () => fetchAll()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: INSTITUTIONS_TABLE },
        () => fetchAll()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: STUDENTS_TABLE },
        () => fetchAll()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: ORDERS_TABLE },
        () => fetchAll()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: VENDORS_TABLE },
        () => fetchAll()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: NOTIFICATIONS_TABLE },
        () => fetchAll()
      )
      .subscribe((status) => {
        setIsRealtime(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAll]);

  // ---------------------------------------------------------------
  // Generate secure temporary password (10-12 chars)
  // ---------------------------------------------------------------
  const generateTempPassword = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    const length = 10 + Math.floor(Math.random() * 3);
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  // ---------------------------------------------------------------
  // Generate institution code
  // Format: First 6 letters (uppercase, no spaces/special) + Year(last 2) + Random 4-digit
  // ---------------------------------------------------------------
  const generateInstitutionCode = async (name: string): Promise<string> => {
    const prefix = name.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 6);
    if (!prefix) return `INST${new Date().getFullYear().toString().slice(-2)}${String(Math.floor(1000 + Math.random() * 9000))}`;

    const year = new Date().getFullYear().toString().slice(-2);

    for (let attempt = 0; attempt < 20; attempt++) {
      const random = String(Math.floor(1000 + Math.random() * 9000));
      const code = `${prefix}${year}${random}`;

      const [reqRes, instRes] = await Promise.all([
        supabaseAdmin.from(REQUESTS_TABLE).select('id').eq('institution_code', code).maybeSingle(),
        supabaseAdmin.from(INSTITUTIONS_TABLE).select('id').eq('code', code).maybeSingle(),
      ]);

      if (!reqRes.data && !instRes.data) return code;
    }

    return `${prefix}${year}${String(Math.floor(1000 + Math.random() * 9000))}`;
  };

  // ---------------------------------------------------------------
  // Approve a request: full workflow
  // ---------------------------------------------------------------
  const approveRequest = async (id: string): Promise<ApprovalResult | null> => {
    const request = institutionRequests.find((r) => r.id === id);
    if (!request) return null;

    const institutionCode = await generateInstitutionCode(request.institution_name);
    const tempPassword = generateTempPassword();
    const approvedAt = new Date().toISOString();

    try {
      const { data: { user: adminUser } } = await supabase.auth.getUser();

      // Step 1: Create auth user for institution admin
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: request.institution_email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          role: 'institution_admin',
          institution_name: request.institution_name,
        },
      });

      if (authError || !authData.user) {
        console.error('[Auth] Failed to create user:', authError?.message);
        return null;
      }

      // Step 2: Insert institution record
      const institutionRecord = {
        name: request.institution_name,
        code: institutionCode,
        email: request.institution_email,
        contact_person: request.contact_person,
        phone: request.phone_number,
        status: 'active',
        plan: request.plan || 'Basic',
        joined_date: approvedAt.split('T')[0],
        students_count: parseInt(request.student_population || '0', 10) || 0,
        vendors_count: parseInt(request.vendors_count || '0', 10) || 0,
        type: 'Institution',
        campus: request.campus || null,
        city: request.city || null,
        state: request.state || null,
        country: request.country || null,
        institution_website: request.institution_website || null,
        food_courts_count: parseInt(request.food_courts_count || '0', 10) || 0,
      };

      const { data: instData, error: instError } = await supabaseAdmin
        .from(INSTITUTIONS_TABLE)
        .insert(institutionRecord)
        .select('id')
        .single();

      if (instError) {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        console.error('[Supabase] Institution insert error:', instError.message);
        return null;
      }

      // Step 3: Create user profile
      const { error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          role: 'institution_admin',
          institution_id: instData.id,
        });

      if (profileError) {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        await supabaseAdmin.from(INSTITUTIONS_TABLE).delete().eq('id', instData.id);
        console.error('[Supabase] Profile insert error:', profileError.message);
        return null;
      }

      // Step 4: Update request status
      const { error: updateErr } = await supabaseAdmin
        .from(REQUESTS_TABLE)
        .update({
          status: 'active',
          institution_code: institutionCode,
        })
        .eq('id', id);

      if (updateErr) {
        console.error('[Supabase] Request update error:', updateErr.message);
      }

      // Step 5: Send onboarding email via edge function
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        const portalUrl = 'https://foodexa-institution-platform.vercel.app';

        await fetch(`${supabaseUrl}/functions/v1/approve-institution`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({
            institution_name: request.institution_name,
            institution_email: request.institution_email,
            institution_code: institutionCode,
            login_email: request.institution_email,
            temp_password: tempPassword,
            portal_url: portalUrl,
            contact_person: request.contact_person,
            first_login_instructions: 'Please log in using the credentials above. You will be prompted to change your password on first login.',
            password_change_reminder: 'For security, please change your temporary password after your first login.',
          }),
        });
      } catch (emailErr) {
        console.error('[Email] Failed to send approval email:', emailErr);
      }

      // Step 6: Create audit log
      await createAuditLog(
        'Institution Approved',
        request.institution_name,
        id,
        `Code: ${institutionCode} | Approved by: ${adminUser?.email || 'Super Admin'}`
      );

      // Step 7: Create notification
      await supabaseAdmin.from(NOTIFICATIONS_TABLE).insert({
        title: 'Institution Approved',
        message: `${request.institution_name} has been approved and activated on the platform. Code: ${institutionCode}`,
        type: 'success',
        read: false,
      });

      // Optimistic UI update
      setInstitutionRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 'active', institution_code: institutionCode } : r))
      );

      return {
        institution_name: request.institution_name,
        institution_code: institutionCode,
        login_email: request.institution_email,
        temp_password: tempPassword,
        approved_at: approvedAt,
      };
    } catch (err) {
      console.error('[Approve] Unexpected error:', err);
      return null;
    }
  };

  // ---------------------------------------------------------------
  // Reject a request with reason
  // ---------------------------------------------------------------
  const rejectRequest = async (id: string, reason?: string) => {
    const request = institutionRequests.find((r) => r.id === id);
    if (!request) return;

    const { error: updateErr } = await supabaseAdmin
      .from(REQUESTS_TABLE)
      .update({
        status: 'rejected',
        rejection_reason: reason || null,
      })
      .eq('id', id);

    if (updateErr) {
      console.error('[Supabase] Reject error:', updateErr.message);
      return;
    }

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      await fetch(`${supabaseUrl}/functions/v1/send-rejection-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          institution_name: request.institution_name,
          institution_email: request.institution_email,
          rejection_reason: reason || 'No specific reason provided.',
        }),
      });
    } catch (emailErr) {
      console.error('[Email] Failed to send rejection email:', emailErr);
    }

    await createAuditLog('Institution Rejected', request.institution_name, id, reason || 'No reason provided');

    await supabaseAdmin.from(NOTIFICATIONS_TABLE).insert({
      title: 'Institution Rejected',
      message: `${request.institution_name} registration has been rejected.${reason ? ` Reason: ${reason}` : ''}`,
      type: 'warning',
      read: false,
    });

    setInstitutionRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'rejected', rejection_reason: reason } : r))
    );
  };

  const sendChangesEmailNotification = async (institutionName: string, institutionEmail: string, notes: string) => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      await fetch(`${supabaseUrl}/functions/v1/send-rejection-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          institution_name: institutionName,
          institution_email: institutionEmail,
          rejection_reason: `Changes requested: ${notes}. Please resubmit your registration with the requested changes.`,
        }),
      });
    } catch (emailErr) {
      console.error('[Email] Failed to send changes-requested email:', emailErr);
    }
  };

  // ---------------------------------------------------------------
  // Disable an institution (blocks login until re-enabled)
  // ---------------------------------------------------------------
  const disableInstitution = async (id: string) => {
    const inst = approvedInstitutions.find((i) => i.id === id);
    await supabaseAdmin.from(INSTITUTIONS_TABLE).update({ status: 'disabled' }).eq('id', id);

    // Also update the original request status
    const request = institutionRequests.find((r) => r.institution_code === inst?.code);
    if (request) {
      await supabaseAdmin.from(REQUESTS_TABLE).update({ status: 'disabled' }).eq('id', request.id);
    }

    await createAuditLog('Institution Disabled', inst?.name || id, id);
    await supabaseAdmin.from(NOTIFICATIONS_TABLE).insert({
      title: 'Institution Disabled',
      message: `${inst?.name || 'An institution'} has been disabled. Admin can no longer log in.`,
      type: 'warning',
      read: false,
    });

    setApprovedInstitutions((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: 'disabled' } : i))
    );
    setInstitutionRequests((prev) =>
      prev.map((r) => (r.institution_code === inst?.code ? { ...r, status: 'disabled' as const } : r))
    );
  };

  // ---------------------------------------------------------------
  // Request changes
  // ---------------------------------------------------------------
  const requestChanges = async (id: string, notes: string) => {
    const request = institutionRequests.find((r) => r.id === id);
    if (!request) return;

    const { error: updateErr } = await supabaseAdmin
      .from(REQUESTS_TABLE)
      .update({
        status: 'changes_requested',
        admin_notes: notes,
      })
      .eq('id', id);

    if (updateErr) {
      console.error('[Supabase] Request changes error:', updateErr.message);
      return;
    }

    await sendChangesEmailNotification(request.institution_name, request.institution_email, notes);

    await createAuditLog('Changes Requested', request.institution_name, id, notes);

    await supabaseAdmin.from(NOTIFICATIONS_TABLE).insert({
      title: 'Changes Requested',
      message: `Changes requested for ${request.institution_name}: ${notes}`,
      type: 'info',
      read: false,
    });

    setInstitutionRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'changes_requested', admin_notes: notes } : r))
    );
  };

  // ---------------------------------------------------------------
  // Edit a request (admin can update details before approval)
  // ---------------------------------------------------------------
  const editRequest = async (id: string, updates: Partial<InstitutionRequest>) => {
    const request = institutionRequests.find((r) => r.id === id);
    if (!request) return;

    const { error } = await supabaseAdmin.from(REQUESTS_TABLE).update(updates).eq('id', id);
    if (error) {
      console.error('[Supabase] Edit request error:', error.message);
      return;
    }

    await createAuditLog('Request Edited', request.institution_name, id, JSON.stringify(updates));

    setInstitutionRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
  };

  // ---------------------------------------------------------------
  // Suspend institution
  // ---------------------------------------------------------------
  const suspendInstitution = async (id: string) => {
    const inst = approvedInstitutions.find((i) => i.id === id);
    await supabaseAdmin.from(INSTITUTIONS_TABLE).update({ status: 'suspended' }).eq('id', id);

    await createAuditLog('Institution Suspended', inst?.name || id, id);
    await supabaseAdmin.from(NOTIFICATIONS_TABLE).insert({
      title: 'Institution Suspended',
      message: `${inst?.name || 'An institution'} has been suspended.`,
      type: 'warning',
      read: false,
    });

    setApprovedInstitutions((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: 'suspended' } : i))
    );
  };

  // ---------------------------------------------------------------
  // Activate institution
  // ---------------------------------------------------------------
  const activateInstitution = async (id: string) => {
    const inst = approvedInstitutions.find((i) => i.id === id);
    await supabaseAdmin.from(INSTITUTIONS_TABLE).update({ status: 'active' }).eq('id', id);

    await createAuditLog('Institution Reactivated', inst?.name || id, id);
    await supabaseAdmin.from(NOTIFICATIONS_TABLE).insert({
      title: 'Institution Reactivated',
      message: `${inst?.name || 'An institution'} has been reactivated.`,
      type: 'success',
      read: false,
    });

    setApprovedInstitutions((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: 'active' } : i))
    );
  };

  // ---------------------------------------------------------------
  // Delete institution
  // ---------------------------------------------------------------
  const deleteInstitution = async (id: string) => {
    const inst = approvedInstitutions.find((i) => i.id === id);
    await supabaseAdmin.from(INSTITUTIONS_TABLE).delete().eq('id', id);

    await createAuditLog('Institution Deleted', inst?.name || id, id);
    await supabaseAdmin.from(NOTIFICATIONS_TABLE).insert({
      title: 'Institution Deleted',
      message: `${inst?.name || 'An institution'} has been permanently removed.`,
      type: 'error',
      read: false,
    });

    setApprovedInstitutions((prev) => prev.filter((i) => i.id !== id));
  };

  // ---------------------------------------------------------------
  // Update institution
  // ---------------------------------------------------------------
  const updateInstitution = async (id: string, updates: Partial<SupabaseInstitution>) => {
    const { error } = await supabaseAdmin.from(INSTITUTIONS_TABLE).update(updates).eq('id', id);
    if (error) {
      console.error('[Supabase] Update error:', error.message);
      return;
    }

    const inst = approvedInstitutions.find((i) => i.id === id);
    await createAuditLog('Institution Updated', inst?.name || id, id, JSON.stringify(updates));

    setApprovedInstitutions((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...updates } : i))
    );
  };

  // ---------------------------------------------------------------
  // Mark notification read
  // ---------------------------------------------------------------
  const markNotificationRead = async (id: string) => {
    await supabaseAdmin.from(NOTIFICATIONS_TABLE).update({ read: true }).eq('id', id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  // ---------------------------------------------------------------
  // Mark all notifications read
  // ---------------------------------------------------------------
  const markAllNotificationsRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;
    const ids = unread.map((n) => n.id);
    await supabaseAdmin.from(NOTIFICATIONS_TABLE).update({ read: true }).in('id', ids);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  // ---------------------------------------------------------------
  // Global Search
  // ---------------------------------------------------------------
  const globalSearch = async (term: string): Promise<GlobalSearchResult[]> => {
    if (!term || term.length < 2) return [];
    const q = term.toLowerCase();
    const results: GlobalSearchResult[] = [];

    // Search institutions
    approvedInstitutions.forEach((inst) => {
      if (
        inst.name?.toLowerCase().includes(q) ||
        inst.email?.toLowerCase().includes(q) ||
        inst.code?.toLowerCase().includes(q) ||
        inst.contact_person?.toLowerCase().includes(q) ||
        inst.phone?.toLowerCase().includes(q)
      ) {
        results.push({
          type: 'institution',
          id: inst.id,
          name: inst.name,
          subtitle: `${inst.code || 'N/A'} • ${inst.email || 'N/A'}`,
          status: inst.status,
        });
      }
    });

    // Search requests
    institutionRequests.forEach((req) => {
      if (
        req.institution_name?.toLowerCase().includes(q) ||
        req.institution_email?.toLowerCase().includes(q) ||
        req.contact_person?.toLowerCase().includes(q)
      ) {
        results.push({
          type: 'request',
          id: req.id,
          name: req.institution_name,
          subtitle: `${req.institution_email} • ${req.status}`,
          status: req.status,
        });
      }
    });

    return results.slice(0, 20);
  };

  return {
    institutionRequests,
    approvedInstitutions,
    loading,
    error,
    isRealtime,
    totalStudents,
    totalOrders,
    totalVendors,
    totalRevenue,
    auditLogs,
    notifications,
    unreadCount,
    approveRequest,
    rejectRequest,
    requestChanges,
    disableInstitution,
    suspendInstitution,
    activateInstitution,
    deleteInstitution,
    updateInstitution,
    editRequest,
    createAuditLog,
    markNotificationRead,
    markAllNotificationsRead,
    globalSearch,
    refresh: fetchAll,
  };
}
