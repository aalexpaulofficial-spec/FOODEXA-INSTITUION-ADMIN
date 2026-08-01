import { supabase } from './supabaseClient';

// ---------------------------------------------------------------
// Secure Backend API Client (Frontend)
// ---------------------------------------------------------------
// The browser NEVER calls /auth/v1/admin/users or any Supabase
// Admin endpoint directly. All admin operations are forwarded to
// Supabase Edge Functions which run server-side with the
// SUPABASE_SERVICE_ROLE_KEY. The browser only sends the user's
// access token; the anon key is the only Supabase key exposed here.
// ---------------------------------------------------------------

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string || '').trim();
const FUNCTION_BASE = `${supabaseUrl}/functions/v1`;

async function callFunction<T>(functionName: string, payload: unknown): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const response = await fetch(`${FUNCTION_BASE}/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token || ''}`,
      'apikey': (import.meta.env.VITE_SUPABASE_ANON_KEY as string || ''),
    },
    body: JSON.stringify(payload),
  });

  let json: any = {};
  try {
    json = await response.json();
  } catch {
    // ignore parse errors
  }

  if (!response.ok) {
    throw new Error(json?.error || `Backend request ${functionName} failed (HTTP ${response.status})`);
  }
  return json as T;
}

export interface CheckEmailResult {
  exists: boolean;
  user_id: string | null;
}

export interface ApproveInstitutionPayload {
  request_id: string;
  institution_code: string;
  generated_email?: string;
  generated_password?: string;
}

export interface ApproveInstitutionResult {
  success: boolean;
  institution_name: string;
  institution_code: string;
  generated_email: string;
  generated_password: string;
  approved_at: string;
  email_already_existed: boolean;
  email_sent: boolean;
  email_error?: string | null;
}

export interface ResetPasswordResult {
  success: boolean;
  new_password: string;
  email_sent: boolean;
  email_error?: string | null;
  recovery_link?: string | null;
}

export interface ResendCredentialsPayload {
  institution_name: string;
  institution_email: string;
  institution_code: string;
  login_email: string;
  password: string;
  contact_person?: string;
}

export interface GlobalSearchResultItem {
  type: 'institution' | 'request' | 'student' | 'vendor';
  id: string;
  name: string;
  subtitle: string;
  status?: string;
}

export const adminApi = {
  checkEmail(email: string) {
    return callFunction<CheckEmailResult>('admin-check-email', { email });
  },

  approveInstitution(payload: ApproveInstitutionPayload) {
    return callFunction<ApproveInstitutionResult>('admin-approve-institution', payload);
  },

  disableInstitution(institution_id: string) {
    return callFunction<{ success: boolean }>('admin-disable-institution', { institution_id });
  },

  enableInstitution(institution_id: string) {
    return callFunction<{ success: boolean }>('admin-enable-institution', { institution_id });
  },

  resetPassword(payload: { email: string; institution_name?: string; institution_code?: string; contact_person?: string }) {
    return callFunction<ResetPasswordResult>('admin-reset-password', payload);
  },

  resendCredentials(payload: ResendCredentialsPayload) {
    return callFunction<{ success: boolean }>('admin-resend-credentials', payload);
  },

  search(term: string) {
    return callFunction<GlobalSearchResultItem[]>('admin-search', { term });
  },
};
