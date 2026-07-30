const { execSync } = require('child_process');

const requiredVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_SUPABASE_SERVICE_ROLE_KEY',
];

for (const key of requiredVars) {
  const value = process.env[key];
  if (!value) {
    console.error(`Missing ${key}. Set it in your shell before running this script.`);
    process.exitCode = 1;
    continue;
  }

  for (const env of ['production', 'preview', 'development']) {
    try {
      execSync(`npx vercel env add ${key} ${env}`, {
        input: value,
        stdio: ['pipe', 'inherit', 'inherit'],
      });
    } catch {
      console.log(`Could not add ${key} for ${env}. It may already exist.`);
    }
  }
}
