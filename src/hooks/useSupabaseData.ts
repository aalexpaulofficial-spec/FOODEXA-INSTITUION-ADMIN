import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

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
  status: 'pending' | 'active' | 'rejected' | 'suspended';
  created_at: string;
  plan?: 'Basic' | 'Pro' | 'Enterprise';
}

export interface SupabaseInstitution {
  id: string;
  name: string;
  code?: string;
  location?: string;
  students_count?: number;
  vendors_count?: number;
  daily_orders_count?: number;
  monthly_revenue?: number;
  status: 'active' | 'pending_approval' | 'suspended';
  contact_person?: string;
  email?: string;
  phone?: string;
  joined_date?: string;
  plan?: 'Basic' | 'Pro' | 'Enterprise';
  logo_url?: string;
  type?: string;
  created_at?: string;
}

interface UseSupabaseDataReturn {
  institutionRequests: InstitutionRequest[];
  approvedInstitutions: SupabaseInstitution[];
  loading: boolean;
  error: string | null;
  isRealtime: boolean;
  totalStudents: number;
  totalOrders: number;
  approveRequest: (id: string) => Promise<void>;
  rejectRequest: (id: string) => Promise<void>;
  suspendInstitution: (id: string) => Promise<void>;
  activateInstitution: (id: string) => Promise<void>;
  refresh: () => void;
}

// Table name for institution registration requests
const REQUESTS_TABLE = 'institution_requests';
const INSTITUTIONS_TABLE = 'institutions';
const STUDENTS_TABLE = 'students';
const ORDERS_TABLE = 'orders';

export function useSupabaseData(): UseSupabaseDataReturn {
  const [institutionRequests, setInstitutionRequests] = useState<InstitutionRequest[]>([]);
  const [approvedInstitutions, setApprovedInstitutions] = useState<SupabaseInstitution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRealtime, setIsRealtime] = useState(false);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);

  // ---------------------------------------------------------------
  // Fetch all data
  // ---------------------------------------------------------------
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch institution requests (all statuses)
      const { data: requests, error: reqErr } = await supabase
        .from(REQUESTS_TABLE)
        .select('*')
        .order('created_at', { ascending: false });

      if (reqErr) {
        // Table might be named differently — surface the error clearly
        if (reqErr.code === '42P01') {
          setError(`Table "${REQUESTS_TABLE}" not found in Supabase. Please check the table name.`);
        } else {
          setError(reqErr.message);
        }
        setLoading(false);
        return;
      }

      setInstitutionRequests((requests as InstitutionRequest[]) || []);

      // Fetch approved institutions
      const { data: institutions, error: instErr } = await supabase
        .from(INSTITUTIONS_TABLE)
        .select('*')
        .order('created_at', { ascending: false });

      if (!instErr) {
        setApprovedInstitutions((institutions as SupabaseInstitution[]) || []);
      }

      // Fetch total student count
      const { count: studentCount } = await supabase
        .from(STUDENTS_TABLE)
        .select('id', { count: 'exact', head: true });
      setTotalStudents(studentCount || 0);

      // Fetch total order count
      const { count: orderCount } = await supabase
        .from(ORDERS_TABLE)
        .select('id', { count: 'exact', head: true });
      setTotalOrders(orderCount || 0);

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
      .channel('super_admin_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: REQUESTS_TABLE },
        () => {
          fetchAll();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: INSTITUTIONS_TABLE },
        () => {
          fetchAll();
        }
      )
      .subscribe((status) => {
        setIsRealtime(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAll]);

  // ---------------------------------------------------------------
  // Approve a request: update status + upsert into institutions table
  // ---------------------------------------------------------------
  const approveRequest = async (id: string) => {
    const request = institutionRequests.find((r) => r.id === id);
    if (!request) return;

    const { error: updateErr } = await supabase
      .from(REQUESTS_TABLE)
      .update({ status: 'active' })
      .eq('id', id);

    if (updateErr) {
      console.error('[Supabase] Approve error:', updateErr.message);
      return;
    }

    // Insert into institutions table if it exists
    const institutionRecord = {
      name: request.institution_name,
      email: request.institution_email,
      contact_person: request.contact_person,
      phone: request.phone_number,
      location: [request.city, request.state, request.country].filter(Boolean).join(', '),
      status: 'active',
      plan: request.plan || 'Basic',
      joined_date: new Date().toISOString().split('T')[0],
    };

    await supabase.from(INSTITUTIONS_TABLE).insert(institutionRecord);

    // Optimistic UI update
    setInstitutionRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'active' } : r))
    );
  };

  // ---------------------------------------------------------------
  // Reject a request
  // ---------------------------------------------------------------
  const rejectRequest = async (id: string) => {
    const { error: updateErr } = await supabase
      .from(REQUESTS_TABLE)
      .update({ status: 'rejected' })
      .eq('id', id);

    if (updateErr) {
      console.error('[Supabase] Reject error:', updateErr.message);
      return;
    }

    setInstitutionRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'rejected' } : r))
    );
  };

  // ---------------------------------------------------------------
  // Suspend institution
  // ---------------------------------------------------------------
  const suspendInstitution = async (id: string) => {
    await supabase.from(INSTITUTIONS_TABLE).update({ status: 'suspended' }).eq('id', id);
    setApprovedInstitutions((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: 'suspended' } : i))
    );
  };

  // ---------------------------------------------------------------
  // Activate institution
  // ---------------------------------------------------------------
  const activateInstitution = async (id: string) => {
    await supabase.from(INSTITUTIONS_TABLE).update({ status: 'active' }).eq('id', id);
    setApprovedInstitutions((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: 'active' } : i))
    );
  };

  return {
    institutionRequests,
    approvedInstitutions,
    loading,
    error,
    isRealtime,
    totalStudents,
    totalOrders,
    approveRequest,
    rejectRequest,
    suspendInstitution,
    activateInstitution,
    refresh: fetchAll,
  };
}
