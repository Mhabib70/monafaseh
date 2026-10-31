// Additive payment migration. No table reset, deletion or accept-data-loss flags.
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
(async () => {
  await db.$transaction(async tx => {
    for (const [table, column] of [['Payment', 'samanRefNum'], ['CreditTransaction', 'paymentId']]) {
      const duplicates = await tx.$queryRawUnsafe(`SELECT COUNT(*) AS count FROM
        (SELECT "${column}" FROM "${table}" WHERE "${column}" IS NOT NULL GROUP BY "${column}" HAVING COUNT(*) > 1)`);
      if (Number(duplicates[0].count) > 0) throw new Error('Duplicate payment records require reconciliation before migration');
    }
    const columns = await tx.$queryRawUnsafe('PRAGMA table_info("Payment")');
    if (!columns.some(column => column.name === 'samanToken')) {
      await tx.$executeRawUnsafe('ALTER TABLE "Payment" ADD COLUMN "samanToken" TEXT');
    }
    await tx.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "Payment_samanRefNum_key" ON "Payment"("samanRefNum")');
    await tx.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "Payment_samanToken_key" ON "Payment"("samanToken")');
    await tx.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "CreditTransaction_paymentId_key" ON "CreditTransaction"("paymentId")');
  });
  console.log('Payment migration complete (additive, existing records preserved)');
})().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => db.$disconnect());
