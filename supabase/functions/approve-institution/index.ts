import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      institution_name,
      institution_email,
      institution_code,
      login_email,
      password,
      portal_url,
      contact_person,
      first_login_instructions,
      password_change_reminder,
    } = await req.json();

    if (!institution_name || !institution_email || !institution_code) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "noreply@foodexa.com";

    if (!RESEND_API_KEY) {
      console.error(
        "[approve-institution] RESEND_API_KEY is not set in Edge Function secrets."
      );
      return new Response(
        JSON.stringify({
          error: "Email service not configured. Set RESEND_API_KEY in Supabase Edge Function secrets.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background-color:#0C0C0E;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0C0C0E;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#111114;border:1px solid #1E1E24;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#F59E0B,#D97706);padding:32px 40px;text-align:center;">
              <h1 style="color:#0C0C0E;font-size:24px;font-weight:900;margin:0;letter-spacing:-0.5px;">FOODEXA</h1>
              <p style="color:#0C0C0ECC;font-size:12px;font-weight:600;margin:4px 0 0;letter-spacing:2px;text-transform:uppercase;">Institution Portal Access</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <p style="color:#94A3B8;font-size:14px;margin:0 0 8px;">Dear ${contact_person || "Institution Administrator"},</p>
              <p style="color:#CBD5E1;font-size:14px;line-height:1.7;margin:0 0 24px;">
                Your institution <strong style="color:#F59E0B;">${institution_name}</strong> has been approved on the FOODEXA platform.
                Below are your login credentials:
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0C0C0E;border:1px solid #1E1E24;border-radius:12px;margin:0 0 24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:8px 0;">
                          <span style="color:#64748B;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Institution Code</span><br/>
                          <span style="color:#F59E0B;font-size:16px;font-weight:900;font-family:monospace;">${institution_code}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;border-top:1px solid #1E1E24;">
                          <span style="color:#64748B;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Login Email</span><br/>
                          <span style="color:#FFFFFF;font-size:14px;font-family:monospace;">${login_email || institution_email}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;border-top:1px solid #1E1E24;">
                          <span style="color:#64748B;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Generated Password</span><br/>
                          <span style="color:#818CF8;font-size:14px;font-weight:700;font-family:monospace;">${password}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;border-top:1px solid #1E1E24;">
                          <span style="color:#64748B;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Portal URL</span><br/>
                          <a href="${portal_url}" style="color:#818CF8;font-size:14px;text-decoration:none;">${portal_url}</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="color:#CBD5E1;font-size:13px;line-height:1.7;margin:0 0 16px;">
                ${first_login_instructions || "Please log in using the credentials above. You will be prompted to change your password on first login."}
              </p>
              <p style="color:#F59E0B;font-size:13px;font-weight:600;margin:0 0 24px;">
                ${password_change_reminder || "For security, please change your generated password after your first login."}
              </p>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-top:1px solid #1E1E24;padding-top:24px;">
                    <p style="color:#475569;font-size:11px;margin:0;">
                      This is an automated message from FOODEXA Institution Management Platform.<br/>
                      If you did not expect this email, please contact your system administrator.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [institution_email],
        subject: `Welcome to FOODEXA - ${institution_name} Institution Login Credentials`,
        html: htmlContent,
      }),
    });

    if (!emailResponse.ok) {
      const errBody = await emailResponse.text();
      console.error(
        `[approve-institution] Resend API error (${emailResponse.status}):`,
        errBody
      );
      return new Response(
        JSON.stringify({
          error: `Email send failed: ${emailResponse.status}`,
          details: errBody,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const emailResult = await emailResponse.json();
    console.log(
      `[approve-institution] Email sent successfully to ${institution_email}. ID: ${emailResult.id}`
    );

    return new Response(
      JSON.stringify({ success: true, email_id: emailResult.id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("[approve-institution] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
