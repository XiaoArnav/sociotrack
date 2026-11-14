"use client";

import React, { useState, useEffect } from "react";
import {
  Star,
  Instagram,
  Link as LinkIcon,
  Download,
  Calendar,
  ChevronDown,
  Check,
  CheckCircle2,
  Info,
  Sparkles,
  Mail,
  Send,
  Lock,
  Bookmark,
  Clock,
  RotateCw,
} from "lucide-react";
import { formatDateOnly, formatRelativeTime } from "@/lib/dateUtils";
import { saveProfileSnapshot, toggleWeeklyCrawl, isWeeklyCrawlEnabled } from "@/utils/supabase/snapshots";

export type SubNavTab =
  | "overview"
  | "growth"
  | "audience"
  | "engagement"
  | "content"
  | "historical"
  | "audit"
  | "unfollowers"
  | "aistudio"
  | "memorybank"
  | "experiments"
  | "calendar"
  | "telemetry"
  | "competitors"
  | "ask_ai"
  | "approval"
  | "reports"
  | "pricing"
  | "billing"
  | "saas_metrics";

export interface CreatorProfile {
  handle: string;
  name: string;
  avatar: string;
  bioLines: string[];
  linkUrl: string;
  trackedSince?: string;
  trackedSinceDate?: string;
  lastFetchedAt?: string | number | null;
  lastFetchFailed?: boolean;
  followers: number;
  followersDelta: string;
  following: number;
  followingDelta: string;
  posts: number;
  postsDelta: string;
  score: number;
  contactEmail?: string;
  contactInfo?: string;
  isPrivate?: boolean;
  isVerified?: boolean;
  provenanceBadge?: "Verified" | "Retrieved" | "Demo data";
  dataSource?: string;
}

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const DEFAULT_CREATOR: CreatorProfile = {
  handle: "zyrohouse",
  name: "Zyro House",
  avatar: `${BASE_PATH}/avatars/zyrohouse.png`,
  bioLines: [
    "Digital Strategy • Creative Storytelling • Community Growth",
    "Connecting with 165,020 engaged followers ✨",
  ],
  linkUrl: "https://zyrohouse.bio.link",
  trackedSince: "Tracked since Jan, 10 2022 • Baseline reference dataset",
  trackedSinceDate: "2022-01-10",
  lastFetchedAt: null,
  followers: 68,
  followersDelta: "+1 (+0.50%)",
  following: 1,
  followingDelta: "+0 (+0.0%)",
  posts: 1,
  postsDelta: "+0 (+0.0%)",
  score: 91.2,
  contactInfo: "No public email listed • Direct Message (DM) on Instagram",
  isPrivate: false,
  isVerified: false,
  provenanceBadge: "Demo data",
  dataSource: "Benchmark Baseline Dataset",
};

interface InsTrackCreatorCardProps {
  activeTab: SubNavTab;
  onTabChange: (tab: SubNavTab) => void;
  onExportClick?: () => void;
  score?: number;
  creator?: CreatorProfile;
  onDateRangeChange?: (range: string) => void;
  onToggleStar?: (starred: boolean) => void;
  isStarred?: boolean;
}

export function InsTrackCreatorCard({
  activeTab,
  onTabChange,
  onExportClick,
  score,
  creator = DEFAULT_CREATOR,
  onDateRangeChange,
  onToggleStar,
  isStarred: propIsStarred,
}: InsTrackCreatorCardProps) {
  const [isStarred, setIsStarred] = useState(propIsStarred ?? false);
  const [dateRange, setDateRange] = useState("Last 30 Days");
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [showMoreToolsDropdown, setShowMoreToolsDropdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSavingSnapshot, setIsSavingSnapshot] = useState(false);
  const [snapshotSaved, setSnapshotSaved] = useState(false);
  const [weeklyCrawlActive, setWeeklyCrawlActive] = useState(false);
  const moreToolsRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsStarred(propIsStarred ?? false);
    setWeeklyCrawlActive(isWeeklyCrawlEnabled(creator.handle));
    setSnapshotSaved(false);
  }, [propIsStarred, creator.handle]);

  // Handler to manually save snapshot
  const handleSaveSnapshot = async () => {
    setIsSavingSnapshot(true);
    try {
      const rawUser = typeof window !== "undefined" ? localStorage.getItem("sociotrack_user_session") : null;
      const userEmail = rawUser ? JSON.parse(rawUser)?.email : undefined;
      await saveProfileSnapshot(creator, userEmail, weeklyCrawlActive);
      setSnapshotSaved(true);
      setTimeout(() => setSnapshotSaved(false), 3000);
    } catch {
      // ignore
    } finally {
      setIsSavingSnapshot(false);
    }
  };

  // Handler to toggle weekly crawl automation
  const handleToggleWeeklyCrawl = async () => {
    const nextState = !weeklyCrawlActive;
    setWeeklyCrawlActive(nextState);
    const rawUser = typeof window !== "undefined" ? localStorage.getItem("sociotrack_user_session") : null;
    const userEmail = rawUser ? JSON.parse(rawUser)?.email : undefined;
    await toggleWeeklyCrawl(creator.handle, nextState, userEmail);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreToolsRef.current && !moreToolsRef.current.contains(e.target as Node)) {
        setShowMoreToolsDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayScore = score ?? creator.score;

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(`https://sociotrack.app/instagram/${creator.handle}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStarClick = () => {
    const nextState = !isStarred;
    setIsStarred(nextState);
    onToggleStar?.(nextState);
  };

  const handleSelectDateRange = (opt: string) => {
    setDateRange(opt);
    setShowDateDropdown(false);
    onDateRangeChange?.(opt);
  };

  return (
    <div className="w-full bg-white dark:bg-[#161F30] rounded-2xl border border-slate-200 dark:border-[#243048] p-6 shadow-sm transition-colors">
      {/* Top Profile Header */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 pb-6 border-b border-slate-100 dark:border-[#243048]">
        {/* Creator Info */}
        <div className="flex items-start space-x-5">
          {/* Avatar with Vibrant Yellow Ring (Matching Screenshot 2) */}
          <div className="flex flex-col items-center shrink-0">
            <div className="w-20 h-20 rounded-full p-1 bg-[#FACC15] shadow-md">
              <img
                key={creator.handle + (creator.avatar || "")}
                src={creator.avatar}
                alt={creator.handle}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
                  const apiBase = process.env.NEXT_PUBLIC_API_URL || (isHttps ? "https://sociotrack-api.onrender.com" : "http://localhost:8000");
                  const clean = creator.handle.replace(/^@/, "").toLowerCase().trim();
                  const proxyUrl = `${apiBase}/api/creators/${encodeURIComponent(clean)}/avatar`;

                  if (target.src !== proxyUrl && !target.dataset.triedProxy) {
                    target.dataset.triedProxy = "1";
                    target.src = proxyUrl;
                    return;
                  }
                  if (!target.dataset.triedUnavatar) {
                    target.dataset.triedUnavatar = "1";
                    target.src = `https://unavatar.io/x/${encodeURIComponent(clean)}?fallback=https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(clean)}`;
                    return;
                  }
                  if (!target.dataset.triedDicebear) {
                    target.dataset.triedDicebear = "1";
                    target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(clean)}&backgroundColor=4f46e5,06b6d4,10b981&textColor=ffffff`;
                  }
                }}
                className="w-full h-full rounded-full object-cover bg-slate-900 border-2 border-white dark:border-[#161F30]"
              />
            </div>
            {/* Quick Action Icons below avatar: Orange Star + Instagram logo */}
            <div className="flex items-center space-x-2 mt-2">
              <button
                onClick={handleStarClick}
                className={`p-1 rounded-md transition-colors ${
                  isStarred
                    ? "text-[#F59E0B]"
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                }`}
                title={isStarred ? "Bookmarked account (Click to remove)" : "Bookmark account"}
              >
                <Star className={`w-4 h-4 ${isStarred ? "fill-current" : ""}`} />
              </button>
              <a
                href={`https://instagram.com/${creator.handle}`}
                target="_blank"
                rel="noreferrer"
                className="p-1 rounded-md text-[#E1306C] hover:opacity-80 transition-opacity"
                title={`View @${creator.handle} on Instagram`}
              >
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                {creator.handle}
              </h2>
              {creator.isPrivate ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <Lock className="w-3 h-3 text-amber-500" />
                  <span>Private Account</span>
                </span>
              ) : creator.isVerified !== false ? (
                <>
                  <span
                    className="inline-flex items-center text-[#0095F6] cursor-help"
                    title="Verified Account (Meta Verified)"
                    aria-label="Verified Account"
                  >
                    <svg
                      className="w-[18px] h-[18px] shrink-0"
                      viewBox="0 0 40 40"
                      fill="none"
                    >
                      <path
                        d="M19.998 3.333c-1.353 0-2.613.52-3.57 1.455l-2.09 2.046a2.667 2.667 0 0 1-1.873.776H9.539c-2.032 0-3.684 1.652-3.684 3.684v2.926c0 .707-.281 1.385-.776 1.873l-2.046 2.09a5.056 5.056 0 0 0-1.455 3.57c0 1.353.52 2.613 1.455 3.57l2.046 2.09c.495.488.776 1.166.776 1.873v2.926c0 2.032 1.652 3.684 3.684 3.684h2.926c.707 0 1.385.281 1.873.776l2.09 2.046c.957.935 2.217 1.455 3.57 1.455 1.353 0 2.613-.52 3.57-1.455l2.09-2.046c.488-.495 1.166-.776 1.873-.776h2.926c2.032 0 3.684-1.652 3.684-3.684v-2.926c0-.707.281-1.385.776-1.873l2.046-2.09c.935-.957 1.455-2.217 1.455-3.57 0-1.353-.52-2.613-1.455-3.57l-2.046-2.09a2.667 2.667 0 0 1-.776-1.873v-2.926c0-2.032-1.652-3.684-3.684-3.684h-2.926a2.667 2.667 0 0 1-1.873-.776l-2.09-2.046a5.056 5.056 0 0 0-3.57-1.455z"
                        fill="#0095F6"
                      />
                      <path
                        d="M17.447 26.667l-6.114-6.114 2.357-2.357 3.757 3.757 8.424-8.424 2.357 2.357-10.781 10.781z"
                        fill="#FFFFFF"
                      />
                    </svg>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#0095F6] border border-blue-200/50 dark:border-blue-800/40">
                    Official Account
                  </span>
                </>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  Creator Profile
                </span>
              )}

              {/* Data Provenance Badge */}
              {creator.provenanceBadge === "Verified" ? (
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 cursor-help"
                  title="Verified: Direct observed API response from Meta Graph API Business Discovery"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  <span>Verified API</span>
                </span>
              ) : creator.provenanceBadge === "Retrieved" ? (
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800/60 cursor-help"
                  title="Retrieved: Real-time telemetry fetched via external crawler endpoint"
                >
                  <Sparkles className="w-3 h-3 text-cyan-500" />
                  <span>Retrieved</span>
                </span>
              ) : (
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 cursor-help"
                  title="Demo data: Curated benchmark baseline dataset for interactive exploration"
                >
                  <Info className="w-3 h-3 text-amber-500" />
                  <span>Demo data</span>
                </span>
              )}
            </div>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              {creator.name}
            </p>
            <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-1 space-y-0.5">
              {creator.bioLines
                .filter((line) => {
                  if (!line) return false;
                  const cleanLine = line.trim().toLowerCase().replace(/[\s\uFE0F\uD83C-\uDBFF\uDC00-\uDFFF]/g, "");
                  const cleanName = (creator.name || "").trim().toLowerCase().replace(/[\s\uFE0F\uD83C-\uDBFF\uDC00-\uDFFF]/g, "");
                  if (cleanLine === cleanName) return false;
                  const handleNoAt = creator.handle.replace(/^@/, "").toLowerCase();
                  if (cleanName && cleanLine.includes(cleanName) && cleanLine.includes(handleNoAt)) return false;
                  return true;
                })
                .map((line, idx) => (
                <p key={idx}>
                  {line
                    .split(
                      /([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+|https?:\/\/[^\s]+|@[a-zA-Z0-9_\.]+|#[a-zA-Z0-9_]+)/g
                    )
                    .map((part, pIdx) => {
                      if (!part) return null;
                      // 1. Check if token is a full email address (e.g. tomihika.mgmt@gmail.com)
                      if (
                        /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/.test(
                          part
                        )
                      ) {
                        return (
                          <a
                            key={pIdx}
                            href={`mailto:${part}`}
                            className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline inline-flex items-center gap-0.5 transition-colors"
                            title={`Send email to ${part}`}
                          >
                            <span>{part}</span>
                          </a>
                        );
                      }
                      // 2. Check if token is a URL
                      if (/^https?:\/\//.test(part)) {
                        return (
                          <a
                            key={pIdx}
                            href={part}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
                          >
                            {part}
                          </a>
                        );
                      }
                      // 3. Check if token is an Instagram @mention
                      if (part.startsWith("@")) {
                        return (
                          <a
                            key={pIdx}
                            href={`https://instagram.com/${part.replace("@", "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                          >
                            {part}
                          </a>
                        );
                      }
                      // 4. Check if token is a hashtag
                      if (part.startsWith("#")) {
                        return (
                          <span
                            key={pIdx}
                            className="text-indigo-500 dark:text-indigo-400 font-medium"
                          >
                            {part}
                          </span>
                        );
                      }
                      return part;
                    })}
                </p>
              ))}
            </div>
            <div className="pt-2 text-[11px] space-y-1">
              <div>
                <a
                  href={creator.linkUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                >
                  {creator.linkUrl}
                </a>
              </div>

              {/* Explicit Clickable Contact Row */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-slate-600 dark:text-slate-400">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  Contact:
                </span>
                {creator.contactEmail ? (
                  <a
                    href={`mailto:${creator.contactEmail}`}
                    className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline hover:text-indigo-700 dark:hover:text-indigo-300 inline-flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded border border-indigo-200/60 dark:border-indigo-800/40 transition-colors"
                    title={`Send email to ${creator.contactEmail}`}
                  >
                    <span>{creator.contactEmail}</span>
                  </a>
                ) : creator.contactInfo ? (
                  <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                    <span>{creator.contactInfo}</span>
                    <a
                      href={`https://ig.me/m/${creator.handle}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline inline-flex items-center gap-0.5 ml-1"
                      title={`Send Direct Message on Instagram to @${creator.handle}`}
                    >
                      <span>Send DM →</span>
                    </a>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                    <span>No public email listed •</span>
                    <a
                      href={`https://ig.me/m/${creator.handle}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline inline-flex items-center gap-0.5"
                      title={`Send Direct Message on Instagram to @${creator.handle}`}
                    >
                      <span>Send Instagram DM →</span>
                    </a>
                  </span>
                )}
              </div>

              <div className="text-slate-400 dark:text-slate-500 pt-0.5" suppressHydrationWarning>
                {creator.trackedSinceDate || creator.trackedSince ? (
                  <span>
                    Tracked since {formatDateOnly(creator.trackedSinceDate || creator.trackedSince)}.
                    {creator.lastFetchFailed ? (
                      <span className="text-amber-500 font-medium ml-1">
                        • Update failed — cached from {formatRelativeTime(creator.lastFetchedAt)}
                      </span>
                    ) : creator.lastFetchedAt ? (
                      <span className="ml-1">
                        • Updated {formatRelativeTime(creator.lastFetchedAt)} via Meta Graph API.
                      </span>
                    ) : (
                      <span className="ml-1 text-slate-400">
                        • Freshness unavailable.
                      </span>
                    )}
                  </span>
                ) : (
                  "Telemetry freshness unavailable."
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Top Metric Counters & Rainbow InsTrack Score (Matching Screenshot 2) */}
        <div className="flex flex-col items-start lg:items-end justify-between space-y-5">
          {/* Numbers Row with Instagram notation and exact counters */}
          <div className="flex items-center space-x-6 sm:space-x-8">
            <div className="text-left lg:text-right">
              <span className="text-[11px] text-slate-400 font-medium">Followers</span>
              <div
                className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white"
                title={`${creator.followers.toLocaleString()} total followers`}
              >
                {creator.followers >= 1_000_000
                  ? `${parseFloat((creator.followers / 1_000_000).toFixed(1))}M`
                  : creator.followers >= 10_000
                  ? `${parseFloat((creator.followers / 1_000).toFixed(1))}K`
                  : creator.followers.toLocaleString()}
              </div>
              <span className="text-[11px] font-bold text-[#10B981]">
                {creator.followersDelta}
              </span>
            </div>

            <div className="text-left lg:text-right">
              <span className="text-[11px] text-slate-400 font-medium">Following</span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {creator.following.toLocaleString()}
              </div>
              <span className="text-[11px] font-bold text-[#10B981]">
                {creator.followingDelta}
              </span>
            </div>

            <div className="text-left lg:text-right">
              <span className="text-[11px] text-slate-400 font-medium">Posts</span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {creator.posts.toLocaleString()}
              </div>
              <span className="text-[11px] font-bold text-[#10B981]">
                {creator.postsDelta}
              </span>
            </div>
          </div>

          {/* Rainbow Score Bar with Floating Pill Pointer (Matching Screenshot 2) */}
          <div className="w-full sm:w-80 space-y-1.5">
            {/* The Floating Purple Pill Tooltip positioned at score */}
            <div className="relative h-6">
              <div
                className="absolute transform -translate-x-1/2 flex flex-col items-center transition-all duration-500"
                style={{ left: `${displayScore}%` }}
              >
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#6366F1] text-white shadow-sm">
                  {displayScore}%
                </span>
                <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[4px] border-t-[#6366F1]" />
              </div>
            </div>

            {/* The Gradient Rainbow Bar from InsTrack */}
            <div className="relative w-full h-1.5 rounded-full overflow-hidden rainbow-score-bar shadow-inner" />

            {/* Sub-label: SocioTrack Score */}
            <div className="flex items-center justify-center space-x-1 text-[11px] text-slate-400 dark:text-slate-500 pt-0.5">
              <Info className="w-3 h-3 text-slate-400" />
              <span>SocioTrack Score</span>
            </div>
          </div>

          {/* Action Row: Save Snapshot, Weekly Crawl Toggle, Link, Export, Date Range Dropdown */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {/* Save Snapshot Button */}
            <button
              onClick={handleSaveSnapshot}
              disabled={isSavingSnapshot}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-all ${
                snapshotSaved
                  ? "bg-emerald-500 text-white"
                  : "bg-indigo-50 dark:bg-indigo-950/60 text-[#6366F1] dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200/60 dark:border-indigo-800/60"
              }`}
              title="Save current demographics and analytics snapshot to Supabase"
            >
              {snapshotSaved ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Snapshot Saved</span>
                </>
              ) : isSavingSnapshot ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Save Snapshot</span>
                </>
              )}
            </button>

            {/* Weekly Crawl Toggle Button */}
            <button
              onClick={handleToggleWeeklyCrawl}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                weeklyCrawlActive
                  ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700"
                  : "border-slate-200 dark:border-[#243048] hover:bg-slate-50 dark:hover:bg-[#1E2638] text-slate-600 dark:text-slate-300"
              }`}
              title={
                weeklyCrawlActive
                  ? "Weekly automatic crawl is active for @${creator.handle}"
                  : "Enable weekly automatic crawl for @${creator.handle}"
              }
            >
              <Clock className={`w-3.5 h-3.5 ${weeklyCrawlActive ? "text-emerald-500 animate-pulse" : "text-slate-400"}`} />
              <span>{weeklyCrawlActive ? "Weekly Crawl Active" : "Auto-Crawl Weekly"}</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="p-2 rounded-lg border border-slate-200 dark:border-[#243048] hover:bg-slate-50 dark:hover:bg-[#1E2638] text-slate-600 dark:text-slate-300 transition-colors"
              title="Copy link"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <LinkIcon className="w-4 h-4" />}
            </button>
            <button
              onClick={onExportClick}
              className="p-2 rounded-lg border border-slate-200 dark:border-[#243048] hover:bg-slate-50 dark:hover:bg-[#1E2638] text-slate-600 dark:text-slate-300 transition-colors"
              title="Export Report"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Date Range Selector Button: Purple/Indigo Pill */}
            <div className="relative">
              <button
                onClick={() => setShowDateDropdown(!showDateDropdown)}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[#6366F1] hover:bg-[#5558E6] text-white text-xs font-semibold shadow-sm transition-colors"
              >
                <span>{dateRange}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {showDateDropdown && (
                <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-[#1E2638] border border-slate-200 dark:border-[#243048] rounded-xl shadow-xl py-1 z-30 text-xs animate-scale-up">
                  {["Today", "This Week", "Last 7 Days", "Last 30 Days", "Last 90 Days", "All Time"].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handleSelectDateRange(opt)}
                      className={`w-full text-left px-3 py-2 transition-colors ${
                        dateRange === opt
                          ? "bg-indigo-50 dark:bg-indigo-950/50 text-[#6366F1] font-bold"
                          : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Streamlined Dashboard Navigation (Primary 6 Tabs + More Tools Menu) */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-[#243048] flex-wrap gap-2">
        {/* Left: 6 Primary Navigation Tabs */}
        <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto text-xs font-semibold py-1">
          {[
            { key: "overview", label: "Overview" },
            { key: "growth", label: "Growth" },
            { key: "audience", label: "Audience" },
            { key: "engagement", label: "Engagement" },
            { key: "content", label: "Content" },
            { key: "historical", label: "History" },
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => onTabChange(tab.key as SubNavTab)}
                className={`px-3.5 sm:px-4 py-2 rounded-xl transition-all shrink-0 flex items-center space-x-1.5 ${
                  isActive
                    ? "bg-[#6366F1] text-white font-bold shadow-xs shadow-indigo-500/20"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1E2638]"
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right: More Tools Dropdown */}
        <div className="relative" ref={moreToolsRef}>
          {(() => {
            const secondaryTools = [
              { key: "aistudio", label: "AI Studio (Posts)", badge: "GenAI" },
              { key: "memorybank", label: "Memory Bank", badge: "Vector" },
              { key: "experiments", label: "A/B Experiments", badge: null },
              { key: "calendar", label: "Mix Planner", badge: null },
              { key: "audit", label: "Diagnostic Audit", badge: null },
              { key: "unfollowers", label: "Who Unfollowed Me", badge: "Radar" },
              { key: "ask_ai", label: "Ask SocioTrack", badge: "AI" },
              { key: "competitors", label: "Competitor Intel", badge: null },
              { key: "approval", label: "Approval Queue", badge: null },
              { key: "reports", label: "Executive Reports", badge: null },
              { key: "billing", label: "Plans & Billing", badge: null },
              { key: "saas_metrics", label: "SaaS Business Metrics", badge: "Live" },
            ];

            const activeSecondary = secondaryTools.find((t) => t.key === activeTab);

            return (
              <>
                <button
                  type="button"
                  onClick={() => setShowMoreToolsDropdown(!showMoreToolsDropdown)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all border ${
                    activeSecondary
                      ? "bg-indigo-50 dark:bg-indigo-950/70 border-indigo-300 dark:border-indigo-700 text-[#6366F1] dark:text-indigo-300 shadow-xs"
                      : "bg-slate-50 dark:bg-[#1E2638] border-slate-200/90 dark:border-[#243048] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#253046]"
                  }`}
                  aria-expanded={showMoreToolsDropdown}
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#6366F1]" />
                  <span>
                    {activeSecondary ? `Tool: ${activeSecondary.label}` : "More Tools"}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      showMoreToolsDropdown ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {showMoreToolsDropdown && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#161F30] border border-slate-200 dark:border-[#243048] rounded-2xl shadow-xl p-2 z-50 text-xs animate-scale-up space-y-1">
                    <div className="px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-[#243048]">
                      Advanced Workspaces &amp; Engines
                    </div>
                    <div className="max-h-72 overflow-y-auto py-1 space-y-0.5">
                      {secondaryTools.map((tool) => {
                        const isToolActive = activeTab === tool.key;
                        return (
                          <button
                            key={tool.key}
                            type="button"
                            onClick={() => {
                              onTabChange(tool.key as SubNavTab);
                              setShowMoreToolsDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between transition-colors ${
                              isToolActive
                                ? "bg-indigo-50 dark:bg-indigo-950/60 text-[#6366F1] dark:text-indigo-300 font-bold"
                                : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1E2638]"
                            }`}
                          >
                            <span>{tool.label}</span>
                            {tool.badge && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-mono">
                                {tool.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
