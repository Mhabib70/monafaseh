import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { db } from "@/lib/db";

// ============================================================
// WebRTC Signaling — جایگزین broker خارجی PeerJS
// ------------------------------------------------------------
// وضعیت سیگنالینگ هر جلسه در خود رکورد RecitationSession نگه‌داری
// می‌شود (بدون سرور اضافه). هر دو طرف هر ۱.۵ ثانیه GET می‌زنند و
// با POST وضعیت را به‌روز می‌کنند.
//
// ساختار فیلدها (JSON): برای پشتیبانی از چند مهمان، map با کلید
// connId ذخیره می‌شود:
//   signalOffer         { [connId]: RTCSessionDescription }
//   signalAnswer        { [connId]: RTCSessionDescription }
//   signalIceCandidates { [connId]: RTCIceCandidate[] }  (کاندیدهای میزبان)
//   guestIceCandidates  { [connId]: RTCIceCandidate[] }  (کاندیدهای مهمان)
// ============================================================

function parseMap(raw: string | null | undefined): Record<string, any> {
  if (!raw) return {};
  try {
    const v = JSON.parse(raw);
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
}

// GET /api/sessions/[id]/signal — خواندن وضعیت سیگنالینگ
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "ورود لازم است" }, { status: 401 });
    }

    const { id } = await params;
    const session = await db.recitationSession.findUnique({
      where: { id },
      select: {
        signalOffer: true,
        signalAnswer: true,
        signalIceCandidates: true,
        guestIceCandidates: true,
        signalUpdatedAt: true,
      },
    });

    if (!session) {
      return NextResponse.json({ ok: false, error: "جلسه پیدا نشد" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      signal: {
        offers: parseMap(session.signalOffer),
        answers: parseMap(session.signalAnswer),
        hostCandidates: parseMap(session.signalIceCandidates),
        guestCandidates: parseMap(session.guestIceCandidates),
        updatedAt: session.signalUpdatedAt?.getTime() ?? 0,
      },
    });
  } catch (error) {
    console.error("[Signal] GET error:", error);
    return NextResponse.json({ ok: false, error: "خطای سرور" }, { status: 500 });
  }
}

// POST /api/sessions/[id]/signal — نوشتن offer/answer/candidates
// body: { type: "offer"|"answer"|"host-candidates"|"guest-candidates"|"clear",
//         connId?: string, sdp?: any, candidates?: any[] }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "ورود لازم است" }, { status: 401 });
    }

    const { id } = await params;
    const session = await db.recitationSession.findUnique({ where: { id } });
    if (!session) {
      return NextResponse.json({ ok: false, error: "جلسه پیدا نشد" }, { status: 404 });
    }

    const body = await request.json();
    const { type, connId = "default", sdp, candidates } = body;

    if (!type) {
      return NextResponse.json({ ok: false, error: "type الزامی است" }, { status: 400 });
    }

    // پاک‌سازی کامل سیگنالینگ (مثلاً هنگام خروج میزبان)
    if (type === "clear") {
      await db.recitationSession.update({
        where: { id },
        data: {
          signalOffer: null,
          signalAnswer: null,
          signalIceCandidates: null,
          guestIceCandidates: null,
          signalUpdatedAt: new Date(),
        },
      });
      return NextResponse.json({ ok: true });
    }

    if (type === "offer" || type === "answer") {
      if (!sdp) {
        return NextResponse.json({ ok: false, error: "sdp الزامی است" }, { status: 400 });
      }
      const field = type === "offer" ? "signalOffer" : "signalAnswer";
      const map = parseMap((session as any)[field]);
      map[connId] = sdp;
      // هنگام نوشتن offer جدید، جواب/کاندیدهای همان اتصال پاک شود
      if (type === "offer") {
        const answers = parseMap(session.signalAnswer);
        delete answers[connId];
        const hostC = parseMap(session.signalIceCandidates);
        delete hostC[connId];
        const guestC = parseMap(session.guestIceCandidates);
        delete guestC[connId];
        await db.recitationSession.update({
          where: { id },
          data: {
            signalOffer: JSON.stringify(map),
            signalAnswer: Object.keys(answers).length
              ? JSON.stringify(answers)
              : null,
            signalIceCandidates: Object.keys(hostC).length
              ? JSON.stringify(hostC)
              : null,
            guestIceCandidates: Object.keys(guestC).length
              ? JSON.stringify(guestC)
              : null,
            signalUpdatedAt: new Date(),
          },
        });
      } else {
        await db.recitationSession.update({
          where: { id },
          data: { [field]: JSON.stringify(map), signalUpdatedAt: new Date() } as any,
        });
      }
      return NextResponse.json({ ok: true });
    }

    if (type === "host-candidates" || type === "guest-candidates") {
      if (!Array.isArray(candidates)) {
        return NextResponse.json({ ok: false, error: "candidates الزامی است" }, { status: 400 });
      }
      const field =
        type === "host-candidates" ? "signalIceCandidates" : "guestIceCandidates";
      const map = parseMap((session as any)[field]);
      const existing = Array.isArray(map[connId]) ? map[connId] : [];
      // dedup بر اساس combo‌ی candidate
      const seen = new Set(existing.map((c: any) => c?.candidate));
      const merged = [
        ...existing,
        ...candidates.filter((c: any) => !seen.has(c?.candidate)),
      ];
      map[connId] = merged;
      await db.recitationSession.update({
        where: { id },
        data: { [field]: JSON.stringify(map), signalUpdatedAt: new Date() } as any,
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "type نامعتبر" }, { status: 400 });
  } catch (error) {
    console.error("[Signal] POST error:", error);
    return NextResponse.json({ ok: false, error: "خطای سرور" }, { status: 500 });
  }
}
