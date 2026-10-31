import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { db } from "@/lib/db";
import { acceptChallenge } from "@/lib/challenge-store";
import { generateJitsiRoomName } from "@/lib/noorcraft/constants";

// POST /api/challenge/[id]/accept — قبول چالش
// وقتی کاربری چالش دیگری را قبول می‌کند، یک محفل تلاوت جدید ساخته می‌شود
// و هر دو کاربر به session-room هدایت می‌شوند.
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

    const challenge = acceptChallenge(id, {
      userId: user.id,
      fullName: user.fullName,
      avatarColor: user.avatarColor,
      avatarUrl: user.avatarUrl,
      gender: user.gender || "male",
      recitationType: user.recitationType || "ترتیل",
    });

    if (!challenge) {
      return NextResponse.json(
        { ok: false, error: "این چالش دیگر فعال نیست یا توسط شخص دیگری قبول شده" },
        { status: 404 },
      );
    }

    // ساخت محفل تلاوت جدید برای این چالش
    const jitsiRoom = generateJitsiRoomName("monafaseh");
    const genderRestriction = challenge.gender || user.gender || "male";

    const newSession = await db.recitationSession.create({
      data: {
        title: `چالش رقابت: ${challenge.fullName} vs ${user.fullName}`,
        hostId: challenge.userId,
        recitationType: challenge.recitationType,
        reciterNationality: "iranian",
        favoriteReciter: "چالش رقابتی",
        surah: "—",
        capacity: 10,
        status: "open",
        genderRestriction,
        passwordProtected: false,
        jitsiRoom,
      },
    });

    // افزودن هر دو کاربر به‌عنوان participant
    await db.sessionParticipant.create({
      data: { sessionId: newSession.id, userId: challenge.userId },
    });
    await db.sessionParticipant.create({
      data: { sessionId: newSession.id, userId: user.id },
    });

    // ذخیره sessionId در challenge تا announceکننده هم بتواند آن را بگیرد
    challenge.sessionId = newSession.id;

    return NextResponse.json({
      ok: true,
      challenge,
      sessionId: newSession.id,
      jitsiRoom,
    });
  } catch (error) {
    console.error("Challenge accept error:", error);
    return NextResponse.json(
      { ok: false, error: "خطا در قبول چالش" },
      { status: 500 },
    );
  }
}
