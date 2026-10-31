"use client";

import { create } from "zustand";
import type {
  ChatMessage,
  NoorUser,
  Reaction,
  RecitationType,
  ReciterNationality,
  SessionDetail,
  SessionStatus,
  ViewName,
} from "@/lib/noorcraft/types";
import type { CompetitionParticipant } from "@/lib/noorcraft/types";
import { AVATAR_COLORS, STARTER_BADGES } from "@/lib/noorcraft/constants";

// Shape of an online-user record — used by OnlineUsersMarquee and shared
// across sessions-view / create-session-view / challenge-view via the store.
export interface OnlineUser {
  id: string;
  fullName: string;
  avatarColor: string;
  avatarUrl: string | null;
  city: string | null;
  province: string | null;
  gender: string | null;
  recitationType: string | null;
  status: "reciting" | "listening" | "waiting" | "idle" | string;
  lastSeen: number;
  qariRank?: string | null;
}

interface NoorState {
  // Navigation
  view: ViewName;
  setView: (v: ViewName) => void;

  // پروفایل عمومی — کاربری که باید نمایش داده شود
  profileUserId: string | null;
  setProfileUserId: (id: string | null) => void;

  // Auth
  user: NoorUser | null;
  signIn: (user: NoorUser) => void;
  signOut: () => void;
  updateUser: (patch: Partial<NoorUser>) => void;
  addNoorPoints: (delta: number) => void;
  incrementSessions: () => void;

  // Session list filters
  filterRecitationType: RecitationType | "all";
  filterNationality: ReciterNationality | "all";
  filterProvince: string;
  filterCity: string;
  filterStatus: SessionStatus | "all";
  filterReciter: string;
  setFilterRecitationType: (t: RecitationType | "all") => void;
  setFilterNationality: (n: ReciterNationality | "all") => void;
  setFilterProvince: (p: string) => void;
  setFilterCity: (c: string) => void;
  setFilterStatus: (s: SessionStatus | "all") => void;
  setFilterReciter: (r: string) => void;

  // Active session
  activeSession: SessionDetail | null;
  setActiveSession: (s: SessionDetail | null) => void;
  messages: ChatMessage[];
  addMessage: (m: ChatMessage) => void;
  reactions: Reaction[];
  addReaction: (r: Reaction) => void;

  // Session participants (host + all guests connected via WebRTC).
  // This list is shared between WebRTCVideoChat (which adds/removes)
  // and RecitationSetup (which reads it to build the rotation).
  sessionParticipants: CompetitionParticipant[];
  upsertSessionParticipant: (p: CompetitionParticipant) => void;
  removeSessionParticipant: (peerId: string) => void;
  clearSessionParticipants: () => void;

  // Settings
  reducedMotion: boolean;
  toggleReducedMotion: () => void;

  // برنامک ایتا
  eitaaAvailable: boolean;
  setEitaaAvailable: (v: boolean) => void;
  eitaaUser: { id: string; firstName: string; lastName: string } | null;
  setEitaaUser: (u: NoorState["eitaaUser"]) => void;

  // Last recitation result (for results screen)
  lastResult: {
    listeners: number;
    noorEarned: number;
    reactionsReceived: number;
  } | null;
  setLastResult: (r: NoorState["lastResult"]) => void;

  // Online users — shared across sessions-view, create-session-view, challenge-view.
  // Single polling source (in OnlineUsersMarquee) writes to this slice; other
  // views read from it without re-fetching.
  onlineUsers: OnlineUser[];
  setOnlineUsers: (users: OnlineUser[]) => void;
  onlineUsersLastFetch: number;
}

function randomColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

export const useNoorStore = create<NoorState>((set) => ({
  view: "landing",
  setView: (v) => set({ view: v }),

  user: null,
  signIn: (user) => set({ user }),
  signOut: () =>
    set({
      user: null,
      view: "landing",
      activeSession: null,
    }),
  updateUser: (patch) =>
    set((s) =>
      s.user
        ? {
            user: {
              ...s.user,
              ...patch,
              stats: {
                ...s.user.stats,
                ...patch.stats,
                profileCompletion: calculateProfileCompletion({
                  ...s.user,
                  ...patch,
                }),
              },
            },
          }
        : {},
    ),
  addNoorPoints: (delta) =>
    set((s) =>
      s.user
        ? {
            user: {
              ...s.user,
              stats: {
                ...s.user.stats,
                noorPoints: Math.max(0, s.user.stats.noorPoints + delta),
              },
            },
          }
        : {},
    ),
  incrementSessions: () =>
    set((s) =>
      s.user
        ? {
            user: {
              ...s.user,
              stats: {
                ...s.user.stats,
                sessionsAttended: s.user.stats.sessionsAttended + 1,
              },
            },
          }
        : {},
    ),

  // Filters — new structure
  filterRecitationType: "all",
  filterNationality: "all",
  filterProvince: "all",
  filterCity: "all",
  filterStatus: "all",
  filterReciter: "all",
  setFilterRecitationType: (t) => set({ filterRecitationType: t }),
  setFilterNationality: (n) => set({ filterNationality: n }),
  setFilterProvince: (p) => set({ filterProvince: p, filterCity: "all" }),
  setFilterCity: (c) => set({ filterCity: c }),
  setFilterStatus: (s) => set({ filterStatus: s }),
  setFilterReciter: (r) => set({ filterReciter: r }),

  profileUserId: null,
  setProfileUserId: (id) => set({ profileUserId: id }),
  activeSession: null,
  setActiveSession: (s) => set({ activeSession: s }),
  messages: [],
  addMessage: (m) => set((s) => ({ messages: [...s.messages, m] })),
  reactions: [],
  addReaction: (r) =>
    set((s) => ({ reactions: [...s.reactions, r].slice(-30) })),

  sessionParticipants: [],
  upsertSessionParticipant: (p) =>
    set((s) => {
      // Add or replace participant by id (no duplicates)
      const others = s.sessionParticipants.filter((x) => x.id !== p.id);
      return { sessionParticipants: [...others, p] };
    }),
  removeSessionParticipant: (peerId) =>
    set((s) => ({
      sessionParticipants: s.sessionParticipants.filter(
        (x) => x.id !== peerId,
      ),
    })),
  clearSessionParticipants: () => set({ sessionParticipants: [] }),

  reducedMotion: false,
  toggleReducedMotion: () =>
    set((s) => ({ reducedMotion: !s.reducedMotion })),

  eitaaAvailable: false,
  setEitaaAvailable: (v) => set({ eitaaAvailable: v }),
  eitaaUser: null,
  setEitaaUser: (u) => set({ eitaaUser: u }),

  lastResult: null,
  setLastResult: (r) => set({ lastResult: r }),

  onlineUsers: [],
  setOnlineUsers: (users) =>
    set({ onlineUsers: users, onlineUsersLastFetch: Date.now() }),
  onlineUsersLastFetch: 0,
}));

/* ============================================================
   محاسبه درصد تکمیل پروفایل و امتیاز مربوطه
   ============================================================ */
export function calculateProfileCompletion(user: Partial<NoorUser>): number {
  const fields: { value: unknown; weight: number }[] = [
    { value: user.fullName, weight: 10 },
    { value: user.age, weight: 5 },
    { value: user.province, weight: 5 },
    { value: user.city, weight: 5 },
    { value: user.email, weight: 8 },
    { value: user.phone, weight: 10 },
    { value: user.avatarUrl, weight: 12 },
    { value: user.gender, weight: 5 },
    { value: user.recitationType, weight: 7 },
    { value: user.reciterNationality, weight: 5 },
    { value: user.favoriteReciter, weight: 5 },
    { value: user.recitationSkills?.length ?? 0, weight: 8 },
    { value: user.interests?.length ?? 0, weight: 5 },
    { value: user.bio, weight: 3 },
    { value: user.education, weight: 3 },
    { value: user.telegramId, weight: 2 },
    { value: user.referredBy, weight: 2 },
  ];

  let filled = 0;
  for (const f of fields) {
    if (f.value !== null && f.value !== undefined && f.value !== "" && f.value !== 0) {
      filled += f.weight;
    }
  }
  return Math.min(100, filled);
}

/* ============================================================
   لیست فیلدهای پروفایل برای نمایش در داشبورد
   ============================================================ */
export function getProfileFields(user: NoorUser) {
  return [
    // basic
    { key: "fullName", label: "نام و نام خانوادگی", points: 10, filled: !!user.fullName, category: "basic" as const },
    { key: "age", label: "سن", points: 5, filled: !!user.age, category: "basic" as const },
    { key: "gender", label: "جنسیت", points: 5, filled: !!user.gender, category: "basic" as const },
    { key: "province", label: "استان", points: 5, filled: !!user.province, category: "basic" as const },
    { key: "city", label: "شهر", points: 5, filled: !!user.city, category: "basic" as const },
    // contact
    { key: "email", label: "ایمیل", points: 8, filled: !!user.email, category: "contact" as const },
    { key: "phone", label: "شماره تماس", points: 10, filled: !!user.phone, category: "contact" as const },
    { key: "telegramId", label: "آیدی تلگرام", points: 2, filled: !!user.telegramId, category: "contact" as const },
    { key: "avatarUrl", label: "تصویر پروفایل", points: 12, filled: !!user.avatarUrl, category: "contact" as const },
    // recitation
    { key: "recitationType", label: "نوع تلاوت", points: 7, filled: !!user.recitationType, category: "recitation" as const },
    { key: "reciterNationality", label: "ملیت قاری", points: 5, filled: !!user.reciterNationality, category: "recitation" as const },
    { key: "favoriteReciter", label: "قاری اقتدا", points: 5, filled: !!user.favoriteReciter, category: "recitation" as const },
    { key: "recitationSkills", label: "مهارت‌ها", points: 8, filled: (user.recitationSkills?.length ?? 0) > 0, category: "recitation" as const },
    { key: "interests", label: "علاقمندی‌ها", points: 5, filled: (user.interests?.length ?? 0) > 0, category: "recitation" as const },
    // personal
    { key: "bio", label: "معرفی کوتاه", points: 3, filled: !!user.bio, category: "personal" as const },
    { key: "education", label: "تحصیلات", points: 3, filled: !!user.education, category: "personal" as const },
    { key: "referredBy", label: "معرف", points: 2, filled: !!user.referredBy, category: "personal" as const },
  ];
}

export function makeStarterUser(input: {
  fullName: string;
  age: number;
  province: string;
  city: string;
  recitationType: RecitationType;
  reciterNationality: ReciterNationality;
  favoriteReciter: string;
  recitationSkills: NoorUser["recitationSkills"];
  interests: NoorUser["interests"];
  email: string;
  password: string;
  phone: string;
  avatarUrl: string | null;
  gender: "male" | "female" | null;
  education: string | null;
  telegramId: string | null;
  bio: string | null;
  referredBy: string | null;
}): NoorUser {
  const baseUser: NoorUser = {
    id: `u_${Date.now().toString(36)}`,
    fullName: input.fullName,
    role: "user",
    age: input.age,
    province: input.province,
    city: input.city,
    recitationType: input.recitationType,
    reciterNationality: input.reciterNationality,
    favoriteReciter: input.favoriteReciter,
    recitationSkills: input.recitationSkills,
    interests: input.interests,
    email: input.email,
    password: input.password,
    phone: input.phone,
    avatarUrl: input.avatarUrl,
    gender: input.gender,
    education: input.education,
    telegramId: input.telegramId,
    bio: input.bio,
    referredBy: input.referredBy,
    verificationStatus: "none",
    creditBalance: 0,
    avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
    joinedAt: Date.now(),
    stats: {
      sessionsAttended: 0,
      noorPoints: 25,
      badges: [...STARTER_BADGES],
      profileCompletion: 0,
      streak: 1,
      lastVisit: Date.now(),
    },
  };
  baseUser.stats.profileCompletion = calculateProfileCompletion(baseUser);
  return baseUser;
}

export { randomColor };
