import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { db } from "@/lib/db";

// POST /api/blog/[id]/dislike — دیس‌لایک پست
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

    await db.blogPost.update({
      where: { id },
      data: { dislikes: { increment: 1 } },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "خطا" }, { status: 500 });
  }
}
