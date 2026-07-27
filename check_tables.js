import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://oxsbkwcmpsadbcceaalc.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94c2Jrd2NtcHNhZGJjY2VhYWxjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDAyMDI2OSwiZXhwIjoyMDk5NTk2MjY5fQ.j_zU0z340JjK4jNAKTgD31Ex8ryPEoXipZiEhZVt0co'
);

async function check() {
  const { data, error } = await supabase.from('institution_requests').select('*').limit(5);
  console.log('institution_requests:', { data, error });
  const { data: inst, error: errInst } = await supabase.from('institutions').select('*').limit(1);
  console.log('institutions:', { data: inst, error: errInst });
}
check();
