import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string || '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string || '').trim();

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set.');
}

export const supabase = createClient(
  supabaseUrl || 'https://oxsbkwcmpsadbcceaalc.supabase.co',
  supabaseAnonKey ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
    'eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94c2Jrd2NtcHNhZGJjY2VhYWxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwMjAyNjksImV4cCI6MjA5OTU5NjI2OX0.' +
    'eJElI9vUOxX8bagwC95Civmv4vtnAnTNc_Fr9iJ6gsI'
);

const supabaseServiceKey = (import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string || '').trim();

export const supabaseAdmin = createClient(
  supabaseUrl || 'https://oxsbkwcmpsadbcceaalc.supabase.co',
  supabaseServiceKey ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
    'eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94c2Jrd2NtcHNhZGJjY2VhYWxjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDAyMDI2OSwiZXhwIjoyMDk5NTk2MjY5fQ.' +
    'j_zU0z340JjK4jNAKTgD31Ex8ryPEoXipZiEhZVt0co'
);
