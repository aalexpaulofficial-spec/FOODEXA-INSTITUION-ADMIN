import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleCors, jsonResponse } from "../_shared/cors.ts";
import { requireSuperAdmin } from "../_shared/admin.ts";

serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const auth = await requireSuperAdmin(req);
  if (!auth.ok) return auth.response;
  const { admin } = auth.context;

  try {
    const body = await req.json();
    const email = (body?.email || "").trim().toLowerCase();
    if (!email) {
      return jsonResponse({ error: "Email is required." }, 400);
    }

    const { data, error } = await admin.auth.admin.getUserByEmail(email);
    if (error && !data?.user) {
      return jsonResponse({ exists: false, user_id: null });
    }

    return jsonResponse({
      exists: !!data?.user,
      user_id: data?.user?.id || null,
    });
  } catch (err) {
    return jsonResponse(
      { error: err instanceof Error ? err.message : "Failed to check email." },
      500
    );
  }
});
