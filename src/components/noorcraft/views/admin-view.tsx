"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, Mic, MessageCircle, BarChart3,
  Trash2, Crown, Search, RefreshCw, Shield, Plus, Minus, Star,
  Activity, TrendingUp, Download, Bell, Wifi, Award, UserCircle,
  Phone, MapPin, Calendar, ChevronLeft, Eye, Mail, Zap, Flame,
  BookOpen, Loader2, Check, BadgeCheck, Banknote,
  Megaphone, MousePointerClick, Image as ImageIcon, X, Pencil,
  ToggleLeft, ToggleRight, ExternalLink, Copy,
} from "lucide-react";
import { NoorButton } from "../noor-button";
import { NoorCard } from "../noor-card";
import { NoorBadge } from "../noor-badge";
import { NoorAvatar } from "../noor-avatar";
import { AdBanner } from "../ad-banner";
import { AdAnalytics } from "../ad-analytics";
import { ImageCropper } from "../image-cropper";
import { SlotsManager } from "../slots-manager";
import { VerifyTab, FinanceTab } from "../admin-panels";
import { useToast } from "@/hooks/use-toast";

type AdminTab = "dashboard" | "users" | "ranking" | "online" | "sessions" | "lounges" | "crm" | "verify" | "finance" | "notify" | "blog" | "ads";

export function AdminView() {
  const { toast } = useToast();
  const [tab, setTab] = useState<AdminTab>("dashboard");
  const [adminChecked, setAdminChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.user?.role === "admin") setIsAdmin(true);
      })
      .finally(() => setAdminChecked(true));
  }, []);

  if (!adminChecked) {
    return <div className="grid place-items-center py-20"><RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  if (!isAdmin) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="text-center">
          <Shield className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
          <h2 className="text-xl font-bold">دسترسی غیرمجاز</h2>
          <a href="/" className="mt-4 inline-block rounded-full bg-noor-yellow px-6 py-2 text-sm font-bold text-noor-navy">بازگشت به سایت</a>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "dashboard" as AdminTab, label: "داشبورد", icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: "users" as AdminTab, label: "کاربران", icon: <Users className="h-4 w-4" /> },
    { id: "ranking" as AdminTab, label: "رنکینگ", icon: <Award className="h-4 w-4" /> },
    { id: "online" as AdminTab, label: "آنلاین", icon: <Wifi className="h-4 w-4" /> },
    { id: "sessions" as AdminTab, label: "محفل‌ها", icon: <Mic className="h-4 w-4" /> },
    { id: "lounges" as AdminTab, label: "تالارها", icon: <MessageCircle className="h-4 w-4" /> },
    { id: "crm" as AdminTab, label: "باشگاه مشتریان", icon: <UserCircle className="h-4 w-4" /> },
    { id: "verify" as AdminTab, label: "احراز قاریان", icon: <BadgeCheck className="h-4 w-4" /> },
    { id: "finance" as AdminTab, label: "مالی", icon: <Banknote className="h-4 w-4" /> },
    { id: "notify" as AdminTab, label: "اطلاع‌رسانی", icon: <Bell className="h-4 w-4" /> },
    { id: "blog" as AdminTab, label: "بلاگ", icon: <BookOpen className="h-4 w-4" /> },
    { id: "ads" as AdminTab, label: "تبلیغات", icon: <Megaphone className="h-4 w-4" /> },
  ];

  return (
    <div>
      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-1.5 rounded-2xl bg-white/60 dark:bg-transparent p-2 backdrop-blur">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
              tab === t.id ? "bg-noor-yellow text-noor-navy shadow" : "text-noor-navy hover:bg-noor-sky/20 dark:text-white"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === "dashboard" && <DashboardTab key="dashboard" />}
        {tab === "users" && <UsersTab key="users" />}
        {tab === "ranking" && <RankingTab key="ranking" />}
        {tab === "online" && <OnlineTab key="online" />}
        {tab === "sessions" && <SessionsTab key="sessions" />}
        {tab === "lounges" && <LoungesTab key="lounges" />}
        {tab === "crm" && <CRMTab key="crm" />}
        {tab === "verify" && <VerifyTab key="verify" />}
        {tab === "finance" && <FinanceTab key="finance" />}
        {tab === "notify" && <NotifyTab key="notify" />}
        {tab === "blog" && <BlogTab key="blog" />}
        {tab === "ads" && <AdsTab key="ads" />}
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// داشبورد پیشرفته
// ============================================================
function DashboardTab() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats").then(r => r.json()).then(d => { if (d.ok) setStats(d.stats); }).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!stats) return <div className="py-20 text-center text-muted-foreground">خطا</div>;

  const cards = [
    { label: "کل کاربران", value: stats.totalUsers, icon: <Users className="h-5 w-5" />, color: "#87CEEB", bg: "bg-noor-sky/15" },
    { label: "کاربران جدید (۷ روز)", value: stats.recentUsers, icon: <TrendingUp className="h-5 w-5" />, color: "#7CFC00", bg: "bg-noor-green/15" },
    { label: "مدیران", value: stats.adminCount, icon: <Crown className="h-5 w-5" />, color: "#FFD700", bg: "bg-noor-yellow/15" },
    { label: "محفل‌های زنده", value: stats.activeSessions, icon: <Activity className="h-5 w-5" />, color: "#FF7F7F", bg: "bg-noor-coral/15" },
    { label: "کل محفل‌ها", value: stats.totalSessions, icon: <Mic className="h-5 w-5" />, color: "#FFD700", bg: "bg-noor-yellow/15" },
    { label: "تالارها", value: stats.totalLounges, icon: <MessageCircle className="h-5 w-5" />, color: "#9d4edd", bg: "bg-purple-500/15" },
    { label: "کل پیام‌ها", value: stats.totalMessages, icon: <MessageCircle className="h-5 w-5" />, color: "#06d6a0", bg: "bg-emerald-500/15" },
    { label: "کل تلاوت‌ها", value: stats.totalRecitations, icon: <Mic className="h-5 w-5" />, color: "#ff8c42", bg: "bg-orange-500/15" },
    { label: "کل تشویق‌ها", value: stats.totalTahmeeds, icon: <Star className="h-5 w-5" />, color: "#FFD700", bg: "bg-noor-yellow/15" },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {cards.map((c, i) => (
          <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}>
            <NoorCard className={`text-center ${["noor-card-sky", "noor-card-yellow", "noor-card-green", "noor-card-coral"][i % 4]}`}>
              <div className={`mx-auto mb-2 grid h-10 w-10 place-items-center rounded-xl ${c.bg}`} style={{ color: c.color }}>{c.icon}</div>
              <div className="font-display text-2xl text-noor-navy dark:text-white">{c.value.toLocaleString("fa-IR")}</div>
              <div className="text-[10px] text-muted-foreground">{c.label}</div>
            </NoorCard>
          </motion.div>
        ))}
      </div>

      {/* Quick export */}
      <NoorCard>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold"><Download className="h-4 w-4 text-noor-sky" /> خروجی داده‌ها</h3>
        <div className="flex gap-2">
          <a href="/api/admin/export?type=users" className="flex items-center gap-1.5 rounded-xl bg-noor-green/20 px-3 py-2 text-xs font-bold text-green-700 hover:bg-noor-green/30">
            <Download className="h-3.5 w-3.5" /> خروجی کاربران (CSV)
          </a>
          <a href="/api/admin/export?type=sessions" className="flex items-center gap-1.5 rounded-xl bg-noor-sky/20 px-3 py-2 text-xs font-bold text-sky-700 hover:bg-noor-sky/30">
            <Download className="h-3.5 w-3.5" /> خروجی محفل‌ها (CSV)
          </a>
        </div>
      </NoorCard>

      {/* Sessions by type */}
      <NoorCard>
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold"><BarChart3 className="h-4 w-4 text-noor-sky" /> محفل‌ها بر اساس نوع تلاوت</h3>
        <div className="space-y-3">
          {stats.sessionsByType.map((s: any) => (
            <div key={s.type} className="flex items-center gap-3">
              <span className="w-16 text-sm font-bold">{s.type}</span>
              <div className="flex-1">
                <div className="h-6 overflow-hidden rounded-full bg-muted">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(s.count / Math.max(1, stats.totalSessions)) * 100}%` }} className="grid h-full place-items-center rounded-full bg-gradient-to-l from-noor-sky to-noor-green text-xs font-bold text-noor-navy">
                    {s.count > 0 ? s.count.toLocaleString("fa-IR") : ""}
                  </motion.div>
                </div>
              </div>
            </div>
          ))}
          {stats.sessionsByType.length === 0 && <p className="text-sm text-muted-foreground">هنوز محفلی ایجاد نشده است</p>}
        </div>
      </NoorCard>
    </motion.div>
  );
}

// ============================================================
// مدیریت کاربران
// ============================================================
function UsersTab() {
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const r = await fetch(`/api/admin/users${search ? `?search=${encodeURIComponent(search)}` : ""}`);
        const d = await r.json();
        if (!cancelled && d.ok) setUsers(d.users);
      } finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, [search]);

  async function handleAction(userId: string, action: string, points?: number) {
    const res = await fetch("/api/admin/users", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, action, points }) });
    const data = await res.json();
    if (data.ok) { toast({ title: "انجام شد ✓" }); setSearch(s => s + " "); setTimeout(() => setSearch(s => s.trim()), 100); }
  }

  async function handleDelete(userId: string) {
    if (!confirm("آیا از حذف این کاربر مطمئن هستید؟")) return;
    const res = await fetch(`/api/admin/users?userId=${userId}`, { method: "DELETE" });
    if ((await res.json()).ok) { toast({ title: "حذف شد" }); setSearch(s => s + " "); setTimeout(() => setSearch(s => s.trim()), 100); }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <NoorCard className="mb-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جستجوی نام، ایمیل، تلفن، شهر..." className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm focus:border-noor-sky focus:outline-none" />
          <a href="/api/admin/export?type=users" className="flex items-center gap-1 rounded-xl bg-noor-green/20 px-3 py-2 text-xs font-bold text-green-700 hover:bg-noor-green/30"><Download className="h-3.5 w-3.5" /> Excel</a>
        </div>
      </NoorCard>

      {loading ? <LoadingSpinner /> : users.length === 0 ? (
        <NoorCard className="py-12 text-center text-muted-foreground">کاربری پیدا نشد</NoorCard>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <NoorCard key={u.id} className="flex flex-wrap items-center gap-3 p-3">
              <NoorAvatar name={u.fullName} color={u.avatarColor} avatarUrl={u.avatarUrl} gender={u.gender} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold">{u.fullName}</span>
                  {u.role === "admin" && <NoorBadge variant="coral" icon={<Crown className="h-3 w-3" />}>ادمین</NoorBadge>}
                  {u.gender && <span className="text-xs text-muted-foreground">{u.gender === "male" ? "آقا" : "خانم"}</span>}
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{u.email}</span>
                  {u.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{u.phone}</span>}
                  {u.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{u.city}</span>}
                  <span className="flex items-center gap-1"><Star className="h-3 w-3 text-noor-yellow" />{u.noorPoints.toLocaleString("fa-IR")} نور</span>
                  <span>{u.profileCompletion}% پروفایل</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setSelectedUser(u)} className="grid h-8 w-8 place-items-center rounded-lg bg-noor-sky/20 text-sky-600 hover:bg-noor-sky/40" title="جزئیات"><Eye className="h-4 w-4" /></button>
                {u.role !== "admin" ? (
                  <button onClick={() => handleAction(u.id, "make-admin")} className="grid h-8 w-8 place-items-center rounded-lg bg-noor-yellow/20 hover:bg-noor-yellow/40" title="ادمین"><Crown className="h-4 w-4" /></button>
                ) : (
                  <button onClick={() => handleAction(u.id, "remove-admin")} className="grid h-8 w-8 place-items-center rounded-lg bg-muted hover:bg-muted/80" title="حذف ادمین"><Shield className="h-4 w-4" /></button>
                )}
                <button onClick={() => handleAction(u.id, "add-points", 10)} className="grid h-8 w-8 place-items-center rounded-lg bg-noor-green/20 hover:bg-noor-green/40" title="+۱۰ نور"><Plus className="h-4 w-4" /></button>
                <button onClick={() => handleAction(u.id, "remove-points", 10)} className="grid h-8 w-8 place-items-center rounded-lg bg-noor-coral/20 text-noor-coral hover:bg-noor-coral/40" title="-۱۰ نور"><Minus className="h-4 w-4" /></button>
                <button onClick={() => handleDelete(u.id)} className="grid h-8 w-8 place-items-center rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500/40" title="حذف"><Trash2 className="h-4 w-4" /></button>
              </div>
            </NoorCard>
          ))}
        </div>
      )}

      {/* User detail modal */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedUser(null)} className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-lg overflow-y-auto rounded-3xl bg-card p-6 shadow-2xl max-h-[80vh]">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-bold">جزئیات کاربر</h3>
                <button onClick={() => setSelectedUser(null)} className="grid h-8 w-8 place-items-center rounded-full bg-muted">✕</button>
              </div>
              <div className="flex items-center gap-4 mb-4">
                <NoorAvatar name={selectedUser.fullName} color={selectedUser.avatarColor} avatarUrl={selectedUser.avatarUrl} gender={selectedUser.gender} size="xl" />
                <div>
                  <h4 className="text-lg font-bold">{selectedUser.fullName}</h4>
                  {selectedUser.role === "admin" && <NoorBadge variant="coral">ادمین</NoorBadge>}
                  {selectedUser.gender && <span className="text-sm text-muted-foreground">{selectedUser.gender === "male" ? "آقا" : "خانم"}</span>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <DetailItem icon={<Mail />} label="ایمیل" value={selectedUser.email} />
                <DetailItem icon={<Phone />} label="تلفن" value={selectedUser.phone || "—"} />
                <DetailItem icon={<MapPin />} label="استان" value={selectedUser.province || "—"} />
                <DetailItem icon={<MapPin />} label="شهر" value={selectedUser.city || "—"} />
                <DetailItem icon={<Star />} label="امتیاز نور" value={selectedUser.noorPoints?.toLocaleString("fa-IR")} />
                <DetailItem icon={<Calendar />} label="جلسات" value={selectedUser.sessionsAttended?.toLocaleString("fa-IR")} />
                <DetailItem icon={<Activity />} label="تکمیل پروفایل" value={`${selectedUser.profileCompletion}%`} />
                <DetailItem icon={<Flame />} label="استریک" value={selectedUser.streak?.toLocaleString("fa-IR")} />
                <DetailItem icon={<Mic />} label="محفل‌های میزبانی" value={selectedUser._count?.hostedSessions?.toLocaleString("fa-IR") || "۰"} />
                <DetailItem icon={<MessageCircle />} label="پیام‌ها" value={selectedUser._count?.loungeMessages?.toLocaleString("fa-IR") || "۰"} />
                <DetailItem icon={<Calendar />} label="عضویت" value={new Date(selectedUser.createdAt).toLocaleDateString("fa-IR")} />
                <DetailItem icon={<Calendar />} label="آخرین بازدید" value={new Date(selectedUser.lastVisit).toLocaleDateString("fa-IR")} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================
// رنکینگ
// ============================================================
function RankingTab() {
  const [ranking, setRanking] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/ranking").then(r => r.json()).then(d => { if (d.ok) setRanking(d.ranking); }).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <NoorCard className="mb-4">
        <h3 className="flex items-center gap-2 text-sm font-bold"><Award className="h-5 w-5 text-noor-yellow" /> رنکینگ کاربران بر اساس فعالیت</h3>
        <p className="mt-1 text-xs text-muted-foreground">امتیاز فعالیت = (نور × ۲) + (جلسات × ۱۰) + (میزبانی × ۱۵) + (پیام × ۳) + (عضویت تالار × ۵) + (استریک × ۵) + تکمیل پروفایل</p>
      </NoorCard>

      {ranking.length === 0 ? (
        <NoorCard className="py-12 text-center text-muted-foreground">کاربری وجود ندارد</NoorCard>
      ) : (
        <div className="space-y-2">
          {ranking.slice(0, 50).map((u, i) => (
            <motion.div key={u.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
              <NoorCard className="flex items-center gap-3 p-3">
                <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full font-bold ${
                  i === 0 ? "bg-noor-yellow text-noor-navy" : i === 1 ? "bg-gray-300 text-gray-700" : i === 2 ? "bg-orange-400 text-white" : "bg-muted text-muted-foreground"
                }`}>
                  {u.rank.toLocaleString("fa-IR")}
                </div>
                <NoorAvatar name={u.fullName} color={u.avatarColor} avatarUrl={u.avatarUrl} gender={u.gender} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{u.fullName}</span>
                    {u.gender && <span className="text-xs text-muted-foreground">{u.gender === "male" ? "آقا" : "خانم"}</span>}
                  </div>
                  <div className="mt-0.5 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-0.5"><Star className="h-3 w-3 text-noor-yellow" />{u.noorPoints.toLocaleString("fa-IR")}</span>
                    <span>محفل: {u.hostedSessions.toLocaleString("fa-IR")}</span>
                    <span>پیام: {u.loungeMessages.toLocaleString("fa-IR")}</span>
                    <span>استریک: {u.streak.toLocaleString("fa-IR")} روز</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-display text-xl text-noor-navy dark:text-white">{u.activityScore.toLocaleString("fa-IR")}</div>
                  <div className="text-[10px] text-muted-foreground">امتیاز فعالیت</div>
                </div>
              </NoorCard>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ============================================================
// کاربران آنلاین
// ============================================================
function OnlineTab() {
  const [online, setOnline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/online").then(r => r.json()).then(d => { if (d.ok) setOnline(d.online); }).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <NoorCard className="mb-4">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-bold"><Wifi className="h-5 w-5 text-noor-green" /> کاربران آنلاین</h3>
          <NoorBadge variant="green">{online.length.toLocaleString("fa-IR")} نفر آنلاین</NoorBadge>
        </div>
      </NoorCard>

      {online.length === 0 ? (
        <NoorCard className="py-12 text-center text-muted-foreground">کاربر آنلاینی وجود ندارد</NoorCard>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {online.map((u, i) => (
            <motion.div key={u.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}>
              <NoorCard className="flex items-center gap-3 p-3">
                <div className="relative">
                  <NoorAvatar name={u.fullName} color={u.avatarColor} avatarUrl={u.avatarUrl} gender={u.gender} size="md" />
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-noor-green ring-2 ring-card" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm font-bold">{u.fullName}</div>
                  <div className="text-xs text-muted-foreground">{u.city || "—"}</div>
                  <div className="text-[10px] text-noor-green">آنلاین</div>
                </div>
                <span className="text-xs font-bold text-noor-yellow">{u.noorPoints.toLocaleString("fa-IR")} نور</span>
              </NoorCard>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ============================================================
// باشگاه مشتریان (CRM)
// ============================================================
function CRMTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/users").then(r => r.json()).then(d => { if (d.ok) setUsers(d.users); }).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  // CRM analytics
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.sessionsAttended > 0).length;
  const inactiveUsers = users.filter(u => u.sessionsAttended === 0).length;
  const avgProfileCompletion = totalUsers > 0 ? Math.round(users.reduce((sum, u) => sum + u.profileCompletion, 0) / totalUsers) : 0;
  const totalNoorPoints = users.reduce((sum, u) => sum + u.noorPoints, 0);
  const maleUsers = users.filter(u => u.gender === "male").length;
  const femaleUsers = users.filter(u => u.gender === "female").length;

  // City distribution
  const cityMap: Record<string, number> = {};
  users.forEach(u => { if (u.city) cityMap[u.city] = (cityMap[u.city] || 0) + 1; });
  const topCities = Object.entries(cityMap).sort((a, b) => b[1] - a[1]).slice(0, 10);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* CRM Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <NoorCard className="text-center">
          <div className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-xl bg-noor-sky/15 text-noor-sky"><Users className="h-5 w-5" /></div>
          <div className="font-display text-2xl">{totalUsers.toLocaleString("fa-IR")}</div>
          <div className="text-[10px] text-muted-foreground">کل اعضا</div>
        </NoorCard>
        <NoorCard className="text-center">
          <div className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-xl bg-noor-green/15 text-noor-green"><Activity className="h-5 w-5" /></div>
          <div className="font-display text-2xl">{activeUsers.toLocaleString("fa-IR")}</div>
          <div className="text-[10px] text-muted-foreground">فعال</div>
        </NoorCard>
        <NoorCard className="text-center">
          <div className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-xl bg-noor-coral/15 text-noor-coral"><Eye className="h-5 w-5" /></div>
          <div className="font-display text-2xl">{inactiveUsers.toLocaleString("fa-IR")}</div>
          <div className="text-[10px] text-muted-foreground">غیرفعال</div>
        </NoorCard>
        <NoorCard className="text-center">
          <div className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-xl bg-noor-yellow/15 text-noor-yellow"><Star className="h-5 w-5" /></div>
          <div className="font-display text-2xl">{totalNoorPoints.toLocaleString("fa-IR")}</div>
          <div className="text-[10px] text-muted-foreground">کل امتیاز نور</div>
        </NoorCard>
      </div>

      {/* Gender distribution */}
      <NoorCard>
        <h3 className="mb-3 text-sm font-bold">توزیع جنسیتی</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-bold text-noor-sky">آقایان: {maleUsers.toLocaleString("fa-IR")}</span>
              <span className="font-bold text-noor-coral">بانوان: {femaleUsers.toLocaleString("fa-IR")}</span>
            </div>
            <div className="mt-2 flex h-6 overflow-hidden rounded-full">
              <div className="bg-noor-sky" style={{ width: `${totalUsers > 0 ? (maleUsers / totalUsers) * 100 : 0}%` }} />
              <div className="bg-noor-coral" style={{ width: `${totalUsers > 0 ? (femaleUsers / totalUsers) * 100 : 0}%` }} />
            </div>
          </div>
          <div className="text-center">
            <div className="font-display text-xl">{avgProfileCompletion.toLocaleString("fa-IR")}%</div>
            <div className="text-[10px] text-muted-foreground">میانگین تکمیل</div>
          </div>
        </div>
      </NoorCard>

      {/* Top cities */}
      <NoorCard>
        <h3 className="mb-3 text-sm font-bold">توزیع جغرافیایی (۱۰ شهر برتر)</h3>
        <div className="space-y-2">
          {topCities.map(([city, count]) => (
            <div key={city} className="flex items-center gap-3">
              <span className="w-20 text-xs font-bold">{city}</span>
              <div className="flex-1">
                <div className="h-4 overflow-hidden rounded-full bg-muted">
                  <div className="grid h-full place-items-center rounded-full bg-gradient-to-l from-noor-sky to-noor-green text-[9px] font-bold text-noor-navy" style={{ width: `${(count / totalUsers) * 100}%` }}>
                    {count.toLocaleString("fa-IR")}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {topCities.length === 0 && <p className="text-sm text-muted-foreground">داده‌ای موجود نیست</p>}
        </div>
      </NoorCard>
    </motion.div>
  );
}

// ============================================================
// اطلاع‌رسانی
// ============================================================
function NotifyTab() {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSend() {
    if (!title || !message) { toast({ title: "عنوان و پیام الزامی است", variant: "destructive" }); return; }
    setSending(true);
    try {
      const res = await fetch("/api/admin/notify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, message, target: "all" }) });
      const data = await res.json();
      if (data.ok) { toast({ title: "اطلاعیه ارسال شد ✓" }); setTitle(""); setMessage(""); }
      else { toast({ title: "خطا", variant: "destructive" }); }
    } finally { setSending(false); }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <NoorCard>
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold"><Bell className="h-5 w-5 text-noor-yellow" /> ارسال اطلاعیه</h3>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-bold">عنوان اطلاعیه</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: ضمیمه جدید سایت" className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:border-noor-sky focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold">متن پیام</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} placeholder="متن اطلاعیه..." className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:border-noor-sky focus:outline-none" />
          </div>
          <NoorButton variant="yellow" size="lg" className="w-full" onClick={handleSend} disabled={sending} leftIcon={<Bell className="h-5 w-5" />}>
            {sending ? "در حال ارسال..." : "ارسال اطلاعیه به همه تالارها"}
          </NoorButton>
        </div>
      </NoorCard>
    </motion.div>
  );
}

// ============================================================
// محفل‌ها و تالارها (ساده شده)
// ============================================================
function SessionsTab() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetch("/api/admin/sessions").then(r => r.json()).then(d => { if (d.ok) setSessions(d.sessions); }).finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("حذف محفل؟")) return;
    const res = await fetch(`/api/admin/sessions?sessionId=${id}`, { method: "DELETE" });
    if ((await res.json()).ok) { toast({ title: "حذف شد" }); setSessions(s => s.filter(x => x.id !== id)); }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <NoorCard className="mb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold">مدیریت محفل‌ها ({sessions.length.toLocaleString("fa-IR")})</h3>
          <a href="/api/admin/export?type=sessions" className="flex items-center gap-1 rounded-xl bg-noor-sky/20 px-3 py-1.5 text-xs font-bold text-sky-700 hover:bg-noor-sky/30"><Download className="h-3.5 w-3.5" /> Excel</a>
        </div>
      </NoorCard>
      {sessions.length === 0 ? <NoorCard className="py-12 text-center text-muted-foreground">محفلی نیست</NoorCard> : (
        <div className="space-y-2">
          {sessions.map((s) => (
            <NoorCard key={s.id} className="flex items-center gap-3 p-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-noor-yellow text-noor-navy"><Mic className="h-5 w-5" /></div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold">{s.title}</span>
                  <NoorBadge variant={s.status === "live" ? "coral" : "green"}>{s.status === "live" ? "زنده" : s.status === "open" ? "باز" : "خصوصی"}</NoorBadge>
                  <NoorBadge variant="muted">{s.genderRestriction === "male" ? "آقایان" : s.genderRestriction === "female" ? "بانوان" : "—"}</NoorBadge>
                </div>
                <div className="text-xs text-muted-foreground">{s.hostName} • {s.recitationType} • {s.surah} • {s.attendees}/{s.capacity}</div>
              </div>
              <button onClick={() => handleDelete(s.id)} className="grid h-8 w-8 place-items-center rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500/40"><Trash2 className="h-4 w-4" /></button>
            </NoorCard>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function LoungesTab() {
  const [lounges, setLounges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetch("/api/admin/lounges").then(r => r.json()).then(d => { if (d.ok) setLounges(d.lounges); }).finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("حذف تالار؟")) return;
    const res = await fetch(`/api/admin/lounges?loungeId=${id}`, { method: "DELETE" });
    if ((await res.json()).ok) { toast({ title: "حذف شد" }); setLounges(l => l.filter(x => x.id !== id)); }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <NoorCard className="mb-4"><h3 className="text-sm font-bold">مدیریت تالارها ({lounges.length.toLocaleString("fa-IR")})</h3></NoorCard>
      {lounges.length === 0 ? <NoorCard className="py-12 text-center text-muted-foreground">تالاری نیست</NoorCard> : (
        <div className="space-y-2">
          {lounges.map((l) => (
            <NoorCard key={l.id} className="flex items-center gap-3 p-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl text-noor-navy" style={{ background: l.color, color: "#191970" }}><MessageCircle className="h-5 w-5" /></div>
              <div className="flex-1">
                <span className="font-bold">{l.name}</span>
                <div className="text-xs text-muted-foreground">{l.category} • {l.memberCount.toLocaleString("fa-IR")} عضو • {l.messageCount.toLocaleString("fa-IR")} پیام</div>
              </div>
              <button onClick={() => handleDelete(l.id)} className="grid h-8 w-8 place-items-center rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500/40"><Trash2 className="h-4 w-4" /></button>
            </NoorCard>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ============================================================
// Helpers
// ============================================================
function LoadingSpinner() { return <div className="grid place-items-center py-20"><RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" /></div>; }

function DetailItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/30 p-2">
      <div className="flex items-center gap-1 text-xs text-muted-foreground">{icon}{label}</div>
      <div className="mt-1 font-bold">{value}</div>
    </div>
  );
}

// ============================================================
// مدیریت بلاگ (Blog Tab)
// ============================================================
function BlogTab() {
  const { toast } = useToast();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [category, setCategory] = useState("general");
  const [tags, setTags] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [uploading, setUploading] = useState(false);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/blog/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.ok) {
        setImageUrl(data.url);
        toast({ title: "تصویر بارگذاری شد ✓" });
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast({ title: "خطا در بارگذاری", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      // Reset input so same file can be re-selected
      e.target.value = "";
    }
  }

  async function fetchPosts() {
    try {
      // Fetch ALL posts (including unpublished) — we need a separate endpoint or just fetch from blog API
      const res = await fetch("/api/blog", { cache: "no-store" });
      const d = await res.json();
      if (d.ok) setPosts(d.posts);
    } catch {} finally { setLoading(false); }
  }

  useEffect(() => { fetchPosts(); }, []);

  function resetForm() {
    setTitle(""); setExcerpt(""); setContent(""); setImageUrl("");
    setCategory("general"); setTags(""); setIsPublished(true);
    setEditingId(null); setShowForm(false);
  }

  async function handleSave() {
    if (!title.trim() || !content.trim()) {
      toast({ title: "عنوان و محتوا الزامی است", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const body = {
        title: title.trim(),
        excerpt: excerpt.trim() || content.trim().slice(0, 150),
        content: content.trim(),
        imageUrl: imageUrl.trim() || null,
        category,
        tags: tags.trim() ? tags.split(",").map((t) => t.trim()) : [],
        isPublished,
      };

      if (editingId) {
        await fetch(`/api/blog/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        toast({ title: "پست ویرایش شد ✓" });
      } else {
        await fetch("/api/blog", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        toast({ title: "پست ساخته شد! 🎉" });
      }
      resetForm();
      await fetchPosts();
    } catch {
      toast({ title: "خطا", variant: "destructive" });
    } finally { setSaving(false); }
  }

  async function handleEdit(post: any) {
    setEditingId(post.id);
    setTitle(post.title);
    setExcerpt(post.excerpt);
    setContent(post.content || post.excerpt);
    setImageUrl(post.imageUrl || "");
    setCategory(post.category);
    setTags(post.tags.join(", "));
    setIsPublished(true);
    setShowForm(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("آیا از حذف این پست مطمئن هستید؟")) return;
    try {
      await fetch(`/api/blog/${id}`, { method: "DELETE" });
      toast({ title: "پست حذف شد" });
      await fetchPosts();
    } catch {
      toast({ title: "خطا در حذف", variant: "destructive" });
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <NoorCard className="mb-4">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-bold">
            <BookOpen className="h-5 w-5 text-noor-coral" />
            مدیریت بلاگ ({posts.length.toLocaleString("fa-IR")} پست)
          </h3>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 rounded-full bg-noor-yellow px-3 py-1.5 text-xs font-bold text-noor-navy"
            >
              <Plus className="h-3.5 w-3.5" /> پست جدید
            </button>
          )}
        </div>
      </NoorCard>

      {/* Form */}
      {showForm && (
        <NoorCard className="mb-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-bold">{editingId ? "ویرایش پست" : "پست جدید"}</h4>
            <button onClick={resetForm} className="text-xs text-muted-foreground hover:text-foreground">انصراف</button>
          </div>
          <div className="space-y-3">
            <input
              value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="عنوان پست"
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:border-noor-sky focus:outline-none"
            />
            <input
              value={excerpt} onChange={(e) => setExcerpt(e.target.value)}
              placeholder="خلاصه کوتاه (اختیاری — خودکار از محتوا)"
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:border-noor-sky focus:outline-none"
            />
            <textarea
              value={content} onChange={(e) => setContent(e.target.value)}
              placeholder="متن کامل پست..."
              rows={6}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:border-noor-sky focus:outline-none"
            />
            {/* Image upload */}
            <div className="space-y-2">
              {imageUrl && (
                <div className="relative overflow-hidden rounded-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl} alt="پیش‌نمایش" className="h-32 w-full object-cover" />
                  <button
                    onClick={() => setImageUrl("")}
                    className="absolute left-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-noor-coral text-white"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="آدرس تصویر یا بارگذاری کنید"
                  dir="ltr"
                  className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm focus:border-noor-sky focus:outline-none"
                />
                <label className={`flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${uploading ? "bg-muted opacity-50" : "bg-noor-sky/20 text-noor-navy hover:bg-noor-sky/30"}`}>
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {uploading ? "در حال بارگذاری..." : "بارگذاری"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                </label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={category} onChange={(e) => setCategory(e.target.value)}
                className="rounded-xl border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="general">عمومی</option>
                <option value="idea">ایده</option>
                <option value="story">سرگذشت</option>
                <option value="innovation">ابتکار</option>
              </select>
              <input
                value={tags} onChange={(e) => setTags(e.target.value)}
                placeholder="تگ‌ها با ویرگول (مثال: قرآن, تلاوت)"
                className="rounded-xl border border-input bg-background px-3 py-2 text-sm focus:border-noor-sky focus:outline-none"
              />
            </div>
            <label className="flex items-center gap-2 text-xs font-bold">
              <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
              منتشر شود
            </label>
            <button
              onClick={handleSave} disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-noor-green px-4 py-2 text-sm font-bold text-noor-navy disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {editingId ? "ذخیره تغییرات" : "انتشار پست"}
            </button>
          </div>
        </NoorCard>
      )}

      {/* Posts list */}
      <div className="space-y-2">
        {posts.length === 0 ? (
          <NoorCard className="py-8 text-center text-sm text-muted-foreground">
            هنوز پستی ساخته نشده — روی «پست جدید» بزنید
          </NoorCard>
        ) : (
          posts.map((p) => (
            <NoorCard key={p.id} className="flex items-center gap-3 p-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-bold">{p.title}</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[9px] font-bold">{p.category}</span>
                </div>
                <div className="mt-0.5 flex gap-3 text-[10px] text-muted-foreground">
                  <span>❤️ {p.likes.toLocaleString("fa-IR")}</span>
                  <span>💬 {p.commentCount?.toLocaleString("fa-IR") || "۰"}</span>
                  <span>👁️ {p.views.toLocaleString("fa-IR")}</span>
                </div>
              </div>
              <button
                onClick={() => handleEdit(p)}
                className="rounded-lg bg-muted px-2 py-1 text-[10px] font-bold text-muted-foreground hover:bg-noor-sky/20"
              >
                ویرایش
              </button>
              <button
                onClick={() => handleDelete(p.id)}
                className="grid h-7 w-7 place-items-center rounded-lg bg-noor-coral/20 text-noor-coral"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </NoorCard>
          ))
        )}
      </div>
    </motion.div>
  );
}

// ============================================================
// پنل مدیریت تبلیغات (AdsTab)
// ============================================================
interface AdRecord {
  id: string;
  title: string;
  description: string;
  cta: string;
  url: string;
  imageUrl: string | null;
  theme: string;
  badge: string | null;
  size: string;
  slot: string | null;
  active: boolean;
  priority: number;
  impressions: number;
  clicks: number;
  startAt: string | null;
  endAt: string | null;
  createdAt: string;
}

interface AdStats {
  totalAds: number;
  activeAds: number;
  pausedAds: number;
  totalImpressions: number;
  totalClicks: number;
  avgCtr: number;
}

const AD_THEMES = [
  { value: "yellow", label: "طلایی", color: "#FFD700" },
  { value: "coral", label: "مرجانی", color: "#FF7F7F" },
  { value: "sky", label: "آبی", color: "#87CEEB" },
  { value: "green", label: "سبز", color: "#7CFC00" },
  { value: "rainbow", label: "رنگین‌کمان", color: "linear-gradient(45deg,#FFD700,#FF7F7F,#87CEEB)" },
  { value: "navy", label: "سرمه‌ای", color: "#0d1230" },
];

const AD_SIZES = [
  { value: "leaderboard", label: "Leaderboard (۷۲۸×۹۰)", w: 728, h: 90 },
  { value: "rectangle", label: "Rectangle (۳۰۰×۲۵۰)", w: 300, h: 250 },
  { value: "halfpage", label: "Half Page (۳۰۰×۶۰۰)", w: 300, h: 600 },
  { value: "billboard", label: "Billboard (۹۷۰×۲۵۰)", w: 970, h: 250 },
  { value: "inline", label: "Inline (نازک تمام‌عرض)", w: "100%", h: 100 },
];

const AD_SLOTS = [
  { value: "", label: "همه‌ی جایگاه‌ها" },
  { value: "landing-top", label: "لندینگ — بالا" },
  { value: "landing-mid-1", label: "لندینگ — وسط ۱" },
  { value: "landing-mid-2", label: "لندینگ — وسط ۲" },
  { value: "landing-bottom", label: "لندینگ — پایین" },
  { value: "sessions-top", label: "محافل — بالا" },
  { value: "sessions-mid", label: "محافل — وسط" },
  { value: "challenge-top", label: "چالش — بالا" },
  { value: "challenge-mid", label: "چالش — وسط" },
  { value: "create-session-side", label: "تشکیل محفل — ستون" },
  { value: "blog-top", label: "بلاگ — بالا" },
  { value: "blog-mid", label: "بلاگ — وسط" },
  { value: "dashboard-bottom", label: "داشبورد — پایین" },
];

function AdsTab() {
  const { toast } = useToast();
  const [subTab, setSubTab] = useState<"manage" | "slots" | "analytics">("manage");
  const [ads, setAds] = useState<AdRecord[]>([]);
  const [stats, setStats] = useState<AdStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "paused">("all");
  const [editingAd, setEditingAd] = useState<AdRecord | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<AdRecord | null>(null);

  const fetchAds = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/ads", { cache: "no-store" });
      const data = await res.json();
      if (data.ok) {
        setAds(data.ads);
      }
      const sres = await fetch("/api/admin/ads/stats", { cache: "no-store" });
      const sdata = await sres.json();
      if (sdata.ok) {
        setStats(sdata.stats);
      }
    } catch (err) {
      toast({ title: "خطا در دریافت تبلیغات", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  // Filter ads by search + active filter
  const filteredAds = ads.filter((a) => {
    if (filterActive === "active" && !a.active) return false;
    if (filterActive === "paused" && a.active) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.url.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Quick toggle active
  async function handleToggle(ad: AdRecord) {
    // Optimistic
    setAds((prev) =>
      prev.map((a) => (a.id === ad.id ? { ...a, active: !a.active } : a)),
    );
    try {
      const res = await fetch(`/api/admin/ads/${ad.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !ad.active }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      toast({
        title: ad.active ? "تبلیغ غیرفعال شد ⏸️" : "تبلیغ فعال شد ▶️",
        description: ad.title,
      });
      fetchAds();
    } catch (err: any) {
      // Revert
      setAds((prev) =>
        prev.map((a) => (a.id === ad.id ? { ...a, active: ad.active } : a)),
      );
      toast({ title: "خطا", description: err.message, variant: "destructive" });
    }
  }

  // Delete ad
  async function handleDelete(ad: AdRecord) {
    setConfirmDelete(null);
    // Optimistic
    setAds((prev) => prev.filter((a) => a.id !== ad.id));
    try {
      const res = await fetch(`/api/admin/ads/${ad.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      toast({ title: "تبلیغ حذف شد 🗑️", description: ad.title });
      fetchAds();
    } catch (err: any) {
      // Revert
      setAds((prev) => [...prev, ad]);
      toast({ title: "خطا در حذف", description: err.message, variant: "destructive" });
    }
  }

  // Duplicate ad
  async function handleDuplicate(ad: AdRecord) {
    try {
      const res = await fetch("/api/admin/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${ad.title} (کپی)`,
          description: ad.description,
          cta: ad.cta,
          url: ad.url,
          imageUrl: ad.imageUrl,
          theme: ad.theme,
          badge: ad.badge,
          size: ad.size,
          slot: ad.slot,
          active: false, // duplicates start paused
          priority: ad.priority,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      toast({ title: "تبلیغ کپی شد 📋", description: "نسخه‌ی جدید به‌صورت غیرفعال ذخیره شد" });
      fetchAds();
    } catch (err: any) {
      toast({ title: "خطا در کپی", description: err.message, variant: "destructive" });
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* === SUB-TAB SWITCHER: Manage / Slots / Analytics === */}
      <div className="flex flex-wrap gap-1.5 rounded-2xl bg-white/60 p-2 backdrop-blur dark:bg-transparent">
        <button
          onClick={() => setSubTab("manage")}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${
            subTab === "manage"
              ? "bg-noor-yellow text-noor-navy shadow"
              : "text-noor-navy hover:bg-noor-sky/20 dark:text-white"
          }`}
        >
          <Megaphone className="h-4 w-4" />
          مدیریت بنرها
        </button>
        <button
          onClick={() => setSubTab("slots")}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${
            subTab === "slots"
              ? "bg-noor-yellow text-noor-navy shadow"
              : "text-noor-navy hover:bg-noor-sky/20 dark:text-white"
          }`}
        >
          <MapPin className="h-4 w-4" />
          جایگاه‌ها
        </button>
        <button
          onClick={() => setSubTab("analytics")}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${
            subTab === "analytics"
              ? "bg-noor-yellow text-noor-navy shadow"
              : "text-noor-navy hover:bg-noor-sky/20 dark:text-white"
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          تحلیل و بهینه‌سازی
        </button>
      </div>

      {subTab === "analytics" ? (
        <AdAnalytics />
      ) : subTab === "slots" ? (
        <SlotsManager />
      ) : (
        <>
      {/* === STATS CARDS === */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
          <StatCard
            icon={<Megaphone className="h-5 w-5" />}
            label="کل تبلیغات"
            value={stats.totalAds.toLocaleString("fa-IR")}
            color="#FFD700"
          />
          <StatCard
            icon={<ToggleRight className="h-5 w-5" />}
            label="فعال"
            value={stats.activeAds.toLocaleString("fa-IR")}
            color="#7CFC00"
          />
          <StatCard
            icon={<ToggleLeft className="h-5 w-5" />}
            label="غیرفعال"
            value={stats.pausedAds.toLocaleString("fa-IR")}
            color="#FF7F7F"
          />
          <StatCard
            icon={<Eye className="h-5 w-5" />}
            label="نمایش‌ها"
            value={stats.totalImpressions.toLocaleString("fa-IR")}
            color="#87CEEB"
          />
          <StatCard
            icon={<MousePointerClick className="h-5 w-5" />}
            label="کلیک‌ها"
            value={stats.totalClicks.toLocaleString("fa-IR")}
            color="#FF7F7F"
          />
          <StatCard
            icon={<TrendingUp className="h-5 w-5" />}
            label="نرخ کلیک (CTR)"
            value={`${stats.avgCtr.toLocaleString("fa-IR")}٪`}
            color="#7CFC00"
          />
        </div>
      )}

      {/* === TOOLBAR === */}
      <NoorCard className="p-4">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex flex-1 items-center gap-2 rounded-xl bg-muted/30 px-3 py-2 min-w-[200px]">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجو در عنوان، توضیحات، یا لینک..."
              className="flex-1 bg-transparent text-sm outline-none"
            />
          </div>

          <div className="flex items-center gap-1 rounded-xl bg-muted/30 p-1">
            {(["all", "active", "paused"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilterActive(f)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  filterActive === f
                    ? "bg-noor-yellow text-noor-navy shadow"
                    : "text-muted-foreground hover:bg-muted/50"
                }`}
              >
                {f === "all" ? "همه" : f === "active" ? "فعال" : "غیرفعال"}
              </button>
            ))}
          </div>

          <NoorButton
            variant="yellow"
            size="sm"
            onClick={() => {
              setEditingAd(null);
              setShowForm(true);
            }}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            تبلیغ جدید
          </NoorButton>

          <button
            onClick={fetchAds}
            className="grid h-9 w-9 place-items-center rounded-xl bg-muted/30 transition hover:bg-muted/50"
            title="به‌روزرسانی"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {/* === ADS TABLE === */}
        {loading ? (
          <div className="py-12 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">در حال بارگذاری...</p>
          </div>
        ) : filteredAds.length === 0 ? (
          <div className="py-12 text-center">
            <Megaphone className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">تبلیغی یافت نشد</p>
            <NoorButton
              variant="yellow"
              size="sm"
              className="mt-4"
              onClick={() => {
                setEditingAd(null);
                setShowForm(true);
              }}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              اولین تبلیغ را بساز
            </NoorButton>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="border-b border-muted/30 text-xs text-muted-foreground">
                  <th className="p-2 font-bold">تبلیغ</th>
                  <th className="p-2 font-bold">جایگاه</th>
                  <th className="p-2 font-bold">تم</th>
                  <th className="p-2 font-bold">اولویت</th>
                  <th className="p-2 font-bold">آمار</th>
                  <th className="p-2 font-bold">CTR</th>
                  <th className="p-2 font-bold">وضعیت</th>
                  <th className="p-2 font-bold">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {filteredAds.map((ad) => {
                  const theme = AD_THEMES.find((t) => t.value === ad.theme);
                  const ctr =
                    ad.impressions > 0
                      ? ((ad.clicks / ad.impressions) * 100).toFixed(2)
                      : "0.00";
                  return (
                    <tr
                      key={ad.id}
                      className="border-b border-muted/20 transition hover:bg-muted/10"
                    >
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <div
                            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg font-bold text-noor-navy"
                            style={{
                              background:
                                typeof theme?.color === "string" &&
                                theme.color.startsWith("linear")
                                  ? undefined
                                  : theme?.color || "#FFD700",
                            }}
                          >
                            {ad.imageUrl ? (
                              <ImageIcon className="h-4 w-4" />
                            ) : (
                              ad.title.charAt(0)
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate font-bold text-noor-navy dark:text-white">
                              {ad.title}
                              {ad.badge && (
                                <span className="mr-2 rounded-full bg-noor-yellow/20 px-2 py-0.5 text-[10px] font-bold text-noor-navy dark:text-yellow-200">
                                  {ad.badge}
                                </span>
                              )}
                            </div>
                            <div className="truncate text-[11px] text-muted-foreground">
                              {ad.cta} → {ad.url}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-2">
                        <span className="rounded-full bg-muted/30 px-2 py-0.5 text-[10px] font-bold">
                          {ad.slot
                            ? AD_SLOTS.find((s) => s.value === ad.slot)?.label || ad.slot
                            : "همه"}
                        </span>
                      </td>
                      <td className="p-2">
                        <div className="flex items-center gap-1.5">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{
                              background:
                                typeof theme?.color === "string" &&
                                theme.color.startsWith("linear")
                                  ? "linear-gradient(45deg,#FFD700,#FF7F7F,#87CEEB)"
                                  : theme?.color || "#FFD700",
                            }}
                          />
                          <span className="text-[11px]">{theme?.label || ad.theme}</span>
                        </div>
                      </td>
                      <td className="p-2">
                        <span className="font-bold text-noor-navy dark:text-white">
                          {ad.priority.toLocaleString("fa-IR")}
                        </span>
                        <span className="text-[10px] text-muted-foreground">/۱۰</span>
                      </td>
                      <td className="p-2">
                        <div className="text-[11px]">
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3 text-muted-foreground" />
                            <span className="font-bold">{ad.impressions.toLocaleString("fa-IR")}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MousePointerClick className="h-3 w-3 text-muted-foreground" />
                            <span className="font-bold">{ad.clicks.toLocaleString("fa-IR")}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                            parseFloat(ctr) >= 2
                              ? "bg-noor-green/20 text-noor-green dark:text-lime-300"
                              : parseFloat(ctr) >= 1
                                ? "bg-noor-yellow/20 text-noor-navy dark:text-yellow-200"
                                : "bg-muted/30 text-muted-foreground"
                          }`}
                        >
                          {parseFloat(ctr).toLocaleString("fa-IR")}٪
                        </span>
                      </td>
                      <td className="p-2">
                        <button
                          onClick={() => handleToggle(ad)}
                          className={`flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold transition ${
                            ad.active
                              ? "bg-noor-green/20 text-noor-green dark:text-lime-300"
                              : "bg-muted/30 text-muted-foreground"
                          }`}
                          title={ad.active ? "غیرفعال کردن" : "فعال کردن"}
                        >
                          {ad.active ? (
                            <ToggleRight className="h-3.5 w-3.5" />
                          ) : (
                            <ToggleLeft className="h-3.5 w-3.5" />
                          )}
                          {ad.active ? "فعال" : "متوقف"}
                        </button>
                      </td>
                      <td className="p-2">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingAd(ad);
                              setShowForm(true);
                            }}
                            className="grid h-7 w-7 place-items-center rounded-lg bg-muted/30 transition hover:bg-noor-sky/30"
                            title="ویرایش"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDuplicate(ad)}
                            className="grid h-7 w-7 place-items-center rounded-lg bg-muted/30 transition hover:bg-noor-yellow/30"
                            title="کپی"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          <a
                            href={ad.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="grid h-7 w-7 place-items-center rounded-lg bg-muted/30 transition hover:bg-noor-green/30"
                            title="باز کردن لینک"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                          <button
                            onClick={() => setConfirmDelete(ad)}
                            className="grid h-7 w-7 place-items-center rounded-lg bg-muted/30 transition hover:bg-noor-coral/30"
                            title="حذف"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </NoorCard>

      {/* === PREVIEW === */}
      <NoorCard className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <Eye className="h-4 w-4 text-noor-sky" />
          <h3 className="text-sm font-bold text-noor-navy dark:text-white">
            پیش‌نمایش زنده — جایگاه landing-top
          </h3>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">
          این یک بنر واقعی است که در همین لحظه از دیتابیس سرو می‌شود. هر بار که
          یک تبلیغ را فعال/غیرفعال کنی، اینجا هم به‌روز می‌شود.
        </p>
        <div className="rounded-2xl bg-noor-hero p-4">
          <AdBanner slot="landing-top" size="leaderboard" />
        </div>
      </NoorCard>

      {/* === FORM MODAL === */}
      {showForm && (
        <AdFormModal
          ad={editingAd}
          onClose={() => {
            setShowForm(false);
            setEditingAd(null);
          }}
          onSaved={() => {
            setShowForm(false);
            setEditingAd(null);
            fetchAds();
          }}
        />
      )}

      {/* === DELETE CONFIRMATION === */}
      {confirmDelete && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur"
          onClick={() => setConfirmDelete(null)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white p-5 dark:bg-card"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-noor-coral/20 text-noor-coral">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-noor-navy dark:text-white">
                  حذف تبلیغ
                </h3>
                <p className="text-xs text-muted-foreground">
                  این عملیات قابل بازگشت نیست
                </p>
              </div>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              آیا مطمئن هستید که می‌خواهید تبلیغ «{confirmDelete.title}» را حذف کنید؟
            </p>
            <div className="flex justify-end gap-2">
              <NoorButton
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDelete(null)}
              >
                انصراف
              </NoorButton>
              <NoorButton
                variant="coral"
                size="sm"
                onClick={() => handleDelete(confirmDelete)}
                leftIcon={<Trash2 className="h-4 w-4" />}
              >
                حذف کن
              </NoorButton>
            </div>
          </motion.div>
        </motion.div>
      )}
        </>
      )}
    </motion.div>
  );
}

// === Stat Card ===
function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-2xl border-2 border-muted/20 bg-white/60 p-3 dark:bg-card/60">
      <div
        className="mb-2 grid h-9 w-9 place-items-center rounded-xl"
        style={{ background: `${color}25`, color }}
      >
        {icon}
      </div>
      <div className="font-display text-xl text-noor-navy dark:text-white">
        {value}
      </div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}

// === AD FORM MODAL ===
function AdFormModal({
  ad,
  onClose,
  onSaved,
}: {
  ad: AdRecord | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Cropper state — when set, cropper modal is shown
  const [cropperSrc, setCropperSrc] = useState<string | null>(null);
  const cropperSrcObjectRef = useRef<string | null>(null);
  const [form, setForm] = useState({
    title: ad?.title || "",
    description: ad?.description || "",
    cta: ad?.cta || "مشاهده سایت",
    url: ad?.url || "https://",
    imageUrl: ad?.imageUrl || "",
    theme: ad?.theme || "yellow",
    badge: ad?.badge || "",
    size: ad?.size || "leaderboard",
    slot: ad?.slot || "",
    active: ad?.active ?? true,
    priority: ad?.priority ?? 5,
    startAt: ad?.startAt ? ad.startAt.slice(0, 16) : "",
    endAt: ad?.endAt ? ad.endAt.slice(0, 16) : "",
  });

  function setField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // === Image upload handler — opens cropper first ===
  // Instead of uploading immediately, we create a temporary object URL
  // and show the cropper. The actual upload happens after the user
  // confirms the crop region.
  async function handleImageUpload(file: File) {
    // Validate type
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      toast({
        title: "فرمت فایل مجاز نیست",
        description: "فقط JPEG, PNG, WebP, GIF قبول می‌شود",
        variant: "destructive",
      });
      return;
    }
    // Validate size (5MB input limit — output will be much smaller after WebP)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "حجم فایل زیاد است",
        description: "حداکثر حجم مجاز: ۵ مگابایت",
        variant: "destructive",
      });
      return;
    }

    // Revoke any previous object URL to avoid memory leak
    if (cropperSrcObjectRef.current) {
      URL.revokeObjectURL(cropperSrcObjectRef.current);
    }
    const url = URL.createObjectURL(file);
    cropperSrcObjectRef.current = url;
    setCropperSrc(url);
  }

  // === Final upload after crop is confirmed ===
  async function handleCropConfirm(crop: { x: number; y: number; w: number; h: number }) {
    if (!cropperSrc) return;

    // Compute target dimensions from the selected size
    const targetSize = AD_SIZES.find((s) => s.value === form.size);
    const targetWidth = typeof targetSize?.w === "number" ? targetSize.w : 728;
    const targetHeight = typeof targetSize?.h === "number" ? targetSize.h : 90;

    setUploading(true);
    try {
      // Fetch the blob from the object URL
      const blob = await (await fetch(cropperSrc)).blob();
      const formData = new FormData();
      formData.append("banner", blob, "banner.png");
      formData.append("cropX", String(crop.x));
      formData.append("cropY", String(crop.y));
      formData.append("cropW", String(crop.w));
      formData.append("cropH", String(crop.h));
      formData.append("targetWidth", String(targetWidth));
      formData.append("targetHeight", String(targetHeight));

      const res = await fetch("/api/admin/ads/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.ok) {
        setField("imageUrl", data.url);
        const compressionText = data.compressionRatio > 0
          ? `${parseFloat((data.size / 1024).toFixed(0)).toLocaleString("fa-IR")} کیلوبایت (${data.compressionRatio.toLocaleString("fa-IR")}٪ فشرده‌سازی)`
          : `${parseFloat((data.size / 1024).toFixed(0)).toLocaleString("fa-IR")} کیلوبایت`;
        toast({
          title: "تصویر برش و ذخیره شد ✓",
          description: `${data.width}×${data.height} • ${compressionText}`,
        });
        // Close cropper + cleanup
        setCropperSrc(null);
        if (cropperSrcObjectRef.current) {
          URL.revokeObjectURL(cropperSrcObjectRef.current);
          cropperSrcObjectRef.current = null;
        }
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast({
        title: "خطا در پردازش تصویر",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  }

  function handleCropCancel() {
    setCropperSrc(null);
    if (cropperSrcObjectRef.current) {
      URL.revokeObjectURL(cropperSrcObjectRef.current);
      cropperSrcObjectRef.current = null;
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageUpload(file);
  }

  function handleRemoveImage() {
    setField("imageUrl", "");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.description || !form.cta || !form.url) {
      toast({ title: "همه‌ی فیلدهای الزامی را پر کنید", variant: "destructive" });
      return;
    }
    if (!form.url.startsWith("http://") && !form.url.startsWith("https://")) {
      toast({ title: "لینک باید با http:// یا https:// شروع شود", variant: "destructive" });
      return;
    }
    setSaving(true);

    const payload = {
      title: form.title,
      description: form.description,
      cta: form.cta,
      url: form.url,
      imageUrl: form.imageUrl || null,
      theme: form.theme,
      badge: form.badge || null,
      size: form.size,
      slot: form.slot || null,
      active: form.active,
      priority: form.priority,
      startAt: form.startAt ? new Date(form.startAt).toISOString() : null,
      endAt: form.endAt ? new Date(form.endAt).toISOString() : null,
    };

    try {
      const res = ad
        ? await fetch(`/api/admin/ads/${ad.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/admin/ads", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      toast({
        title: ad ? "تبلیغ به‌روز شد ✓" : "تبلیغ ساخته شد ✓",
        description: form.title,
      });
      onSaved();
    } catch (err: any) {
      toast({
        title: "خطا در ذخیره",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 dark:bg-card"
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-xl font-bold text-noor-navy dark:text-white">
            {ad ? "ویرایش تبلیغ" : "تبلیغ جدید"}
          </h3>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full bg-muted text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="mb-1 block text-sm font-bold">
              عنوان <span className="text-noor-coral">*</span>
            </label>
            <input
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              placeholder="مثال: اپلیکیشن قرآن حافظ"
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-noor-sky"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-sm font-bold">
              توضیحات <span className="text-noor-coral">*</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="توضیح یک‌خطی درباره‌ی محصول"
              rows={2}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-noor-sky"
              required
            />
          </div>

          {/* CTA + URL */}
          <div className="grid gap-3 sm:grid-cols-[1fr_2fr]">
            <div>
              <label className="mb-1 block text-sm font-bold">
                متن دکمه <span className="text-noor-coral">*</span>
              </label>
              <input
                value={form.cta}
                onChange={(e) => setField("cta", e.target.value)}
                placeholder="مشاهده سایت"
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-noor-sky"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-bold">
                لینک مقصد <span className="text-noor-coral">*</span>
              </label>
              <input
                value={form.url}
                onChange={(e) => setField("url", e.target.value)}
                placeholder="https://example.com"
                dir="ltr"
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-noor-sky"
                required
              />
            </div>
          </div>

          {/* === BANNER IMAGE UPLOAD === */}
          <div>
            <label className="mb-1.5 block text-sm font-bold">
              تصویر بنر (اختیاری)
            </label>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* If image already uploaded — show preview */}
            {form.imageUrl ? (
              <div className="relative overflow-hidden rounded-xl border-2 border-noor-sky/40 bg-muted/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={form.imageUrl}
                  alt="بنر تبلیغ"
                  className="h-32 w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2">
                  <span className="truncate rounded-full bg-black/50 px-2 py-1 text-[10px] text-white backdrop-blur">
                    {form.imageUrl}
                  </span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="grid h-7 w-7 place-items-center rounded-full bg-white/20 text-white backdrop-blur transition hover:bg-white/30"
                      title="تغییر تصویر"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      disabled={uploading}
                      className="grid h-7 w-7 place-items-center rounded-full bg-noor-coral/80 text-white backdrop-blur transition hover:bg-noor-coral"
                      title="حذف تصویر"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {uploading && (
                  <div className="absolute inset-0 grid place-items-center bg-black/50 backdrop-blur">
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  </div>
                )}
              </div>
            ) : (
              /* Drop zone */
              <div
                onClick={() => !uploading && fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition ${
                  dragOver
                    ? "border-noor-sky bg-noor-sky/10"
                    : "border-muted/40 bg-muted/5 hover:border-noor-sky/60 hover:bg-muted/10"
                } ${uploading ? "pointer-events-none opacity-60" : ""}`}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-8 w-8 animate-spin text-noor-sky" />
                    <p className="text-xs text-muted-foreground">در حال آپلود...</p>
                  </>
                ) : (
                  <>
                    <div className="grid h-12 w-12 place-items-center rounded-full bg-noor-sky/15 text-noor-sky">
                      <ImageIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-noor-navy dark:text-white">
                        کلیک کن یا فایل را اینجا رها کن
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        JPEG, PNG, WebP, GIF — حداکثر ۲ مگابایت
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Manual URL input — advanced option */}
            <details className="mt-2">
              <summary className="cursor-pointer text-[11px] text-muted-foreground hover:text-noor-navy dark:hover:text-white">
                یا لینک تصویر را دستی وارد کن
              </summary>
              <input
                value={form.imageUrl}
                onChange={(e) => setField("imageUrl", e.target.value)}
                placeholder="https://example.com/banner.jpg"
                dir="ltr"
                className="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none focus:border-noor-sky"
              />
            </details>
          </div>

          {/* Theme + Size */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-bold">تم رنگی</label>
              <div className="flex flex-wrap gap-2">
                {AD_THEMES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setField("theme", t.value)}
                    className={`flex items-center gap-1.5 rounded-xl border-2 px-2.5 py-1.5 text-xs font-bold transition ${
                      form.theme === t.value
                        ? "border-noor-yellow bg-noor-yellow/10"
                        : "border-transparent bg-muted/30"
                    }`}
                  >
                    <div
                      className="h-3.5 w-3.5 rounded-full"
                      style={{ background: t.color as any }}
                    />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-bold">اندازه‌ی بنر</label>
              <select
                value={form.size}
                onChange={(e) => setField("size", e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-noor-sky"
              >
                {AD_SIZES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Slot + Badge */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-bold">جایگاه خاص (اختیاری)</label>
              <select
                value={form.slot}
                onChange={(e) => setField("slot", e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-noor-sky"
              >
                {AD_SLOTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-bold">بَج (اختیاری)</label>
              <input
                value={form.badge}
                onChange={(e) => setField("badge", e.target.value)}
                placeholder="مثال: تخفیف ۵۰٪ / جدید / رایگان"
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-noor-sky"
              />
            </div>
          </div>

          {/* Priority + Active */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-bold">
                اولویت: {form.priority.toLocaleString("fa-IR")} / ۱۰
              </label>
              <input
                type="range"
                min={1}
                max={10}
                value={form.priority}
                onChange={(e) => setField("priority", parseInt(e.target.value))}
                className="w-full accent-noor-yellow"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                عدد بالاتر = احتمال نمایش بیشتر
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-bold">وضعیت</label>
              <button
                type="button"
                onClick={() => setField("active", !form.active)}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition ${
                  form.active
                    ? "bg-noor-green/20 text-noor-green dark:text-lime-300"
                    : "bg-muted/30 text-muted-foreground"
                }`}
              >
                {form.active ? (
                  <ToggleRight className="h-5 w-5" />
                ) : (
                  <ToggleLeft className="h-5 w-5" />
                )}
                {form.active ? "فعال (نمایش داده می‌شود)" : "متوقف"}
              </button>
            </div>
          </div>

          {/* Scheduling */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-bold">
                شروع نمایش (اختیاری)
              </label>
              <input
                type="datetime-local"
                value={form.startAt}
                onChange={(e) => setField("startAt", e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-noor-sky"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-bold">
                پایان نمایش (اختیاری)
              </label>
              <input
                type="datetime-local"
                value={form.endAt}
                onChange={(e) => setField("endAt", e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-noor-sky"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <NoorButton variant="ghost" size="sm" onClick={onClose} type="button">
              انصراف
            </NoorButton>
            <NoorButton
              variant="yellow"
              size="sm"
              type="submit"
              disabled={saving}
              leftIcon={
                saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )
              }
            >
              {saving ? "در حال ذخیره..." : ad ? "ذخیره تغییرات" : "ساختن تبلیغ"}
            </NoorButton>
          </div>
        </form>

        {/* === IMAGE CROPPER MODAL === */}
        {cropperSrc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[60] grid place-items-center bg-black/80 p-4 backdrop-blur"
            onClick={handleCropCancel}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl rounded-2xl bg-white p-6 dark:bg-card"
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-noor-navy dark:text-white">
                    برش تصویر بنر
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    اندازه‌ی انتخاب‌شده:{" "}
                    <strong>
                      {(() => {
                        const s = AD_SIZES.find((x) => x.value === form.size);
                        return s?.label || form.size;
                      })()}
                    </strong>
                  </p>
                </div>
                <button
                  onClick={handleCropCancel}
                  className="grid h-8 w-8 place-items-center rounded-full bg-muted text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <ImageCropper
                src={cropperSrc}
                aspect={(() => {
                  const s = AD_SIZES.find((x) => x.value === form.size);
                  if (s && typeof s.w === "number" && typeof s.h === "number") {
                    return s.w / s.h;
                  }
                  return 728 / 90; // default leaderboard
                })()}
                targetWidth={(() => {
                  const s = AD_SIZES.find((x) => x.value === form.size);
                  return typeof s?.w === "number" ? s.w : 728;
                })()}
                targetHeight={(() => {
                  const s = AD_SIZES.find((x) => x.value === form.size);
                  return typeof s?.h === "number" ? s.h : 90;
                })()}
                onConfirm={handleCropConfirm}
                onCancel={handleCropCancel}
              />
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
