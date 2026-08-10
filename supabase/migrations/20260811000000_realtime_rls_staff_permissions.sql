-- =============================================================================
-- Migration: Realtime Publication, RLS Policies, Staff Permissions Column
-- Date: 2026-08-11
-- Purpose:
--   1. Add missing tables to the supabase_realtime publication so
--      postgres_changes filters work for menu_items, canteens,
--      menu_categories, and profiles.
--   2. Add a permissions JSONB column to profiles for staff RBAC.
--   3. Enable Row Level Security on all institution-scoped tables and
--      create policies so institution_admin can only access their own
--      institution's data, and super_admin has full access.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Realtime publication: add all institution-scoped tables
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  -- menu_items
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_items;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  -- menu_categories
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_categories;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  -- canteens
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.canteens;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  -- profiles
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  -- notifications
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- -----------------------------------------------------------------------------
-- 2. Staff permissions column
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '{}'::jsonb;

-- -----------------------------------------------------------------------------
-- 3. Row Level Security
-- -----------------------------------------------------------------------------
-- Enable RLS on institution-scoped tables. The policies assume:
--   - auth.uid() returns the Supabase auth user id
--   - A profiles row with user_id = auth.uid() exists and has institution_id
--   - super_admin profiles have institution_id = NULL

ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canteens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Helper: get the calling user's institution_id from their profiles row
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._current_user_institution_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT institution_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public._current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- ---------------------------------------------------------------------------
-- institutions
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS inst_select ON public.institutions;
CREATE POLICY inst_select ON public.institutions
  FOR SELECT USING (
    _current_user_role() = 'super_admin'
    OR id = _current_user_institution_id()
  );

DROP POLICY IF EXISTS inst_update ON public.institutions;
CREATE POLICY inst_update ON public.institutions
  FOR UPDATE USING (
    _current_user_role() = 'super_admin'
    OR id = _current_user_institution_id()
  );

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS prof_select ON public.profiles;
CREATE POLICY prof_select ON public.profiles
  FOR SELECT USING (
    _current_user_role() = 'super_admin'
    OR institution_id = _current_user_institution_id()
    OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS prof_insert ON public.profiles;
CREATE POLICY prof_insert ON public.profiles
  FOR INSERT WITH CHECK (
    _current_user_role() = 'super_admin'
    OR institution_id = _current_user_institution_id()
  );

DROP POLICY IF EXISTS prof_update ON public.profiles;
CREATE POLICY prof_update ON public.profiles
  FOR UPDATE USING (
    _current_user_role() = 'super_admin'
    OR institution_id = _current_user_institution_id()
    OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS prof_delete ON public.profiles;
CREATE POLICY prof_delete ON public.profiles
  FOR DELETE USING (
    _current_user_role() = 'super_admin'
    OR institution_id = _current_user_institution_id()
  );

-- ---------------------------------------------------------------------------
-- canteens
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS cant_select ON public.canteens;
CREATE POLICY cant_select ON public.canteens
  FOR SELECT USING (
    _current_user_role() = 'super_admin'
    OR institution_id = _current_user_institution_id()
  );

DROP POLICY IF EXISTS cant_insert ON public.canteens;
CREATE POLICY cant_insert ON public.canteens
  FOR INSERT WITH CHECK (
    _current_user_role() = 'super_admin'
    OR institution_id = _current_user_institution_id()
  );

DROP POLICY IF EXISTS cant_update ON public.canteens;
CREATE POLICY cant_update ON public.canteens
  FOR UPDATE USING (
    _current_user_role() = 'super_admin'
    OR institution_id = _current_user_institution_id()
  );

DROP POLICY IF EXISTS cant_delete ON public.canteens;
CREATE POLICY cant_delete ON public.canteens
  FOR DELETE USING (
    _current_user_role() = 'super_admin'
    OR institution_id = _current_user_institution_id()
  );

-- ---------------------------------------------------------------------------
-- menu_items
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS mi_select ON public.menu_items;
CREATE POLICY mi_select ON public.menu_items
  FOR SELECT USING (
    _current_user_role() = 'super_admin'
    OR institution_id = _current_user_institution_id()
  );

DROP POLICY IF EXISTS mi_insert ON public.menu_items;
CREATE POLICY mi_insert ON public.menu_items
  FOR INSERT WITH CHECK (
    _current_user_role() = 'super_admin'
    OR institution_id = _current_user_institution_id()
  );

DROP POLICY IF EXISTS mi_update ON public.menu_items;
CREATE POLICY mi_update ON public.menu_items
  FOR UPDATE USING (
    _current_user_role() = 'super_admin'
    OR institution_id = _current_user_institution_id()
  );

DROP POLICY IF EXISTS mi_delete ON public.menu_items;
CREATE POLICY mi_delete ON public.menu_items
  FOR DELETE USING (
    _current_user_role() = 'super_admin'
    OR institution_id = _current_user_institution_id()
  );

-- ---------------------------------------------------------------------------
-- menu_categories
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS mc_select ON public.menu_categories;
CREATE POLICY mc_select ON public.menu_categories
  FOR SELECT USING (
    _current_user_role() = 'super_admin'
    OR institution_id = _current_user_institution_id()
  );

DROP POLICY IF EXISTS mc_insert ON public.menu_categories;
CREATE POLICY mc_insert ON public.menu_categories
  FOR INSERT WITH CHECK (
    _current_user_role() = 'super_admin'
    OR institution_id = _current_user_institution_id()
  );

DROP POLICY IF EXISTS mc_update ON public.menu_categories;
CREATE POLICY mc_update ON public.menu_categories
  FOR UPDATE USING (
    _current_user_role() = 'super_admin'
    OR institution_id = _current_user_institution_id()
  );

DROP POLICY IF EXISTS mc_delete ON public.menu_categories;
CREATE POLICY mc_delete ON public.menu_categories
  FOR DELETE USING (
    _current_user_role() = 'super_admin'
    OR institution_id = _current_user_institution_id()
  );

-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS ord_select ON public.orders;
CREATE POLICY ord_select ON public.orders
  FOR SELECT USING (
    _current_user_role() = 'super_admin'
    OR institution_id = _current_user_institution_id()
  );

DROP POLICY IF EXISTS ord_insert ON public.orders;
CREATE POLICY ord_insert ON public.orders
  FOR INSERT WITH CHECK (
    _current_user_role() = 'super_admin'
    OR institution_id = _current_user_institution_id()
  );

DROP POLICY IF EXISTS ord_update ON public.orders;
CREATE POLICY ord_update ON public.orders
  FOR UPDATE USING (
    _current_user_role() = 'super_admin'
    OR institution_id = _current_user_institution_id()
  );

DROP POLICY IF EXISTS ord_delete ON public.orders;
CREATE POLICY ord_delete ON public.orders
  FOR DELETE USING (
    _current_user_role() = 'super_admin'
    OR institution_id = _current_user_institution_id()
  );

-- ---------------------------------------------------------------------------
-- order_items
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS oi_select ON public.order_items;
CREATE POLICY oi_select ON public.order_items
  FOR SELECT USING (
    _current_user_role() = 'super_admin'
    OR institution_id = _current_user_institution_id()
  );

DROP POLICY IF EXISTS oi_insert ON public.order_items;
CREATE POLICY oi_insert ON public.order_items
  FOR INSERT WITH CHECK (
    _current_user_role() = 'super_admin'
    OR institution_id = _current_user_institution_id()
  );

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS notif_select ON public.notifications;
CREATE POLICY notif_select ON public.notifications
  FOR SELECT USING (
    _current_user_role() = 'super_admin'
    OR institution_id = _current_user_institution_id()
    OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS notif_insert ON public.notifications;
CREATE POLICY notif_insert ON public.notifications
  FOR INSERT WITH CHECK (
    _current_user_role() = 'super_admin'
    OR institution_id = _current_user_institution_id()
  );

DROP POLICY IF EXISTS notif_update ON public.notifications;
CREATE POLICY notif_update ON public.notifications
  FOR UPDATE USING (
    _current_user_role() = 'super_admin'
    OR institution_id = _current_user_institution_id()
    OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS notif_delete ON public.notifications;
CREATE POLICY notif_delete ON public.notifications
  FOR DELETE USING (
    _current_user_role() = 'super_admin'
    OR institution_id = _current_user_institution_id()
  );

-- ---------------------------------------------------------------------------
-- audit_logs
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS al_select ON public.audit_logs;
CREATE POLICY al_select ON public.audit_logs
  FOR SELECT USING (
    _current_user_role() = 'super_admin'
    OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS al_insert ON public.audit_logs;
CREATE POLICY al_insert ON public.audit_logs
  FOR INSERT WITH CHECK (
    _current_user_role() = 'super_admin'
    OR user_id = auth.uid()
  );
