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

interface InsTrackCreatorCardProps {
  activeTab: SubNavTab;
  onTabChange: (tab: SubNavTab) => void;
  onExportClick?: () => void;
  score?: number;
}

export function InsTrackCreatorCard({
  activeTab,
  onTabChange,
  onExportClick,
  score = 70.1,
}: InsTrackCreatorCardProps) {
  const [isStarred, setIsStarred] = useState(true);
  const [dateRange, setDateRange] = useState("Last 30 Days");
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard?.writeText("https://instrack.app/instagram/thestevenmellor");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80"
                alt="thestevenmellor"
                className="w-full h-full rounded-full object-cover bg-slate-900 border-2 border-white dark:border-[#161F30]"
              />
            </div>
            {/* Quick Action Icons below avatar: Orange Star + Instagram logo */}
            <div className="flex items-center space-x-2 mt-2">
              <button
                onClick={() => setIsStarred(!isStarred)}
                className={`p-1 rounded-md transition-colors ${
                  isStarred
                    ? "text-[#F59E0B]"
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                }`}
                title="Star account"
              >
                <Star className="w-4 h-4 fill-current" />
              </button>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="p-1 rounded-md text-[#E1306C] hover:opacity-80 transition-opacity"
                title="View on Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              thestevenmellor
            </h2>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Steve | Growth Marketing
            </p>
            <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-1 space-y-0.5">
              <p>I help you Grow and Launch your brand on Instagram</p>
              <p>👨‍💻 ex corporate 9-5 &gt; 🚀 6-figure creator</p>
              <p>👇 Join my &apos;Gram Accelerator Program ⏳</p>
            </div>
            <div className="pt-2 text-[11px] space-y-1">
              <div>
                <a
                  href="http://linktr.ee/thestevenmellor/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                >
                  http://linktr.ee/thestevenmellor/
                </a>
              </div>
              <div className="text-slate-400 dark:text-slate-500">
                Tracked since May, 01 2019. Updated 16 minutes ago.
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
                173,435
              </div>
              <span className="text-[11px] font-bold text-[#10B981]">
                +4,227 (2.5%)
              </span>
            </div>

            <div className="text-left lg:text-right">
              <span className="text-[11px] text-slate-400 font-medium">Following</span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                584
              </div>
              <span className="text-[11px] font-bold text-[#10B981]">
                +38 (7.0%)
              </span>
            </div>

            <div className="text-left lg:text-right">
              <span className="text-[11px] text-slate-400 font-medium">Posts</span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                353
              </div>
              <span className="text-[11px] font-bold text-[#10B981]">
                +16 (4.7%)
              </span>
            </div>
          </div>

          {/* Rainbow Score Bar with Floating Pill Pointer (Matching Screenshot 2) */}
          <div className="w-full sm:w-80 space-y-1.5">
            {/* The Floating Purple Pill Tooltip positioned at 70.1% */}
            <div className="relative h-6">
              <div
                className="absolute transform -translate-x-1/2 flex flex-col items-center"
                style={{ left: `${score}%` }}
              >
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#6366F1] text-white shadow-sm">
                  {score}%
                </span>
                <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[4px] border-t-[#6366F1]" />
              </div>
            </div>

            {/* The Gradient Rainbow Bar from InsTrack */}
            <div className="relative w-full h-1.5 rounded-full overflow-hidden rainbow-score-bar shadow-inner" />

            {/* Sub-label: InsTrack Score */}
            <div className="flex items-center justify-center space-x-1 text-[11px] text-slate-400 dark:text-slate-500 pt-0.5">
              <Info className="w-3 h-3 text-slate-400" />
              <span>InsTrack Score</span>
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
                <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-[#1E2638] border border-slate-200 dark:border-[#243048] rounded-xl shadow-xl py-1 z-30 text-xs">
                  {["Last 7 Days", "Last 30 Days", "Last 90 Days", "All Time"].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        setDateRange(opt);
                        setShowDateDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
