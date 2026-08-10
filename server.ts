import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl) {
  console.error('[Server] SUPABASE_URL is not set.');
  process.exit(1);
}

if (!supabaseServiceRoleKey) {
  console.error('[Server] SUPABASE_SERVICE_ROLE_KEY is not set. Admin API routes will not work.');
}

const serverSupabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  };
}

function jsonRes(data: unknown, status = 200) {
  return { status, body: JSON.stringify(data), headers: { ...corsHeaders(), 'Content-Type': 'application/json' } };
}

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'HttpError';
  }
}

async function requireSuperAdmin(req: express.Request): Promise<{ userId: string; userEmail: string }> {
  const authHeader = (req.headers.authorization || '') as string;
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    throw new HttpError(401, 'Missing authorization token.');
  }
  try {
    const { data, error } = await serverSupabase.auth.getUser(token);
    if (error || !data?.user) {
      throw new HttpError(401, 'Invalid or expired session.');
    }
    const user = data.user;
    const { data: profile, error: profileErr } = await serverSupabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();
    if (profileErr || !profile) {
      throw new HttpError(403, 'Profile not found for user.');
    }
    if (profile.role !== 'super_admin') {
      throw new HttpError(403, 'Forbidden: Super Admin access required.');
    }
    return { userId: user.id, userEmail: user.email || 'Super Admin' };
  } catch (err: any) {
    if (err instanceof HttpError) throw err;
    throw new HttpError(500, err?.message || 'Authentication failed.');
  }
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

async function getAuthUserByEmail(email: string): Promise<{ user: { id: string; email?: string } | null; error?: string }> {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    let page = 1;
    const perPage = 100;
    while (true) {
      const { data, error } = await serverSupabase.auth.admin.listUsers({ page, perPage });
      if (error || !data?.users || data.users.length === 0) break;

      const found = data.users.find(
        (u: any) => typeof u.email === 'string' && u.email.toLowerCase() === normalizedEmail
      );
      if (found) return { user: { id: found.id, email: found.email } };

      if (data.users.length < perPage) break;
      page++;
    }
    return { user: null };
  } catch (err: any) {
    return { user: null, error: err?.message || 'Error fetching auth user' };
  }
}

async function sendCredentialsEmail(payload: {
  institution_name: string;
  institution_email: string;
  institution_code: string;
  login_email: string;
  password: string;
  portal_url: string;
  contact_person?: string;
  first_login_instructions?: string;
  password_change_reminder?: string;
}): Promise<{ sent: boolean; error?: string }> {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@foodexa.com';

  if (!RESEND_API_KEY) {
    return { sent: false, error: 'Email service not configured. Set RESEND_API_KEY in server environment.' };
  }

  const contactPerson = payload.contact_person || 'Institution Administrator';
  const firstLogin = payload.first_login_instructions || 'Please log in using the credentials above. You will be prompted to change your password on first login.';
  const passwordReminder = payload.password_change_reminder || 'For security, please change your generated password after your first login.';

  const htmlContent = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background-color:#0C0C0E;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0C0C0E;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#111114;border:1px solid #1E1E24;border-radius:16px;overflow:hidden;">
<tr><td style="background:linear-gradient(135deg,#F59E0B,#D97706);padding:32px 40px;text-align:center;">
<h1 style="color:#0C0C0E;font-size:24px;font-weight:900;margin:0;letter-spacing:-0.5px;">FOODEXA</h1>
<p style="color:#0C0C0ECC;font-size:12px;font-weight:600;margin:4px 0 0;letter-spacing:2px;text-transform:uppercase;">Institution Portal Access</p>
</td></tr>
<tr><td style="padding:40px;">
<p style="color:#94A3B8;font-size:14px;margin:0 0 8px;">Dear ${contactPerson},</p>
<p style="color:#CBD5E1;font-size:14px;line-height:1.7;margin:0 0 24px;">Your institution <strong style="color:#F59E0B;">${payload.institution_name}</strong> has been approved on the FOODEXA platform. Below are your login credentials:</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0C0C0E;border:1px solid #1E1E24;border-radius:12px;margin:0 0 24px;">
<tr><td style="padding:20px 24px;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="padding:8px 0;"><span style="color:#64748B;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Institution Code</span><br/><span style="color:#F59E0B;font-size:16px;font-weight:900;font-family:monospace;">${payload.institution_code}</span></td></tr>
<tr><td style="padding:8px 0;border-top:1px solid #1E1E24;"><span style="color:#64748B;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Login Email</span><br/><span style="color:#FFFFFF;font-size:14px;font-family:monospace;">${payload.login_email || payload.institution_email}</span></td></tr>
<tr><td style="padding:8px 0;border-top:1px solid #1E1E24;"><span style="color:#64748B;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Generated Password</span><br/><span style="color:#818CF8;font-size:14px;font-weight:700;font-family:monospace;">${payload.password}</span></td></tr>
<tr><td style="padding:8px 0;border-top:1px solid #1E1E24;"><span style="color:#64748B;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Portal URL</span><br/><a href="${payload.portal_url}" style="color:#818CF8;font-size:14px;text-decoration:none;">${payload.portal_url}</a></td></tr>
</table></td></tr>
</table>
<p style="color:#CBD5E1;font-size:13px;line-height:1.7;margin:0 0 16px;">${firstLogin}</p>
<p style="color:#F59E0B;font-size:13px;font-weight:600;margin:0 0 24px;">${passwordReminder}</p>
<table width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid #1E1E24;padding-top:24px;">
<p style="color:#475569;font-size:11px;margin:0;">This is an automated message from FOODEXA Institution Management Platform.<br/>If you did not expect this email, please contact your system administrator.</p>
</td></tr></table>
</td></tr></table>
</td></tr></table>
</body>
</html>`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM_EMAIL, to: [payload.institution_email], subject: `Welcome to FOODEXA - ${payload.institution_name} Institution Login Credentials`, html: htmlContent }),
    });
    if (!response.ok) {
      const body = await response.text();
      console.error('[sendCredentialsEmail] Resend API error:', response.status, body);
      return { sent: false, error: `Email send failed: ${response.status}` };
    }
    return { sent: true };
  } catch (err: any) {
    console.error('[sendCredentialsEmail] Error:', err);
    return { sent: false, error: err?.message || 'Email send failed' };
  }
}

async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }): Promise<{ sent: boolean; error?: string }> {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@foodexa.com';

  if (!RESEND_API_KEY) {
    return { sent: false, error: 'Email service not configured. Set RESEND_API_KEY in server environment.' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
    });
    if (!response.ok) {
      const body = await response.text();
      console.error('[sendEmail] Resend API error:', response.status, body);
      return { sent: false, error: `Email send failed: ${response.status}` };
    }
    return { sent: true };
  } catch (err: any) {
    console.error('[sendEmail] Error:', err);
    return { sent: false, error: err?.message || 'Email send failed' };
  }
}

async function sendRejectionEmail(payload: {
  institution_name: string;
  institution_email: string;
  contact_person?: string;
  reason: string;
}) {
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background-color:#0C0C0E;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0C0C0E;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#111114;border:1px solid #1E1E24;border-radius:16px;overflow:hidden;">
<tr><td style="background:linear-gradient(135deg,#EF4444,#B91C1C);padding:32px 40px;text-align:center;">
<h1 style="color:#FFFFFF;font-size:24px;font-weight:900;margin:0;letter-spacing:-0.5px;">FOODEXA</h1>
<p style="color:#FECACA;font-size:12px;font-weight:600;margin:4px 0 0;letter-spacing:2px;text-transform:uppercase;">Institution Application Update</p>
</td></tr>
<tr><td style="padding:40px;">
<p style="color:#94A3B8;font-size:14px;margin:0 0 8px;">Dear ${payload.contact_person || 'Institution Administrator'},</p>
<p style="color:#CBD5E1;font-size:14px;line-height:1.7;margin:0 0 24px;">
  We are sorry to inform you that your application for <strong style="color:#F87171;">${payload.institution_name}</strong> has been <strong style="color:#F87171;">rejected</strong>.
</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0C0C0E;border:1px solid #1E1E24;border-radius:12px;margin:0 0 24px;">
<tr><td style="padding:20px 24px;">
<span style="color:#64748B;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Reason</span><br/>
<span style="color:#F87171;font-size:14px;font-weight:600;">${payload.reason}</span>
</td></tr>
</table>
<p style="color:#CBD5E1;font-size:13px;line-height:1.7;margin:0 0 16px;">If you believe this is an error, please contact our support team for assistance.</p>
<table width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid #1E1E24;padding-top:24px;">
<p style="color:#475569;font-size:11px;margin:0;">This is an automated message from FOODEXA Institution Management Platform.<br/>For support, contact support@foodexa.com</p>
</td></tr></table>
</td></tr></table>
</td></tr></table>
</body>
</html>`;
  return sendEmail({
    to: payload.institution_email,
    subject: `FOODEXA - ${payload.institution_name} Application Status`,
    html,
  });
}

async function sendChangesRequestedEmail(payload: {
  institution_name: string;
  institution_email: string;
  contact_person?: string;
  notes: string;
}) {
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background-color:#0C0C0E;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0C0C0E;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#111114;border:1px solid #1E1E24;border-radius:16px;overflow:hidden;">
<tr><td style="background:linear-gradient(135deg,#3B82F6,#1D4ED8);padding:32px 40px;text-align:center;">
<h1 style="color:#FFFFFF;font-size:24px;font-weight:900;margin:0;letter-spacing:-0.5px;">FOODEXA</h1>
<p style="color:#BFDBFE;font-size:12px;font-weight:600;margin:4px 0 0;letter-spacing:2px;text-transform:uppercase;">Institution Application Update</p>
</td></tr>
<tr><td style="padding:40px;">
<p style="color:#94A3B8;font-size:14px;margin:0 0 8px;">Dear ${payload.contact_person || 'Institution Administrator'},</p>
<p style="color:#CBD5E1;font-size:14px;line-height:1.7;margin:0 0 24px;">
  Changes have been requested for your institution <strong style="color:#60A5FA;">${payload.institution_name}</strong>. Please update your application and resubmit.
</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0C0C0E;border:1px solid #1E1E24;border-radius:12px;margin:0 0 24px;">
<tr><td style="padding:20px 24px;">
<span style="color:#64748B;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Requested Changes</span><br/>
<span style="color:#60A5FA;font-size:14px;font-weight:600;">${payload.notes}</span>
</td></tr>
</table>
<table width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid #1E1E24;padding-top:24px;">
<p style="color:#475569;font-size:11px;margin:0;">This is an automated message from FOODEXA Institution Management Platform.<br/>For support, contact support@foodexa.com</p>
</td></tr></table>
</td></tr></table>
</td></tr></table>
</body>
</html>`;
  return sendEmail({
    to: payload.institution_email,
    subject: `FOODEXA - ${payload.institution_name} Changes Requested`,
    html,
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      if (req.method === 'OPTIONS') {
        return res.status(200).json({ ok: true });
      }
    }
    next();
  });

  const getAi = () => {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error('GEMINI_API_KEY is not configured');
    return new GoogleGenAI({ apiKey: key, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
  };

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'FOODEXA Institution API' });
  });

  app.post('/api/ai/generate', async (req, res) => {
    try {
      const { feature, prompt, context } = req.body;
      const ai = getAi();
      const systemPrompt = `You are FOODEXA AI, the intelligence powering the official FOODEXA Institution Platform for higher education campuses and canteens. You provide clear, action-oriented, professional insights based on Google Gemini models. Feature requested: ${feature || 'General Assistant'} Current Context: ${JSON.stringify(context || {})} Format your output cleanly in structured Markdown with concise bullet points and direct operational recommendations.`;
      const response = await ai.models.generateContent({ model: 'gemini-3.6-flash', contents: `${systemPrompt}\n\nUser Request: ${prompt}` });
      res.json({ success: true, text: response.text || 'Analysis completed successfully.' });
    } catch (error: any) {
      console.error('Gemini API error:', error);
      res.status(500).json({ success: false, error: error?.message || 'Failed to generate AI response.' });
    }
  });

  // POST /api/admin/check-email
  app.post('/api/admin/check-email', async (req, res) => {
    try {
      const auth = await requireSuperAdmin(req);

      const email = (req.body?.email || '').trim().toLowerCase();
      if (!email) return res.status(400).json(jsonRes({ error: 'Email is required.' }, 400));

      const { user: existingUser } = await getAuthUserByEmail(email);
      res.json(jsonRes({ exists: !!existingUser, user_id: existingUser?.id || null }));
    } catch (err: any) {
      if (err instanceof HttpError) return res.status(err.status).json(jsonRes({ error: err.message }, err.status));
      console.error('[check-email] Error:', err);
      res.status(500).json(jsonRes({ error: err?.message || 'Failed to check email.' }, 500));
    }
  });

  // POST /api/admin/approve-institution
  app.post('/api/admin/approve-institution', async (req, res) => {
    const startTime = Date.now();
    try {
      const auth = await requireSuperAdmin(req);

      const body = req.body || {};
      const requestId = (body.request_id || '').trim();
      let institutionCode = (body.institution_code || '').trim().toUpperCase();
      const generatedEmail = (body.generated_email || '').trim().toLowerCase();
      const generatedPassword = (body.generated_password || '').trim() || generatePassword();

      if (!requestId) return res.status(400).json(jsonRes({ error: 'request_id is required.' }, 400));
      if (!institutionCode) return res.status(400).json(jsonRes({ error: 'Institution code is required.' }, 400));

      const { data: request, error: reqErr } = await serverSupabase
        .from('institution_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (reqErr || !request) {
        return res.status(404).json(jsonRes({ error: reqErr?.message || 'Institution request not found.' }, 404));
      }

      const email = generatedEmail || request.institution_email;

      const [reqCode, instCode] = await Promise.all([
        serverSupabase.from('institution_requests').select('id').eq('institution_code', institutionCode).neq('id', requestId).limit(1).maybeSingle(),
        serverSupabase.from('institutions').select('id').eq('institution_code', institutionCode).limit(1).maybeSingle(),
      ]);

      if (reqCode.data || instCode.data) {
        return res.status(409).json(jsonRes({ error: `Institution code "${institutionCode}" is already in use.` }, 409));
      }

      let emailAlreadyExisted = false;
      let authUserId: string | undefined;
      const { user: existingUser } = await getAuthUserByEmail(email);
      if (existingUser?.id) {
        emailAlreadyExisted = true;
        authUserId = existingUser.id;
      }

      if (!authUserId) {
        const { data: authData, error: authError } = await serverSupabase.auth.admin.createUser({
          email, password: generatedPassword, email_confirm: true,
          user_metadata: { role: 'institution_admin', institution_name: request.institution_name },
        });
        if (authError) {
          const alreadyExists =
            authError.message?.includes('already been registered') ||
            authError.message?.includes('already exists') ||
            authError.message?.includes('duplicate');

          if (alreadyExists) {
            const { user: retryUser } = await getAuthUserByEmail(email);
            if (retryUser?.id) {
              emailAlreadyExisted = true;
              authUserId = retryUser.id;
            } else {
              return res.status(409).json(jsonRes({ error: 'This email is already associated with another account but could not be resolved.' }, 409));
            }
          } else {
            return res.status(500).json(jsonRes({ error: `Failed to create auth user: ${authError.message || 'No user returned'}` }, 500));
          }
        } else if (authData?.user) {
          authUserId = authData.user.id;
        } else {
          return res.status(500).json(jsonRes({ error: 'Failed to create auth user: No user returned.' }, 500));
        }
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
        food_courts: typeof request.food_courts === 'number' ? request.food_courts : parseInt(request.food_courts_count || '0', 10) || 0,
        vendors: typeof request.vendors === 'number' ? request.vendors : parseInt(request.vendors_count || '0', 10) || 0,
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

      const { data: instData, error: instErr } = await serverSupabase
        .from('institutions')
        .insert(institutionRecord)
        .select('id')
        .single();

      if (instErr || !instData?.id) {
        if (instErr?.code === '23505') {
          return res.status(409).json(jsonRes({ error: `Institution code "${institutionCode}" is already taken.` }, 409));
        }
        return res.status(500).json(jsonRes({ error: `Failed to create institution record: ${instErr?.message || 'Unknown error'}` }, 500));
      }

      const profileRecord = {
        id: authUserId,
        user_id: authUserId,
        role: 'institution_admin',
        institution_id: instData.id,
        full_name: request.contact_person || null,
        email,
      };

      const { error: profileErr } = await serverSupabase
        .from('profiles')
        .upsert(profileRecord, { onConflict: 'id' });

      if (profileErr) {
        console.error('[approve] Profile upsert failed:', profileErr);
      }

      const { error: updateReqError } = await serverSupabase
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

      if (updateReqError) {
        console.error('[approve] Update request failed:', updateReqError);
        return res.status(500).json(jsonRes({ error: `Failed to mark request as approved: ${updateReqError.message}` }, 500));
      }

      try {
        await serverSupabase.from('notifications').insert({
          institution_id: instData.id, user_id: authUserId,
          type: 'success', title: 'Institution Approved',
          message: 'Your institution has been approved.', read: false,
        });
      } catch (err) {
        console.error('[approve] Notification insert failed:', err);
      }

      try {
        await serverSupabase.from('audit_logs').insert({
          user_id: auth.userId, user_name: auth.userEmail,
          action: 'Institution Approved', target: request.institution_name,
          target_id: requestId, details: `Code: ${institutionCode}`, ip_address: 'server-api',
        });
      } catch (err) {
        console.error('[approve] Audit log insert failed:', err);
      }

      const emailResult = await sendCredentialsEmail({
        institution_name: request.institution_name,
        institution_email: email,
        institution_code: institutionCode,
        login_email: email,
        password: generatedPassword,
        portal_url: 'https://foodexa-institution-platform.vercel.app',
        contact_person: request.contact_person,
        first_login_instructions: 'Please log in using the credentials above. You will be prompted to change your password on first login.',
        password_change_reminder: 'For security, please change your generated password after your first login.',
      });

      const duration = Date.now() - startTime;
      console.log(`[approve-institution] Completed in ${duration}ms: ${request.institution_name} -> ${institutionCode}`);

      res.json(jsonRes({
        success: true,
        institution_name: request.institution_name,
        institution_code: institutionCode,
        generated_email: email,
        generated_password: generatedPassword,
        approved_at: approvedAt,
        email_already_existed: emailAlreadyExisted,
        email_sent: emailResult.sent,
        email_error: emailResult.error || null,
      }));
    } catch (err: any) {
      if (err instanceof HttpError) return res.status(err.status).json(jsonRes({ error: err.message }, err.status));
      console.error('[approve-institution] Unexpected error:', err);
      res.status(500).json(jsonRes({ error: err?.message || 'Approval failed.' }, 500));
    }
  });

  // POST /api/admin/disable-institution
  app.post('/api/admin/disable-institution', async (req, res) => {
    try {
      const auth = await requireSuperAdmin(req);

      const institutionId = (req.body?.institution_id || '').trim();
      if (!institutionId) return res.status(400).json(jsonRes({ error: 'institution_id is required.' }, 400));

      const { data: inst, error: instErr } = await serverSupabase.from('institutions').select('*').eq('id', institutionId).maybeSingle();
      if (instErr || !inst) return res.status(404).json(jsonRes({ error: instErr?.message || 'Institution not found.' }, 404));

      const { error: updateErr } = await serverSupabase.from('institutions').update({ status: 'disabled' }).eq('id', institutionId);
      if (updateErr) return res.status(500).json(jsonRes({ error: `Failed to disable institution: ${updateErr.message}` }, 500));

      if (inst.institution_code) {
        await serverSupabase.from('institution_requests').update({ status: 'disabled' }).eq('institution_code', inst.institution_code);
      }

      const { data: profile } = await serverSupabase.from('profiles').select('user_id').eq('institution_id', institutionId).maybeSingle();
      if (profile?.user_id) {
        await serverSupabase.auth.admin.updateUserById(profile.user_id, { ban_duration: '876000h' });
      }

      try {
        await serverSupabase.from('notifications').insert({ institution_id: institutionId, user_id: profile?.user_id || null, type: 'warning', title: 'Institution Disabled', message: 'Your institution has been disabled.', read: false });
      } catch (err) { console.error('[disable] notification insert failed:', err); }

      try {
        await serverSupabase.from('audit_logs').insert({ user_id: auth.userId, user_name: auth.userEmail, action: 'Institution Disabled', target: inst.name, target_id: institutionId, details: 'Disabled institution admin auth user', ip_address: 'server-api' });
      } catch (err) { console.error('[disable] audit log insert failed:', err); }

      res.json(jsonRes({ success: true, institution_id: institutionId }));
    } catch (err: any) {
      if (err instanceof HttpError) return res.status(err.status).json(jsonRes({ error: err.message }, err.status));
      console.error('[disable-institution] Error:', err);
      res.status(500).json(jsonRes({ error: err?.message || 'Failed to disable institution.' }, 500));
    }
  });

  // POST /api/admin/enable-institution
  app.post('/api/admin/enable-institution', async (req, res) => {
    try {
      const auth = await requireSuperAdmin(req);

      const institutionId = (req.body?.institution_id || '').trim();
      if (!institutionId) return res.status(400).json(jsonRes({ error: 'institution_id is required.' }, 400));

      const { data: inst, error: instErr } = await serverSupabase.from('institutions').select('*').eq('id', institutionId).maybeSingle();
      if (instErr || !inst) return res.status(404).json(jsonRes({ error: instErr?.message || 'Institution not found.' }, 404));

      const { error: updateErr } = await serverSupabase.from('institutions').update({ status: 'active' }).eq('id', institutionId);
      if (updateErr) return res.status(500).json(jsonRes({ error: `Failed to enable institution: ${updateErr.message}` }, 500));

      if (inst.institution_code) {
        await serverSupabase.from('institution_requests').update({ status: 'active' }).eq('institution_code', inst.institution_code);
      }

      const { data: profile } = await serverSupabase.from('profiles').select('user_id').eq('institution_id', institutionId).maybeSingle();
      if (profile?.user_id) {
        await serverSupabase.auth.admin.updateUserById(profile.user_id, { ban_duration: 'none' });
      }

      try {
        await serverSupabase.from('notifications').insert({ institution_id: institutionId, user_id: profile?.user_id || null, type: 'success', title: 'Institution Enabled', message: 'Your institution has been enabled.', read: false });
      } catch (err) { console.error('[enable] notification insert failed:', err); }

      try {
        await serverSupabase.from('audit_logs').insert({ user_id: auth.userId, user_name: auth.userEmail, action: 'Institution Enabled', target: inst.name, target_id: institutionId, details: 'Enabled institution admin auth user', ip_address: 'server-api' });
      } catch (err) { console.error('[enable] audit log insert failed:', err); }

      res.json(jsonRes({ success: true, institution_id: institutionId }));
    } catch (err: any) {
      if (err instanceof HttpError) return res.status(err.status).json(jsonRes({ error: err.message }, err.status));
      console.error('[enable-institution] Error:', err);
      res.status(500).json(jsonRes({ error: err?.message || 'Failed to enable institution.' }, 500));
    }
  });

  // POST /api/admin/reset-password
  app.post('/api/admin/reset-password', async (req, res) => {
    try {
      const auth = await requireSuperAdmin(req);

      const email = (req.body?.email || '').trim().toLowerCase();
      if (!email) return res.status(400).json(jsonRes({ error: 'email is required.' }, 400));

      const { user: authUser } = await getAuthUserByEmail(email);
      const authUserId = authUser?.id;
      if (!authUserId) return res.status(404).json(jsonRes({ error: `No auth user found for email "${email}".` }, 404));

      const newPassword = generatePassword();
      const { error: updateErr } = await serverSupabase.auth.admin.updateUserById(authUserId, { password: newPassword, email_confirm: true });
      if (updateErr) return res.status(500).json(jsonRes({ error: `Failed to reset password: ${updateErr.message}` }, 500));

      const institutionName = (req.body?.institution_name || '').trim();
      const institutionCode = (req.body?.institution_code || '').trim();
      const contactPerson = (req.body?.contact_person || '').trim();

      const emailResult = await sendCredentialsEmail({
        institution_name: institutionName || 'Your Institution',
        institution_email: email,
        institution_code: institutionCode || 'N/A',
        login_email: email,
        password: newPassword,
        portal_url: 'https://foodexa-institution-platform.vercel.app',
        contact_person: contactPerson,
        first_login_instructions: 'Your password has been reset. Use the temporary password below to sign in, then change it after your first login.',
        password_change_reminder: 'For security, please change your temporary password after your first login.',
      });

      try {
        await serverSupabase.from('audit_logs').insert({ user_id: auth.userId, user_name: auth.userEmail, action: 'Password Reset', target: institutionName || email, target_id: authUserId, details: `Reset password for ${email}${emailResult.sent ? '' : ' (email not sent)'}`, ip_address: 'server-api' });
      } catch (err) { console.error('[reset-password] audit log insert failed:', err); }

      res.json(jsonRes({ success: true, new_password: newPassword, email_sent: emailResult.sent, email_error: emailResult.error || null }));
    } catch (err: any) {
      if (err instanceof HttpError) return res.status(err.status).json(jsonRes({ error: err.message }, err.status));
      console.error('[reset-password] Error:', err);
      res.status(500).json(jsonRes({ error: err?.message || 'Failed to reset password.' }, 500));
    }
  });

  // POST /api/admin/resend-credentials
  app.post('/api/admin/resend-credentials', async (req, res) => {
    try {
      const auth = await requireSuperAdmin(req);

      const institutionName = (req.body?.institution_name || '').trim();
      const institutionEmail = (req.body?.institution_email || '').trim().toLowerCase();
      const institutionCode = (req.body?.institution_code || '').trim();
      const loginEmail = (req.body?.login_email || institutionEmail).trim().toLowerCase();
      const password = (req.body?.password || '').trim();
      const contactPerson = (req.body?.contact_person || '').trim();

      if (!institutionName || !institutionEmail || !institutionCode || !password) {
        return res.status(400).json(jsonRes({ error: 'institution_name, institution_email, institution_code, and password are required.' }, 400));
      }

      const emailResult = await sendCredentialsEmail({
        institution_name: institutionName, institution_email: institutionEmail,
        institution_code: institutionCode, login_email: loginEmail, password,
        portal_url: 'https://foodexa-institution-platform.vercel.app',
        contact_person: contactPerson,
        first_login_instructions: 'Please log in using the credentials above. You will be prompted to change your password on first login.',
        password_change_reminder: 'For security, please change your generated password after your first login.',
      });

      if (!emailResult.sent) {
        return res.status(502).json(jsonRes({ success: false, error: emailResult.error || 'Failed to send email.' }, 502));
      }

      try {
        await serverSupabase.from('audit_logs').insert({ user_id: auth.userId, user_name: auth.userEmail, action: 'Credentials Email Sent', target: institutionName, details: `Sent login credentials to ${institutionEmail}`, ip_address: 'server-api' });
      } catch (err) { console.error('[resend-credentials] audit log insert failed:', err); }

      res.json(jsonRes({ success: true }));
    } catch (err: any) {
      if (err instanceof HttpError) return res.status(err.status).json(jsonRes({ error: err.message }, err.status));
      console.error('[resend-credentials] Error:', err);
      res.status(500).json(jsonRes({ error: err?.message || 'Failed to send credentials.' }, 500));
    }
  });

  // POST /api/admin/search
  app.post('/api/admin/search', async (req, res) => {
    try {
      const auth = await requireSuperAdmin(req);

      const term = (req.body?.term || '').trim();
      if (term.length < 2) return res.json(jsonRes([]));

      const safe = term.replace(/[%_]/g, (c) => `\\${c}`);
      const pattern = `%${safe}%`;
      const results: Array<Record<string, unknown>> = [];

      const [institutionsRes, requestsRes, profilesRes] = await Promise.allSettled([
        serverSupabase.from('institutions').select('id,name,institution_code,email,contact_person,phone,status').or(`name.ilike.${pattern},institution_code.ilike.${pattern},email.ilike.${pattern},contact_person.ilike.${pattern},phone.ilike.${pattern}`).limit(20),
        serverSupabase.from('institution_requests').select('id,institution_name,institution_email,contact_person,status,institution_code,phone_number').or(`institution_name.ilike.${pattern},institution_email.ilike.${pattern},institution_code.ilike.${pattern},contact_person.ilike.${pattern},phone_number.ilike.${pattern}`).limit(20),
        serverSupabase.from('profiles').select('user_id,full_name,email,role,institution_id').or(`full_name.ilike.${pattern},email.ilike.${pattern}`).limit(20),
      ]);

      const institutionsData = institutionsRes.status === 'fulfilled' ? (institutionsRes.value.data || []) : [];
      const requestsData = requestsRes.status === 'fulfilled' ? (requestsRes.value.data || []) : [];
      const profilesData = profilesRes.status === 'fulfilled' ? (profilesRes.value.data || []) : [];

      for (const i of institutionsData as any[]) {
        results.push({ type: 'institution', id: i.id, name: i.name, subtitle: `${i.institution_code || 'N/A'} • ${i.email || 'N/A'}`, status: i.status });
      }
      for (const r of requestsData as any[]) {
        results.push({ type: 'request', id: r.id, name: r.institution_name, subtitle: `${r.institution_email} • ${r.status}`, status: r.status });
      }
      for (const p of profilesData as any[]) {
        results.push({ type: p.role === 'student' ? 'student' : 'institution', id: p.user_id, name: p.full_name || p.email, subtitle: `${p.email} • ${p.role || 'member'}`, status: p.role || 'member' });
      }

      res.json(jsonRes(results.slice(0, 50)));
    } catch (err: any) {
      if (err instanceof HttpError) return res.status(err.status).json(jsonRes({ error: err.message }, err.status));
      console.error('[search] Error:', err);
      res.status(500).json(jsonRes({ error: err?.message || 'Search failed.' }, 500));
    }
  });

  // POST /api/admin/reject-request
  app.post('/api/admin/reject-request', async (req, res) => {
    try {
      const auth = await requireSuperAdmin(req);

      const requestId = (req.body?.request_id || '').trim();
      const reason = (req.body?.reason || '').trim();
      if (!requestId) return res.status(400).json(jsonRes({ error: 'request_id is required.' }, 400));

      const { data: request, error: reqErr } = await serverSupabase.from('institution_requests').select('*').eq('id', requestId).single();
      if (reqErr || !request) return res.status(404).json(jsonRes({ error: 'Institution request not found.' }, 404));

      const { error: updateErr } = await serverSupabase
        .from('institution_requests')
        .update({ status: 'rejected', rejection_reason: reason || null })
        .eq('id', requestId);

      if (updateErr) return res.status(500).json(jsonRes({ error: `Failed to reject request: ${updateErr.message}` }, 500));

      try {
        await serverSupabase.from('notifications').insert({
          institution_id: null, user_id: null, type: 'error',
          title: 'Institution Rejected',
          message: `${request.institution_name} registration has been rejected.${reason ? ` Reason: ${reason}` : ''}`,
          read: false,
        });
      } catch (err) { console.error('[reject] notification insert failed:', err); }

      try {
        await serverSupabase.from('audit_logs').insert({
          user_id: auth.userId, user_name: auth.userEmail, action: 'Institution Rejected',
          target: request.institution_name, target_id: requestId, details: reason || 'No reason provided', ip_address: 'server-api',
        });
      } catch (err) { console.error('[reject] audit log insert failed:', err); }

      try {
        await sendRejectionEmail({
          institution_name: request.institution_name,
          institution_email: request.institution_email,
          contact_person: request.contact_person,
          reason: reason || 'No specific reason provided.',
        });
      } catch (err) { console.error('[reject] email send failed:', err); }

      res.json(jsonRes({ success: true }));
    } catch (err: any) {
      if (err instanceof HttpError) return res.status(err.status).json(jsonRes({ error: err.message }, err.status));
      console.error('[reject-request] Error:', err);
      res.status(500).json(jsonRes({ error: err?.message || 'Failed to reject request.' }, 500));
    }
  });

  // POST /api/admin/request-changes
  app.post('/api/admin/request-changes', async (req, res) => {
    try {
      const auth = await requireSuperAdmin(req);

      const requestId = (req.body?.request_id || '').trim();
      const notes = (req.body?.notes || '').trim();
      if (!requestId) return res.status(400).json(jsonRes({ error: 'request_id is required.' }, 400));
      if (!notes) return res.status(400).json(jsonRes({ error: 'Notes are required.' }, 400));

      const { data: request, error: reqErr } = await serverSupabase.from('institution_requests').select('*').eq('id', requestId).single();
      if (reqErr || !request) return res.status(404).json(jsonRes({ error: 'Institution request not found.' }, 404));

      const { error: updateErr } = await serverSupabase
        .from('institution_requests')
        .update({ status: 'changes_requested', admin_notes: notes })
        .eq('id', requestId);

      if (updateErr) return res.status(500).json(jsonRes({ error: `Failed to request changes: ${updateErr.message}` }, 500));

      try {
        await serverSupabase.from('notifications').insert({
          institution_id: null, user_id: null, type: 'info',
          title: 'Changes Requested',
          message: `Changes requested for ${request.institution_name}: ${notes}`,
          read: false,
        });
      } catch (err) { console.error('[changes] notification insert failed:', err); }

      try {
        await serverSupabase.from('audit_logs').insert({
          user_id: auth.userId, user_name: auth.userEmail, action: 'Changes Requested',
          target: request.institution_name, target_id: requestId, details: notes, ip_address: 'server-api',
        });
      } catch (err) { console.error('[changes] audit log insert failed:', err); }

      try {
        await sendChangesRequestedEmail({
          institution_name: request.institution_name,
          institution_email: request.institution_email,
          contact_person: request.contact_person,
          notes,
        });
      } catch (err) { console.error('[changes] email send failed:', err); }

      res.json(jsonRes({ success: true }));
    } catch (err: any) {
      if (err instanceof HttpError) return res.status(err.status).json(jsonRes({ error: err.message }, err.status));
      console.error('[request-changes] Error:', err);
      res.status(500).json(jsonRes({ error: err?.message || 'Failed to request changes.' }, 500));
    }
  });

  // Vite middleware for development vs static serve for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => { res.sendFile(path.join(distPath, 'index.html')); });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FOODEXA Institution Server running on http://localhost:${PORT}`);
    console.log(`[Server] Supabase URL: ${supabaseUrl}`);
    console.log(`[Server] Service Role Key: ${supabaseServiceRoleKey ? 'SET' : 'NOT SET'}`);
  });
}

startServer();