import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Order, OrderStatus, OrderItem, Notification } from '../types';
import {
  buildStatusUpdate,
  getNotificationForStatus,
  isWithinCancelWindow,
  normalizeOrderStatus,
  normalizeKitchenStatus,
  normalizeOrderItems,
  CANCEL_BLOCK_MESSAGE,
} from '../lib/orderUtils';

const DATA_FETCH_TIMEOUT_MS = 15000;

function withTimeout<T>(promise: PromiseLike<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

function mapDbOrderToOrder(db: any): Order {
  const orderTime = db.order_time || db.orderTime || db.created_at || '';
  const pickupTime = db.pickup_time_estimated || db.pickupTimeEstimated || db.pickup_time || '';
  return {
    ...db,
    id: db.id,
    institutionId: db.institution_id || db.institutionId,
    orderNumber: db.order_number || db.orderNumber || db.order_no || '',
    studentId: db.student_id || db.studentId || db.user_id || '',
    studentName: db.student_name || db.studentName || db.customer_name || '',
    studentDepartment: db.student_department || db.studentDepartment || db.department || '',
    vendorId: db.vendor_id || db.vendorId || db.canteen_id || '',
    vendorName: db.vendor_name || db.vendorName || db.canteen_name || '',
    canteenName: db.canteen_name || db.vendorName || db.vendor_name || '',
    institutionName: db.institution_name || db.institutionName || '',
    pickupCounter: db.pickup_counter || db.pickupCounter || db.counter_number || '',
    pickupNumber: db.pickup_number || db.pickupNumber || db.token_number || db.tokenNumber || '',
    tokenNumber: db.token_number || db.tokenNumber || db.pickup_number || db.pickupNumber || '',
    estimatedWaitMins: Number(db.estimated_wait_mins || db.estimatedWaitMins || 0),
    estimatedReadyTime: db.estimated_ready_time || db.estimatedReadyTime || db.pickup_time_estimated || '',
    items: normalizeOrderItems(db.items || db.order_items),
    orderItems: Array.isArray(db.order_items) ? db.order_items.map((oi: any) => ({
      id: oi.id,
      order_id: oi.order_id,
      menu_item_id: oi.menu_item_id,
      item_name: oi.item_name || oi.name,
      quantity: Number(oi.quantity || 0),
      unit_price: Number(oi.unit_price || 0),
      total_price: Number(oi.total_price || 0),
      special_instructions: oi.special_instructions,
      created_at: oi.created_at,
      updated_at: oi.updated_at,
    })) as OrderItem[] : [],
    totalAmount: Number(db.total_amount || db.totalAmount || db.amount || 0),
    status: normalizeOrderStatus(db.status),
    orderStatus: db.order_status || db.orderStatus || '',
    kitchenStatus: normalizeKitchenStatus(db.kitchen_status || db.kitchenStatus),
    counterStatus: db.counter_status || db.counterStatus || '',
    orderTime,
    created_at: db.created_at || db.createdAt,
    createdAt: db.created_at || db.createdAt,
    updatedAt: db.updated_at || db.updatedAt,
    acceptedAt: db.accepted_at || db.acceptedAt || '',
    preparingAt: db.preparing_at || db.preparingAt || '',
    readyAt: db.ready_at || db.readyAt || '',
    completedAt: db.completed_at || db.completedAt || '',
    cancelledAt: db.cancelled_at || db.cancelledAt || '',
    pickupTimeEstimated: pickupTime,
    pickupCode: db.pickup_code || db.pickupCode || '',
    qrCodeData: db.qr_code_data || db.qrCodeData || db.pickup_code || db.pickupCode || '',
    studentAvatar: db.student_avatar || '',
    paymentMethod: db.payment_method || db.paymentMethod || 'UPI',
    paymentStatus: db.payment_status || db.paymentStatus || 'pending',
    notes: db.notes || '',
    isPriority: db.is_priority || db.isPriority || false,
    userRole: db.user_role || db.userRole || '',
    userEmail: db.user_email || db.userEmail || '',
    userPhone: db.user_phone || db.userPhone || '',
  } as Order;
}
export type ProfileTuple = {
  user_id: string;
  id?: string;
  role: string;
  full_name?: string;
  email?: string;
  phone?: string;
};

export interface UseOrderRealtimeReturn {
  orders: Order[];
  loading: boolean;
  error: string | null;
  realtimeStatus: string;
  isRealtime: boolean;
  fetchOrders: () => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<boolean>;
  cancelOrder: (orderId: string) => Promise<boolean>;
  fetchOrderDetails: (orderId: string) => Promise<Order | null>;
  refresh: () => void;
}

export function useOrderRealtime(
  institutionId: string | null,
  profiles: ProfileTuple[]
): UseOrderRealtimeReturn {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<string>('');
  const [isRealtime, setIsRealtime] = useState(false);
  const profilesRef = useRef(profiles);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    profilesRef.current = profiles;
  }, [profiles]);

  const enrichOrdersWithProfile = useCallback(
    (rawOrders: any[]): Order[] => {
      const profileMap = new Map<string, ProfileTuple>(
        (profilesRef.current || []).map(
          (p) => [p.user_id || p.id || '', p] as [string, ProfileTuple]
        )
      );
      return rawOrders.map((o) => {
        const mappedOrder = mapDbOrderToOrder(o);
        const studentId = mappedOrder.studentId;
        const profile = studentId ? profileMap.get(studentId) : undefined;
        return {
          ...mappedOrder,
          studentName: profile?.full_name || mappedOrder.studentName,
          userRole: profile?.role || o.user_role || o.userRole || '',
          userEmail: profile?.email || o.user_email || o.userEmail || '',
          userPhone: profile?.phone || o.user_phone || o.userPhone || '',
          studentAvatar: profile?.full_name ? undefined : mappedOrder.studentAvatar,
        } as Order;
      });
    },
    []
  );

  const handleOrderRealtime = useCallback(
    (payload: any) => {
      const eventType = payload?.eventType;
      const record = payload?.new || payload?.old;
      if (!record || !record.id) return;

      if (eventType === 'DELETE') {
        setOrders((prev) => prev.filter((o) => o.id !== record.id));
        return;
      }

      const enriched = enrichOrdersWithProfile([record])[0];
      if (!enriched) return;

      setOrders((prev) => {
        const exists = prev.some((o) => o.id === record.id);
        if (!exists) return [enriched, ...prev];
        return prev.map((o) => (o.id === record.id ? enriched : o));
      });
    },
    [enrichOrdersWithProfile]
  );

  const fetchOrders = useCallback(async () => {
    if (!institutionId) {
      setOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await withTimeout(
        supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('institution_id', institutionId)
          .order('created_at', { ascending: false }),
        DATA_FETCH_TIMEOUT_MS,
        'Orders fetch'
      );

      if (error) {
        console.error('[useOrderRealtime] Supabase error:', error);
        setError(`Failed to load orders: ${error.message}`);
        setOrders([]);
      } else {
        const enriched = enrichOrdersWithProfile((data as any[]) || []);
        setOrders(enriched);
        setError(null);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error fetching orders';
      console.error('[useOrderRealtime] fetchOrders error:', err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [institutionId, enrichOrdersWithProfile]);

  useEffect(() => {
    if (!institutionId) {
      setOrders([]);
      setLoading(false);
      return;
    }

    fetchOrders();

    const channel = supabase
      .channel(`orders_realtime_${institutionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `institution_id=eq.${institutionId}`,
        },
        (payload) => {
          handleOrderRealtime(payload);
        }
      )
      .subscribe((status) => {
        setRealtimeStatus(status);
        setIsRealtime(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [institutionId, fetchOrders, handleOrderRealtime]);

  const insertStatusNotification = useCallback(
    async (order: Order, status: OrderStatus) => {
      const notification = getNotificationForStatus(status, order);
      if (!notification) return;

      try {
        const studentId = order.studentId;
        if (!studentId) {
          console.warn('[useOrderRealtime] No student_id on order, skipping notification');
          return;
        }

        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(studentId)) {
          console.warn('[useOrderRealtime] Invalid student_id UUID:', studentId);
          return;
        }

        const notifPayload: Partial<Notification> = {
          institution_id: order.institutionId || institutionId,
          user_id: studentId,
          order_id: order.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          read: false,
        };

        const { error } = await supabase
          .from('notifications')
          .insert(notifPayload)
          .select()
          .single();

        if (error) {
          console.error('[useOrderRealtime] Failed to insert notification:', error);
        }
      } catch (err) {
        console.error('[useOrderRealtime] Notification insertion failed:', err);
      }
    },
    [institutionId]
  );

  const updateOrderStatus = useCallback(
    async (orderId: string, status: OrderStatus): Promise<boolean> => {
      const order = orders.find((o) => o.id === orderId);

      if (!order) {
        setError('Order not found in current view.');
        return false;
      }

      if (status === 'cancelled' && !isWithinCancelWindow(order)) {
        setError(CANCEL_BLOCK_MESSAGE);
        return false;
      }

      const updates = buildStatusUpdate(status);

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                ...updates,
                status: normalizeOrderStatus(updates.status),
                kitchenStatus: String(updates.kitchen_status || o.kitchenStatus || 'Pending'),
                counterStatus: String(updates.counter_status || o.counterStatus || ''),
                orderStatus: String(updates.order_status || o.orderStatus || ''),
                acceptedAt: updates.accepted_at ? String(updates.accepted_at) : o.acceptedAt,
                preparingAt: updates.preparing_at ? String(updates.preparing_at) : o.preparingAt,
                readyAt: updates.ready_at ? String(updates.ready_at) : o.readyAt,
                completedAt: updates.completed_at ? String(updates.completed_at) : o.completedAt,
                cancelledAt: updates.cancelled_at ? String(updates.cancelled_at) : o.cancelledAt,
                updatedAt: String(updates.updated_at || ''),
              }
            : o
        )
      );

      try {
        const { error: updateError } = await supabase
          .from('orders')
          .update(updates)
          .eq('id', orderId)
          .eq('institution_id', institutionId);

        if (updateError) {
          console.error('[useOrderRealtime] Supabase update error:', updateError);
          setError(`Failed to update order: ${updateError.message}`);
          await fetchOrders();
          return false;
        }

        await insertStatusNotification(
          { ...order, ...updates } as Order,
          status
        );

        setError(null);
        return true;
      } catch (err: unknown) {
        console.error('[useOrderRealtime] updateOrderStatus error:', err);
        setError(err instanceof Error ? err.message : 'Failed to update order status');
        await fetchOrders();
        return false;
      }
    },
    [orders, institutionId, insertStatusNotification, fetchOrders]
  );

  const cancelOrder = useCallback(
    async (orderId: string): Promise<boolean> => {
      const order = orders.find((o) => o.id === orderId);

      if (!order) {
        setError('Order not found.');
        return false;
      }

      if (!isWithinCancelWindow(order)) {
        setError(CANCEL_BLOCK_MESSAGE);
        return false;
      }

      return updateOrderStatus(orderId, 'cancelled');
    },
    [orders, updateOrderStatus]
  );

  const fetchOrderDetails = useCallback(
    async (orderId: string): Promise<Order | null> => {
      const fallback = orders.find((o) => o.id === orderId) || null;
      if (!institutionId) return fallback;

      try {
        const { data, error } = await withTimeout(
          supabase
            .from('orders')
            .select('*, order_items(*), profiles(*), institutions(*), canteens(*)')
            .eq('id', orderId)
            .eq('institution_id', institutionId)
            .single(),
          DATA_FETCH_TIMEOUT_MS,
          'Order details fetch'
        );

        if (error || !data) return fallback;

        const enriched = enrichOrdersWithProfile([data as any])[0] || fallback;
        const profile = Array.isArray((data as any).profiles)
          ? (data as any).profiles[0]
          : (data as any).profiles;
        const institution = Array.isArray((data as any).institutions)
          ? (data as any).institutions[0]
          : (data as any).institutions;
        const canteen = Array.isArray((data as any).canteens)
          ? (data as any).canteens[0]
          : (data as any).canteens;

        return {
          ...enriched,
          studentName: profile?.full_name || enriched.studentName,
          userEmail: profile?.email || enriched.userEmail,
          userPhone: profile?.phone || enriched.userPhone,
          canteenName: canteen?.name || enriched.canteenName || '',
          institutionName: institution?.name || enriched.institutionName || '',
        } as Order;
      } catch {
        return fallback;
      }
    },
    [orders, institutionId, enrichOrdersWithProfile]
  );

  const refresh = useCallback(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (profiles.length > 0 && orders.length > 0) {
      const reEnriched = enrichOrdersWithProfile(
        orders.map((o) => {
          const raw: any = {
            id: o.id,
            institution_id: o.institutionId,
            order_number: o.orderNumber,
            student_id: o.studentId,
            student_name: o.studentName,
            student_department: o.studentDepartment,
            vendor_id: o.vendorId,
            vendor_name: o.vendorName,
            canteen_name: o.canteenName,
            pickup_counter: o.pickupCounter,
            pickup_number: o.pickupNumber,
            token_number: o.tokenNumber,
            estimated_wait_mins: o.estimatedWaitMins,
            items: o.items,
            order_items: o.orderItems,
            total_amount: o.totalAmount,
            status: o.status,
            order_status: o.orderStatus,
            kitchen_status: o.kitchenStatus,
            counter_status: o.counterStatus,
            created_at: o.created_at,
            updated_at: o.updatedAt,
            accepted_at: o.acceptedAt,
            preparing_at: o.preparingAt,
            ready_at: o.readyAt,
            completed_at: o.completedAt,
            cancelled_at: o.cancelledAt,
            pickup_time_estimated: o.pickupTimeEstimated,
            pickup_code: o.pickupCode,
            qr_code_data: o.qrCodeData,
            payment_method: o.paymentMethod,
            payment_status: o.paymentStatus,
            notes: o.notes,
            is_priority: o.isPriority,
            user_role: o.userRole,
            user_email: o.userEmail,
            user_phone: o.userPhone,
          };
          return raw;
        })
      );
      setOrders(reEnriched);
    }
  }, [profiles, enrichOrdersWithProfile, orders]);

  return {
    orders,
    loading,
    error,
    realtimeStatus,
    isRealtime,
    fetchOrders,
    updateOrderStatus,
    cancelOrder,
    fetchOrderDetails,
    refresh,
  };
}
