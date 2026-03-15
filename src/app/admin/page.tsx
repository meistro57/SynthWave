"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const MODEL_OPTIONS_FALLBACK = [
  "openai/gpt-4o-mini",
  "openai/gpt-4o",
  "anthropic/claude-3.5-haiku",
  "anthropic/claude-3.5-sonnet",
  "google/gemini-flash-1.5",
  "mistralai/mistral-7b-instruct",
];

type SettingsPayload = {
  hasApiKey: boolean;
  apiKey: string;
  model: string;
  referer: string;
  title: string;
  modelOptions: string[];
};

type Status =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "saving" }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

export default function AdminPage() {
  const [loaded, setLoaded] = useState<SettingsPayload | null>(null);
  const [status, setStatus] = useState<Status>({ type: "loading" });
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Form state
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [customModel, setCustomModel] = useState("");
  const [isCustomModel, setIsCustomModel] = useState(false);
  const [referer, setReferer] = useState("");
  const [title, setTitle] = useState("");

  const modelOptions = loaded?.modelOptions ?? MODEL_OPTIONS_FALLBACK;

  function isDirty() {
    if (!loaded) return false;
    const currentModel = isCustomModel ? customModel : model;
    return (
      apiKey !== loaded.apiKey ||
      currentModel !== loaded.model ||
      referer !== loaded.referer ||
      title !== loaded.title
    );
  }

  async function fetchSettings() {
    setStatus({ type: "loading" });
    try {
      const res = await fetch("/api/admin/settings");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as SettingsPayload;
      setLoaded(data);
      setApiKey(data.apiKey);
      setReferer(data.referer);
      setTitle(data.title);
      const isKnown = (data.modelOptions ?? MODEL_OPTIONS_FALLBACK).includes(data.model);
      if (isKnown) {
        setModel(data.model);
        setIsCustomModel(false);
      } else {
        setModel("__custom__");
        setCustomModel(data.model);
        setIsCustomModel(true);
      }
      setStatus({ type: "idle" });
    } catch (err) {
      setStatus({ type: "error", message: String(err) });
    }
  }

  useEffect(() => {
    void fetchSettings();
  }, []);

  function scheduleAutoClear() {
    if (clearTimer.current) clearTimeout(clearTimer.current);
    clearTimer.current = setTimeout(() => setStatus({ type: "idle" }), 4000);
  }

  async function handleSave() {
    setStatus({ type: "saving" });
    try {
      const effectiveModel = isCustomModel ? customModel : model;
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, model: effectiveModel, referer, title }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus({ type: "success", message: "Settings saved." });
      scheduleAutoClear();
      await fetchSettings();
    } catch (err) {
      setStatus({ type: "error", message: String(err) });
      scheduleAutoClear();
    }
  }

  function handleModelChange(value: string) {
    setModel(value);
    setIsCustomModel(value === "__custom__");
  }

  const statusBar =
    status.type === "loading" ? (
      <span style={{ color: "#94a3b8" }}>Loading…</span>
    ) : status.type === "saving" ? (
      <span style={{ color: "#94a3b8" }}>Saving…</span>
    ) : status.type === "success" ? (
      <span style={{ color: "#22d3ee" }}>{status.message}</span>
    ) : status.type === "error" ? (
      <span style={{ color: "#f87171" }}>{status.message}</span>
    ) : null;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "#e2e8f0",
        fontFamily: "monospace",
        padding: "2rem 1rem",
      }}
    >
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "2rem",
          }}
        >
          <h1 style={{ margin: 0, fontSize: "1.5rem", color: "#38bdf8" }}>
            Admin Settings
          </h1>
          <Link
            href="/"
            style={{
              color: "#94a3b8",
              textDecoration: "none",
              fontSize: "0.875rem",
              border: "1px solid #334155",
              borderRadius: 6,
              padding: "0.3rem 0.75rem",
            }}
          >
            ← Back to DAW
          </Link>
        </div>

        {/* Warning banner */}
        {loaded && !loaded.hasApiKey && (
          <div
            style={{
              background: "#7c2d12",
              border: "1px solid #ea580c",
              borderRadius: 8,
              padding: "0.75rem 1rem",
              marginBottom: "1.5rem",
              fontSize: "0.875rem",
              color: "#fed7aa",
            }}
          >
            No API key configured. Enter your OpenRouter API key below to enable
            AI song ideas.
          </div>
        )}

        {/* Card */}
        <div
          style={{
            background: "#1e293b",
            border: "1px solid #334155",
            borderRadius: 12,
            padding: "1.5rem",
          }}
        >
          <h2 style={{ margin: "0 0 1.25rem", fontSize: "1rem", color: "#cbd5e1" }}>
            OpenRouter
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* API Key */}
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>API Key</span>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                onFocus={() => {
                  if (apiKey.startsWith("••••")) setApiKey("");
                }}
                placeholder="sk-or-…"
                style={inputStyle}
              />
            </label>

            {/* Model */}
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Model</span>
              <select
                value={isCustomModel ? "__custom__" : model}
                onChange={(e) => handleModelChange(e.target.value)}
                style={inputStyle}
              >
                {modelOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
                <option value="__custom__">Custom…</option>
              </select>
            </label>

            {isCustomModel && (
              <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                  Custom model ID
                </span>
                <input
                  type="text"
                  value={customModel}
                  onChange={(e) => setCustomModel(e.target.value)}
                  placeholder="provider/model-name"
                  style={inputStyle}
                />
              </label>
            )}

            {/* Referer */}
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                HTTP-Referer
              </span>
              <input
                type="url"
                value={referer}
                onChange={(e) => setReferer(e.target.value)}
                placeholder="http://localhost:3000"
                style={inputStyle}
              />
            </label>

            {/* Title */}
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                X-Title
              </span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="SynthWave"
                style={inputStyle}
              />
            </label>
          </div>

          {/* Save row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "1.5rem",
              gap: "1rem",
            }}
          >
            <div style={{ fontSize: "0.8rem", minHeight: "1.2em" }}>{statusBar}</div>
            <button
              onClick={handleSave}
              disabled={!isDirty() || status.type === "saving" || status.type === "loading"}
              style={{
                background: isDirty() ? "#0284c7" : "#1e3a4a",
                color: isDirty() ? "#fff" : "#64748b",
                border: "none",
                borderRadius: 8,
                padding: "0.5rem 1.25rem",
                cursor: isDirty() ? "pointer" : "default",
                fontSize: "0.875rem",
                transition: "background 0.15s",
              }}
            >
              Save
            </button>
          </div>
        </div>

        {/* Footer */}
        <p
          style={{
            marginTop: "1.5rem",
            fontSize: "0.75rem",
            color: "#475569",
            textAlign: "center",
          }}
        >
          Settings are persisted to <code>data/settings.json</code> at the project
          root. Mount this path as a Docker volume to survive container restarts.
        </p>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: "#0f172a",
  border: "1px solid #334155",
  borderRadius: 6,
  color: "#e2e8f0",
  padding: "0.45rem 0.75rem",
  fontSize: "0.875rem",
  fontFamily: "monospace",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};
