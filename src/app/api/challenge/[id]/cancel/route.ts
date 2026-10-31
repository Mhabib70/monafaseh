import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { cancelChallenge } from "@/lib/challenge-store";

// POST /api/challenge/[id]/cancel — لغو چالش من
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

    const success = cancelChallenge(id, user.id);
    if (!success) {
      return NextResponse.json(
        { ok: false, error: "چالش پیدا نشد" },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Challenge cancel error:", error);
    return NextResponse.json(
      { ok: false, error: "خطا در لغو چالش" },
      { status: 500 },
    );
  }
}
