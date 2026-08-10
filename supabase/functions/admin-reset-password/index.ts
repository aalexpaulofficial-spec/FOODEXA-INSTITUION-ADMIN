import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleCors, jsonResponse } from "../_shared/cors.ts";
import { requireSuperAdmin, generatePassword } from "../_shared/admin.ts";
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
    const email = (body?.email || "").trim().toLowerCase();
    const institutionName = (body?.institution_name || "").trim();
    const institutionCode = (body?.institution_code || "").trim();
    const contactPerson = (body?.contact_person || "").trim();

    if (!email) {
      return jsonResponse({ error: "email is required." }, 400);
    }

    // Look up the auth user by email
    const { data: userByEmail } = await admin.auth.admin.getUserByEmail(email);
    const authUserId = userByEmail?.user?.id;
    if (!authUserId) {
      return jsonResponse({ error: `No auth user found for email "${email}".` }, 404);
    }

    // Generate a fresh temporary password and set it server-side
    const newPassword = generatePassword();
    const { error: updateErr } = await admin.auth.admin.updateUserById(authUserId, {
      password: newPassword,
      email_confirm: true,
    });

    if (updateErr) {
      return jsonResponse({ error: `Failed to reset password: ${updateErr.message}` }, 500);
    }

    // Also generate a recovery link so the admin can set their own password
    const { data: linkData } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: `${getPortalUrl()}/login`,
      },
    });

    // Send the new credentials + recovery link via email (server-side)
    const emailResult = await sendCredentialsEmail({
      institution_name: institutionName || "Your Institution",
      institution_email: email,
      institution_code: institutionCode || "N/A",
      login_email: email,
      password: newPassword,
      portal_url: getPortalUrl(),
      contact_person: contactPerson,
      first_login_instructions:
        "Your password has been reset. Use the temporary password below to sign in, then change it after your first login.",
      password_change_reminder: "For security, please change your temporary password after your first login.",
    });

    try {
      await admin.from("audit_logs").insert({
        user_id: user.id,
        user_name: user.email || "Super Admin",
        action: "Password Reset",
        target: institutionName || email,
        target_id: authUserId,
        details: `Reset password for ${email}${emailResult.sent ? "" : " (email not sent)"}`,
        ip_address: "edge-function",
      });
    } catch (err) {
      console.error("[reset-password] audit log insert failed:", err);
    }

    return jsonResponse({
      success: true,
      new_password: newPassword,
      email_sent: emailResult.sent,
      email_error: emailResult.error || null,
      recovery_link: linkData?.properties?.action_link || null,
    });
  } catch (err) {
    return jsonResponse(
      { error: err instanceof Error ? err.message : "Failed to reset password." },
      500
    );
  }
});



