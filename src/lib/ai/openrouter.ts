import "server-only";

import { readSettings } from "@/lib/config/settings";

type OpenRouterMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type OpenRouterRequest = {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  maxTokens?: number;
};

type OpenRouterResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

export type OpenRouterConfig = {
  apiKey: string;
  model: string;
  referer: string;
  title: string;
};

export async function resolveOpenRouterConfig(): Promise<OpenRouterConfig> {
  const stored = await readSettings();

  const apiKey =
    stored.openrouterApiKey ?? process.env.OPENROUTER_API_KEY ?? "";
  const model =
    stored.openrouterModel ?? process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini";
  const referer =
    stored.openrouterReferer ?? process.env.OPENROUTER_REFERER ?? "http://localhost:3000";
  const title =
    stored.openrouterTitle ?? process.env.OPENROUTER_TITLE ?? "SynthWave";

  if (!apiKey) {
    throw new Error(
      "OpenRouter API key is not configured. Visit /admin to set it.",
    );
  }

  return { apiKey, model, referer, title };
}

function extractJsonObject(text: string) {
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("Model response did not contain a JSON object.");
  }
  return text.slice(firstBrace, lastBrace + 1);
}

export async function requestOpenRouterJson<T>(request: OpenRouterRequest): Promise<T> {
  const { apiKey, referer, title } = await resolveOpenRouterConfig();

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": referer,
      "X-Title": title,
    },
    body: JSON.stringify({
      model: request.model,
      messages: request.messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 1200,
    }),
  });

  const payload = (await response.json()) as OpenRouterResponse;

  if (!response.ok) {
    const message = payload.error?.message ?? `OpenRouter request failed (${response.status})`;
    throw new Error(message);
  }

  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenRouter returned no message content.");
  }

  try {
    return JSON.parse(content) as T;
  } catch {
    return JSON.parse(extractJsonObject(content)) as T;
  }
}
