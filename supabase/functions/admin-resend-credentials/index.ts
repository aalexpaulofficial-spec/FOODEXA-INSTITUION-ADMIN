import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleCors, jsonResponse } from "../_shared/cors.ts";
import { requireSuperAdmin } from "../_shared/admin.ts";
import { sendCredentialsEmail } from '../_shared/email.ts';
import { getPortalUrl } from '../_shared/env.ts';

serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const auth = await requireSuperAdmin(req);
  if (!auth.ok) return auth.response;
  const { admin, user } = auth.context;

  try {
    const body = await req.json();
    const institutionName = (body?.institution_name || "").trim();
    const institutionEmail = (body?.institution_email || "").trim().toLowerCase();
    const institutionCode = (body?.institution_code || "").trim();
    const loginEmail = (body?.login_email || institutionEmail).trim().toLowerCase();
    const password = (body?.password || "").trim();
    const contactPerson = (body?.contact_person || "").trim();

    if (!institutionName || !institutionEmail || !institutionCode || !password) {
      return jsonResponse(
        { error: "institution_name, institution_email, institution_code, and password are required." },
        400
      );
    }

    const emailResult = await sendCredentialsEmail({
      institution_name: institutionName,
      institution_email: institutionEmail,
      institution_code: institutionCode,
      login_email: loginEmail,
      password,
      portal_url: getPortalUrl(),
      contact_person: contactPerson,
      first_login_instructions: "Please log in using the credentials above. You will be prompted to change your password on first login.",
      password_change_reminder: "For security, please change your generated password after your first login.",
    });

    if (!emailResult.sent) {
      return jsonResponse(
        { success: false, error: emailResult.error || "Failed to send email." },
        502
      );
    }

    try {
      await admin.from("audit_logs").insert({
        user_id: user.id,
        user_name: user.email || "Super Admin",
        action: "Credentials Email Sent",
        target: institutionName,
        details: `Sent login credentials to ${institutionEmail}`,
        ip_address: "edge-function",
      });
    } catch (err) {
      console.error("[resend-credentials] audit log insert failed:", err);
    }

    return jsonResponse({ success: true });
  } catch (err) {
    return jsonResponse(
      { error: err instanceof Error ? err.message : "Failed to send credentials." },
      500
    );
  }
});


