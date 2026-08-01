// Shared auth helper for FOODEXA admin edge functions.
// Verifies the caller is an authenticated Super Admin using their user JWT.
// Uses SUPABASE_SERVICE_ROLE_KEY (server secret) for all admin operations.

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsonResponse } from "./cors.ts";

export interface AdminContext {
  user: { id: string; email?: string };
  admin: SupabaseClient;
}

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function getSupabaseUrl(): string {
  const url = Deno.env.get("SUPABASE_URL");
  if (!url) {
    throw new Error("SUPABASE_URL is not configured.");
  }
  return url;
}

export function getServiceRoleKey(): string {
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not configured on the server. Set it as an Edge Function secret."
    );
  }
  return key;
}

export function getAnonKey(): string {
  const key = Deno.env.get("SUPABASE_ANON_KEY");
  if (!key) {
    throw new Error("SUPABASE_ANON_KEY is not configured on the server.");
  }
  return key;
}

export function createAdminClient(): SupabaseClient {
  return createClient(getSupabaseUrl(), getServiceRoleKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Authenticate the incoming request as a Super Admin.
 * Returns { ok: true, context } or { ok: false, response }.
 */
export async function requireSuperAdmin(
  req: Request
): Promise<{ ok: true; context: AdminContext } | { ok: false; response: Response }> {
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return { ok: false, response: jsonResponse({ error: "Missing authorization token." }, 401) };
  }

  try {
    const anonClient = createClient(getSupabaseUrl(), getAnonKey(), {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data, error } = await anonClient.auth.getUser(token);
    if (error || !data?.user) {
      return { ok: false, response: jsonResponse({ error: "Invalid or expired session." }, 401) };
    }
    const user = data.user;
    if (!user.id || !uuidRegex.test(user.id)) {
      return { ok: false, response: jsonResponse({ error: "Invalid user session." }, 401) };
    }

    const admin = createAdminClient();
    const { data: profile, error: profileErr } = await admin
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileErr || !profile) {
      return { ok: false, response: jsonResponse({ error: "Profile not found for user." }, 403) };
    }
    if (profile.role !== "super_admin") {
      return { ok: false, response: jsonResponse({ error: "Forbidden: Super Admin access required." }, 403) };
    }

    return {
      ok: true,
      context: {
        user: { id: user.id, email: user.email },
        admin,
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Authentication failed.";
    return { ok: false, response: jsonResponse({ error: msg }, 500) };
  }
}

/** Generate a secure temporary password (14-16 chars). */
export function generatePassword(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  const length = 14 + Math.floor(Math.random() * 3);
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(array[i] % chars.length);
  }
  return password;
}
