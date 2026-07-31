-- =============================================================================
-- Migration: Orders Production Synchronization
-- Date: 2026-07-31
-- Purpose:
--   1. Enforce the 30-second cancellation window on public.orders.
--   2. Ensure the orders table is published to the realtime subscription so
--      Kitchen Queue, Order Management, Dashboard and Student Dashboard all
--      receive postgres_changes events (INSERT / UPDATE / DELETE) instantly.
--   3. Index the queue filter columns for fast kitchen_status queries.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Guarantee the status / timestamp columns used by the sync payloads exist
-- -----------------------------------------------------------------------------
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS kitchen_status text DEFAULT 'Pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS counter_status text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS accepted_at timestamptz;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS preparing_at timestamptz;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS ready_at timestamptz;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS completed_at timestamptz;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;

-- -----------------------------------------------------------------------------
-- 2. Cancel guard: institution may cancel only within 30 seconds of created_at
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.block_late_order_cancel()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM 'cancelled' THEN
    IF NEW.created_at IS NULL OR (NOW() - NEW.created_at) > interval '30 seconds' THEN
      RAISE EXCEPTION 'Cannot cancel because kitchen processing has started.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_block_late_order_cancel ON public.orders;
CREATE TRIGGER trg_block_late_order_cancel
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.block_late_order_cancel();

-- -----------------------------------------------------------------------------
-- 3. Realtime: publish orders to the Supabase realtime publication
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;

-- -----------------------------------------------------------------------------
-- 4. Index for kitchen queue filtering
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_orders_institution_kitchen
  ON public.orders (institution_id, kitchen_status);
