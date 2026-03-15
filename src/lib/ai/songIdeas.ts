import "server-only";

import { requestOpenRouterJson, resolveOpenRouterConfig } from "@/lib/ai/openrouter";

export type SongIdeaRequest = {
  prompt: string;
  style?: string;
  mood?: string;
  bpmMin?: number;
  bpmMax?: number;
  musicalKey?: string;
  bars?: number;
  candidates?: number;
};

export type SongIdeaCandidate = {
  title: string;
  style: string;
  mood: string;
  bpm: number;
  musicalKey: string;
  bars: number;
  arrangement: Array<{
    section: string;
    bars: number;
    intent: string;
  }>;
  notes: string;
};

type SongIdeaModelResponse = {
  ideas: SongIdeaCandidate[];
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalizeCandidate(raw: SongIdeaCandidate): SongIdeaCandidate {
  return {
    title: raw.title || "Untitled Idea",
    style: raw.style || "Electronic",
    mood: raw.mood || "Neutral",
    bpm: clamp(Number(raw.bpm) || 120, 60, 200),
    musicalKey: raw.musicalKey || "C minor",
    bars: clamp(Number(raw.bars) || 16, 4, 128),
    arrangement: Array.isArray(raw.arrangement)
      ? raw.arrangement
          .filter((part) => part && typeof part.section === "string")
          .map((part) => ({
            section: part.section,
            bars: clamp(Number(part.bars) || 4, 1, 64),
            intent: part.intent || "Develop motif",
          }))
      : [],
    notes: raw.notes || "",
  };
}

export async function generateSongIdeasWithOpenRouter(
  input: SongIdeaRequest,
): Promise<SongIdeaCandidate[]> {
  const candidates = clamp(input.candidates ?? 3, 1, 5);
  const { model } = await resolveOpenRouterConfig();

  const systemPrompt =
    "You are a music producer assistant for a browser DAW. " +
    "Return strictly valid JSON only and no markdown.";

  const userPrompt = `
Generate ${candidates} song ideas for this request.

Prompt: ${input.prompt}
Style: ${input.style ?? "unspecified"}
Mood: ${input.mood ?? "unspecified"}
BPM range: ${input.bpmMin ?? 90}-${input.bpmMax ?? 140}
Key preference: ${input.musicalKey ?? "unspecified"}
Target bars: ${input.bars ?? 16}

Return JSON with this exact shape:
{
  "ideas": [
    {
      "title": "string",
      "style": "string",
      "mood": "string",
      "bpm": 120,
      "musicalKey": "A minor",
      "bars": 16,
      "arrangement": [
        { "section": "Intro", "bars": 4, "intent": "string" }
      ],
      "notes": "string"
    }
  ]
}
`;

  const result = await requestOpenRouterJson<SongIdeaModelResponse>({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.8,
    maxTokens: 1400,
  });

  const ideas = Array.isArray(result.ideas) ? result.ideas : [];
  return ideas.slice(0, candidates).map(normalizeCandidate);
}

