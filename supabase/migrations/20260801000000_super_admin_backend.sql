-- =============================================================================
-- Migration: Secure Super Admin Backend Support
-- Date: 2026-08-01
-- Purpose:
--   1. Create admin_search() RPC for global search across institutions,
--      institution_requests, and profiles using PostgreSQL ILIKE queries.
--   2. Ensure audit_logs table exists for secure server-side audit logging.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. audit_logs table (if it does not exist)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID,
    user_name   TEXT,
    action      TEXT         NOT NULL,
    target      TEXT,
    target_id   UUID,
    details     TEXT,
    ip_address  TEXT,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);

-- -----------------------------------------------------------------------------
-- 2. admin_search(text) RPC — PostgreSQL full search used by the secure backend
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_search(p_pattern TEXT)
RETURNS TABLE (
    type     TEXT,
    id       UUID,
    name     TEXT,
    subtitle TEXT,
    status   TEXT
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
    RETURN QUERY
    SELECT 'institution'::TEXT AS type,
           i.id::UUID AS id,
           i.name AS name,
           COALESCE(i.institution_code, 'N/A') || ' • ' || COALESCE(i.email, 'N/A') AS subtitle,
           i.status AS status
    FROM public.institutions i
    WHERE i.name ILIKE p_pattern
       OR i.institution_code ILIKE p_pattern
       OR i.email ILIKE p_pattern
       OR i.contact_person ILIKE p_pattern
       OR i.phone ILIKE p_pattern
    ORDER BY i.created_at DESC
    LIMIT 20;

    RETURN QUERY
    SELECT 'request'::TEXT AS type,
           r.id::UUID AS id,
           r.institution_name AS name,
           COALESCE(r.institution_email, 'N/A') || ' • ' || COALESCE(r.status, 'N/A') AS subtitle,
           r.status AS status
    FROM public.institution_requests r
    WHERE r.institution_name ILIKE p_pattern
       OR r.institution_email ILIKE p_pattern
       OR r.institution_code ILIKE p_pattern
       OR r.contact_person ILIKE p_pattern
       OR r.phone_number ILIKE p_pattern
    ORDER BY r.created_at DESC
    LIMIT 20;

    RETURN QUERY
    SELECT CASE WHEN p.role = 'student' THEN 'student' ELSE 'institution' END::TEXT AS type,
           p.user_id::UUID AS id,
           COALESCE(p.full_name, p.email) AS name,
           COALESCE(p.email, 'N/A') || ' • ' || COALESCE(p.role, 'member') AS subtitle,
           COALESCE(p.role, 'member') AS status
    FROM public.profiles p
    WHERE p.full_name ILIKE p_pattern
       OR p.email ILIKE p_pattern
    ORDER BY p.created_at DESC
    LIMIT 20;
END;
$$;

-- Grant execution to authenticated (super admin is verified inside edge functions)
GRANT EXECUTE ON FUNCTION public.admin_search(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_search(TEXT) TO anon;
