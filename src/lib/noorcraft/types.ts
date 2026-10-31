// منافسه — Monafaseh core types

export type ViewName =
  | "landing"
  | "feed"
  | "auth"
  | "dashboard"
  | "sessions"
  | "create-session"
  | "session-room"
  | "results"
  | "profile"
  | "lounge"
  | "lounge-room"
  | "challenge"
  | "blog"
  | "blog-post"
  | "admin"
  | "verification"
  | "buy-credits"
  | "masters"
  | "bank-info"
  | "donate";

// نوع احراز (تیک آبی)
export type VerificationStatus = "none" | "pending" | "approved" | "rejected" | string;
export type VerificationType = "provincial" | "national" | "international" | string;

// نوع تلاوت اصلی: تحقیق یا ترتیل
export type RecitationType = "تحقیق" | "ترتیل";

// ملیت قاری
export type ReciterNationality = "iranian" | "foreign";

// قاری انتخاب‌شده توسط کاربر برای اقتدا
export type ReciterName = string; // نام آزاد قاری از لیست

// مهارت‌های تلاوت — تخصصی
export type RecitationSkill = string;

// علاقمندی‌های قرآنی — تخصصی
export type QuranInterest = string;

export type SessionStatus = "live" | "open" | "private";

export interface NoorUser {
  id: string;
  fullName: string;
  role: string; // admin | user
  age: number;
  province: string; // استان
  city: string; // شهر زیرمجموعه‌ی استان
  recitationType: RecitationType; // تحقیق یا ترتیل
  reciterNationality: ReciterNationality; // ایرانی یا غیرایرانی
  favoriteReciter: string; // نام قاری مورد اقتدا
  recitationSkills: RecitationSkill[];
  interests: QuranInterest[];
  email: string;
  password: string; // رمز عبور
  // --- فیلدهای جدید باشگاه مشتریان ---
  phone: string; // شماره تماس
  avatarUrl: string | null; // تصویر پروفایل کاربر
  gender: "male" | "female" | null; // جنسیت
  education: string | null; // تحصیلات
  telegramId: string | null; // آیدی تلگرام
  bio: string | null; // معرفی کوتاه
  referredBy: string | null; // معرف
  // --- تیک آبی (احراز) ---
  verificationStatus: VerificationStatus; // none | pending | approved | rejected
  verificationType?: VerificationType | null;
  qariRank?: string | null; // برنزی | نقره‌ای | طلایی | null
  // --- سیستم امتیاز ---
  creditBalance: number; // موجودی امتیاز
  // --- شناسه جلسه Jitsi ---
  avatarColor: string;
  joinedAt: number;
  stats: {
    sessionsAttended: number;
    noorPoints: number;
    badges: Badge[];
    profileCompletion: number; // درصد تکمیل پروفایل 0-100
    streak: number; // روزهای متوالی ورود
    lastVisit: number; // آخرین ورود
  };
}

export interface Reciter {
  id: string;
  type: RecitationType;
  nationality: ReciterNationality;
  label: string;
  list: string[];
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  earnedAt: number;
}

export interface SessionCard {
  id: string;
  title: string;
  hostId: string;
  hostName: string;
  hostGender?: string | null;
  recitationType: RecitationType;
  reciterNationality: ReciterNationality;
  favoriteReciter: string;
  surah: string;
  capacity: number;
  attendees: number;
  status: SessionStatus;
  passwordProtected: boolean;
  genderRestriction: string; // male | female | all
  startedAt: number;
  // --- شناسه جلسه Jitsi ---
  jitsiRoom: string; // نام اتاق Jitsi
}

export interface SessionDetail extends SessionCard {
  description?: string;
  hostAvatarColor: string;
}

export interface ChatMessage {
  id: string;
  sender: string;
  avatarColor: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface Reaction {
  id: string;
  type: "salawat" | "heart" | "noor";
  sender: string;
  timestamp: number;
}

export interface QueueEntry {
  id: string;
  userId: string;
  name: string;
  avatarColor: string;
  status: "waiting" | "active" | "done";
}

// --- سیستم منافسه (Recitation Competition) ---

export interface CompetitionParticipant {
  id: string;
  name: string;
  avatarColor: string;
  avatarUrl?: string | null;
  order: number; // موقعیت در چرخش (۰، ۱، ۲، ...)
}

export interface RecitationEntry {
  id: string;
  participantId: string;
  participantName: string;
  avatarColor: string;
  surah: string;
  startVerse: number; // آیه شروع تلاوت
  endVerse: number; // آیه پایان تلاوت (آخرین آیه‌ای که قاری خواند)
  maqam: string;
  round: number;
  orderInRound: number;
  startedAt: number;
  endedAt: number;
  durationSec: number;
  passed: boolean; // آیا رد کرد؟
  rating?: number; // امتیاز کلی ۰-۵ (اختیاری — قدیمی)
  ratings?: Record<string, number>; // امتیاز هر معیار (جدید)
  tahmeedCount?: number; // تعداد تشویق‌های دریافتی
  tahmeeds?: TahmeedRecord[]; // لیست تشویق‌های دریافتی
}

// --- تشویق‌های زنده (Tahmeed) ---
export interface TahmeedRecord {
  id: string;
  phraseId: string;
  phraseText: string;
  senderName: string;
  senderAvatarColor: string;
  timestamp: number;
}

export type CompetitionStatus = "setup" | "active" | "paused" | "ended";

export interface CompetitionState {
  participants: CompetitionParticipant[];
  currentIndex: number; // ایندکس نفر فعلی در participants
  currentRound: number; // دور فعلی (از ۱)
  currentMaqam: string;
  currentSurah: string;
  currentVerse: number; // آیه شروع تلاوت نفر فعلی
  selectedEndVerse: number | null; // آخرین آیه‌ای که قاری انتخاب کرده (null = هنوز انتخاب نکرده)
  startedAt: number;
  currentEntryStartedAt: number | null;
  status: CompetitionStatus;
  history: RecitationEntry[];
}

// --- تعریف فیلدهای پروفایل برای محاسبه امتیاز تکمیل ---
export interface ProfileField {
  key: keyof NoorUser | keyof NoorUser["stats"];
  label: string;
  points: number;
  filled: boolean;
  category: "basic" | "contact" | "recitation" | "personal";
}

// --- تالار گفتگو (Lounge) ---

export type LoungeCategory =
  | "reciter-fans" // هواداران قاری خاص
  | "maqam-lovers" // علاقمندان مقام خاص
  | "city-group" // گروه شهری
  | "skill-group" // گروه مهارتی
  | "age-group" // گروه سنی
  | "general"; // عمومی

export interface Lounge {
  id: string;
  name: string;
  description: string;
  category: LoungeCategory;
  icon: string;
  color: string;
  memberCount: number;
  onlineCount: number;
  tags: string[];
  isPrivate: boolean;
  genderRestriction: string; // male | female | all
  lastMessage?: { text: string; senderName: string; senderId: string; at: number } | null;
  creatorId?: string | null;
  // برای تالارهای هواداران قاری
  relatedReciter?: string;
  // برای تالارهای مقام
  relatedMaqam?: string;
  // برای تالارهای شهری
  relatedCity?: string;
  createdAt: number;
}

export interface LoungeMember {
  id: string;
  name: string;
  avatarColor: string;
  avatarUrl?: string | null;
  role: "admin" | "moderator" | "member";
  joinedAt: number;
  isOnline: boolean;
  lastActiveAt: number;
}

export interface LoungeMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatarColor: string;
  senderAvatarUrl?: string | null;
  text: string;
  timestamp: number;
  type: "text" | "voice" | "image" | "invite" | "system";
  // برای پیام‌های صوتی
  voiceDuration?: number;
  // برای اشتراک‌گذاری تصویر
  imageUrl?: string;
  // برای دعوت به محفل
  inviteSessionId?: string;
  inviteSessionTitle?: string;
  replyTo?: {
    id: string;
    senderName: string;
    text: string;
  };
}

export interface LoungeRoom {
  lounge: Lounge;
  members: LoungeMember[];
  messages: LoungeMessage[];
  currentUserRole: "admin" | "moderator" | "member" | null;
}
