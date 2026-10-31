import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { getMyChallenge } from "@/lib/challenge-store";

// GET /api/challenge/my — وضعیت چالش من (برای polling)
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "ابتدا وارد شوید" },
        { status: 401 },
      );
    }

    const myChallenge = getMyChallenge(user.id);
    return NextResponse.json({ ok: true, challenge: myChallenge });
  } catch (error) {
    console.error("My challenge error:", error);
    return NextResponse.json(
      { ok: false, error: "خطا در دریافت وضعیت چالش" },
      { status: 500 },
    );
  }
}
