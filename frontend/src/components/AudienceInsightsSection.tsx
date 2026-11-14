"use client";

import React, { useState } from "react";
import {
  Users,
  Clock,
  Globe2,
  Activity,
  Sparkles,
  MapPin,
  TrendingUp,
  Bookmark,
  MessageCircle,
  Eye,
} from "lucide-react";
import { CreatorProfile } from "./InsTrackCreatorCard";

interface AudienceInsightsSectionProps {
  creator: CreatorProfile;
}

export function AudienceInsightsSection({ creator }: AudienceInsightsSectionProps) {
  const [activeGeoTab, setActiveGeoTab] = useState<"countries" | "cities">("countries");

  // Top Countries & Cities Data
  const topCountries = [
    { name: "United States", pct: 38, flag: "🇺🇸" },
    { name: "India", pct: 24, flag: "🇮🇳" },
    { name: "United Kingdom", pct: 14, flag: "🇬🇧" },
    { name: "Germany", pct: 9, flag: "🇩🇪" },
    { name: "Canada", pct: 7, flag: "🇨🇦" },
  ];

  const topCities = [
    { name: "New York, USA", pct: 14, flag: "🗽" },
    { name: "Bangalore, IN", pct: 11, flag: "🇮🇳" },
    { name: "London, UK", pct: 9, flag: "🇬🇧" },
    { name: "San Francisco, USA", pct: 7, flag: "🌉" },
    { name: "Toronto, CA", pct: 5, flag: "🍁" },
  ];

  // Age Demographics
  const ageGroups = [
    { range: "25–34", pct: 48, label: "Primary demographic (Designers & Engineers)" },
    { range: "18–24", pct: 28, label: "Emerging creators & students" },
    { range: "35–44", pct: 16, label: "Founders & Team Leads" },
    { range: "45+", pct: 8, label: "Executive & Director tier" },
  ];

  // Active Follower Times (7-day x 4 time blocks)
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const times = ["06-09", "09-12", "12-17", "17-22"];

  // Heatmap intensity: 0=low, 1=moderate, 2=high, 3=peak
  const scheduleMatrix = [
    [1, 2, 2, 1], // Mon
    [2, 3, 3, 2], // Tue (Peak)
    [1, 2, 2, 2], // Wed
    [2, 3, 3, 1], // Thu (Peak)
    [1, 2, 1, 1], // Fri
    [0, 1, 1, 0], // Sat
    [1, 1, 2, 1], // Sun
  ];

  return (
    <section aria-label="Audience Insights" className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
            <span>Audience Insights &amp; Demographics</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Demographic distribution, peak active windows, and geographic concentration for @{creator.handle}
          </p>
        </div>
        <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/50 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 w-fit">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>Meta Audience Telemetry</span>
        </div>
      </div>

      {/* 4 Clean Visual Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Demographics (Gender & Age) */}
        <div className="bg-white dark:bg-[#161F30] rounded-2xl border border-slate-200/90 dark:border-[#243048] p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-[#6366F1] flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-900 dark:text-white">Demographics</span>
            </div>
            <span className="text-[10px] font-bold text-slate-400">Gender &amp; Age</span>
          </div>

          {/* Gender Ratio Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              <span className="text-indigo-600 dark:text-indigo-400">58% Female</span>
              <span className="text-cyan-600 dark:text-cyan-400">39% Male</span>
              <span className="text-slate-400">3% Other</span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800">
              <div className="bg-[#6366F1] h-full" style={{ width: "58%" }} />
              <div className="bg-[#06B6D4] h-full" style={{ width: "39%" }} />
              <div className="bg-slate-300 dark:bg-slate-700 h-full" style={{ width: "3%" }} />
            </div>
          </div>

          {/* Age Distribution Progress */}
          <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
            {ageGroups.map((ag) => (
              <div key={ag.range} className="space-y-1">
                <div className="flex justify-between text-[11px] font-medium text-slate-700 dark:text-slate-300">
                  <span className="font-bold">{ag.range}</span>
                  <span className="font-mono text-slate-500">{ag.pct}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] h-full rounded-full transition-all duration-500"
                    style={{ width: `${ag.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 2: Active Follower Times (Heatmap) */}
        <div className="bg-white dark:bg-[#161F30] rounded-2xl border border-slate-200/90 dark:border-[#243048] p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-900 dark:text-white">Active Times</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">
              Peak: Tue &amp; Thu
            </span>
          </div>

          {/* Weekly Heatmap Grid */}
          <div className="space-y-1.5 pt-1">
            <div className="grid grid-cols-5 text-[10px] text-slate-400 font-mono text-center">
              <span>Day</span>
              {times.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>

            {days.map((day, dIdx) => (
              <div key={day} className="grid grid-cols-5 gap-1 items-center">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 text-center">
                  {day}
                </span>
                {scheduleMatrix[dIdx].map((lvl, tIdx) => (
                  <div
                    key={tIdx}
                    className={`h-4 rounded transition-all ${
                      lvl === 3
                        ? "bg-emerald-500 shadow-xs ring-1 ring-emerald-400"
                        : lvl === 2
                        ? "bg-indigo-500/80"
                        : lvl === 1
                        ? "bg-indigo-200/60 dark:bg-indigo-950/80"
                        : "bg-slate-100 dark:bg-slate-800"
                    }`}
                    title={`${day} slot ${times[tIdx]}: ${lvl === 3 ? "Peak window" : lvl === 2 ? "High traffic" : "Standard"}`}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Heatmap Legend & Insight */}
          <div className="text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-2">
            <span className="font-bold text-slate-700 dark:text-slate-200">Peak Window:</span>{" "}
            14:00 – 16:30 UTC produces +42% comment responses.
          </div>
        </div>

        {/* Card 3: Audience Location (Top Countries / Cities) */}
        <div className="bg-white dark:bg-[#161F30] rounded-2xl border border-slate-200/90 dark:border-[#243048] p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 flex items-center justify-center">
                <Globe2 className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-900 dark:text-white">Locations</span>
            </div>
            {/* Country / City Selector */}
            <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 text-[10px] font-bold">
              <button
                onClick={() => setActiveGeoTab("countries")}
                className={`px-2 py-0.5 rounded transition-all ${
                  activeGeoTab === "countries"
                    ? "bg-white dark:bg-[#161F30] text-indigo-600 shadow-xs"
                    : "text-slate-500"
                }`}
              >
                Countries
              </button>
              <button
                onClick={() => setActiveGeoTab("cities")}
                className={`px-2 py-0.5 rounded transition-all ${
                  activeGeoTab === "cities"
                    ? "bg-white dark:bg-[#161F30] text-indigo-600 shadow-xs"
                    : "text-slate-500"
                }`}
              >
                Cities
              </button>
            </div>
          </div>

          {/* Geographic Bars List */}
          <div className="space-y-2 pt-1">
            {(activeGeoTab === "countries" ? topCountries : topCities).map((geo) => (
              <div key={geo.name} className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-medium text-slate-700 dark:text-slate-300">
                  <span className="flex items-center space-x-1.5">
                    <span>{geo.flag}</span>
                    <span className="truncate max-w-[120px]">{geo.name}</span>
                  </span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {geo.pct}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${geo.pct * 2}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-2 flex items-center space-x-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">Top Tier-1 tech hubs lead retention</span>
          </div>
        </div>

        {/* Card 4: Follower Activity Breakdown */}
        <div className="bg-white dark:bg-[#161F30] rounded-2xl border border-slate-200/90 dark:border-[#243048] p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-[#8B5CF6] flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-900 dark:text-white">Activity Depth</span>
            </div>
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-full">
              High Intent
            </span>
          </div>

          <div className="space-y-2.5 pt-1 text-xs">
            {/* Segment 1: Bookmarkers */}
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bookmark className="w-3.5 h-3.5 text-[#6366F1]" />
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                    Content Savers
                  </div>
                  <div className="text-[10px] text-slate-400">Save carousels as bookmarks</div>
                </div>
              </div>
              <span className="font-black text-indigo-600 text-xs">34%</span>
            </div>

            {/* Segment 2: Commenters */}
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                    Super Discussers
                  </div>
                  <div className="text-[10px] text-slate-400">Reply to technical trade-offs</div>
                </div>
              </div>
              <span className="font-black text-emerald-600 text-xs">18%</span>
            </div>

            {/* Segment 3: Scrollers */}
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                    Reels Scrollers
                  </div>
                  <div className="text-[10px] text-slate-400">Passive short-form reach</div>
                </div>
              </div>
              <span className="font-black text-slate-600 dark:text-slate-300 text-xs">42%</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-2 flex items-center justify-between">
            <span>Low Engagement (Churn Risk):</span>
            <span className="font-bold text-rose-500">6%</span>
          </div>
        </div>
      </div>
    </section>
  );
}
