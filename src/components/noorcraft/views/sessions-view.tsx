"use client";

import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Users,
  Lock,
  Radio,
  Mic,
  Search,
  Filter,
  ArrowLeft,
  Clock,
  Globe2,
  Loader2,
  Power,
} from "lucide-react";
import { NoorButton } from "../noor-button";
import { NoorCard } from "../noor-card";
import { NoorBadge } from "../noor-badge";
import { NoorAvatar } from "../noor-avatar";
import { OnlineUsersMarquee } from "../online-users-marquee";
import { AdBanner } from "../ad-banner";
import { BackButtons } from "../back-buttons";
import {
  FilterSearch,
  FilterField,
  FilterAdvancedToggle,
  FilterResetButton,
  FilterChip,
} from "../noor-filters";
import { useNoorStore } from "@/store/noor-store";
import { useToast } from "@/hooks/use-toast";
import {
  IRAN_PROVINCES,
  RECITERS,
  getReciters,
} from "@/lib/noorcraft/constants";
import { timeAgoFa } from "@/lib/noorcraft/constants";
import type {
  RecitationType,
  ReciterNationality,
  SessionDetail,
} from "@/lib/noorcraft/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SessionsView() {
  const setView = useNoorStore((s) => s.setView);
  const setActiveSession = useNoorStore((s) => s.setActiveSession);
  const user = useNoorStore((s) => s.user);
  const { toast } = useToast();

  // Filters
  const filterRecitationType = useNoorStore((s) => s.filterRecitationType);
  const filterNationality = useNoorStore((s) => s.filterNationality);
  const filterProvince = useNoorStore((s) => s.filterProvince);
  const filterCity = useNoorStore((s) => s.filterCity);
  const filterStatus = useNoorStore((s) => s.filterStatus);
  const filterReciter = useNoorStore((s) => s.filterReciter);

  const setFilterRecitationType = useNoorStore((s) => s.setFilterRecitationType);
  const setFilterNationality = useNoorStore((s) => s.setFilterNationality);
  const setFilterProvince = useNoorStore((s) => s.setFilterProvince);
  const setFilterCity = useNoorStore((s) => s.setFilterCity);
  const setFilterStatus = useNoorStore((s) => s.setFilterStatus);
  const setFilterReciter = useNoorStore((s) => s.setFilterReciter);

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<SessionDetail | null>(null);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [joining, setJoining] = useState(false);
  const [endingId, setEndingId] = useState<string | null>(null);

  // فیلترهای پیشرفته (استان/شهر/قاری/ملیت) به‌صورت جمع‌شونده
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Fetch sessions from API
  const [apiSessions, setApiSessions] = useState<SessionDetail[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchSessions(isInitial = false) {
      try {
        if (isInitial) {
          setLoadingSessions(true);
        } else {
          setRefreshing(true);
        }
        const res = await fetch("/api/sessions", { cache: "no-store" });
        const data = await res.json();
        if (!cancelled && data.ok) {
          // Fix: update even when length is 0 — previously the list never
          // synced when all sessions were deleted.
          setApiSessions(data.sessions ?? []);
        }
      } catch (err) {
        console.error("Failed to fetch sessions:", err);
      } finally {
        if (!cancelled) {
          setLoadingSessions(false);
          setRefreshing(false);
        }
      }
    }

    // Initial fetch
    fetchSessions(true);

    // Poll for new sessions every 8 seconds — so when another user creates
    // a session, it shows up here automatically.
    const interval = setInterval(() => fetchSessions(false), 8000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Use API sessions only — no more mock data
  const allSessions = apiSessions;

  // Cities for selected province (filter side)
  const provinceData = IRAN_PROVINCES.find((p) => p.name === filterProvince);
  const availableFilterCities = provinceData?.cities ?? [];

  // Reciters for filter (depends on type + nationality)
  const availableFilterReciters =
    filterRecitationType !== "all" && filterNationality !== "all"
      ? getReciters(
          filterRecitationType as RecitationType,
          filterNationality as ReciterNationality,
        )
      : filterRecitationType !== "all"
        ? RECITERS.filter((r) => r.type === filterRecitationType).flatMap(
            (r) => r.list,
          )
        : [];

  // All unique reciter names (for filter when no type/nationality)
  const allReciterNames = useMemo(() => {
    const names = new Set<string>();
    allSessions.forEach((s) => names.add(s.favoriteReciter));
    return Array.from(names).sort();
  }, []);

  const filtered = useMemo(() => {
    return allSessions.filter((s) => {
      // HIDE sessions of opposite gender entirely
      if (s.genderRestriction && s.genderRestriction !== "all") {
        const myGender = user?.gender;
        if (myGender && s.genderRestriction !== myGender) {
          return false;
        }
      }
      if (filterRecitationType !== "all" && s.recitationType !== filterRecitationType) {
        return false;
      }
      if (filterNationality !== "all" && s.reciterNationality !== filterNationality) {
        return false;
      }
      if (filterReciter !== "all" && s.favoriteReciter !== filterReciter) {
        return false;
      }
      if (filterProvince !== "all") {
        // Assign pseudo province based on hostName hash for demo
        const pseudoProvince =
          IRAN_PROVINCES[
            s.hostName.charCodeAt(0) % IRAN_PROVINCES.length
          ].name;
        if (pseudoProvince !== filterProvince) return false;
        if (filterCity !== "all") {
          const pseudoCity =
            IRAN_PROVINCES.find((p) => p.name === filterProvince)?.cities[
              s.hostName.charCodeAt(1) % 10
            ] ?? "";
          if (pseudoCity !== filterCity) return false;
        }
      }
      if (filterStatus !== "all" && s.status !== filterStatus) return false;
      if (
        search &&
        !`${s.title} ${s.hostName} ${s.surah} ${s.favoriteReciter}`.includes(
          search,
        )
      ) {
        return false;
      }
      return true;
    });
  }, [
    filterRecitationType,
    filterNationality,
    filterProvince,
    filterCity,
    filterStatus,
    filterReciter,
    search,
    allSessions,
    user,
  ]);

  const statusLabels: Record<string, string> = {
    live: "در حال برگزاری",
    open: "باز",
    private: "خصوصی",
  };

  const advancedCount = [filterNationality, filterReciter, filterProvince, filterCity].filter(
    (v) => v !== "all",
  ).length;

  const activeChips = [
    search && { key: "search", label: "جستجو", value: search, clear: () => setSearch("") },
    filterRecitationType !== "all" && {
      key: "type", label: "تلاوت", value: filterRecitationType,
      clear: () => setFilterRecitationType("all"),
    },
    filterNationality !== "all" && {
      key: "nat", label: "ملیت",
      value: filterNationality === "iranian" ? "ایرانی" : "غیرایرانی",
      clear: () => setFilterNationality("all"),
    },
    filterStatus !== "all" && {
      key: "status", label: "وضعیت", value: statusLabels[filterStatus] ?? filterStatus,
      clear: () => setFilterStatus("all"),
    },
    filterProvince !== "all" && {
      key: "prov", label: "استان", value: filterProvince,
      clear: () => { setFilterProvince("all"); setFilterCity("all"); },
    },
    filterCity !== "all" && {
      key: "city", label: "شهر", value: filterCity, clear: () => setFilterCity("all"),
    },
    filterReciter !== "all" && {
      key: "reciter", label: "قاری", value: filterReciter, clear: () => setFilterReciter("all"),
    },
  ].filter(Boolean) as { key: string; label: string; value: string; clear: () => void }[];

  function resetFilters() {
    setSearch("");
    setFilterRecitationType("all");
    setFilterNationality("all");
    setFilterProvince("all");
    setFilterCity("all");
    setFilterStatus("all");
    setFilterReciter("all");
  }

  async function handleJoin(s: SessionDetail) {
    // Check gender restriction (client-side pre-check; server also enforces)
    if (s.genderRestriction && s.genderRestriction !== "all") {
      const userGender = user?.gender;
      if (userGender && s.genderRestriction !== userGender) {
        toast({
          title: "دسترسی محدود",
          description:
            s.genderRestriction === "male"
              ? "این محفل فقط برای آقایان است."
              : "این محفل فقط برای بانوان است.",
          variant: "destructive",
        });
        return;
      }
    }
    if (s.passwordProtected && !password) {
      setPasswordError("این محفل خصوصی است. رمز را وارد کنید.");
      return;
    }

    setJoining(true);
    try {
      // Call the server's join endpoint so the participant is recorded
      // in the DB — other users will then see the updated attendee count.
      const res = await fetch(`/api/sessions/${s.id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!data.ok) {
        setPasswordError(data.error || "خطا در پیوستن به محفل");
        toast({
          title: "خطا در پیوستن",
          description: data.error || "لطفاً دوباره تلاش کنید",
          variant: "destructive",
        });
        return;
      }
      // Use the server-confirmed jitsiRoom (more authoritative than the list snapshot)
      const joinedSession: SessionDetail = {
        ...s,
        jitsiRoom: data.jitsiRoom ?? s.jitsiRoom,
        genderRestriction: data.genderRestriction ?? s.genderRestriction,
      };
      setPasswordError("");
      setPassword("");
      setSelected(null);
      setActiveSession(joinedSession);
      setView("session-room");
      toast({
        title: data.alreadyJoined ? "به محفل بازگشتید" : "پیوستید! 🎉",
        description: `به محفل «${s.title}» پیوستید.`,
      });
    } catch (err) {
      console.error("Join session error:", err);
      toast({
        title: "خطا در ارتباط با سرور",
        description: "لطفاً دوباره تلاش کنید",
        variant: "destructive",
      });
    } finally {
      setJoining(false);
    }
  }

  async function handleEndSession(s: SessionDetail) {
    if (!user) return;
    if (s.hostId !== user.id) {
      toast({
        title: "دسترسی محدود",
        description: "فقط میزبان محفل می‌تواند آن را پایان دهد.",
        variant: "destructive",
      });
      return;
    }
    const confirm = window.confirm(
      `آیا از پایان دادن محفل «${s.title}» مطمئن هستید؟ این کار قابل بازگشت نیست.`,
    );
    if (!confirm) return;

    setEndingId(s.id);
    try {
      const res = await fetch(`/api/sessions/${s.id}/end`, { method: "POST" });
      const data = await res.json();
      if (!data.ok) {
        throw new Error(data.error || "خطا در پایان دادن محفل");
      }
      // Remove the ended session from the local list immediately
      setApiSessions((prev) => prev.filter((x) => x.id !== s.id));
      toast({
        title: "محفل پایان یافت ✓",
        description: `محفل «${s.title}» با موفقیت بسته شد.`,
      });
    } catch (err: any) {
      console.error("End session error:", err);
      toast({
        title: "خطا در پایان دادن",
        description: err.message || "لطفاً دوباره تلاش کنید",
        variant: "destructive",
      });
    } finally {
      setEndingId(null);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-noor-hero">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Back button */}
        <div className="mb-4">
          <BackButtons />
        </div>

        {/* AD: Leaderboard — بالای صفحه محافل */}
        <AdBanner slot="sessions-top" size="leaderboard" className="mb-4" />

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
        >
          <div>
            <div className="flex items-center gap-2">
              <NoorBadge variant="coral" icon={<Radio className="h-3 w-3" />}>
                {allSessions.filter((s) => s.status === "live").length} محفل زنده
              </NoorBadge>
              {refreshing && (
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  به‌روزرسانی...
                </span>
              )}
            </div>
            <h1 className="mt-3 text-3xl font-extrabold text-noor-navy dark:text-white">
              انتخاب محفل تلاوت
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              محفلی که با سلیقه شما هماهنگ است انتخاب کنید یا خودتان محفل جدیدی بسازید. محافلی که
              میزبانی آن‌ها با شماست با نشان <span className="font-bold text-noor-yellow">★ میزبان شما</span> مشخص شده — با دکمه «پایان محفل» می‌توانید آن‌ها را ببندید.
              فهرست هر ۸ ثانیه به‌روزرسانی می‌شود.
            </p>
          </div>
          <NoorButton
            variant="yellow"
            size="lg"
            onClick={() => setView("create-session")}
            leftIcon={<Plus className="h-5 w-5" />}
          >
            تشکیل محفل جدید
          </NoorButton>
        </motion.div>

        {/* Filters — نوار فیلتر منسجم */}
        <NoorCard className="mb-6 noor-card-sky">
          <div className="grid gap-3 md:grid-cols-12">
            <div className="md:col-span-5">
              <FilterSearch
                value={search}
                onChange={setSearch}
                placeholder="جستجوی عنوان، قاری، سوره…"
              />
            </div>
            <div className="md:col-span-3">
              <FilterField label="نوع تلاوت" icon={<Mic className="h-3 w-3" />}>
                <Select
                  value={filterRecitationType}
                  onValueChange={(v) =>
                    setFilterRecitationType(v as RecitationType | "all")
                  }
                >
                  <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه انواع</SelectItem>
                    <SelectItem value="تحقیق">تحقیق</SelectItem>
                    <SelectItem value="ترتیل">ترتیل</SelectItem>
                  </SelectContent>
                </Select>
              </FilterField>
            </div>
            <div className="md:col-span-2">
              <FilterField label="وضعیت" icon={<Filter className="h-3 w-3" />}>
                <Select
                  value={filterStatus}
                  onValueChange={(v) => setFilterStatus(v as typeof filterStatus)}
                >
                  <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه</SelectItem>
                    <SelectItem value="live">در حال برگزاری</SelectItem>
                    <SelectItem value="open">باز</SelectItem>
                    <SelectItem value="private">خصوصی</SelectItem>
                  </SelectContent>
                </Select>
              </FilterField>
            </div>
            <div className="flex items-end justify-end md:col-span-2">
              <FilterAdvancedToggle
                open={showAdvanced}
                count={[filterNationality, filterReciter, filterProvince, filterCity].filter((v) => v !== "all").length}
                onClick={() => setShowAdvanced(!showAdvanced)}
              />
            </div>
          </div>

          {showAdvanced && (
            <div className="mt-3 grid gap-3 border-t border-noor-navy/10 pt-3 dark:border-white/10 md:grid-cols-12">
              <div className="md:col-span-3">
                <FilterField label="ملیت قاری" icon={<Globe2 className="h-3 w-3" />}>
                  <Select
                    value={filterNationality}
                    onValueChange={(v) =>
                      setFilterNationality(v as ReciterNationality | "all")
                    }
                  >
                    <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">همه</SelectItem>
                      <SelectItem value="iranian">ایرانی</SelectItem>
                      <SelectItem value="foreign">غیرایرانی</SelectItem>
                    </SelectContent>
                  </Select>
                </FilterField>
              </div>
              <div className="md:col-span-3">
                <FilterField label="قاری مورد اقتدا" icon={<Mic className="h-3 w-3" />}>
                  <Select
                    value={filterReciter}
                    onValueChange={(v) => setFilterReciter(v)}
                    disabled={availableFilterReciters.length === 0 && allReciterNames.length === 0}
                  >
                    <SelectTrigger className="h-10 rounded-xl">
                      <SelectValue placeholder="همه قاریان" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      <SelectItem value="all">همه قاریان</SelectItem>
                      {(availableFilterReciters.length > 0
                        ? availableFilterReciters
                        : allReciterNames
                      ).map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FilterField>
              </div>
              <div className="md:col-span-3">
                <FilterField label="استان" icon={<span aria-hidden="true">📍</span>}>
                  <Select value={filterProvince} onValueChange={(v) => setFilterProvince(v)}>
                    <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent className="max-h-72">
                      <SelectItem value="all">همه استان‌ها</SelectItem>
                      {IRAN_PROVINCES.map((p) => (
                        <SelectItem key={p.name} value={p.name}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FilterField>
              </div>
              <div className="md:col-span-3">
                <FilterField label="شهر" icon={<span aria-hidden="true">📍</span>}>
                  <Select
                    value={filterCity}
                    onValueChange={(v) => setFilterCity(v)}
                    disabled={filterProvince === "all"}
                  >
                    <SelectTrigger className="h-10 rounded-xl">
                      <SelectValue
                        placeholder={
                          filterProvince === "all"
                            ? "ابتدا استان را انتخاب کنید"
                            : "همه شهرها"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      <SelectItem value="all">همه شهرها</SelectItem>
                      {availableFilterCities.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FilterField>
              </div>
            </div>
          )}

          {activeChips.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-noor-navy/10 pt-3 dark:border-white/10">
              {activeChips.map((c) => (
                <FilterChip key={c.key} label={c.label} value={c.value} onClear={c.clear} />
              ))}
              <FilterResetButton onClick={resetFilters} />
            </div>
          )}
        </NoorCard>

                {/* Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((s, i) => (
              <motion.div
                key={s.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.05 }}
              >
                <SessionCardItem
                  session={s}
                  onJoin={() => {
                    setSelected(s);
                    setPassword("");
                    setPasswordError("");
                  }}
                  onEnd={() => handleEndSession(s)}
                  ending={endingId === s.id}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filtered.length === 0 && (
          <NoorCard className="mt-6 text-center">
            <div className="py-8">
              <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-full bg-noor-sky/20 text-3xl">
                🔍
              </div>
              <h3 className="text-lg font-bold">محفلی پیدا نشد</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                فیلترها را تغییر دهید یا خودتان یک محفل جدید بسازید.
              </p>
              <NoorButton
                variant="yellow"
                size="lg"
                className="mt-4"
                onClick={() => setView("create-session")}
                leftIcon={<Plus className="h-5 w-5" />}
              >
                تشکیل محفل جدید
              </NoorButton>
            </div>
          </NoorCard>
        )}

        {/* AD: Medium Rectangle — قبل از نوار کاربران آنلاین */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-8"
        >
          <AdBanner slot="sessions-mid" size="rectangle" />
        </motion.div>

        {/* Online users marquee — vertical, infinite scroll */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <OnlineUsersMarquee variant="full" duration={15} maxHeight="h-[460px]" />
        </motion.div>
      </div>

      {/* Join dialog */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-noor-navy/50 p-4 backdrop-blur-sm"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md"
            >
              <NoorCard className="noor-card-yellow">
                <div className="mb-4 flex items-start justify-between gap-2">
                  <div>
                    <NoorBadge
                      variant={
                        selected.status === "live"
                          ? "coral"
                          : selected.status === "open"
                            ? "green"
                            : "navy"
                      }
                    >
                      {selected.status === "live"
                        ? "زنده"
                        : selected.status === "open"
                          ? "باز"
                          : "خصوصی"}
                    </NoorBadge>
                    <h3 className="mt-2 text-xl font-bold">
                      {selected.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {selected.hostName} • {selected.recitationType}
                    </p>
                  </div>
                  <NoorAvatar
                    name={selected.hostName}
                    color={selected.hostAvatarColor}
                    size="md"
                  />
                </div>

                <div className="mb-4 space-y-2 rounded-xl bg-muted/40 p-3 text-sm">
                  <Row label="نوع تلاوت" value={selected.recitationType} />
                  <Row
                    label="ملیت قاری"
                    value={
                      selected.reciterNationality === "iranian"
                        ? "ایرانی"
                        : "غیرایرانی"
                    }
                  />
                  <Row label="قاری اقتدا" value={selected.favoriteReciter} />
                  <Row label="سوره" value={selected.surah} />
                  <Row
                    label="حاضرین"
                    value={`${selected.attendees} / ${selected.capacity}`}
                  />
                  <Row label="شروع" value={timeAgoFa(selected.startedAt)} />
                </div>

                {selected.description && (
                  <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                    {selected.description}
                  </p>
                )}

                {selected.passwordProtected && (
                  <div className="mb-4">
                    <label className="mb-1 flex items-center gap-1 text-sm font-bold">
                      <Lock className="h-4 w-4" /> رمز محفل
                    </label>
                    <input
                      type="password"
                      dir="ltr"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setPasswordError("");
                      }}
                      placeholder="رمز را وارد کنید"
                      className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:border-noor-sky focus:outline-none"
                    />
                    {passwordError && (
                      <p className="mt-1 text-xs font-medium text-noor-coral">
                        {passwordError}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <NoorButton
                    variant="ghost"
                    size="lg"
                    className="flex-1"
                    onClick={() => setSelected(null)}
                    disabled={joining}
                  >
                    انصراف
                  </NoorButton>
                  <NoorButton
                    variant="green"
                    size="lg"
                    className="flex-1"
                    onClick={() => handleJoin(selected)}
                    disabled={joining}
                    leftIcon={joining ? <Loader2 className="h-5 w-5 animate-spin" /> : undefined}
                    rightIcon={!joining ? <ArrowLeft className="h-5 w-5" /> : undefined}
                  >
                    {joining ? "در حال پیوستن..." : "پیوستن"}
                  </NoorButton>
                </div>
              </NoorCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MapPinIcon() {
  return <span className="text-base">📍</span>;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}

function SessionCardItem({
  session,
  onJoin,
  onEnd,
  ending,
}: {
  session: SessionDetail;
  onJoin: () => void;
  onEnd?: () => void;
  ending?: boolean;
}) {
  const user = useNoorStore((s) => s.user);
  const isHost = !!user && session.hostId === user.id;
  const statusConfig = {
    live: {
      label: "در حال تلاوت",
      badge: "coral" as const,
      dot: "bg-noor-coral",
      card: "noor-card-coral",
    },
    open: {
      label: "باز",
      badge: "green" as const,
      dot: "bg-noor-green",
      card: "noor-card-green",
    },
    private: {
      label: "خصوصی",
      badge: "navy" as const,
      dot: "bg-noor-navy",
      card: "noor-card-sky",
    },
  };
  const cfg = statusConfig[session.status];
  const isFull = session.attendees >= session.capacity;

  return (
    <NoorCard interactive className={`flex h-full flex-col ${cfg.card}`}>
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span
              className={`flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold`}
            >
              <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
            {session.passwordProtected && (
              <Lock className="h-3 w-3 text-muted-foreground" />
            )}
            {isHost && (
              <span className="flex items-center gap-1 rounded-full bg-noor-yellow/30 px-2 py-0.5 text-[10px] font-bold text-noor-navy dark:text-yellow-200">
                ★ میزبان شما
              </span>
            )}
          </div>
          <h3 className="text-base font-bold leading-tight text-noor-navy dark:text-white">
            {session.title}
          </h3>
        </div>
        <NoorAvatar
          name={session.hostName}
          color={session.hostAvatarColor}
          size="sm"
        />
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <NoorBadge variant="sky" icon={<Mic className="h-3 w-3" />}>
          {session.recitationType}
        </NoorBadge>
        <NoorBadge variant="muted">
          {session.reciterNationality === "iranian" ? "ایرانی" : "غیرایرانی"}
        </NoorBadge>
        <NoorBadge variant="muted">{session.surah}</NoorBadge>
        {session.genderRestriction === "male" && (
          <NoorBadge variant="sky" icon={<Users className="h-3 w-3" />}>
            فقط آقایان
          </NoorBadge>
        )}
        {session.genderRestriction === "female" && (
          <NoorBadge variant="coral" icon={<Users className="h-3 w-3" />}>
            فقط بانوان
          </NoorBadge>
        )}
      </div>

      <p className="mb-3 line-clamp-2 flex-1 text-xs text-muted-foreground">
        {session.description ?? `محفل ${session.recitationType} با ${session.hostName}`}
      </p>

      <div className="mb-2 text-xs text-muted-foreground">
        <span className="font-bold">اقتدا:</span> {session.favoriteReciter}
      </div>

      <div className="mb-3 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1 text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          {session.attendees}/{session.capacity}
        </span>
        <span className="flex items-center gap-1 text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          {timeAgoFa(session.startedAt)}
        </span>
      </div>

      <div className="mb-3">
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full"
            style={{
              background:
                cfg.dot === "bg-noor-coral"
                  ? "#FF7F7F"
                  : cfg.dot === "bg-noor-green"
                    ? "#7CFC00"
                    : "#191970",
            }}
            initial={{ width: 0 }}
            animate={{ width: `${(session.attendees / session.capacity) * 100}%` }}
            transition={{ duration: 0.6 }}
          />
        </div>
      </div>

      <div className={isHost ? "mb-3 flex gap-2" : "hidden"}>
        {isHost && onEnd && (
          <button
            onClick={onEnd}
            disabled={ending}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-noor-coral/20 px-3 py-2 text-xs font-bold text-noor-coral transition hover:bg-noor-coral/30 disabled:opacity-50"
            title="پایان دادن محفل — فقط میزبان"
          >
            {ending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Power className="h-3.5 w-3.5" />}
            پایان محفل
          </button>
        )}
      </div>

      <NoorButton
        variant={isFull ? "ghost" : session.status === "live" ? "coral" : "green"}
        size="md"
        className="w-full"
        onClick={onJoin}
        disabled={isFull || Boolean(session.genderRestriction !== "all" && user?.gender && session.genderRestriction !== user.gender)}
        rightIcon={<ArrowLeft className="h-4 w-4" />}
      >
        {isFull
          ? "ظرفیت تکمیل است"
          : isHost
            ? "ورود به محفل"
            : session.genderRestriction !== "all" && user?.gender && session.genderRestriction !== user.gender
              ? session.genderRestriction === "male" ? "فقط آقایان" : "فقط بانوان"
              : "پیوستن"}
      </NoorButton>
    </NoorCard>
  );
}
