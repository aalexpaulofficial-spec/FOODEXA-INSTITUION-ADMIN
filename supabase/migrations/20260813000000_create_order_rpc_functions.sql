-- =============================================================================
-- Migration: FOODEXA Order Status RPC Functions
-- Date: 2026-08-13
-- Purpose:
--   Create three SECURITY DEFINER RPC functions that enforce institution
--   ownership before updating order status. This bypasses the RLS UPDATE
--   issue (PGRST116 / 0 rows affected) by running the UPDATE with full
--   privileges inside the database, while still verifying the caller's
--   institution matches the order's institution.
--
--   Functions:
--     foodeza_accept_order(uuid)    -- pending  -> preparing
--     foodeza_mark_order_ready(uuid)-- preparing -> ready
--     foodeza_complete_order(uuid)  -- ready    -> completed
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Helper: resolve the caller's institution_id from their profile row
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._current_user_institution_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT institution_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- ---------------------------------------------------------------------------
-- RPC: foodeza_accept_order
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.foodeza_accept_order(p_order_id uuid)
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
    RAISE EXCEPTION 'Order is not in pending status (current: %)', v_order.status;
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

-- ---------------------------------------------------------------------------
-- RPC: foodeza_mark_order_ready
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.foodeza_mark_order_ready(p_order_id uuid)
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

  IF v_order.status <> 'preparing' THEN
    RAISE EXCEPTION 'Order is not in preparing status (current: %)', v_order.status;
  END IF;

  UPDATE public.orders SET
    status         = 'ready',
    order_status   = 'Ready',
    kitchen_status = 'Ready',
    counter_status = 'Ready',
    ready_at       = NOW(),
    updated_at     = NOW()
  WHERE id = p_order_id
  RETURNING * INTO v_order;

  RETURN v_order;
END;
$$;

-- ---------------------------------------------------------------------------
-- RPC: foodeza_complete_order
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.foodeza_complete_order(p_order_id uuid)
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

  IF v_order.status <> 'ready' THEN
    RAISE EXCEPTION 'Order is not in ready status (current: %)', v_order.status;
  END IF;

  UPDATE public.orders SET
    status         = 'completed',
    order_status   = 'Completed',
    kitchen_status = 'Completed',
    counter_status = 'Picked Up',
    completed_at   = NOW(),
    updated_at     = NOW()
  WHERE id = p_order_id
  RETURNING * INTO v_order;

  RETURN v_order;
END;
$$;

-- ---------------------------------------------------------------------------
-- Grants: allow authenticated users to execute the RPC functions
-- ---------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.foodeza_accept_order(uuid)   TO authenticated;
GRANT EXECUTE ON FUNCTION public.foodeza_mark_order_ready(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.foodeza_complete_order(uuid)  TO authenticated;
