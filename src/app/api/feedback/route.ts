import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const DATA_DIR = path.resolve(process.cwd(), ".data");
const FEEDBACK_FILE = path.join(DATA_DIR, "feedback.jsonl");

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const flow = typeof body?.flow === "string" ? body.flow.trim() : "";
    const ratingRaw = body?.rating;
    const comment =
      typeof body?.comment === "string" ? body.comment.trim().slice(0, 2000) : "";
    const sessionId =
      typeof body?.sessionId === "string" ? body.sessionId.trim().slice(0, 256) : "anonymous";

    if (!flow) {
      return NextResponse.json({ ok: false, error: "flow is required" }, { status: 400 });
    }

    const rating =
      typeof ratingRaw === "number" ? Math.round(ratingRaw) : parseInt(String(ratingRaw), 10);
    if (isNaN(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ ok: false, error: "rating must be 1-5" }, { status: 400 });
    }

    await ensureDir();
    const line = JSON.stringify({ flow, rating, comment, sessionId, ts: new Date().toISOString() }) + "\n";
    await fs.appendFile(FEEDBACK_FILE, line, "utf-8");

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}

export async function GET() {
  try {
    await ensureDir();
    let raw = "";
    try {
      raw = await fs.readFile(FEEDBACK_FILE, "utf-8");
    } catch {
      return NextResponse.json({ ok: true, total: 0, avgRating: 0, items: [] });
    }

    const lines = raw.trim().split("\n").filter(Boolean);
    const items = lines.map((l) => {
      try { return JSON.parse(l); } catch { return null; }
    }).filter(Boolean);

    const total = items.length;
    const avgRating = total > 0
      ? Math.round((items.reduce((s: number, i: { rating: number }) => s + i.rating, 0) / total) * 10) / 10
      : 0;

    return NextResponse.json({ ok: true, total, avgRating, items: items.slice(-20) });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
