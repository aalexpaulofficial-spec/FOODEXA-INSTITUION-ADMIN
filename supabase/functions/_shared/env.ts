// Shared environment helpers for FOODEXA admin edge functions.
// Provides safe fallbacks so functions never crash on missing secrets.

export function getPortalUrl(): string {
  return Deno.env.get("PORTAL_URL") || "https://foodexa-institution-platform.vercel.app";
}
