"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPassingPhoto = verifyPassingPhoto;
const openai_1 = __importDefault(require("openai"));
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
let _client = null;
function getClient() {
    if (!_client) {
        if (!process.env.OPENAI_API_KEY)
            throw new Error("OPENAI_API_KEY not set");
        _client = new openai_1.default({ apiKey: process.env.OPENAI_API_KEY });
    }
    return _client;
}
async function verifyPassingPhoto(imageUrl // public or pre-signed URL — must be accessible by OpenAI
) {
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
    let parsed = {};
    try {
        parsed = JSON.parse(text);
    }
    catch { /* treat as uncertain */ }
    const verdict = (["confirmed", "uncertain", "rejected"].includes(parsed.verdict)) ? parsed.verdict : "uncertain";
    const confidence = typeof parsed.confidence === "number" ? Math.min(1, Math.max(0, parsed.confidence)) : 0;
    const reasoning = typeof parsed.reasoning === "string" ? parsed.reasoning.slice(0, 500) : "No reasoning provided";
    return {
        verdict,
        confidence,
        reasoning,
        raw: { verdict, confidence, reasoning },
    };
}
