import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

const MAX_BYTES = 25 * 1024 * 1024; // 25MB
const ALLOWED_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/x-m4a",
  "audio/mp4",
];

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "请上传文件（field: file）" },
        { status: 400 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "文件大小超过 25MB 限制" },
        { status: 400 }
      );
    }

    const type = file.type?.toLowerCase() ?? "";
    const allowed =
      ALLOWED_TYPES.some((t) => type.includes(t.replace("audio/", ""))) ||
      type === "audio/mpeg" ||
      type === "audio/wav" ||
      type === "audio/mp4" ||
      type === "audio/x-m4a";
    if (!allowed && !file.name.match(/\.(mp3|wav|m4a|mp4)$/i)) {
      return NextResponse.json(
        { error: "仅支持 mp3 / wav / m4a 格式" },
        { status: 400 }
      );
    }

    const blob = await put(`audio/${Date.now()}-${file.name}`, file, {
      access: "public",
    });

    return NextResponse.json({ url: blob.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "上传失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
