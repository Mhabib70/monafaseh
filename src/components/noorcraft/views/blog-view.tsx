"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  ThumbsDown,
  Eye,
  MessageCircle,
  ArrowLeft,
  Send,
  Loader2,
  Sparkles,
  Lightbulb,
  BookOpen,
  Flame,
  Clock,
  Share2,
  Bookmark,
  ChevronLeft,
  Quote,
} from "lucide-react";
import { NoorButton } from "../noor-button";
import { NoorCard } from "../noor-card";
import { NoorBadge } from "../noor-badge";
import { NoorAvatar } from "../noor-avatar";
import { BackButtons } from "../back-buttons";
import { FilterSearch } from "../noor-filters";
import { AdBanner } from "../ad-banner";
import { useNoorStore } from "@/store/noor-store";
import { useToast } from "@/hooks/use-toast";

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content?: string;
  imageUrl?: string | null;
  category: string;
  tags: string[];
  views: number;
  likes: number;
  dislikes: number;
  commentCount?: number;
  createdAt: number;
}

interface Comment {
  id: string;
  userId: string;
  userName: string;
  avatarColor: string;
  avatarUrl: string | null;
  text: string;
  likes: number;
  createdAt: number;
}

const CATEGORY_META: Record<string, { label: string; icon: React.ReactNode; color: string; card: string; desc: string }> = {
  general: { label: "عمومی", icon: <Sparkles className="h-5 w-5" />, color: "#FFD700", card: "noor-card-yellow", desc: "موضوعات مختلف" },
  idea: { label: "ایده", icon: <Lightbulb className="h-5 w-5" />, color: "#87CEEB", card: "noor-card-sky", desc: "ایده‌های نو" },
  story: { label: "سرگذشت", icon: <BookOpen className="h-5 w-5" />, color: "#FF7F7F", card: "noor-card-coral", desc: "داستان‌ها و خاطرات" },
  innovation: { label: "ابتکار", icon: <Flame className="h-5 w-5" />, color: "#7CFC00", card: "noor-card-green", desc: "نوآوری و خلاقیت" },
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  const now = Date.now();
  const diff = now - ts;
  if (diff < 60_000) return "همین حالا";
  if (diff < 3600_000) return `${Math.floor(diff / 60_000).toLocaleString("fa-IR")} دقیقه پیش`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000).toLocaleString("fa-IR")} ساعت پیش`;
  if (diff < 604800_000) return `${Math.floor(diff / 86400_000).toLocaleString("fa-IR")} روز پیش`;
  return d.toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" });
}

function formatDateLong(ts: number): string {
  return new Date(ts).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function readingTime(content: string): string {
  const words = content.split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes.toLocaleString("fa-IR")} دقیقه مطالعه`;
}

export function BlogView() {
  const user = useNoorStore((s) => s.user);
  const setView = useNoorStore((s) => s.setView);
  const { toast } = useToast();

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [postDetail, setPostDetail] = useState<any>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [commenting, setCommenting] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const [hasDisliked, setHasDisliked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    fetch(`/api/blog${filter !== "all" ? `?category=${filter}` : ""}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { if (d.ok) setPosts(d.posts); })
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => {
    if (!selectedPost) return;
    setPostDetail(null);
    fetch(`/api/blog/${selectedPost.id}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setPostDetail(d.post);
          setComments(d.post.comments || []);
        }
      });
  }, [selectedPost]);

  async function handleLike() {
    if (!user || !selectedPost || hasLiked) return;
    setHasLiked(true);
    await fetch(`/api/blog/${selectedPost.id}/like`, { method: "POST" });
    setPostDetail((p: any) => p ? { ...p, likes: p.likes + 1 } : p);
  }

  async function handleDislike() {
    if (!user || !selectedPost || hasDisliked) return;
    setHasDisliked(true);
    await fetch(`/api/blog/${selectedPost.id}/dislike`, { method: "POST" });
    setPostDetail((p: any) => p ? { ...p, dislikes: p.dislikes + 1 } : p);
  }

  async function handleComment() {
    if (!user || !selectedPost || !commentText.trim()) return;
    setCommenting(true);
    try {
      const res = await fetch(`/api/blog/${selectedPost.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: commentText.trim() }),
      });
      const data = await res.json();
      if (data.ok) {
        setComments((c) => [data.comment, ...c]);
        setCommentText("");
      }
    } finally { setCommenting(false); }
  }

  function handleShare() {
    if (!selectedPost) return;
    const url = `${window.location.origin}/?blog=${selectedPost.id}`;
    navigator.clipboard?.writeText(url).then(() => {
      toast({ title: "لینک کپی شد ✓", description: "لینک پست در کلیپ‌بورد ذخیره شد" });
    }).catch(() => {
      toast({ title: "لینک پست", description: url });
    });
  }

  const filteredPosts = search
    ? posts.filter((p) =>
        `${p.title} ${p.excerpt} ${p.tags.join(" ")}`.includes(search)
      )
    : posts;

  const featuredPost = filteredPosts[0];
  const restPosts = filteredPosts.slice(1);

  // === POST DETAIL VIEW ===
  if (selectedPost) {
    const meta = CATEGORY_META[selectedPost.category] || CATEGORY_META.general;
    const content = postDetail?.content || selectedPost.excerpt;
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-noor-hero">
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
          <div className="mb-4">
            <BackButtons />
          </div>

          <button
            onClick={() => {
              setSelectedPost(null); setPostDetail(null); setComments([]);
              setHasLiked(false); setHasDisliked(false); setBookmarked(false);
            }}
            className="mb-4 flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-xs font-bold text-noor-navy shadow-sm transition hover:bg-white dark:bg-white/10 dark:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            بازگشت به بلاگ
          </button>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Article card */}
            <NoorCard className={meta.card}>
              {/* Category + meta */}
              <div className="mb-4 flex items-center justify-between">
                <span
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-noor-navy"
                  style={{ background: `${meta.color}33` }}
                >
                  {meta.icon}
                  {meta.label}
                </span>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDateLong(selectedPost.createdAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    {readingTime(content)}
                  </span>
                </div>
              </div>

              {/* Title */}
              <h1 className="mb-4 text-2xl font-bold leading-snug text-noor-navy dark:text-white sm:text-3xl">
                {selectedPost.title}
              </h1>

              {/* Hero image */}
              {postDetail?.imageUrl && (
                <div className="mb-5 overflow-hidden rounded-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={postDetail.imageUrl}
                    alt={selectedPost.title}
                    className="max-h-80 w-full object-cover"
                  />
                </div>
              )}

              {/* Content — rendered as paragraphs */}
              <article className="prose prose-sm max-w-none dark:prose-invert">
                {content.split("\n").map((para, i) => {
                  const trimmed = para.trim();
                  if (!trimmed) return null;

                  // Heading (starts with #)
                  if (trimmed.startsWith("# ")) {
                    return (
                      <h2 key={i} className="mt-5 mb-2 text-lg font-bold text-noor-navy dark:text-white">
                        {trimmed.slice(2)}
                      </h2>
                    );
                  }

                  // Quote (starts with >)
                  if (trimmed.startsWith("> ")) {
                    return (
                      <blockquote key={i} className="my-4 border-r-4 border-noor-yellow bg-noor-yellow/10 rounded-l-xl p-3 pr-4">
                        <div className="flex items-start gap-2">
                          <Quote className="h-4 w-4 shrink-0 text-noor-yellow mt-0.5" />
                          <p className="text-sm italic leading-relaxed text-noor-navy dark:text-white/90">
                            {trimmed.slice(2)}
                          </p>
                        </div>
                      </blockquote>
                    );
                  }

                  // Regular paragraph
                  return (
                    <p key={i} className="mb-3 text-sm leading-7 text-muted-foreground dark:text-white/80">
                      {trimmed}
                    </p>
                  );
                })}
              </article>

              {/* Tags */}
              {selectedPost.tags.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {selectedPost.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-muted/30 px-2.5 py-1 text-[10px] font-bold text-muted-foreground">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Action bar */}
              <div className="mt-6 flex items-center gap-2 border-t border-muted/20 pt-4">
                <button
                  onClick={handleLike}
                  disabled={!user || hasLiked}
                  className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition disabled:opacity-50 ${
                    hasLiked ? "bg-noor-green/20 text-noor-green" : "bg-muted/30 text-muted-foreground hover:bg-noor-green/15"
                  }`}
                >
                  <Heart className={`h-4 w-4 ${hasLiked ? "fill-current" : ""}`} />
                  {postDetail?.likes ?? selectedPost.likes}
                </button>
                <button
                  onClick={handleDislike}
                  disabled={!user || hasDisliked}
                  className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition disabled:opacity-50 ${
                    hasDisliked ? "bg-noor-coral/20 text-noor-coral" : "bg-muted/30 text-muted-foreground hover:bg-noor-coral/15"
                  }`}
                >
                  <ThumbsDown className="h-4 w-4" />
                  {postDetail?.dislikes ?? selectedPost.dislikes}
                </button>
                <span className="flex items-center gap-1.5 rounded-full bg-muted/30 px-4 py-2 text-xs font-bold text-muted-foreground">
                  <Eye className="h-4 w-4" />
                  {postDetail?.views ?? selectedPost.views}
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-muted/30 px-4 py-2 text-xs font-bold text-muted-foreground">
                  <MessageCircle className="h-4 w-4" />
                  {comments.length}
                </span>
                <div className="mr-auto flex items-center gap-1.5">
                  <button
                    onClick={() => { setBookmarked(!bookmarked); toast({ title: bookmarked ? "از ذخیره خارج شد" : "ذخیره شد 🔖" }); }}
                    className={`grid h-9 w-9 place-items-center rounded-full transition ${
                      bookmarked ? "bg-noor-yellow/20 text-noor-yellow" : "bg-muted/30 text-muted-foreground hover:bg-noor-yellow/15"
                    }`}
                  >
                    <Bookmark className={`h-4 w-4 ${bookmarked ? "fill-current" : ""}`} />
                  </button>
                  <button
                    onClick={handleShare}
                    className="grid h-9 w-9 place-items-center rounded-full bg-muted/30 text-muted-foreground transition hover:bg-noor-sky/15"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </NoorCard>

            {/* Comments section */}
            <div className="mt-6">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-noor-navy dark:text-white">
                <MessageCircle className="h-4 w-4 text-noor-sky" />
                نظرات ({comments.length.toLocaleString("fa-IR")})
              </h3>

              {user ? (
                <div className="mb-5 flex items-start gap-3">
                  <NoorAvatar name={user.fullName} color={user.avatarColor} avatarUrl={user.avatarUrl} size="sm" />
                  <div className="flex-1">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="نظر خود را بنویسید..."
                      rows={2}
                      className="w-full rounded-2xl border border-input bg-background px-4 py-2.5 text-sm focus:border-noor-sky focus:outline-none resize-none"
                    />
                    <div className="mt-2 flex justify-end">
                      <button
                        onClick={handleComment}
                        disabled={commenting || !commentText.trim()}
                        className="flex items-center gap-1.5 rounded-full bg-noor-yellow px-4 py-2 text-xs font-bold text-noor-navy transition hover:brightness-105 disabled:opacity-50"
                      >
                        {commenting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        ارسال نظر
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="mb-4 rounded-xl bg-muted/20 p-3 text-center text-xs text-muted-foreground">
                  برای نظر دادن، ابتدا وارد شوید
                </p>
              )}

              <div className="space-y-3">
                {comments.length === 0 ? (
                  <p className="text-center text-xs text-muted-foreground py-6">
                    هنوز نظری ثبت نشده — اولین نفر باشید!
                  </p>
                ) : (
                  comments.map((c) => (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-3 rounded-2xl bg-card p-4"
                    >
                      <NoorAvatar name={c.userName} color={c.avatarColor} avatarUrl={c.avatarUrl} size="sm" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-noor-navy dark:text-white">{c.userName}</span>
                          <span className="text-[10px] text-muted-foreground">{formatTime(c.createdAt)}</span>
                        </div>
                        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground dark:text-white/80">{c.text}</p>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // === BLOG LIST VIEW ===
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-noor-hero">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <div className="mb-4">
          <BackButtons />
        </div>

        {/* AD: Leaderboard — بالای صفحه بلاگ */}
        <AdBanner slot="blog-top" size="leaderboard" className="mb-4" />

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 text-center"
        >
          <NoorBadge variant="coral" icon={<Sparkles className="h-3 w-3" />}>
            یادداشت‌ها و تجربه‌های منافسه
          </NoorBadge>
          <h1 className="mt-3 text-3xl font-extrabold text-noor-navy dark:text-white">
            بلاگ منافسه
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            ایده‌ها، تجربه‌ها و داستان‌های کاربران — همراه با شما
          </p>
        </motion.div>

        {/* Search + category — نوار منسجم */}
        <NoorCard className="mb-6 noor-card-sky">
          <div className="grid gap-3 md:grid-cols-12">
            <div className="md:col-span-5">
              <FilterSearch
                value={search}
                onChange={setSearch}
                placeholder="جستجو در بلاگ…"
              />
            </div>
            <div className="flex flex-wrap items-center gap-1.5 md:col-span-7 md:justify-end">
              <button
                onClick={() => setFilter("all")}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                  filter === "all"
                    ? "bg-noor-navy text-white"
                    : "bg-white/70 text-noor-navy hover:bg-white dark:bg-white/10 dark:text-white"
                }`}
              >
                همه
              </button>
              {Object.entries(CATEGORY_META).map(([key, meta]) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                    filter === key
                      ? "bg-noor-navy text-white"
                      : "bg-white/70 text-noor-navy hover:bg-white dark:bg-white/10 dark:text-white"
                  }`}
                >
                  <span style={{ color: filter === key ? meta.color : undefined }}>{meta.icon}</span>
                  {meta.label}
                </button>
              ))}
            </div>
          </div>
        </NoorCard>

                {/* Posts */}
        {loading ? (
          <div className="grid place-items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-noor-yellow" />
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="rounded-3xl bg-card p-10 text-center">
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-full bg-noor-sky/20"
            >
              <BookOpen className="h-10 w-10 text-noor-sky" />
            </motion.div>
            <h3 className="font-display text-xl text-noor-navy dark:text-white">
              هنوز پستی منتشر نشده
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              به‌زودی مطالب جدید در این بخش منتشر می‌شود
            </p>
          </div>
        ) : (
          <>
            {/* Featured post (first) — large card */}
            {featuredPost && !search && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4 }}
                onClick={() => setSelectedPost(featuredPost)}
                className={`mb-6 cursor-pointer overflow-hidden rounded-3xl ${CATEGORY_META[featuredPost.category]?.card || "noor-card-yellow"}`}
              >
                <div className="flex flex-col sm:flex-row">
                  {/* Image */}
                  {featuredPost.imageUrl && (
                    <div className="shrink-0 overflow-hidden sm:w-1/2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={featuredPost.imageUrl} alt={featuredPost.title} className="h-48 w-full object-cover sm:h-full" />
                    </div>
                  )}
                  {/* Content */}
                  <div className="flex-1 p-5">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="rounded-full bg-noor-coral/20 px-2.5 py-0.5 text-[10px] font-bold text-noor-coral">
                        ⭐ ویژه
                      </span>
                      <span
                        className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold text-noor-navy"
                        style={{ background: `${CATEGORY_META[featuredPost.category]?.color}33` }}
                      >
                        {CATEGORY_META[featuredPost.category]?.icon}
                        {CATEGORY_META[featuredPost.category]?.label}
                      </span>
                    </div>
                    <h2 className="mb-2 text-xl font-bold leading-snug text-noor-navy dark:text-white">
                      {featuredPost.title}
                    </h2>
                    <p className="mb-3 line-clamp-3 text-sm text-muted-foreground">
                      {featuredPost.excerpt}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatTime(featuredPost.createdAt)}</span>
                      <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{featuredPost.likes.toLocaleString("fa-IR")}</span>
                      <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />{(featuredPost.commentCount ?? 0).toLocaleString("fa-IR")}</span>
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{featuredPost.views.toLocaleString("fa-IR")}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Rest posts — grid */}
            <div className="grid gap-4 sm:grid-cols-2">
              <AnimatePresence mode="popLayout">
                {(search ? filteredPosts : restPosts).map((post, i) => {
                  const meta = CATEGORY_META[post.category] || CATEGORY_META.general;
                  return (
                    <motion.div
                      key={post.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: i * 0.05, type: "spring", stiffness: 300, damping: 25 }}
                      whileHover={{ y: -4 }}
                      onClick={() => setSelectedPost(post)}
                      className={`cursor-pointer overflow-hidden rounded-3xl ${meta.card}`}
                    >
                      {/* Image */}
                      {post.imageUrl && (
                        <div className="overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={post.imageUrl} alt={post.title} className="h-36 w-full object-cover transition hover:scale-105" />
                        </div>
                      )}
                      <div className="p-4">
                        {/* Category + time */}
                        <div className="mb-2 flex items-center justify-between">
                          <span
                            className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold text-noor-navy"
                            style={{ background: `${meta.color}33` }}
                          >
                            {meta.icon}
                            {meta.label}
                          </span>
                          <span className="text-[9px] text-muted-foreground">{formatTime(post.createdAt)}</span>
                        </div>

                        {/* Title */}
                        <h3 className="mb-2 text-base font-bold leading-snug text-noor-navy dark:text-white">
                          {post.title}
                        </h3>

                        {/* Excerpt */}
                        <p className="mb-3 line-clamp-2 text-xs text-muted-foreground">
                          {post.excerpt}
                        </p>

                        {/* Stats */}
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{post.likes.toLocaleString("fa-IR")}</span>
                          <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />{(post.commentCount ?? 0).toLocaleString("fa-IR")}</span>
                          <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{post.views.toLocaleString("fa-IR")}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* AD: Medium Rectangle — پایین لیست پست‌ها */}
            <div className="mt-8">
              <AdBanner slot="blog-mid" size="rectangle" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
