-- =============================================================================
-- Migration: Order lifecycle RPCs + status constraint alignment
-- Date: 2026-08-14
-- Purpose:
--   1. Recreate the orders_status_check constraint so the ONLY allowed database
--      values are the lowercase canonical set:
--        pending | confirmed | preparing | ready | completed | cancelled
--      This fixes the "violates check constraint orders_status_check" error
--      caused by the old constraint expecting Title-Cased values.
--   2. Normalize any existing rows to lowercase.
--   3. Add defensive order columns used by the Institution Dashboard:
--        token_number, estimated_ready_time, pickup_counter,
--        confirmed_at, cancel_deadline_at
--   4. Add menu_items.pickup_type so menu items can be bound to a pickup window.
--   5. Create the canonical order-lifecycle RPCs that the Institution Dashboard
--      calls (accept_food_order, start_food_preparing, mark_order_ready,
--      complete_food_order, cancel_food_order). Each RPC:
--        - derives the caller's institution from their profile (never trusts a
--          browser-supplied institution_id),
--        - verifies ownership,
--        - is IDEMPOTENT: if the order is already at/beyond the target state it
--          returns the current row instead of raising a duplicate/confusing error.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Status constraint -> lowercase canonical enum
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'orders_status_check'
  ) THEN
    ALTER TABLE public.orders DROP CONSTRAINT orders_status_check;
  END IF;
END $$;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'));

-- Normalize any legacy title-cased statuses to lowercase
UPDATE public.orders SET status = lower(status)
WHERE status IS NOT NULL
  AND status NOT IN ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled');

-- -----------------------------------------------------------------------------
-- 2. Defensive order columns
-- -----------------------------------------------------------------------------
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS token_number text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS estimated_ready_time timestamptz;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pickup_counter text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancel_deadline_at timestamptz;

-- -----------------------------------------------------------------------------
-- 3. menu_items.pickup_type
-- -----------------------------------------------------------------------------
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS pickup_type text;

-- -----------------------------------------------------------------------------
-- 4. Helper: resolve caller institution from profile (do NOT trust client input)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._current_user_institution_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT institution_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- -----------------------------------------------------------------------------
-- 5. Canonical lifecycle RPCs
-- -----------------------------------------------------------------------------

-- 5a. accept_food_order : pending -> confirmed
CREATE OR REPLACE FUNCTION public.accept_food_order(p_order_id uuid)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_institution_id uuid;
  v_order public.orders;
BEGIN
  IF p_order_id IS NULL THEN RAISE EXCEPTION 'order_id is required'; END IF;

  v_user_institution_id := public._current_user_institution_id();
  IF v_user_institution_id IS NULL THEN
    RAISE EXCEPTION 'User is not associated with any institution';
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF v_order.id IS NULL THEN RAISE EXCEPTION 'Order not found'; END IF;

  IF v_order.institution_id IS DISTINCT FROM v_user_institution_id THEN
    RAISE EXCEPTION 'Access denied: order belongs to another institution';
  END IF;

  -- Idempotent: if not pending, return the current order safely (no duplicate processing)
  IF v_order.status <> 'pending' THEN
    RETURN v_order;
  END IF;

  UPDATE public.orders SET
    status         = 'confirmed',
    order_status   = 'Confirmed',
    kitchen_status = 'Confirmed',
    counter_status = 'Confirmed',
    confirmed_at   = NOW(),
    updated_at     = NOW()
  WHERE id = p_order_id
  RETURNING * INTO v_order;

  RETURN v_order;
END;
$$;

-- 5b. start_food_preparing : confirmed -> preparing
CREATE OR REPLACE FUNCTION public.start_food_preparing(p_order_id uuid)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_institution_id uuid;
  v_order public.orders;
BEGIN
  IF p_order_id IS NULL THEN RAISE EXCEPTION 'order_id is required'; END IF;

  v_user_institution_id := public._current_user_institution_id();
  IF v_user_institution_id IS NULL THEN
    RAISE EXCEPTION 'User is not associated with any institution';
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF v_order.id IS NULL THEN RAISE EXCEPTION 'Order not found'; END IF;

  IF v_order.institution_id IS DISTINCT FROM v_user_institution_id THEN
    RAISE EXCEPTION 'Access denied: order belongs to another institution';
  END IF;

  -- Idempotent: only act when currently confirmed
  IF v_order.status <> 'confirmed' THEN
    RETURN v_order;
  END IF;

  UPDATE public.orders SET
    status         = 'preparing',
    order_status   = 'Preparing',
    kitchen_status = 'Preparing',
    counter_status = 'Preparing',
    preparing_at   = NOW(),
    updated_at     = NOW()
  WHERE id = p_order_id
  RETURNING * INTO v_order;

  RETURN v_order;
END;
$$;

-- 5c. mark_order_ready : preparing -> ready
CREATE OR REPLACE FUNCTION public.mark_order_ready(p_order_id uuid)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_institution_id uuid;
  v_order public.orders;
BEGIN
  IF p_order_id IS NULL THEN RAISE EXCEPTION 'order_id is required'; END IF;

  v_user_institution_id := public._current_user_institution_id();
  IF v_user_institution_id IS NULL THEN
    RAISE EXCEPTION 'User is not associated with any institution';
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF v_order.id IS NULL THEN RAISE EXCEPTION 'Order not found'; END IF;

  IF v_order.institution_id IS DISTINCT FROM v_user_institution_id THEN
    RAISE EXCEPTION 'Access denied: order belongs to another institution';
  END IF;

  -- Idempotent: only act when currently preparing
  IF v_order.status <> 'preparing' THEN
    RETURN v_order;
  END IF;

  UPDATE public.orders SET
    status         = 'ready',
    order_status   = 'Ready',
    kitchen_status = 'Ready',
    counter_status = 'waiting',
    ready_at       = NOW(),
    updated_at     = NOW()
  WHERE id = p_order_id
  RETURNING * INTO v_order;

  RETURN v_order;
END;
$$;

-- 5d. complete_food_order : ready -> completed
CREATE OR REPLACE FUNCTION public.complete_food_order(p_order_id uuid)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_institution_id uuid;
  v_order public.orders;
BEGIN
  IF p_order_id IS NULL THEN RAISE EXCEPTION 'order_id is required'; END IF;

  v_user_institution_id := public._current_user_institution_id();
  IF v_user_institution_id IS NULL THEN
    RAISE EXCEPTION 'User is not associated with any institution';
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF v_order.id IS NULL THEN RAISE EXCEPTION 'Order not found'; END IF;

  IF v_order.institution_id IS DISTINCT FROM v_user_institution_id THEN
    RAISE EXCEPTION 'Access denied: order belongs to another institution';
  END IF;

  -- Idempotent: only act when currently ready
  IF v_order.status <> 'ready' THEN
    RETURN v_order;
  END IF;

  UPDATE public.orders SET
    status         = 'completed',
    order_status   = 'Completed',
    kitchen_status = 'Completed',
    counter_status = 'completed',
    completed_at   = NOW(),
    updated_at     = NOW()
  WHERE id = p_order_id
  RETURNING * INTO v_order;

  RETURN v_order;
END;
$$;

-- 5e. cancel_food_order : pending -> cancelled (within 30s window)
CREATE OR REPLACE FUNCTION public.cancel_food_order(p_order_id uuid)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_institution_id uuid;
  v_order public.orders;
BEGIN
  IF p_order_id IS NULL THEN RAISE EXCEPTION 'order_id is required'; END IF;

  v_user_institution_id := public._current_user_institution_id();
  IF v_user_institution_id IS NULL THEN
    RAISE EXCEPTION 'User is not associated with any institution';
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF v_order.id IS NULL THEN RAISE EXCEPTION 'Order not found'; END IF;

  IF v_order.institution_id IS DISTINCT FROM v_user_institution_id THEN
    RAISE EXCEPTION 'Access denied: order belongs to another institution';
  END IF;

  -- Idempotent: only act when currently pending
  IF v_order.status <> 'pending' THEN
    RETURN v_order;
  END IF;

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

-- -----------------------------------------------------------------------------
-- 6. Grants
-- -----------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.accept_food_order(uuid)     TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_food_preparing(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_order_ready(uuid)      TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_food_order(uuid)  TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_food_order(uuid)    TO authenticated;
