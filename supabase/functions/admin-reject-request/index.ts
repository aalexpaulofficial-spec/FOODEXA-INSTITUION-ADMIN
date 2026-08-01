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
    const reason = (body?.reason || "").trim();

    if (!requestId) {
      return jsonResponse({ error: "request_id is required." }, 400);
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
      .update({ status: "rejected", rejection_reason: reason || null })
      .eq("id", requestId);

    if (updateErr) {
      return jsonResponse({ error: `Failed to reject request: ${updateErr.message}` }, 500);
    }

    try {
      await admin.from("notifications").insert({
        institution_id: null,
        user_id: null,
        type: "error",
        title: "Institution Rejected",
        message: `${request.institution_name} registration has been rejected.${reason ? ` Reason: ${reason}` : ""}`,
        read: false,
      });
    } catch (err) {
      console.error("[reject] notification insert failed:", err);
    }

    try {
      await admin.from("audit_logs").insert({
        user_id: user.id,
        user_name: user.email || "Super Admin",
        action: "Institution Rejected",
        target: request.institution_name,
        target_id: requestId,
        details: reason || "No reason provided",
        ip_address: "edge-function",
      });
    } catch (err) {
      console.error("[reject] audit log insert failed:", err);
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
<tr><td style="background:linear-gradient(135deg,#EF4444,#B91C1C);padding:32px 40px;text-align:center;">
<h1 style="color:#FFFFFF;font-size:24px;font-weight:900;margin:0;">FOODEXA</h1>
<p style="color:#FECACA;font-size:12px;font-weight:600;margin:4px 0 0;text-transform:uppercase;">Institution Application Update</p>
</td></tr>
<tr><td style="padding:40px;">
<p style="color:#94A3B8;font-size:14px;margin:0 0 8px;">Dear ${request.contact_person || "Institution Administrator"},</p>
<p style="color:#CBD5E1;font-size:14px;line-height:1.7;margin:0 0 24px;">We are sorry to inform you that your application for <strong style="color:#F87171;">${request.institution_name}</strong> has been <strong style="color:#F87171;">rejected</strong>.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0C0C0E;border:1px solid #1E1E24;border-radius:12px;margin:0 0 24px;">
<tr><td style="padding:20px 24px;">
<span style="color:#64748B;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Reason</span><br/>
<span style="color:#F87171;font-size:14px;font-weight:600;">${reason || "No specific reason provided."}</span>
</td></tr></table>
<p style="color:#CBD5E1;font-size:13px;line-height:1.7;margin:0 0 16px;">If you believe this is an error, please contact our support team for assistance.</p>
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
            subject: `FOODEXA - ${request.institution_name} Application Status`,
            html,
          }),
        });
        if (!res.ok) console.error("[reject] rejection email failed:", await res.text());
      } catch (err) {
        console.error("[reject] rejection email error:", err);
      }
    }

    return jsonResponse({ success: true });
  } catch (err) {
    return jsonResponse(
      { error: err instanceof Error ? err.message : "Failed to reject request." },
      500
    );
  }
});
