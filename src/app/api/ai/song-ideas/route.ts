import { NextResponse } from "next/server";

import {
  generateSongIdeasWithOpenRouter,
  type SongIdeaRequest,
} from "@/lib/ai/songIdeas";

class RequestValidationError extends Error {}

function parseRequestBody(body: unknown): SongIdeaRequest {
  if (!body || typeof body !== "object") {
    throw new RequestValidationError("Invalid JSON body.");
  }

  const value = body as Record<string, unknown>;
  const prompt = typeof value.prompt === "string" ? value.prompt.trim() : "";
  if (!prompt) {
    throw new RequestValidationError("`prompt` is required.");
  }

  return {
    prompt,
    style: typeof value.style === "string" ? value.style : undefined,
    mood: typeof value.mood === "string" ? value.mood : undefined,
    bpmMin: typeof value.bpmMin === "number" ? value.bpmMin : undefined,
    bpmMax: typeof value.bpmMax === "number" ? value.bpmMax : undefined,
    musicalKey: typeof value.musicalKey === "string" ? value.musicalKey : undefined,
    bars: typeof value.bars === "number" ? value.bars : undefined,
    candidates: typeof value.candidates === "number" ? value.candidates : undefined,
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const input = parseRequestBody(body);
    const ideas = await generateSongIdeasWithOpenRouter(input);
    return NextResponse.json({ ideas });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = error instanceof RequestValidationError ? 400 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
