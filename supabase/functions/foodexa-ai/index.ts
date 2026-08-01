import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleCors, jsonResponse } from "../_shared/cors.ts";

serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const body = await req.json();
    const feature = body?.feature || "General Assistant";
    const prompt = (body?.prompt || "").trim();
    const context = body?.context || {};

    if (!prompt) {
      return jsonResponse({ error: "Prompt is required." }, 400);
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return jsonResponse(
        { error: "GEMINI_API_KEY is not configured. Set it in Edge Function secrets." },
        500
      );
    }

    const model = Deno.env.get("GEMINI_MODEL") || "gemini-3.6-flash";

    const systemPrompt = `You are FOODEXA AI, the intelligence powering the official FOODEXA Institution Platform for higher education campuses and canteens. You provide clear, action-oriented, professional insights based on Google Gemini models. Feature requested: ${feature}. Current Context: ${JSON.stringify(context || {})} Format your output cleanly in structured Markdown with concise bullet points and direct operational recommendations.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\nUser Request: ${prompt}` }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
        }),
      }
    );

    if (!response.ok) {
      const errBody = await response.text();
      console.error(`[foodexa-ai] Gemini API error (${response.status}):`, errBody);
      return jsonResponse(
        { error: `AI request failed (${response.status}). Please try again.` },
        502
      );
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts
      ?.map((p: any) => p.text || "")
      .filter(Boolean)
      .join("\n");

    if (!text) {
      return jsonResponse({ error: "AI returned an empty response." }, 502);
    }

    return jsonResponse({ success: true, text });
  } catch (err) {
    console.error("[foodexa-ai] Unexpected error:", err);
    return jsonResponse(
      { error: err instanceof Error ? err.message : "Failed to generate AI response." },
      500
    );
  }
});
