"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Crop, Check, X, RotateCcw, Loader2, ZoomIn, ZoomOut } from "lucide-react";
import { NoorButton } from "./noor-button";
import { useToast } from "@/hooks/use-toast";

/* ============================================================
   ImageCropper
   ───────────────────────────────────────────────────────────
   ابزار برش تصویر با نسبت ابعاد ثابت (aspect-locked).
   کاربر می‌تواند:
     • ناحیه‌ی برش را drag کند
     • با corner handle‌ها اندازه را تغییر دهد (با قفل نسبت)
     • با mouse wheel روی ناحیه zoom کند
   خروجی: crop rectangle به‌صورت نسبت (0..1) برای ارسال به API.

   Props:
     • src — آدرس تصویر اصلی
     • aspect — نسبت ابعاد هدف (width/height، مثلاً 728/90)
     • targetWidth, targetHeight — ابعاد نهایی پیکسل
     • onConfirm(crop) — وقتی کاربر تأیید کرد، crop = {x,y,w,h} نسبت 0..1
     • onCancel()
   ============================================================ */

interface Crop {
  x: number; // 0..1
  y: number; // 0..1
  w: number; // 0..1
  h: number; // 0..1
}

interface Props {
  src: string;
  aspect: number; // width / height
  targetWidth: number;
  targetHeight: number;
  onConfirm: (crop: Crop) => void;
  onCancel: () => void;
}

type DragMode = "move" | "resize-nw" | "resize-ne" | "resize-sw" | "resize-se" | null;

export function ImageCropper({ src, aspect, targetWidth, targetHeight, onConfirm, onCancel }: Props) {
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Display dimensions: container width, image displayed size
  const [displaySize, setDisplaySize] = useState({ w: 0, h: 0 });

  // Initial crop: centered, as large as possible while fitting aspect
  const computeInitialCrop = useCallback(
    (imgW: number, imgH: number): Crop => {
      // Try to fit the aspect ratio into the image as large as possible
      let cropW = 1;
      let cropH = 1 / aspect;
      if (cropH > 1) {
        cropH = 1;
        cropW = aspect;
      }
      // Center
      const x = (1 - cropW) / 2;
      const y = (1 - cropH) / 2;
      return { x, y, w: cropW, h: cropH };
    },
    [aspect],
  );

  const [crop, setCrop] = useState<Crop>(() => computeInitialCrop(1, 1));
  const [dragMode, setDragMode] = useState<DragMode>(null);
  const [uploading, setUploading] = useState(false);
  const dragStart = useRef<{ mouseX: number; mouseY: number; crop: Crop } | null>(null);

  // Wait for image to load to get its dimensions
  function handleImageLoad() {
    const img = imgRef.current;
    if (!img) return;
    const containerW = containerRef.current?.clientWidth || 600;
    const containerH = 400;

    // Fit image into container while preserving its aspect
    const imgAspect = img.naturalWidth / img.naturalHeight;
    let dw = containerW;
    let dh = containerW / imgAspect;
    if (dh > containerH) {
      dh = containerH;
      dw = containerH * imgAspect;
    }
    setDisplaySize({ w: dw, h: dh });
    setCrop(computeInitialCrop(img.naturalWidth, img.naturalHeight));
  }

  // === Mouse handlers ===
  function getMousePos(e: MouseEvent | React.MouseEvent): { x: number; y: number } {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (e.clientX - rect.left) / displaySize.w,
      y: (e.clientY - rect.top) / displaySize.h,
    };
  }

  function handleMouseDown(e: React.MouseEvent, mode: DragMode) {
    e.preventDefault();
    e.stopPropagation();
    setDragMode(mode);
    dragStart.current = {
      mouseX: getMousePos(e).x,
      mouseY: getMousePos(e).y,
      crop: { ...crop },
    };
  }

  useEffect(() => {
    if (!dragMode) return;

    function handleMouseMove(e: MouseEvent) {
      if (!dragStart.current) return;
      const pos = getMousePos(e);
      const start = dragStart.current;
      const dx = pos.x - start.mouseX;
      const dy = pos.y - start.mouseY;
      const orig = start.crop;

      let next: Crop = { ...orig };

      if (dragMode === "move") {
        next.x = Math.max(0, Math.min(1 - orig.w, orig.x + dx));
        next.y = Math.max(0, Math.min(1 - orig.h, orig.y + dy));
      } else {
        // Resize: keep aspect ratio locked
        // Determine which edges are being adjusted
        let newX = orig.x;
        let newY = orig.y;
        let newW = orig.w;
        let newH = orig.h;

        if (dragMode === "resize-se") {
          // dragging bottom-right corner — increase w, then h = w/aspect
          newW = Math.max(0.05, orig.w + dx);
          newH = newW / aspect;
          // Don't go beyond right/bottom edge
          if (newX + newW > 1) newW = 1 - newX;
          if (newY + newH > 1) {
            newH = 1 - newY;
            newW = newH * aspect;
          }
        } else if (dragMode === "resize-sw") {
          // dragging bottom-left — x decreases, w increases
          newW = Math.max(0.05, orig.w - dx);
          newH = newW / aspect;
          newX = orig.x + (orig.w - newW);
          if (newX < 0) {
            newW = newW + newX;
            newH = newW / aspect;
            newX = 0;
          }
          if (newY + newH > 1) {
            newH = 1 - newY;
            newW = newH * aspect;
            newX = orig.x + (orig.w - newW);
          }
        } else if (dragMode === "resize-ne") {
          // dragging top-right — y decreases, w increases
          newW = Math.max(0.05, orig.w + dx);
          newH = newW / aspect;
          newY = orig.y + (orig.h - newH);
          if (newY < 0) {
            newH = newH + newY;
            newW = newH * aspect;
            newY = 0;
          }
          if (newX + newW > 1) {
            newW = 1 - newX;
            newH = newW / aspect;
            newY = orig.y + (orig.h - newH);
          }
        } else if (dragMode === "resize-nw") {
          // dragging top-left — x and y decrease, w and h increase
          newW = Math.max(0.05, orig.w - dx);
          newH = newW / aspect;
          newX = orig.x + (orig.w - newW);
          newY = orig.y + (orig.h - newH);
          if (newX < 0) {
            newW = newW + newX;
            newH = newW / aspect;
            newX = 0;
          }
          if (newY < 0) {
            newH = newH + newY;
            newW = newH * aspect;
            newY = 0;
          }
        }

        next = { x: newX, y: newY, w: newW, h: newH };
      }

      setCrop(next);
    }

    function handleMouseUp() {
      setDragMode(null);
      dragStart.current = null;
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragMode, aspect, displaySize]);

  // Reset crop
  function handleReset() {
    setCrop(computeInitialCrop(1, 1));
  }

  // Confirm
  async function handleConfirm() {
    setUploading(true);
    try {
      // Validate crop is reasonable
      if (crop.w < 0.05 || crop.h < 0.05) {
        toast({
          title: "ناحیه‌ی برش خیلی کوچک است",
          description: "یک ناحیه‌ی بزرگ‌تر انتخاب کنید",
          variant: "destructive",
        });
        setUploading(false);
        return;
      }
      onConfirm(crop);
    } finally {
      setUploading(false);
    }
  }

  // Compute display pixel values
  const dispX = crop.x * displaySize.w;
  const dispY = crop.y * displaySize.h;
  const dispW = crop.w * displaySize.w;
  const dispH = crop.h * displaySize.h;

  return (
    <div className="space-y-4">
      {/* Cropper canvas */}
      <div className="relative">
        <div
          ref={containerRef}
          className="relative mx-auto overflow-hidden rounded-xl bg-muted/20"
          style={{ width: displaySize.w || "100%", height: displaySize.h || 400 }}
        >
          {/* The image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={src}
            alt="برش"
            onLoad={handleImageLoad}
            className="pointer-events-none select-none"
            style={{ width: displaySize.w, height: displaySize.h }}
            draggable={false}
          />

          {/* Dark overlay outside the crop region (4 rectangles) */}
          {displaySize.w > 0 && (
            <>
              {/* Top */}
              <div
                className="absolute bg-black/60"
                style={{ left: 0, top: 0, width: "100%", height: dispY }}
              />
              {/* Bottom */}
              <div
                className="absolute bg-black/60"
                style={{
                  left: 0,
                  top: dispY + dispH,
                  width: "100%",
                  height: displaySize.h - (dispY + dispH),
                }}
              />
              {/* Left */}
              <div
                className="absolute bg-black/60"
                style={{ left: 0, top: dispY, width: dispX, height: dispH }}
              />
              {/* Right */}
              <div
                className="absolute bg-black/60"
                style={{
                  left: dispX + dispW,
                  top: dispY,
                  width: displaySize.w - (dispX + dispW),
                  height: dispH,
                }}
              />
            </>
          )}

          {/* Crop rectangle */}
          {displaySize.w > 0 && (
            <div
              className="absolute cursor-move border-2 border-noor-yellow shadow-[0_0_0_9999px_rgba(0,0,0,0)]"
              style={{
                left: dispX,
                top: dispY,
                width: dispW,
                height: dispH,
              }}
              onMouseDown={(e) => handleMouseDown(e, "move")}
            >
              {/* Rule-of-thirds guides */}
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-1/3 top-0 h-full w-px bg-white/30" />
                <div className="absolute left-2/3 top-0 h-full w-px bg-white/30" />
                <div className="absolute top-1/3 left-0 h-px w-full bg-white/30" />
                <div className="absolute top-2/3 left-0 h-px w-full bg-white/30" />
              </div>

              {/* Corner handles */}
              <Handle position="nw" onDown={(e) => handleMouseDown(e, "resize-nw")} />
              <Handle position="ne" onDown={(e) => handleMouseDown(e, "resize-ne")} />
              <Handle position="sw" onDown={(e) => handleMouseDown(e, "resize-sw")} />
              <Handle position="se" onDown={(e) => handleMouseDown(e, "resize-se")} />

              {/* Size indicator */}
              <div className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 rounded-full bg-noor-yellow px-2 py-0.5 text-[10px] font-bold text-noor-navy whitespace-nowrap">
                {targetWidth} × {targetHeight}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info + actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Crop className="h-4 w-4 text-noor-sky" />
          <span>
            نسبت: <strong className="text-noor-navy dark:text-white">{aspect.toFixed(2)}:1</strong>
          </span>
          <span className="text-muted-foreground/40">•</span>
          <span>
            خروجی: <strong className="text-noor-navy dark:text-white">{targetWidth}×{targetHeight} px</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1 rounded-full bg-muted/30 px-3 py-1.5 text-xs font-bold text-muted-foreground transition hover:bg-muted/50"
            title="بازنشانی برش"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            بازنشانی
          </button>
          <NoorButton variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
            انصراف
          </NoorButton>
          <NoorButton
            variant="yellow"
            size="sm"
            onClick={handleConfirm}
            disabled={uploading}
            leftIcon={
              uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )
            }
          >
            {uploading ? "در حال پردازش..." : "برش و ذخیره"}
          </NoorButton>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground">
        ناحیه‌ی برش را drag کن یا با گوشه‌ها اندازه را تغییر بده. نسبت ابعاد به‌صورت خودکار قفل می‌شود.
        تصویر نهایی به‌صورت WebP فشرده می‌شود.
      </p>
    </div>
  );
}

// === Corner handle ===
function Handle({
  position,
  onDown,
}: {
  position: "nw" | "ne" | "sw" | "se";
  onDown: (e: React.MouseEvent) => void;
}) {
  const positionClass = {
    nw: "left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize",
    ne: "right-0 top-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize",
    sw: "left-0 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize",
    se: "right-0 bottom-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize",
  }[position];

  return (
    <div
      onMouseDown={onDown}
      className={`absolute h-4 w-4 rounded-full border-2 border-noor-navy bg-noor-yellow shadow-md ${positionClass}`}
    />
  );
}
