import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import { join, extname } from "path";
import { existsSync } from "fs";

// GET /api/files/[...path] — سرو فایل‌های آپلودشده
// این route برای حل مشکل Next.js production mode است که فقط فایل‌های
// موجود هنگام build را سرو می‌کند. فایل‌های جدید (مثل آپلود بنر) از
// این طریق سرو می‌شوند.
//
// امنیت: فقط فایل‌های داخل public/uploads/ قابل دسترسی هستند.

const CONTENT_TYPES: Record<string, string> = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path: pathParts } = await params;

    // Security: only allow paths under uploads/
    if (pathParts.length === 0 || pathParts[0] !== "uploads") {
      return new NextResponse("Not found", { status: 404 });
    }

    // Prevent path traversal (.. in path)
    const safePath = pathParts.filter((p) => !p.includes("..") && !p.includes("/"));
    if (safePath.length !== pathParts.length) {
      return new NextResponse("Not found", { status: 404 });
    }

    const filePath = join(process.cwd(), "public", ...safePath);

    // Check file exists
    if (!existsSync(filePath)) {
      return new NextResponse("Not found", { status: 404 });
    }

    // Check it's a file (not directory)
    const stats = await stat(filePath);
    if (!stats.isFile()) {
      return new NextResponse("Not found", { status: 404 });
    }

    // Read file
    const buffer = await readFile(filePath);

    // Determine content type
    const ext = extname(filePath).toLowerCase();
    const contentType = CONTENT_TYPES[ext] || "application/octet-stream";

    // Return with cache headers (1 year for static uploads)
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(buffer.length),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("File serve error:", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
