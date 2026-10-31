import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// ============================================================
// POST /api/verify/upload — آپلود تلاوت آزمونی احراز قاری
// ورودی: multipart با فیلد file (صوتی/ویدیویی — حداکثر ۲۰ مگابایت)
// خروجی: { ok, url } — url در فرم آزمون به‌عنوان recitationVideoUrl ارسال می‌شود
// ============================================================

const MAX_SIZE = 20 * 1024 * 1024;
const ALLOWED = [".webm", ".ogg", ".mp3", ".m4a", ".aac", ".wav", ".mp4", ".mov"];

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "ورود لازم است" }, { status: 401 });
    }

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "فایلی ارسال نشده است" }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { ok: false, error: "حجم فایل نباید بیشتر از ۲۰ مگابایت باشد" },
        { status: 400 },
      );
    }

    const ext = path.extname(file.name).toLowerCase();
    const safeExt = ALLOWED.includes(ext) ? ext : ".webm";

    const bytes = Buffer.from(await file.arrayBuffer());
    const dir = path.join(process.cwd(), "public", "uploads", "verify");
    await mkdir(dir, { recursive: true });
    const filename = `audition-${user.id.slice(-6)}-${Date.now()}${safeExt}`;
    await writeFile(path.join(dir, filename), bytes);

    return NextResponse.json({
      ok: true,
      url: `/api/files/uploads/verify/${filename}`,
      isAudio: [".webm", ".ogg", ".mp3", ".m4a", ".aac", ".wav"].includes(safeExt),
    });
  } catch (error) {
    console.error("Verify upload error:", error);
    return NextResponse.json({ ok: false, error: "خطا در آپلود فایل" }, { status: 500 });
  }
}
