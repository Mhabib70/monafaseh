import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { db } from "@/lib/db";

// GET /api/blog/[id]/comments — لیست کامنت‌ها
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const comments = await db.blogComment.findMany({
      where: { postId: id },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, fullName: true, avatarColor: true, avatarUrl: true },
        },
      },
    });

    return NextResponse.json({
      ok: true,
      comments: comments.map((c) => ({
        id: c.id,
        userId: c.userId,
        userName: c.user.fullName,
        avatarColor: c.user.avatarColor,
        avatarUrl: c.user.avatarUrl,
        text: c.text,
        likes: c.likes,
        createdAt: c.createdAt.getTime(),
      })),
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "خطا" }, { status: 500 });
  }
}

// POST /api/blog/[id]/comments — افزودن کامنت
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "ابتدا وارد شوید" }, { status: 401 });
    }

    const body = await request.json();
    const { text } = body;

    if (!text || !text.trim()) {
      return NextResponse.json({ ok: false, error: "متن کامنت الزامی است" }, { status: 400 });
    }

    const comment = await db.blogComment.create({
      data: {
        postId: id,
        userId: user.id,
        userName: user.fullName,
        avatarColor: user.avatarColor,
        avatarUrl: user.avatarUrl,
        text: text.trim(),
      },
    });

    return NextResponse.json({
      ok: true,
      comment: {
        id: comment.id,
        userId: user.id,
        userName: user.fullName,
        avatarColor: user.avatarColor,
        avatarUrl: user.avatarUrl,
        text: comment.text,
        likes: 0,
        createdAt: comment.createdAt.getTime(),
      },
    });
  } catch (error) {
    console.error("Comment create error:", error);
    return NextResponse.json({ ok: false, error: "خطا در ثبت کامنت" }, { status: 500 });
  }
}
