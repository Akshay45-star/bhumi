/**
 * passing-ai.ts
 * Uses OpenAI GPT-4o Vision to inspect a submitted photo and determine
 * whether it constitutes evidence that a person has passed away.
 *
 * Returns:
 *   confirmed  — AI is confident the image shows a death certificate / obituary / similar proof
 *   uncertain  — image is ambiguous or AI cannot make a determination
 *   rejected   — image is clearly unrelated (selfie, landscape, etc.)
 */

import OpenAI from "openai";

export type AIVerdict = "confirmed" | "uncertain" | "rejected";

export interface AIVerificationResult {
  verdict: AIVerdict;
  confidence: number;   // 0–1
  reasoning: string;    // short human-readable explanation (for audit log only, never shown to family)
  raw: { verdict: AIVerdict; confidence: number; reasoning: string };
}

const SYSTEM_PROMPT = `You are a careful, compassionate document verifier for a digital legacy app.
A family member has submitted an image as evidence that a loved one has passed away.
Accepted evidence types: death certificate, obituary, hospital/hospice document, newspaper death notice, funeral home paperwork.
Rejected: photos of people, landscapes, IDs, blank pages, screenshots of social media, or anything unrelated.

Respond ONLY with a JSON object (no markdown, no explanation outside the JSON):
{
  "verdict": "confirmed" | "uncertain" | "rejected",
  "confidence": <number 0.0–1.0>,
  "reasoning": "<one sentence>"
}

Be generous in borderline cases — err on the side of "uncertain" rather than "rejected" if some evidence is present.
Only use "confirmed" when the document clearly indicates a person has died.`;

let _client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!_client) {
    if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not set");
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _client;
}

export async function verifyPassingPhoto(
  imageUrl: string   // public or pre-signed URL — must be accessible by OpenAI
): Promise<AIVerificationResult> {
  const client = getClient();

  const completion = await client.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 256,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: "Please verify this image." },
          { type: "image_url", image_url: { url: imageUrl, detail: "low" } },
        ],
      },
    ],
  });

  const text = completion.choices[0]?.message?.content ?? "{}";
  let parsed: any = {};
  try { parsed = JSON.parse(text); } catch { /* treat as uncertain */ }

  const verdict: AIVerdict = (["confirmed","uncertain","rejected"].includes(parsed.verdict)) ? parsed.verdict : "uncertain";
  const confidence: number = typeof parsed.confidence === "number" ? Math.min(1, Math.max(0, parsed.confidence)) : 0;
  const reasoning: string  = typeof parsed.reasoning === "string" ? parsed.reasoning.slice(0, 500) : "No reasoning provided";

  return {
    verdict,
    confidence,
    reasoning,
    raw: { verdict, confidence, reasoning },
  };
}
