import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { db } from "@/lib/db";

// GET /api/blog/[id] — دریافت یک پست با کامنت‌ها
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const post = await db.blogPost.findUnique({
      where: { id },
      include: {
        comments: {
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: { id: true, fullName: true, avatarColor: true, avatarUrl: true },
            },
          },
        },
      },
    });

    if (!post || !post.isPublished) {
      return NextResponse.json({ ok: false, error: "پست پیدا نشد" }, { status: 404 });
    }

    // Increment views
    await db.blogPost.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    const formatted = {
      id: post.id,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      imageUrl: post.imageUrl,
      category: post.category,
      tags: post.tags ? JSON.parse(post.tags) : [],
      views: post.views + 1,
      likes: post.likes,
      dislikes: post.dislikes,
      createdAt: post.createdAt.getTime(),
      comments: post.comments.map((c) => ({
        id: c.id,
        userId: c.userId,
        userName: c.user.fullName,
        avatarColor: c.user.avatarColor,
        avatarUrl: c.user.avatarUrl,
        text: c.text,
        likes: c.likes,
        createdAt: c.createdAt.getTime(),
      })),
    };

    return NextResponse.json({ ok: true, post: formatted });
  } catch (error) {
    console.error("Blog post fetch error:", error);
    return NextResponse.json({ ok: false, error: "خطا در دریافت پست" }, { status: 500 });
  }
}

// PUT /api/blog/[id] — ویرایش پست (فقط ادمین)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ ok: false, error: "دسترسی غیرمجاز" }, { status: 403 });
    }

    const body = await request.json();
    const { title, excerpt, content, imageUrl, category, tags, isPublished } = body;

    const post = await db.blogPost.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(excerpt && { excerpt }),
        ...(content && { content }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(category && { category }),
        ...(tags !== undefined && { tags: tags ? JSON.stringify(tags) : null }),
        ...(isPublished !== undefined && { isPublished }),
      },
    });

    return NextResponse.json({ ok: true, postId: post.id });
  } catch (error) {
    console.error("Blog update error:", error);
    return NextResponse.json({ ok: false, error: "خطا در ویرایش پست" }, { status: 500 });
  }
}

// DELETE /api/blog/[id] — حذف پست (فقط ادمین)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ ok: false, error: "دسترسی غیرمجاز" }, { status: 403 });
    }

    await db.blogPost.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Blog delete error:", error);
    return NextResponse.json({ ok: false, error: "خطا در حذف پست" }, { status: 500 });
  }
}
