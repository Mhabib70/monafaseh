import type { RecitationType, ReciterNationality } from "@/lib/noorcraft/types";

export interface OnlineUser {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  avatarColor: string;
  province: string;
  city: string;
  recitationType: RecitationType;
  reciterNationality: ReciterNationality;
  favoriteReciter: string;
  noorPoints: number;
  status: "reciting" | "listening" | "waiting" | "idle";
  lastActiveAt: number; // timestamp
  joinedAt: number;
}

const now = Date.now();

// Sample online users with realistic data
export const ONLINE_USERS: OnlineUser[] = [
  {
    id: "ou_001",
    fullName: "محمدرضا حسینی",
    avatarUrl: null,
    avatarColor: "#87CEEB",
    province: "تهران",
    city: "تهران",
    recitationType: "تحقیق",
    reciterNationality: "iranian",
    favoriteReciter: "محسن حاجی حسنی کارگر",
    noorPoints: 342,
    status: "reciting",
    lastActiveAt: now - 1000 * 30,
    joinedAt: now - 1000 * 60 * 45,
  },
  {
    id: "ou_002",
    fullName: "فاطمه موسوی",
    avatarUrl: null,
    avatarColor: "#FF7F7F",
    province: "خراسان رضوی",
    city: "مشهد",
    recitationType: "ترتیل",
    reciterNationality: "foreign",
    favoriteReciter: "عبدالرحمن السدیس",
    noorPoints: 218,
    status: "listening",
    lastActiveAt: now - 1000 * 60 * 2,
    joinedAt: now - 1000 * 60 * 30,
  },
  {
    id: "ou_003",
    fullName: "علی‌رضا کاظمی",
    avatarUrl: null,
    avatarColor: "#FFD700",
    province: "اصفهان",
    city: "اصفهان",
    recitationType: "تحقیق",
    reciterNationality: "foreign",
    favoriteReciter: "عبدالباسط محمد عبدالصمد",
    noorPoints: 567,
    status: "waiting",
    lastActiveAt: now - 1000 * 60 * 5,
    joinedAt: now - 1000 * 60 * 60,
  },
  {
    id: "ou_004",
    fullName: "زهرا رضایی",
    avatarUrl: null,
    avatarColor: "#7CFC00",
    province: "فارس",
    city: "شیراز",
    recitationType: "ترتیل",
    reciterNationality: "iranian",
    favoriteReciter: "سید احمد هاشمی",
    noorPoints: 145,
    status: "listening",
    lastActiveAt: now - 1000 * 15,
    joinedAt: now - 1000 * 60 * 20,
  },
  {
    id: "ou_005",
    fullName: "حسین امینی",
    avatarUrl: null,
    avatarColor: "#9d4edd",
    province: "گیلان",
    city: "رشت",
    recitationType: "تحقیق",
    reciterNationality: "iranian",
    favoriteReciter: "کریم منصوری",
    noorPoints: 89,
    status: "idle",
    lastActiveAt: now - 1000 * 60 * 8,
    joinedAt: now - 1000 * 60 * 90,
  },
  {
    id: "ou_006",
    fullName: "مریم احمدی",
    avatarUrl: null,
    avatarColor: "#ff8c42",
    province: "آذربایجان شرقی",
    city: "تبریز",
    recitationType: "ترتیل",
    reciterNationality: "foreign",
    favoriteReciter: "ماهر المعیقلی",
    noorPoints: 423,
    status: "reciting",
    lastActiveAt: now - 1000 * 10,
    joinedAt: now - 1000 * 60 * 15,
  },
  {
    id: "ou_007",
    fullName: "محمد صادقی",
    avatarUrl: null,
    avatarColor: "#06d6a0",
    province: "خوزستان",
    city: "اهواز",
    recitationType: "تحقیق",
    reciterNationality: "iranian",
    favoriteReciter: "حامد شاکرنژاد",
    noorPoints: 612,
    status: "waiting",
    lastActiveAt: now - 1000 * 60 * 3,
    joinedAt: now - 1000 * 60 * 40,
  },
  {
    id: "ou_008",
    fullName: "نرگس کریمی",
    avatarUrl: null,
    avatarColor: "#118ab2",
    province: "البرز",
    city: "کرج",
    recitationType: "ترتیل",
    reciterNationality: "iranian",
    favoriteReciter: "پيشوا قادر كردى",
    noorPoints: 234,
    status: "listening",
    lastActiveAt: now - 1000 * 45,
    joinedAt: now - 1000 * 60 * 25,
  },
  {
    id: "ou_009",
    fullName: "رضا اسماعیلی",
    avatarUrl: null,
    avatarColor: "#ef476f",
    province: "قم",
    city: "قم",
    recitationType: "تحقیق",
    reciterNationality: "foreign",
    favoriteReciter: "مصطفی اسماعیل",
    noorPoints: 378,
    status: "idle",
    lastActiveAt: now - 1000 * 60 * 12,
    joinedAt: now - 1000 * 60 * 70,
  },
  {
    id: "ou_010",
    fullName: "سمیرا نوری",
    avatarUrl: null,
    avatarColor: "#87CEEB",
    province: "مازندران",
    city: "ساری",
    recitationType: "ترتیل",
    reciterNationality: "foreign",
    favoriteReciter: "سعود بن ابراهیم الشریم",
    noorPoints: 156,
    status: "reciting",
    lastActiveAt: now - 1000 * 20,
    joinedAt: now - 1000 * 60 * 35,
  },
  {
    id: "ou_011",
    fullName: "یوسف رحیمی",
    avatarUrl: null,
    avatarColor: "#FFD700",
    province: "کرمان",
    city: "کرمان",
    recitationType: "تحقیق",
    reciterNationality: "iranian",
    favoriteReciter: "محمدرضا پورزرگری",
    noorPoints: 489,
    status: "listening",
    lastActiveAt: now - 1000 * 60 * 1,
    joinedAt: now - 1000 * 60 * 50,
  },
  {
    id: "ou_012",
    fullName: "الهام حسن‌زاده",
    avatarUrl: null,
    avatarColor: "#FF7F7F",
    province: "همدان",
    city: "همدان",
    recitationType: "ترتیل",
    reciterNationality: "iranian",
    favoriteReciter: "رمضان شکور",
    noorPoints: 67,
    status: "waiting",
    lastActiveAt: now - 1000 * 60 * 4,
    joinedAt: now - 1000 * 60 * 18,
  },
];

// Helper: Get online users sorted by activity (most active first)
export function getOnlineUsers(limit?: number): OnlineUser[] {
  const sorted = [...ONLINE_USERS].sort((a, b) => {
    // Active users first (reciting > listening > waiting > idle)
    const statusOrder = { reciting: 0, listening: 1, waiting: 2, idle: 3 };
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;
    // Then by lastActiveAt (most recent first)
    return b.lastActiveAt - a.lastActiveAt;
  });

  return limit ? sorted.slice(0, limit) : sorted;
}

// Helper: Get count of online users
export function getOnlineCount(): number {
  return ONLINE_USERS.length;
}

// Helper: Filter by recitation type
export function getOnlineUsersByType(type: RecitationType): OnlineUser[] {
  return ONLINE_USERS.filter((u) => u.recitationType === type);
}
