import { NextRequest, NextResponse } from "next/server";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

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

    // Validate type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          ok: false,
          error: `نوع فایل مجاز نیست. فرمت‌های مجاز: ${ALLOWED_TYPES.join(", ")}`,
        },
        { status: 400 },
      );
    }

    // Validate size
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { ok: false, error: "حجم فایل نباید بیشتر از ۵ مگابایت باشد" },
        { status: 400 },
      );
    }

    // Ensure directory exists
    const uploadDir = join(process.cwd(), "public", "uploads", "avatars");
    try {
      mkdirSync(uploadDir, { recursive: true });
    } catch {
      // Directory already exists
    }

    // Generate unique filename
    const ext = file.name.split(".").pop() || "jpg";
    const filename = `${randomUUID()}.${ext}`;
    const filepath = join(uploadDir, filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    writeFileSync(filepath, buffer);

    // Return public URL
    const url = `/uploads/avatars/${filename}`;

    return NextResponse.json({
      ok: true,
      url,
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
