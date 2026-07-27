import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Institution, Student, Vendor, Order, MenuItem, KitchenQueueItem, CampusBlock, StaffMember, Announcement, AuditLog, Counter, OrderStatus } from '../types';

interface InstitutionData {
  institution: Institution | null;
  students: Student[];
  vendors: Vendor[];
  counters: Counter[];
  orders: Order[];
  menuItems: MenuItem[];
  kitchenQueue: KitchenQueueItem[];
  campusBlocks: CampusBlock[];
  staff: StaffMember[];
  announcements: Announcement[];
  auditLogs: AuditLog[];
  profiles: { user_id: string; role: string; full_name?: string; email?: string; phone?: string }[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  updateStudentStatus: (studentId: string, status: 'active' | 'suspended') => Promise<void>;
  approveVendor: (vendorId: string) => Promise<void>;
  rejectVendor: (vendorId: string) => Promise<void>;
  suspendVendor: (vendorId: string) => Promise<void>;
  addCounter: (counter: Counter) => Promise<void>;
  toggleCounterAvailability: (counterId: string) => Promise<void>;
  updateKitchenStatus: (itemId: string, status: OrderStatus) => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  addMenuItem: (item: MenuItem) => Promise<void>;
  toggleMenuAvailability: (itemId: string) => Promise<void>;
  toggleStaffPermission: (staffId: string, permKey: string) => Promise<void>;
  addAnnouncement: (ann: Announcement) => Promise<void>;
}

export function useInstitutionData(institutionId: string | null): InstitutionData {
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [counters, setCounters] = useState<Counter[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [kitchenQueue, setKitchenQueue] = useState<KitchenQueueItem[]>([]);
  const [campusBlocks, setCampusBlocks] = useState<CampusBlock[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [profiles, setProfiles] = useState<{ user_id: string; role: string; full_name?: string; email?: string; phone?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const enrichOrdersWithProfile = useCallback((rawOrders: any[], profileList: { user_id: string; role: string; full_name?: string; email?: string; phone?: string }[]) => {
    const profileMap = new Map(profileList.map(p => [p.user_id, p]));
    return rawOrders.map(o => {
      const studentId = o.student_id || o.studentId;
      const profile = studentId ? profileMap.get(studentId) : undefined;
      return {
        ...o,
        userRole: profile?.role || o.user_role || '',
        userEmail: profile?.email || o.user_email || '',
        userPhone: profile?.phone || o.user_phone || '',
      } as Order;
    });
  }, []);

  const enrichKitchenQueueWithProfile = useCallback((rawOrders: any[], profileList: { user_id: string; role: string; full_name?: string; email?: string; phone?: string }[]) => {
    const profileMap = new Map(profileList.map(p => [p.user_id, p]));
    return rawOrders
      .filter(o => ['pending', 'preparing', 'ready'].includes(o.status))
      .map(o => {
        const studentId = o.student_id || o.studentId;
        const profile = studentId ? profileMap.get(studentId) : undefined;
        return {
          id: `kq-${o.id}`,
          orderId: o.id,
          orderNumber: o.order_number || o.orderNumber || '',
          itemsSummary: o.items ? (Array.isArray(o.items) ? o.items.map((i: any) => `${i.quantity || i.quantity || 0}x ${i.name || ''}`).join(', ') : '') : '',
          status: o.status,
          prepTimeMinutes: o.estimated_wait_mins || o.estimatedWaitMins || 5,
          elapsedSeconds: 0,
          isPriority: o.is_priority || o.isPriority || false,
          notes: o.notes,
          counterNumber: o.pickup_counter || o.pickupCounter || '',
          customerName: profile?.full_name || o.customer_name || o.student_name || o.studentName || '',
          customerRole: profile?.role || o.user_role || '',
          pickupTime: o.pickup_time_estimated || o.pickupTimeEstimated || '',
        };
      });
  }, []);

  const fetchAll = useCallback(async () => {
    if (!institutionId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const [
        { data: instData },
        { data: studentsData },
        { data: vendorsData },
        { data: countersData },
        { data: ordersData },
        { data: menuItemsData },
        { data: campusData },
        { data: staffData },
        { data: announcementsData },
        { data: auditLogsData },
        { data: profilesData },
      ] = await Promise.all([
        supabase.from('institutions').select('*').eq('id', institutionId).single(),
        supabase.from('students').select('*').eq('institution_id', institutionId),
        supabase.from('vendors').select('*').eq('institution_id', institutionId),
        supabase.from('counters').select('*').eq('institution_id', institutionId),
        supabase.from('orders').select('*').eq('institution_id', institutionId),
        supabase.from('menu_items').select('*').eq('institution_id', institutionId),
        supabase.from('campus_blocks').select('*').eq('institution_id', institutionId),
        supabase.from('staff').select('*').eq('institution_id', institutionId),
        supabase.from('announcements').select('*').eq('institution_id', institutionId),
        supabase.from('audit_logs').select('*').eq('institution_id', institutionId),
        supabase.from('profiles').select('*'),
      ]);

      if (instData) {
        const d = instData as any;
        setInstitution({
          id: d.id,
          name: d.name,
          institution_code: d.institution_code || '',
          studentsCount: d.students_count || d.student_population || 0,
          vendorsCount: d.vendors || 0,
          dailyOrdersCount: d.daily_orders_count || 0,
          monthlyRevenue: d.monthly_revenue || 0,
          status: d.status || 'active',
          contactPerson: d.contact_person || '',
          email: d.email || d.institution_email || '',
          phone: d.phone || '',
          joinedDate: d.joined_date || d.created_at || '',
          plan: d.plan || 'Basic',
          logoUrl: d.logo_url || '',
          lastActivity: d.last_login || '',
          type: d.type || d.institution_type || '',
          campus: d.campus || '',
          city: d.city || '',
          state: d.state || '',
          country: d.country || '',
          institutionEmail: d.institution_email || '',
          role: d.role || '',
          institutionWebsite: d.institution_website || '',
          studentPopulation: d.student_population || 0,
          foodCourts: d.food_courts || 0,
          vendors: d.vendors || 0,
          message: d.message || '',
          generatedEmail: d.generated_email || '',
          generatedPassword: d.generated_password || '',
          approvedBy: d.approved_by || '',
          approvedAt: d.approved_at || '',
        } as Institution);
      }
      if (studentsData) setStudents(studentsData as Student[]);
      if (vendorsData) setVendors(vendorsData as Vendor[]);
      if (countersData) setCounters(countersData as Counter[]);
      if (profilesData) setProfiles(profilesData as any);
      if (ordersData) {
        const enriched = enrichOrdersWithProfile(ordersData as any[], (profilesData as any[]) || []);
        setOrders(enriched);
        setKitchenQueue(enrichKitchenQueueWithProfile(ordersData as any[], (profilesData as any[]) || []));
      }
      if (menuItemsData) setMenuItems(menuItemsData as MenuItem[]);
      if (campusData) setCampusBlocks(campusData as CampusBlock[]);
      if (staffData) setStaff(staffData as StaffMember[]);
      if (announcementsData) setAnnouncements(announcementsData as Announcement[]);
      if (auditLogsData) setAuditLogs(auditLogsData as AuditLog[]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [institutionId, enrichOrdersWithProfile, enrichKitchenQueueWithProfile]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (!institutionId) return;
    const channel = supabase
      .channel(`inst_data_${institutionId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students', filter: `institution_id=eq.${institutionId}` }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vendors', filter: `institution_id=eq.${institutionId}` }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `institution_id=eq.${institutionId}` }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items', filter: `institution_id=eq.${institutionId}` }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements', filter: `institution_id=eq.${institutionId}` }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'counters', filter: `institution_id=eq.${institutionId}` }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'staff', filter: `institution_id=eq.${institutionId}` }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `institution_id=eq.${institutionId}` }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [institutionId, fetchAll]);

  const updateStudentStatus = async (studentId: string, status: 'active' | 'suspended') => {
    await supabase.from('students').update({ status }).eq('id', studentId);
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, status } : s));
  };

  const approveVendor = async (vendorId: string) => {
    await supabase.from('vendors').update({ status: 'approved' }).eq('id', vendorId);
    setVendors(prev => prev.map(v => v.id === vendorId ? { ...v, status: 'approved' } : v));
  };

  const rejectVendor = async (vendorId: string) => {
    await supabase.from('vendors').update({ status: 'rejected' }).eq('id', vendorId);
    setVendors(prev => prev.map(v => v.id === vendorId ? { ...v, status: 'rejected' } : v));
  };

  const suspendVendor = async (vendorId: string) => {
    await supabase.from('vendors').update({ status: 'suspended' }).eq('id', vendorId);
    setVendors(prev => prev.map(v => v.id === vendorId ? { ...v, status: 'suspended' } : v));
  };

  const addCounter = async (counter: Counter) => {
    const { data } = await supabase.from('counters').insert({ ...counter, institution_id: institutionId }).select().single();
    if (data) setCounters(prev => [...prev, data as Counter]);
  };

  const toggleCounterAvailability = async (counterId: string) => {
    const c = counters.find(c => c.id === counterId);
    if (!c) return;
    await supabase.from('counters').update({ is_available: !c.isAvailable }).eq('id', counterId);
    setCounters(prev => prev.map(c => c.id === counterId ? { ...c, isAvailable: !c.isAvailable } : c));
  };

  const updateKitchenStatus = async (itemId: string, status: OrderStatus) => {
    await supabase.from('orders').update({ status }).eq('id', itemId);
    setKitchenQueue(prev => prev.map(item => item.orderId === itemId ? { ...item, status } : item));
    setOrders(prev => prev.map(o => o.id === itemId ? { ...o, status } : o));
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    await supabase.from('orders').update({ status }).eq('id', orderId);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  };

  const addMenuItem = async (item: MenuItem) => {
    const { data } = await supabase.from('menu_items').insert({ ...item, institution_id: institutionId }).select().single();
    if (data) setMenuItems(prev => [data as MenuItem, ...prev]);
  };

  const toggleMenuAvailability = async (itemId: string) => {
    const m = menuItems.find(m => m.id === itemId);
    if (!m) return;
    await supabase.from('menu_items').update({ is_available: !m.isAvailable }).eq('id', itemId);
    setMenuItems(prev => prev.map(m => m.id === itemId ? { ...m, isAvailable: !m.isAvailable } : m));
  };

  const toggleStaffPermission = async (staffId: string, permKey: string) => {
    const s = staff.find(s => s.id === staffId);
    if (!s) return;
    const newPerms = { ...s.permissions, [permKey]: !s.permissions[permKey as keyof typeof s.permissions] };
    await supabase.from('staff').update({ permissions: newPerms }).eq('id', staffId);
    setStaff(prev => prev.map(s => s.id === staffId ? { ...s, permissions: newPerms } : s));
  };

  const addAnnouncement = async (ann: Announcement) => {
    const { data } = await supabase.from('announcements').insert({ ...ann, institution_id: institutionId }).select().single();
    if (data) setAnnouncements(prev => [data as Announcement, ...prev]);
  };

  return {
    institution,
    students, vendors, counters, orders, menuItems, kitchenQueue, campusBlocks, staff, announcements, auditLogs, profiles,
    loading, error,
    refresh: fetchAll,
    updateStudentStatus, approveVendor, rejectVendor, suspendVendor, addCounter, toggleCounterAvailability,
    updateKitchenStatus, updateOrderStatus, addMenuItem, toggleMenuAvailability, toggleStaffPermission, addAnnouncement,
  };
}
