import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
  Institution, Student, Vendor, Order, MenuItem, KitchenQueueItem,
  CampusBlock, StaffMember, Announcement, AuditLog, Counter, MenuCategory, OrderStatus,
} from '../types';

interface InstitutionData {
  institution: Institution | null;
  students: Student[];
  vendors: Vendor[];
  counters: Counter[];
  orders: Order[];
  menuItems: MenuItem[];
  menuCategories: MenuCategory[];
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
  updateKitchenStatus: (itemId: string, status: OrderStatus) => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
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
    code: db.code || db.name || '',
    name: db.name || '',
    campusBlock: db.campus_block || db.campusBlock || '',
    categories: Array.isArray(db.categories) ? db.categories : (typeof db.categories === 'string' ? (() => { try { return JSON.parse(db.categories); } catch { return []; } })() : []),
    operatingHours: db.operating_hours || db.operatingHours || '',
    isAvailable: db.is_available ?? db.isAvailable ?? true,
    assignedStaff: Array.isArray(db.assigned_staff) ? db.assigned_staff : (typeof db.assigned_staff === 'string' ? db.assigned_staff.split(',').map((s: string) => s.trim()) : []),
    queueLength: db.queue_length || db.queueLength || 0,
    avgWaitTimeMins: db.avg_wait_time_mins || db.avgWaitTimeMins || 0,
    activeMenuCount: db.active_menu_count || db.activeMenuCount || 0,
    status: db.status || 'active',
    created_at: db.created_at,
  };
}

function mapCounterToDb(counter: Counter, institutionId: string | null): any {
  return {
    institution_id: institutionId,
    code: counter.code,
    name: counter.name,
    campus_block: counter.campusBlock,
    categories: counter.categories,
    operating_hours: counter.operatingHours,
    is_available: counter.isAvailable,
    assigned_staff: counter.assignedStaff,
    status: counter.status || 'active',
  };
}

function mapDbMenuItemToMenuItem(db: any): MenuItem {
  return {
    id: db.id,
    institution_id: db.institution_id,
    canteen_id: db.canteen_id,
    category_id: db.category_id,
    vendorId: db.vendor_id || db.canteen_id || db.vendorId || '',
    vendorName: db.vendor_name || db.vendorName || '',
    name: db.name || '',
    category: db.category || '',
    price: parseFloat(db.regular_price ?? db.price ?? 0),
    discountPrice: db.discount_price ? parseFloat(db.discount_price) : (db.discountPrice || undefined),
    prepTimeMinutes: db.preparation_time || db.prepTimeMinutes || 0,
    servingSize: db.serving_size || db.servingSize || '',
    calories: db.calories || 0,
    proteinGrams: db.protein_grams || db.proteinGrams || 0,
    carbsGrams: db.carbs_grams || db.carbsGrams,
    fatGrams: db.fat_grams || db.fatGrams,
    fiberGrams: db.fiber_grams || db.fiberGrams,
    sugarGrams: db.sugar_grams || db.sugarGrams,
    isVegetarian: db.is_vegetarian ?? db.isVegetarian ?? (db.food_type === 'Veg'),
    food_type: db.food_type,
    dietaryType: db.dietary_type || db.dietaryType || (db.food_type as any) || '',
    isAvailable: db.availability ?? db.is_available ?? db.isAvailable ?? true,
    stockCount: db.stock_count || db.stockCount || 50,
    quantityAvailable: db.quantity_available || db.quantityAvailable,
    imageUrl: db.image_url || db.imageUrl || '',
    description: db.description || '',
    ingredients: Array.isArray(db.ingredients) ? db.ingredients : (typeof db.ingredients === 'string' ? (() => { try { return JSON.parse(db.ingredients); } catch { return db.ingredients.split(',').map((s: string) => s.trim()); } })() : []),
    allergens: Array.isArray(db.allergens) ? db.allergens : [],
    aiPopularityScore: db.ai_popularity_score || db.aiPopularityScore || 75,
    availableTime: db.available_time || db.availableTime,
    counterNumber: db.counter_number || db.counterNumber,
    isTodaysSpecial: db.is_todays_special ?? db.isTodaysSpecial ?? false,
    availableToday: db.available_today ?? db.availableToday ?? true,
    status: db.status || 'published',
    tags: Array.isArray(db.tags) ? db.tags : [],
    cuisineType: db.cuisine_type || db.cuisineType,
    analytics: db.analytics || { views: 0, orders: 0, revenue: 0, conversionRate: 0, averageRating: 0, trendingScore: 0 },
    createdAt: db.created_at || db.createdAt,
    created_at: db.created_at,
  };
}

function mapMenuItemToDb(item: MenuItem, institutionId: string | null): any {
  return {
    institution_id: institutionId,
    canteen_id: item.canteen_id || item.vendorId || null,
    category_id: item.category_id || null,
    vendor_id: item.canteen_id || item.vendorId || null,
    vendor_name: item.vendorName || '',
    name: item.name,
    category: item.category,
    regular_price: item.price,
    discount_price: item.discountPrice || null,
    preparation_time: item.prepTimeMinutes || 10,
    serving_size: item.servingSize || '1 Serving',
    calories: item.calories || 0,
    protein_grams: item.proteinGrams || 0,
    carbs_grams: item.carbsGrams || 0,
    fat_grams: item.fatGrams || 0,
    fiber_grams: item.fiberGrams || 0,
    sugar_grams: item.sugarGrams || 0,
    is_vegetarian: item.isVegetarian,
    food_type: item.food_type || item.dietaryType || 'Veg',
    dietary_type: item.dietaryType || 'Veg',
    availability: item.isAvailable,
    image_url: item.imageUrl,
    description: item.description,
    ingredients: item.ingredients || [],
    allergens: item.allergens || [],
    ai_popularity_score: item.aiPopularityScore || 75,
    available_time: item.availableTime || '',
    counter_number: item.counterNumber || '',
    is_todays_special: item.isTodaysSpecial || false,
    available_today: item.availableToday !== false,
    status: item.status || 'published',
    tags: item.tags || [],
    cuisine_type: item.cuisineType || '',
  };
}

export function useInstitutionData(institutionId: string | null): InstitutionData {
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [counters, setCounters] = useState<Counter[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const [kitchenQueue, setKitchenQueue] = useState<KitchenQueueItem[]>([]);
  const [campusBlocks, setCampusBlocks] = useState<CampusBlock[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [profiles, setProfiles] = useState<{ user_id: string; role: string; full_name?: string; email?: string; phone?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isInitialMount = useRef(true);

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
          itemsSummary: o.items ? (Array.isArray(o.items) ? o.items.map((i: any) => `${i.quantity || 0}x ${i.name || ''}`).join(', ') : '') : '',
          status: o.status,
          prepTimeMinutes: o.estimated_wait_mins || o.estimatedWaitMins || 0,
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
    if (isInitialMount.current) {
      setLoading(true);
    }
    setError(null);

    try {
      const [
        { data: instData, error: instErr },
        { data: studentsData },
        { data: canteensData, error: canteensErr },
        { data: ordersData },
        { data: menuItemsData },
        { data: menuCatsData },
        { data: staffData },
        { data: notificationsData },
        { data: auditLogsData },
        { data: profilesData },
      ] = await Promise.all([
        supabase.from('institutions').select('*').eq('id', institutionId).single(),
        supabase.from('profiles').select('*').eq('institution_id', institutionId).eq('role', 'student'),
        supabase.from('canteens').select('*').eq('institution_id', institutionId),
        supabase.from('orders').select('*').eq('institution_id', institutionId),
        supabase.from('menu_items').select('*').eq('institution_id', institutionId),
        supabase.from('menu_categories').select('*').eq('institution_id', institutionId),
        supabase.from('profiles').select('*').eq('institution_id', institutionId).neq('role', 'student').neq('role', 'super_admin'),
        supabase.from('notifications').select('*').eq('institution_id', institutionId),
        supabase.from('audit_logs').select('*').eq('institution_id', institutionId),
        supabase.from('profiles').select('*'),
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
        setVendors((canteensData as any[]).filter((c: any) => c.status === 'approved' || c.status === 'pending' || c.status === 'suspended') as Vendor[]);
        setCounters((canteensData as any[]).map(mapDbCounterToCounter));
      }
      if (profilesData) setProfiles(profilesData as any);
      if (ordersData) {
        const enriched = enrichOrdersWithProfile(ordersData as any[], (profilesData as any[]) || []);
        setOrders(enriched);
        setKitchenQueue(enrichKitchenQueueWithProfile(ordersData as any[], (profilesData as any[]) || []));
      }
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
      if (staffData) setStaff(staffData as StaffMember[]);
      if (notificationsData) setAnnouncements(notificationsData as Announcement[]);
      if (auditLogsData) setAuditLogs(auditLogsData as AuditLog[]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error('[useInstitutionData] fetchAll error:', err);
      setError(msg);
    } finally {
      if (isInitialMount.current) {
        isInitialMount.current = false;
      }
      setLoading(false);
    }
  }, [institutionId, enrichOrdersWithProfile, enrichKitchenQueueWithProfile]);

  const uploadImage = async (file: File, path: string): Promise<string | null> => {
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const filePath = `${path}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { data, error } = await supabase.storage.from('food-images').upload(filePath, file, { upsert: true });
      if (error) {
        console.error('[Upload] Storage error:', error);
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
    const { error } = await supabase.from('profiles').update({ status }).eq('id', studentId);
    if (error) console.error('[updateStudentStatus] Error:', error);
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
    if (updates.code !== undefined) dbUpdates.code = updates.code;
    if (updates.campusBlock !== undefined) dbUpdates.campus_block = updates.campusBlock;
    if (updates.categories !== undefined) dbUpdates.categories = updates.categories;
    if (updates.operatingHours !== undefined) dbUpdates.operating_hours = updates.operatingHours;
    if (updates.isAvailable !== undefined) dbUpdates.is_available = updates.isAvailable;
    if (updates.assignedStaff !== undefined) dbUpdates.assigned_staff = updates.assignedStaff;

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
    const { error } = await supabase.from('canteens').update({ status: 'archived', is_available: false }).eq('id', counterId);
    if (error) {
      console.error('[archiveCounter] Error:', error);
      setError(`Failed to archive counter: ${error.message}`);
      return;
    }
    setCounters(prev => prev.map(c => c.id === counterId ? { ...c, status: 'archived', isAvailable: false } : c));
  };

  const restoreCounter = async (counterId: string) => {
    const { error } = await supabase.from('canteens').update({ status: 'active', is_available: true }).eq('id', counterId);
    if (error) {
      console.error('[restoreCounter] Error:', error);
      setError(`Failed to restore counter: ${error.message}`);
      return;
    }
    setCounters(prev => prev.map(c => c.id === counterId ? { ...c, status: 'active', isAvailable: true } : c));
  };

  const updateCounterStatus = async (counterId: string, status: string) => {
    const dbUpdates: any = { status };
    if (status === 'active') dbUpdates.is_available = true;
    else if (status === 'inactive' || status === 'archived') dbUpdates.is_available = false;
    const { error } = await supabase.from('canteens').update(dbUpdates).eq('id', counterId);
    if (error) {
      console.error('[updateCounterStatus] Error:', error);
      setError(`Failed to update counter status: ${error.message}`);
      return;
    }
    setCounters(prev => prev.map(c => c.id === counterId ? { ...c, status, isAvailable: dbUpdates.is_available } : c));
  };

  const toggleCounterAvailability = async (counterId: string) => {
    const c = counters.find(c => c.id === counterId);
    if (!c) return;
    const newAvailable = !c.isAvailable;
    const { error } = await supabase.from('canteens').update({ is_available: newAvailable }).eq('id', counterId);
    if (error) {
      console.error('[toggleCounterAvailability] Error:', error);
      setError(`Failed to toggle counter: ${error.message}`);
      return;
    }
    setCounters(prev => prev.map(c => c.id === counterId ? { ...c, isAvailable: newAvailable } : c));
  };

  const updateKitchenStatus = async (itemId: string, status: OrderStatus) => {
    const kqItem = kitchenQueue.find(item => item.id === itemId || item.orderId === itemId);
    const realOrderId = kqItem?.orderId || itemId;
    const { error } = await supabase.from('orders').update({ status }).eq('id', realOrderId);
    if (error) console.error('[updateKitchenStatus] Error:', error);
    setKitchenQueue(prev => prev.map(item => (item.id === itemId || item.orderId === itemId) ? { ...item, status } : item));
    setOrders(prev => prev.map(o => o.id === realOrderId ? { ...o, status } : o));
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
    if (error) console.error('[updateOrderStatus] Error:', error);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  };

  const addMenuItem = async (item: MenuItem): Promise<string | null> => {
    const dbPayload = mapMenuItemToDb(item, institutionId);
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
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.price !== undefined) dbUpdates.regular_price = updates.price;
    if (updates.discountPrice !== undefined) dbUpdates.discount_price = updates.discountPrice;
    if (updates.prepTimeMinutes !== undefined) dbUpdates.preparation_time = updates.prepTimeMinutes;
    if (updates.servingSize !== undefined) dbUpdates.serving_size = updates.servingSize;
    if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;
    if (updates.isAvailable !== undefined) dbUpdates.availability = updates.isAvailable;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.dietaryType !== undefined) dbUpdates.dietary_type = updates.dietaryType;
    if (updates.food_type !== undefined) dbUpdates.food_type = updates.food_type;
    if (updates.isVegetarian !== undefined) dbUpdates.is_vegetarian = updates.isVegetarian;
    if (updates.canteen_id !== undefined) dbUpdates.canteen_id = updates.canteen_id;
    if (updates.category_id !== undefined) dbUpdates.category_id = updates.category_id;
    if (updates.calories !== undefined) dbUpdates.calories = updates.calories;
    if (updates.proteinGrams !== undefined) dbUpdates.protein_grams = updates.proteinGrams;
    if (updates.isTodaysSpecial !== undefined) dbUpdates.is_todays_special = updates.isTodaysSpecial;
    if (updates.tags !== undefined) dbUpdates.tags = updates.tags;

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
    const { error } = await supabase.from('menu_items').update({ availability: newAvail }).eq('id', itemId);
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
      sort_order: cat.sort_order || 0,
      is_active: cat.is_active !== false,
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
    const { error } = await supabase.from('menu_categories').update(updates).eq('id', catId);
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
    const { error } = await supabase.from('profiles').update({ permissions: newPerms }).eq('id', staffId);
    if (error) console.error('[toggleStaffPermission] Error:', error);
    setStaff(prev => prev.map(s => s.id === staffId ? { ...s, permissions: newPerms } : s));
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
      status: staffData.status || 'active',
    }).select().single();
    if (error) {
      console.error('[addStaff] Error:', error);
      setError(`Failed to add staff: ${error.message}`);
      return null;
    }
    if (data) {
      const newStaff: StaffMember = {
        id: data.id,
        name: data.full_name || data.email || '',
        email: data.email || '',
        role: 'Kitchen Manager',
        department: '',
        assignedCampusBlock: '',
        status: data.status || 'active',
        lastActive: '',
        permissions: { menuEdit: false, orderManage: false, vendorApprove: false, analyticsView: false, staffManage: false },
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
    const { error } = await supabase.from('profiles').update(dbUpdates).eq('id', staffId);
    if (error) {
      console.error('[updateStaff] Error:', error);
      setError(`Failed to update staff: ${error.message}`);
      return;
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
    const { data, error } = await supabase.from('notifications').insert({ ...ann, institution_id: institutionId }).select().single();
    if (error) console.error('[addAnnouncement] Error:', error);
    if (data) setAnnouncements(prev => [data as Announcement, ...prev]);
  };

  return {
    institution,
    students, vendors, counters, orders, menuItems, menuCategories, kitchenQueue, campusBlocks, staff, announcements, auditLogs, profiles,
    loading, error,
    refresh: fetchAll,
    updateStudentStatus, approveVendor, rejectVendor, suspendVendor,
    addCounter, updateCounter, deleteCounter, archiveCounter, restoreCounter, updateCounterStatus, toggleCounterAvailability,
    updateKitchenStatus, updateOrderStatus,
    addMenuItem, updateMenuItem, deleteMenuItem, toggleMenuAvailability,
    addMenuCategory, updateMenuCategory, deleteMenuCategory,
    toggleStaffPermission, deleteStudent, addStaff, updateStaff, deleteStaff, deleteAnnouncement, deleteVendor, updateInstitution,
    addAnnouncement, uploadImage,
  };
}
