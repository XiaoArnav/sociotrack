"use client";

import React, { useState, useEffect } from "react";
import {
  Film,
  Layers,
  Image as ImageIcon,
  Heart,
  MessageCircle,
  Eye,
  Bookmark,
  Share2,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Zap,
  TrendingUp,
} from "lucide-react";
import { CreatorProfile } from "./InsTrackCreatorCard";
import { formatRelativeTime } from "@/lib/dateUtils";

export interface FeedPost {
  post_id: string;
  media_type: "REELS" | "CAROUSEL_ALBUM" | "IMAGE";
  caption: string;
  views_or_reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  engagement_rate: number;
  virality_score: number;
  posted_at: string;
  winning_factor: string;
  thumbnail_url: string;
}

interface InsTrackRecentPostsFeedProps {
  creator: CreatorProfile;
  onSelectHook: (hookText: string) => void;
  onToast?: (title: string, message: string, type?: "success" | "info" | "warning") => void;
}

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

export function InsTrackRecentPostsFeed({
  creator,
  onSelectHook,
  onToast,
}: InsTrackRecentPostsFeedProps) {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [refreshing, setRefreshing] = useState(false);

  const cleanHandle = creator.handle.replace(/^@/, "").toLowerCase().trim();

  const resolveThumbnail = (url?: string) => {
    if (!url) return creator.avatar;
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
      return url;
    }
    const cleanPath = url.startsWith("/") ? url : `/${url}`;
    return `${BASE_PATH}${cleanPath}`;
  };

  const getApiBase = () => {
    const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
    return (
      process.env.NEXT_PUBLIC_API_URL ||
      (isHttps ? "https://sociotrack-api.onrender.com" : "http://localhost:8000")
    );
  };

  const generateFallbackFeed = (): FeedPost[] => {
    const baseFol = Math.max(15, creator.followers);
    const scale = Math.max(0.08, Math.min(1.0, baseFol / 5000));

    return [
      {
        post_id: "post_1",
        media_type: "REELS",
        caption:
          "Why 90% of AI agent setups fail in production: Unbounded state loops vs deterministic checkpoint graphs. Here is how we engineered resilience.",
        views_or_reach: Math.round(baseFol * 1.8 + 240),
        likes: Math.round(baseFol * 0.12 + 25),
        comments: Math.round(baseFol * 0.025 + 6),
        shares: Math.round(baseFol * 0.04 + 12),
        saves: Math.round(baseFol * 0.06 + 18),
        engagement_rate: 4.85,
        virality_score: 9.2,
        posted_at: "2d ago",
        winning_factor: "High retention hook (78% watch time) • Viral algorithmic share ratio",
        thumbnail_url: creator.avatar,
      },
      {
        post_id: "post_2",
        media_type: "CAROUSEL_ALBUM",
        caption:
          "The Enterprise Social Intelligence Architecture: How to ingest real-time Meta Graph API telemetry with sub-second background polling.",
        views_or_reach: Math.round(baseFol * 1.3 + 180),
        likes: Math.round(baseFol * 0.09 + 18),
        comments: Math.round(baseFol * 0.018 + 4),
        shares: Math.round(baseFol * 0.02 + 8),
        saves: Math.round(baseFol * 0.08 + 22),
        engagement_rate: 4.12,
        virality_score: 8.6,
        posted_at: "5d ago",
        winning_factor: "High utility save rate • Reference architecture diagram acts as bookmark",
        thumbnail_url: creator.avatar,
      },
      {
        post_id: "post_3",
        media_type: "REELS",
        caption:
          "Behind the scenes: Live follower & unfollower tracking cron pipeline running in production. No secret tokens leaked.",
        views_or_reach: Math.round(baseFol * 2.1 + 310),
        likes: Math.round(baseFol * 0.14 + 32),
        comments: Math.round(baseFol * 0.03 + 9),
        shares: Math.round(baseFol * 0.05 + 16),
        saves: Math.round(baseFol * 0.05 + 15),
        engagement_rate: 5.24,
        virality_score: 9.4,
        posted_at: "1w ago",
        winning_factor: "Fast 3-second opening hook with live code terminal visual proof",
        thumbnail_url: creator.avatar,
      },
      {
        post_id: "post_4",
        media_type: "IMAGE",
        caption:
          "Late night engineering sessions in Bangalore. Shipping deep modules and deterministic state machines.",
        views_or_reach: Math.round(baseFol * 0.9 + 120),
        likes: Math.round(baseFol * 0.07 + 14),
        comments: Math.round(baseFol * 0.015 + 3),
        shares: Math.round(baseFol * 0.01 + 3),
        saves: Math.round(baseFol * 0.01 + 4),
        engagement_rate: 2.94,
        virality_score: 7.1,
        posted_at: "2w ago",
        winning_factor: "Strong personal authenticity resonance in community comment threads",
        thumbnail_url: creator.avatar,
      },
      {
        post_id: "post_5",
        media_type: "CAROUSEL_ALBUM",
        caption:
          "5 Invariants every distributed data pipeline must guarantee: Durability, natural idempotency, deduplication keys, and retry bounds.",
        views_or_reach: Math.round(baseFol * 1.4 + 195),
        likes: Math.round(baseFol * 0.10 + 20),
        comments: Math.round(baseFol * 0.02 + 5),
        shares: Math.round(baseFol * 0.03 + 10),
        saves: Math.round(baseFol * 0.09 + 25),
        engagement_rate: 4.38,
        virality_score: 8.8,
        posted_at: "3w ago",
        winning_factor: "Educational slide checklist driven by technical precision",
        thumbnail_url: creator.avatar,
      },
      {
        post_id: "post_6",
        media_type: "REELS",
        caption:
          "Automating Instagram content intelligence with Python FastAPI, Next.js, and background async workers.",
        views_or_reach: Math.round(baseFol * 1.6 + 220),
        likes: Math.round(baseFol * 0.11 + 22),
        comments: Math.round(baseFol * 0.022 + 5),
        shares: Math.round(baseFol * 0.035 + 11),
        saves: Math.round(baseFol * 0.045 + 14),
        engagement_rate: 4.45,
        virality_score: 8.9,
        posted_at: "1mo ago",
        winning_factor: "High share-to-save ratio across developer networks",
        thumbnail_url: creator.avatar,
      },
    ];
  };

  const fetchFeed = async () => {
    setLoading(true);
    const apiBase = getApiBase();

    try {
      const res = await fetch(
        `${apiBase}/api/creators/${encodeURIComponent(cleanHandle)}/feed?max_posts=9`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.posts && data.posts.length > 0) {
          setPosts(data.posts);
        } else {
          setPosts(generateFallbackFeed());
        }
      } else {
        setPosts(generateFallbackFeed());
      }
    } catch {
      setPosts(generateFallbackFeed());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [cleanHandle]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchFeed();
    setRefreshing(false);
    onToast?.(
      "Feed Refreshed",
      `Fetched latest Reels and Posts telemetry for @${cleanHandle}.`,
      "success"
    );
  };

  const handleUseHook = (post: FeedPost) => {
    onSelectHook(post.caption);
    onToast?.(
      "Hook Sent to AI Studio",
      `Loaded hook: "${post.caption.slice(0, 48)}..." into the generator.`,
      "success"
    );
  };

  const filteredPosts = posts.filter((p) => {
    if (filterType === "all") return true;
    if (filterType === "reels") return p.media_type === "REELS";
    if (filterType === "carousels") return p.media_type === "CAROUSEL_ALBUM";
    if (filterType === "images") return p.media_type === "IMAGE";
    return true;
  });

  return (
    <div className="bg-white dark:bg-[#161F30] rounded-2xl border border-slate-200 dark:border-[#243048] p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-[#243048]">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <Film className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Recent Posts &amp; Reels Intelligence: @{cleanHandle}
            </h3>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                posts.length > 0 && posts[0].post_id.startsWith("post_")
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                  : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20"
              }`}
            >
              {posts.length > 0 && posts[0].post_id.startsWith("post_")
                ? "Sample Benchmark Telemetry"
                : "Live Verified Telemetry"}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Live-scraped top performing content with engagement velocity, hook factors, and 1-click AI generation prompts.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          {/* Format Filter Pills */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-[#1E2638] text-xs font-semibold">
            {[
              { id: "all", label: "All" },
              { id: "reels", label: "Reels" },
              { id: "carousels", label: "Carousels" },
              { id: "images", label: "Images" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                className={`px-3 py-1 rounded-lg transition-all ${
                  filterType === f.id
                    ? "bg-white dark:bg-[#243048] text-slate-900 dark:text-white shadow-xs font-bold"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="p-2 rounded-xl border border-slate-200 dark:border-[#243048] hover:bg-slate-50 dark:hover:bg-[#1E2638] text-slate-600 dark:text-slate-300 transition-colors"
            title="Refresh feed"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing || loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Grid of Posts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPosts.map((post) => {
          const isReel = post.media_type === "REELS";
          const isCarousel = post.media_type === "CAROUSEL_ALBUM";

          return (
            <div
              key={post.post_id}
              className="bg-slate-50/70 dark:bg-[#1E2638]/70 border border-slate-200/80 dark:border-[#243048] rounded-xl overflow-hidden hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Media Header / Poster Area */}
                <div className="relative h-44 bg-gradient-to-br from-indigo-900/90 via-slate-900 to-purple-950 flex items-center justify-center overflow-hidden">
                  <img
                    src={resolveThumbnail(post.thumbnail_url)}
                    alt={post.caption}
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-cover opacity-35 filter blur-xs"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (!target.dataset.triedAvatar) {
                        target.dataset.triedAvatar = "1";
                        target.src = creator.avatar;
                      } else {
                        target.src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80";
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                  {/* Format Badge */}
                  <div className="absolute top-3 left-3 z-10 flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/60 text-white backdrop-blur-md border border-white/20">
                    {isReel ? (
                      <>
                        <Film className="w-3 h-3 text-rose-400" />
                        <span>Reel</span>
                      </>
                    ) : isCarousel ? (
                      <>
                        <Layers className="w-3 h-3 text-sky-400" />
                        <span>Carousel</span>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-3 h-3 text-emerald-400" />
                        <span>Post</span>
                      </>
                    )}
                  </div>

                  {/* Posted Time */}
                  <span
                    className="absolute top-3 right-3 z-10 text-[10px] font-bold text-slate-300 bg-black/50 px-2 py-0.5 rounded backdrop-blur-xs"
                    suppressHydrationWarning
                  >
                    {formatRelativeTime(post.posted_at)}
                  </span>

                  {/* Center Visual Cue */}
                  <div className="relative z-10 text-center p-4">
                    <div className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center mx-auto text-white shadow-lg mb-2">
                      {isReel ? (
                        <Film className="w-5 h-5 text-rose-300" />
                      ) : isCarousel ? (
                        <Layers className="w-5 h-5 text-sky-300" />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-emerald-300" />
                      )}
                    </div>
                    <div className="text-[11px] font-bold text-white/90">
                      {post.views_or_reach.toLocaleString()} Views &amp; Reach
                    </div>
                  </div>
                </div>

                {/* Caption Snippet */}
                <div className="p-4 space-y-3">
                  <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-3 leading-relaxed">
                    {post.caption}
                  </p>

                  {/* Engagement Metrics Row */}
                  <div className="grid grid-cols-4 gap-2 pt-1 border-t border-slate-200/60 dark:border-[#243048] text-center">
                    <div className="p-1.5 rounded-lg bg-white dark:bg-[#161F30] border border-slate-100 dark:border-[#243048]">
                      <div className="flex items-center justify-center space-x-1 text-slate-400 text-[10px]">
                        <Heart className="w-2.5 h-2.5 text-rose-500" />
                        <span>Likes</span>
                      </div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                        {post.likes.toLocaleString()}
                      </div>
                    </div>

                    <div className="p-1.5 rounded-lg bg-white dark:bg-[#161F30] border border-slate-100 dark:border-[#243048]">
                      <div className="flex items-center justify-center space-x-1 text-slate-400 text-[10px]">
                        <MessageCircle className="w-2.5 h-2.5 text-indigo-500" />
                        <span>Comms</span>
                      </div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                        {post.comments.toLocaleString()}
                      </div>
                    </div>

                    <div className="p-1.5 rounded-lg bg-white dark:bg-[#161F30] border border-slate-100 dark:border-[#243048]">
                      <div className="flex items-center justify-center space-x-1 text-slate-400 text-[10px]">
                        <Bookmark className="w-2.5 h-2.5 text-amber-500" />
                        <span>Saves</span>
                      </div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                        {post.saves.toLocaleString()}
                      </div>
                    </div>

                    <div className="p-1.5 rounded-lg bg-white dark:bg-[#161F30] border border-slate-100 dark:border-[#243048]">
                      <div className="flex items-center justify-center space-x-1 text-slate-400 text-[10px]">
                        <TrendingUp className="w-2.5 h-2.5 text-emerald-500" />
                        <span>ER %</span>
                      </div>
                      <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {post.engagement_rate}%
                      </div>
                    </div>
                  </div>

                  {/* AI Winning Factor Tag */}
                  <div className="p-2.5 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex items-start space-x-2 text-[11px]">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                    <span className="text-indigo-900 dark:text-indigo-200 leading-snug">
                      {post.winning_factor}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button: Send Hook to AI Studio */}
              <div className="p-4 pt-0">
                <button
                  onClick={() => handleUseHook(post)}
                  className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm shadow-indigo-600/20"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  <span>Use Hook in AI Studio</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
