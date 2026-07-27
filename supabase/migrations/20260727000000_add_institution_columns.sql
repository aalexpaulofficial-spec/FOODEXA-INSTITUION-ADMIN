-- =============================================================================
-- Migration: Add missing columns to public.institutions
-- Date: 2026-07-27
-- Purpose: Align institutions table with Institution Registration form and
--          Institution Dashboard requirements. Adds all columns needed for
--          the FOODEXA approval workflow without removing existing data.
-- =============================================================================

-- 1. Location & contact fields
ALTER TABLE public.institutions ADD COLUMN IF NOT EXISTS campus text;
ALTER TABLE public.institutions ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.institutions ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE public.institutions ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE public.institutions ADD COLUMN IF NOT EXISTS contact_person text;

-- 2. Institution profile fields
ALTER TABLE public.institutions ADD COLUMN IF NOT EXISTS institution_email text;
ALTER TABLE public.institutions ADD COLUMN IF NOT EXISTS role text;
ALTER TABLE public.institutions ADD COLUMN IF NOT EXISTS institution_website text;
ALTER TABLE public.institutions ADD COLUMN IF NOT EXISTS student_population integer;
ALTER TABLE public.institutions ADD COLUMN IF NOT EXISTS food_courts integer;
ALTER TABLE public.institutions ADD COLUMN IF NOT EXISTS vendors integer;
ALTER TABLE public.institutions ADD COLUMN IF NOT EXISTS message text;

-- 3. Approval workflow fields
ALTER TABLE public.institutions ADD COLUMN IF NOT EXISTS generated_email text;
ALTER TABLE public.institutions ADD COLUMN IF NOT EXISTS generated_password text;
ALTER TABLE public.institutions ADD COLUMN IF NOT EXISTS approved_by uuid;
ALTER TABLE public.institutions ADD COLUMN IF NOT EXISTS approved_at timestamptz;

-- 4. Dashboard & analytics fields
ALTER TABLE public.institutions ADD COLUMN IF NOT EXISTS plan text DEFAULT 'Basic';
ALTER TABLE public.institutions ADD COLUMN IF NOT EXISTS joined_date date;
ALTER TABLE public.institutions ADD COLUMN IF NOT EXISTS students_count integer DEFAULT 0;
ALTER TABLE public.institutions ADD COLUMN IF NOT EXISTS daily_orders_count integer DEFAULT 0;
ALTER TABLE public.institutions ADD COLUMN IF NOT EXISTS monthly_revenue numeric DEFAULT 0;
ALTER TABLE public.institutions ADD COLUMN IF NOT EXISTS last_login timestamptz;
ALTER TABLE public.institutions ADD COLUMN IF NOT EXISTS type text;

-- =============================================================================
-- Migrate existing data from institution_requests where possible
-- =============================================================================
UPDATE public.institutions i
SET
  campus           = COALESCE(i.campus,       r.campus),
  city             = COALESCE(i.city,         r.city),
  state            = COALESCE(i.state,        r.state),
  country          = COALESCE(i.country,      r.country),
  contact_person   = COALESCE(i.contact_person, r.contact_person),
  institution_email= COALESCE(i.institution_email, r.institution_email),
  role             = COALESCE(i.role,         r.role),
  institution_website = COALESCE(i.institution_website, r.institution_website),
  student_population  = COALESCE(i.student_population, NULLIF(r.student_population, '')::int),
  food_courts      = COALESCE(i.food_courts,  NULLIF(r.food_courts_count, '')::int),
  vendors          = COALESCE(i.vendors,      NULLIF(r.vendors_count, '')::int),
  message          = COALESCE(i.message,      r.message),
  institution_code = COALESCE(i.institution_code, r.institution_code),
  generated_email  = COALESCE(i.generated_email, r.generated_email),
  generated_password = COALESCE(i.generated_password, r.generated_password),
  approved_by      = COALESCE(i.approved_by,  r.approved_by),
  approved_at      = COALESCE(i.approved_at,  r.approved_at)
FROM public.institution_requests r
WHERE r.institution_code = i.institution_code
  AND r.institution_code IS NOT NULL;

-- =============================================================================
-- Indexes for performance
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_institutions_institution_code ON public.institutions (institution_code);
CREATE INDEX IF NOT EXISTS idx_institutions_status ON public.institutions (status);
CREATE INDEX IF NOT EXISTS idx_institutions_city ON public.institutions (city);
CREATE INDEX IF NOT EXISTS idx_institutions_state ON public.institutions (state);
CREATE INDEX IF NOT EXISTS idx_institutions_country ON public.institutions (country);
