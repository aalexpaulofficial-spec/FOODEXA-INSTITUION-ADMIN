-- =============================================================================
-- Migration: Order Items + Notifications for Live Order Management
-- Date: 2026-07-31
-- Purpose:
--   1. Create public.order_items table for ordered menu items per order.
--   2. Ensure public.notifications has all columns for status-change notifications.
--   3. Add index on notifications for realtime filtering by institution.
--   4. Add status columns on orders (kitchen_status, order_status, counter_status)
--      if they do not exist.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. order_items table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_items (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID         NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    menu_item_id    UUID         REFERENCES public.menu_items(id),
    institution_id  UUID,
    item_name       TEXT         NOT NULL,
    quantity        INTEGER      NOT NULL DEFAULT 1,
    unit_price      NUMERIC(10,2) NOT NULL DEFAULT 0,
    total_price     NUMERIC(10,2) NOT NULL DEFAULT 0,
    special_instructions TEXT,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_institution ON public.order_items(institution_id);

-- -----------------------------------------------------------------------------
-- 2. Ensure orders has the required status columns (idempotent)
-- -----------------------------------------------------------------------------
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS kitchen_status  TEXT DEFAULT 'Pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_status    TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS counter_status  TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at      TIMESTAMPTZ DEFAULT NOW();

-- Index for kitchen queue filtering
CREATE INDEX IF NOT EXISTS idx_orders_institution_kitchen_status
    ON public.orders(institution_id, kitchen_status);

-- Index for realtime lookup by pickup code
CREATE INDEX IF NOT EXISTS idx_orders_pickup_code
    ON public.orders(pickup_code);

-- -----------------------------------------------------------------------------
-- 3. Notifications table — ensure all columns needed for order notifications
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'notifications' AND column_name = 'institution_id'
    ) THEN
        CREATE TABLE IF NOT EXISTS public.notifications (
            id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
            institution_id  UUID,
            user_id         UUID,
            order_id        UUID REFERENCES public.orders(id),
            type            TEXT,
            title           TEXT,
            message         TEXT,
            read            BOOLEAN      DEFAULT FALSE,
            is_read         BOOLEAN      DEFAULT FALSE,
            data            JSONB        DEFAULT '{}',
            created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
        );
    END IF;

    -- Add columns if missing (table may pre-exist with different schema)
    ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS institution_id UUID;
    ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS user_id UUID;
    ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id);
    ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS type TEXT;
    ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS title TEXT;
    ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS message TEXT;
    ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT FALSE;
    ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;
    ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}';
    ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
END $$;

CREATE INDEX IF NOT EXISTS idx_notifications_institution
    ON public.notifications(institution_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user
    ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_order
    ON public.notifications(order_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at
    ON public.notifications(created_at DESC);

-- -----------------------------------------------------------------------------
-- 4. Realtime publication: ensure order_items is also in the realtime publication
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
END $$;
