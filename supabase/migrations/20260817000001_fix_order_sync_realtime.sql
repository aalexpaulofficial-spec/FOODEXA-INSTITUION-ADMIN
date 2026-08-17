-- =============================================================================
-- Migration: Fix Order Synchronization & Realtime
-- Date: 2026-08-17
-- Purpose:
--   1. Add order_items to supabase_realtime publication (MISSING - causes 400)
--   2. Ensure orders.institution_id has FK to institutions (needed for embed)
--   3. Ensure orders.student_id has FK to profiles (needed for embed)
--   4. Ensure order_items FK to orders exists
--   5. Ensure order_status_history FK to orders exists
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Add order_items to realtime publication (ROOT CAUSE OF 400 ERROR)
--    The frontend subscribes to postgres_changes on order_items but it was
--    never added to the supabase_realtime publication.
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- -----------------------------------------------------------------------------
-- 2. Ensure orders.institution_id FK to institutions exists
--    PostgREST needs this to resolve embedded institutions(*) queries
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.orders'::regclass
    AND confrelid = 'public.institutions'::regclass
    AND contype = 'f'
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_institution_id_fkey
      FOREIGN KEY (institution_id) REFERENCES public.institutions(id)
      ON DELETE SET NULL;
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- -----------------------------------------------------------------------------
-- 3. Ensure order_items.order_id FK to orders exists
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.order_items'::regclass
    AND confrelid = 'public.orders'::regclass
    AND contype = 'f'
  ) THEN
    ALTER TABLE public.order_items
      ADD CONSTRAINT order_items_order_id_fkey
      FOREIGN KEY (order_id) REFERENCES public.orders(id)
      ON DELETE CASCADE;
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- -----------------------------------------------------------------------------
-- 4. Ensure order_status_history.order_id FK to orders exists
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.order_status_history'::regclass
    AND confrelid = 'public.orders'::regclass
    AND contype = 'f'
  ) THEN
    ALTER TABLE public.order_status_history
      ADD CONSTRAINT order_status_history_order_id_fkey
      FOREIGN KEY (order_id) REFERENCES public.orders(id)
      ON DELETE CASCADE;
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- -----------------------------------------------------------------------------
-- 5. Ensure orders table has REPLICA IDENTITY FULL for realtime
--    (may already be set by earlier migration, but ensure it)
-- -----------------------------------------------------------------------------
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.order_items REPLICA IDENTITY FULL;
ALTER TABLE public.order_status_history REPLICA IDENTITY FULL;
