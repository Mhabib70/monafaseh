"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  User,
  Users,
  BookOpen,
  Settings,
  Check,
  X,
  ScrollText,
  AlertCircle,
  Hand,
} from "lucide-react";
import { NoorButton } from "./noor-button";
import { NoorCard } from "./noor-card";
import { NoorBadge } from "./noor-badge";
import {
  SITE_RULES,
  PLEDGE_TEXT,
  RULE_CATEGORIES,
  type RuleItem,
} from "@/lib/noorcraft/site-rules";

interface RulesAgreementProps {
  open: boolean;
  onClose: () => void;
  onAgree: () => void;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  identity: <User className="h-4 w-4" />,
  modesty: <Shield className="h-4 w-4" />,
  quranic: <BookOpen className="h-4 w-4" />,
  conduct: <Users className="h-4 w-4" />,
  technical: <Settings className="h-4 w-4" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  identity: "#FFD700",
  modesty: "#FF7F7F",
  quranic: "#7CFC00",
  conduct: "#87CEEB",
  technical: "#9d4edd",
};

export function RulesAgreement({ open, onClose, onAgree }: RulesAgreementProps) {
  const [activeCategory, setActiveCategory] = useState<string>("identity");
  const [readRules, setReadRules] = useState<Set<number>>(new Set());
  const [pledgeAccepted, setPledgeAccepted] = useState(false);
  const [showPledge, setShowPledge] = useState(false);

  const allRead = readRules.size === SITE_RULES.length;

  const filteredRules = useMemo(
    () => SITE_RULES.filter((r) => r.category === activeCategory),
    [activeCategory],
  );

  function toggleRule(ruleId: number) {
    setReadRules((prev) => {
      const next = new Set(prev);
      if (next.has(ruleId)) {
        next.delete(ruleId);
      } else {
        next.add(ruleId);
      }
      return next;
    });
  }

  function handleFinalAgree() {
    if (!allRead) return;
    if (!pledgeAccepted) return;
    onAgree();
  }

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, y: 30 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-3xl bg-card shadow-2xl"
        >
          {/* Header */}
          <div className="border-b border-muted/30 bg-gradient-to-br from-[#0b0a08] to-[#17150f] p-5 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-noor-yellow/20">
                  <ScrollText className="h-6 w-6 text-noor-yellow" />
                </div>
                <div>
                  <h2 className="font-display text-2xl">قوانین و تعهدنامه شرعی</h2>
                  <p className="text-xs text-muted-foreground">
                    پلتفرم منافسه — رعایت شؤون اسلامی
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Progress */}
            <div className="mt-4 flex items-center gap-2">
              <div className="flex-1">
                <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>مطالعه قوانین</span>
                  <span>{readRules.size} از {SITE_RULES.length}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    className="h-full rounded-full bg-noor-yellow"
                    animate={{ width: `${(readRules.size / SITE_RULES.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="flex max-h-[60vh] flex-col overflow-hidden">
            {/* Category tabs */}
            <div className="flex gap-1 overflow-x-auto border-b border-muted/30 p-2">
              {RULE_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
                    activeCategory === cat.id
                      ? "text-white"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                  style={
                    activeCategory === cat.id
                      ? { background: cat.color, color: "#191970" }
                      : undefined
                  }
                >
                  {CATEGORY_ICONS[cat.id]}
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Rules list */}
            <div className="flex-1 overflow-y-auto p-4">
              {!showPledge ? (
                <div className="space-y-3">
                  {filteredRules.map((rule) => (
                    <RuleCard
                      key={rule.id}
                      rule={rule}
                      read={readRules.has(rule.id)}
                      onToggle={() => toggleRule(rule.id)}
                    />
                  ))}
                </div>
              ) : (
                /* Pledge text */
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <NoorCard className="bg-gradient-to-br from-noor-yellow/10 to-noor-coral/10">
                    <div className="mb-3 flex items-center gap-2">
                      <Hand className="h-5 w-5 text-noor-yellow" />
                      <h3 className="text-lg font-bold">تعهدنامه شرعی</h3>
                    </div>
                    <div className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                      {PLEDGE_TEXT.trim()}
                    </div>
                  </NoorCard>

                  <label className="flex cursor-pointer items-start gap-3 rounded-2xl border-2 border-muted/30 bg-muted/20 p-4 transition hover:border-noor-green/40">
                    <button
                      onClick={() => setPledgeAccepted(!pledgeAccepted)}
                      className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg border-2 transition ${
                        pledgeAccepted
                          ? "border-noor-green bg-noor-green text-noor-navy"
                          : "border-muted-foreground/30"
                      }`}
                    >
                      {pledgeAccepted && <Check className="h-4 w-4" />}
                    </button>
                    <div>
                      <span className="text-sm font-bold">
                        تعهد می‌دهم که تمام قوانین فوق را مطالعه کرده و آن‌ها را می‌پذیرم.
                      </span>
                      <p className="mt-1 text-xs text-muted-foreground">
                        با تأیید این تعهدنامه، ثبت‌نام شما نهایی می‌شود.
                      </p>
                    </div>
                  </label>
                </motion.div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-muted/30 p-4">
            {!showPledge ? (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {allRead
                    ? "✓ تمام قوانین مطالعه شد"
                    : `برای ادامه، تمام قوانین را مطالعه و تأیید کنید (${readRules.size}/${SITE_RULES.length})`}
                </span>
                <div className="flex gap-2">
                  <NoorButton variant="ghost" size="sm" onClick={onClose}>
                    انصراف
                  </NoorButton>
                  <NoorButton
                    variant="yellow"
                    size="sm"
                    disabled={!allRead}
                    onClick={() => setShowPledge(true)}
                    leftIcon={<ScrollText className="h-4 w-4" />}
                  >
                    مشاهده تعهدنامه
                  </NoorButton>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowPledge(false)}
                  className="text-xs text-muted-foreground hover:underline"
                >
                  بازگشت به قوانین
                </button>
                <div className="flex gap-2">
                  <NoorButton variant="ghost" size="sm" onClick={onClose}>
                    انصراف
                  </NoorButton>
                  <NoorButton
                    variant="green"
                    size="sm"
                    disabled={!pledgeAccepted}
                    onClick={handleFinalAgree}
                    leftIcon={<Check className="h-4 w-4" />}
                    className={pledgeAccepted ? "animate-pulse-glow" : ""}
                  >
                    پذیرش و ادامه ثبت‌نام
                  </NoorButton>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function RuleCard({
  rule,
  read,
  onToggle,
}: {
  rule: RuleItem;
  read: boolean;
  onToggle: () => void;
}) {
  const color = CATEGORY_COLORS[rule.category];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border-2 p-4 transition ${
        read ? "border-noor-green/40 bg-noor-green/5" : "border-muted/30"
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={onToggle}
          className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg border-2 transition ${
            read
              ? "border-noor-green bg-noor-green text-noor-navy"
              : "border-muted-foreground/30 hover:border-noor-sky"
          }`}
        >
          {read && <Check className="h-4 w-4" />}
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span
              className="grid h-6 w-6 place-items-center rounded-full text-xs font-bold text-white"
              style={{ background: color }}
            >
              {rule.id}
            </span>
            <h4 className="text-sm font-bold text-white">
              {rule.title}
            </h4>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {rule.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
