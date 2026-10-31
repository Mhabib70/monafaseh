import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { declineInvitation } from "@/lib/invitation-store";

// POST /api/invitations/[id]/decline — رد دعوت
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "ابتدا وارد شوید" },
        { status: 401 },
      );
    }

    const invitation = declineInvitation(id, user.id);
    if (!invitation) {
      return NextResponse.json(
        { ok: false, error: "دعوت پیدا نشد یا قبلاً پاسخ داده شده" },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, invitation });
  } catch (error) {
    console.error("Invitation decline error:", error);
    return NextResponse.json(
      { ok: false, error: "خطا در رد دعوت" },
      { status: 500 },
    );
  }
}
