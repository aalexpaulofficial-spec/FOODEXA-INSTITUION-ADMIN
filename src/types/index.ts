export type Role = 'institution_admin' | 'kitchen_manager' | 'super_admin' | 'canteen_vendor';

export type PortalMode = 'institution' | 'super_admin';
export type PortalRole = 'campus_admin' | 'super_admin' | 'kitchen_manager' | 'canteen_vendor';

export interface Student {
  id: string;
  name: string;
  studentId: string;
  email: string;
  department: string;
  semester: number;
  campusBlock: string;
  status: 'active' | 'suspended' | 'graduated';
  avatar: string;
  walletBalance: number;
  totalOrders: number;
  favoriteMeal: string;
  qrCode: string;
  lxInteractionsCount: number;
  dietaryPreference: string[];
  userRole?: string;
}

export interface Vendor {
  id: string;
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  campusBlock: string;
  outletType: string;
  seatingCapacity: number;
  openingHours: string;
  status: 'approved' | 'pending' | 'suspended';
  rating: number;
  monthlyRevenue: number;
  ordersCount: number;
  appliedDate: string;
  documentsSubmitted: boolean;
}

export type MenuStatus = 'draft' | 'published' | 'scheduled' | 'hidden' | 'out_of_stock' | 'archived';
export type DietaryType = 'Veg' | 'Non-Veg' | 'Vegan' | 'Jain';

export interface MenuAnalytics {
  views: number;
  orders: number;
  revenue: number;
  conversionRate: number;
  averageRating: number;
  trendingScore: number;
}

export interface MenuItem {
  id: string;
  institution_id?: string;
  canteen_id?: string;
  category_id?: string;
  categoryName?: string;
  vendorId: string;
  vendorName: string;
  name: string;
  category: string;
  price: number;
  discountPrice?: number;
  regular_price?: number;
  discount_price?: number;
  prepTimeMinutes?: number;
  preparation_time?: number;
  servingSize?: string;
  serving_size?: string;
  calories: number;
  proteinGrams: number;
  carbsGrams?: number;
  fatGrams?: number;
  fiberGrams?: number;
  sugarGrams?: number;
  isVegetarian: boolean;
  food_type?: string;
  dietaryType?: DietaryType;
  isAvailable: boolean;
  availability?: boolean;
  stockCount: number;
  quantityAvailable?: number;
  imageUrl: string;
  image_url?: string;
  description: string;
  ingredients?: string[];
  allergens: string[];
  aiPopularityScore: number;
  availableTime?: string;
  counterNumber?: string;
  isTodaysSpecial?: boolean;
  availableToday?: boolean;
  status?: MenuStatus;
  tags?: string[];
  cuisineType?: string;
  analytics?: MenuAnalytics;
  orderPriorityIndex?: number;
  createdAt?: string;
  created_at?: string;
}

export interface MenuCategory {
  id: string;
  institution_id: string;
  canteen_id: string;
  name: string;
  description: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export type OrderStatus = 'pending' | 'accepted' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export type KitchenStatus = 'Pending' | 'Accepted' | 'Preparing' | 'Ready' | 'Completed' | 'Cancelled';
export type CounterStatus = 'Pending' | 'Accepted' | 'Preparing' | 'Ready' | 'Picked Up' | 'Completed' | 'Cancelled' | 'Invoice Ready' | 'Order Collected';
export type OrderStatusText = 'Incoming' | 'Order Confirmed' | 'Preparing' | 'Ready at Counter' | 'Order Collected' | 'Invoice Ready';

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id?: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  special_instructions?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Notification {
  id: string;
  institution_id?: string;
  user_id?: string;
  order_id?: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  is_read?: boolean;
  data?: Record<string, unknown>;
  created_at: string;
}

export interface Counter {
  id: string;
  institution_id?: string;
  code: string;
  name: string;
  campusBlock: string;
  categories: string[];
  operatingHours: string;
  isAvailable: boolean;
  assignedStaff: string[];
  queueLength: number;
  avgWaitTimeMins: number;
  activeMenuCount: number;
  status?: string;
  created_at?: string;
}

export interface Order {
  id: string;
  institutionId?: string;
  orderNumber: string;
  studentId: string;
  studentName: string;
  studentDepartment: string;
  vendorId: string;
  vendorName: string;
  pickupCounter: string;
  pickupNumber: string;
  estimatedWaitMins: number;
  items: {
    menuItemId: string;
    name: string;
    quantity: number;
    price: number;
  }[];
  totalAmount: number;
  status: OrderStatus;
  orderStatus?: string;
  kitchenStatus?: 'Pending' | 'Accepted' | 'Preparing' | 'Ready' | 'Completed' | 'Cancelled' | string;
  counterStatus?: string;
  orderTime: string;
  created_at?: string;
  createdAt?: string;
  acceptedAt?: string;
  preparingAt?: string;
  readyAt?: string;
  completedAt?: string;
  cancelledAt?: string;
   pickupTimeEstimated: string;
   estimatedReadyTime?: string;
   pickupCode: string;
   tokenNumber?: string;
   orderItems?: OrderItem[];
   qrCodeData?: string;
   institutionName?: string;
   canteenName?: string;
   studentAvatar?: string;
   paymentMethod: 'Razorpay UPI' | 'Razorpay Card' | 'Student Wallet' | 'UPI' | 'Card' | 'Meal Voucher';
   paymentStatus: 'paid' | 'pending' | 'cancelled' | 'refunded';
   notes?: string;
   isPriority?: boolean;
   userRole?: string;
   userEmail?: string;
   userPhone?: string;
   updatedAt?: string;
  }

 export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: 'Institution Admin' | 'Kitchen Manager' | 'Campus Supervisor' | 'Support Staff';
  department: string;
  assignedCampusBlock: string;
  status: 'active' | 'inactive';
  lastActive: string;
  permissions: {
    menuEdit: boolean;
    orderManage: boolean;
    vendorApprove: boolean;
    analyticsView: boolean;
    staffManage: boolean;
  };
}

export interface CampusBlock {
  id: string;
  name: string;
  code: string;
  departmentsCount: number;
  totalStudents: number;
  canteensCount: number;
  operatingHours: string;
  foodCourts: {
    name: string;
    counters: number;
    capacity: number;
  }[];
}

export interface Announcement {
  id: string;
  title: string;
  category: 'General' | 'Emergency Alert' | 'Maintenance' | 'Offers & Events';
  content: string;
  author: string;
  date: string;
  targetAudience: 'All Campus' | 'Hostel Block' | 'Engineering Dept' | 'Vendors Only';
  isImportant: boolean;
}

export interface LXQuestion {
  id: string;
  question: string;
  category: string;
  frequency: number;
  suggestedAnswer: string;
  isApprovedFaq: boolean;
}

export interface Institution {
  id: string;
  name: string;
  institution_code: string;
  studentsCount: number;
  vendorsCount: number;
  dailyOrdersCount: number;
  monthlyRevenue: number;
  status: 'active' | 'pending_approval' | 'suspended' | 'disabled';
  contactPerson: string;
  email: string;
  phone: string;
  joinedDate: string;
  plan: 'Basic' | 'Pro' | 'Enterprise';
  logoUrl?: string;
  lastActivity?: string;
  renewalDate?: string;
  type?: string;
  campus?: string;
  city?: string;
  state?: string;
  country?: string;
  institutionEmail?: string;
  role?: string;
  institutionWebsite?: string;
  studentPopulation?: number;
  foodCourts?: number;
  vendors?: number;
  message?: string;
  generatedEmail?: string;
  generatedPassword?: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  ipAddress: string;
  module: string;
  status: 'success' | 'warning' | 'error';
}
