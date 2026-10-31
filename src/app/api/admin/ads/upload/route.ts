import { NextRequest, NextResponse } from "next/server";
import { writeFileSync, mkdirSync, statSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";
import sharp from "sharp";
import { getCurrentUser } from "@/lib/get-current-user";

// POST /api/admin/ads/upload — آپلود، برش، و بهینه‌سازی تصویر بنر
//
// body (multipart/form-data):
//   • banner: File (required) — تصویر اصلی
//   • cropX, cropY, cropW, cropH (number, 0..1) — مختصات برش (اختیاری، پیش‌فرض کل تصویر)
//   • targetWidth, targetHeight (number, px) — ابعاد نهایی (اختیاری، پیش‌فرض 728×90)
//
// فقط ادمین. حداکثر حجم ورودی: ۵MB.

const MAX_INPUT_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { ok: false, error: "دسترسی فقط برای ادمین" },
        { status: 403 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("banner") as File | null;

    if (!file) {
      return NextResponse.json(
        { ok: false, error: "فایلی ارسال نشده است" },
        { status: 400 },
      );
    }

    // Validate type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { ok: false, error: `نوع فایل مجاز نیست. فرمت‌های مجاز: JPEG, PNG, WebP, GIF` },
        { status: 400 },
      );
    }

    // Validate size
    if (file.size > MAX_INPUT_SIZE) {
      return NextResponse.json(
        { ok: false, error: "حجم فایل نباید بیشتر از ۵ مگابایت باشد" },
        { status: 400 },
      );
    }

    // Parse optional crop params (default: full image)
    const cropX = parseFloat((formData.get("cropX") as string) || "0") || 0;
    const cropY = parseFloat((formData.get("cropY") as string) || "0") || 0;
    const cropW = parseFloat((formData.get("cropW") as string) || "1") || 1;
    const cropH = parseFloat((formData.get("cropH") as string) || "1") || 1;
    const targetWidth = parseInt((formData.get("targetWidth") as string) || "728", 10) || 728;
    const targetHeight = parseInt((formData.get("targetHeight") as string) || "90", 10) || 90;

    // Validate crop params
    if (
      cropX < 0 || cropY < 0 || cropW <= 0 || cropH <= 0 ||
      cropX + cropW > 1.001 || cropY + cropH > 1.001
    ) {
      return NextResponse.json(
        { ok: false, error: "مختصات برش نامعتبر است" },
        { status: 400 },
      );
    }

    // Validate target dimensions
    if (targetWidth < 50 || targetHeight < 50 || targetWidth > 2000 || targetHeight > 2000) {
      return NextResponse.json(
        { ok: false, error: "ابعاد هدف نامعتبر است" },
        { status: 400 },
      );
    }

    // Read the uploaded file into a buffer
    const bytes = await file.arrayBuffer();
    const inputBuffer = Buffer.from(bytes);

    // Get original image metadata
    const metadata = await sharp(inputBuffer).metadata();
    const origWidth = metadata.width || 1;
    const origHeight = metadata.height || 1;

    // Compute absolute crop region (in pixels of original image)
    const absX = Math.min(Math.round(cropX * origWidth), origWidth - 1);
    const absY = Math.min(Math.round(cropY * origHeight), origHeight - 1);
    const absW = Math.max(1, Math.min(Math.round(cropW * origWidth), origWidth - absX));
    const absH = Math.max(1, Math.min(Math.round(cropH * origHeight), origHeight - absY));

    // Ensure directory exists
    const uploadDir = join(process.cwd(), "public", "uploads", "ads");
    try {
      mkdirSync(uploadDir, { recursive: true });
    } catch {
      // Directory already exists
    }

    // Generate unique filename (output is always WebP)
    const filename = `${randomUUID()}.webp`;
    const filepath = join(uploadDir, filename);

    // Process: crop → resize → WebP compression
    await sharp(inputBuffer)
      .extract({ left: absX, top: absY, width: absW, height: absH })
      .resize(targetWidth, targetHeight, {
        fit: "cover",
        position: "center",
      })
      .webp({ quality: 82, effort: 4 })
      .toFile(filepath);

    // Get output file size
    const stats = statSync(filepath);

    // Return public URL — use /api/files/ prefix for production compatibility
    // (Next.js production mode doesn't serve files added after build from /public/)
    const url = `/api/files/uploads/ads/${filename}`;

    return NextResponse.json({
      ok: true,
      url,
      filename,
      size: stats.size,
      width: targetWidth,
      height: targetHeight,
      originalSize: file.size,
      compressionRatio: file.size > 0 ? Math.round((1 - stats.size / file.size) * 100) : 0,
    });
  } catch (err: any) {
    console.error("Ad banner upload error:", err);
    return NextResponse.json(
      { ok: false, error: `خطا در پردازش تصویر: ${err.message || "نامشخص"}` },
      { status: 500 },
    );
  }
}
