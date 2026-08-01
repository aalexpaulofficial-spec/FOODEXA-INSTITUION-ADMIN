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
    const term = (body?.term || "").trim();
    if (term.length < 2) {
      return jsonResponse([]);
    }

    // Escape % and _ for ILIKE so the search term is treated literally
    const safe = term.replace(/[%_]/g, (c) => `\\${c}`);
    const pattern = `%${safe}%`;

    const results: Array<Record<string, unknown>> = [];

    // Search institutions (PostgreSQL ILIKE via RPC when deployed)
    const { data: institutions, error: instErr } = await admin.rpc("admin_search", {
      p_pattern: pattern,
    });

    if (instErr) {
      // Fallback to direct table queries if the RPC isn't deployed
      const [institutionsRes, requestsRes, profilesRes] = await Promise.allSettled([
        admin
          .from("institutions")
          .select("id,name,institution_code,email,contact_person,phone,status")
          .or(
            `name.ilike.${pattern},institution_code.ilike.${pattern},email.ilike.${pattern},contact_person.ilike.${pattern},phone.ilike.${pattern}`
          )
          .limit(20),
        admin
          .from("institution_requests")
          .select("id,institution_name,institution_email,contact_person,status,institution_code,phone_number")
          .or(
            `institution_name.ilike.${pattern},institution_email.ilike.${pattern},institution_code.ilike.${pattern},contact_person.ilike.${pattern},phone_number.ilike.${pattern}`
          )
          .limit(20),
        admin
          .from("profiles")
          .select("user_id,full_name,email,role,institution_id")
          .or(`full_name.ilike.${pattern},email.ilike.${pattern}`)
          .limit(20),
      ]);

      const institutionsData = institutionsRes.status === "fulfilled" ? (institutionsRes.value.data || []) : [];
      const requestsData = requestsRes.status === "fulfilled" ? (requestsRes.value.data || []) : [];
      const profilesData = profilesRes.status === "fulfilled" ? (profilesRes.value.data || []) : [];

      for (const i of institutionsData as any[]) {
        results.push({
          type: "institution",
          id: i.id,
          name: i.name,
          subtitle: `${i.institution_code || "N/A"} • ${i.email || "N/A"}`,
          status: i.status,
        });
      }
      for (const r of requestsData as any[]) {
        results.push({
          type: "request",
          id: r.id,
          name: r.institution_name,
          subtitle: `${r.institution_email} • ${r.status}`,
          status: r.status,
        });
      }
      for (const p of profilesData as any[]) {
        results.push({
          type: p.role === "student" ? "student" : "institution",
          id: p.user_id,
          name: p.full_name || p.email,
          subtitle: `${p.email} • ${p.role || "member"}`,
          status: p.role || "member",
        });
      }
    } else if (Array.isArray(institutions)) {
      results.push(...(institutions as any[]));
    }

    return jsonResponse(results.slice(0, 50));
  } catch (err) {
    return jsonResponse(
      { error: err instanceof Error ? err.message : "Search failed." },
      500
    );
  }
});
