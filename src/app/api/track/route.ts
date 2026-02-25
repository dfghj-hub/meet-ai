import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const DATA_DIR = path.resolve(process.cwd(), ".data");
const TRACK_FILE = path.join(DATA_DIR, "events.jsonl");

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const event = typeof body?.event === "string" ? body.event : "unknown";
    const payload = body?.payload ?? {};
    const sessionId = typeof body?.sessionId === "string" ? body.sessionId : undefined;
    const ts = new Date().toISOString();

    await ensureDir();
    const line = JSON.stringify({ event, ts, payload, sessionId }) + "\n";
    await fs.appendFile(TRACK_FILE, line, "utf-8");

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
      raw = await fs.readFile(TRACK_FILE, "utf-8");
    } catch {
      return NextResponse.json({ ok: true, total: 0, recent: [] });
    }

    const lines = raw.trim().split("\n").filter(Boolean);
    const recent = lines.slice(-50).map((l) => {
      try { return JSON.parse(l); } catch { return null; }
    }).filter(Boolean);

    return NextResponse.json({ ok: true, total: lines.length, recent });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
