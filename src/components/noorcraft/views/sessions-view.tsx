"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Users,
  Lock,
  Radio,
  Mic,
  Filter,
  ArrowLeft,
  Clock,
  Globe2,
  Loader2,
  Power,
  MapPin,
  SearchX,
  RefreshCw,
  AlertTriangle,
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
  timeAgoFa,
} from "@/lib/noorcraft/constants";
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
  const [confirmEndSession, setConfirmEndSession] = useState<SessionDetail | null>(null);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [joining, setJoining] = useState(false);
  const [endingId, setEndingId] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [apiSessions, setApiSessions] = useState<SessionDetail[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  const loadSessions = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) {
        setLoadingSessions(true);
        setFetchError(false);
      } else {
        setRefreshing(true);
      }
      const res = await fetch("/api/sessions", { cache: "no-store" });
      const data = await res.json();
      if (data.ok) {
        setApiSessions(data.sessions ?? []);
        setFetchError(false);
      } else if (isInitial) {
        setFetchError(true);
      }
    } catch {
      if (isInitial) setFetchError(true);
    } finally {
      setLoadingSessions(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSessions(true);
    const interval = setInterval(() => loadSessions(false), 8000);
    return () => clearInterval(interval);
  }, [loadSessions]);

  const allSessions = apiSessions;
  const provinceData = IRAN_PROVINCES.find((p) => p.name === filterProvince);
  const availableFilterCities = provinceData?.cities ?? [];

  const availableFilterReciters =
    filterRecitationType !== "all" && filterNationality !== "all"
      ? getReciters(
          filterRecitationType as RecitationType,
          filterNationality as ReciterNationality,
        )
      : filterRecitationType !== "all"
        ? RECITERS.filter((r) => r.type === filterRecitationType).flatMap((r) => r.list)
        : [];

  const allReciterNames = useMemo(() => {
    const names = new Set<string>();
    allSessions.forEach((s) => {
      if (s.favoriteReciter) names.add(s.favoriteReciter);
    });
    return Array.from(names).sort();
  }, [allSessions]);

  const filtered = useMemo(() => {
    return allSessions.filter((s) => {
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
        if (s.hostProvince !== filterProvince) return false;
        if (filterCity !== "all" && s.hostCity !== filterCity) {
          return false;
        }
      }
      if (filterStatus !== "all" && s.status !== filterStatus) return false;
      if (
        search &&
        !`${s.title} ${s.hostName} ${s.surah} ${s.favoriteReciter}`.includes(search)
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

  const activeChips = [
    search && { key: "search", label: "جستجو", value: search, clear: () => setSearch("") },
    filterRecitationType !== "all" && {
      key: "type",
      label: "تلاوت",
      value: filterRecitationType,
      clear: () => setFilterRecitationType("all"),
    },
    filterNationality !== "all" && {
      key: "nat",
      label: "ملیت",
      value: filterNationality === "iranian" ? "ایرانی" : "غیرایرانی",
      clear: () => setFilterNationality("all"),
    },
    filterStatus !== "all" && {
      key: "status",
      label: "وضعیت",
      value: statusLabels[filterStatus] ?? filterStatus,
      clear: () => setFilterStatus("all"),
    },
    filterProvince !== "all" && {
      key: "prov",
      label: "استان",
      value: filterProvince,
      clear: () => {
        setFilterProvince("all");
        setFilterCity("all");
      },
    },
    filterCity !== "all" && {
      key: "city",
      label: "شهر",
      value: filterCity,
      clear: () => setFilterCity("all"),
    },
    filterReciter !== "all" && {
      key: "reciter",
      label: "قاری",
      value: filterReciter,
      clear: () => setFilterReciter("all"),
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
        title: data.alreadyJoined ? "به محفل بازگشتید" : "به محفل پیوستید",
        description: `به محفل «${s.title}» وارد شدید.`,
      });
    } catch {
      toast({
        title: "خطا در ارتباط با سرور",
        description: "لطفاً دوباره تلاش کنید",
        variant: "destructive",
      });
    } finally {
      setJoining(false);
    }
  }

  async function confirmAndEndSession() {
    const s = confirmEndSession;
    if (!s || !user || s.hostId !== user.id) return;

    setEndingId(s.id);
    try {
      const res = await fetch(`/api/sessions/${s.id}/end`, { method: "POST" });
      const data = await res.json();
      if (!data.ok) {
        throw new Error(data.error || "خطا در پایان دادن محفل");
      }
      setApiSessions((prev) => prev.filter((x) => x.id !== s.id));
      setConfirmEndSession(null);
      toast({
        title: "محفل پایان یافت",
        description: `محفل «${s.title}» با موفقیت بسته شد.`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "لطفاً دوباره تلاش کنید";
      toast({
        title: "خطا در پایان دادن",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setEndingId(null);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-noor-hero">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-4">
          <BackButtons />
        </div>

        <AdBanner slot="sessions-top" size="leaderboard" className="mb-5" />

        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <NoorBadge variant="coral" icon={<Radio className="h-3 w-3" />}>
                <span className="tabular-nums">
                  {allSessions.filter((s) => s.status === "live").length.toLocaleString("fa-IR")} محفل زنده
                </span>
              </NoorBadge>
              {refreshing && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  در حال همگام‌سازی...
                </span>
              )}
            </div>
            <h1 className="mt-3 font-display text-3xl font-extrabold text-foreground">
              محافل تلاوت قرآن
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              محفل متناسب با سبک تلاوت خود را بیابید یا میزبان محفل جدیدی شوید. فهرست به‌صورت خودکار به‌روزرسانی می‌شود.
            </p>
          </div>
          <NoorButton
            variant="yellow"
            size="lg"
            onClick={() => setView(user ? "create-session" : "auth")}
            leftIcon={<Plus className="h-5 w-5" />}
          >
            تشکیل محفل جدید
          </NoorButton>
        </div>

        <NoorCard className="mb-6">
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
                  onValueChange={(v) => setFilterRecitationType(v as RecitationType | "all")}
                >
                  <SelectTrigger className="h-10 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
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
                  <SelectTrigger className="h-10 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
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
                count={[filterNationality, filterReciter, filterProvince, filterCity].filter(
                  (v) => v !== "all",
                ).length}
                onClick={() => setShowAdvanced(!showAdvanced)}
              />
            </div>
          </div>

          {showAdvanced && (
            <div className="mt-3 grid gap-3 border-t border-border pt-3 md:grid-cols-12">
              <div className="md:col-span-3">
                <FilterField label="ملیت قاری" icon={<Globe2 className="h-3 w-3" />}>
                  <Select
                    value={filterNationality}
                    onValueChange={(v) =>
                      setFilterNationality(v as ReciterNationality | "all")
                    }
                  >
                    <SelectTrigger className="h-10 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
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
                <FilterField label="استان" icon={<MapPin className="h-3 w-3" />}>
                  <Select value={filterProvince} onValueChange={(v) => setFilterProvince(v)}>
                    <SelectTrigger className="h-10 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
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
                <FilterField label="شهر" icon={<MapPin className="h-3 w-3" />}>
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
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
              {activeChips.map((c) => (
                <FilterChip key={c.key} label={c.label} value={c.value} onClear={c.clear} />
              ))}
              <FilterResetButton onClick={resetFilters} />
            </div>
          )}
        </NoorCard>

        {loadingSessions ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div
                key={idx}
                className="h-64 animate-pulse rounded-2xl border border-border bg-card p-5"
              >
                <div className="h-4 w-24 rounded bg-muted" />
                <div className="mt-3 h-5 w-3/4 rounded bg-muted" />
                <div className="mt-6 h-3 w-1/2 rounded bg-muted" />
                <div className="mt-3 h-3 w-2/3 rounded bg-muted" />
                <div className="mt-10 h-10 w-full rounded-xl bg-muted" />
              </div>
            ))}
          </div>
        ) : fetchError ? (
          <NoorCard className="mt-6 text-center">
            <div className="py-8">
              <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-destructive/10 text-destructive">
                <AlertTriangle className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold text-foreground">خطا در دریافت محافل</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                ارتباط با سرور برقرار نشد. لطفاً مجدداً تلاش کنید.
              </p>
              <NoorButton
                variant="outline"
                size="md"
                className="mt-4"
                onClick={() => loadSessions(true)}
                leftIcon={<RefreshCw className="h-4 w-4" />}
              >
                تلاش مجدد
              </NoorButton>
            </div>
          </NoorCard>
        ) : filtered.length === 0 ? (
          <NoorCard className="mt-6 text-center">
            <div className="py-8">
              <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                <SearchX className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold text-foreground">محفلی پیدا نشد</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                فیلترها را تغییر دهید یا خودتان یک محفل جدید بسازید.
              </p>
              <NoorButton
                variant="yellow"
                size="lg"
                className="mt-4"
                onClick={() => setView(user ? "create-session" : "auth")}
                leftIcon={<Plus className="h-5 w-5" />}
              >
                تشکیل محفل جدید
              </NoorButton>
            </div>
          </NoorCard>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((s) => (
                <motion.div
                  key={s.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                >
                  <SessionCardItem
                    session={s}
                    onJoin={() => {
                      setSelected(s);
                      setPassword("");
                      setPasswordError("");
                    }}
                    onEnd={() => setConfirmEndSession(s)}
                    ending={endingId === s.id}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        <div className="mt-8">
          <AdBanner slot="sessions-mid" size="rectangle" />
        </div>

        <div className="mt-8">
          <OnlineUsersMarquee variant="full" duration={15} maxHeight="h-[460px]" />
        </div>
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 16 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md"
            >
              <NoorCard>
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
                    <h3 className="mt-2 font-display text-xl font-bold text-foreground">
                      {selected.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {selected.hostName} · {selected.recitationType}
                    </p>
                  </div>
                  <NoorAvatar
                    name={selected.hostName}
                    color={selected.hostAvatarColor}
                    size="md"
                  />
                </div>

                <div className="mb-4 space-y-2 rounded-xl border border-border bg-secondary/40 p-3.5 text-sm">
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
                    value={`${selected.attendees.toLocaleString("fa-IR")} / ${selected.capacity.toLocaleString("fa-IR")}`}
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
                    <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold">
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
                      className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    />
                    {passwordError && (
                      <p className="mt-1 text-xs font-medium text-destructive">
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
                    leftIcon={
                      joining ? <Loader2 className="h-5 w-5 animate-spin" /> : undefined
                    }
                    rightIcon={!joining ? <ArrowLeft className="h-5 w-5" /> : undefined}
                  >
                    {joining ? "در حال ورود..." : "پیوستن به محفل"}
                  </NoorButton>
                </div>
              </NoorCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmEndSession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => !endingId && setConfirmEndSession(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 12 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm"
            >
              <NoorCard>
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-destructive/12 text-destructive">
                    <Power className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-foreground">
                      پایان دادن محفل
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      آیا از بستن محفل «{confirmEndSession.title}» مطمئن هستید؟ این عملیات قابل بازگشت نیست.
                    </p>
                  </div>
                </div>
                <div className="mt-5 flex gap-2">
                  <NoorButton
                    variant="ghost"
                    size="md"
                    className="flex-1"
                    disabled={!!endingId}
                    onClick={() => setConfirmEndSession(null)}
                  >
                    انصراف
                  </NoorButton>
                  <NoorButton
                    variant="coral"
                    size="md"
                    className="flex-1"
                    disabled={!!endingId}
                    onClick={confirmAndEndSession}
                    leftIcon={
                      endingId ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Power className="h-4 w-4" />
                      )
                    }
                  >
                    {endingId ? "در حال بستن..." : "بستن محفل"}
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
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
      dot: "bg-rose-500",
      barColor: "#e11d48",
    },
    open: {
      label: "باز",
      dot: "bg-emerald-500",
      barColor: "#15803d",
    },
    private: {
      label: "خصوصی",
      dot: "bg-slate-600",
      barColor: "#334155",
    },
  };
  const cfg = statusConfig[session.status];
  const isFull = session.attendees >= session.capacity;
  const genderBlocked = Boolean(
    session.genderRestriction !== "all" &&
      user?.gender &&
      session.genderRestriction !== user.gender,
  );

  return (
    <NoorCard interactive className="flex h-full flex-col">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
              <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
            {session.passwordProtected && (
              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            {isHost && (
              <NoorBadge variant="yellow" className="py-0 text-[10px]">
                میزبان شما
              </NoorBadge>
            )}
          </div>
          <h3 className="truncate font-display text-base font-bold text-foreground">
            {session.title}
          </h3>
        </div>
        <NoorAvatar
          name={session.hostName}
          color={session.hostAvatarColor}
          size="sm"
        />
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">{session.recitationType}</span>
        <span aria-hidden="true">·</span>
        <span>{session.reciterNationality === "iranian" ? "ایرانی" : "غیرایرانی"}</span>
        <span aria-hidden="true">·</span>
        <span>سوره {session.surah}</span>
        {session.genderRestriction === "male" && (
          <>
            <span aria-hidden="true">·</span>
            <span className="font-medium text-sky-700 dark:text-sky-300">آقایان</span>
          </>
        )}
        {session.genderRestriction === "female" && (
          <>
            <span aria-hidden="true">·</span>
            <span className="font-medium text-rose-700 dark:text-rose-300">بانوان</span>
          </>
        )}
      </div>

      <p className="mb-3 line-clamp-2 flex-1 text-xs leading-relaxed text-muted-foreground">
        {session.description ?? `محفل ${session.recitationType} به میزبانی ${session.hostName}`}
      </p>

      <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          اقتدا: <strong className="text-foreground">{session.favoriteReciter}</strong>
        </span>
        {session.hostCity && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {session.hostCity}
          </span>
        )}
      </div>

      <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1 tabular-nums">
          <Users className="h-3.5 w-3.5" />
          {session.attendees.toLocaleString("fa-IR")}/{session.capacity.toLocaleString("fa-IR")}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {timeAgoFa(session.startedAt)}
        </span>
      </div>

      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            background: cfg.barColor,
            width: `${Math.min(100, (session.attendees / Math.max(1, session.capacity)) * 100)}%`,
          }}
        />
      </div>

      {isHost && onEnd && (
        <div className="mb-2.5 flex">
          <button
            onClick={onEnd}
            disabled={ending}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/15 disabled:opacity-50"
          >
            {ending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Power className="h-3.5 w-3.5" />
            )}
            پایان محفل
          </button>
        </div>
      )}

      <NoorButton
        variant={isFull ? "ghost" : session.status === "live" ? "coral" : "green"}
        size="md"
        className="w-full"
        onClick={onJoin}
        disabled={isFull || genderBlocked}
        rightIcon={<ArrowLeft className="h-4 w-4" />}
      >
        {isFull
          ? "ظرفیت تکمیل است"
          : isHost
            ? "ورود به محفل"
            : genderBlocked
              ? session.genderRestriction === "male"
                ? "فقط آقایان"
                : "فقط بانوان"
              : "پیوستن"}
      </NoorButton>
    </NoorCard>
  );
}
