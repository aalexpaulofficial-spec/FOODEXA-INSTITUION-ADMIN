import { Order, OrderStatus } from '../types';

export const ORDER_CANCEL_WINDOW_MS = 30 * 1000;
export const CANCEL_BLOCK_MESSAGE = 'Cannot cancel because kitchen processing has started.';

export function getOrderCreatedAt(order: Order): string {
  return order.created_at || order.createdAt || order.orderTime || '';
}

export function isWithinCancelWindow(order: Order): boolean {
  const created = getOrderCreatedAt(order);
  if (!created) return false;
  const t = new Date(created).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t <= ORDER_CANCEL_WINDOW_MS;
}

export function buildStatusUpdate(status: OrderStatus): Record<string, unknown> {
  const now = new Date().toISOString();
  switch (status) {
    case 'accepted':
      return { status: 'accepted', order_status: 'Accepted', kitchen_status: 'Accepted', accepted_at: now };
    case 'preparing':
      return { status: 'preparing', order_status: 'Preparing', kitchen_status: 'Preparing', preparing_at: now };
    case 'ready':
      return { status: 'ready', order_status: 'Ready at Counter', kitchen_status: 'Ready', counter_status: 'Ready', ready_at: now };
    case 'completed':
      return { status: 'completed', order_status: 'Completed', kitchen_status: 'Completed', counter_status: 'Picked Up', completed_at: now };
    case 'cancelled':
      return { status: 'cancelled', order_status: 'Cancelled', kitchen_status: 'Cancelled', counter_status: 'Cancelled', cancelled_at: now };
    case 'pending':
    default:
      return { status: 'pending', order_status: 'Pending', kitchen_status: 'Pending' };
  }
}
