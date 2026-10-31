import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { announceChallenge, getActiveChallenges } from "@/lib/challenge-store";

// GET /api/challenge — لیست چالش‌های فعال (در انتظار رقیب)
export async function GET() {
  try {
    const user = await getCurrentUser();
    const active = getActiveChallenges(user?.id);
    return NextResponse.json({ ok: true, challenges: active });
  } catch (error) {
    console.error("Challenge list error:", error);
    return NextResponse.json(
      { ok: false, error: "خطا در دریافت چالش‌ها" },
      { status: 500 },
    );
  }
}

// POST /api/challenge — اعلام آمادگی برای چالش
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "ابتدا وارد شوید" },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const recitationType = body?.recitationType || user.recitationType || "ترتیل";

    const challenge = announceChallenge({
      userId: user.id,
      fullName: user.fullName,
      avatarColor: user.avatarColor,
      avatarUrl: user.avatarUrl,
      gender: user.gender || "male",
      recitationType,
    });

    return NextResponse.json({ ok: true, challenge });
  } catch (error) {
    console.error("Challenge announce error:", error);
    return NextResponse.json(
      { ok: false, error: "خطا در اعلام آمادگی" },
      { status: 500 },
    );
  }
}
