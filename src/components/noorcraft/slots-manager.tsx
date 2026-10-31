"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ToggleLeft,
  ToggleRight,
  MapPin,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Link2,
  Unlink,
  ExternalLink,
} from "lucide-react";
import { NoorButton } from "./noor-button";
import { NoorCard } from "./noor-card";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/* ============================================================
   SlotsManager — مدیریت جایگاه‌های تبلیغاتی
   ───────────────────────────────────────────────────────────
   نمایش همه‌ی جایگاه‌های تبلیغاتی سایت، دسته‌بندی‌شده بر اساس صفحه.
   برای هر جایگاه:
     • فعال/غیرفعال کردن
     • اختصاص تبلیغ خاص (یا حالت خودکار)
     • نمایش ابعاد و موقعیت
   ============================================================ */

interface SlotAd {
  id: string;
  title: string;
  active: boolean;
  imageUrl: string | null;
  theme: string;
}

interface Slot {
  id: string;
  page: string;
  pageLabel: string;
  position: string;
  size: string;
  width: number;
  height: number;
  enabled: boolean;
  assignedAdId: string | null;
  ad: SlotAd | null;
}

interface SimpleAd {
  id: string;
  title: string;
  theme: string;
}

const SIZE_LABELS: Record<string, string> = {
  leaderboard: "Leaderboard",
  rectangle: "Medium Rectangle",
  halfpage: "Half Page",
  billboard: "Billboard",
  inline: "Inline",
};

const SIZE_COLORS: Record<string, string> = {
  leaderboard: "#87CEEB",
  rectangle: "#FFD700",
  halfpage: "#FF7F7F",
  billboard: "#7CFC00",
  inline: "#DDA0DD",
};

export function SlotsManager() {
  const { toast } = useToast();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [allAds, setAllAds] = useState<SimpleAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchSlots = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/ads/slots", { cache: "no-store" });
      const data = await res.json();
      if (data.ok) {
        setSlots(data.slots);
        setAllAds(data.allAds || []);
      }
    } catch {
      toast({ title: "خطا در دریافت جایگاه‌ها", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  // Group slots by page
  const grouped = slots.reduce((acc, slot) => {
    if (!acc[slot.pageLabel]) acc[slot.pageLabel] = [];
    acc[slot.pageLabel].push(slot);
    return acc;
  }, {} as Record<string, Slot[]>);

  // Toggle slot enabled
  async function handleToggle(slot: Slot) {
    setUpdatingId(slot.id);
    // Optimistic
    setSlots((prev) =>
      prev.map((s) => (s.id === slot.id ? { ...s, enabled: !s.enabled } : s)),
    );
    try {
      const res = await fetch(`/api/admin/ads/slots/${slot.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !slot.enabled }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      toast({
        title: slot.enabled ? "جایگاه غیرفعال شد ⏸️" : "جایگاه فعال شد ▶️",
        description: `${slot.pageLabel} — ${slot.position}`,
      });
    } catch (err: any) {
      // Revert
      setSlots((prev) =>
        prev.map((s) => (s.id === slot.id ? { ...s, enabled: slot.enabled } : s)),
      );
      toast({ title: "خطا", description: err.message, variant: "destructive" });
    } finally {
      setUpdatingId(null);
    }
  }

  // Assign ad to slot
  async function handleAssign(slot: Slot, adId: string | null) {
    setUpdatingId(slot.id);
    // Optimistic
    setSlots((prev) =>
      prev.map((s) => {
        if (s.id !== slot.id) return s;
        const newAd = adId ? allAds.find((a) => a.id === adId) || null : null;
        return { ...s, assignedAdId: adId, ad: newAd as any };
      }),
    );
    try {
      const res = await fetch(`/api/admin/ads/slots/${slot.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedAdId: adId }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      toast({
        title: adId ? "تبلیغ اختصاص یافت ✓" : "حالت خودکار فعال شد",
        description: adId
          ? `${allAds.find((a) => a.id === adId)?.title} → ${slot.id}`
          : `${slot.id} — انتخاب خودکار از بین تبلیغات فعال`,
      });
      fetchSlots();
    } catch (err: any) {
      // Revert
      setSlots((prev) =>
        prev.map((s) => (s.id === slot.id ? { ...s, assignedAdId: slot.assignedAdId, ad: slot.ad } : s)),
      );
      toast({ title: "خطا", description: err.message, variant: "destructive" });
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) {
    return (
      <div className="grid place-items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">در حال بارگذاری جایگاه‌ها...</p>
      </div>
    );
  }

  const totalSlots = slots.length;
  const enabledSlots = slots.filter((s) => s.enabled).length;
  const assignedSlots = slots.filter((s) => s.assignedAdId).length;

  return (
    <div className="space-y-6">
      {/* === SUMMARY BAR === */}
      <NoorCard className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-noor-sky" />
              <div>
                <div className="font-display text-lg text-noor-navy dark:text-white">
                  {totalSlots.toLocaleString("fa-IR")} جایگاه
                </div>
                <div className="text-[11px] text-muted-foreground">در {Object.keys(grouped).length} صفحه</div>
              </div>
            </div>
            <div className="h-8 w-px bg-muted/30" />
            <div className="flex items-center gap-1.5">
              <ToggleRight className="h-5 w-5 text-noor-green" />
              <span className="text-sm font-bold text-noor-navy dark:text-white">
                {enabledSlots.toLocaleString("fa-IR")} فعال
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <ToggleLeft className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-bold text-muted-foreground">
                {(totalSlots - enabledSlots).toLocaleString("fa-IR")} غیرفعال
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Link2 className="h-5 w-5 text-noor-yellow" />
              <span className="text-sm font-bold text-noor-navy dark:text-white">
                {assignedSlots.toLocaleString("fa-IR")} اختصاص‌یافته
              </span>
            </div>
          </div>
          <button
            onClick={fetchSlots}
            className="grid h-9 w-9 place-items-center rounded-xl bg-muted/30 transition hover:bg-muted/50"
            title="به‌روزرسانی"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </NoorCard>

      {/* === SLOTS GROUPED BY PAGE === */}
      {Object.entries(grouped).map(([pageLabel, pageSlots]) => (
        <div key={pageLabel}>
          <div className="mb-3 flex items-center gap-2">
            <h3 className="font-display text-lg text-noor-navy dark:text-white">
              {pageLabel}
            </h3>
            <span className="rounded-full bg-noor-sky/15 px-2 py-0.5 text-[11px] font-bold text-noor-sky">
              {pageSlots.length.toLocaleString("fa-IR")} جایگاه
            </span>
            <span className="text-[11px] text-muted-foreground">
              ({pageSlots.filter((s) => s.enabled).length.toLocaleString("fa-IR")} فعال)
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {pageSlots.map((slot) => (
              <SlotCard
                key={slot.id}
                slot={slot}
                allAds={allAds}
                updating={updatingId === slot.id}
                onToggle={() => handleToggle(slot)}
                onAssign={(adId) => handleAssign(slot, adId)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// === Single slot card ===
function SlotCard({
  slot,
  allAds,
  updating,
  onToggle,
  onAssign,
}: {
  slot: Slot;
  allAds: SimpleAd[];
  updating: boolean;
  onToggle: () => void;
  onAssign: (adId: string | null) => void;
}) {
  const sizeColor = SIZE_COLORS[slot.size] || "#87CEEB";
  const sizeLabel = SIZE_LABELS[slot.size] || slot.size;

  return (
    <motion.div
      layout
      className={cn(
        "relative overflow-hidden rounded-2xl border-2 p-4 transition",
        slot.enabled
          ? "border-muted/30 bg-white/60 dark:bg-card/60"
          : "border-muted/20 bg-muted/5 opacity-60",
      )}
    >
      {/* Updating overlay */}
      {updating && (
        <div className="absolute inset-0 z-10 grid place-items-center bg-white/60 backdrop-blur dark:bg-card/60">
          <Loader2 className="h-6 w-6 animate-spin text-noor-sky" />
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          {/* Position */}
          <div className="mb-1 flex items-center gap-2">
            <span
              className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[10px] font-bold text-noor-navy"
              style={{ background: `${sizeColor}30`, color: sizeColor }}
            >
              <ImageIcon className="h-3.5 w-3.5" />
            </span>
            <h4 className="text-sm font-bold text-noor-navy dark:text-white">
              {slot.position}
            </h4>
          </div>

          {/* Dimensions + size badge */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-bold"
              style={{ background: `${sizeColor}20`, color: sizeColor }}
            >
              {sizeLabel}
            </span>
            <span className="rounded-full bg-muted/30 px-2 py-0.5 text-[10px] font-bold text-muted-foreground" dir="ltr">
              {slot.width} × {slot.height} px
            </span>
            <span className="rounded-full bg-muted/20 px-2 py-0.5 text-[9px] text-muted-foreground" dir="ltr">
              {slot.id}
            </span>
          </div>

          {/* Assigned ad indicator */}
          <div className="mb-3 rounded-xl bg-muted/20 p-2">
            {slot.ad ? (
              <div className="flex items-center gap-2">
                <div
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[10px] font-bold text-noor-navy"
                  style={{ background: `${SIZE_COLORS[slot.ad.theme] || "#FFD700"}30` }}
                >
                  {slot.ad.imageUrl ? <ImageIcon className="h-3.5 w-3.5" /> : slot.ad.title.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-bold text-noor-navy dark:text-white">
                    {slot.ad.title}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {slot.ad.active ? "✓ فعال" : "⏸ غیرفعال"}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <RefreshCw className="h-3 w-3" />
                <span>حالت خودکار — انتخاب از بین تبلیغات فعال</span>
              </div>
            )}
          </div>

          {/* Ad assignment dropdown */}
          <select
            value={slot.assignedAdId || ""}
            onChange={(e) => onAssign(e.target.value || null)}
            disabled={!slot.enabled || updating}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none focus:border-noor-sky disabled:opacity-50"
          >
            <option value="">🤖 خودکار (از بین تبلیغات فعال)</option>
            {allAds.map((ad) => (
              <option key={ad.id} value={ad.id}>
                📌 {ad.title}
              </option>
            ))}
          </select>

          {/* Quick actions */}
          {slot.assignedAdId && (
            <button
              onClick={() => onAssign(null)}
              disabled={updating}
              className="mt-2 flex items-center gap-1 text-[10px] font-bold text-muted-foreground transition hover:text-noor-coral"
            >
              <Unlink className="h-3 w-3" />
              برداشتن اختصاص
            </button>
          )}
        </div>

        {/* Enable/disable toggle */}
        <button
          onClick={onToggle}
          disabled={updating}
          className={cn(
            "shrink-0 rounded-full p-1 transition",
            slot.enabled
              ? "text-noor-green dark:text-lime-300"
              : "text-muted-foreground",
          )}
          title={slot.enabled ? "غیرفعال کردن جایگاه" : "فعال کردن جایگاه"}
        >
          {slot.enabled ? (
            <ToggleRight className="h-8 w-8" />
          ) : (
            <ToggleLeft className="h-8 w-8" />
          )}
        </button>
      </div>
    </motion.div>
  );
}
