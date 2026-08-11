import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim().replace(/\/$/, '');
const supabaseServiceRoleKey = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  ''
).trim();

async function test(email) {
  const url = `${supabaseUrl}/auth/v1/admin/users?filter=${encodeURIComponent(`email:eq:${email}`)}&page=1&per_page=1`;
  console.log("URL:", url);
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${supabaseServiceRoleKey}`,
      apikey: supabaseServiceRoleKey,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    console.error("HTTP Error", response.status, await response.text());
    return;
  }
  const body = await response.json();
  console.log(JSON.stringify(body, null, 2));
}

test('aalexpaulofficial@gmail.com');
