import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleCors, jsonResponse } from "../_shared/cors.ts";
import { requireSuperAdmin } from "../_shared/admin.ts";

serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const auth = await requireSuperAdmin(req);
  if (!auth.ok) return auth.response;
  const { admin, user } = auth.context;

  try {
    const body = await req.json();
    const requestId = (body?.request_id || "").trim();
    const notes = (body?.notes || "").trim();

    if (!requestId) {
      return jsonResponse({ error: "request_id is required." }, 400);
    }
    if (!notes) {
      return jsonResponse({ error: "Notes are required." }, 400);
    }

    const { data: request, error: reqErr } = await admin
      .from("institution_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (reqErr || !request) {
      return jsonResponse({ error: "Institution request not found." }, 404);
    }

    const { error: updateErr } = await admin
      .from("institution_requests")
      .update({ status: "changes_requested", admin_notes: notes })
      .eq("id", requestId);

    if (updateErr) {
      return jsonResponse({ error: `Failed to request changes: ${updateErr.message}` }, 500);
    }

    try {
      await admin.from("notifications").insert({
        institution_id: null,
        user_id: null,
        type: "info",
        title: "Changes Requested",
        message: `Changes requested for ${request.institution_name}: ${notes}`,
        read: false,
      });
    } catch (err) {
      console.error("[changes] notification insert failed:", err);
    }

    try {
      await admin.from("audit_logs").insert({
        user_id: user.id,
        user_name: user.email || "Super Admin",
        action: "Changes Requested",
        target: request.institution_name,
        target_id: requestId,
        details: notes,
        ip_address: "edge-function",
      });
    } catch (err) {
      console.error("[changes] audit log insert failed:", err);
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "noreply@foodexa.com";

    if (RESEND_API_KEY && request.institution_email) {
      const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background-color:#0C0C0E;font-family:'Segoe UI',Tahoma,Verdana,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0C0C0E;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#111114;border:1px solid #1E1E24;border-radius:16px;overflow:hidden;">
<tr><td style="background:linear-gradient(135deg,#3B82F6,#1D4ED8);padding:32px 40px;text-align:center;">
<h1 style="color:#FFFFFF;font-size:24px;font-weight:900;margin:0;">FOODEXA</h1>
<p style="color:#BFDBFE;font-size:12px;font-weight:600;margin:4px 0 0;text-transform:uppercase;">Institution Application Update</p>
</td></tr>
<tr><td style="padding:40px;">
<p style="color:#94A3B8;font-size:14px;margin:0 0 8px;">Dear ${request.contact_person || "Institution Administrator"},</p>
<p style="color:#CBD5E1;font-size:14px;line-height:1.7;margin:0 0 24px;">Changes have been requested for your institution <strong style="color:#60A5FA;">${request.institution_name}</strong>. Please update your application and resubmit.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0C0C0E;border:1px solid #1E1E24;border-radius:12px;margin:0 0 24px;">
<tr><td style="padding:20px 24px;">
<span style="color:#64748B;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Requested Changes</span><br/>
<span style="color:#60A5FA;font-size:14px;font-weight:600;">${notes}</span>
</td></tr></table>
</td></tr></table>
</td></tr></table>
</body></html>`;

      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: FROM_EMAIL,
            to: [request.institution_email],
            subject: `FOODEXA - ${request.institution_name} Changes Requested`,
            html,
          }),
        });
        if (!res.ok) console.error("[changes] notification email failed:", await res.text());
      } catch (err) {
        console.error("[changes] notification email error:", err);
      }
    }

    return jsonResponse({ success: true });
  } catch (err) {
    return jsonResponse(
      { error: err instanceof Error ? err.message : "Failed to request changes." },
      500
    );
  }
});
