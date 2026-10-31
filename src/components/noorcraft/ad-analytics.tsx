"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Eye,
  MousePointerClick,
  Award,
  PieChart as PieChartIcon,
  BarChart3,
  Sparkles,
  Loader2,
  Zap,
  Calendar,
} from "lucide-react";
import { NoorButton } from "./noor-button";
import { NoorCard } from "./noor-card";
import { NoorBadge } from "./noor-badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/* ============================================================
   AdAnalytics — پنل تحلیلی تبلیغات با نمودارها + auto-optimization
   ───────────────────────────────────────────────────────────
   نمودارها با SVG خلق شده‌اند (بدون وابستگی به کتابخانه‌ی chart).
   شامل:
     ۱. Line chart — روند نمایش/کلیک/CTR در بازه‌ی زمانی
     ۲. Bar chart — top ۵ تبلیغ بر اساس CTR
     ۳. Pie chart — توزیع نمایش‌ها بر اساس جایگاه
     ۴. Auto-optimization — دکمه‌ی جادویی که اولویت‌ها را بر اساس CTR تنظیم می‌کند
   ============================================================ */

interface TrendPoint {
  date: string;
  impressions: number;
  clicks: number;
  ctr: number;
}

interface PerAdStat {
  adId: string;
  title: string;
  impressions: number;
  clicks: number;
  ctr: number;
}

interface PerSlotStat {
  slot: string;
  impressions: number;
  clicks: number;
}

interface AnalyticsData {
  range: { days: number; start: string; end: string };
  trend: TrendPoint[];
  perAd: PerAdStat[];
  perSlot: PerSlotStat[];
  topPerformers: PerAdStat[];
  summary: {
    totalImpressions: number;
    totalClicks: number;
    avgCtr: number;
    bestDay: { date: string; clicks: number; impressions: number } | null;
  };
}

interface OptimizeChange {
  adId: string;
  title: string;
  impressions: number;
  clicks: number;
  ctr: number | null;
  oldPriority: number;
  newPriority: number;
  reason: string;
}

const SLOT_LABELS: Record<string, string> = {
  general: "همه‌ی جایگاه‌ها",
  "landing-top": "لندینگ — بالا",
  "landing-mid-1": "لندینگ — وسط ۱",
  "landing-mid-2": "لندینگ — وسط ۲",
  "landing-bottom": "لندینگ — پایین",
  "sessions-top": "محافل — بالا",
  "sessions-mid": "محافل — وسط",
  "challenge-top": "چالش — بالا",
  "challenge-mid": "چالش — وسط",
  "create-session-side": "تشکیل محفل — ستون",
  "blog-top": "بلاگ — بالا",
  "blog-mid": "بلاگ — وسط",
  "dashboard-bottom": "داشبورد — پایین",
};

const SLOT_COLORS = [
  "#FFD700",
  "#FF7F7F",
  "#87CEEB",
  "#7CFC00",
  "#FFA07A",
  "#DDA0DD",
  "#98FB98",
  "#F0E68C",
  "#B0C4DE",
  "#FFB6C1",
  "#9370DB",
  "#20B2AA",
  "#FF6347",
];

export function AdAnalytics() {
  const { toast } = useToast();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [optimizing, setOptimizing] = useState(false);
  const [optimizePreview, setOptimizePreview] = useState<OptimizeChange[] | null>(null);
  const [optimizeSummary, setOptimizeSummary] = useState<any>(null);

  const fetchAnalytics = async (rangeDays: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/ads/analytics?days=${rangeDays}`, {
        cache: "no-store",
      });
      const d = await res.json();
      if (d.ok) {
        setData(d);
      }
    } catch {
      toast({ title: "خطا در دریافت آمار", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useMemo(() => {
    fetchAnalytics(days);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  // === Auto-optimize (dry run) ===
  async function runOptimizePreview() {
    setOptimizing(true);
    try {
      const res = await fetch("/api/admin/ads/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun: true, lookbackDays: 7 }),
      });
      const d = await res.json();
      if (d.ok) {
        setOptimizePreview(d.changes);
        setOptimizeSummary(d.summary);
        toast({
          title: "پیش‌نمایش آماده شد ✨",
          description: `${d.summary.totalAds} تبلیغ بررسی شد — ${d.summary.increased} افزایش، ${d.summary.decreased} کاهش`,
        });
      } else {
        throw new Error(d.error);
      }
    } catch (err: any) {
      toast({ title: "خطا", description: err.message, variant: "destructive" });
    } finally {
      setOptimizing(false);
    }
  }

  // === Apply optimization ===
  async function applyOptimize() {
    setOptimizing(true);
    try {
      const res = await fetch("/api/admin/ads/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun: false, lookbackDays: 7 }),
      });
      const d = await res.json();
      if (d.ok) {
        toast({
          title: "بهینه‌سازی اعمال شد ✅",
          description: `اولویت ${d.summary.totalAds} تبلیغ به‌روز شد`,
        });
        setOptimizePreview(null);
        setOptimizeSummary(null);
        fetchAnalytics(days);
      } else {
        throw new Error(d.error);
      }
    } catch (err: any) {
      toast({ title: "خطا", description: err.message, variant: "destructive" });
    } finally {
      setOptimizing(false);
    }
  }

  if (loading && !data) {
    return (
      <div className="grid place-items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">در حال بارگذاری آمار...</p>
      </div>
    );
  }

  if (!data) return null;

  const totalSlotsImpressions = data.perSlot.reduce((s, p) => s + p.impressions, 0);

  return (
    <div className="space-y-6">
      {/* === DATE RANGE SELECTOR === */}
      <NoorCard className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-noor-sky" />
            <span className="text-sm font-bold text-noor-navy dark:text-white">
              بازه‌ی زمانی:
            </span>
            <div className="flex gap-1 rounded-xl bg-muted/30 p-1">
              {[7, 14, 30, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={cn(
                    "rounded-lg px-3 py-1 text-xs font-bold transition",
                    days === d
                      ? "bg-noor-yellow text-noor-navy shadow"
                      : "text-muted-foreground hover:bg-muted/50",
                  )}
                >
                  {d.toLocaleString("fa-IR")} روز
                </button>
              ))}
            </div>
          </div>
          <NoorButton
            variant="coral"
            size="sm"
            onClick={runOptimizePreview}
            disabled={optimizing}
            leftIcon={
              optimizing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )
            }
          >
            بهینه‌سازی خودکار
          </NoorButton>
        </div>
      </NoorCard>

      {/* === SUMMARY CARDS === */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <SummaryCard
          icon={<Eye className="h-5 w-5" />}
          label="کل نمایش‌ها"
          value={data.summary.totalImpressions.toLocaleString("fa-IR")}
          color="#87CEEB"
        />
        <SummaryCard
          icon={<MousePointerClick className="h-5 w-5" />}
          label="کل کلیک‌ها"
          value={data.summary.totalClicks.toLocaleString("fa-IR")}
          color="#FF7F7F"
        />
        <SummaryCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="CTR میانگین"
          value={`${data.summary.avgCtr.toLocaleString("fa-IR")}٪`}
          color="#7CFC00"
        />
        <SummaryCard
          icon={<Award className="h-5 w-5" />}
          label="بهترین روز"
          value={
            data.summary.bestDay
              ? `${data.summary.bestDay.clicks.toLocaleString("fa-IR")} کلیک`
              : "—"
          }
          color="#FFD700"
          subtitle={data.summary.bestDay ? formatDate(data.summary.bestDay.date) : undefined}
        />
      </div>

      {/* === LINE CHART — TREND === */}
      <NoorCard className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-noor-sky" />
          <h3 className="text-base font-bold text-noor-navy dark:text-white">
            روند نمایش و کلیک
          </h3>
        </div>
        <LineChart data={data.trend} />
      </NoorCard>

      {/* === BAR + PIE SIDE BY SIDE === */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top performers bar chart */}
        <NoorCard className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-noor-coral" />
            <h3 className="text-base font-bold text-noor-navy dark:text-white">
              ۵ تبلیغ برتر (CTR)
            </h3>
          </div>
          {data.topPerformers.length > 0 ? (
            <BarChart data={data.topPerformers} />
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              هنوز داده‌ی کافی جمع‌آوری نشده است
            </div>
          )}
        </NoorCard>

        {/* Slot distribution pie chart */}
        <NoorCard className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <PieChartIcon className="h-5 w-5 text-noor-green" />
            <h3 className="text-base font-bold text-noor-navy dark:text-white">
              توزیع نمایش بر جایگاه
            </h3>
          </div>
          {totalSlotsImpressions > 0 ? (
            <PieChart data={data.perSlot} total={totalSlotsImpressions} />
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              هنوز داده‌ی کافی جمع‌آوری نشده است
            </div>
          )}
        </NoorCard>
      </div>

      {/* === PER-AD TABLE === */}
      <NoorCard className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-noor-yellow" />
          <h3 className="text-base font-bold text-noor-navy dark:text-white">
            جدول کامل آمار هر تبلیغ
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead>
              <tr className="border-b border-muted/30 text-xs text-muted-foreground">
                <th className="p-2 font-bold">#</th>
                <th className="p-2 font-bold">عنوان</th>
                <th className="p-2 font-bold">نمایش</th>
                <th className="p-2 font-bold">کلیک</th>
                <th className="p-2 font-bold">CTR</th>
                <th className="p-2 font-bold">نمودار</th>
              </tr>
            </thead>
            <tbody>
              {data.perAd.map((ad, i) => {
                const maxImpressions = Math.max(...data.perAd.map((a) => a.impressions), 1);
                const barWidth = (ad.impressions / maxImpressions) * 100;
                return (
                  <tr
                    key={ad.adId}
                    className="border-b border-muted/20 transition hover:bg-muted/10"
                  >
                    <td className="p-2 font-bold text-muted-foreground">
                      {(i + 1).toLocaleString("fa-IR")}
                    </td>
                    <td className="p-2">
                      <div className="truncate font-bold text-noor-navy dark:text-white">
                        {ad.title}
                      </div>
                    </td>
                    <td className="p-2 font-bold">
                      {ad.impressions.toLocaleString("fa-IR")}
                    </td>
                    <td className="p-2 font-bold">
                      {ad.clicks.toLocaleString("fa-IR")}
                    </td>
                    <td className="p-2">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[11px] font-bold",
                          ad.ctr >= 2
                            ? "bg-noor-green/20 text-noor-green dark:text-lime-300"
                            : ad.ctr >= 1
                              ? "bg-noor-yellow/20 text-noor-navy dark:text-yellow-200"
                              : "bg-muted/30 text-muted-foreground",
                        )}
                      >
                        {ad.ctr.toLocaleString("fa-IR")}٪
                      </span>
                    </td>
                    <td className="p-2">
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-muted/30">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${barWidth}%` }}
                          transition={{ duration: 0.5, delay: i * 0.05 }}
                          className="h-full bg-gradient-to-l from-noor-sky to-noor-yellow"
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </NoorCard>

      {/* === OPTIMIZE PREVIEW MODAL === */}
      {optimizePreview && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur"
          onClick={() => {
            setOptimizePreview(null);
            setOptimizeSummary(null);
          }}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 dark:bg-card"
          >
            <div className="mb-5 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-noor-yellow" />
                  <h3 className="text-xl font-bold text-noor-navy dark:text-white">
                    بهینه‌سازی خودکار
                  </h3>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  اولویت تبلیغات بر اساس CTR ۷ روز اخیر تنظیم می‌شود.
                  تبلیغ‌های با CTR بالاتر، اولویت بیشتری می‌گیرند و بیشتر نمایش داده می‌شوند.
                </p>
              </div>
              <button
                onClick={() => {
                  setOptimizePreview(null);
                  setOptimizeSummary(null);
                }}
                className="grid h-8 w-8 place-items-center rounded-full bg-muted text-muted-foreground"
              >
                ✕
              </button>
            </div>

            {optimizeSummary && (
              <div className="mb-4 grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-noor-green/15 p-3 text-center">
                  <TrendingUp className="mx-auto mb-1 h-5 w-5 text-noor-green" />
                  <div className="font-bold text-noor-navy dark:text-white">
                    {optimizeSummary.increased.toLocaleString("fa-IR")}
                  </div>
                  <div className="text-[10px] text-muted-foreground">افزایش اولویت</div>
                </div>
                <div className="rounded-xl bg-muted/30 p-3 text-center">
                  <div className="mx-auto mb-1 grid h-5 w-5 place-items-center text-muted-foreground">=</div>
                  <div className="font-bold text-noor-navy dark:text-white">
                    {optimizeSummary.unchanged.toLocaleString("fa-IR")}
                  </div>
                  <div className="text-[10px] text-muted-foreground">بدون تغییر</div>
                </div>
                <div className="rounded-xl bg-noor-coral/15 p-3 text-center">
                  <TrendingDown className="mx-auto mb-1 h-5 w-5 text-noor-coral" />
                  <div className="font-bold text-noor-navy dark:text-white">
                    {optimizeSummary.decreased.toLocaleString("fa-IR")}
                  </div>
                  <div className="text-[10px] text-muted-foreground">کاهش اولویت</div>
                </div>
              </div>
            )}

            <div className="max-h-[50vh] overflow-y-auto rounded-xl border border-muted/20">
              <table className="w-full text-right text-sm">
                <thead className="sticky top-0 bg-muted/30">
                  <tr className="text-xs text-muted-foreground">
                    <th className="p-2 font-bold">تبلیغ</th>
                    <th className="p-2 font-bold">CTR</th>
                    <th className="p-2 font-bold">قدیمی</th>
                    <th className="p-2 font-bold">→</th>
                    <th className="p-2 font-bold">جدید</th>
                    <th className="p-2 font-bold">دلیل</th>
                  </tr>
                </thead>
                <tbody>
                  {optimizePreview.map((c) => (
                    <tr key={c.adId} className="border-b border-muted/20">
                      <td className="p-2">
                        <div className="truncate font-bold text-noor-navy dark:text-white">
                          {c.title}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {c.impressions.toLocaleString("fa-IR")} نمایش /{" "}
                          {c.clicks.toLocaleString("fa-IR")} کلیک
                        </div>
                      </td>
                      <td className="p-2 font-bold">
                        {c.ctr !== null ? `${c.ctr.toLocaleString("fa-IR")}٪` : "—"}
                      </td>
                      <td className="p-2 text-center font-bold text-muted-foreground">
                        {c.oldPriority.toLocaleString("fa-IR")}
                      </td>
                      <td className="p-2 text-center text-muted-foreground">→</td>
                      <td
                        className={cn(
                          "p-2 text-center font-bold",
                          c.newPriority > c.oldPriority
                            ? "text-noor-green dark:text-lime-300"
                            : c.newPriority < c.oldPriority
                              ? "text-noor-coral"
                              : "text-muted-foreground",
                        )}
                      >
                        {c.newPriority.toLocaleString("fa-IR")}
                      </td>
                      <td className="p-2 text-[11px] text-muted-foreground">{c.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <NoorButton
                variant="ghost"
                size="sm"
                onClick={() => {
                  setOptimizePreview(null);
                  setOptimizeSummary(null);
                }}
              >
                انصراف
              </NoorButton>
              <NoorButton
                variant="yellow"
                size="sm"
                onClick={applyOptimize}
                disabled={optimizing}
                leftIcon={
                  optimizing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )
                }
              >
                اعمال بهینه‌سازی
              </NoorButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

// ============================================================
// LINE CHART — روند نمایش/کلیک
// ============================================================
function LineChart({ data }: { data: TrendPoint[] }) {
  if (data.length === 0) {
    return <div className="py-8 text-center text-sm text-muted-foreground">داده‌ای موجود نیست</div>;
  }

  const width = 800;
  const height = 240;
  const padding = { top: 20, right: 20, bottom: 30, left: 50 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxImpressions = Math.max(...data.map((d) => d.impressions), 1);
  const maxClicks = Math.max(...data.map((d) => d.clicks), 1);
  const maxValue = Math.max(maxImpressions, maxClicks);

  const xStep = data.length > 1 ? chartW / (data.length - 1) : chartW;

  // Build line paths
  const impressionsPath = data
    .map((d, i) => {
      const x = padding.left + i * xStep;
      const y = padding.top + chartH - (d.impressions / maxValue) * chartH;
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  const clicksPath = data
    .map((d, i) => {
      const x = padding.left + i * xStep;
      const y = padding.top + chartH - (d.clicks / maxValue) * chartH;
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  // Y-axis grid (5 lines)
  const gridLines = Array.from({ length: 5 }, (_, i) => {
    const y = padding.top + (i * chartH) / 4;
    const value = maxValue - (i * maxValue) / 4;
    return { y, value: Math.round(value) };
  });

  // X-axis labels (show ~6 dates max)
  const labelStep = Math.ceil(data.length / 6);
  const xLabels = data.filter((_, i) => i % labelStep === 0);

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full min-w-[600px]"
        style={{ height: "auto" }}
      >
        {/* Grid lines */}
        {gridLines.map((g, i) => (
          <g key={i}>
            <line
              x1={padding.left}
              y1={g.y}
              x2={width - padding.right}
              y2={g.y}
              stroke="currentColor"
              strokeOpacity={0.1}
              strokeDasharray="3,3"
            />
            <text
              x={padding.left - 8}
              y={g.y + 4}
              textAnchor="end"
              fontSize="10"
              fill="currentColor"
              opacity={0.5}
            >
              {formatNumber(g.value)}
            </text>
          </g>
        ))}

        {/* X-axis labels */}
        {xLabels.map((d, i) => {
          const idx = data.indexOf(d);
          const x = padding.left + idx * xStep;
          return (
            <text
              key={i}
              x={x}
              y={height - 8}
              textAnchor="middle"
              fontSize="10"
              fill="currentColor"
              opacity={0.5}
            >
              {formatDateShort(d.date)}
            </text>
          );
        })}

        {/* Area under impressions */}
        <path
          d={`${impressionsPath} L ${padding.left + (data.length - 1) * xStep} ${padding.top + chartH} L ${padding.left} ${padding.top + chartH} Z`}
          fill="#87CEEB"
          fillOpacity={0.15}
        />

        {/* Impressions line */}
        <motion.path
          d={impressionsPath}
          fill="none"
          stroke="#87CEEB"
          strokeWidth={2}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1 }}
        />

        {/* Clicks line */}
        <motion.path
          d={clicksPath}
          fill="none"
          stroke="#FF7F7F"
          strokeWidth={2}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
        />

        {/* Data points */}
        {data.map((d, i) => {
          const x = padding.left + i * xStep;
          const yImp = padding.top + chartH - (d.impressions / maxValue) * chartH;
          const yClick = padding.top + chartH - (d.clicks / maxValue) * chartH;
          return (
            <g key={i}>
              <circle cx={x} cy={yImp} r={2.5} fill="#87CEEB" />
              <circle cx={x} cy={yClick} r={2.5} fill="#FF7F7F" />
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="mt-3 flex items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-noor-sky" />
          <span className="text-muted-foreground">نمایش‌ها</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-noor-coral" />
          <span className="text-muted-foreground">کلیک‌ها</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// BAR CHART — top performers
// ============================================================
function BarChart({ data }: { data: PerAdStat[] }) {
  const maxCtr = Math.max(...data.map((d) => d.ctr), 1);

  return (
    <div className="space-y-3">
      {data.map((ad, i) => {
        const barWidth = (ad.ctr / maxCtr) * 100;
        return (
          <div key={ad.adId} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="truncate font-bold text-noor-navy dark:text-white">
                {(i + 1).toLocaleString("fa-IR")}. {ad.title}
              </span>
              <span className="shrink-0 rounded-full bg-noor-green/20 px-2 py-0.5 text-[10px] font-bold text-noor-green dark:text-lime-300">
                {ad.ctr.toLocaleString("fa-IR")}٪
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-muted/30">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${barWidth}%` }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-l from-noor-coral to-noor-yellow"
              />
            </div>
            <div className="text-[10px] text-muted-foreground">
              {ad.impressions.toLocaleString("fa-IR")} نمایش /{" "}
              {ad.clicks.toLocaleString("fa-IR")} کلیک
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// PIE CHART — slot distribution
// ============================================================
function PieChart({ data, total }: { data: PerSlotStat[]; total: number }) {
  const radius = 80;
  const cx = 100;
  const cy = 100;
  const innerRadius = 50; // donut

  let cumulativeAngle = -90; // start from top

  const slices = data.map((d, i) => {
    const percentage = (d.impressions / total) * 100;
    const angle = (percentage / 100) * 360;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angle;
    cumulativeAngle = endAngle;

    // SVG arc path
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);
    const x1i = cx + innerRadius * Math.cos(startRad);
    const y1i = cy + innerRadius * Math.sin(startRad);
    const x2i = cx + innerRadius * Math.cos(endRad);
    const y2i = cy + innerRadius * Math.sin(endRad);
    const largeArc = angle > 180 ? 1 : 0;

    const path = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${x2i} ${y2i} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x1i} ${y1i} Z`;

    return {
      path,
      color: SLOT_COLORS[i % SLOT_COLORS.length],
      percentage,
      label: SLOT_LABELS[d.slot] || d.slot,
      impressions: d.impressions,
      clicks: d.clicks,
    };
  });

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      <svg viewBox="0 0 200 200" className="h-44 w-44 shrink-0">
        {slices.map((s, i) => (
          <motion.path
            key={i}
            d={s.path}
            fill={s.color}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            style={{ transformOrigin: "100px 100px" }}
          />
        ))}
        <text
          x={100}
          y={95}
          textAnchor="middle"
          fontSize="14"
          fontWeight="bold"
          fill="currentColor"
          opacity={0.7}
        >
          کل
        </text>
        <text
          x={100}
          y={115}
          textAnchor="middle"
          fontSize="16"
          fontWeight="bold"
          fill="currentColor"
        >
          {formatNumber(total)}
        </text>
      </svg>

      <div className="flex-1 space-y-2">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ background: s.color }}
            />
            <span className="flex-1 truncate text-muted-foreground">{s.label}</span>
            <span className="font-bold text-noor-navy dark:text-white">
              {parseFloat(s.percentage.toFixed(1)).toLocaleString("fa-IR")}٪
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Helper components
// ============================================================
function SummaryCard({
  icon,
  label,
  value,
  color,
  subtitle,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  subtitle?: string;
}) {
  return (
    <div className="rounded-2xl border-2 border-muted/20 bg-white/60 p-3 dark:bg-card/60">
      <div
        className="mb-2 grid h-9 w-9 place-items-center rounded-xl"
        style={{ background: `${color}25`, color }}
      >
        {icon}
      </div>
      <div className="font-display text-lg text-noor-navy dark:text-white">{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
      {subtitle && (
        <div className="text-[10px] text-muted-foreground/70">{subtitle}</div>
      )}
    </div>
  );
}

// === Formatters ===
function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("fa-IR", { month: "long", day: "numeric" });
  } catch {
    return iso;
  }
}

function formatDateShort(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("fa-IR", { month: "numeric", day: "numeric" });
  } catch {
    return iso;
  }
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) {
    return `${parseFloat((n / 1_000_000).toFixed(1)).toLocaleString("fa-IR")}M`;
  }
  if (n >= 1_000) {
    return `${parseFloat((n / 1_000).toFixed(1)).toLocaleString("fa-IR")}K`;
  }
  return n.toLocaleString("fa-IR");
}
