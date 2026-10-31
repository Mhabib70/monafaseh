import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { db } from "@/lib/db";

// GET /api/blog — لیست پست‌های منتشرشده
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "all";

    const where: any = { isPublished: true };
    if (category !== "all") where.category = category;

    const posts = await db.blogPost.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { comments: true } },
      },
    });

    const formatted = posts.map((p) => ({
      id: p.id,
      title: p.title,
      excerpt: p.excerpt,
      content: p.content,
      imageUrl: p.imageUrl,
      category: p.category,
      tags: p.tags ? JSON.parse(p.tags) : [],
      views: p.views,
      likes: p.likes,
      dislikes: p.dislikes,
      commentCount: p._count.comments,
      createdAt: p.createdAt.getTime(),
    }));

    return NextResponse.json({ ok: true, posts: formatted });
  } catch (error) {
    console.error("Blog fetch error:", error);
    return NextResponse.json({ ok: false, error: "خطا در دریافت پست‌ها" }, { status: 500 });
  }
}

// POST /api/blog — ساخت پست جدید (فقط ادمین)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ ok: false, error: "دسترسی غیرمجاز" }, { status: 403 });
    }

    const body = await request.json();
    const { title, excerpt, content, imageUrl, category, tags, isPublished } = body;

    if (!title || !content) {
      return NextResponse.json({ ok: false, error: "عنوان و محتوا الزامی است" }, { status: 400 });
    }

    const post = await db.blogPost.create({
      data: {
        title,
        excerpt: excerpt || content.slice(0, 150),
        content,
        imageUrl: imageUrl || null,
        category: category || "general",
        tags: tags ? JSON.stringify(tags) : null,
        isPublished: isPublished !== false,
      },
    });

    return NextResponse.json({ ok: true, postId: post.id });
  } catch (error) {
    console.error("Blog create error:", error);
    return NextResponse.json({ ok: false, error: "خطا در ساخت پست" }, { status: 500 });
  }
}
