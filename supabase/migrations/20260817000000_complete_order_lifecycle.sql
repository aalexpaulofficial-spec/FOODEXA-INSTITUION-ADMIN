-- =============================================================================
-- Migration: Complete Real-Time Order Management Lifecycle
-- Date: 2026-08-17
-- Purpose:
--   Implement the full bidirectionally realtime order lifecycle on the SAME
--   public.orders table shared with the student dashboard:
--
--     1. Add 'awaiting_confirmation' as a canonical pre-confirmation status
--        (paid order received -> institution confirms -> kitchen works).
--     2. Track who confirmed an order (confirmed_by / confirmed_by_name).
--     3. Store the Razorpay payment references on the order (payment_reference,
--        razorpay_payment_id, razorpay_order_id) so authorized institution
--        staff can see them, and add a partial unique index for IDEMPOTENCY.
--     4. Create public.order_status_history so EVERY status change is recorded
--        with timestamp + actor (Payment Successful, Confirmed, Preparing,
--        Ready, Completed, ...).
--     5. Add RLS + realtime publication for order_status_history.
--     6. Create foodeza_upsert_verified_order(): a SECURITY DEFINER, idempotent
--        RPC that creates the order ONLY after server-side payment verification.
--        If the same Razorpay payment ID is submitted again it returns the
--        existing order and NEVER creates a duplicate.
--     7. Re-create the lifecycle RPCs so every transition records history and
--        the confirm action records who confirmed it. Transitions allowed:
--        (pending | awaiting_confirmation) -> confirmed -> preparing -> ready
--        -> completed, plus (pending | awaiting_confirmation) -> cancelled.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Status constraint -> add 'awaiting_confirmation'
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_status_check'
  ) THEN
    ALTER TABLE public.orders DROP CONSTRAINT orders_status_check;
  END IF;
END $$;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'awaiting_confirmation', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'));

-- Normalize any legacy title-cased statuses to lowercase
UPDATE public.orders SET status = lower(status)
WHERE status IS NOT NULL
  AND status NOT IN ('pending', 'awaiting_confirmation', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled');

-- -----------------------------------------------------------------------------
-- 2. Orders columns: confirmation actor + Razorpay payment references
-- -----------------------------------------------------------------------------
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS confirmed_by uuid;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS confirmed_by_name text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_reference text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS razorpay_payment_id text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS razorpay_order_id text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_time timestamptz;

-- Ensure the student column exists so history can link back to the student
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS student_id uuid;

-- Backfill student_id from user_id when only user_id was written
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'user_id'
  ) THEN
    UPDATE public.orders SET student_id = user_id WHERE student_id IS NULL AND user_id IS NOT NULL;
  END IF;
END $$;

-- Idempotency guard: one order per verified Razorpay payment (partial index so
-- NULL / legacy rows are not affected). The payment verification endpoint can
-- rely on this together with foodeza_upsert_verified_order().
CREATE UNIQUE INDEX IF NOT EXISTS uq_orders_razorpay_payment_id
  ON public.orders (razorpay_payment_id)
  WHERE razorpay_payment_id IS NOT NULL AND razorpay_payment_id <> '';

-- -----------------------------------------------------------------------------
-- 3. order_status_history table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_status_history (
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id          UUID         NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    status            TEXT         NOT NULL,
    changed_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    changed_by        UUID,
    changed_by_name   TEXT,
    notes             TEXT,
    institution_id    UUID,
    user_id           UUID,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order
  ON public.order_status_history (order_id, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_status_history_institution
  ON public.order_status_history (institution_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_user
  ON public.order_status_history (user_id);

-- Realtime: publish status history so both dashboards update instantly
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.order_status_history;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- -----------------------------------------------------------------------------
-- 4. RLS on order_status_history
--    - super_admin: full access
--    - institution staff: rows belonging to their institution
--    - students: rows for their own orders
--    Writes only happen through SECURITY DEFINER RPCs.
-- -----------------------------------------------------------------------------
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS osh_select ON public.order_status_history;
CREATE POLICY osh_select ON public.order_status_history
  FOR SELECT USING (
    _current_user_role() = 'super_admin'
    OR institution_id = _current_user_institution_id()
    OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS osh_insert ON public.order_status_history;
CREATE POLICY osh_insert ON public.order_status_history
  FOR INSERT WITH CHECK (
    _current_user_role() = 'super_admin'
    OR institution_id = _current_user_institution_id()
  );

DROP POLICY IF EXISTS osh_update ON public.order_status_history;
CREATE POLICY osh_update ON public.order_status_history
  FOR UPDATE USING (
    _current_user_role() = 'super_admin'
    OR institution_id = _current_user_institution_id()
  );

DROP POLICY IF EXISTS osh_delete ON public.order_status_history;
CREATE POLICY osh_delete ON public.order_status_history
  FOR DELETE USING (
    _current_user_role() = 'super_admin'
    OR institution_id = _current_user_institution_id()
  );

-- -----------------------------------------------------------------------------
-- 5. Helper: record a status-history row (SECURITY DEFINER, institution-scoped)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._record_order_status_history(
  p_order_id uuid,
  p_status text,
  p_changed_by uuid DEFAULT NULL,
  p_changed_by_name text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders;
BEGIN
  IF p_order_id IS NULL THEN RETURN; END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  IF v_order.id IS NULL THEN RETURN; END IF;

  INSERT INTO public.order_status_history
    (order_id, status, changed_at, changed_by, changed_by_name, notes, institution_id, user_id)
  VALUES
    (p_order_id, p_status, NOW(), p_changed_by, p_changed_by_name, p_notes,
     v_order.institution_id, v_order.student_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public._record_order_status_history(uuid, text, uuid, text, text) TO authenticated;

-- -----------------------------------------------------------------------------
-- 6. Lifecycle RPCs (history-aware + actor-aware)
-- -----------------------------------------------------------------------------

-- 6a. accept_food_order : (pending | awaiting_confirmation) -> confirmed
CREATE OR REPLACE FUNCTION public.accept_food_order(p_order_id uuid)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_institution_id uuid;
  v_actor_name          text;
  v_order               public.orders;
BEGIN
  IF p_order_id IS NULL THEN RAISE EXCEPTION 'order_id is required'; END IF;

  v_user_institution_id := public._current_user_institution_id();
  IF v_user_institution_id IS NULL THEN
    RAISE EXCEPTION 'User is not associated with any institution';
  END IF;

  SELECT full_name INTO v_actor_name FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF v_order.id IS NULL THEN RAISE EXCEPTION 'Order not found'; END IF;

  IF v_order.institution_id IS DISTINCT FROM v_user_institution_id THEN
    RAISE EXCEPTION 'Access denied: order belongs to another institution';
  END IF;

  -- Idempotent: only act when the order is awaiting confirmation
  IF v_order.status NOT IN ('pending', 'awaiting_confirmation') THEN
    RETURN v_order;
  END IF;

  UPDATE public.orders SET
    status            = 'confirmed',
    order_status      = 'Confirmed',
    kitchen_status    = 'Confirmed',
    counter_status    = 'Confirmed',
    confirmed_at      = NOW(),
    confirmed_by      = auth.uid(),
    confirmed_by_name = COALESCE(v_actor_name, 'Institution Staff'),
    updated_at        = NOW()
  WHERE id = p_order_id
  RETURNING * INTO v_order;

  PERFORM public._record_order_status_history(
    p_order_id, 'confirmed', auth.uid(), COALESCE(v_actor_name, 'Institution Staff'),
    'Order confirmed by institution'
  );

  RETURN v_order;
END;
$$;

-- 6b. start_food_preparing : confirmed -> preparing
CREATE OR REPLACE FUNCTION public.start_food_preparing(p_order_id uuid)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_institution_id uuid;
  v_actor_name          text;
  v_order               public.orders;
BEGIN
  IF p_order_id IS NULL THEN RAISE EXCEPTION 'order_id is required'; END IF;

  v_user_institution_id := public._current_user_institution_id();
  IF v_user_institution_id IS NULL THEN
    RAISE EXCEPTION 'User is not associated with any institution';
  END IF;

  SELECT full_name INTO v_actor_name FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;

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

  PERFORM public._record_order_status_history(
    p_order_id, 'preparing', auth.uid(), COALESCE(v_actor_name, 'Kitchen Staff'),
    'Kitchen started preparing'
  );

  RETURN v_order;
END;
$$;

-- 6c. mark_order_ready : preparing -> ready
CREATE OR REPLACE FUNCTION public.mark_order_ready(p_order_id uuid)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_institution_id uuid;
  v_actor_name          text;
  v_order               public.orders;
BEGIN
  IF p_order_id IS NULL THEN RAISE EXCEPTION 'order_id is required'; END IF;

  v_user_institution_id := public._current_user_institution_id();
  IF v_user_institution_id IS NULL THEN
    RAISE EXCEPTION 'User is not associated with any institution';
  END IF;

  SELECT full_name INTO v_actor_name FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;

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

  PERFORM public._record_order_status_history(
    p_order_id, 'ready', auth.uid(), COALESCE(v_actor_name, 'Kitchen Staff'),
    'Food ready for pickup'
  );

  RETURN v_order;
END;
$$;

-- 6d. complete_food_order : ready -> completed
CREATE OR REPLACE FUNCTION public.complete_food_order(p_order_id uuid)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_institution_id uuid;
  v_actor_name          text;
  v_order               public.orders;
BEGIN
  IF p_order_id IS NULL THEN RAISE EXCEPTION 'order_id is required'; END IF;

  v_user_institution_id := public._current_user_institution_id();
  IF v_user_institution_id IS NULL THEN
    RAISE EXCEPTION 'User is not associated with any institution';
  END IF;

  SELECT full_name INTO v_actor_name FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;

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

  PERFORM public._record_order_status_history(
    p_order_id, 'completed', auth.uid(), COALESCE(v_actor_name, 'Institution Staff'),
    'Order collected by student'
  );

  RETURN v_order;
END;
$$;

-- 6e. cancel_food_order : (pending | awaiting_confirmation) -> cancelled
CREATE OR REPLACE FUNCTION public.cancel_food_order(p_order_id uuid)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_institution_id uuid;
  v_actor_name          text;
  v_order               public.orders;
BEGIN
  IF p_order_id IS NULL THEN RAISE EXCEPTION 'order_id is required'; END IF;

  v_user_institution_id := public._current_user_institution_id();
  IF v_user_institution_id IS NULL THEN
    RAISE EXCEPTION 'User is not associated with any institution';
  END IF;

  SELECT full_name INTO v_actor_name FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF v_order.id IS NULL THEN RAISE EXCEPTION 'Order not found'; END IF;

  IF v_order.institution_id IS DISTINCT FROM v_user_institution_id THEN
    RAISE EXCEPTION 'Access denied: order belongs to another institution';
  END IF;

  -- Idempotent: only act when awaiting confirmation
  IF v_order.status NOT IN ('pending', 'awaiting_confirmation') THEN
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

  PERFORM public._record_order_status_history(
    p_order_id, 'cancelled', auth.uid(), COALESCE(v_actor_name, 'Institution Staff'),
    'Order cancelled'
  );

  RETURN v_order;
END;
$$;

-- -----------------------------------------------------------------------------
-- 7. Idempotent verified-payment order creator
-- -----------------------------------------------------------------------------
-- Called ONLY by the secure server-side Razorpay verification flow (service
-- role or an authenticated institution/student whose profile matches). If the
-- razorpay_payment_id was already processed, the existing order is returned
-- and NO duplicate row is ever created.
CREATE OR REPLACE FUNCTION public.foodeza_upsert_verified_order(
  p_razorpay_payment_id text,
  p_razorpay_order_id   text,
  p_institution_id      uuid,
  p_canteen_id          uuid,
  p_user_id             uuid,
  p_student_name        text,
  p_items               jsonb,
  p_total_amount        numeric,
  p_pickup_code         text,
  p_token_number        text,
  p_order_number        text,
  p_pickup_counter      text,
  p_payment_method      text
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order       public.orders;
  v_item        jsonb;
  v_actor_role  text;
  v_actor_inst  uuid;
  v_new_id      uuid;
BEGIN
  -- Idempotency: a verified payment must never create a duplicate order
  IF p_razorpay_payment_id IS NOT NULL AND p_razorpay_payment_id <> '' THEN
    SELECT * INTO v_order
    FROM public.orders
    WHERE razorpay_payment_id = p_razorpay_payment_id
    LIMIT 1;
    IF v_order.id IS NOT NULL THEN
      RETURN v_order;
    END IF;
  END IF;

  -- Authorization: derive access from the profile, never trust the client
  v_actor_role := public._current_user_role();
  v_actor_inst := public._current_user_institution_id();

  IF v_actor_role IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated';
  END IF;

  IF v_actor_role <> 'super_admin' THEN
    IF p_institution_id IS NULL OR v_actor_inst IS DISTINCT FROM p_institution_id THEN
      RAISE EXCEPTION 'Access denied: institution mismatch';
    END IF;
    IF v_actor_role = 'student' AND auth.uid() IS DISTINCT FROM p_user_id THEN
      RAISE EXCEPTION 'Access denied: cannot place an order for another user';
    END IF;
  END IF;

  INSERT INTO public.orders (
    institution_id,
    canteen_id,
    student_id,
    student_name,
    order_number,
    token_number,
    pickup_code,
    pickup_counter,
    order_time,
    total_amount,
    payment_status,
    payment_method,
    payment_reference,
    razorpay_payment_id,
    razorpay_order_id,
    status,
    order_status,
    kitchen_status,
    counter_status
  )
  VALUES (
    p_institution_id,
    p_canteen_id,
    p_user_id,
    p_student_name,
    p_order_number,
    p_token_number,
    p_pickup_code,
    p_pickup_counter,
    NOW(),
    p_total_amount,
    'paid',
    p_payment_method,
    p_razorpay_payment_id,
    p_razorpay_payment_id,
    p_razorpay_order_id,
    'awaiting_confirmation',
    'Waiting for Confirmation',
    'Awaiting Confirmation',
    'Awaiting Confirmation'
  )
  RETURNING id INTO v_new_id;

  SELECT * INTO v_order FROM public.orders WHERE id = v_new_id;

  -- Insert the ordered items
  IF p_items IS NOT NULL AND jsonb_typeof(p_items) = 'array' THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
      INSERT INTO public.order_items (
        order_id, menu_item_id, institution_id, item_name, quantity, unit_price, total_price
      )
      VALUES (
        v_order.id,
        NULLIF((v_item->>'menu_item_id'), '')::uuid,
        p_institution_id,
        COALESCE(v_item->>'item_name', 'Item'),
        COALESCE((v_item->>'quantity')::int, 1),
        COALESCE((v_item->>'unit_price')::numeric, 0),
        COALESCE((v_item->>'total_price')::numeric, COALESCE((v_item->>'unit_price')::numeric, 0) * COALESCE((v_item->>'quantity')::int, 1))
      );
    END LOOP;
  END IF;

  -- Record the payment milestone
  PERFORM public._record_order_status_history(
    v_order.id, 'paid', auth.uid(), p_student_name,
    'Payment verified via Razorpay (reference: ' || COALESCE(p_razorpay_payment_id, 'N/A') || ')'
  );

  RETURN v_order;
END;
$$;

GRANT EXECUTE ON FUNCTION public.foodeza_upsert_verified_order(
  text, text, uuid, uuid, uuid, text, jsonb, numeric, text, text, text, text, text
) TO authenticated;

-- -----------------------------------------------------------------------------
-- 8. Grants for the lifecycle RPCs
-- -----------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.accept_food_order(uuid)        TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_food_preparing(uuid)     TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_order_ready(uuid)         TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_food_order(uuid)      TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_food_order(uuid)        TO authenticated;