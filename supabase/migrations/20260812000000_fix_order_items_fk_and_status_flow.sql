-- =============================================================================
-- Migration: Fix order_items foreign key + status flow alignment
-- Date: 2026-08-12
-- Purpose:
--   1. Ensure order_items has a proper FK to menu_items so Supabase
--      PostgREST can auto-embed menu_items in order_items queries.
--   2. Add canteen_id and order_number columns to orders if missing.
--   3. Ensure orders has the pickup_code column.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Ensure order_items.menu_item_id has FK to menu_items(id)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  -- Add FK constraint only if it doesn't already exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.order_items'::regclass
    AND confrelid = 'public.menu_items'::regclass
    AND contype = 'f'
  ) THEN
    ALTER TABLE public.order_items
      ADD CONSTRAINT order_items_menu_item_id_fkey
      FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(id)
      ON DELETE SET NULL;
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- 2. Ensure orders has canteen_id column
-- ---------------------------------------------------------------------------
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS canteen_id UUID;

-- Add FK from orders.canteen_id to canteens if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.orders'::regclass
    AND confrelid = 'public.canteens'::regclass
    AND contype = 'f'
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_canteen_id_fkey
      FOREIGN KEY (canteen_id) REFERENCES public.canteens(id)
      ON DELETE SET NULL;
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- 3. Ensure orders has order_number column
-- ---------------------------------------------------------------------------
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_number TEXT;

-- ---------------------------------------------------------------------------
-- 4. Ensure orders has pickup_code column
-- ---------------------------------------------------------------------------
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pickup_code TEXT;

-- ---------------------------------------------------------------------------
-- 5. Index for canteen-based filtering
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_orders_canteen_id ON public.orders(canteen_id);

-- ---------------------------------------------------------------------------
-- 6. Composite index for status flow queries
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_orders_institution_status
  ON public.orders(institution_id, status);
