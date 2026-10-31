"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Sparkles, Lock, Users, Mic, Plus, Loader2, Check } from "lucide-react";
import { NoorButton } from "../noor-button";
import { NoorCard } from "../noor-card";
import { NoorBadge } from "../noor-badge";
import { BackButtons } from "../back-buttons";
import { OnlineUsersMarquee } from "../online-users-marquee";
import { AdBanner } from "../ad-banner";
import { useNoorStore } from "@/store/noor-store";
import {
  RECITATION_TYPES,
  getReciters,
} from "@/lib/noorcraft/constants";
import type { RecitationType, ReciterNationality } from "@/lib/noorcraft/types";
import type { SessionDetail } from "@/lib/noorcraft/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

// ۱۰ قاری غیرایرانی برتر سبک تحقیق برای انتخاب سریع
const TOP_FOREIGN_TAHQIQ_RECITERS = [
  "عبدالباسط محمد عبدالصمد",
  "مصطفی اسماعیل",
  "شحات محمد انور",
  "محمد صدیق منشاوی",
  "راغب مصطفی غلوش",
  "کامل یوسف بهتیمی",
  "محمد اللیثی",
  "محمود شحات انور",
  "محمد محمود طبلاوی",
  "عبدالعزیز عکاشه",
];

// ۱۰ قاری غیرایرانی برتر سبک ترتیل برای انتخاب سریع
const TOP_FOREIGN_TARTIL_RECITERS = [
  "عبدالرحمن السدیس",
  "سعد الغامدی",
  "احمد بن علی العجمی",
  "احمد بن علی الحذیفی",
  "عبدالباری الثبیتی",
  "عبدالله بن عواد الجهنی",
  "خالد الغامدی",
  "عبدالرشید صوفی",
  "محمد أيوب",
  "علی بن عبدالله جابر",
];

// رنگ‌های گرادیان برای هر قاری (برای کارت‌های انتخاب)
const RECITER_COLORS = [
  "#FFD700", "#FF7F7F", "#87CEEB", "#7CFC00", "#9d4edd",
  "#FFA500", "#06d6a0", "#118ab2", "#ef476f", "#f78c6b",
];

const schema = z.object({
  title: z.string().max(80, "عنوان بسیار طولانی است").optional(),
  recitationType: z.string().min(1, "نوع تلاوت را انتخاب کنید"),
  favoriteReciter: z.string().min(1, "سبک استاد را انتخاب کنید"),
  capacity: z
    .number({ invalid_type_error: "ظرفیت را به عدد وارد کنید" })
    .int()
    .min(2, "حداقل ۲ نفر")
    .max(50, "حداکثر ۵۰ نفر"),
  isPrivate: z.boolean().default(false),
  password: z.string().optional(),
});

type Form = z.infer<typeof schema>;

export function CreateSessionView() {
  const setView = useNoorStore((s) => s.setView);
  const setActiveSession = useNoorStore((s) => s.setActiveSession);
  const user = useNoorStore((s) => s.user);
  const { toast } = useToast();

  const form = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      recitationType: user?.recitationType ?? "",
      favoriteReciter: user?.favoriteReciter ?? "",
      capacity: 10,
      isPrivate: false,
      password: "",
    },
  });

  const isPrivate = form.watch("isPrivate");
  const selectedRecitationType = form.watch("recitationType");
  const selectedReciter = form.watch("favoriteReciter");

  // Pick the right top-10 list based on recitation type
  const topReciters =
    selectedRecitationType === "تحقیق"
      ? TOP_FOREIGN_TAHQIQ_RECITERS
      : selectedRecitationType === "ترتیل"
        ? TOP_FOREIGN_TARTIL_RECITERS
        : [];

  function onRecitationTypeChange(value: string) {
    form.setValue("recitationType", value, { shouldValidate: true });
    form.setValue("favoriteReciter", "");
  }

  const [creating, setCreating] = useState(false);

  async function onSubmit(values: Form) {
    if (values.isPrivate && !values.password) {
      form.setError("password", {
        message: "برای محفل خصوصی رمز عبور الزامی است",
      });
      return;
    }
    if (!user) return;
    setCreating(true);

    // اگر نام وارد نشده، یک نام خودکار بساز
    const finalTitle = values.title?.trim() || `محفل - #${Math.floor(Math.random() * 9000) + 1000}`;

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: finalTitle,
          recitationType: values.recitationType,
          reciterNationality: "foreign",
          favoriteReciter: values.favoriteReciter,
          surah: "—",
          capacity: values.capacity,
          isPrivate: values.isPrivate,
          password: values.password,
          genderRestriction: user.gender || "male",
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        throw new Error(data.error || "خطا در ایجاد محفل");
      }

      const newSession: SessionDetail = {
        id: data.sessionId,
        title: finalTitle,
        hostId: user.id,
        hostName: user.fullName,
        hostGender: user.gender,
        recitationType: values.recitationType as RecitationType,
        reciterNationality: "foreign" as ReciterNationality,
        favoriteReciter: values.favoriteReciter,
        surah: "—",
        capacity: values.capacity,
        attendees: 1,
        status: values.isPrivate ? "private" : "open",
        passwordProtected: values.isPrivate,
        genderRestriction: data.genderRestriction || user.gender || "male",
        startedAt: Date.now(),
        description: undefined,
        hostAvatarColor: user.avatarColor,
        jitsiRoom: data.jitsiRoom,
      };
      setActiveSession(newSession);
      toast({
        title: "محفل ساخته شد! 🎉",
        description: `محفل «${finalTitle}» با موفقیت ایجاد شد.`,
      });
      setView("session-room");
    } catch (err: any) {
      toast({
        title: "خطا در ایجاد محفل",
        description: err.message || "لطفاً دوباره تلاش کنید",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-noor-hero py-8">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* Back button */}
        <div className="mb-4">
          <BackButtons />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 text-center"
        >
          <NoorBadge variant="green" icon={<Sparkles className="h-3 w-3" />}>
            محفل شخصی خود را بسازید
          </NoorBadge>
          <h1 className="mt-3 text-3xl font-extrabold text-noor-navy dark:text-white">
            تشکیل محفل تلاوت
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            محفلی تازه بسازید و از قاریان دعوت کنید
          </p>
        </motion.div>

        {/* Two-column layout on desktop: form on the right, online users marquee on the left.
            On mobile, marquee goes below the form. Marquee is sticky on desktop so it
            stays visible while the form is being filled out. */}
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="lg:order-2">
        <NoorCard className="noor-card-sky">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Title — optional */}
            <FormField
              label="نام محفل (اختیاری)"
              icon={<Sparkles className="h-4 w-4" />}
              error={form.formState.errors.title?.message}
            >
              <Input
                placeholder="مثال: محفل ترتیل آیات نور — اگر خالی بگذارید، نام‌گذاری خودکار انجام می‌شود"
                {...form.register("title")}
                autoFocus
              />
            </FormField>

            {/* Recitation type — visual cards */}
            <FormField
              label="نوع تلاوت"
              icon={<Mic className="h-4 w-4" />}
              error={form.formState.errors.recitationType?.message}
            >
              <div className="grid grid-cols-2 gap-2 pt-1">
                {RECITATION_TYPES.map((t) => {
                  const selected = selectedRecitationType === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => onRecitationTypeChange(t)}
                      className={`flex flex-col items-center gap-0.5 rounded-xl border-2 p-3 transition ${
                        selected
                          ? "border-noor-green bg-noor-green/15 text-green-700 dark:text-lime-300"
                          : "border-muted-foreground/20 hover:border-noor-sky"
                      }`}
                    >
                      <span className="text-base font-bold">{t}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {t === "تحقیق" ? "رعایت دقیق قواعد" : "آرام و تأمل‌برانگیز"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </FormField>

            {/* Reciter selection — visual grid based on recitation type */}
            <FormField
              label="سبک استاد"
              icon={<Mic className="h-4 w-4" />}
              error={form.formState.errors.favoriteReciter?.message}
            >
              {!selectedRecitationType ? (
                <div className="rounded-xl bg-muted/20 p-3 text-center text-xs text-muted-foreground">
                  ابتدا نوع تلاوت را انتخاب کنید
                </div>
              ) : (
                <>
                  {/* Top 10 reciters grid */}
                  <div className="grid grid-cols-2 gap-2 pt-1 sm:grid-cols-3">
                    {topReciters.map((name, i) => {
                      const selected = selectedReciter === name;
                      const color = RECITER_COLORS[i % RECITER_COLORS.length];
                      return (
                        <motion.button
                          key={name}
                          type="button"
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() =>
                            form.setValue("favoriteReciter", name, { shouldValidate: true })
                          }
                          className={`relative flex items-center gap-2 rounded-xl border-2 p-2.5 text-right transition ${
                            selected
                              ? "border-noor-green bg-noor-green/10"
                              : "border-muted-foreground/20 hover:border-noor-sky/50"
                          }`}
                        >
                          <div
                            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold text-noor-navy"
                            style={{ background: color }}
                          >
                            {name.charAt(0)}
                          </div>
                          <span className="min-w-0 flex-1 text-xs font-bold text-noor-navy dark:text-white">
                            {name}
                          </span>
                          {selected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-noor-green text-noor-navy"
                            >
                              <Check className="h-3 w-3" />
                            </motion.div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* "سایر" button — opens a dropdown of all reciters */}
                  <div className="mt-2">
                    <ReciterOtherSelect
                      type={selectedRecitationType as RecitationType}
                      value={selectedReciter}
                      isTopReciter={topReciters.includes(selectedReciter)}
                      onChange={(v) =>
                        form.setValue("favoriteReciter", v, { shouldValidate: true })
                      }
                    />
                  </div>
                </>
              )}
            </FormField>

            {/* Capacity + private toggle — compact */}
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField
                label="ظرفیت"
                icon={<Users className="h-4 w-4" />}
                error={form.formState.errors.capacity?.message}
              >
                <Input
                  type="number"
                  min={2}
                  max={50}
                  {...form.register("capacity", { valueAsNumber: true })}
                />
              </FormField>

              <FormField label="محفل خصوصی؟" icon={<Lock className="h-4 w-4" />}>
                <div className="flex items-center gap-2 rounded-xl border border-input bg-background px-3 py-2">
                  <Switch
                    checked={isPrivate}
                    onCheckedChange={(v) => form.setValue("isPrivate", v)}
                  />
                  <span className="text-xs text-muted-foreground">
                    {isPrivate ? "با رمز عبور" : "عمومی — همه می‌توانند بپیوندند"}
                  </span>
                </div>
              </FormField>
            </div>

            {/* Private password — only shows if private */}
            {isPrivate && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
              >
                <FormField
                  label="رمز محفل"
                  icon={<Lock className="h-4 w-4" />}
                  error={form.formState.errors.password?.message}
                >
                  <Input
                    type="password"
                    dir="ltr"
                    placeholder="رمز را وارد کنید"
                    {...form.register("password")}
                  />
                </FormField>
              </motion.div>
            )}

            {/* Info note about surah */}
            <div className="rounded-xl bg-noor-sky/10 p-2.5 text-center text-[11px] text-muted-foreground">
              📋 سوره و آیات پس از ورود به محفل، در «شروع منافسه» انتخاب می‌شود
            </div>

            {/* Submit */}
            <div className="flex gap-2 pt-2">
              <NoorButton
                type="button"
                variant="ghost"
                size="lg"
                className="flex-1"
                onClick={() => setView("dashboard")}
                disabled={creating}
              >
                انصراف
              </NoorButton>
              <NoorButton
                type="submit"
                variant="yellow"
                size="lg"
                className="flex-1"
                leftIcon={creating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                disabled={creating}
              >
                {creating ? "در حال ایجاد..." : "ایجاد محفل"}
              </NoorButton>
            </div>
          </form>
        </NoorCard>
          </div>

          {/* Online users marquee — sticky sidebar on desktop, below form on mobile */}
          <div className="lg:order-1">
            <div className="lg:sticky lg:top-4 space-y-4">
              <OnlineUsersMarquee
                variant="compact"
                duration={15}
                maxHeight="h-[400px]"
              />
              {/* AD: Medium Rectangle — زیر نوار آنلاین‌ها در ستون کناری */}
              <AdBanner slot="create-session-side" size="rectangle" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormField({
  label,
  icon,
  error,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5 text-sm font-bold">
        {icon}
        {label}
      </Label>
      {children}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs font-medium text-noor-coral"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}

/** "سایر" — dropdown with ALL foreign reciters of the selected type. */
function ReciterOtherSelect({
  type,
  value,
  isTopReciter,
  onChange,
}: {
  type: RecitationType;
  value: string;
  isTopReciter: boolean;
  onChange: (v: string) => void;
}) {
  // Get the full list of foreign reciters for this type
  const allReciters = getReciters(type, "foreign");
  // Exclude the top-10 already shown as cards
  const topRecitersList =
    type === "تحقیق" ? TOP_FOREIGN_TAHQIQ_RECITERS : TOP_FOREIGN_TARTIL_RECITERS;
  const otherReciters = allReciters.filter((r) => !topRecitersList.includes(r));

  return (
    <Select
      value={isTopReciter ? "" : value}
      onValueChange={onChange}
    >
      <SelectTrigger className="bg-muted/20">
        <SelectValue placeholder="🔎 سایر قاریان..." />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {otherReciters.map((r) => (
          <SelectItem key={r} value={r}>
            {r}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
