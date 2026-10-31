import type { PrismaClient } from "@prisma/client";

// The conditional write, balance increment and ledger insert share one transaction.
// Concurrent/repeated callbacks can therefore credit each payment at most once.
export async function finalizePayment(
  db: PrismaClient, paymentId: string, refNum: string, traceNo?: string,
) {
  return db.$transaction(async (tx) => {
    const claimed = await tx.payment.updateMany({
      where: { id: paymentId, status: { in: ["pending", "failed"] }, samanRefNum: refNum },
      data: { status: "paid", samanTraceNo: traceNo || null },
    });
    const payment = await tx.payment.findUniqueOrThrow({ where: { id: paymentId } });
    if (claimed.count === 0) {
      if (payment.status === "paid" && payment.samanRefNum === refNum) return { alreadyPaid: true };
      throw new Error("Payment is not eligible for credit");
    }
    // حمایت مالی (credits = 0) فقط ثبت وضعیت پرداخت دارد؛ عملیات اعتباری نمی‌شود
    if (payment.credits > 0) {
      const user = await tx.user.update({
        where: { id: payment.userId }, data: { creditBalance: { increment: payment.credits } },
        select: { creditBalance: true },
      });
      await tx.creditTransaction.create({ data: {
        userId: payment.userId, type: "purchase", amount: payment.credits,
        balanceAfter: user.creditBalance, paymentId: payment.id,
        description: `خرید ${payment.credits} امتیاز (پلن ${payment.plan})`,
      } });
    }
    return { alreadyPaid: false };
  }, { maxWait: 10000, timeout: 10000 });
}
