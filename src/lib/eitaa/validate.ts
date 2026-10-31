// ============================================================
// اعتبارسنجی initData برنامک ایتا — طبق مستندات رسمی
// https://developer.eitaa.com/docs/Develop/AuthorizationViaHash
// ------------------------------------------------------------
// ۱) initData به جفت‌های key=value تفکیک و hash جدا می‌شود
// ۲) جفت‌ها الفبایی مرتب و با خط جدید (\n) به هم می‌چسبند
// ۳) secret = HMAC_SHA256(key="WebAppData", message=bot_token)
// ۴) computed = HMAC_SHA256(key=secret, message=data_check_string) hex
// ۵) computed باید با hash دریافتی برابر باشد
// این کار حتماً باید سمت سرور انجام شود — هرگز سمت کلاینت نه.
// ============================================================
import crypto from "crypto";

export interface EitaaValidationResult {
  ok: boolean;
  reason?: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    username?: string;
  };
  authDate?: number;
}

const MAX_INIT_DATA_AGE_SEC = 24 * 60 * 60; // initData بیش از ۲۴ ساعت اعتبار ندارد

export function validateEitaaInitData(
  initData: string,
  botToken: string,
): EitaaValidationResult {
  if (!initData || !botToken) {
    return { ok: false, reason: "initData یا توکن برنامه خالی است" };
  }

  const params = new URLSearchParams(initData);
  const receivedHash = params.get("hash");
  if (!receivedHash) {
    return { ok: false, reason: "فیلد hash در initData نیست" };
  }
  params.delete("hash");

  // جفت‌های key=value با مقدار decode شده، مرتب الفبایی
  const pairs: string[] = [];
  for (const [key, value] of params.entries()) {
    pairs.push(`${key}=${value}`);
  }
  pairs.sort();
  const dataCheckString = pairs.join("\n");

  // کلید مشتق‌شده از توکن برنامه با ثابت WebAppData
  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();
  const computedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  if (computedHash !== receivedHash) {
    return { ok: false, reason: "امضای hash نامعتبر است" };
  }

  // انقضای داده (ضد replay)
  const authDate = parseInt(params.get("auth_date") ?? "0", 10);
  if (
    authDate &&
    Date.now() / 1000 - authDate > MAX_INIT_DATA_AGE_SEC
  ) {
    return { ok: false, reason: "initData منقضی شده است" };
  }

  // استخراج کاربر
  let rawUser: {
    id?: number | string;
    first_name?: string;
    last_name?: string;
    username?: string;
  } | null = null;
  try {
    rawUser = JSON.parse(params.get("user") ?? "null");
  } catch {
    rawUser = null;
  }

  if (!rawUser || rawUser.id === undefined) {
    return { ok: false, reason: "اطلاعات کاربر در initData نیست" };
  }

  return {
    ok: true,
    authDate: authDate || undefined,
    user: {
      // شناسه تا ۵۲ بیت است — بدون parseInt امن‌تر است
      id: String(rawUser.id),
      firstName: rawUser.first_name ?? "",
      lastName: rawUser.last_name ?? "",
      username: rawUser.username,
    },
  };
}
