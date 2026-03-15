import { NextResponse } from "next/server";
import { readSettings, writeSettings } from "@/lib/config/settings";

const MODEL_OPTIONS = [
  "openai/gpt-4o-mini",
  "openai/gpt-4o",
  "anthropic/claude-3.5-haiku",
  "anthropic/claude-3.5-sonnet",
  "google/gemini-flash-1.5",
  "mistralai/mistral-7b-instruct",
];

const DEFAULT_MODEL = "openai/gpt-4o-mini";
const DEFAULT_REFERER = "http://localhost:3000";
const DEFAULT_TITLE = "SynthWave";

function maskApiKey(key: string): string {
  if (!key || key.length < 4) return "••••";
  return "••••" + key.slice(-4);
}

export async function GET() {
  const stored = await readSettings();

  const rawKey = stored.openrouterApiKey ?? process.env.OPENROUTER_API_KEY ?? "";
  const model =
    stored.openrouterModel ?? process.env.OPENROUTER_MODEL ?? DEFAULT_MODEL;
  const referer =
    stored.openrouterReferer ?? process.env.OPENROUTER_REFERER ?? DEFAULT_REFERER;
  const title =
    stored.openrouterTitle ?? process.env.OPENROUTER_TITLE ?? DEFAULT_TITLE;

  return NextResponse.json({
    hasApiKey: rawKey.length > 0,
    apiKey: rawKey ? maskApiKey(rawKey) : "",
    model,
    referer,
    title,
    modelOptions: MODEL_OPTIONS,
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    apiKey?: string;
    model?: string;
    referer?: string;
    title?: string;
  };

  const patch: Record<string, string> = {};

  if (typeof body.apiKey === "string" && !body.apiKey.startsWith("••••")) {
    patch.openrouterApiKey = body.apiKey;
  }
  if (typeof body.model === "string") {
    patch.openrouterModel = body.model;
  }
  if (typeof body.referer === "string") {
    patch.openrouterReferer = body.referer;
  }
  if (typeof body.title === "string") {
    patch.openrouterTitle = body.title;
  }

  await writeSettings(patch);

  return NextResponse.json({ ok: true });
}
