import { supabase } from './supabaseClient';

async function getAccessToken(): Promise<string> {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.access_token) {
    throw new Error('Your session expired. Please sign in again.');
  }
  return data.session.access_token;
}

async function parseApiResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null);
  const normalized =
    payload &&
    typeof payload === 'object' &&
    typeof (payload as any).body === 'string'
      ? JSON.parse((payload as any).body)
      : payload;

  if (!response.ok) {
    throw new Error(
      normalized?.error ||
        normalized?.message ||
        `Admin API request failed with status ${response.status}.`
    );
  }

  if (normalized?.error) {
    throw new Error(normalized.error);
  }

  return normalized as T;
}

async function invokeAdminRoute<T>(action: string, payload: unknown): Promise<T> {
  const token = await getAccessToken();
  const response = await fetch(`/api/admin/${action}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return parseApiResponse<T>(response);
}

/**
 * Invokes a Supabase Edge Function with the current session's access token.
 * All admin operations are executed server-side with the service role key,
 * so secrets (Resend API key, admin auth API) never touch the browser.
 */
async function invokeEdge<T>(functionName: string, payload: unknown): Promise<T> {
  try {
    const { data, error } = await supabase.functions.invoke<T>(functionName, {
      body: payload,
    });

    if (error) {
      const ctx = (error as any)?.context;
      const message = ctx?.error || error?.message || `Edge function "${functionName}" failed.`;
      throw new Error(message);
    }

    if (data && typeof data === 'object' && 'error' in data && typeof (data as any).error === 'string') {
      const errMsg = (data as any).error || `Edge function "${functionName}" returned an error.`;
      throw new Error(errMsg);
    }

    if (data === null || data === undefined) {
      throw new Error(`Edge function "${functionName}" returned no data. The function may not be deployed.`);
    }

    return data as T;
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Network error calling "${functionName}". The Edge Function may not be deployed or CORS is misconfigured.`);
  }
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
    return invokeAdminRoute<CheckEmailResult>('check-email', { email });
  },

  approveInstitution(payload: ApproveInstitutionPayload) {
    return invokeAdminRoute<ApproveInstitutionResult>('approve-institution', payload);
  },

  disableInstitution(institution_id: string) {
    return invokeEdge<{ success: boolean }>('admin-disable-institution', { institution_id });
  },

  enableInstitution(institution_id: string) {
    return invokeEdge<{ success: boolean }>('admin-enable-institution', { institution_id });
  },

  resetPassword(payload: { email: string; institution_name?: string; institution_code?: string; contact_person?: string }) {
    return invokeEdge<ResetPasswordResult>('admin-reset-password', payload);
  },

  resendCredentials(payload: ResendCredentialsPayload) {
    return invokeEdge<{ success: boolean }>('admin-resend-credentials', payload);
  },

  search(term: string) {
    return invokeEdge<GlobalSearchResultItem[]>('admin-search', { term });
  },

  rejectRequest(request_id: string, reason: string) {
    return invokeEdge<{ success: boolean }>('admin-reject-request', { request_id, reason });
  },

  requestChanges(request_id: string, notes: string) {
    return invokeEdge<{ success: boolean }>('admin-request-changes', { request_id, notes });
  },
};
