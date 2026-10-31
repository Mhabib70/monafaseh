import { NextResponse } from "next/server";

// GET /api/health — health check endpoint برای Docker و monitoring
// برمی‌گرداند: { ok: true, status: "healthy", timestamp }
export async function GET() {
  return NextResponse.json({
    ok: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}
