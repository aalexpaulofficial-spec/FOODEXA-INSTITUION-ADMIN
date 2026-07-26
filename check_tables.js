import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://oxsbkwcmpsadbcceaalc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94c2Jrd2NtcHNhZGJjY2VhYWxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwMjAyNjksImV4cCI6MjA5OTU5NjI2OX0.eJElI9vUOxX8bagwC95Civmv4vtnAnTNc_Fr9iJ6gsI'
);

async function check() {
  const { data, error } = await supabase.from('user_profiles').select('*').limit(1);
  console.log('user_profiles:', { data, error });
  
  // also check if 'institutions' has user_id or something
  const { data: inst, error: errInst } = await supabase.from('institutions').select('*').limit(1);
  console.log('institutions:', { data: inst, error: errInst });
}
check();
