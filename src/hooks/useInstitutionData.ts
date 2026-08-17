import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
  Institution, Student, Vendor, Order, MenuItem,
  CampusBlock, StaffMember, Announcement, AuditLog, Counter, MenuCategory, OrderStatus,
} from '../types';
import { useOrderRealtime } from './useOrderRealtime';

const DATA_FETCH_TIMEOUT_MS = 15000;

function withTimeout<T>(promise: PromiseLike<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

interface InstitutionData {
  institution: Institution | null;
  students: Student[];
  vendors: Vendor[];
  counters: Counter[];
  orders: Order[];
  menuItems: MenuItem[];
  menuCategories: MenuCategory[];
  campusBlocks: CampusBlock[];
  staff: StaffMember[];
  announcements: Announcement[];
  auditLogs: AuditLog[];
  profiles: { user_id: string; role: string; full_name?: string; email?: string; phone?: string }[];
  loading: boolean;
  error: string | null;
  ordersRealtimeStatus: string;
  refresh: () => void;
  updateStudentStatus: (studentId: string, status: 'active' | 'suspended') => Promise<void>;
  deleteStudent: (studentId: string) => Promise<void>;
  approveVendor: (vendorId: string) => Promise<void>;
  rejectVendor: (vendorId: string) => Promise<void>;
  suspendVendor: (vendorId: string) => Promise<void>;
  deleteVendor: (vendorId: string) => Promise<void>;
  addCounter: (counter: Counter) => Promise<string | null>;
  updateCounter: (counterId: string, updates: Partial<Counter>) => Promise<void>;
  deleteCounter: (counterId: string) => Promise<void>;
  archiveCounter: (counterId: string) => Promise<void>;
  restoreCounter: (counterId: string) => Promise<void>;
  updateCounterStatus: (counterId: string, status: string) => Promise<void>;
  toggleCounterAvailability: (counterId: string) => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<boolean>;
  fetchOrderDetails: (orderId: string) => Promise<Order | null>;
  updatingOrderId: string | null;
  addMenuItem: (item: MenuItem) => Promise<string | null>;
  updateMenuItem: (itemId: string, updates: Partial<MenuItem>) => Promise<void>;
  deleteMenuItem: (itemId: string) => Promise<void>;
  toggleMenuAvailability: (itemId: string) => Promise<void>;
  addMenuCategory: (cat: Partial<MenuCategory>) => Promise<string | null>;
  updateMenuCategory: (catId: string, updates: Partial<MenuCategory>) => Promise<void>;
  deleteMenuCategory: (catId: string) => Promise<void>;
  toggleStaffPermission: (staffId: string, permKey: string) => Promise<void>;
  addStaff: (staff: Partial<StaffMember>) => Promise<string | null>;
  updateStaff: (staffId: string, updates: Partial<StaffMember>) => Promise<void>;
  deleteStaff: (staffId: string) => Promise<void>;
  deleteAnnouncement: (announcementId: string) => Promise<void>;
  updateInstitution: (updates: Partial<Institution>) => Promise<void>;
  addAnnouncement: (ann: Announcement) => Promise<void>;
  uploadImage: (file: File, path: string) => Promise<string | null>;
}

function mapDbCounterToCounter(db: any): Counter {
  return {
    id: db.id,
    institution_id: db.institution_id,
    code: db.name || '',
    name: db.name || '',
    campusBlock: '',
    categories: [],
    operatingHours: '',
    isAvailable: db.status !== 'inactive' && db.status !== 'archived',
    assignedStaff: Array.isArray(db.assigned_staff) ? db.assigned_staff : [],
    queueLength: 0,
    avgWaitTimeMins: 0,
    activeMenuCount: 0,
    status: db.status || 'active',
    created_at: db.created_at,
  };
}

function mapCounterToDb(counter: Counter, institutionId: string | null): any {
  return {
    institution_id: institutionId,
    name: counter.name || '',
    assigned_staff: counter.assignedStaff || [],
    status: counter.isAvailable !== false ? 'active' : 'inactive',
  };
}

function mapDbCanteenToVendor(db: any): Vendor {
  const rawStatus = String(db.status || 'active').toLowerCase();
  let status: Vendor['status'];
  if (rawStatus === 'pending') status = 'pending';
  else if (rawStatus === 'rejected') status = 'rejected';
  else if (rawStatus === 'suspended' || rawStatus === 'inactive' || rawStatus === 'archived') status = 'suspended';
  else status = 'approved';
  return {
    id: db.id,
    name: db.name || '',
    ownerName: db.owner_name || db.contact_person || '',
    email: db.contact_email || db.email || '',
    phone: db.contact_phone || db.phone || '',
    campusBlock: db.campus_block || db.campus || '',
    outletType: db.outlet_type || db.type || '',
    seatingCapacity: Number(db.seating_capacity || 0),
    openingHours: db.opening_hours || '',
    status,
    rating: Number(db.rating || 0),
    monthlyRevenue: Number(db.monthly_revenue || 0),
    ordersCount: Number(db.orders_count || 0),
    appliedDate: db.applied_date || db.created_at || '',
    documentsSubmitted: !!db.documents_submitted,
  };
}

function mapDbMenuItemToMenuItem(db: any): MenuItem {
  const joinedCategory = Array.isArray(db.menu_categories) ? db.menu_categories[0] : db.menu_categories;
  const categoryName = joinedCategory?.name || db.category_name || db.category || '';
  const isVeg = db.food_type === 'Veg' || db.food_type === 'Vegan';
  return {
    id: db.id,
    institution_id: db.institution_id,
    canteen_id: db.canteen_id,
    category_id: db.category_id,
    vendorId: db.canteen_id || '',
    vendorName: '',
    name: db.food_name || '',
    category: categoryName,
    categoryName,
    price: parseFloat(db.regular_price ?? db.price ?? 0),
    regular_price: parseFloat(db.regular_price ?? db.price ?? 0),
    discountPrice: db.discount_price ? parseFloat(db.discount_price) : undefined,
    prepTimeMinutes: db.preparation_time || 0,
    servingSize: db.serving_size || '',
    calories: db.calories || 0,
    proteinGrams: 0,
    isVegetarian: isVeg,
    food_type: db.food_type || 'Veg',
    dietaryType: db.food_type || 'Veg',
    isAvailable: db.is_available ?? db.availability ?? true,
    stockCount: 0,
    imageUrl: db.image_url || '',
    description: db.description || '',
    ingredients: Array.isArray(db.ingredients) ? db.ingredients : [],
    allergens: [],
    aiPopularityScore: db.ai_popularity_score || 0,
    status: db.status || 'published',
    pickupType: db.pickup_type || '',
    created_at: db.created_at,
    createdAt: db.created_at,
  };
}

function mapMenuItemToDb(item: MenuItem, institutionId: string | null): any {
  return {
    institution_id: institutionId,
    canteen_id: item.canteen_id || null,
    category_id: item.category_id || null,
    food_name: item.name || '',
    price: item.price || 0,
    regular_price: item.price || item.regular_price || 0,
    discount_price: item.discountPrice || null,
    preparation_time: item.prepTimeMinutes || 0,
    serving_size: item.servingSize || '',
    calories: item.calories || 0,
    availability: item.isAvailable !== false,
    is_available: item.isAvailable !== false,
    food_type: item.food_type || item.dietaryType || 'Veg',
    image_url: item.imageUrl || '',
    description: item.description || '',
    ingredients: item.ingredients || [],
    ai_popularity_score: item.aiPopularityScore || 0,
    status: item.status || 'published',
    pickup_type: item.pickupType || null,
  };
}

export function useInstitutionData(institutionId: string | null): InstitutionData {
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [counters, setCounters] = useState<Counter[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const [campusBlocks, setCampusBlocks] = useState<CampusBlock[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [profiles, setProfiles] = useState<{ user_id: string; role: string; full_name?: string; email?: string; phone?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchedInstIdRef = useRef<string | null>(null);

  const orderRealtime = useOrderRealtime(institutionId, profiles);
  const orders = orderRealtime.orders;
  const ordersLoading = orderRealtime.loading;
  const ordersError = orderRealtime.error;
  const ordersRealtimeStatus = orderRealtime.realtimeStatus;
  const updateOrderStatus = orderRealtime.updateOrderStatus;
  const fetchOrderDetails = orderRealtime.fetchOrderDetails;
  const updatingOrderId = orderRealtime.updatingOrderId;

  const fetchAll = useCallback(async () => {
    if (!institutionId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [
        { data: instData, error: instErr },
        { data: studentsData },
        { data: canteensData, error: canteensErr },
        { data: menuItemsData },
        { data: menuCatsData },
        { data: staffData },
        { data: notificationsData },
        { data: auditLogsData },
        { data: profilesData },
      ] = await Promise.all([
        withTimeout(supabase.from('institutions').select('*').eq('id', institutionId).single(), DATA_FETCH_TIMEOUT_MS, 'Institutions fetch'),
        withTimeout(supabase.from('profiles').select('*').eq('institution_id', institutionId).eq('role', 'student'), DATA_FETCH_TIMEOUT_MS, 'Students fetch'),
        withTimeout(supabase.from('canteens').select('*').eq('institution_id', institutionId), DATA_FETCH_TIMEOUT_MS, 'Canteens fetch'),
        withTimeout(supabase.from('menu_items').select('*, menu_categories(name)').eq('institution_id', institutionId), DATA_FETCH_TIMEOUT_MS, 'Menu items fetch'),
        withTimeout(supabase.from('menu_categories').select('*').eq('institution_id', institutionId), DATA_FETCH_TIMEOUT_MS, 'Menu categories fetch'),
        withTimeout(supabase.from('profiles').select('*').eq('institution_id', institutionId).neq('role', 'student').neq('role', 'super_admin'), DATA_FETCH_TIMEOUT_MS, 'Staff fetch'),
        withTimeout(supabase.from('notifications').select('*').eq('institution_id', institutionId), DATA_FETCH_TIMEOUT_MS, 'Notifications fetch'),
        withTimeout(Promise.resolve({ data: [], error: null }), DATA_FETCH_TIMEOUT_MS, 'Audit logs fetch (skipped)'),
        withTimeout(supabase.from('profiles').select('*').eq('institution_id', institutionId), DATA_FETCH_TIMEOUT_MS, 'Profiles fetch'),
      ]);

      if (instErr) console.error('[Data] institutions fetch error:', instErr);
      if (canteensErr) console.warn('[Data] canteens fetch warning:', canteensErr.message);

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
          plan: d.plan || '',
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
      if (canteensData) {
        const canteens = canteensData as any[];
        setCounters(canteens.map(mapDbCounterToCounter));
        setVendors(canteens.map(mapDbCanteenToVendor));
      }
      if (profilesData) setProfiles(profilesData as any);
      if (menuItemsData) setMenuItems((menuItemsData as any[]).map(mapDbMenuItemToMenuItem));
      if (menuCatsData) setMenuCategories((menuCatsData as any[]) as MenuCategory[]);

      if (instData) {
        const d = instData as any;
        const campus = d.campus || '';
        setCampusBlocks(campus ? [{
          id: institutionId + '-campus',
          name: campus,
          code: campus.toUpperCase().replace(/\s+/g, '-'),
          departmentsCount: 0,
          totalStudents: d.student_population || 0,
          canteensCount: (canteensData as any[])?.length || 0,
          operatingHours: '08:00 AM - 09:00 PM',
          foodCourts: [],
        }] : []);
      }
      if (staffData) {
        setStaff((staffData as any[]).map((s: any) => ({
          id: s.id,
          name: s.full_name || s.name || '',
          email: s.email || '',
          role: s.role || 'Support Staff',
          department: s.department || '',
          assignedCampusBlock: s.assigned_campus_block || s.assignedCampusBlock || '',
          status: s.status || 'active',
          lastActive: s.last_active || '',
          permissions: {
            menuEdit: s.permissions?.menuEdit ?? false,
            orderManage: s.permissions?.orderManage ?? false,
            vendorApprove: s.permissions?.vendorApprove ?? false,
            analyticsView: s.permissions?.analyticsView ?? false,
            staffManage: s.permissions?.staffManage ?? false,
          },
        } as StaffMember)));
      }
      if (notificationsData) setAnnouncements(notificationsData as Announcement[]);
      if (auditLogsData) setAuditLogs(auditLogsData as AuditLog[]);

      fetchedInstIdRef.current = institutionId;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error('[useInstitutionData] fetchAll error:', err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [institutionId]);

  useEffect(() => {
    if (institutionId) {
      fetchedInstIdRef.current = null;
      fetchAll();
    } else {
      setLoading(false);
    }
  }, [institutionId, fetchAll]);


  useEffect(() => {
    if (!institutionId) return;

    const menuChannel = supabase
      .channel(`menu_items_realtime_${institutionId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'menu_items',
        filter: `institution_id=eq.${institutionId}`,
      }, () => {
        fetchAll();
      })
      .subscribe();

    const canteenChannel = supabase
      .channel(`canteens_realtime_${institutionId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'canteens',
        filter: `institution_id=eq.${institutionId}`,
      }, () => {
        fetchAll();
      })
      .subscribe();

    const categoryChannel = supabase
      .channel(`menu_categories_realtime_${institutionId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'menu_categories',
        filter: `institution_id=eq.${institutionId}`,
      }, () => {
        fetchAll();
      })
      .subscribe();

    const profilesChannelSub = supabase
      .channel(`profiles_realtime_${institutionId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles',
        filter: `institution_id=eq.${institutionId}`,
      }, (payload: any) => {
        const eventType = payload?.eventType;
        const record: any = payload?.new || payload?.old;
        if (!record || !record.id) return;
        setProfiles(prev => {
          const key = (p: any) => p.user_id || p.id;
          const recKey = record.user_id || record.id;
          if (eventType === 'DELETE') return prev.filter(p => key(p) !== recKey);
          const exists = prev.some(p => key(p) === recKey);
          return exists ? prev.map(p => key(p) === recKey ? record : p) : [...prev, record];
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(menuChannel);
      supabase.removeChannel(categoryChannel);
      supabase.removeChannel(canteenChannel);
      supabase.removeChannel(profilesChannelSub);
    };
  }, [institutionId, fetchAll]);

  const uploadImage = async (file: File, path: string): Promise<string | null> => {
    try {
      if (!file || !path) {
        console.error('[Upload] Invalid file or path');
        return null;
      }
      const ext = file.name.split('.').pop() || 'jpg';
      const filePath = `${path}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { data, error } = await supabase.storage.from('food-images').upload(filePath, file, { upsert: true });
      if (error) {
        console.error('[Upload] Storage error:', error);
        return null;
      }
      if (!data) {
        console.error('[Upload] No data returned from upload');
        return null;
      }
      const { data: urlData } = supabase.storage.from('food-images').getPublicUrl(data.path);
      return urlData.publicUrl;
    } catch (err) {
      console.error('[Upload] Unexpected error:', err);
      return null;
    }
  };

  const updateStudentStatus = async (studentId: string, status: 'active' | 'suspended') => {
    if (!studentId || !status) {
      console.error('[updateStudentStatus] Invalid studentId or status');
      return;
    }
    try {
      const { error } = await supabase.from('profiles').update({ status }).eq('id', studentId);
      if (error) console.warn('[updateStudentStatus] profiles table may not have status column:', error.message);
    } catch (err) {
      console.error('[updateStudentStatus] Error updating status:', err);
    }
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, status } : s));
  };

  const approveVendor = async (vendorId: string) => {
    const { error } = await supabase.from('canteens').update({ status: 'approved' }).eq('id', vendorId);
    if (error) console.error('[approveVendor] Error:', error);
    setVendors(prev => prev.map(v => v.id === vendorId ? { ...v, status: 'approved' } : v));
  };

  const rejectVendor = async (vendorId: string) => {
    const { error } = await supabase.from('canteens').update({ status: 'rejected' }).eq('id', vendorId);
    if (error) console.error('[rejectVendor] Error:', error);
    setVendors(prev => prev.map(v => v.id === vendorId ? { ...v, status: 'rejected' } : v));
  };

  const suspendVendor = async (vendorId: string) => {
    const { error } = await supabase.from('canteens').update({ status: 'suspended' }).eq('id', vendorId);
    if (error) console.error('[suspendVendor] Error:', error);
    setVendors(prev => prev.map(v => v.id === vendorId ? { ...v, status: 'suspended' } : v));
  };

  const addCounter = async (counter: Counter): Promise<string | null> => {
    const existingCounter = counters.find(c => c.code.toLowerCase() === counter.code.toLowerCase() && c.institution_id === institutionId);
    if (existingCounter) {
      setError(`Counter code "${counter.code}" already exists.`);
      return null;
    }
    const dbPayload = mapCounterToDb(counter, institutionId);
    const { data, error } = await supabase.from('canteens').insert(dbPayload).select().single();
    if (error) {
      console.error('[addCounter] Supabase error:', error);
      setError(`Failed to create counter: ${error.message}`);
      return null;
    }
    if (data) {
      const newCounter = mapDbCounterToCounter(data);
      setCounters(prev => [...prev, newCounter]);
      return data.id;
    }
    return null;
  };

const updateCounter = async (counterId: string, updates: Partial<Counter>) => {
     const dbUpdates: any = {};
     if (updates.name !== undefined) dbUpdates.name = updates.name;
     if (updates.assignedStaff !== undefined) dbUpdates.assigned_staff = updates.assignedStaff;
     if (updates.isAvailable !== undefined) dbUpdates.status = updates.isAvailable ? 'active' : 'inactive';
     const { error } = await supabase.from('canteens').update(dbUpdates).eq('id', counterId);
     if (error) {
       console.error('[updateCounter] Error:', error);
       setError(`Failed to update counter: ${error.message}`);
       return;
     }
     setCounters(prev => prev.map(c => c.id === counterId ? { ...c, ...updates } : c));
   };

  const deleteCounter = async (counterId: string) => {
    const { error } = await supabase.from('canteens').delete().eq('id', counterId);
    if (error) {
      console.error('[deleteCounter] Error:', error);
      setError(`Failed to delete counter: ${error.message}`);
      return;
    }
    setCounters(prev => prev.filter(c => c.id !== counterId));
  };

const archiveCounter = async (counterId: string) => {
     const { error } = await supabase.from('canteens').update({ status: 'archived' }).eq('id', counterId);
     if (error) {
       console.error('[archiveCounter] Error:', error);
       setError(`Failed to archive counter: ${error.message}`);
       return;
     }
     setCounters(prev => prev.map(c => c.id === counterId ? { ...c, status: 'archived', isAvailable: false } : c));
   };

   const restoreCounter = async (counterId: string) => {
     const { error } = await supabase.from('canteens').update({ status: 'active' }).eq('id', counterId);
     if (error) {
       console.error('[restoreCounter] Error:', error);
       setError(`Failed to restore counter: ${error.message}`);
       return;
     }
     setCounters(prev => prev.map(c => c.id === counterId ? { ...c, status: 'active', isAvailable: true } : c));
   };

   const updateCounterStatus = async (counterId: string, status: string) => {
     const { error } = await supabase.from('canteens').update({ status }).eq('id', counterId);
     if (error) {
       console.error('[updateCounterStatus] Error:', error);
       setError(`Failed to update counter status: ${error.message}`);
       return;
     }
     setCounters(prev => prev.map(c => c.id === counterId ? { ...c, status } : c));
   };

   const toggleCounterAvailability = async (counterId: string) => {
     const c = counters.find(c => c.id === counterId);
     if (!c) return;
     const newAvailable = !c.isAvailable;
     const newStatus = newAvailable ? 'active' : 'inactive';
     const { error } = await supabase.from('canteens').update({ status: newStatus }).eq('id', counterId);
     if (error) {
       console.error('[toggleCounterAvailability] Error:', error);
       setError(`Failed to toggle counter: ${error.message}`);
       return;
     }
      setCounters(prev => prev.map(c => c.id === counterId ? { ...c, isAvailable: newAvailable, status: newStatus } : c));
   };

  const ensureMenuCategory = async (name?: string, canteenId?: string): Promise<string | null> => {
    const cleanName = (name || '').trim();
    if (!cleanName || !institutionId) return null;

    const existing = menuCategories.find((cat) =>
      cat.name.toLowerCase() === cleanName.toLowerCase() &&
      (!canteenId || !cat.canteen_id || cat.canteen_id === canteenId)
    );
    if (existing) return existing.id;

    const { data, error } = await supabase
      .from('menu_categories')
      .insert({
        institution_id: institutionId,
        canteen_id: canteenId || null,
        name: cleanName,
        description: '',
      })
      .select()
      .single();

    if (error) {
      console.error('[ensureMenuCategory] Supabase error:', error);
      setError(`Failed to create category: ${error.message}`);
      return null;
    }

    if (data) {
      setMenuCategories(prev => [...prev, data as MenuCategory]);
      return data.id;
    }

    return null;
  };

  const addMenuItem = async (item: MenuItem): Promise<string | null> => {
    const categoryId = item.category_id || await ensureMenuCategory(item.category || item.categoryName, item.canteen_id || item.vendorId);
    const dbPayload = mapMenuItemToDb({ ...item, category_id: categoryId || undefined }, institutionId);
    const { data, error } = await supabase.from('menu_items').insert(dbPayload).select().single();
    if (error) {
      console.error('[addMenuItem] Supabase error:', error);
      setError(`Failed to save menu item: ${error.message}`);
      return null;
    }
    if (data) {
      const newItem = mapDbMenuItemToMenuItem(data);
      setMenuItems(prev => [newItem, ...prev]);
      return data.id;
    }
    return null;
  };

const updateMenuItem = async (itemId: string, updates: Partial<MenuItem>) => {
     const categoryId = updates.category_id || await ensureMenuCategory(updates.category || updates.categoryName, updates.canteen_id);
     const dbUpdates: any = {};
     if (updates.name !== undefined) dbUpdates.food_name = updates.name;
     if (updates.description !== undefined) dbUpdates.description = updates.description;
     if (updates.price !== undefined) dbUpdates.regular_price = updates.price;
     if (updates.discountPrice !== undefined) dbUpdates.discount_price = updates.discountPrice;
     if (updates.prepTimeMinutes !== undefined) dbUpdates.preparation_time = updates.prepTimeMinutes;
     if (updates.servingSize !== undefined) dbUpdates.serving_size = updates.servingSize;
     if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;
     if (updates.isAvailable !== undefined) { dbUpdates.availability = updates.isAvailable; dbUpdates.is_available = updates.isAvailable; }
     if (updates.status !== undefined) dbUpdates.status = updates.status;
     if (updates.food_type !== undefined) dbUpdates.food_type = updates.food_type;
     if (updates.canteen_id !== undefined) dbUpdates.canteen_id = updates.canteen_id;
     if (updates.category_id !== undefined || categoryId) dbUpdates.category_id = categoryId || updates.category_id;
     if (updates.calories !== undefined) dbUpdates.calories = updates.calories;
     if (updates.isTodaysSpecial !== undefined) dbUpdates.is_todays_special = updates.isTodaysSpecial;
     if (updates.ingredients !== undefined) dbUpdates.ingredients = updates.ingredients;

     const { error } = await supabase.from('menu_items').update(dbUpdates).eq('id', itemId);
     if (error) {
       console.error('[updateMenuItem] Error:', error);
       setError(`Failed to update menu item: ${error.message}`);
       return;
     }
     setMenuItems(prev => prev.map(m => m.id === itemId ? { ...m, ...updates } : m));
   };

  const deleteMenuItem = async (itemId: string) => {
    const { error } = await supabase.from('menu_items').delete().eq('id', itemId);
    if (error) {
      console.error('[deleteMenuItem] Error:', error);
      setError(`Failed to delete menu item: ${error.message}`);
      return;
    }
    setMenuItems(prev => prev.filter(m => m.id !== itemId));
  };

const toggleMenuAvailability = async (itemId: string) => {
     const m = menuItems.find(m => m.id === itemId);
     if (!m) return;
     const newAvail = !m.isAvailable;
     const { error } = await supabase.from('menu_items').update({ is_available: newAvail, availability: newAvail }).eq('id', itemId);
     if (error) {
       console.error('[toggleMenuAvailability] Error:', error);
       setError(`Failed to toggle availability: ${error.message}`);
       return;
     }
     setMenuItems(prev => prev.map(m => m.id === itemId ? { ...m, isAvailable: newAvail } : m));
   };

const addMenuCategory = async (cat: Partial<MenuCategory>): Promise<string | null> => {
     const payload = {
       institution_id: institutionId,
       canteen_id: cat.canteen_id || null,
       name: cat.name || '',
       description: cat.description || '',
     };
     const { data, error } = await supabase.from('menu_categories').insert(payload).select().single();
     if (error) {
       console.error('[addMenuCategory] Supabase error:', error);
       setError(`Failed to create category: ${error.message}`);
       return null;
     }
     if (data) {
       setMenuCategories(prev => [...prev, data as MenuCategory]);
       return data.id;
     }
     return null;
   };

   const updateMenuCategory = async (catId: string, updates: Partial<MenuCategory>) => {
     const dbUpdates: any = {};
     if (updates.name !== undefined) dbUpdates.name = updates.name;
     if (updates.canteen_id !== undefined) dbUpdates.canteen_id = updates.canteen_id;
     const { error } = await supabase.from('menu_categories').update(dbUpdates).eq('id', catId);
     if (error) {
       console.error('[updateMenuCategory] Error:', error);
       setError(`Failed to update category: ${error.message}`);
       return;
     }
     setMenuCategories(prev => prev.map(c => c.id === catId ? { ...c, ...updates } : c));
   };

  const deleteMenuCategory = async (catId: string) => {
    const { error } = await supabase.from('menu_categories').delete().eq('id', catId);
    if (error) {
      console.error('[deleteMenuCategory] Error:', error);
      setError(`Failed to delete category: ${error.message}`);
      return;
    }
    setMenuCategories(prev => prev.filter(c => c.id !== catId));
  };

const toggleStaffPermission = async (staffId: string, permKey: string) => {
     const s = staff.find(s => s.id === staffId);
     if (!s) return;
     const newPerms = { ...s.permissions, [permKey]: !s.permissions[permKey as keyof typeof s.permissions] };
     setStaff(prev => prev.map(s => s.id === staffId ? { ...s, permissions: newPerms } : s));
     try {
       const { error } = await supabase.from('profiles').update({ permissions: newPerms }).eq('id', staffId);
       if (error) console.warn('[toggleStaffPermission] Could not persist permissions:', error.message);
     } catch {
       console.warn('[toggleStaffPermission] Could not persist permissions');
     }
   };

  const deleteStudent = async (studentId: string) => {
    const { error } = await supabase.from('profiles').delete().eq('id', studentId).eq('institution_id', institutionId);
    if (error) {
      console.error('[deleteStudent] Error:', error);
      setError(`Failed to delete student: ${error.message}`);
      return;
    }
    setStudents(prev => prev.filter(s => s.id !== studentId));
  };

  const deleteVendor = async (vendorId: string) => {
    const { error } = await supabase.from('canteens').delete().eq('id', vendorId);
    if (error) {
      console.error('[deleteVendor] Error:', error);
      setError(`Failed to delete vendor: ${error.message}`);
      return;
    }
    setVendors(prev => prev.filter(v => v.id !== vendorId));
  };

  const addStaff = async (staffData: Partial<StaffMember>): Promise<string | null> => {
    const { data, error } = await supabase.from('profiles').insert({
      institution_id: institutionId,
      role: 'staff',
      full_name: staffData.name || '',
      email: staffData.email || '',
    }).select().single();
    if (error) {
      console.error('[addStaff] Error:', error);
      setError(`Failed to add staff: ${error.message}`);
      return null;
    }
    if (data) {
      const perms = (data as any).permissions || {};
      const newStaff: StaffMember = {
        id: data.id,
        name: data.full_name || data.email || '',
        email: data.email || '',
        role: 'Kitchen Manager',
        department: '',
        assignedCampusBlock: '',
        status: data.status || 'active',
        lastActive: '',
        permissions: {
          menuEdit: perms.menuEdit ?? false,
          orderManage: perms.orderManage ?? false,
          vendorApprove: perms.vendorApprove ?? false,
          analyticsView: perms.analyticsView ?? false,
          staffManage: perms.staffManage ?? false,
        },
      };
      setStaff(prev => [...prev, newStaff]);
      return data.id;
    }
    return null;
  };

  const updateStaff = async (staffId: string, updates: Partial<StaffMember>) => {
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.full_name = updates.name;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    try {
      const { error } = await supabase.from('profiles').update(dbUpdates).eq('id', staffId);
      if (error) console.warn('[updateStaff] Error:', error.message);
    } catch {
      console.warn('[updateStaff] Could not update profiles table');
    }
    setStaff(prev => prev.map(s => s.id === staffId ? { ...s, ...updates } : s));
  };

  const deleteStaff = async (staffId: string) => {
    const { error } = await supabase.from('profiles').delete().eq('id', staffId);
    if (error) {
      console.error('[deleteStaff] Error:', error);
      setError(`Failed to delete staff: ${error.message}`);
      return;
    }
    setStaff(prev => prev.filter(s => s.id !== staffId));
  };

  const deleteAnnouncement = async (announcementId: string) => {
    const { error } = await supabase.from('notifications').delete().eq('id', announcementId);
    if (error) {
      console.error('[deleteAnnouncement] Error:', error);
      setError(`Failed to delete announcement: ${error.message}`);
      return;
    }
    setAnnouncements(prev => prev.filter(a => a.id !== announcementId));
  };

  const updateInstitution = async (updates: Partial<Institution>) => {
    if (!institutionId) return;
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.campus !== undefined) dbUpdates.campus = updates.campus;
    if (updates.city !== undefined) dbUpdates.city = updates.city;
    if (updates.state !== undefined) dbUpdates.state = updates.state;
    if (updates.country !== undefined) dbUpdates.country = updates.country;
    if (updates.contactPerson !== undefined) dbUpdates.contact_person = updates.contactPerson;
    const { error } = await supabase.from('institutions').update(dbUpdates).eq('id', institutionId);
    if (error) {
      console.error('[updateInstitution] Error:', error);
      setError(`Failed to update institution: ${error.message}`);
      return;
    }
    setInstitution(prev => prev ? { ...prev, ...updates } : prev);
  };

  const addAnnouncement = async (ann: Announcement) => {
    const notifPayload = {
      institution_id: institutionId,
      type: ann.isImportant ? 'emergency' : 'announcement',
      title: ann.title || '',
      message: ann.content || '',
      read: false,
      is_read: false,
      data: {
        category: ann.category,
        targetAudience: ann.targetAudience,
        isImportant: ann.isImportant,
        author: ann.author,
        date: ann.date,
      },
    };
    const { data, error } = await supabase.from('notifications').insert(notifPayload).select().single();
    if (error) {
      console.error('[addAnnouncement] Error:', error);
      return;
    }
    if (data) {
      const returned: Announcement = {
        id: data.id,
        title: data.title || ann.title || '',
        category: ann.category,
        content: data.message || ann.content || '',
        author: ann.author || '',
        date: ann.date || new Date().toISOString().split('T')[0],
        targetAudience: ann.targetAudience || 'All Campus',
        isImportant: ann.isImportant || false,
      };
      setAnnouncements(prev => [returned, ...prev]);
    }
  };

  return {
    institution,
    students, vendors, counters, orders, menuItems, menuCategories, campusBlocks, staff, announcements, auditLogs, profiles,
    loading: loading || ordersLoading,
    error: error || ordersError,
    ordersRealtimeStatus,
    refresh: fetchAll,
    updateStudentStatus, approveVendor, rejectVendor, suspendVendor,
    addCounter, updateCounter, deleteCounter, archiveCounter, restoreCounter, updateCounterStatus, toggleCounterAvailability,
    updateOrderStatus, fetchOrderDetails, updatingOrderId,
    addMenuItem, updateMenuItem, deleteMenuItem, toggleMenuAvailability,
    addMenuCategory, updateMenuCategory, deleteMenuCategory,
    toggleStaffPermission, deleteStudent, addStaff, updateStaff, deleteStaff, deleteAnnouncement, deleteVendor, updateInstitution,
    addAnnouncement, uploadImage,
  };
}
