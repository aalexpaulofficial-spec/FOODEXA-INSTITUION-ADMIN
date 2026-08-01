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

    // Load institution
    const { data: inst, error: instErr } = await admin
      .from("institutions")
      .select("*")
      .eq("id", institutionId)
      .maybeSingle();

    if (instErr || !inst) {
      return jsonResponse({ error: instErr?.message || "Institution not found." }, 404);
    }

    // Update public.institutions.status = 'disabled'
    const { error: updateErr } = await admin
      .from("institutions")
      .update({ status: "disabled" })
      .eq("id", institutionId);

    if (updateErr) {
      return jsonResponse({ error: `Failed to disable institution: ${updateErr.message}` }, 500);
    }

    // Update institution_requests status to disabled
    if (inst.institution_code) {
      await admin
        .from("institution_requests")
        .update({ status: "disabled" })
        .eq("institution_code", inst.institution_code)
        .then((r) => {
          if (r.error) console.error("[disable] update request:", r.error.message);
        });
    }

    // Disable the auth user (server-side via updateUserById)
    const { data: profile } = await admin
      .from("profiles")
      .select("user_id")
      .eq("institution_id", institutionId)
      .maybeSingle();

    if (profile?.user_id) {
      const { error: userErr } = await admin.auth.admin.updateUserById(profile.user_id, {
        ban_duration: "876000h",
      });
      if (userErr) {
        console.error("[disable] updateUserById error:", userErr);
      }
    }

    // Create notification for the institution
    try {
      await admin.from("notifications").insert({
        institution_id: institutionId,
        user_id: profile?.user_id || null,
        type: "warning",
        title: "Institution Disabled",
        message: "Your institution has been disabled.",
        read: false,
      });
    } catch (err) {
      console.error("[disable] notification insert failed:", err);
    }

    // Audit log
    try {
      await admin.from("audit_logs").insert({
        user_id: user.id,
        user_name: user.email || "Super Admin",
        action: "Institution Disabled",
        target: inst.name,
        target_id: institutionId,
        details: `Disabled institution admin auth user`,
        ip_address: "edge-function",
      });
    } catch (err) {
      console.error("[disable] audit log insert failed:", err);
    }

    return jsonResponse({ success: true, institution_id: institutionId });
  } catch (err) {
    return jsonResponse(
      { error: err instanceof Error ? err.message : "Failed to disable institution." },
      500
    );
  }
});
