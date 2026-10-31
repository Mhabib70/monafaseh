import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { db } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import sharp from "sharp";

// ============================================================
// گالری تصاویر پروفایل
//   POST  — آپلود تصویر (خودکار فشرده و resize: ۱۴۴۰px + thumb ۴۰۰px) — حداکثر ۱۰
//   DELETE — حذف تصویر با { url }
// فقط صاحب پروفایل مجاز است.
// ============================================================

const MAX_GALLERY = 10;

async function readGallery(userId: string): Promise<{ url: string; thumb: string }[]> {
  const u = await db.user.findUnique({ where: { id: userId }, select: { gallery: true } });
  try {
    return u?.gallery ? JSON.parse(u.gallery) : [];
  } catch {
    return [];
  }
}

async function writeGallery(userId: string, gallery: { url: string; thumb: string }[]) {
  await db.user.update({
    where: { id: userId },
    data: { gallery: JSON.stringify(gallery) },
  });
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "ورود لازم است" }, { status: 401 });
    }

    const form = await request.formData();
    const file = form.get("image");
    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "تصویری ارسال نشده است" }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { ok: false, error: "حجم فایل نباید بیشتر از ۵ مگابایت باشد" },
        { status: 400 },
      );
    }

    const gallery = await readGallery(user.id);
    if (gallery.length >= MAX_GALLERY) {
      return NextResponse.json(
        { ok: false, error: `حداکثر ${MAX_GALLERY.toLocaleString("fa-IR")} تصویر مجاز است — ابتدا یکی را حذف کنید` },
        { status: 400 },
      );
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const main = await sharp(buf)
      .rotate()
      .resize({ width: 1440, withoutEnlargement: true })
      .jpeg({ quality: 82 })
      .toBuffer();
    const thumb = await sharp(buf)
      .rotate()
      .resize(400, 400, { fit: "cover" })
      .jpeg({ quality: 78 })
      .toBuffer();

    const dir = path.join(process.cwd(), "public", "uploads", "gallery", user.id);
    await mkdir(dir, { recursive: true });
    const base = `g-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    await writeFile(path.join(dir, base + ".jpg"), main);
    await writeFile(path.join(dir, base + ".t.jpg"), thumb);

    const item = {
      url: `/api/files/uploads/gallery/${user.id}/${base}.jpg`,
      thumb: `/api/files/uploads/gallery/${user.id}/${base}.t.jpg`,
    };
    gallery.push(item);
    await writeGallery(user.id, gallery);

    return NextResponse.json({ ok: true, item, count: gallery.length });
  } catch (error) {
    console.error("Gallery upload error:", error);
    return NextResponse.json({ ok: false, error: "خطا در آپلود تصویر" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "ورود لازم است" }, { status: 401 });
    }
    const body = await request.json().catch(() => null);
    const url = String(body?.url ?? "");
    if (!url) {
      return NextResponse.json({ ok: false, error: "آدرس تصویر الزامی است" }, { status: 400 });
    }

    const gallery = await readGallery(user.id);
    const item = gallery.find((g) => g.url === url || g.thumb === url);
    if (!item) {
      return NextResponse.json({ ok: false, error: "تصویر یافت نشد" }, { status: 404 });
    }

    // حذف فایل از دیسک (مسیر امن — فقط داخل uploads/gallery/{userId})
    for (const u of [item.url, item.thumb]) {
      const m = u.match(/^\/api\/files\/uploads\/gallery\/([^/]+)\/(.+)$/);
      if (m && m[1] === user.id && !m[2].includes("..")) {
        await unlink(
          path.join(process.cwd(), "public", "uploads", "gallery", user.id, m[2]),
        ).catch(() => {});
      }
    }

    await writeGallery(
      user.id,
      gallery.filter((g) => g.url !== item.url),
    );
    return NextResponse.json({ ok: true, count: gallery.length - 1 });
  } catch (error) {
    console.error("Gallery delete error:", error);
    return NextResponse.json({ ok: false, error: "خطای سرور" }, { status: 500 });
  }
}

// مسیر فایل برای حذف فیزیکی
async function unlink(p: string) {
  const { unlink: rm } = await import("fs/promises");
  await rm(p).catch(() => {});
}
