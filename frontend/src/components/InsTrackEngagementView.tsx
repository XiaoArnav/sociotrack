"use client";

import React, { useState } from "react";
import {
  Film,
  Layers,
  Image as ImageIcon,
  Clock,
  Flame,
  TrendingUp,
  BarChart3,
  Bookmark,
  Share2,
  MessageCircle,
  Heart,
  Calendar,
  Sparkles,
} from "lucide-react";
import { CreatorProfile } from "./InsTrackCreatorCard";

interface InsTrackEngagementViewProps {
  creator: CreatorProfile;
}

export function InsTrackEngagementView({ creator }: InsTrackEngagementViewProps) {
  const [selectedFormat, setSelectedFormat] = useState<"all" | "reels" | "carousels" | "images">("all");
  const [hoveredCell, setHoveredCell] = useState<{ day: string; time: string; intensity: number } | null>(null);

  // Format Breakdown Metrics
  const FORMATS = [
    {
      id: "carousels",
      name: "Carousels",
      icon: Layers,
      er: "3.82%",
      erDelta: "+1.40%",
      avgLikes: 1420,
      avgComments: 136,
      avgSaves: 580,
      postsCount: 142,
      recommendation: "Top performing format. Generates 4.2x higher bookmarks.",
    },
    {
      id: "reels",
      name: "Reels / Video",
      icon: Film,
      er: "4.15%",
      erDelta: "+1.73%",
      avgLikes: 2150,
      avgComments: 94,
      avgSaves: 320,
      postsCount: 98,
      recommendation: "High top-of-funnel reach. Retention drops off after 4.2s.",
    },
    {
      id: "images",
      name: "Single Photos",
      icon: ImageIcon,
      er: "1.08%",
      erDelta: "-1.34%",
      avgLikes: 680,
      avgComments: 28,
      avgSaves: 45,
      postsCount: 113,
      recommendation: "Throttled by Instagram 2026 algorithm. Repackage into carousels.",
    },
  ];

  // 7 Days x 4 Time slots Heatmap
  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const TIMES = ["06:00 - 09:00", "09:00 - 12:00", "12:00 - 17:00", "17:00 - 22:00"];

  // Heatmap intensity grid (0 = low, 1 = medium, 2 = high, 3 = peak)
  const HEATMAP: number[][] = [
    [2, 3, 2, 1], // Mon
    [3, 3, 2, 2], // Tue (Peak Day)
    [2, 3, 3, 2], // Wed
    [3, 3, 2, 1], // Thu (Peak Day)
    [2, 2, 1, 1], // Fri
    [1, 1, 1, 0], // Sat (Low)
    [1, 2, 2, 1], // Sun
  ];

  const getHeatmapColor = (intensity: number) => {
    switch (intensity) {
      case 3:
        return "bg-emerald-500 text-white font-bold";
      case 2:
        return "bg-indigo-500/80 text-white";
      case 1:
        return "bg-indigo-300/40 dark:bg-indigo-900/40 text-slate-700 dark:text-slate-300";
      default:
        return "bg-slate-100 dark:bg-[#1E2638] text-slate-400";
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Format Breakdown Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 text-indigo-500" />
            <span>Engagement Rate by Post Format</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            Analyzed over last 90 days
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {FORMATS.map((fmt) => {
            const Icon = fmt.icon;
            const isSelected = selectedFormat === fmt.id;
            return (
              <div
                key={fmt.id}
                onClick={() => setSelectedFormat(isSelected ? "all" : (fmt.id as any))}
                className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-indigo-50/50 dark:bg-[#1E2638] border-indigo-500 ring-2 ring-indigo-500/20 shadow-md"
                    : "bg-white dark:bg-[#161F30] border-slate-200 dark:border-[#243048] hover:border-indigo-400"
                }`}
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#243048]">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {fmt.name}
                      </h4>
                      <span className="text-[10px] text-slate-400">
                        {fmt.postsCount} posts
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-black text-slate-900 dark:text-white">
                      {fmt.er}
                    </span>
                    <div
                      className={`text-[10px] font-bold ${
                        fmt.erDelta.startsWith("+")
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-500"
                      }`}
                    >
                      {fmt.erDelta} vs avg
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-3 text-center text-xs">
                  <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-[#1E2638]">
                    <div className="text-[10px] text-slate-400">Avg Likes</div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">
                      {fmt.avgLikes}
                    </div>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-[#1E2638]">
                    <div className="text-[10px] text-slate-400">Avg Comments</div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">
                      {fmt.avgComments}
                    </div>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-[#1E2638]">
                    <div className="text-[10px] text-slate-400">Avg Saves</div>
                    <div className="font-bold text-indigo-600 dark:text-indigo-400">
                      {fmt.avgSaves}
                    </div>
                  </div>
                </div>

                <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed italic">
                  💡 {fmt.recommendation}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Peak Engagement Heatmap */}
      <div className="bg-white dark:bg-[#161F30] rounded-2xl border border-slate-200 dark:border-[#243048] p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-[#243048]">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Clock className="w-4 h-4 text-emerald-500" />
              <span>Audience Active Window &amp; Publishing Heatmap</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              When @{creator.handle}&apos;s followers are online and actively interacting.
            </p>
          </div>

          {/* Heatmap Legend */}
          <div className="flex items-center space-x-2 text-[10px] text-slate-400">
            <span>Low</span>
            <div className="flex space-x-1">
              <span className="w-3 h-3 rounded bg-slate-200 dark:bg-[#1E2638]" />
              <span className="w-3 h-3 rounded bg-indigo-300/60 dark:bg-indigo-900/40" />
              <span className="w-3 h-3 rounded bg-indigo-500/80" />
              <span className="w-3 h-3 rounded bg-emerald-500" />
            </div>
            <span>Peak</span>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="overflow-x-auto">
          <div className="min-w-[500px] space-y-2">
            <div className="grid grid-cols-5 text-[11px] font-semibold text-slate-400 text-center pb-1">
              <div className="text-left pl-2">Day</div>
              {TIMES.map((t) => (
                <div key={t}>{t}</div>
              ))}
            </div>

            {DAYS.map((day, dIdx) => (
              <div key={day} className="grid grid-cols-5 gap-2 items-center text-xs">
                <div className="font-bold text-slate-700 dark:text-slate-300 pl-2">
                  {day}
                </div>
                {HEATMAP[dIdx].map((intensity, tIdx) => {
                  const isPeak = intensity === 3;
                  return (
                    <div
                      key={tIdx}
                      onMouseEnter={() =>
                        setHoveredCell({
                          day,
                          time: TIMES[tIdx],
                          intensity,
                        })
                      }
                      onMouseLeave={() => setHoveredCell(null)}
                      className={`h-9 rounded-xl flex items-center justify-center text-[11px] transition-all cursor-pointer hover:scale-105 shadow-xs ${getHeatmapColor(
                        intensity
                      )}`}
                    >
                      {isPeak ? "🔥 Peak" : intensity === 2 ? "Active" : "Normal"}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {hoveredCell ? (
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-[#1E2638] text-xs text-indigo-700 dark:text-indigo-300 font-semibold animate-fade-in flex items-center space-x-2">
            <Sparkles className="w-4 h-4" />
            <span>
              {hoveredCell.day} at {hoveredCell.time} —{" "}
              {hoveredCell.intensity === 3
                ? "Peak engagement window! Recommend scheduling primary educational carousels here."
                : hoveredCell.intensity === 2
                ? "Above average engagement. Good slot for secondary updates or Reels."
                : "Lower engagement window. Avoid releasing key conversion hooks."}
            </span>
          </div>
        ) : (
          <div className="text-[11px] text-slate-400 text-center pt-2">
            💡 Hover over any cell to see audience availability and recommended post types.
          </div>
        )}
      </div>

      {/* 3. Viral Action Ratios */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#161F30] rounded-2xl border border-slate-200 dark:border-[#243048] p-5 shadow-sm space-y-2">
          <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400">
            <Bookmark className="w-4 h-4" />
            <span className="text-xs font-bold">Save-to-Like Ratio</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            1 : 3.8
          </div>
          <p className="text-[11px] text-slate-400">
            Optimal ratio is &gt; 1:5. Content demonstrates strong utilitarian reference value.
          </p>
        </div>

        <div className="bg-white dark:bg-[#161F30] rounded-2xl border border-slate-200 dark:border-[#243048] p-5 shadow-sm space-y-2">
          <div className="flex items-center space-x-2 text-sky-500">
            <Share2 className="w-4 h-4" />
            <span className="text-xs font-bold">DM Share Velocity</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            2.4x Niche Avg
          </div>
          <p className="text-[11px] text-slate-400">
            Posts are frequently forwarded into team channels and creative agency groups.
          </p>
        </div>

        <div className="bg-white dark:bg-[#161F30] rounded-2xl border border-slate-200 dark:border-[#243048] p-5 shadow-sm space-y-2">
          <div className="flex items-center space-x-2 text-emerald-500">
            <MessageCircle className="w-4 h-4" />
            <span className="text-xs font-bold">Comment Conversion</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            8.9%
          </div>
          <p className="text-[11px] text-slate-400">
            Open-ended questions in slides 4 &amp; 5 convert 8.9% of viewers into comment discussions.
          </p>
        </div>
      </div>
    </div>
  );
}
