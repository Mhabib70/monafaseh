"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Upload, X, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface AvatarUploaderProps {
  value: string | null;
  onChange: (url: string | null) => void;
  userName?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-16 w-16",
  md: "h-24 w-24",
  lg: "h-32 w-32",
};

const iconSizes = {
  sm: "h-6 w-6",
  md: "h-8 w-8",
  lg: "h-10 w-10",
};

export function AvatarUploader({
  value,
  onChange,
  userName,
  size = "lg",
  className,
}: AvatarUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setUploading(true);

      try {
        // Validate
        if (!file.type.startsWith("image/")) {
          throw new Error("فقط فایل تصویری مجاز است");
        }
        if (file.size > 5 * 1024 * 1024) {
          throw new Error("حجم فایل نباید بیشتر از ۵ مگابایت باشد");
        }

        // Upload
        const formData = new FormData();
        formData.append("avatar", file);

        const res = await fetch("/api/upload-avatar", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();

        if (!data.ok) {
          throw new Error(data.error || "خطا در آپلود");
        }

        onChange(data.url);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "خطا در آپلود تصویر";
        setError(msg);
      } finally {
        setUploading(false);
      }
    },
    [onChange],
  );

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function handleRemove(e: React.MouseEvent) {
    e.stopPropagation();
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          "group relative cursor-pointer overflow-hidden rounded-full border-4 border-dashed transition",
          sizeClasses[size],
          dragOver
            ? "border-noor-yellow bg-noor-yellow/15"
            : "border-muted-foreground/30 hover:border-noor-sky",
        )}
      >
        {value ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt={userName ?? "تصویر پروفایل"}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-noor-navy/60 opacity-0 transition group-hover:opacity-100">
              <Camera className={cn("text-white", iconSizes[size])} />
            </div>
            <button
              onClick={handleRemove}
              className="absolute left-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-noor-coral text-white shadow-md transition hover:scale-110"
              aria-label="حذف تصویر"
            >
              <X className="h-3 w-3" />
            </button>
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground">
            {uploading ? (
              <Loader2 className={cn("animate-spin text-noor-sky", iconSizes[size])} />
            ) : (
              <>
                <Upload className={cn(iconSizes[size])} />
                <span className="text-[10px] font-bold">آپلود تصویر</span>
              </>
            )}
          </div>
        )}

        {/* Success badge */}
        <AnimatePresence>
          {value && !uploading && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-noor-green text-noor-navy shadow-md"
            >
              <Check className="h-4 w-4" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleInputChange}
        className="hidden"
      />

      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          تصویر پروفایل خود را آپلود کنید
        </p>
        <p className="text-[10px] text-muted-foreground/70">
          حداکثر ۵ مگابایت • JPG, PNG, WebP
        </p>
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs font-medium text-noor-coral"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
