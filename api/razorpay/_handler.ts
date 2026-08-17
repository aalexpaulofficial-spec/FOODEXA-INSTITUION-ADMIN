import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim().replace(/\/$/, '');
const serviceRoleKey = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  ''
).trim();
const razorpaySecret = (process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET || '').trim();

function getAdmin() {
  if (!supabaseUrl || !serviceRoleKey) throw new HttpError(500, 'Supabase admin env vars not configured.');
  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function cors(res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
}

function send(res: any, status: number, body: unknown) {
  cors(res);
  return res.status(status).json(body);
}

function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string): boolean {
  if (!razorpaySecret) {
    console.error('[Razorpay] RAZORPAY_KEY_SECRET not configured');
    return false;
  }
  const expected = crypto
    .createHmac('sha256', razorpaySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return expected === signature;
}

function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `FX-${ts}-${rand}`;
}

function generateTokenNumber(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function generatePickupCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

async function verifyAndCreateOrder(req: any, res: any) {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    institution_id,
    canteen_id,
    items,
    total_amount,
    student_name,
    student_email,
    student_phone,
    pickup_counter,
    payment_method,
  } = req.body || {};

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return send(res, 400, { error: 'Missing Razorpay payment verification data.' });
  }
  if (!institution_id) {
    return send(res, 400, { error: 'institution_id is required.' });
  }
  if (!items || !Array.isArray(items) || items.length === 0) {
    return send(res, 400, { error: 'At least one order item is required.' });
  }

  const signatureValid = verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
  if (!signatureValid) {
    console.error('[Razorpay] Invalid signature for payment', razorpay_payment_id);
    return send(res, 403, { error: 'Payment signature verification failed.' });
  }

  const admin = getAdmin();

  const authHeader = String(req.headers.authorization || '');
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  let userId: string | null = null;

  if (token) {
    const { data: authData, error: authErr } = await admin.auth.getUser(token);
    if (!authErr && authData?.user) {
      userId = authData.user.id;
    }
  }

  if (!userId) {
    return send(res, 401, { error: 'Authentication required.' });
  }

  const { data: profile } = await admin
    .from('profiles')
    .select('institution_id, role')
    .eq('user_id', userId)
    .maybeSingle();

  if (!profile) {
    return send(res, 403, { error: 'Profile not found.' });
  }

  if (profile.role !== 'super_admin' && profile.institution_id !== institution_id) {
    return send(res, 403, { error: 'Access denied: institution mismatch.' });
  }

  const itemsJson = items.map((it: any) => ({
    menu_item_id: it.menu_item_id || null,
    item_name: it.item_name || it.name || 'Item',
    quantity: Number(it.quantity || 1),
    unit_price: Number(it.unit_price || it.price || 0),
    total_price: Number(it.total_price || (Number(it.quantity || 1) * Number(it.unit_price || it.price || 0))),
  }));

  const { data: order, error: rpcError } = await admin.rpc('foodeza_upsert_verified_order', {
    p_razorpay_payment_id: razorpay_payment_id,
    p_razorpay_order_id: razorpay_order_id,
    p_institution_id: institution_id,
    p_canteen_id: canteen_id || null,
    p_user_id: userId,
    p_student_name: student_name || '',
    p_items: JSON.stringify(itemsJson),
    p_total_amount: Number(total_amount || 0),
    p_pickup_code: generatePickupCode(),
    p_token_number: generateTokenNumber(),
    p_order_number: generateOrderNumber(),
    p_pickup_counter: pickup_counter || '',
    p_payment_method: payment_method || 'Razorpay',
  });

  if (rpcError) {
    console.error('[Razorpay] RPC error creating order:', rpcError);
    return send(res, 500, {
      error: 'Payment verified but order creation failed. Please contact support.',
      details: rpcError.message || 'RPC error',
    });
  }

  if (!order) {
    return send(res, 500, { error: 'Order creation returned no data.' });
  }

  return send(res, 200, {
    success: true,
    order_id: order.id,
    order_number: order.order_number || order.orderNumber || '',
    token_number: order.token_number || order.tokenNumber || '',
    pickup_code: order.pickup_code || order.pickupCode || '',
    status: order.status,
    payment_status: order.payment_status,
  });
}

export default async function handler(req: any, res: any) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).json({ ok: true });
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed.' });

  try {
    return await verifyAndCreateOrder(req, res);
  } catch (err: any) {
    if (err instanceof HttpError) return send(res, err.status, { error: err.message });
    console.error('[Razorpay verify] Unexpected error:', err);
    return send(res, 500, { error: err?.message || 'Payment verification failed.' });
  }
}
