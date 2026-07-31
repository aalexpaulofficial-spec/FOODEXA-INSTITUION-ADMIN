-- =============================================================================
-- Migration: Enable REPLICA IDENTITY FULL for orders
-- =============================================================================

-- This is required so Supabase Realtime always gets all columns during UPDATEs.
-- Without this, unchanged columns like student_id and institution_id are dropped
-- from the WAL, causing Realtime filters to fail.
ALTER TABLE public.orders REPLICA IDENTITY FULL;
