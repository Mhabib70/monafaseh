import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { db } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// ============================================================
// POST /api/lounges/[id]/voice — آپلود پیام صوتی تالار
// ورودی: multipart با فیلد audio (webm/ogg/mp3 — حداکثر ۳ مگابایت)
// خروجی: { ok, url } — url برای ارسال پیام type=voice استفاده می‌شود
// ============================================================

const MAX_SIZE = 3 * 1024 * 1024;
const ALLOWED = [".webm", ".ogg", ".mp3", ".m4a", ".aac"];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "ورود لازم است" }, { status: 401 });
    }

    // فقط اعضای تالار مجاز به آپلود هستند
    const membership = await db.loungeMember.findUnique({
      where: { loungeId_userId: { loungeId: id, userId: user.id } },
    });
    if (!membership || membership.role === "muted") {
      return NextResponse.json(
        { ok: false, error: "اجازه ارسال در این تالار را ندارید" },
        { status: 403 },
      );
    }

    const form = await request.formData();
    const audio = form.get("audio");
    if (!(audio instanceof File)) {
      return NextResponse.json({ ok: false, error: "فایل صوتی ارسال نشده است" }, { status: 400 });
    }
    if (audio.size > MAX_SIZE) {
      return NextResponse.json(
        { ok: false, error: "حجم پیام صوتی نباید بیشتر از ۳ مگابایت باشد" },
        { status: 400 },
      );
    }

    const ext = ALLOWED.includes(path.extname(audio.name).toLowerCase())
      ? path.extname(audio.name).toLowerCase()
      : ".webm";

    const bytes = Buffer.from(await audio.arrayBuffer());
    const dir = path.join(process.cwd(), "public", "uploads", "voice");
    await mkdir(dir, { recursive: true });
    const filename = `voice-${user.id.slice(-6)}-${Date.now()}${ext}`;
    await writeFile(path.join(dir, filename), bytes);

    return NextResponse.json({
      ok: true,
      url: `/api/files/uploads/voice/${filename}`,
    });
  } catch (error) {
    console.error("Voice upload error:", error);
    return NextResponse.json({ ok: false, error: "خطا در آپلود پیام صوتی" }, { status: 500 });
  }
}
