const { execSync } = require('child_process');
const vars = {
  VITE_SUPABASE_URL: 'https://oxsbkwcmpsadbcceaalc.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94c2Jrd2NtcHNhZGJjY2VhYWxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwMjAyNjksImV4cCI6MjA5OTU5NjI2OX0.eJElI9vUOxX8bagwC95Civmv4vtnAnTNc_Fr9iJ6gsI',
  VITE_SUPABASE_SERVICE_ROLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94c2Jrd2NtcHNhZGJjY2VhYWxjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDAyMDI2OSwiZXhwIjoyMDk5NTk2MjY5fQ.j_zU0z340JjK4jNAKTgD31Ex8ryPEoXipZiEhZVt0co'
};

for (const [key, val] of Object.entries(vars)) {
  for (const env of ['production', 'preview', 'development']) {
    try {
      execSync('npx vercel env add ' + key + ' ' + env, { input: val, stdio: ['pipe', 'inherit', 'inherit'] });
    } catch (e) {
      console.log('Error adding', key, env);
    }
  }
}
