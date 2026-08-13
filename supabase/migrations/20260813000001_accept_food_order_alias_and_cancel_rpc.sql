-- =============================================================================
-- Migration: accept_food_order alias + foodeza_cancel_order RPC
-- Date: 2026-08-13
-- Purpose:
--   1. Create public.accept_food_order(uuid) as the canonical Accept RPC
--      (delegates to foodeza_accept_order which already enforces RLS +
--       institution ownership + status guard).
--   2. Create foodeza_cancel_order(uuid) so cancellation also goes through a
--      SECURITY DEFINER RPC instead of a direct .update() that can trigger
--      PGRST116 / 406 when RLS blocks the row.
--   3. Grant EXECUTE to authenticated users.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. accept_food_order  –  canonical name the frontend will call
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.accept_food_order(p_order_id uuid)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.foodeza_accept_order(p_order_id);
END;
$$;

-- ---------------------------------------------------------------------------
-- 2. foodeza_cancel_order  –  pending -> cancelled (30-second window)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.foodeza_cancel_order(p_order_id uuid)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_institution_id uuid;
  v_order               public.orders;
BEGIN
  IF p_order_id IS NULL THEN
    RAISE EXCEPTION 'order_id is required';
  END IF;

  v_user_institution_id := public._current_user_institution_id();

  IF v_user_institution_id IS NULL THEN
    RAISE EXCEPTION 'User is not associated with any institution';
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;

  IF v_order.id IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF v_order.institution_id IS DISTINCT FROM v_user_institution_id THEN
    RAISE EXCEPTION 'Access denied: order belongs to another institution';
  END IF;

  IF v_order.status <> 'pending' THEN
    RAISE EXCEPTION 'Cannot cancel: order is not in pending status (current: %)', v_order.status;
  END IF;

  -- Enforce 30-second cancel window (server-side guard)
  IF v_order.created_at IS NOT NULL
     AND (EXTRACT(EPOCH FROM (NOW() - v_order.created_at)) > 30) THEN
    RAISE EXCEPTION 'Cannot cancel: 30-second window has expired';
  END IF;

  UPDATE public.orders SET
    status         = 'cancelled',
    order_status   = 'Cancelled',
    kitchen_status = 'Cancelled',
    counter_status = 'Cancelled',
    payment_status = 'refunded',
    cancelled_at   = NOW(),
    updated_at     = NOW()
  WHERE id = p_order_id
  RETURNING * INTO v_order;

  RETURN v_order;
END;
$$;

-- ---------------------------------------------------------------------------
-- 3. Grants
-- ---------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.accept_food_order(uuid)       TO authenticated;
GRANT EXECUTE ON FUNCTION public.foodeza_cancel_order(uuid)    TO authenticated;
