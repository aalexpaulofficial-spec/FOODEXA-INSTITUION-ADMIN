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
  food_courts?: number;
  food_courts_count?: string;
  vendors?: number;
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

export interface UseSupabaseDataReturn {
  institutionRequests: InstitutionRequest[];
  approvedInstitutions: SupabaseInstitution[];
  loading: boolean;
  error: string | null;
  adminAccessOk: boolean;
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
  enableInstitution: (id: string) => Promise<void>;
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
const ORDERS_TABLE = 'orders';
const NOTIFICATIONS_TABLE = 'notifications';

export function useSupabaseData(): UseSupabaseDataReturn {
  const [institutionRequests, setInstitutionRequests] = useState<InstitutionRequest[]>([]);
  const [approvedInstitutions, setApprovedInstitutions] = useState<SupabaseInstitution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adminAccessOk, setAdminAccessOk] = useState(false);
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
      const possibleTables = ['audit_logs', 'platform_audit_logs', 'admin_audit_logs'];
      let inserted = false;
      for (const table of possibleTables) {
        try {
          const { error } = await supabase.from(table).insert({
            user_id: userId,
            user_name: user?.email || 'Unknown',
            action,
            target,
            target_id: targetId || null,
            details: details || null,
            ip_address: 'web-client',
          });
          if (!error) { inserted = true; break; }
        } catch { continue; }
      }
      if (!inserted) console.warn('[AuditLog] No audit log table available');
    } catch {
      // silently fail - audit logs are non-critical
    }
  }, []);

  // ---------------------------------------------------------------
  // Verify admin client has proper access
  // ---------------------------------------------------------------
  const verifyAdminAccess = useCallback(async (): Promise<boolean> => {
    try {
      const { data, error: checkErr } = await supabaseAdmin
        .from(REQUESTS_TABLE)
        .select('id')
        .limit(1);
      if (checkErr) {
        if (checkErr.code === '42P01') {
          setError(`Table "${REQUESTS_TABLE}" not found. Run the database migration first.`);
        } else if (
          checkErr.message?.toLowerCase().includes('permission denied') ||
          checkErr.message?.toLowerCase().includes('violates row-level security') ||
          checkErr.message?.toLowerCase().includes('policy')
        ) {
          setError(
            'Supabase admin access denied. The service role key (VITE_SUPABASE_SERVICE_ROLE_KEY) is invalid, expired, or not set. ' +
            'Check your Supabase project settings and ensure the key has the service_role claim. ' +
            'Without it, RLS policies block all write operations. ' +
            `Raw error: ${checkErr.message}`
          );
        } else {
          setError(`Supabase admin query failed: ${checkErr.message} (code: ${checkErr.code})`);
        }
        setAdminAccessOk(false);
        return false;
      }
      setAdminAccessOk(true);
      return true;
    } catch (err: unknown) {
      setError(`Cannot connect to Supabase: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setAdminAccessOk(false);
      return false;
    }
  }, []);

  // ---------------------------------------------------------------
  // Fetch all data
  // ---------------------------------------------------------------
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const accessOk = await verifyAdminAccess();
      if (!accessOk) {
        setLoading(false);
        return;
      }

      // Fetch institution requests
      const { data: requests, error: reqErr } = await supabaseAdmin
        .from(REQUESTS_TABLE)
        .select('*')
        .order('created_at', { ascending: false });

      if (reqErr) {
        setError(`Failed to fetch ${REQUESTS_TABLE}: ${reqErr.message}`);
        setLoading(false);
        return;
      }
      setInstitutionRequests((requests as InstitutionRequest[]) || []);

      // Fetch approved institutions
      const { data: institutions, error: instErr } = await supabaseAdmin
        .from(INSTITUTIONS_TABLE)
        .select('*')
        .order('created_at', { ascending: false });

      if (instErr) {
        setError(`Failed to fetch ${INSTITUTIONS_TABLE}: ${instErr.message}`);
        setLoading(false);
        return;
      }
      setApprovedInstitutions((institutions as SupabaseInstitution[]) || []);

      // Fetch total counts in parallel
      const [studentRes, orderRes, vendorRes] = await Promise.allSettled([
        supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
        supabaseAdmin.from(ORDERS_TABLE).select('id', { count: 'exact', head: true }),
        supabaseAdmin.from('canteens').select('id', { count: 'exact', head: true }),
      ]);

      setTotalStudents(studentRes.status === 'fulfilled' ? studentRes.value.count || 0 : 0);
      setTotalOrders(orderRes.status === 'fulfilled' ? orderRes.value.count || 0 : 0);
      setTotalVendors(vendorRes.status === 'fulfilled' ? vendorRes.value.count || 0 : 0);

      // Calculate total revenue from institutions
      const insts = (institutions as SupabaseInstitution[]) || [];
      const revenue = insts.reduce((sum, inst) => sum + (inst.monthly_revenue || 0), 0);
      setTotalRevenue(revenue);

      // Fetch audit logs (gracefully handles missing table)
      const auditTables = ['audit_logs', 'platform_audit_logs', 'admin_audit_logs'];
      let logsFound = false;
      for (const tbl of auditTables) {
        const { data: logs, error: logsErr } = await supabaseAdmin
          .from(tbl)
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);
        if (!logsErr) {
          setAuditLogs((logs as AuditLog[]) || []);
          logsFound = true;
          break;
        }
      }
      if (!logsFound) setAuditLogs([]);

      // Fetch notifications
      const notifColumns = ['id', 'type', 'created_at', 'title', 'message', 'read'];
      const { data: notifs, error: notifsErr } = await supabaseAdmin
        .from(NOTIFICATIONS_TABLE)
        .select(notifColumns.join(','))
        .order('created_at', { ascending: false })
        .limit(50);
      if (!notifsErr && notifs) {
        setNotifications((notifs as unknown as PlatformNotification[]) || []);
        setUnreadCount((notifs as unknown as PlatformNotification[]).filter((n: any) => !n.read).length);
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error fetching data');
    } finally {
      setLoading(false);
    }
  }, [verifyAdminAccess]);

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
        { event: '*', schema: 'public', table: 'profiles' },
        () => fetchAll()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: ORDERS_TABLE },
        () => fetchAll()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'canteens' },
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
  // Generate secure random password (14-16 chars, crypto-safe)
  // ---------------------------------------------------------------
  const generatePassword = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    const length = 14 + Math.floor(Math.random() * 3);
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(array[i] % chars.length);
    }
    return password;
  };

  // ---------------------------------------------------------------
  // Generate institution code (local only - no DB queries)
  // Format: First 8 letters of InstitutionName (uppercase, no spaces/special) + 6 random digits
  // Example: CHRIST583621, YAWEH264263, PENIEL874215
  // Uniqueness is validated during save in ensureInstitutionCodeAvailable
  // ---------------------------------------------------------------
  const generateInstitutionCode = async (name: string): Promise<string> => {
    const prefix = name.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 8);
    if (!prefix) return `INST${String(100000 + Math.floor(Math.random() * 900000))}`;

    const random = String(100000 + Math.floor(Math.random() * 900000));

    return `${prefix}${random}`;
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
      generated_password: generatePassword(),
      email_already_exists: emailAlreadyExists,
      existing_user_id: existingUserId,
    };
  };

  // ---------------------------------------------------------------
  // Approve a request: full workflow
  // Steps: 1) Auth account  2) Insert institutions  3) Update requests
  // ---------------------------------------------------------------
  const approveRequest = async (id: string, credentials?: ApprovalCredentials): Promise<ApprovalResult> => {
    const request = institutionRequests.find((r) => r.id === id);
    if (!request) {
      throw new Error('Institution request not found. Please refresh and try again.');
    }

    const approvedAt = new Date().toISOString();

    // Get the authenticated Super Admin
    const { data: { user: adminUser }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      throw new Error(`Failed to verify admin session: ${userError.message}`);
    }
    if (!adminUser?.id) {
      throw new Error('Not authenticated as Super Admin. Please sign in again.');
    }
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(adminUser.id)) {
      throw new Error('Invalid admin user session. Please sign out and sign in again.');
    }
    const approvedBy = adminUser.id;

    // Generate credentials
    const institutionCode = (credentials?.institution_code || await generateInstitutionCode(request.institution_name)).trim().toUpperCase();
    const password = credentials?.generated_password || generatePassword();
    const generatedEmail = credentials?.generated_email || request.institution_email;

    // Validate institution code availability
    await ensureInstitutionCodeAvailable(institutionCode, id);

    // Check if Institution Admin email already exists in auth
    let emailAlreadyExisted = false;
    let existingUserId: string | null = null;

    try {
      const { data: allUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      if (listError) {
        throw new Error(`Failed to check existing auth users: ${listError.message}`);
      }
      const users = (allUsers?.users || []) as Array<{ id: string; email?: string }>;
      const match = users.find((u) => u.email === generatedEmail);
      if (match) {
        emailAlreadyExisted = true;
        existingUserId = match.id;
      }
    } catch (checkErr) {
      if (checkErr instanceof Error && checkErr.message.startsWith('Failed to check existing auth users')) {
        throw checkErr;
      }
      throw new Error(`Error checking existing email: ${checkErr instanceof Error ? checkErr.message : 'Unknown error'}`);
    }

    // Step 1: Create Institution Admin auth account (or use existing)
    let authUserId: string;

    if (emailAlreadyExisted && existingUserId) {
      authUserId = existingUserId;
    } else {
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: generatedEmail,
password: password,
        email_confirm: true,
        user_metadata: {
          role: 'institution_admin',
          institution_name: request.institution_name,
        },
      });
      if (authError || !authData?.user) {
        throw new Error(`Failed to create Institution Admin auth account: ${authError?.message || 'No user returned'}`);
      }
      authUserId = authData.user.id;
    }

    // Step 2: Insert into institutions table
    const institutionRecord = {
      name: request.institution_name,
      institution_type: request.role || 'University',
      campus: request.campus || null,
      city: request.city || null,
      state: request.state || null,
      country: request.country || null,
      contact_person: request.contact_person || null,
      institution_email: request.institution_email || null,
      role: request.role || null,
      institution_website: request.institution_website || null,
      student_population: parseInt(request.student_population || '0', 10) || 0,
      food_courts: typeof request.food_courts === 'number' ? request.food_courts : parseInt(request.food_courts_count || '0', 10) || 0,
      vendors: typeof request.vendors === 'number' ? request.vendors : parseInt(request.vendors_count || '0', 10) || 0,
      message: request.message || null,
      phone: request.phone_number || null,
      email: generatedEmail,
      institution_code: institutionCode,
      generated_email: generatedEmail,
      generated_password: password,
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
      if (instError.message?.toLowerCase().includes('row-level security') || instError.message?.toLowerCase().includes('policy')) {
        throw new Error(
          'RLS policy blocked institution insert. The Supabase service role key (VITE_SUPABASE_SERVICE_ROLE_KEY) is likely invalid or not set. ' +
          'Go to Supabase Dashboard → Project Settings → API → service_role key and update the environment variable. ' +
          `Raw error: ${instError.message}`
        );
      }
      if (instError.code === '23505') {
        throw new Error(`Institution code "${institutionCode}" is already taken. Please go back and use a different code.`);
      }
      throw new Error(`Failed to create institution record: ${instError.message}`);
    }

    // Step 3: Update institution_requests — save code, email, password, status → approved
    const { error: updateReqError } = await supabaseAdmin
      .from(REQUESTS_TABLE)
      .update({
        status: 'approved',
        institution_code: institutionCode,
        generated_email: generatedEmail,
generated_password: password,
        approved_at: approvedAt,
        approved_by: approvedBy,
      })
      .eq('id', id);

    if (updateReqError) {
      throw new Error(`Institution was created but failed to mark request as approved: ${updateReqError.message}. Please check institution_requests table.`);
    }

    // Step 4: Create or update user profile
    if (emailAlreadyExisted) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({ institution_id: instData.id })
        .eq('user_id', authUserId);
      if (profileError) {
        console.error('[approveRequest] Failed to update existing user profile:', profileError);
      }
    } else {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          user_id: authUserId,
          role: 'institution_admin',
          institution_id: instData.id,
        });
      if (profileError) {
        console.error('[approveRequest] Failed to create user profile:', profileError);
      }
    }

    // Step 5: Audit log
    await createAuditLog(
      'Institution Approved',
      request.institution_name,
      id,
      `Code: ${institutionCode} | Approved by: ${approvedBy}${emailAlreadyExisted ? ' | Email already existed' : ''}`
    );

    // Step 6: Notification
    try {
      const { error: notifError } = await supabaseAdmin.from(NOTIFICATIONS_TABLE).insert({
        type: 'success',
        title: 'Institution Approved',
        message: `${request.institution_name} has been approved and activated on the platform. Code: ${institutionCode}`,
        read: false,
      });
      if (notifError) console.error('[approveRequest] Failed to create notification:', notifError);
    } catch {
      console.warn('[approveRequest] notifications table may not have expected columns');
    }

    // Step 7: Refresh from Supabase (source of truth)
    await fetchAll();

    // Step 8: Send onboarding email (non-blocking — approval already succeeded)
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
          password: password,
          portal_url: portalUrl,
          contact_person: request.contact_person,
          first_login_instructions: 'Please log in using the credentials above. You will be prompted to change your password on first login.',
          password_change_reminder: 'For security, please change your generated password after your first login.',
        }),
      });

      if (emailResponse.ok) {
        emailSent = true;
      } else if (emailResponse.status === 404) {
        console.warn('[approveRequest] approve-institution Edge Function is not deployed (404).');
      } else {
        const emailBody = await emailResponse.text();
        console.error(`[approveRequest] Email send failed (HTTP ${emailResponse.status}):`, emailBody);
      }
    } catch (emailErr: any) {
      if (emailErr?.message?.includes('Failed to fetch') || emailErr?.name === 'TypeError') {
        console.warn('[approveRequest] approve-institution Edge Function is not available.');
      } else {
        console.error('[approveRequest] Email send error:', emailErr);
      }
    }

    return {
      institution_name: request.institution_name,
      institution_code: institutionCode,
      generated_email: generatedEmail,
      generated_password: password,
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
    if (!request) throw new Error('Institution request not found. Please refresh and try again.');

    const updateData: Partial<InstitutionRequest> = {
      status: 'rejected',
      rejection_reason: reason || null,
    };

    const { error: updateErr } = await supabaseAdmin
      .from(REQUESTS_TABLE)
      .update(updateData)
      .eq('id', id);

    if (updateErr) {
      if (updateErr.message?.toLowerCase().includes('row-level security') || updateErr.message?.toLowerCase().includes('policy')) {
        throw new Error(
          'RLS policy blocked the update. The Supabase service role key is invalid or not set. ' +
          `Raw error: ${updateErr.message}`
        );
      }
      throw new Error(`Failed to reject request: ${updateErr.message}`);
    }

    // Non-blocking email attempt
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-rejection-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseAnonKey}` },
        body: JSON.stringify({
          institution_name: request.institution_name,
          institution_email: request.institution_email,
          rejection_reason: reason || 'No specific reason provided.',
        }),
      });
      if (!emailResponse.ok && emailResponse.status !== 404) {
        const body = await emailResponse.text();
        console.error(`[rejectRequest] Rejection email failed (HTTP ${emailResponse.status}):`, body);
      }
    } catch (emailErr: any) {
      if (!emailErr?.message?.includes('Failed to fetch') && emailErr?.name !== 'TypeError') {
        console.error('[rejectRequest] Failed to send rejection email:', emailErr);
      }
    }

    await createAuditLog('Institution Rejected', request.institution_name, id, reason || 'No reason provided');

    await supabaseAdmin.from(NOTIFICATIONS_TABLE).insert({
      type: 'warning',
      title: 'Institution Rejected',
      message: `${request.institution_name} registration has been rejected.${reason ? ` Reason: ${reason}` : ''}`,
      read: false,
    });

    await fetchAll();
  };

  const sendChangesEmailNotification = async (institutionName: string, institutionEmail: string, notes: string) => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-rejection-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseAnonKey}` },
        body: JSON.stringify({
          institution_name: institutionName,
          institution_email: institutionEmail,
          rejection_reason: `Changes requested: ${notes}. Please resubmit your registration with the requested changes.`,
        }),
      });
      if (!emailResponse.ok && emailResponse.status !== 404) {
        const body = await emailResponse.text();
        console.error(`[sendChangesEmailNotification] Changes email failed (HTTP ${emailResponse.status}):`, body);
      }
    } catch (emailErr: any) {
      if (!emailErr?.message?.includes('Failed to fetch') && emailErr?.name !== 'TypeError') {
        console.error('[sendChangesEmailNotification] Failed to send changes-requested email:', emailErr);
      }
    }
  };

  // ---------------------------------------------------------------
  // Request changes
  // ---------------------------------------------------------------
  const requestChanges = async (id: string, notes: string) => {
    if (!notes.trim()) throw new Error('Please provide notes describing the changes needed.');
    const request = institutionRequests.find((r) => r.id === id);
    if (!request) throw new Error('Institution request not found. Please refresh and try again.');

    const { error: updateErr } = await supabaseAdmin
      .from(REQUESTS_TABLE)
      .update({
        status: 'changes_requested',
        admin_notes: notes,
      })
      .eq('id', id);

    if (updateErr) {
      if (updateErr.message?.toLowerCase().includes('row-level security') || updateErr.message?.toLowerCase().includes('policy')) {
        throw new Error(
          'RLS policy blocked the update. The Supabase service role key is invalid or not set. ' +
          `Raw error: ${updateErr.message}`
        );
      }
      throw new Error(`Failed to request changes: ${updateErr.message}`);
    }

    await sendChangesEmailNotification(request.institution_name, request.institution_email, notes);

    await createAuditLog('Changes Requested', request.institution_name, id, notes);

    await supabaseAdmin.from(NOTIFICATIONS_TABLE).insert({
      type: 'info',
      title: 'Changes Requested',
      message: `Changes requested for ${request.institution_name}: ${notes}`,
      read: false,
    });

    await fetchAll();
  };

  // ---------------------------------------------------------------
  // Disable an institution (blocks login until re-enabled)
  // ---------------------------------------------------------------
  const disableInstitution = async (id: string) => {
    const inst = approvedInstitutions.find((i) => i.id === id);

    const { error: instErr } = await supabaseAdmin
      .from(INSTITUTIONS_TABLE)
      .update({ status: 'disabled' })
      .eq('id', id);

    if (instErr) {
      if (instErr.message?.toLowerCase().includes('row-level security') || instErr.message?.toLowerCase().includes('policy')) {
        throw new Error(
          'RLS policy blocked the update. The Supabase service role key is invalid or not set. ' +
          `Raw error: ${instErr.message}`
        );
      }
      throw new Error(`Failed to disable institution: ${instErr.message}`);
    }

    // Also update the original request status
    const request = institutionRequests.find((r) => r.institution_code === inst?.institution_code);
    if (request) {
      const { error: reqErr } = await supabaseAdmin
        .from(REQUESTS_TABLE)
        .update({ status: 'disabled' })
        .eq('id', request.id);
      if (reqErr) {
        console.error('[disableInstitution] Failed to update institution_requests:', reqErr);
      }
    }

    await createAuditLog('Institution Disabled', inst?.name || id, id);
    await supabaseAdmin.from(NOTIFICATIONS_TABLE).insert({
      type: 'warning',
      title: 'Institution Disabled',
      message: `${inst?.name || 'An institution'} has been disabled. Admin can no longer log in.`,
      read: false,
    });

    await fetchAll();
  };

  // ---------------------------------------------------------------
  // Enable a disabled institution (re-enable login)
  // ---------------------------------------------------------------
  const enableInstitution = async (id: string) => {
    const inst = approvedInstitutions.find((i) => i.id === id);
    if (!inst) throw new Error('Institution not found. Please refresh and try again.');

    const { error: instErr } = await supabaseAdmin
      .from(INSTITUTIONS_TABLE)
      .update({ status: 'active' })
      .eq('id', id);

    if (instErr) {
      if (instErr.message?.toLowerCase().includes('row-level security') || instErr.message?.toLowerCase().includes('policy')) {
        throw new Error(
          'RLS policy blocked the update. The Supabase service role key is invalid or not set. ' +
          `Raw error: ${instErr.message}`
        );
      }
      throw new Error(`Failed to enable institution: ${instErr.message}`);
    }

    // Also update the original request status
    const request = institutionRequests.find((r) => r.institution_code === inst?.institution_code);
    if (request) {
      const { error: reqErr } = await supabaseAdmin
        .from(REQUESTS_TABLE)
        .update({ status: 'active' })
        .eq('id', request.id);
      if (reqErr) {
        console.error('[enableInstitution] Failed to update institution_requests:', reqErr);
      }
    }

    await createAuditLog('Institution Re-enabled', inst.name, id);
    await supabaseAdmin.from(NOTIFICATIONS_TABLE).insert({
      type: 'success',
      title: 'Institution Re-enabled',
      message: `${inst.name} has been re-enabled. Admin can now log in again.`,
      read: false,
    });

    await fetchAll();
  };

  // ---------------------------------------------------------------
  // Edit a request (admin can update details before approval)
  // ---------------------------------------------------------------
  const editRequest = async (id: string, updates: Partial<InstitutionRequest>) => {
    const request = institutionRequests.find((r) => r.id === id);
    if (!request) throw new Error('Institution request not found. Please refresh and try again.');

    const { error } = await supabaseAdmin.from(REQUESTS_TABLE).update(updates).eq('id', id);
    if (error) {
      if (error.message?.toLowerCase().includes('row-level security') || error.message?.toLowerCase().includes('policy')) {
        throw new Error(`RLS policy blocked the update. Invalid service role key. Raw: ${error.message}`);
      }
      throw new Error(`Failed to update request: ${error.message}`);
    }

    await createAuditLog('Request Edited', request.institution_name, id, JSON.stringify(updates));
    await fetchAll();
  };

  // ---------------------------------------------------------------
  // Suspend institution
  // ---------------------------------------------------------------
  const suspendInstitution = async (id: string) => {
    const inst = approvedInstitutions.find((i) => i.id === id);
    const { error } = await supabaseAdmin.from(INSTITUTIONS_TABLE).update({ status: 'suspended' }).eq('id', id);
    if (error) {
      if (error.message?.toLowerCase().includes('row-level security') || error.message?.toLowerCase().includes('policy')) {
        throw new Error(`RLS policy blocked the update. Invalid service role key. Raw: ${error.message}`);
      }
      throw new Error(`Failed to suspend institution: ${error.message}`);
    }
    await createAuditLog('Institution Suspended', inst?.name || id, id);
    await supabaseAdmin.from(NOTIFICATIONS_TABLE).insert({
      type: 'warning',
      title: 'Institution Suspended',
      message: `${inst?.name || 'An institution'} has been suspended.`,
      read: false,
    });
    await fetchAll();
  };

  // ---------------------------------------------------------------
  // Activate institution (re-activate from suspended)
  // ---------------------------------------------------------------
  const activateInstitution = async (id: string) => {
    const inst = approvedInstitutions.find((i) => i.id === id);
    const { error } = await supabaseAdmin.from(INSTITUTIONS_TABLE).update({ status: 'active' }).eq('id', id);
    if (error) {
      if (error.message?.toLowerCase().includes('row-level security') || error.message?.toLowerCase().includes('policy')) {
        throw new Error(`RLS policy blocked the update. Invalid service role key. Raw: ${error.message}`);
      }
      throw new Error(`Failed to activate institution: ${error.message}`);
    }
    await createAuditLog('Institution Reactivated', inst?.name || id, id);
    await supabaseAdmin.from(NOTIFICATIONS_TABLE).insert({
      type: 'success',
      title: 'Institution Reactivated',
      message: `${inst?.name || 'An institution'} has been reactivated.`,
      read: false,
    });
    await fetchAll();
  };

  // ---------------------------------------------------------------
  // Delete institution
  // ---------------------------------------------------------------
  const deleteInstitution = async (id: string) => {
    const inst = approvedInstitutions.find((i) => i.id === id);
    const { error } = await supabaseAdmin.from(INSTITUTIONS_TABLE).delete().eq('id', id);
    if (error) {
      if (error.message?.toLowerCase().includes('row-level security') || error.message?.toLowerCase().includes('policy')) {
        throw new Error(`RLS policy blocked deletion. Invalid service role key. Raw: ${error.message}`);
      }
      throw new Error(`Failed to delete institution: ${error.message}`);
    }
    await createAuditLog('Institution Deleted', inst?.name || id, id);
    await supabaseAdmin.from(NOTIFICATIONS_TABLE).insert({
      type: 'error',
      title: 'Institution Deleted',
      message: `${inst?.name || 'An institution'} has been permanently removed.`,
      read: false,
    });
    await fetchAll();
  };

  // ---------------------------------------------------------------
  // Update institution
  // ---------------------------------------------------------------
  const updateInstitution = async (id: string, updates: Partial<SupabaseInstitution>) => {
    const inst = approvedInstitutions.find((i) => i.id === id);
    const { error } = await supabaseAdmin.from(INSTITUTIONS_TABLE).update(updates).eq('id', id);
    if (error) {
      if (error.message?.toLowerCase().includes('row-level security') || error.message?.toLowerCase().includes('policy')) {
        throw new Error(`RLS policy blocked the update. Invalid service role key. Raw: ${error.message}`);
      }
      throw new Error(`Failed to update institution: ${error.message}`);
    }
    await createAuditLog('Institution Updated', inst?.name || id, id, JSON.stringify(updates));
    await fetchAll();
  };

  // ---------------------------------------------------------------
  // Mark notification read
  // ---------------------------------------------------------------
  const markNotificationRead = async (id: string) => {
    try {
      await supabaseAdmin.from(NOTIFICATIONS_TABLE).update({ read: true }).eq('id', id);
    } catch {
      try { await supabaseAdmin.from(NOTIFICATIONS_TABLE).update({ is_read: true }).eq('id', id); } catch {}
    }
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
    try {
      await supabaseAdmin.from(NOTIFICATIONS_TABLE).update({ read: true }).in('id', ids);
    } catch {
      try { await supabaseAdmin.from(NOTIFICATIONS_TABLE).update({ is_read: true }).in('id', ids); } catch {}
    }
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
    adminAccessOk,
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
    enableInstitution,
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
