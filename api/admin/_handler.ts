import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim().replace(/\/$/, '');
const supabaseServiceRoleKey = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  ''
).trim();

let adminClient: any = null;

function getAdmin(): any {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new HttpError(500, 'Supabase admin environment variables are not configured.');
  }

  if (!adminClient) {
    adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return adminClient;
}

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function setCors(res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
}

function send(res: any, status: number, body: unknown) {
  setCors(res);
  return res.status(status).json(body);
}

function generatePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  const length = 14 + Math.floor(Math.random() * 3);
  let password = '';
  
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const values = new Uint32Array(length);
    crypto.getRandomValues(values);
    for (let i = 0; i < length; i++) {
      password += chars.charAt(values[i] % chars.length);
    }
  } else {
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }
  
  return password;
}

async function requireSuperAdmin(req: any): Promise<{ userId: string; userEmail: string }> {
  const authHeader = String(req.headers.authorization || '');
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) throw new HttpError(401, 'Missing authorization token.');

  const admin = getAdmin();
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) throw new HttpError(401, 'Invalid or expired session.');

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('role')
    .eq('user_id', data.user.id)
    .maybeSingle();

  if (profileError || !profile) throw new HttpError(403, 'Profile not found for user.');
  if (profile.role !== 'super_admin') {
    throw new HttpError(403, 'Forbidden: Super Admin access required.');
  }

  return {
    userId: data.user.id,
    userEmail: data.user.email || 'Super Admin',
  };
}

async function getAuthUserByEmail(email: string): Promise<{ id: string; email?: string } | null> {
  getAdmin();

  const response = await fetch(
    `${supabaseUrl}/auth/v1/admin/users?filter=${encodeURIComponent(`email:eq:${email}`)}&page=1&per_page=1`,
    {
      headers: {
        Authorization: `Bearer ${supabaseServiceRoleKey}`,
        apikey: supabaseServiceRoleKey,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new HttpError(502, `Supabase Auth API returned ${response.status}.`);
  }

  const body = await response.json();
  const user = body?.users?.[0];
  return user ? { id: user.id, email: user.email } : null;
}

async function sendCredentialsEmail(payload: {
  institution_name: string;
  institution_email: string;
  institution_code: string;
  login_email: string;
  password: string;
  contact_person?: string;
}): Promise<{ sent: boolean; error?: string }> {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return { sent: false, error: 'Email service is not configured.' };

  const portalUrl = process.env.PORTAL_URL || process.env.APP_URL || 'https://foodexa-institution-platform.vercel.app';
  const contactPerson = payload.contact_person || 'Institution Administrator';
  const html = `
    <div style="font-family:Arial,sans-serif;background:#0C0C0E;color:#CBD5E1;padding:24px">
      <h1 style="color:#F59E0B">FOODEXA Institution Approved</h1>
      <p>Dear ${contactPerson},</p>
      <p>Your institution <strong>${payload.institution_name}</strong> has been approved.</p>
      <p><strong>Institution Code:</strong> ${payload.institution_code}</p>
      <p><strong>Login Email:</strong> ${payload.login_email}</p>
      <p><strong>Temporary Password:</strong> ${payload.password}</p>
      <p><strong>Portal:</strong> <a href="${portalUrl}">${portalUrl}</a></p>
      <p>Please change your generated password after your first login.</p>
    </div>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.FROM_EMAIL || 'noreply@foodexa.com',
        to: [payload.institution_email],
        subject: `Welcome to FOODEXA - ${payload.institution_name} Institution Login Credentials`,
        html,
      }),
    });

    if (!response.ok) return { sent: false, error: `Email send failed: ${response.status}` };
    return { sent: true };
  } catch (err) {
    return { sent: false, error: err instanceof Error ? err.message : 'Email send failed.' };
  }
}

async function checkEmail(req: any, res: any) {
  await requireSuperAdmin(req);

  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!email) return send(res, 400, { error: 'Email is required.' });

  const user = await getAuthUserByEmail(email);
  return send(res, 200, { exists: !!user, user_id: user?.id || null });
}

async function approveInstitution(req: any, res: any) {
  const auth = await requireSuperAdmin(req);
  const admin = getAdmin();
  const requestId = String(req.body?.request_id || '').trim();
  const institutionCode = String(req.body?.institution_code || '').trim().toUpperCase();
  const generatedEmail = String(req.body?.generated_email || '').trim().toLowerCase();
  const generatedPassword = String(req.body?.generated_password || '').trim() || generatePassword();

  if (!requestId) return send(res, 400, { error: 'request_id is required.' });
  if (!institutionCode) return send(res, 400, { error: 'Institution code is required.' });

  const { data: request, error: requestError } = await admin
    .from('institution_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (requestError || !request) {
    return send(res, 404, { error: requestError?.message || 'Institution request not found.' });
  }

  const email = generatedEmail || request.institution_email;
  const [requestCode, institutionCodeRow] = await Promise.all([
    admin
      .from('institution_requests')
      .select('id')
      .eq('institution_code', institutionCode)
      .neq('id', requestId)
      .maybeSingle(),
    admin
      .from('institutions')
      .select('id')
      .eq('institution_code', institutionCode)
      .maybeSingle(),
  ]);

  if (requestCode.data || institutionCodeRow.data) {
    return send(res, 409, { error: `Institution code "${institutionCode}" is already in use.` });
  }

  let emailAlreadyExisted = false;
  let authUserId: string | undefined;
  const existingUser = await getAuthUserByEmail(email);
  if (existingUser?.id) {
    emailAlreadyExisted = true;
    authUserId = existingUser.id;
  }

  if (!authUserId) {
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password: generatedPassword,
      email_confirm: true,
      user_metadata: {
        role: 'institution_admin',
        institution_name: request.institution_name,
      },
    });

    if (authError || !authData.user) {
      return send(res, 500, {
        error: `Failed to create auth user: ${authError?.message || 'No user returned'}`,
      });
    }

    authUserId = authData.user.id;
  }

  const approvedAt = new Date().toISOString();
  const validPlans = ['free', 'premium', 'enterprise'];
  const requestedPlan = (request.plan || '').toLowerCase();
  const plan = validPlans.includes(requestedPlan) ? requestedPlan : 'free';

  const institutionRecord = {
    name: request.institution_name,
    institution_type: request.role || 'University',
    campus: request.campus || null,
    city: request.city || null,
    state: request.state || null,
    country: request.country || null,
    contact_person: request.contact_person || null,
    institution_email: email,
    role: request.role || null,
    institution_website: request.institution_website || null,
    student_population: parseInt(request.student_population || '0', 10) || 0,
    food_courts:
      typeof request.food_courts === 'number'
        ? request.food_courts
        : parseInt(request.food_courts_count || '0', 10) || 0,
    vendors:
      typeof request.vendors === 'number'
        ? request.vendors
        : parseInt(request.vendors_count || '0', 10) || 0,
    message: request.message || null,
    phone: request.phone_number || null,
    email,
    institution_code: institutionCode,
    generated_email: email,
    generated_password: generatedPassword,
    approved_by: auth.userId,
    approved_at: approvedAt,
    status: 'active',
    plan: plan,
  };

  const { data: institution, error: institutionError } = await admin
    .from('institutions')
    .insert(institutionRecord)
    .select('id')
    .single();

  if (institutionError || !institution?.id) {
    if (institutionError?.code === '23505') {
      return send(res, 409, { error: `Institution code "${institutionCode}" is already taken.` });
    }
    return send(res, 500, {
      error: `Failed to create institution record: ${institutionError?.message || 'Unknown error'}`,
    });
  }

  const profileRecord = {
    user_id: authUserId,
    role: 'institution_admin',
    institution_id: institution.id,
    full_name: request.contact_person || null,
    email,
  };

  const { error: profileError } = emailAlreadyExisted
    ? await admin
        .from('profiles')
        .update({
          institution_id: institution.id,
          role: 'institution_admin',
          full_name: request.contact_person || null,
          email,
        })
        .eq('user_id', authUserId)
    : await admin.from('profiles').insert(profileRecord);

  if (profileError) {
    await admin.from('institutions').delete().eq('id', institution.id);
    return send(res, 500, { error: `Failed to create user profile: ${profileError.message}` });
  }

  const { error: updateRequestError } = await admin
    .from('institution_requests')
    .update({
      status: 'approved',
      institution_code: institutionCode,
      generated_email: email,
      generated_password: generatedPassword,
      approved_at: approvedAt,
      approved_by: auth.userId,
    })
    .eq('id', requestId);

  if (updateRequestError) {
    return send(res, 500, {
      error: `Failed to mark request as approved: ${updateRequestError.message}`,
    });
  }

  await admin
    .from('notifications')
    .insert({
      institution_id: institution.id,
      user_id: authUserId,
      type: 'success',
      title: 'Institution Approved',
      message: 'Your institution has been approved.',
      read: false,
    })
    .then(() => undefined);

  await admin
    .from('audit_logs')
    .insert({
      user_id: auth.userId,
      user_name: auth.userEmail,
      action: 'Institution Approved',
      target: request.institution_name,
      target_id: requestId,
      details: `Code: ${institutionCode}`,
      ip_address: 'vercel-api',
    })
    .then(() => undefined);

  const emailResult = await sendCredentialsEmail({
    institution_name: request.institution_name,
    institution_email: email,
    institution_code: institutionCode,
    login_email: email,
    password: generatedPassword,
    contact_person: request.contact_person,
  });

  return send(res, 200, {
    success: true,
    institution_name: request.institution_name,
    institution_code: institutionCode,
    generated_email: email,
    generated_password: generatedPassword,
    approved_at: approvedAt,
    email_already_existed: emailAlreadyExisted,
    email_sent: emailResult.sent,
    email_error: emailResult.error || null,
  });
}

export default async function handler(req: any, res: any, forcedAction?: string) {
  setCors(res);

  if (req.method === 'OPTIONS') return res.status(200).json({ ok: true });
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed.' });

  try {
    const action = forcedAction || String(req.query?.action || '');
    if (action === 'check-email') return await checkEmail(req, res);
    if (action === 'approve-institution') return await approveInstitution(req, res);
    return send(res, 404, { error: 'Unknown admin action.' });
  } catch (err) {
    if (err instanceof HttpError) return send(res, err.status, { error: err.message });
    return send(res, 500, { error: err instanceof Error ? err.message : 'Admin request failed.' });
  }
}
