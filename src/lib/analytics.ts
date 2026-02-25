"use client";

type EventPayload = Record<string, unknown>;
const SESSION_KEY = "toolsai_analytics_session_id_v1";

interface TrackEventInput {
  event: string;
  payload?: EventPayload;
}

function getSessionId(): string {
  if (typeof window === "undefined") return "server";
  try {
    const cached = window.localStorage.getItem(SESSION_KEY);
    if (cached && cached.trim()) return cached;
    const generated = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(SESSION_KEY, generated);
    return generated;
  } catch {
    return "anonymous";
  }
}

export function trackEvent({ event, payload = {} }: TrackEventInput): void {
  const body = JSON.stringify({
    event,
    payload,
    path: typeof window !== "undefined" ? window.location.pathname : "",
    sessionId: getSessionId(),
    ts: new Date().toISOString(),
  });

  try {
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/track", blob);
      return;
    }
  } catch {
    // Fall through to fetch.
  }

  fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {
    // Ignore tracking failures by design.
  });
}
