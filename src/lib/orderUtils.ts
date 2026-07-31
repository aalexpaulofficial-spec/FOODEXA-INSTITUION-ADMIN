import { Order, OrderStatus, KitchenStatus, CounterStatus } from '../types';

export const ORDER_CANCEL_WINDOW_MS = 30 * 1000;
export const CANCEL_BLOCK_MESSAGE = 'Cannot cancel because kitchen processing has started.';

export function getOrderCreatedAt(order: Order): string {
  return order.created_at || order.createdAt || order.orderTime || '';
}

export function getOrderUpdatedAt(order: Order): string {
  return order.updatedAt || order.created_at || order.createdAt || order.orderTime || '';
}

export function isWithinCancelWindow(order: Order): boolean {
  const created = getOrderCreatedAt(order);
  if (!created) return false;
  const t = new Date(created).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t <= ORDER_CANCEL_WINDOW_MS;
}

export function getCancelRemainingMs(order: Order): number {
  const created = getOrderCreatedAt(order);
  if (!created) return 0;
  const t = new Date(created).getTime();
  if (Number.isNaN(t)) return 0;
  const remaining = ORDER_CANCEL_WINDOW_MS - (Date.now() - t);
  return Math.max(0, remaining);
}

export function getElapsedSeconds(order: Order, now: number = Date.now()): number {
  let started = order.preparingAt || order.acceptedAt;
  if (!started) started = getOrderCreatedAt(order);
  if (!started) return 0;
  const t = new Date(started).getTime();
  if (Number.isNaN(t)) return 0;
  return Math.max(0, Math.floor((now - t) / 1000));
}

export interface StatusTransition {
  status: OrderStatus;
  order_status: string;
  kitchen_status: KitchenStatus;
  counter_status: CounterStatus;
  accepted_at?: string;
  preparing_at?: string;
  ready_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  updated_at: string;
  notification: {
    type: string;
    title: string;
    message: string;
  };
}

export function buildStatusUpdate(status: OrderStatus): Record<string, unknown> {
  const now = new Date().toISOString();
  switch (status) {
    case 'accepted':
      return {
        status: 'accepted',
        order_status: 'Accepted',
        kitchen_status: 'Accepted',
        counter_status: 'Accepted',
        accepted_at: now,
        updated_at: now,
      };
    case 'preparing':
      return {
        status: 'preparing',
        order_status: 'Preparing',
        kitchen_status: 'Preparing',
        counter_status: 'Preparing',
        preparing_at: now,
        updated_at: now,
      };
    case 'ready':
      return {
        status: 'ready',
        order_status: 'Ready',
        kitchen_status: 'Ready',
        counter_status: 'Ready',
        ready_at: now,
        updated_at: now,
      };
    case 'completed':
      return {
        status: 'completed',
        order_status: 'Completed',
        kitchen_status: 'Completed',
        counter_status: 'Picked Up',
        completed_at: now,
        updated_at: now,
      };
    case 'cancelled':
      return {
        status: 'cancelled',
        order_status: 'Cancelled',
        kitchen_status: 'Cancelled',
        counter_status: 'Cancelled',
        cancelled_at: now,
        updated_at: now,
      };
    case 'pending':
    default:
      return {
        status: 'pending',
        order_status: 'Pending',
        kitchen_status: 'Pending',
        counter_status: 'Pending',
        updated_at: now,
      };
  }
}

export function nextStatus(current: OrderStatus): OrderStatus | null {
  switch (current) {
    case 'pending':     return 'accepted';
    case 'accepted':    return 'preparing';
    case 'preparing':   return 'ready';
    case 'ready':       return 'completed';
    case 'completed':   return null;
    case 'cancelled':   return null;
    default:            return null;
  }
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  if (from === to) return false;
  if (to === 'cancelled') return from === 'pending';
  if (to === 'completed') return from === 'ready';
  return nextStatus(from) === to;
}

export function getOrderStatusLabel(status: OrderStatus): string {
  switch (status) {
    case 'pending':    return 'Incoming Queue';
    case 'accepted':   return 'Order Confirmed';
    case 'preparing':  return 'Preparing';
    case 'ready':      return 'Ready at Counter';
    case 'completed':  return 'Order Collected';
    case 'cancelled':  return 'Cancelled';
    default:           return status;
  }
}

export function getKitchenStatusLabel(status: string): string {
  switch (status) {
    case 'Pending':    return 'Pending';
    case 'Accepted':   return 'Accepted';
    case 'Preparing':  return 'Preparing';
    case 'Ready':      return 'Ready';
    case 'Completed':  return 'Completed';
    case 'Cancelled':  return 'Cancelled';
    default:           return status || 'Pending';
  }
}

export function getCounterStatusLabel(status: string): string {
  switch (status) {
    case 'Pending':    return 'Pending';
    case 'Accepted':   return 'Order Confirmed';
    case 'Preparing':  return 'Preparing';
    case 'Ready':      return 'Ready at Counter';
    case 'Picked Up':  return 'Picked Up';
    case 'Completed':  return 'Order Collected';
    case 'Invoice Ready': return 'Invoice Ready';
    case 'Order Collected': return 'Order Collected';
    case 'Cancelled':  return 'Cancelled';
    default:           return status || 'Pending';
  }
}

export function getStatusColor(status: OrderStatus): string {
  switch (status) {
    case 'pending':    return 'amber';
    case 'accepted':   return 'indigo';
    case 'preparing':  return 'cyan';
    case 'ready':      return 'emerald';
    case 'completed':  return 'green';
    case 'cancelled':  return 'red';
    default:           return 'slate';
  }
}

export function getNotificationForStatus(status: OrderStatus, order: Order): { type: string; title: string; message: string } | null {
  const orderNum = order.orderNumber || order.id;
  const studentName = order.studentName || 'Student';
  switch (status) {
    case 'accepted':
      return {
        type: 'success',
        title: 'Order Accepted',
        message: `Your order #${orderNum} has been accepted by the kitchen.`,
      };
    case 'preparing':
      return {
        type: 'info',
        title: 'Preparing',
        message: `Your order #${orderNum} is now being prepared.`,
      };
    case 'ready':
      return {
        type: 'success',
        title: 'Ready for Pickup',
        message: `Your order #${orderNum} is ready at ${order.pickupCounter || 'the counter'}.`,
      };
    case 'completed':
      return {
        type: 'success',
        title: 'Order Collected',
        message: `Your order #${orderNum} has been collected. Thank you!`,
      };
    case 'cancelled':
      return {
        type: 'warning',
        title: 'Order Cancelled',
        message: `Your order #${orderNum} has been cancelled.`,
      };
    default:
      return null;
  }
}

export function getStudentViewStatus(status: OrderStatus): string {
  switch (status) {
    case 'pending':    return 'Incoming';
    case 'accepted':   return 'Order Confirmed';
    case 'preparing':  return 'Preparing';
    case 'ready':      return 'Ready at Counter';
    case 'completed':  return 'Order Collected';
    case 'cancelled':  return 'Cancelled';
    default:           return status;
  }
}

export function normalizeOrderStatus(value: unknown): OrderStatus {
  const status = String(value || '').toLowerCase();
  if (['pending', 'accepted', 'preparing', 'ready', 'completed', 'cancelled'].includes(status)) {
    return status as OrderStatus;
  }
  return 'pending';
}

export function normalizeKitchenStatus(value: unknown): string {
  const status = String(value || '').toLowerCase();
  if (status === 'accepted') return 'Accepted';
  if (status === 'preparing') return 'Preparing';
  if (status === 'ready') return 'Ready';
  if (status === 'completed') return 'Completed';
  if (status === 'cancelled') return 'Cancelled';
  return 'Pending';
}

export function normalizeOrderItems(items: unknown): Order['items'] {
  if (!Array.isArray(items)) return [];
  return items.map((item: any) => ({
    menuItemId: item.menuItemId || item.menu_item_id || item.id || '',
    name: item.name || item.food_name || item.item_name || 'Item',
    quantity: Number(item.quantity || item.qty || 0),
    price: Number(item.price || item.unit_price || 0),
  }));
}

export const CANCEL_WINDOW_SECONDS = 30;
