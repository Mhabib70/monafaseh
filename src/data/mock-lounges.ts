import type { Lounge, LoungeMember, LoungeMessage } from "@/lib/noorcraft/types";

const now = Date.now();

// تالارهای گفتگو بر اساس قاریان، مقامات، شهرها و علایق
export const MOCK_LOUNGES: Lounge[] = [
  // --- تالارهای هواداران قاریان ایرانی ---
  {
    id: "l_001",
    name: "انجمن غلوش‌خوان‌ها",
    description:
      "تالار هواداران استاد راغب مصطفی غلوش. گفتگو درباره سبک، تقلید لحن، تبادل تجربه و دعوت به محافل تقلیدی.",
    category: "reciter-fans",
    icon: "mic",
    color: "#FFD700",
    memberCount: 342,
    onlineCount: 28,
    tags: ["تقلید لحن", "تحقیق", "غیرایرانی", "غلوش"],
    isPrivate: false,
    genderRestriction: "all",
    relatedReciter: "راغب مصطفی غلوش",
    createdAt: now - 1000 * 60 * 60 * 24 * 30,
  },
  {
    id: "l_002",
    name: "مقلدان عبدالباسط",
    description:
      "عاشقان سبک استاد عبدالباسط عبدالصمد. تحلیل تلاوت‌ها، آموزش تقلید و برگزاری محافل ویژه.",
    category: "reciter-fans",
    icon: "mic",
    color: "#FF7F7F",
    memberCount: 521,
    onlineCount: 42,
    tags: ["عبدالباسط", "تحقیق", "غیرایرانی", "تقلید"],
    isPrivate: false,
    genderRestriction: "all",
    relatedReciter: "عبدالباسط محمد عبدالصمد",
    createdAt: now - 1000 * 60 * 60 * 24 * 45,
  },
  {
    id: "l_003",
    name: "هواداران حاجی حسنی کارگر",
    description:
      "تالار طرفداران استاد محسن حاجی حسنی کارگر. بحث درباره تلاوت‌های منافسه‌ای، سبک و لحن مخصوص ایشان.",
    category: "reciter-fans",
    icon: "mic",
    color: "#7CFC00",
    memberCount: 287,
    onlineCount: 19,
    tags: ["حاجی حسنی", "ایرانی", "تحقیق", "منافسه"],
    isPrivate: false,
    genderRestriction: "all",
    relatedReciter: "محسن حاجی حسنی کارگر",
    createdAt: now - 1000 * 60 * 60 * 24 * 20,
  },
  {
    id: "l_004",
    name: "مقلدان منشاوی",
    description:
      "عاشقان سبک استاد محمد صدیق منشاوی. آموزش، تقلید و تحلیل تلاوت‌های ایشان.",
    category: "reciter-fans",
    icon: "mic",
    color: "#9d4edd",
    memberCount: 198,
    onlineCount: 15,
    tags: ["منشاوی", "تحقیق", "غیرایرانی", "تقلید"],
    isPrivate: false,
    genderRestriction: "all",
    relatedReciter: "محمد صدیق منشاوی",
    createdAt: now - 1000 * 60 * 60 * 24 * 35,
  },
  {
    id: "l_005",
    name: "تقلید مصطفی اسماعیل",
    description:
      "تالار مقلدان سبک استاد مصطفی اسماعیل. آموزش لحن، تمرین و تبادل تجربه.",
    category: "reciter-fans",
    icon: "mic",
    color: "#06d6a0",
    memberCount: 156,
    onlineCount: 12,
    tags: ["مصطفی اسماعیل", "تحقیق", "غیرایرانی"],
    isPrivate: false,
    genderRestriction: "all",
    relatedReciter: "مصطفی اسماعیل",
    createdAt: now - 1000 * 60 * 60 * 24 * 25,
  },

  // --- تالارهای مقام‌خوانان ---
  {
    id: "l_006",
    name: "اهل مقام حجاز",
    description:
      "عاشقان مقام حجاز. گفتگو درباره ریزه‌کاری‌های مقام، آموزش و تبادل تمرین.",
    category: "maqam-lovers",
    icon: "music",
    color: "#FFD700",
    memberCount: 234,
    onlineCount: 21,
    tags: ["مقام حجاز", "لحن", "آموزش"],
    isPrivate: false,
    genderRestriction: "all",
    relatedMaqam: "hijaz",
    createdAt: now - 1000 * 60 * 60 * 24 * 40,
  },
  {
    id: "l_007",
    name: "مقام‌خوانان صبا",
    description:
      "تالار علاقمندان مقام صبا. تحلیل حال و هوای حزین، آموزش و تمرین.",
    category: "maqam-lovers",
    icon: "music",
    color: "#87CEEB",
    memberCount: 178,
    onlineCount: 14,
    tags: ["مقام صبا", "لحن", "حزین"],
    isPrivate: false,
    genderRestriction: "all",
    relatedMaqam: "saba",
    createdAt: now - 1000 * 60 * 60 * 24 * 28,
  },
  {
    id: "l_008",
    name: "اهل نهاوند",
    description:
      "عاشقان مقام نهاوند. گفتگو درباره لطف و نرمی این مقام و آموزش آن.",
    category: "maqam-lovers",
    icon: "music",
    color: "#FF7F7F",
    memberCount: 145,
    onlineCount: 11,
    tags: ["مقام نهاوند", "لحن", "نرم"],
    isPrivate: false,
    genderRestriction: "all",
    relatedMaqam: "nahawand",
    createdAt: now - 1000 * 60 * 60 * 24 * 22,
  },
  {
    id: "l_009",
    name: "بیات‌خوانان",
    description:
      "تالار علاقمندان مقام بیات. آموزش، تمرین و تبادل تجربه در لحن شاد.",
    category: "maqam-lovers",
    icon: "music",
    color: "#ff8c42",
    memberCount: 132,
    onlineCount: 9,
    tags: ["مقام بیات", "لحن", "شاد"],
    isPrivate: false,
    genderRestriction: "all",
    relatedMaqam: "bayati",
    createdAt: now - 1000 * 60 * 60 * 24 * 18,
  },

  // --- تالارهای شهری ---
  {
    id: "l_010",
    name: "قاریان تهران",
    description:
      "تالار قاریان شهر تهران. هماهنگی برای محافل حضوری، تبادل اطلاعات و دعوت به جلسات.",
    category: "city-group",
    icon: "map-pin",
    color: "#87CEEB",
    memberCount: 412,
    onlineCount: 35,
    tags: ["تهران", "شهری", "محافل حضوری"],
    isPrivate: false,
    genderRestriction: "all",
    relatedCity: "تهران",
    createdAt: now - 1000 * 60 * 60 * 24 * 50,
  },
  {
    id: "l_011",
    name: "قاریان مشهد",
    description:
      "تالار قاریان شهر مشهد. هماهنگی برای محافل، آموزش و تبادل تجربه.",
    category: "city-group",
    icon: "map-pin",
    color: "#7CFC00",
    memberCount: 287,
    onlineCount: 22,
    tags: ["مشهد", "شهری", "خراسان"],
    isPrivate: false,
    genderRestriction: "all",
    relatedCity: "مشهد",
    createdAt: now - 1000 * 60 * 60 * 24 * 42,
  },
  {
    id: "l_012",
    name: "قاریان اصفهان",
    description:
      "تالار قاریان شهر اصفهان. هماهنگی برای محافل و تبادل اطلاعات.",
    category: "city-group",
    icon: "map-pin",
    color: "#FFD700",
    memberCount: 198,
    onlineCount: 16,
    tags: ["اصفهان", "شهری"],
    isPrivate: false,
    genderRestriction: "all",
    relatedCity: "اصفهان",
    createdAt: now - 1000 * 60 * 60 * 24 * 33,
  },

  // --- تالارهای مهارتی ---
  {
    id: "l_013",
    name: "حفاظ قرآن",
    description:
      "تالار حافظان قرآن. تبادل روش‌های حفظ، مرور، تثبیت و تجربه‌های موفق.",
    category: "skill-group",
    icon: "brain",
    color: "#9d4edd",
    memberCount: 356,
    onlineCount: 31,
    tags: ["حفظ", "مرور", "تثبیت"],
    isPrivate: false,
    genderRestriction: "all",
    createdAt: now - 1000 * 60 * 60 * 24 * 60,
  },
  {
    id: "l_014",
    name: "آموزش تجوید",
    description:
      "تالار آموزش و یادگیری تجوید. سؤالات، پاسخ‌ها، تمرین و تبادل تجربه.",
    category: "skill-group",
    icon: "book-open",
    color: "#06d6a0",
    memberCount: 423,
    onlineCount: 38,
    tags: ["تجوید", "آموزش", "مخارج"],
    isPrivate: false,
    genderRestriction: "all",
    createdAt: now - 1000 * 60 * 60 * 24 * 55,
  },
  {
    id: "l_015",
    name: "مقام‌آموزی",
    description:
      "تالار آموزش مقام‌خوانی. آموزش گام به گام، تمرین و تبادل فایل صوتی.",
    category: "skill-group",
    icon: "music",
    color: "#FF7F7F",
    memberCount: 289,
    onlineCount: 24,
    tags: ["مقام", "آموزش", "لحن"],
    isPrivate: false,
    genderRestriction: "all",
    createdAt: now - 1000 * 60 * 60 * 24 * 38,
  },

  // --- تالارهای سنی ---
  {
    id: "l_016",
    name: "قاریان جوان",
    description:
      "تالار قاریان زیر ۲۵ سال. فضایی صمیمی برای جوانان، آموزش و رقابت دوستانه.",
    category: "age-group",
    icon: "users",
    color: "#7CFC00",
    memberCount: 534,
    onlineCount: 47,
    tags: ["جوان", "زیر ۲۵", "آموزش"],
    isPrivate: false,
    genderRestriction: "all",
    createdAt: now - 1000 * 60 * 60 * 24 * 48,
  },
  {
    id: "l_017",
    name: "نوجوانان قرآنی",
    description:
      "تالار نوجوانان ۱۲-۱۸ سال. آموزش اولیه، تشویق و راهنمایی.",
    category: "age-group",
    icon: "users",
    color: "#87CEEB",
    memberCount: 267,
    onlineCount: 19,
    tags: ["نوجوان", "آموزش اولیه"],
    isPrivate: false,
    genderRestriction: "all",
    createdAt: now - 1000 * 60 * 60 * 24 * 30,
  },

  // --- تالار عمومی ---
  {
    id: "l_018",
    name: "تالار عمومی منافسه",
    description:
      "تالار عمومی همه کاربران. اطلاعیه‌ها، پیشنهادها، گفتگوی آزاد و آشنایی.",
    category: "general",
    icon: "message-circle",
    color: "#FFD700",
    memberCount: 1245,
    onlineCount: 89,
    tags: ["عمومی", "اطلاعیه", "گفتگوی آزاد"],
    isPrivate: false,
    genderRestriction: "all",
    createdAt: now - 1000 * 60 * 60 * 24 * 90,
  },
];

// اعضای نمونه برای هر تالار
export const MOCK_LOUNGE_MEMBERS: Record<string, LoungeMember[]> = {
  l_001: [
    {
      id: "m1",
      name: "محمدرضا حسینی",
      avatarColor: "#87CEEB",
      avatarUrl: null,
      role: "admin",
      joinedAt: now - 1000 * 60 * 60 * 24 * 25,
      isOnline: true,
      lastActiveAt: now - 1000 * 60 * 2,
    },
    {
      id: "m2",
      name: "فاطمه موسوی",
      avatarColor: "#FF7F7F",
      avatarUrl: null,
      role: "moderator",
      joinedAt: now - 1000 * 60 * 60 * 24 * 20,
      isOnline: true,
      lastActiveAt: now - 1000 * 60 * 5,
    },
    {
      id: "m3",
      name: "علی‌رضا کاظمی",
      avatarColor: "#FFD700",
      avatarUrl: null,
      role: "member",
      joinedAt: now - 1000 * 60 * 60 * 24 * 15,
      isOnline: true,
      lastActiveAt: now - 1000 * 60 * 1,
    },
    {
      id: "m4",
      name: "زهرا رضایی",
      avatarColor: "#7CFC00",
      avatarUrl: null,
      role: "member",
      joinedAt: now - 1000 * 60 * 60 * 24 * 10,
      isOnline: false,
      lastActiveAt: now - 1000 * 60 * 60 * 2,
    },
    {
      id: "m5",
      name: "حسین امینی",
      avatarColor: "#9d4edd",
      avatarUrl: null,
      role: "member",
      joinedAt: now - 1000 * 60 * 60 * 24 * 8,
      isOnline: true,
      lastActiveAt: now - 1000 * 60 * 3,
    },
  ],
};

// پیام‌های نمونه برای هر تالار
export const MOCK_LOUNGE_MESSAGES: Record<string, LoungeMessage[]> = {
  l_001: [
    {
      id: "msg1",
      senderId: "m1",
      senderName: "محمدرضا حسینی",
      senderAvatarColor: "#87CEEB",
      senderAvatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=mohamadreza&backgroundColor=b6e3f4",
      text: "سلام دوستان، خوش آمدید به تالار غلوش‌خوان‌ها! امیدوارم تجربه‌هایتون رو به اشتراک بذارید.",
      timestamp: now - 1000 * 60 * 60 * 2,
      type: "text",
    },
    {
      id: "msg2",
      senderId: "m2",
      senderName: "فاطمه موسوی",
      senderAvatarColor: "#FF7F7F",
      senderAvatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=fatemeh&backgroundColor=ffd5dc",
      text: "سلام آقا محمدرضا. من最近 شروع کردم به تقلید سبک استاد غلوش. آیا منابعی برای آموزش پیشنهاد می‌دید؟",
      timestamp: now - 1000 * 60 * 60 * 1.5,
      type: "text",
    },
    {
      id: "msg3",
      senderId: "m3",
      senderName: "علی‌رضا کاظمی",
      senderAvatarColor: "#FFD700",
      senderAvatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=ali&backgroundColor=ffdfbf",
      text: "منم علاقه دارم سبک استاد غلوش رو یاد بگیرم. یک محفل تقلید برپا کنیم؟",
      timestamp: now - 1000 * 60 * 45,
      type: "text",
    },
    {
      id: "msg4",
      senderId: "m1",
      senderName: "محمدرضا حسینی",
      senderAvatarColor: "#87CEEB",
      senderAvatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=mohamadreza&backgroundColor=b6e3f4",
      text: "عالیه! من فردا ساعت ۸ شب یک محفل تشکیل می‌دم. به همه شما دعوت می‌فرستم.",
      timestamp: now - 1000 * 60 * 30,
      type: "text",
    },
    {
      id: "msg5",
      senderId: "m5",
      senderName: "حسین امینی",
      senderAvatarColor: "#9d4edd",
      senderAvatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=hossein&backgroundColor=d1d4f9",
      text: "🎤 یک نمونه تمرین تقلید سبک غلوش ضبط کردم، نظرتون چیه؟",
      timestamp: now - 1000 * 60 * 15,
      type: "voice",
      voiceDuration: 45,
    },
    {
      id: "msg6",
      senderId: "m1",
      senderName: "محمدرضا حسینی",
      senderAvatarColor: "#87CEEB",
      senderAvatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=mohamadreza&backgroundColor=b6e3f4",
      text: "محفل تقلید سبک غلوش",
      timestamp: now - 1000 * 60 * 5,
      type: "invite",
      inviteSessionId: "s_002",
      inviteSessionTitle: "محفل تقلید سبک غلوش",
    },
  ],
};

export function getLoungeMembers(loungeId: string): LoungeMember[] {
  return MOCK_LOUNGE_MEMBERS[loungeId] ?? [];
}

export function getLoungeMessages(loungeId: string): LoungeMessage[] {
  return MOCK_LOUNGE_MESSAGES[loungeId] ?? [];
}

export function getLoungesByCategory(category: string): Lounge[] {
  if (category === "all") return MOCK_LOUNGES;
  return MOCK_LOUNGES.filter((l) => l.category === category);
}
