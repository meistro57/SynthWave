import "server-only";

import fs from "fs/promises";
import path from "path";

export type AdminSettings = {
  openrouterApiKey: string;
  openrouterModel: string;
  openrouterReferer: string;
  openrouterTitle: string;
};

const SETTINGS_PATH = path.join(process.cwd(), "data", "settings.json");

export async function readSettings(): Promise<Partial<AdminSettings>> {
  try {
    const raw = await fs.readFile(SETTINGS_PATH, "utf-8");
    return JSON.parse(raw) as Partial<AdminSettings>;
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return {};
    }
    throw err;
  }
}

export async function writeSettings(patch: Partial<AdminSettings>): Promise<void> {
  const dir = path.dirname(SETTINGS_PATH);
  await fs.mkdir(dir, { recursive: true });
  const existing = await readSettings();
  const merged = { ...existing, ...patch };
  await fs.writeFile(SETTINGS_PATH, JSON.stringify(merged, null, 2), "utf-8");
}
