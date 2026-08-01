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
    const institutionId = (body?.institution_id || "").trim();
    if (!institutionId) {
      return jsonResponse({ error: "institution_id is required." }, 400);
    }

    const { data: inst, error: instErr } = await admin
      .from("institutions")
      .select("*")
      .eq("id", institutionId)
      .maybeSingle();

    if (instErr || !inst) {
      return jsonResponse({ error: instErr?.message || "Institution not found." }, 404);
    }

    // Re-enable the institution
    const { error: updateErr } = await admin
      .from("institutions")
      .update({ status: "active" })
      .eq("id", institutionId);

    if (updateErr) {
      return jsonResponse({ error: `Failed to enable institution: ${updateErr.message}` }, 500);
    }

    if (inst.institution_code) {
      await admin
        .from("institution_requests")
        .update({ status: "active" })
        .eq("institution_code", inst.institution_code)
        .then((r) => {
          if (r.error) console.error("[enable] update request:", r.error.message);
        });
    }

    // Re-enable the auth user (remove ban)
    const { data: profile } = await admin
      .from("profiles")
      .select("user_id")
      .eq("institution_id", institutionId)
      .maybeSingle();

    if (profile?.user_id) {
      const { error: userErr } = await admin.auth.admin.updateUserById(profile.user_id, {
        ban_duration: "none",
      });
      if (userErr) {
        console.error("[enable] updateUserById error:", userErr);
      }
    }

    try {
      await admin.from("notifications").insert({
        institution_id: institutionId,
        user_id: profile?.user_id || null,
        type: "success",
        title: "Institution Enabled",
        message: "Your institution has been enabled.",
        read: false,
      });
    } catch (err) {
      console.error("[enable] notification insert failed:", err);
    }

    try {
      await admin.from("audit_logs").insert({
        user_id: user.id,
        user_name: user.email || "Super Admin",
        action: "Institution Enabled",
        target: inst.name,
        target_id: institutionId,
        details: `Enabled institution admin auth user`,
        ip_address: "edge-function",
      });
    } catch (err) {
      console.error("[enable] audit log insert failed:", err);
    }

    return jsonResponse({ success: true, institution_id: institutionId });
  } catch (err) {
    return jsonResponse(
      { error: err instanceof Error ? err.message : "Failed to enable institution." },
      500
    );
  }
});
