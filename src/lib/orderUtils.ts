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
  let started = order.preparingAt;
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
        payment_status: 'refunded',
        cancelled_at: now,
        updated_at: now,
      };
    case 'pending':
      return {
        status: 'pending',
        order_status: 'Pending',
        kitchen_status: 'Pending',
        counter_status: 'Pending',
        updated_at: now,
      };
    case 'awaiting_confirmation':
      return {
        status: 'awaiting_confirmation',
        order_status: 'Waiting for Confirmation',
        kitchen_status: 'Awaiting Confirmation',
        counter_status: 'Awaiting Confirmation',
        updated_at: now,
      };
  }
}

export function buildConfirmedUpdate(): Record<string, unknown> {
  const now = new Date().toISOString();
  return {
    status: 'confirmed',
    order_status: 'Confirmed',
    kitchen_status: 'Confirmed',
    counter_status: 'Confirmed',
    confirmed_at: now,
    updated_at: now,
  };
}

export function nextStatus(current: OrderStatus): OrderStatus | null {
  switch (current) {
    case 'pending':              return 'confirmed';
    case 'awaiting_confirmation': return 'confirmed';
    case 'confirmed':            return 'preparing';
    case 'preparing':            return 'ready';
    case 'ready':                return 'completed';
    case 'completed':            return null;
    case 'cancelled':            return null;
    default:                     return null;
  }
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  if (from === to) return false;
  if (to === 'cancelled') return from === 'pending' || from === 'awaiting_confirmation';
  if (to === 'completed') return from === 'ready';
  return nextStatus(from) === to;
}

export function getOrderStatusLabel(status: OrderStatus): string {
  switch (status) {
    case 'pending':              return 'Waiting for Confirmation';
    case 'awaiting_confirmation': return 'Waiting for Confirmation';
    case 'confirmed':            return 'Order Confirmed';
    case 'preparing':            return 'Preparing';
    case 'ready':                return 'Ready at Counter';
    case 'completed':            return 'Order Collected';
    case 'cancelled':            return 'Cancelled';
    default:                     return status;
  }
}

export function getKitchenStatusLabel(status: string): string {
  switch (status) {
    case 'Pending':    return 'Pending';
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
    case 'pending':              return 'amber';
    case 'awaiting_confirmation': return 'amber';
    case 'preparing':            return 'cyan';
    case 'ready':                return 'emerald';
    case 'completed':            return 'green';
    case 'cancelled':            return 'red';
    default:                     return 'slate';
  }
}

export function getNotificationForStatus(status: OrderStatus, order: Order): { type: string; title: string; message: string } | null {
  const orderNum = order.orderNumber || order.id;
  const studentName = order.studentName || 'Student';
  switch (status) {
    case 'confirmed':
      return {
        type: 'success',
        title: 'Order Confirmed',
        message: `Your order #${orderNum} has been confirmed by the institution.`,
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
    case 'pending':              return 'Payment Successful';
    case 'awaiting_confirmation': return 'Payment Successful';
    case 'confirmed':            return 'Order Confirmed';
    case 'preparing':            return 'Preparing';
    case 'ready':                return 'Ready for Pickup';
    case 'completed':            return 'Order Completed';
    case 'cancelled':            return 'Cancelled';
    default:                     return status;
  }
}

export function normalizeOrderStatus(value: unknown): OrderStatus {
  const status = String(value || '').toLowerCase();
  // Map legacy 'accepted' to 'preparing' (accepting now goes directly to preparing)
  if (status === 'accepted') return 'preparing';
  if (status === 'awaiting-confirmation' || status === 'awaiting confirmation' || status === 'waiting') {
    return 'awaiting_confirmation';
  }
  if (['pending', 'awaiting_confirmation', 'preparing', 'ready', 'completed', 'cancelled', 'confirmed'].includes(status)) {
    return status as OrderStatus;
  }
  return 'pending';
}

export function getStatusHistoryLabel(status: string): string {
  const s = String(status || '').toLowerCase();
  switch (s) {
    case 'paid':
    case 'payment_success':
    case 'payment verified':
      return 'Payment Successful';
    case 'pending':
    case 'awaiting_confirmation':
      return 'Waiting for Confirmation';
    case 'confirmed':
      return 'Order Confirmed';
    case 'preparing':
      return 'Preparing';
    case 'ready':
      return 'Ready at Counter';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return String(status || '');
  }
}

export function normalizeKitchenStatus(value: unknown): string {
  const status = String(value || '').toLowerCase();
  if (status === 'preparing') return 'Preparing';
  if (status === 'ready') return 'Ready';
  if (status === 'completed') return 'Completed';
  if (status === 'cancelled') return 'Cancelled';
  // Map legacy 'accepted' to 'Preparing' since accept now goes directly to preparing
  if (status === 'accepted') return 'Preparing';
  return 'Pending';
}

export function normalizeOrderItems(items: unknown): Order['items'] {
  if (!Array.isArray(items)) return [];
  return items.map((item: any) => {
    if (!item || typeof item !== 'object') {
      return { menuItemId: '', name: 'Item', quantity: 1, price: 0 };
    }
    // Try to get food_name from joined menu_items
    const menuItem = Array.isArray(item.menu_items) ? item.menu_items[0] : item.menu_items;
    if (menuItem && typeof menuItem === 'object') {
      return {
        menuItemId: item.menu_item_id || item.menuItemId || item.id || '',
        name: menuItem.food_name || item.item_name || item.name || 'Item',
        quantity: Number(item.quantity || item.qty || 1),
        price: Number(item.unit_price ?? item.price ?? menuItem.regular_price ?? menuItem.price ?? 0),
      };
    }
    return {
      menuItemId: item.menuItemId || item.menu_item_id || item.id || '',
      name: item.item_name || item.food_name || item.name || 'Item',
      quantity: Number(item.quantity || item.qty || 1),
      price: Number(item.unit_price || item.price || 0),
    };
  });
}

export const CANCEL_WINDOW_SECONDS = 30;

export const IST_OFFSET_MINUTES = 5 * 60 + 30;

export function buildOrderItemSummary(order: Order): string {
  const raw = order.orderItems && order.orderItems.length
    ? order.orderItems.map((oi) => ({
        name: oi.menu_items?.food_name || oi.item_name || 'Item',
        quantity: Number(oi.quantity || 0),
      }))
    : (order.items || []).map((it) => ({
        name: it.name || 'Item',
        quantity: Number(it.quantity || 0),
      }));

  return raw
    .filter((i) => i.name && i.quantity > 0)
    .map((i) => `${i.quantity} ${i.name}`)
    .join(', ');
}

export function toIst(time: number | Date | string): Date {
  const d = time instanceof Date ? time : new Date(time);
  if (Number.isNaN(d.getTime())) return d;
  return new Date(d.getTime() + IST_OFFSET_MINUTES * 60 * 1000);
}

export function istDateStr(value: number | Date | string): string {
  const d = toIst(value);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function istNowDateStr(): string {
  return istDateStr(Date.now());
}
