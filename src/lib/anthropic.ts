/**
 * Anthropic Claude client — direct browser calls (BYOK).
 * The user's key lives in localStorage settings; never sent anywhere else.
 */

import { getSettings, type ModelId, type Persona, type Reaction, type TestPersonaResult } from "@/lib/storage";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

export class MissingApiKeyError extends Error {
  constructor() {
    super("Missing Anthropic API key");
    this.name = "MissingApiKeyError";
  }
}

export class AnthropicAuthError extends Error {
  constructor() {
    super("That key didn't work. Check it in Settings.");
    this.name = "AnthropicAuthError";
  }
}

export class AnthropicRateLimitError extends Error {
  constructor() {
    super("You've hit Anthropic's rate limit. Give it a minute and try again.");
    this.name = "AnthropicRateLimitError";
  }
}

export class AnthropicApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "AnthropicApiError";
  }
}

export class InvalidJsonResponseError extends Error {
  raw: string;
  constructor(raw: string) {
    super("The model gave us something weird. Try again?");
    this.name = "InvalidJsonResponseError";
    this.raw = raw;
  }
}

/** A file attachment to include alongside the text prompt. */
export interface Attachment {
  /** Original file name, for display only. */
  name: string;
  /** MIME type — image/png, image/jpeg, image/gif, image/webp, or application/pdf. */
  mediaType: string;
  /** Base64-encoded file content (no data-URL prefix). */
  data: string;
  /** Pre-built object URL for image previews (revoked on removal). */
  previewUrl?: string;
}

/** Supported MIME types for uploads. */
export const SUPPORTED_MIME_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp", "application/pdf"] as const;

export type SupportedMimeType = (typeof SUPPORTED_MIME_TYPES)[number];

export function isSupportedMimeType(type: string): type is SupportedMimeType {
  return (SUPPORTED_MIME_TYPES as readonly string[]).includes(type);
}

/** Read a File and return an Attachment (base64, no data-URL prefix). */
export async function fileToAttachment(file: File): Promise<Attachment> {
  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]); // strip "data:...;base64,"
    };
    reader.onerror = () => reject(new Error("Could not read file."));
    reader.readAsDataURL(file);
  });

  const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;

  return { name: file.name, mediaType: file.type, data, previewUrl };
}

interface CallClaudeOptions {
  apiKey?: string;
  model?: ModelId;
  system: string;
  user: string;
  /** Optional file attachments sent before the text content. */
  attachments?: Attachment[];
  maxTokens?: number;
}

/** Low-level call. Returns the assistant text content. */
export async function callClaude({
  apiKey,
  model,
  system,
  user,
  attachments,
  maxTokens = 2000,
}: CallClaudeOptions): Promise<string> {
  const settings = getSettings();
  const key = apiKey ?? settings.anthropic_api_key;
  const chosenModel = model ?? settings.model;

  if (!key) throw new MissingApiKeyError();

  // Build user message content — multimodal when attachments are present.
  type ContentBlock =
    | { type: "text"; text: string }
    | { type: "image"; source: { type: "base64"; media_type: string; data: string } }
    | { type: "document"; source: { type: "base64"; media_type: string; data: string } };

  let userContent: string | ContentBlock[];

  if (attachments && attachments.length > 0) {
    const blocks: ContentBlock[] = attachments.map((a) => {
      if (a.mediaType.startsWith("image/")) {
        return {
          type: "image",
          source: { type: "base64", media_type: a.mediaType, data: a.data },
        };
      }
      // PDF / other document
      return {
        type: "document",
        source: { type: "base64", media_type: a.mediaType, data: a.data },
      };
    });
    blocks.push({ type: "text", text: user });
    userContent = blocks;
  } else {
    userContent = user;
  }

  let response: Response;
  try {
    response = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": ANTHROPIC_VERSION,
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: chosenModel,
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: userContent }],
      }),
    });
  } catch (err) {
    throw new AnthropicApiError(0, err instanceof Error ? err.message : "Network error");
  }

  if (response.status === 401) throw new AnthropicAuthError();
  if (response.status === 429) throw new AnthropicRateLimitError();

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const detail = data?.error?.message ?? data?.message ?? `Anthropic returned ${response.status}.`;
    throw new AnthropicApiError(response.status, detail);
  }

  const text: string | undefined = data?.content?.[0]?.text;
  if (!text) throw new AnthropicApiError(response.status, "Empty response from model.");
  return text;
}

/**
 * Pulls the first JSON object out of a model response (in case the model
 * wrapped it in fences despite instructions). Throws InvalidJsonResponseError
 * on unrecoverable cases.
 */
function parseJsonStrict<T>(raw: string): T {
  let candidate = raw.trim();
  // Strip ```json ... ``` fences if present
  const fence = candidate.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fence) candidate = fence[1].trim();

  // Fallback: extract first {...} block
  if (!(candidate.startsWith("{") && candidate.endsWith("}"))) {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      candidate = candidate.slice(start, end + 1);
    }
  }

  try {
    return JSON.parse(candidate) as T;
  } catch {
    throw new InvalidJsonResponseError(raw);
  }
}

/* ---------------- Test connection ---------------- */

/** Sends a tiny ping to verify the key + model. Resolves on success. */
export async function testConnection(apiKey: string, model: ModelId): Promise<void> {
  await callClaude({
    apiKey,
    model,
    system: "You are a connectivity checker. Reply with the single word: ok",
    user: "ping",
    maxTokens: 10,
  });
}

/* ---------------- Structure a persona ---------------- */

export interface StructuredPersona {
  name: string;
  role: string;
  company: string;
  goals: string[];
  pain_points: string[];
  behaviour: string;
  voice: string;
  quote: string;
  gaps: string[];
}

const STRUCTURE_SYSTEM_PROMPT = `You are an expert product research assistant helping product managers build rich, realistic user personas.

Given a free-text description of a user persona, extract and structure the information into a detailed persona profile. If critical information is missing, identify specific gaps.

Be specific, not generic. Avoid stock-photo persona clichés. Infer realistically from context. Never fabricate demographic stereotypes. If the user's description is thin, it is better to surface gaps than to invent filler.

Return ONLY valid JSON, no markdown fences, no prose outside the JSON, in this exact structure:

{
  "name": "First name or fictional name",
  "role": "Job title",
  "company": "Type, size, industry in one line",
  "goals": ["goal 1", "goal 2", "goal 3"],
  "pain_points": ["pain 1", "pain 2", "pain 3"],
  "behaviour": "How they work, tools they use, habits. 2-3 sentences.",
  "voice": "How they talk. Tone, phrases, what they care about. 1-2 sentences.",
  "quote": "A representative one-sentence quote they would say.",
  "gaps": ["specific question the user should answer to improve this persona"]
}

Rules:
- goals and pain_points: 3-5 items each, specific and role-relevant
- behaviour: concrete, tool-level, observable
- voice: capture their actual phrasing and values
- quote: should feel like something they'd actually say out loud
- gaps: empty array if the description was rich; up to 4 items if sparse`;

export async function structurePersona(description: string): Promise<StructuredPersona> {
  const raw = await callClaude({
    system: STRUCTURE_SYSTEM_PROMPT,
    user: description,
    maxTokens: 1500,
  });
  const parsed = parseJsonStrict<StructuredPersona>(raw);
  return {
    name: parsed.name ?? "",
    role: parsed.role ?? "",
    company: parsed.company ?? "",
    goals: Array.isArray(parsed.goals) ? parsed.goals : [],
    pain_points: Array.isArray(parsed.pain_points) ? parsed.pain_points : [],
    behaviour: parsed.behaviour ?? "",
    voice: parsed.voice ?? "",
    quote: parsed.quote ?? "",
    gaps: Array.isArray(parsed.gaps) ? parsed.gaps : [],
  };
}

/* ---------------- Run a test (one persona at a time) ---------------- */

const REACTION_SYSTEM_PROMPT = (
  persona: Persona,
  feature: string,
) => `You are role-playing as a specific user persona reacting to a product feature. Stay fully in character. Be honest — if this feature does not serve you, say so clearly. Do not be polite to please the PM. Your job is to surface real reactions, including uncomfortable ones.

PERSONA:
${JSON.stringify(persona, null, 2)}

FEATURE BEING TESTED:
${feature}

React as this persona. Speak in their voice. Reference their goals, pain points, and behaviour directly. Be specific, not generic.${feature.trim() ? "" : " The PM has provided visual materials (images or documents) above — react to those as the feature context."}

Return ONLY valid JSON, no markdown fences, no prose outside the JSON, in this exact structure:

{
  "reaction": "loves|likes|mixed|rejects",
  "what_lands": ["2-4 specific points this persona would genuinely appreciate, phrased in their voice"],
  "what_concerns": ["2-4 specific concerns, objections, or risks from this persona's view"],
  "questions_for_pm": ["2-3 pointed questions this persona would ask the PM"],
  "suggestion": "One concrete, actionable suggestion to make this feature better for this persona",
  "score": 0-100
}

Scoring guide:
- 85-100: loves it, would advocate for it, fits their goals tightly
- 65-84: likes it, with meaningful reservations
- 40-64: mixed, needs significant changes to land
- 0-39: rejects it, not for them, may even be counterproductive

Match the reaction field to the score range.`;

const VALID_REACTIONS: Reaction[] = ["loves", "likes", "mixed", "rejects"];

export async function runPersonaReaction(
  persona: Persona,
  feature: string,
  attachments?: Attachment[],
): Promise<TestPersonaResult> {
  const raw = await callClaude({
    system: REACTION_SYSTEM_PROMPT(persona, feature),
    user: `React to the feature described above, in character as ${persona.name}.`,
    attachments,
    maxTokens: 1500,
  });

  const parsed = parseJsonStrict<{
    reaction: Reaction;
    what_lands: string[];
    what_concerns: string[];
    questions_for_pm: string[];
    suggestion: string;
    score: number;
  }>(raw);

  const reaction: Reaction = VALID_REACTIONS.includes(parsed.reaction) ? parsed.reaction : "mixed";
  const score = Math.max(0, Math.min(100, Math.round(parsed.score ?? 0)));

  return {
    persona_id: persona.id,
    reaction,
    what_lands: Array.isArray(parsed.what_lands) ? parsed.what_lands : [],
    what_concerns: Array.isArray(parsed.what_concerns) ? parsed.what_concerns : [],
    questions_for_pm: Array.isArray(parsed.questions_for_pm) ? parsed.questions_for_pm : [],
    suggestion: parsed.suggestion ?? "",
    score,
  };
}
