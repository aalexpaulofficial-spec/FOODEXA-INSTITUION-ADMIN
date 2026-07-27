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
  status: 'pending' | 'approved' | 'active' | 'rejected' | 'suspended' | 'changes_requested' | 'disabled';
  created_at: string;
  updated_at?: string;
  plan?: 'Basic' | 'Pro' | 'Enterprise';
  rejection_reason?: string;
  admin_notes?: string;
  institution_code?: string;
  generated_email?: string;
  generated_password?: string;
  approved_at?: string;
  approved_by?: string;
}

export interface SupabaseInstitution {
  id: string;
  name: string;
  institution_type?: string;
  campus?: string;
  city?: string;
  state?: string;
  country?: string;
  contact_person?: string;
  institution_email?: string;
  role?: string;
  institution_website?: string;
  student_population?: number;
  food_courts?: number;
  vendors?: number;
  message?: string;
  phone?: string;
  email?: string;
  institution_code?: string;
  generated_email?: string;
  generated_password?: string;
  approved_by?: string;
  approved_at?: string;
  status: 'active' | 'pending_approval' | 'suspended' | 'disabled';
  logo_url?: string;
  type?: string;
  plan?: 'Basic' | 'Pro' | 'Enterprise';
  joined_date?: string;
  students_count?: number;
  daily_orders_count?: number;
  monthly_revenue?: number;
  created_at?: string;
  last_login?: string;
  address?: string;
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
  generated_email: string;
  generated_password: string;
  approved_at: string;
  email_already_existed: boolean;
  email_sent: boolean;
}

export interface ApprovalCredentials {
  institution_code: string;
  generated_email: string;
  generated_password: string;
}

export interface ApprovalDraft extends ApprovalCredentials {
  request: InstitutionRequest;
  email_already_exists: boolean;
  existing_user_id?: string;
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
      const userId = user?.id;
      if (!userId) return;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId)) {
        console.error(`[AuditLog] Invalid user_id UUID: "${userId}"`);
        return;
      }
      await supabaseAdmin.from(AUDIT_LOGS_TABLE).insert({
        user_id: userId,
        user_name: user?.email || 'Unknown',
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
  // Generate institution code (local only - no DB queries)
  // Format: First 6 letters (uppercase, no spaces/special) + Year(last 2) + Random 4-digit
  // Uniqueness is validated during save in ensureInstitutionCodeAvailable
  // ---------------------------------------------------------------
  const generateInstitutionCode = async (name: string): Promise<string> => {
    const prefix = name.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 6);
    if (!prefix) return `INST${new Date().getFullYear().toString().slice(-2)}${String(Math.floor(1000 + Math.random() * 9000))}`;

    const year = new Date().getFullYear().toString().slice(-2);
    const random = String(Math.floor(1000 + Math.random() * 9000));

    return `${prefix}${year}${random}`;
  };

  const ensureInstitutionCodeAvailable = async (code: string, requestId: string) => {
    const cleanedCode = code.trim().toUpperCase();
    if (!cleanedCode) {
      const err = new Error('Institution code is required.');
      console.error(err);
      throw err;
    }

    const [reqRes, instRes] = await Promise.all([
      supabaseAdmin
        .from(REQUESTS_TABLE)
        .select('id')
        .eq('institution_code', cleanedCode)
        .neq('id', requestId)
        .maybeSingle(),
      supabaseAdmin
        .from(INSTITUTIONS_TABLE)
        .select('id')
        .eq('institution_code', cleanedCode)
        .maybeSingle(),
    ]);

    if (reqRes.error) {
      console.error(reqRes.error);
      throw reqRes.error;
    }
    if (instRes.error) {
      console.error(instRes.error);
      throw instRes.error;
    }
    if (reqRes.data || instRes.data) {
      const err = new Error(`Institution code "${cleanedCode}" is already in use.`);
      console.error(err);
      throw err;
    }
  };

  const prepareApproval = async (id: string): Promise<ApprovalDraft> => {
    const request = institutionRequests.find((r) => r.id === id);
    if (!request) {
      const err = new Error('Institution request not found.');
      console.error('[prepareApproval]', err);
      throw err;
    }

    const email = request.institution_email;
    let emailAlreadyExists = false;
    let existingUserId: string | undefined;

    try {
      const { data: allUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();

      if (listError) {
        console.error('[prepareApproval] Failed to list auth users:', listError);
      } else {
        const users = (allUsers?.users || []) as Array<{ id: string; email?: string }>;
        const match = users.find((u) => u.email === email);
        if (match) {
          emailAlreadyExists = true;
          existingUserId = match.id;
          console.log(`[prepareApproval] Email "${email}" already exists with user ID: ${existingUserId}`);
        }
      }
    } catch (checkErr) {
      console.error('[prepareApproval] Error checking existing email:', checkErr);
    }

    return {
      request,
      institution_code: await generateInstitutionCode(request.institution_name),
      generated_email: email,
      generated_password: generateTempPassword(),
      email_already_exists: emailAlreadyExists,
      existing_user_id: existingUserId,
    };
  };

  // ---------------------------------------------------------------
  // Approve a request: full workflow
  // ---------------------------------------------------------------
  const approveRequest = async (id: string, credentials?: ApprovalCredentials): Promise<ApprovalResult> => {
    // Step 1: Read the selected institution request
    const request = institutionRequests.find((r) => r.id === id);
    if (!request) {
      const err = new Error('Institution request not found.');
      console.error('[approveRequest]', err);
      throw err;
    }

    const approvedAt = new Date().toISOString();

    // Step 2: Get the authenticated Super Admin
    const { data: { user: adminUser }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error('[approveRequest] Failed to get admin user:', userError);
      throw userError;
    }
    if (!adminUser?.id) {
      const err = new Error('Authenticated Super Admin user id was not found.');
      console.error('[approveRequest]', err);
      throw err;
    }
    const approvedBy = adminUser.id;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(approvedBy)) {
      const err = new Error(`Invalid Super Admin UUID for approved_by: "${approvedBy}". Email addresses must not be stored in UUID columns. Use the authenticated user's UUID.`);
      console.error('[approveRequest]', err);
      throw err;
    }

    // Step 3: Generate credentials
    const institutionCode = (credentials?.institution_code || await generateInstitutionCode(request.institution_name)).trim().toUpperCase();
    const tempPassword = credentials?.generated_password || generateTempPassword();
    const generatedEmail = credentials?.generated_email || request.institution_email;

    // Step 4: Validate institution code availability
    await ensureInstitutionCodeAvailable(institutionCode, id);

    // Step 5: Check if Institution Admin email already exists in auth
    let emailAlreadyExisted = false;
    let existingUserId: string | null = null;

    try {
      const { data: allUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();

      if (listError) {
        console.error('[approveRequest] Failed to list auth users:', listError);
      } else {
        const users = (allUsers?.users || []) as Array<{ id: string; email?: string }>;
        const match = users.find((u) => u.email === generatedEmail);
        if (match) {
          emailAlreadyExisted = true;
          existingUserId = match.id;
          console.log(`[approveRequest] Email "${generatedEmail}" already exists with user ID: ${existingUserId}. Skipping auth user creation.`);
        }
      }
    } catch (checkErr) {
      console.error('[approveRequest] Error checking existing email:', checkErr);
    }

    // Step 6: Create Institution Admin auth account (only if email does NOT exist)
    let authUserId: string;

    if (emailAlreadyExisted && existingUserId) {
      authUserId = existingUserId;
      console.log(`[approveRequest] Using existing auth user: ${existingUserId}`);
    } else {
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: generatedEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          role: 'institution_admin',
          institution_name: request.institution_name,
        },
      });
      if (authError || !authData.user) {
        const err = authError || new Error('Auth user creation returned no user.');
        console.error('[approveRequest] Failed to create auth user:', err);
        throw err;
      }
      authUserId = authData.user.id;
      console.log(`[approveRequest] Created new auth user: ${authUserId}`);
    }

    // Step 7: Update institution_requests — save code, email, password, status → approved
    const { error: saveError } = await supabaseAdmin
      .from(REQUESTS_TABLE)
      .update({
        status: 'approved',
        institution_code: institutionCode,
        generated_email: generatedEmail,
        generated_password: tempPassword,
        approved_at: approvedAt,
        approved_by: approvedBy,
      })
      .eq('id', id);
    if (saveError) {
      console.error('[approveRequest] Failed to update institution_requests:', saveError);
      throw saveError;
    }

    // Step 8: Insert into institutions table
    const institutionRecord = {
      name: request.institution_name,
      campus: request.campus || null,
      city: request.city || null,
      state: request.state || null,
      country: request.country || null,
      contact_person: request.contact_person || null,
      institution_email: request.institution_email || null,
      role: request.role || null,
      institution_website: request.institution_website || null,
      student_population: parseInt(request.student_population || '0', 10) || 0,
      food_courts: parseInt(request.food_courts_count || '0', 10) || 0,
      vendors: parseInt(request.vendors_count || '0', 10) || 0,
      message: request.message || null,
      phone: request.phone_number || null,
      email: generatedEmail,
      institution_code: institutionCode,
      generated_email: generatedEmail,
      generated_password: tempPassword,
      approved_by: approvedBy,
      approved_at: approvedAt,
      status: 'active',
    };

    const { data: instData, error: instError } = await supabaseAdmin
      .from(INSTITUTIONS_TABLE)
      .insert(institutionRecord)
      .select('id')
      .single();
    if (instError) {
      console.error('[approveRequest] Failed to insert into institutions:', instError);
      throw instError;
    }

    // Step 9: Create or update user profile
    if (emailAlreadyExisted) {
      const { error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .update({ institution_id: instData.id })
        .eq('id', authUserId);
      if (profileError) {
        console.error('[approveRequest] Failed to update existing user profile:', profileError);
      }
    } else {
      const { error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .insert({
          id: authUserId,
          role: 'institution_admin',
          institution_id: instData.id,
        });
      if (profileError) {
        console.error('[approveRequest] Failed to create user profile:', profileError);
        throw profileError;
      }
    }

    // Step 10: Audit log
    await createAuditLog(
      'Institution Approved',
      request.institution_name,
      id,
      `Code: ${institutionCode} | Approved by: ${approvedBy}${emailAlreadyExisted ? ' | Email already existed' : ''}`
    );

    // Step 11: Notification
    const { error: notifError } = await supabaseAdmin.from(NOTIFICATIONS_TABLE).insert({
      title: 'Institution Approved',
      message: `${request.institution_name} has been approved and activated on the platform. Code: ${institutionCode}`,
      type: 'success',
      read: false,
    });
    if (notifError) {
      console.error('[approveRequest] Failed to create notification:', notifError);
    }

    // Step 12: Refresh UI immediately
    setInstitutionRequests((prev) =>
      prev.map((r) => (r.id === id ? {
        ...r,
        status: 'approved',
        institution_code: institutionCode,
        generated_email: generatedEmail,
        generated_password: tempPassword,
        approved_at: approvedAt,
        approved_by: approvedBy,
      } : r))
    );
    setApprovedInstitutions((prev) => [
      { ...(institutionRecord as SupabaseInstitution), id: instData.id, status: 'active' },
      ...prev,
    ]);
    await fetchAll();

    // Step 13: Send onboarding email (non-blocking — approval already succeeded)
    let emailSent = false;
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const portalUrl = 'https://foodexa-institution-platform.vercel.app';

      const emailResponse = await fetch(`${supabaseUrl}/functions/v1/approve-institution`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          institution_name: request.institution_name,
          institution_email: generatedEmail,
          institution_code: institutionCode,
          login_email: generatedEmail,
          temp_password: tempPassword,
          portal_url: portalUrl,
          contact_person: request.contact_person,
          first_login_instructions: 'Please log in using the credentials above. You will be prompted to change your password on first login.',
          password_change_reminder: 'For security, please change your temporary password after your first login.',
        }),
      });

      if (emailResponse.ok) {
        emailSent = true;
        console.log('[approveRequest] Onboarding email sent successfully.');
      } else if (emailResponse.status === 404) {
        console.warn('[approveRequest] approve-institution Edge Function is not deployed (404). Email not sent. Deploy the function via `supabase functions deploy approve-institution` to enable email.');
      } else {
        const emailBody = await emailResponse.text();
        console.error(`[approveRequest] Email send failed (HTTP ${emailResponse.status}):`, emailBody);
      }
    } catch (emailErr: any) {
      if (emailErr?.message?.includes('Failed to fetch') || emailErr?.name === 'TypeError') {
        console.warn('[approveRequest] approve-institution Edge Function is not available. Email not sent. Deploy the function via `supabase functions deploy approve-institution` to enable email.');
      } else {
        console.error('[approveRequest] Email send error:', emailErr);
      }
    }

    return {
      institution_name: request.institution_name,
      institution_code: institutionCode,
      generated_email: generatedEmail,
      generated_password: tempPassword,
      approved_at: approvedAt,
      email_already_existed: emailAlreadyExisted,
      email_sent: emailSent,
    };
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
      console.error(updateErr);
      throw updateErr;
    }

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-rejection-email`, {
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
      if (!emailResponse.ok && emailResponse.status === 404) {
        console.warn('[rejectRequest] send-rejection-email Edge Function is not deployed (404). Email not sent.');
      } else if (!emailResponse.ok) {
        const body = await emailResponse.text();
        console.error(`[rejectRequest] Rejection email failed (HTTP ${emailResponse.status}):`, body);
      }
    } catch (emailErr: any) {
      if (emailErr?.message?.includes('Failed to fetch') || emailErr?.name === 'TypeError') {
        console.warn('[rejectRequest] send-rejection-email Edge Function is not available. Email not sent.');
      } else {
        console.error('[rejectRequest] Failed to send rejection email:', emailErr);
      }
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
      const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-rejection-email`, {
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
      if (!emailResponse.ok && emailResponse.status === 404) {
        console.warn('[sendChangesEmailNotification] send-rejection-email Edge Function is not deployed (404). Email not sent.');
      } else if (!emailResponse.ok) {
        const body = await emailResponse.text();
        console.error(`[sendChangesEmailNotification] Changes email failed (HTTP ${emailResponse.status}):`, body);
      }
    } catch (emailErr: any) {
      if (emailErr?.message?.includes('Failed to fetch') || emailErr?.name === 'TypeError') {
        console.warn('[sendChangesEmailNotification] send-rejection-email Edge Function is not available. Email not sent.');
      } else {
        console.error('[sendChangesEmailNotification] Failed to send changes-requested email:', emailErr);
      }
    }
  };

  // ---------------------------------------------------------------
  // Disable an institution (blocks login until re-enabled)
  // ---------------------------------------------------------------
  const disableInstitution = async (id: string) => {
    const inst = approvedInstitutions.find((i) => i.id === id);
    await supabaseAdmin.from(INSTITUTIONS_TABLE).update({ status: 'disabled' }).eq('id', id);

    // Also update the original request status
    const request = institutionRequests.find((r) => r.institution_code === inst?.institution_code);
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
      prev.map((r) => (r.institution_code === inst?.institution_code ? { ...r, status: 'disabled' as const } : r))
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
      console.error(updateErr);
      throw updateErr;
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
      console.error(error);
      throw error;
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
      console.error(error);
      throw error;
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
        inst.institution_code?.toLowerCase().includes(q) ||
        inst.contact_person?.toLowerCase().includes(q) ||
        inst.phone?.toLowerCase().includes(q)
      ) {
        results.push({
          type: 'institution',
          id: inst.id,
          name: inst.name,
          subtitle: `${inst.institution_code || 'N/A'} • ${inst.email || 'N/A'}`,
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
    prepareApproval,
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
