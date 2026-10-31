// Isolated SQLite regression suite; never reads/writes the application's database.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const ts = require('typescript');
const { PrismaClient } = require('@prisma/client');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(
  fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }
).outputText, filename);
const saman = require('../src/lib/payment/saman.ts');
const { finalizePayment } = require('../src/lib/payment/finalize.ts');
const project = path.resolve(__dirname, '../..');
const temp = fs.mkdtempSync(path.join(project, '.agents/payment-test-'));
const databaseUrl = 'file:' + path.join(temp, 'test.db').replaceAll('\\', '/');
const db = new PrismaClient({ datasourceUrl: databaseUrl });
const db2 = new PrismaClient({ datasourceUrl: databaseUrl });
const Module = require('node:module');
const originalLoad = Module._load;
Module._load = function (name, ...args) {
  if (name === '@/lib/db') return { db };
  if (name === '@/lib/payment/saman') return saman;
  if (name === '@/lib/payment/finalize') return { finalizePayment };
  if (name === '@/lib/get-current-user') return { getCurrentUser: async () => user };
  return originalLoad.call(this, name, ...args);
};
const callback = require('../src/app/api/payment/callback/route.ts');
const create = require('../src/app/api/payment/create/route.ts');
Module._load = originalLoad;
const originalFetch = global.fetch;
const originalEnv = { terminal: process.env.SAMAN_TERMINAL_ID, site: process.env.SITE_URL };
let user;
let sequence = 0;
before(async () => {
  const pushed = spawnSync(process.execPath, [require.resolve('prisma/build/index.js'), 'db', 'push',
    '--schema', path.join(project, 'monafaseh/prisma/schema.prisma'), '--skip-generate'],
    { env: { ...process.env, DATABASE_URL: databaseUrl }, encoding: 'utf8' });
  assert.equal(pushed.status, 0, pushed.stderr || pushed.stdout);
  user = await db.user.create({ data: { email: 'payment-test@example.invalid', fullName: 'Payment test' } });
});
after(async () => {
  global.fetch = originalFetch;
  for (const [key, value] of [['SAMAN_TERMINAL_ID', originalEnv.terminal], ['SITE_URL', originalEnv.site]]) {
    if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
  await Promise.all([db.$disconnect(), db2.$disconnect()]);
  if (!temp.startsWith(path.join(project, '.agents') + path.sep)) throw new Error('Unsafe cleanup path');
  fs.rmSync(temp, { recursive: true });
});
function configure() { process.env.SAMAN_TERMINAL_ID = '123456'; process.env.SITE_URL = 'https://merchant.example'; }
function bank(data, status = 200) { global.fetch = async () => new Response(JSON.stringify(data), { status }); }
function detail(overrides = {}) {
  return { Success: true, ResultCode: 0, TransactionDetail: {
    RefNum: 'bank-ref', TerminalNumber: 123456, OrginalAmount: 500000, StraceNo: '123', ...overrides,
  } };
}
async function order(ref, credits = 1) {
  sequence++;
  return db.payment.create({ data: { userId: user.id, amount: 50000, credits, plan: 'trial',
    samanResNum: 'order-' + sequence, samanRefNum: ref, samanToken: 'token-' + sequence } });
}
test('missing terminal and HTTP/localhost callback fail closed', () => {
  configure(); delete process.env.SAMAN_TERMINAL_ID;
  assert.throws(saman.gatewayConfig);
  configure(); process.env.SITE_URL = 'http://localhost:3423';
  assert.throws(saman.gatewayConfig);
});
test('token request uses SEP field names, IRR, and fixed HTTPS callback', async () => {
  configure(); let payload;
  global.fetch = async (url, options) => {
    assert.equal(url, saman.SAMAN_TOKEN_URL); payload = JSON.parse(options.body);
    assert.ok(options.signal); return Response.json({ status: 1, token: 'real-bank-token' });
  };
  const result = await saman.requestPaymentToken({ resNum: 'order', amountRial: 500000,
    redirectUrl: 'https://merchant.example/api/payment/callback' });
  assert.equal(result.token, 'real-bank-token');
  assert.deepEqual(payload, { action: 'token', TerminalId: 123456, Amount: 500000,
    ResNum: 'order', RedirectUrl: 'https://merchant.example/api/payment/callback' });
  bank({ status: 1, token: 'untrusted' }, 500);
  assert.equal((await saman.requestPaymentToken({ resNum: 'order', amountRial: 500000,
    redirectUrl: 'https://merchant.example/api/payment/callback' })).ok, false);
});
test('verification checks bank amount, reference, terminal and result', async () => {
  configure();
  for (const mismatch of [{ OrginalAmount: 1 }, { RefNum: 'other' }, { TerminalNumber: 987 }, { OrginalAmount: undefined }]) {
    bank(detail(mismatch)); assert.equal((await saman.verifyTransaction('bank-ref', 500000)).success, false);
  }
  bank({ Success: true, ResultCode: 0 });
  assert.equal((await saman.verifyTransaction('bank-ref', 500000)).success, false);
  bank(detail()); assert.equal((await saman.verifyTransaction('bank-ref', 500000)).success, true);
  bank({ ...detail(), ResultCode: 2, Success: false });
  assert.equal((await saman.verifyTransaction('bank-ref', 500000)).success, true);
  bank({ ResultCode: 2 }); assert.equal((await saman.verifyTransaction('bank-ref', 500000)).success, false);
  global.fetch = async () => { throw new Error('offline'); };
  assert.equal((await saman.verifyTransaction('bank-ref', 500000)).success, false);
});
test('DEMO receipts cannot grant credit or contact the bank', async () => {
  configure(); global.fetch = async () => { throw new Error('must not call bank'); };
  assert.equal((await saman.verifyTransaction('DEMO-123', 500000)).success, false);
});
test('one dropped connection is retried with the same bank request', async () => {
  configure(); let calls = 0; const payloads = [];
  global.fetch = async (url, options) => {
    calls++; payloads.push(options.body);
    if (calls === 1) throw new Error('connection reset');
    return Response.json(detail());
  };
  assert.equal((await saman.verifyTransaction('bank-ref', 500000)).success, true);
  assert.equal(calls, 2); assert.equal(payloads[0], payloads[1]);
});
test('simultaneous callbacks credit an order once and preserve ledger', async () => {
  const payment = await order('repeat-ref', 10);
  const previous = (await db.user.findUniqueOrThrow({ where: { id: user.id } })).creditBalance;
  const results = await Promise.all([finalizePayment(db, payment.id, 'repeat-ref'),
    finalizePayment(db2, payment.id, 'repeat-ref')]);
  assert.equal(results.filter(r => !r.alreadyPaid).length, 1);
  await finalizePayment(db, payment.id, 'repeat-ref');
  assert.equal((await db.user.findUniqueOrThrow({ where: { id: user.id } })).creditBalance, previous + 10);
  assert.equal(await db.creditTransaction.count({ where: { paymentId: payment.id } }), 1);
});
test('two orders cannot reuse a receipt or overwrite each other balance', async () => {
  const one = await order('separate-one', 2); const two = await order('separate-two', 3);
  const previous = (await db.user.findUniqueOrThrow({ where: { id: user.id } })).creditBalance;
  await assert.rejects(order('separate-one'), error => error.code === 'P2002');
  await Promise.all([finalizePayment(db, one.id, 'separate-one'), finalizePayment(db2, two.id, 'separate-two')]);
  assert.equal((await db.user.findUniqueOrThrow({ where: { id: user.id } })).creditBalance, previous + 5);
});
test('ledger failure rolls payment status and balance back', async () => {
  const payment = await order('rollback-ref');
  const previous = (await db.user.findUniqueOrThrow({ where: { id: user.id } })).creditBalance;
  const failing = { $transaction: fn => db.$transaction(tx => fn({ ...tx,
    creditTransaction: { create: async () => { throw new Error('ledger failure'); } } })) };
  await assert.rejects(finalizePayment(failing, payment.id, 'rollback-ref'));
  assert.equal((await db.payment.findUniqueOrThrow({ where: { id: payment.id } })).status, 'pending');
  assert.equal((await db.user.findUniqueOrThrow({ where: { id: user.id } })).creditBalance, previous);
});
test('unconfigured create cannot produce a demo payment', async () => {
  configure(); delete process.env.SAMAN_TERMINAL_ID;
  const before = await db.payment.count();
  const response = await create.POST({ json: async () => ({ plan: 'trial' }) });
  assert.equal(response.status, 503);
  assert.equal(await db.payment.count(), before);
});
test('callback rejects forged tokens, missing state, wrong amount and DEMO receipts', async () => {
  configure(); const payment = await order(null);
  global.fetch = async () => { throw new Error('must not contact bank'); };
  const url = new URL('https://merchant.example/api/payment/callback');
  for (const invalid of [{ Token: 'fake' }, { State: '' }, { Amount: '1' }, { RefNum: 'DEMO-12' }]) {
    url.search = new URLSearchParams({ ResNum: payment.samanResNum, RefNum: 'new-ref',
      Token: payment.samanToken, State: 'OK', Amount: '500000', ...invalid }).toString();
    const response = await callback.GET({ nextUrl: url });
    assert.equal(response.status, 400);
  }
  assert.equal(await db.creditTransaction.count({ where: { paymentId: payment.id } }), 0);
});
test('real-shaped bank callback verifies and credits once, then safely replays', async () => {
  configure(); const payment = await order(null, 4); bank(detail());
  const form = new FormData();
  for (const [key, value] of Object.entries({ ResNum: payment.samanResNum, RefNum: 'bank-ref',
    Token: payment.samanToken, State: 'OK', Amount: '500000', TerminalId: '123456' })) form.set(key, value);
  const previous = (await db.user.findUniqueOrThrow({ where: { id: user.id } })).creditBalance;
  assert.equal((await callback.POST({ formData: async () => form })).status, 200);
  assert.equal((await callback.POST({ formData: async () => form })).status, 200);
  assert.equal((await db.user.findUniqueOrThrow({ where: { id: user.id } })).creditBalance, previous + 4);
  assert.equal(await db.creditTransaction.count({ where: { paymentId: payment.id } }), 1);
  const second = await order(null); form.set('ResNum', second.samanResNum); form.set('Token', second.samanToken);
  assert.equal((await callback.POST({ formData: async () => form })).status, 409);
});
test('additive migration is repeatable and preserves existing balances and records', async () => {
  const snapshot = { count: await db.payment.count(), balance: (await db.user.findUniqueOrThrow({ where: { id: user.id } })).creditBalance };
  for (let i = 0; i < 2; i++) {
    const migrated = spawnSync(process.execPath, [path.join(__dirname, 'migrate-payment.cjs')],
      { env: { ...process.env, DATABASE_URL: databaseUrl }, encoding: 'utf8' });
    assert.equal(migrated.status, 0, migrated.stderr || migrated.stdout);
  }
  assert.equal(await db.payment.count(), snapshot.count);
  assert.equal((await db.user.findUniqueOrThrow({ where: { id: user.id } })).creditBalance, snapshot.balance);
});
