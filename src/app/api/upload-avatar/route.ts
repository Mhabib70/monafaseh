import { NextRequest, NextResponse } from "next/server";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("avatar") as File | null;

    if (!file) {
      return NextResponse.json(
        { ok: false, error: "فایلی ارسال نشده است" },
        { status: 400 },
      );
    }

    const ext = MIME_TO_EXT[file.type];
    if (!ext) {
      return NextResponse.json(
        {
          ok: false,
          error: "نوع فایل مجاز نیست. فرمت‌های مجاز: JPG, PNG, WebP, GIF",
        },
        { status: 400 },
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { ok: false, error: "حجم فایل نباید بیشتر از ۵ مگابایت باشد" },
        { status: 400 },
      );
    }

    const uploadDir = join(process.cwd(), "public", "uploads", "avatars");
    try {
      mkdirSync(uploadDir, { recursive: true });
    } catch {}

    const filename = `${randomUUID()}.${ext}`;
    const filepath = join(uploadDir, filename);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    writeFileSync(filepath, buffer);

    return NextResponse.json({
      ok: true,
      url: `/uploads/avatars/${filename}`,
      filename,
      size: file.size,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { ok: false, error: "خطا در آپلود فایل" },
      { status: 500 },
    );
  }
}
