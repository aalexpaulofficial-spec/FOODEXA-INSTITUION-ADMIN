import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string || '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string || '').trim();

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const supabaseServiceKey = (import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string || '').trim();

if (!supabaseServiceKey) {
  console.warn('[Supabase] VITE_SUPABASE_SERVICE_ROLE_KEY is not set. Super admin operations may be unavailable.');
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);
