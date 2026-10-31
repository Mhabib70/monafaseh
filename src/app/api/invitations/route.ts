import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { createInvitation, getPendingInvitations, getRespondedInvitations, markInvitationSeen } from "@/lib/invitation-store";

// GET /api/invitations — pending invitations for current user
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "ابتدا وارد شوید" },
        { status: 401 },
      );
    }

    const pending = getPendingInvitations(user.id);
    const responded = getRespondedInvitations(user.id);

    // Mark responded ones as seen (so they don't show again)
    responded.forEach((r) => markInvitationSeen(r.id));

    return NextResponse.json({
      ok: true,
      pending,
      // responded is returned once so the inviter sees "accepted/declined"
      responded,
    });
  } catch (error) {
    console.error("Invitations fetch error:", error);
    return NextResponse.json(
      { ok: false, error: "خطا در دریافت دعوت‌ها" },
      { status: 500 },
    );
  }
}

// POST /api/invitations — send an invitation
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "ابتدا وارد شوید" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { inviteeId, inviteeName, sessionId, sessionTitle, jitsiRoom } = body;

    if (!inviteeId || !sessionId) {
      return NextResponse.json(
        { ok: false, error: "اطلاعات دعوت ناقص است" },
        { status: 400 },
      );
    }

    const invitation = createInvitation({
      sessionId,
      sessionTitle,
      jitsiRoom,
      inviterId: user.id,
      inviterName: user.fullName,
      inviterAvatarColor: user.avatarColor,
      inviteeId,
      inviteeName,
    });

    return NextResponse.json({ ok: true, invitation });
  } catch (error) {
    console.error("Invitation create error:", error);
    return NextResponse.json(
      { ok: false, error: "خطا در ارسال دعوت" },
      { status: 500 },
    );
  }
}
