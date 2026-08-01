import { supabase } from './supabaseClient';

const API_BASE = '/api/admin';

const abortControllers = new Map<string, AbortController>();

function getController(key: string): AbortController {
  if (abortControllers.has(key)) {
    abortControllers.get(key)!.abort();
  }
  const controller = new AbortController();
  abortControllers.set(key, controller);
  return controller;
}

async function apiCall<T>(endpoint: string, payload: unknown): Promise<T> {
  const controller = getController(endpoint);

  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (!token) {
    throw new Error('Authentication required. Please log in again.');
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
    signal: controller.signal,
  });

  let json: any = {};
  try {
    json = await response.json();
  } catch {
    throw new Error('Network error. Please check your connection and try again.');
  }

  if (!response.ok) {
    const errorMessage = json?.error || `Request failed (HTTP ${response.status})`;
    throw new Error(errorMessage);
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
    return apiCall<CheckEmailResult>('/check-email', { email });
  },

  approveInstitution(payload: ApproveInstitutionPayload) {
    return apiCall<ApproveInstitutionResult>('/approve-institution', payload);
  },

  disableInstitution(institution_id: string) {
    return apiCall<{ success: boolean }>('/disable-institution', { institution_id });
  },

  enableInstitution(institution_id: string) {
    return apiCall<{ success: boolean }>('/enable-institution', { institution_id });
  },

  resetPassword(payload: { email: string; institution_name?: string; institution_code?: string; contact_person?: string }) {
    return apiCall<ResetPasswordResult>('/reset-password', payload);
  },

  resendCredentials(payload: ResendCredentialsPayload) {
    return apiCall<{ success: boolean }>('/resend-credentials', payload);
  },

  search(term: string) {
    return apiCall<GlobalSearchResultItem[]>('/search', { term });
  },

  rejectRequest(request_id: string, reason: string) {
    return apiCall<{ success: boolean }>('/reject-request', { request_id, reason });
  },

  requestChanges(request_id: string, notes: string) {
    return apiCall<{ success: boolean }>('/request-changes', { request_id, notes });
  },
};