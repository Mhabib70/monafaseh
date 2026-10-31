"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  LogIn,
  UserPlus,
  Mail,
  Lock,
  MapPin,
  User,
  Calendar,
  CheckCircle2,
  Tag,
  Globe2,
  Mic2,
  Phone,
  Send,
  GraduationCap,
  Heart,
  MessageSquareText,
  Gift,
  ChevronLeft,
  ChevronRight,
  Shield,
} from "lucide-react";
import { NoorButton } from "../noor-button";
import { NoorCard } from "../noor-card";
import { NoorBadge } from "../noor-badge";
import { ParticleEffect } from "../particle-effect";
import { AvatarUploader } from "../avatar-uploader";
import { useNoorStore, makeStarterUser, calculateProfileCompletion } from "@/store/noor-store";
import {
  IRAN_PROVINCES,
  QURAN_INTERESTS,
  RECITATION_SKILLS,
  RECITATION_TYPES,
  getReciters,
  GENDER_OPTIONS,
  EDUCATION_OPTIONS,
} from "@/lib/noorcraft/constants";
import type { RecitationType, ReciterNationality } from "@/lib/noorcraft/types";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { PLATFORM_RULES, PLEDGE_TEXT } from "@/lib/noorcraft/rules";

// Phone validation — Iranian format
const phoneRegex = /^09\d{9}$/;

const registerSchema = z.object({
  fullName: z
    .string()
    .min(3, "نام و نام خانوادگی حداقل ۳ نویسه باشد")
    .max(60, "نام بسیار طولانی است"),
  age: z
    .number({ invalid_type_error: "سن را به عدد وارد کنید" })
    .int("سن باید عدد صحیح باشد")
    .min(8, "حداقل سن ۸ سال است")
    .max(99, "حداکثر سن ۹۹ سال است"),
  gender: z.string().optional(),
  province: z.string().min(1, "استان را انتخاب کنید"),
  city: z.string().min(1, "شهر را انتخاب کنید"),
  phone: z
    .string()
    .min(1, "شماره تماس الزامی است")
    .regex(phoneRegex, "شماره تماس معتبر نیست (مثال: 09123456789)"),
  email: z.string().email("ایمیل معتبر نیست"),
  password: z.string().min(6, "رمز عبور حداقل ۶ نویسه باشد"),
  telegramId: z.string().optional(),
  education: z.string().optional(),
  bio: z.string().max(280, "معرفی بسیار طولانی است").optional(),
  referredBy: z.string().optional(),
  recitationType: z.string().min(1, "نوع تلاوت را انتخاب کنید"),
  reciterNationality: z.string().min(1, "ملیت قاری را انتخاب کنید"),
  favoriteReciter: z.string().min(1, "قاری مورد اقتدا را انتخاب کنید"),
  recitationSkills: z
    .array(z.string())
    .min(1, "حداقل یک مهارت تلاوت انتخاب کنید"),
  interests: z.array(z.string()).default([]),
});

type RegisterForm = z.infer<typeof registerSchema>;

const loginSchema = z.object({
  identifier: z.string().min(1, "ایمیل یا شماره موبایل را وارد کنید"),
  password: z.string().min(1, "رمز عبور را وارد کنید"),
});

type LoginForm = z.infer<typeof loginSchema>;

export function AuthView() {
  const user = useNoorStore((s) => s.user);
  const isEditMode = !!user; // اگر کاربر لاگین کرده، حالت ویرایش پروفایل است

  const [mode, setMode] = useState<"login" | "register">(isEditMode ? "register" : "register");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatarUrl ?? null);
  const [rulesAccepted, setRulesAccepted] = useState(false);

  const signIn = useNoorStore((s) => s.signIn);
  const setView = useNoorStore((s) => s.setView);
  const eitaaAvailable = useNoorStore((s) => s.eitaaAvailable);
  const { toast } = useToast();

  // ── برنامک ایتا: ورود یکپارچه ──────────────────────────────
  const PENDING_EITAA_KEY = "monafaseh_eitaa_pending_init";

  async function handleEitaaLogin() {
    const initData = window.Eitaa?.WebApp?.initData;
    if (!initData) {
      toast({
        title: "ایتا در دسترس نیست",
        description: "برنامک باید از داخل پیام‌رسان ایتا باز شود.",
        variant: "destructive",
      });
      return;
    }
    try {
      const res = await fetch("/api/eitaa/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData }),
      });
      const d = await res.json();
      if (d.ok && d.linked && d.user) {
        signIn(d.user);
        toast({ title: "ورود موفق ✓", description: "با حساب ایتا وارد شدید." });
        setView("dashboard");
      } else if (d.ok && !d.linked) {
        // حساب ایتا معتبر است ولی هنوز به حساب منافسه متصل نیست؛
        // بعد از ورود/ثبت‌نام معمولی، خودکار متصل می‌شود.
        try {
          sessionStorage.setItem(PENDING_EITAA_KEY, initData);
        } catch {}
        toast({
          title: "حساب ایتا شناسایی شد",
          description:
            "برای اتصال، یک‌بار با ایمیل و رمز عبور وارد شوید یا ثبت‌نام کنید — بعد از آن برای همیشه با یک ضربه وارد می‌شوید.",
        });
        setMode("login");
      } else {
        throw new Error(d.error);
      }
    } catch (err: any) {
      toast({
        title: "خطا در ورود با ایتا",
        description: err?.message || "لطفاً دوباره تلاش کنید",
        variant: "destructive",
      });
    }
  }

  // بعد از ورود/ثبت‌نام معمولی — اتصال خودکار حساب ایتای در انتظار
  async function linkPendingEitaa() {
    let initData: string | null = null;
    try {
      initData = sessionStorage.getItem(PENDING_EITAA_KEY);
    } catch {}
    if (!initData) return;
    try {
      const res = await fetch("/api/eitaa/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData }),
      });
      const d = await res.json();
      if (d.ok) {
        try {
          sessionStorage.removeItem(PENDING_EITAA_KEY);
        } catch {}
        toast({
          title: "حساب ایتا متصل شد ✅",
          description: "از این پس از داخل ایتا بدون رمز عبور وارد می‌شوید.",
        });
      }
    } catch {}
  }

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
    defaultValues: {
      fullName: user?.fullName ?? "",
      age: user?.age ?? (undefined as unknown as number),
      gender: user?.gender ?? "",
      province: user?.province ?? "",
      city: user?.city ?? "",
      phone: user?.phone ?? "",
      email: user?.email ?? "",
      password: "",
      telegramId: user?.telegramId ?? "",
      education: user?.education ?? "",
      bio: user?.bio ?? "",
      referredBy: user?.referredBy ?? "",
      recitationType: user?.recitationType ?? "",
      reciterNationality: user?.reciterNationality ?? "",
      favoriteReciter: user?.favoriteReciter ?? "",
      recitationSkills: user?.recitationSkills ?? [],
      interests: user?.interests ?? [],
    },
  });

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "" },
  });

  // Watchers for cascading dropdowns
  const selectedProvince = registerForm.watch("province");
  const selectedRecitationType = registerForm.watch("recitationType");
  const selectedNationality = registerForm.watch("reciterNationality");
  const watchedValues = registerForm.watch();

  // Calculate live profile completion
  const liveCompletion = calculateProfileCompletion({
    ...watchedValues,
    avatarUrl,
  });

  // Get cities for selected province
  const provinceData = IRAN_PROVINCES.find((p) => p.name === selectedProvince);
  const availableCities = provinceData?.cities ?? [];

  // Get reciters based on type + nationality
  const availableReciters =
    selectedRecitationType && selectedNationality
      ? getReciters(
          selectedRecitationType as RecitationType,
          selectedNationality as ReciterNationality,
        )
      : [];

  // Reset dependent fields when parent changes
  function onProvinceChange(value: string) {
    registerForm.setValue("province", value, { shouldValidate: true });
    registerForm.setValue("city", "");
  }

  function onRecitationTypeChange(value: string) {
    registerForm.setValue("recitationType", value, { shouldValidate: true });
    registerForm.setValue("reciterNationality", "");
    registerForm.setValue("favoriteReciter", "");
  }

  function onNationalityChange(value: string) {
    registerForm.setValue("reciterNationality", value, { shouldValidate: true });
    registerForm.setValue("favoriteReciter", "");
  }

  function nextStep() {
    // Validate current step fields
    const fieldsByStep: Record<number, (keyof RegisterForm)[]> = {
      1: ["fullName", "age", "gender", "province", "city"],
      2: ["phone", "email", "password"],
      3: ["recitationType", "reciterNationality", "favoriteReciter", "recitationSkills"],
    };
    const fields = fieldsByStep[step];
    let valid = true;
    for (const f of fields) {
      const err = registerForm.formState.errors[f];
      const val = registerForm.getValues(f);
      if (err || (!val && f !== "gender")) {
        registerForm.trigger(f);
        valid = false;
      }
    }
    if (valid && step < 3) {
      setStep((step + 1) as 1 | 2 | 3);
    }
  }

  function prevStep() {
    if (step > 1) setStep((step - 1) as 1 | 2 | 3);
  }

  const [registering, setRegistering] = useState(false);

  async function handleRegister(values: RegisterForm) {
    // اگر کاربر لاگین کرده، این حالت ویرایش پروفایل است نه ثبت‌نام
    if (isEditMode && user) {
      setRegistering(true);
      try {
        const res = await fetch("/api/users/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: values.fullName,
            age: values.age,
            gender: values.gender,
            province: values.province,
            city: values.city,
            phone: values.phone,
            telegramId: values.telegramId,
            education: values.education,
            bio: values.bio,
            referredBy: values.referredBy,
            recitationType: values.recitationType,
            reciterNationality: values.reciterNationality,
            favoriteReciter: values.favoriteReciter,
            recitationSkills: values.recitationSkills,
            interests: values.interests,
            avatarUrl,
          }),
        });
        const data = await res.json();
        if (data.ok) {
          // Update local store with new user data
          signIn({ ...user, ...data.user });
          toast({
            title: "پروفایل به‌روز شد! ✓",
            description: "تغییرات شما با موفقیت ذخیره شد.",
          });
          setView("dashboard");
        } else {
          throw new Error(data.error || "خطا در به‌روزرسانی");
        }
      } catch (err: any) {
        toast({
          title: "خطا در به‌روزرسانی",
          description: err.message || "لطفاً دوباره تلاش کنید",
          variant: "destructive",
        });
      } finally {
        setRegistering(false);
      }
      return;
    }

    // Check rules accepted (فقط در حالت ثبت‌نام جدید)
    if (!rulesAccepted) {
      toast({
        title: "پذیرش قوانین الزامی است",
        description: "برای ثبت‌نام باید قوانین و تعهد شرعی-اخلاقی را بپذیرید.",
        variant: "destructive",
      });
      return;
    }
    // Check gender selected
    if (!values.gender) {
      toast({
        title: "انتخاب جنسیت الزامی است",
        description: "برای جداسازی محافل، انتخاب جنسیت حقیقی الزامی است.",
        variant: "destructive",
      });
      return;
    }
    setRegistering(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: values.fullName,
          age: values.age,
          gender: values.gender,
          province: values.province,
          city: values.city,
          email: values.email,
          password: values.password,
          phone: values.phone,
          telegramId: values.telegramId,
          education: values.education,
          bio: values.bio,
          referredBy: values.referredBy,
          recitationType: values.recitationType,
          reciterNationality: values.reciterNationality,
          favoriteReciter: values.favoriteReciter,
          recitationSkills: values.recitationSkills,
          interests: values.interests,
          avatarUrl,
        }),
      });

      const data = await res.json();

      if (!data.ok) {
        toast({
          title: "خطا در ثبت‌نام",
          description: data.error || "ثبت‌نام ناموفق بود",
          variant: "destructive",
        });
        return;
      }

      // Login is automatic — cookie is set by server
      signIn(data.user);
      linkPendingEitaa();
      toast({
        title: "خوش آمدید! ✨",
        description: `حساب کاربری ${values.fullName} با موفقیت ساخته شد.`,
      });
      setView("dashboard");
    } catch (err) {
      toast({
        title: "خطای شبکه",
        description: "اتصال به سرور برقرار نشد.",
        variant: "destructive",
      });
    } finally {
      setRegistering(false);
    }
  }

  const [loggingIn, setLoggingIn] = useState(false);

  async function handleLogin(values: LoginForm) {
    setLoggingIn(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.identifier,
          password: values.password,
        }),
      });

      const data = await res.json();

      if (!data.ok) {
        toast({
          title: "ورود ناموفق",
          description: data.error || "ایمیل یا رمز عبور اشتباه است.",
          variant: "destructive",
        });
        return;
      }

      signIn(data.user);
      linkPendingEitaa();
      toast({
        title: "ورود موفق ✓",
        description: "خوشحالیم که بازگشتید!",
      });
      setView("dashboard");
    } catch (err) {
      toast({
        title: "خطای شبکه",
        description: "اتصال به سرور برقرار نشد.",
        variant: "destructive",
      });
    } finally {
      setLoggingIn(false);
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-noor-hero py-8">
      <ParticleEffect density={30} className="opacity-50" />
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto mb-6 text-center"
        >
          <NoorBadge variant="yellow" icon={<Sparkles className="h-3 w-3" />}>
            {isEditMode ? "ویرایش پروفایل" : "ورود به محفل منافسه"}
          </NoorBadge>
          <h1 className="mt-3 text-3xl font-extrabold text-noor-navy dark:text-white sm:text-4xl">
            {isEditMode
              ? "ویرایش پروفایل"
              : mode === "register"
                ? "ثبت‌نام در منافسه"
                : "ورود به حساب کاربری"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isEditMode
              ? "اطلاعات خود را به‌روز کنید و امتیاز نور کسب کنید"
              : mode === "register"
                ? "در سه گام ساده به جمع قاریان منافسه بپیوندید"
                : "ایمیل یا شماره موبایل و رمز عبور خود را وارد کنید"}
          </p>
        </motion.div>

        {/* Tabs — فقط در حالت غیر ویرایش نمایش داده می‌شود */}
        {!isEditMode && (
        <div className="mx-auto mb-6 flex w-full max-w-md gap-2 rounded-full bg-white/60 dark:bg-transparent p-1.5 backdrop-blur">
          <TabButton
            active={mode === "register"}
            onClick={() => {
              setMode("register");
              setStep(1);
            }}
          >
            ثبت‌نام
          </TabButton>
          <TabButton
            active={mode === "login"}
            onClick={() => setMode("login")}
          >
            ورود
          </TabButton>
        </div>
        )}

        <AnimatePresence mode="wait">
          {(mode === "register" || isEditMode) ? (
            <motion.div
              key="register"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <NoorCard className="mx-auto max-w-2xl noor-card-sky">
                {/* Progress bar */}
                <div className="mb-6">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground">
                      گام {step} از ۳
                    </span>
                    <span className="text-xs font-bold text-noor-navy dark:text-white">
                      تکمیل پروفایل: {liveCompletion}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-l from-noor-coral via-noor-yellow to-noor-green"
                      animate={{ width: `${(step / 3) * 100}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>

                <form
                  onSubmit={registerForm.handleSubmit(handleRegister)}
                  className="space-y-5"
                >
                  {/* STEP 1: Basic Info + Avatar */}
                  <AnimatePresence mode="wait">
                    {step === 1 && (
                      <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-5"
                      >
                        {/* Avatar uploader */}
                        <div className="flex justify-center">
                          <AvatarUploader
                            value={avatarUrl}
                            onChange={setAvatarUrl}
                            userName={registerForm.watch("fullName")}
                            size="lg"
                          />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <Field
                            label="نام و نام خانوادگی"
                            icon={<User className="h-4 w-4" />}
                            error={registerForm.formState.errors.fullName?.message}
                          >
                            <Input
                              placeholder="مثال: محمد رضایی"
                              {...registerForm.register("fullName")}
                            />
                          </Field>

                          <Field
                            label="سن"
                            icon={<Calendar className="h-4 w-4" />}
                            error={registerForm.formState.errors.age?.message}
                          >
                            <Input
                              type="number"
                              min={8}
                              max={99}
                              placeholder="۲۵"
                              {...registerForm.register("age", {
                                valueAsNumber: true,
                              })}
                            />
                          </Field>
                        </div>

                        <Field
                          label="جنسیت"
                          icon={<Heart className="h-4 w-4" />}
                          error={registerForm.formState.errors.gender?.message}
                        >
                          <div className="grid grid-cols-2 gap-3 pt-1">
                            {GENDER_OPTIONS.map((g) => {
                              const selected = registerForm.watch("gender") === g.value;
                              return (
                                <button
                                  key={g.value}
                                  type="button"
                                  onClick={() =>
                                    registerForm.setValue("gender", g.value, {
                                      shouldValidate: true,
                                    })
                                  }
                                  className={`rounded-2xl border-2 p-3 text-sm font-bold transition ${
                                    selected
                                      ? "border-noor-green bg-noor-green/15 text-green-700 dark:text-lime-300"
                                      : "border-muted-foreground/20 hover:border-noor-sky"
                                  }`}
                                >
                                  {g.label}
                                </button>
                              );
                            })}
                          </div>
                        </Field>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <Field
                            label="استان"
                            icon={<MapPin className="h-4 w-4" />}
                            error={registerForm.formState.errors.province?.message}
                          >
                            <Select
                              value={selectedProvince}
                              onValueChange={onProvinceChange}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="ابتدا استان را انتخاب کنید" />
                              </SelectTrigger>
                              <SelectContent className="max-h-72">
                                {IRAN_PROVINCES.map((p) => (
                                  <SelectItem key={p.name} value={p.name}>
                                    {p.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </Field>

                          <Field
                            label="شهر"
                            icon={<MapPin className="h-4 w-4" />}
                            error={registerForm.formState.errors.city?.message}
                          >
                            <Select
                              value={registerForm.watch("city")}
                              onValueChange={(v) =>
                                registerForm.setValue("city", v, {
                                  shouldValidate: true,
                                })
                              }
                              disabled={!selectedProvince}
                            >
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={
                                    selectedProvince
                                      ? "شهر را انتخاب کنید"
                                      : "ابتدا استان را انتخاب کنید"
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent className="max-h-72">
                                {availableCities.map((c) => (
                                  <SelectItem key={c} value={c}>
                                    {c}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </Field>
                        </div>

                        {/* Personal info */}
                        <div className="grid gap-4 sm:grid-cols-2">
                          <Field
                            label="تحصیلات (اختیاری)"
                            icon={<GraduationCap className="h-4 w-4" />}
                          >
                            <Select
                              value={registerForm.watch("education")}
                              onValueChange={(v) =>
                                registerForm.setValue("education", v)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="انتخاب تحصیلات" />
                              </SelectTrigger>
                              <SelectContent className="max-h-72">
                                {EDUCATION_OPTIONS.map((e) => (
                                  <SelectItem key={e} value={e}>
                                    {e}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </Field>

                          <Field
                            label="معرف (اختیاری)"
                            icon={<Gift className="h-4 w-4" />}
                          >
                            <Input
                              placeholder="نام یا کد معرف"
                              {...registerForm.register("referredBy")}
                            />
                          </Field>
                        </div>

                        <Field
                          label="معرفی کوتاه (اختیاری)"
                          icon={<MessageSquareText className="h-4 w-4" />}
                        >
                          <Textarea
                            rows={2}
                            placeholder="درباره خودتان و علاقه‌تان به قرآن چند خط بنویسید..."
                            {...registerForm.register("bio")}
                          />
                        </Field>

                        <div className="flex justify-end">
                          <NoorButton
                            type="button"
                            variant="yellow"
                            size="lg"
                            onClick={nextStep}
                            rightIcon={<ChevronLeft className="h-5 w-5" />}
                          >
                            گام بعد
                          </NoorButton>
                        </div>
                      </motion.div>
                    )}

                    {/* STEP 2: Contact */}
                    {step === 2 && (
                      <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-5"
                      >
                        <div className="rounded-xl bg-noor-yellow/15 p-4 text-center">
                          <p className="text-sm font-bold text-noor-navy dark:text-white">
                            📞 اطلاعات تماس
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            با تکمیل این اطلاعات، ۳۰ امتیاز نور دریافت می‌کنید!
                          </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <Field
                            label="شماره تماس"
                            icon={<Phone className="h-4 w-4" />}
                            error={registerForm.formState.errors.phone?.message}
                          >
                            <Input
                              type="tel"
                              dir="ltr"
                              placeholder="09123456789"
                              {...registerForm.register("phone")}
                            />
                          </Field>

                          <Field
                            label="ایمیل"
                            icon={<Mail className="h-4 w-4" />}
                            error={registerForm.formState.errors.email?.message}
                          >
                            <Input
                              type="email"
                              dir="ltr"
                              placeholder="you@example.com"
                              {...registerForm.register("email")}
                            />
                          </Field>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <Field
                            label="رمز عبور"
                            icon={<Lock className="h-4 w-4" />}
                            error={registerForm.formState.errors.password?.message}
                          >
                            <Input
                              type="password"
                              dir="ltr"
                              placeholder="••••••"
                              {...registerForm.register("password")}
                            />
                          </Field>

                          <Field
                            label="آیدی تلگرام (اختیاری)"
                            icon={<Send className="h-4 w-4" />}
                          >
                            <Input
                              dir="ltr"
                              placeholder="@username"
                              {...registerForm.register("telegramId")}
                            />
                          </Field>
                        </div>

                        {/* Gender Selection — required before rules */}
                        <Field
                          label="جنسیت (الزامی — برای جداسازی محافل)"
                          icon={<Heart className="h-4 w-4" />}
                          error={registerForm.formState.errors.gender?.message}
                        >
                          <div className="grid grid-cols-2 gap-3 pt-1">
                            {[
                              { value: "male", label: "آقا" },
                              { value: "female", label: "خانم" },
                            ].map((g) => {
                              const selected = registerForm.watch("gender") === g.value;
                              return (
                                <button
                                  key={g.value}
                                  type="button"
                                  onClick={() =>
                                    registerForm.setValue("gender", g.value, {
                                      shouldValidate: true,
                                    })
                                  }
                                  className={`flex flex-col items-center gap-1 rounded-2xl border-2 p-4 text-sm font-bold transition ${
                                    selected
                                      ? "border-noor-green bg-noor-green/15 text-green-700 dark:text-lime-300"
                                      : "border-muted-foreground/20 hover:border-noor-sky"
                                  }`}
                                >
                                  {g.label}
                                </button>
                              );
                            })}
                          </div>
                          <p className="mt-2 text-[10px] text-noor-coral">
                            ⚠️ انتخاب جنسیت جانبی برای ورود به محافل مخالف، تخلف شرعی است و موجب حذف دائمی حساب می‌شود.
                          </p>
                        </Field>

                        {/* Rules and Pledge — فقط در حالت ثبت‌نام جدید */}
                        {!isEditMode && (
                        <div className="rounded-2xl border-2 border-noor-navy/15 bg-gradient-to-br from-noor-sky/5 to-noor-yellow/5 p-4">
                          <div className="mb-3 flex items-center gap-2">
                            <Shield className="h-5 w-5 text-noor-navy dark:text-white" />
                            <h4 className="text-sm font-bold">
                              قوانین و تعهد شرعی-اخلاقی منافسه
                            </h4>
                          </div>

                          <div className="max-h-48 space-y-2 overflow-y-auto rounded-xl bg-muted/30 p-3">
                            {PLATFORM_RULES.map((rule) => (
                              <div key={rule.id} className="text-xs">
                                <div className="flex items-center gap-1.5">
                                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-noor-navy text-[9px] font-bold text-white">
                                    {rule.id.toLocaleString("fa-IR")}
                                  </span>
                                  <span className="font-bold">{rule.title}</span>
                                  <span
                                    className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold ${
                                      rule.category === "شرعی"
                                        ? "bg-noor-green/20 text-green-700 dark:text-lime-300"
                                        : rule.category === "اخلاقی"
                                          ? "bg-noor-sky/20 text-sky-700 dark:text-sky-300"
                                          : "bg-muted text-muted-foreground"
                                    }`}
                                  >
                                    {rule.category}
                                  </span>
                                </div>
                                <p className="mt-0.5 pr-6 leading-relaxed text-muted-foreground">
                                  {rule.description}
                                </p>
                              </div>
                            ))}
                          </div>

                          {/* Pledge text */}
                          <div className="mt-3 rounded-xl bg-noor-yellow/15 p-3 text-center">
                            <p className="text-xs font-bold leading-relaxed text-noor-navy dark:text-white">
                              {PLEDGE_TEXT}
                            </p>
                          </div>

                          {/* Accept switch */}
                          <div className="mt-3 flex items-center justify-between gap-3">
                            <div>
                              <Label className="text-sm font-bold">
                                می‌پذیرم و متعهد می‌شوم
                              </Label>
                              <p className="text-xs text-muted-foreground">
                                بدون پذیرش قوانین، ثبت‌نام امکان‌پذیر نیست.
                              </p>
                            </div>
                            <Switch
                              checked={rulesAccepted}
                              onCheckedChange={setRulesAccepted}
                            />
                          </div>
                        </div>
                        )}

                        <div className="flex justify-between">
                          <NoorButton
                            type="button"
                            variant="ghost"
                            size="lg"
                            onClick={prevStep}
                            leftIcon={<ChevronRight className="h-5 w-5" />}
                          >
                            گام قبل
                          </NoorButton>
                          <NoorButton
                            type="button"
                            variant="yellow"
                            size="lg"
                            onClick={nextStep}
                            rightIcon={<ChevronLeft className="h-5 w-5" />}
                          >
                            گام بعد
                          </NoorButton>
                        </div>
                      </motion.div>
                    )}

                    {/* STEP 3: Recitation */}
                    {step === 3 && (
                      <motion.div
                        key="step3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-5"
                      >
                        <div className="rounded-xl bg-noor-coral/15 p-4 text-center">
                          <p className="text-sm font-bold text-noor-navy dark:text-white">
                            🎙️ اطلاعات تلاوت
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            اطلاعات تخصصی تلاوت خود را وارد کنید تا با قاریان هم‌علاقه آشنا شوید
                          </p>
                        </div>

                        <Field
                          label="نوع تلاوت"
                          icon={<Mic2 className="h-4 w-4" />}
                          error={registerForm.formState.errors.recitationType?.message}
                        >
                          <div className="grid grid-cols-2 gap-3 pt-1">
                            {RECITATION_TYPES.map((t) => {
                              const selected = selectedRecitationType === t;
                              return (
                                <button
                                  key={t}
                                  type="button"
                                  onClick={() => onRecitationTypeChange(t)}
                                  className={`flex flex-col items-center gap-1 rounded-2xl border-2 p-4 transition ${
                                    selected
                                      ? "border-noor-green bg-noor-green/15 text-green-700 dark:text-lime-300"
                                      : "border-muted-foreground/20 hover:border-noor-sky"
                                  }`}
                                >
                                  <span className="text-lg font-bold">{t}</span>
                                  <span className="text-[10px] text-muted-foreground">
                                    {t === "تحقیق"
                                      ? "تلاوت با رعایت دقیق قواعد"
                                      : "تلاوت آرام و تأمل‌برانگیز"}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </Field>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <Field
                            label="ملیت قاری مورد اقتدا"
                            icon={<Globe2 className="h-4 w-4" />}
                            error={
                              registerForm.formState.errors.reciterNationality?.message
                            }
                          >
                            <Select
                              value={selectedNationality}
                              onValueChange={onNationalityChange}
                              disabled={!selectedRecitationType}
                            >
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={
                                    selectedRecitationType
                                      ? "ملیت قاری را انتخاب کنید"
                                      : "ابتدا نوع تلاوت را انتخاب کنید"
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="iranian">قاریان ایرانی</SelectItem>
                                <SelectItem value="foreign">قاریان غیرایرانی</SelectItem>
                              </SelectContent>
                            </Select>
                          </Field>

                          <Field
                            label="قاری مورد اقتدا"
                            icon={<Mic2 className="h-4 w-4" />}
                            error={
                              registerForm.formState.errors.favoriteReciter?.message
                            }
                          >
                            <Select
                              value={registerForm.watch("favoriteReciter")}
                              onValueChange={(v) =>
                                registerForm.setValue("favoriteReciter", v, {
                                  shouldValidate: true,
                                })
                              }
                              disabled={availableReciters.length === 0}
                            >
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={
                                    availableReciters.length > 0
                                      ? "قاری را انتخاب کنید"
                                      : "ابتدا نوع تلاوت و ملیت را انتخاب کنید"
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent className="max-h-72">
                                {availableReciters.map((r) => (
                                  <SelectItem key={r} value={r}>
                                    {r}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </Field>
                        </div>

                        <Field
                          label={`مهارت‌های تلاوت (${registerForm.watch("recitationSkills").length} انتخاب شده)`}
                          icon={<CheckCircle2 className="h-4 w-4" />}
                          error={
                            registerForm.formState.errors.recitationSkills?.message
                          }
                        >
                          <div className="flex max-h-44 flex-wrap gap-2 overflow-y-auto pt-1">
                            {RECITATION_SKILLS.map((skill) => {
                              const selected = registerForm
                                .watch("recitationSkills")
                                .includes(skill);
                              return (
                                <button
                                  key={skill}
                                  type="button"
                                  onClick={() => {
                                    const cur = registerForm.getValues(
                                      "recitationSkills",
                                    );
                                    const next = selected
                                      ? cur.filter((s) => s !== skill)
                                      : [...cur, skill];
                                    registerForm.setValue("recitationSkills", next, {
                                      shouldValidate: true,
                                    });
                                  }}
                                  className={`rounded-full border-2 px-3 py-1.5 text-xs font-bold transition ${
                                    selected
                                      ? "border-noor-green bg-noor-green/20 text-green-700 dark:text-lime-300"
                                      : "border-muted-foreground/20 hover:border-noor-sky"
                                  }`}
                                >
                                  {selected ? "✓ " : ""}
                                  {skill}
                                </button>
                              );
                            })}
                          </div>
                        </Field>

                        <Field
                          label={`علاقمندی‌های قرآنی (${registerForm.watch("interests").length} انتخاب شده)`}
                          icon={<Tag className="h-4 w-4" />}
                        >
                          <div className="flex max-h-44 flex-wrap gap-2 overflow-y-auto pt-1">
                            {QURAN_INTERESTS.map((interest) => {
                              const selected = registerForm
                                .watch("interests")
                                .includes(interest);
                              return (
                                <button
                                  key={interest}
                                  type="button"
                                  onClick={() => {
                                    const cur = registerForm.getValues("interests");
                                    const next = selected
                                      ? cur.filter((i) => i !== interest)
                                      : [...cur, interest];
                                    registerForm.setValue("interests", next);
                                  }}
                                  className={`rounded-full px-3 py-1 text-xs transition ${
                                    selected
                                      ? "bg-noor-yellow/30 text-noor-navy dark:text-white"
                                      : "bg-muted text-muted-foreground hover:bg-noor-sky/20"
                                  }`}
                                >
                                  {interest}
                                </button>
                              );
                            })}
                          </div>
                        </Field>

                        <div className="flex justify-between">
                          <NoorButton
                            type="button"
                            variant="ghost"
                            size="lg"
                            onClick={prevStep}
                            leftIcon={<ChevronRight className="h-5 w-5" />}
                          >
                            گام قبل
                          </NoorButton>
                          <NoorButton
                            type="submit"
                            variant="yellow"
                            size="lg"
                            leftIcon={<UserPlus className="h-5 w-5" />}
                            className="animate-pulse-glow"
                            disabled={registering || (!isEditMode && !rulesAccepted)}
                          >
                            {registering
                              ? (isEditMode ? "در حال ذخیره..." : "در حال ثبت‌نام...")
                              : isEditMode
                                ? "ذخیره تغییرات"
                                : !rulesAccepted
                                  ? "ابتدا قوانین را بپذیرید"
                                  : "ساخت حساب کاربری"}
                          </NoorButton>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </form>
              </NoorCard>
            </motion.div>
          ) : !isEditMode ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <NoorCard className="mx-auto max-w-md noor-card-sky">
                <form
                  onSubmit={loginForm.handleSubmit(handleLogin)}
                  className="space-y-5"
                >
                  {eitaaAvailable && (
                    <button
                      type="button"
                      onClick={handleEitaaLogin}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-noor-sky to-[#5ac8fa] px-4 py-3 text-sm font-bold text-white shadow-md transition hover:brightness-105"
                    >
                      <span className="text-base">💬</span>
                      ورود سریع با ایتا
                    </button>
                  )}
                  <Field
                    label="ایمیل یا شماره موبایل"
                    icon={<Mail className="h-4 w-4" />}
                    error={loginForm.formState.errors.identifier?.message}
                  >
                    <Input
                      dir="ltr"
                      placeholder="you@example.com یا 0912..."
                      {...loginForm.register("identifier")}
                    />
                  </Field>

                  <Field
                    label="رمز عبور"
                    icon={<Lock className="h-4 w-4" />}
                    error={loginForm.formState.errors.password?.message}
                  >
                    <Input
                      type="password"
                      dir="ltr"
                      placeholder="••••••"
                      {...loginForm.register("password")}
                    />
                  </Field>

                  <div className="flex items-center justify-between text-sm">
                    <button
                      type="button"
                      className="text-noor-sky hover:underline"
                      onClick={() =>
                        toast({
                          title: "بازیابی رمز",
                          description: "لینک بازیابی به ایمیل شما ارسال شد (دمو).",
                        })
                      }
                    >
                      رمز عبور را فراموش کرده‌اید؟
                    </button>
                  </div>

                  <NoorButton
                    type="submit"
                    variant="yellow"
                    size="lg"
                    className="w-full"
                    leftIcon={<LogIn className="h-5 w-5" />}
                    disabled={loggingIn}
                  >
                    {loggingIn ? "در حال ورود..." : "ورود به منافسه"}
                  </NoorButton>

                  <div className="rounded-xl bg-noor-sky/15 p-3 text-center text-xs text-muted-foreground">
                    برای ورود، ایمیل و رمز عبوری که با آن ثبت‌نام کرده‌اید را وارد کنید.{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setMode("register");
                        setStep(1);
                      }}
                      className="font-bold text-noor-sky hover:underline"
                    >
                      ثبت‌نام
                    </button>{" "}
                    کنید.
                  </div>
                </form>
              </NoorCard>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`font-rounded flex-1 rounded-full px-4 py-2 text-sm font-bold transition ${
        active
          ? "bg-noor-yellow text-noor-navy shadow"
          : "text-noor-navy hover:bg-white/60 dark:bg-transparent dark:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function Field({
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
