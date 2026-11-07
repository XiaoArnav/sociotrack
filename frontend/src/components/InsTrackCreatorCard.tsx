"use client";

import React, { useState } from "react";
import {
  Star,
  Instagram,
  Link as LinkIcon,
  Download,
  Calendar,
  ChevronDown,
  Check,
  Info,
  Sparkles,
} from "lucide-react";

export type SubNavTab =
  | "growth"
  | "overview"
  | "audit"
  | "engagement"
  | "historical"
  | "aistudio"
  | "memorybank";

export interface CreatorProfile {
  handle: string;
  name: string;
  avatar: string;
  bioLines: string[];
  linkUrl: string;
  trackedSince: string;
  followers: number;
  followersDelta: string;
  following: number;
  followingDelta: string;
  posts: number;
  postsDelta: string;
  score: number;
}

export const DEFAULT_CREATOR: CreatorProfile = {
  handle: "arnav.patel07",
  name: "Arnav Patel | AI Systems Architect",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
  bioLines: [
    "Building Autonomous AI Agent Systems & Persistent Vector Memory 🚀",
    "DevRelay Fellow • Open Source Contributor • Tech Innovator",
    "📍 Bangalore • Crafting high-throughput multi-agent architectures & real-time analytics",
  ],
  linkUrl: "https://github.com/XiaoArnav",
  trackedSince: "Tracked since Jan, 12 2023. Updated Just now via Meta Graph API.",
  followers: 34820,
  followersDelta: "+2,140 (6.55%)",
  following: 418,
  followingDelta: "+12 (2.95%)",
  posts: 84,
  postsDelta: "+4 (5.0%)",
  score: 88.4,
};

interface InsTrackCreatorCardProps {
  activeTab: SubNavTab;
  onTabChange: (tab: SubNavTab) => void;
  onExportClick?: () => void;
  score?: number;
  creator?: CreatorProfile;
  onDateRangeChange?: (range: string) => void;
  onToggleStar?: (starred: boolean) => void;
}

export function InsTrackCreatorCard({
  activeTab,
  onTabChange,
  onExportClick,
  score,
  creator = DEFAULT_CREATOR,
  onDateRangeChange,
  onToggleStar,
}: InsTrackCreatorCardProps) {
  const [isStarred, setIsStarred] = useState(true);
  const [dateRange, setDateRange] = useState("Last 30 Days");
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [copied, setCopied] = useState(false);

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
                src={creator.avatar}
                alt={creator.handle}
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
                title={isStarred ? "Starred account" : "Star account"}
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
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400">
                Verified Creator
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              {creator.name}
            </p>
            <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-1 space-y-0.5">
              {creator.bioLines.map((line, idx) => (
                <p key={idx}>{line}</p>
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
              <div className="text-slate-400 dark:text-slate-500">
                {creator.trackedSince}
              </div>
            </div>
          </div>
        </div>

        {/* Top Metric Counters & Rainbow InsTrack Score (Matching Screenshot 2) */}
        <div className="flex flex-col items-start lg:items-end justify-between space-y-5">
          {/* Numbers Row */}
          <div className="flex items-center space-x-6 sm:space-x-8">
            <div className="text-left lg:text-right">
              <span className="text-[11px] text-slate-400 font-medium">Followers</span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {creator.followers.toLocaleString()}
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

          {/* Action Row: Link, Export, Date Range Dropdown */}
          <div className="flex items-center space-x-2 pt-1">
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
                  {["Last 7 Days", "Last 30 Days", "Last 90 Days", "All Time"].map((opt) => (
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

      {/* InsTrack Segmented Sub-Navigation Bar (Matching Screenshot 2) */}
      <div className="flex items-center space-x-1 sm:space-x-3 pt-4 overflow-x-auto text-xs font-semibold">
        {[
          { key: "overview", label: "Overview" },
          { key: "audit", label: "Audit" },
          { key: "growth", label: "Growth" },
          { key: "engagement", label: "Engagement" },
          { key: "historical", label: "History" },
          { key: "aistudio", label: "Posts (AI Studio)" },
          { key: "memorybank", label: "Memory Bank" },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key as SubNavTab)}
              className={`px-4 py-2 rounded-xl transition-all shrink-0 ${
                isActive
                  ? "bg-slate-100 dark:bg-[#243048] text-slate-900 dark:text-white font-bold shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-[#1E2638]"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
