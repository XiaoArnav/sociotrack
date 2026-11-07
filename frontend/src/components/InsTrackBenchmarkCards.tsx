"use client";

import React from "react";
import {
  TrendingUp,
  BarChart2,
  Users,
  MessageSquare,
  Zap,
  Image as ImageIcon,
  Info,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

export function InsTrackBenchmarkCards() {
  return (
    <div className="space-y-6">
      {/* 1. Top Quick Metric Cards (Organized into 2 top cards + 3 bottom cards matching Screenshot 2 & 4) */}
      <div className="space-y-4">
        {/* Top Row: 2 Wide Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Growth Rate */}
          <div className="bg-white dark:bg-[#161F30] rounded-2xl border border-slate-200 dark:border-[#243048] p-6 shadow-sm relative group hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors">
            <div className="flex items-center justify-between text-slate-400">
              <span title="Calculated over trailing 90 days" className="cursor-help">
                <Info className="w-4 h-4" />
              </span>
              <div className="w-8 h-8 rounded-full bg-[#EDE9FE] dark:bg-[#312E81]/60 text-[#7C3AED] dark:text-[#A78BFA] flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 text-center">
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
                3.80%
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                Followers Growth Rate (90 Days)
              </div>
            </div>
          </div>

          {/* Card 2: Steady Growth Factor */}
          <div className="bg-white dark:bg-[#161F30] rounded-2xl border border-slate-200 dark:border-[#243048] p-6 shadow-sm relative group hover:border-emerald-400 dark:hover:border-emerald-500 transition-colors">
            <div className="flex items-center justify-between text-slate-400">
              <span title="Consistency factor based on net positive daily growth" className="cursor-help">
                <Info className="w-4 h-4" />
              </span>
              <div className="w-8 h-8 rounded-full bg-[#D1FAE5] dark:bg-[#064E3B]/60 text-[#059669] dark:text-[#34D399] flex items-center justify-center">
                <BarChart2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 text-center">
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
                88.37%
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                Steady Growth Factor
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row: 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 3: Daily Followers */}
          <div className="bg-white dark:bg-[#161F30] rounded-2xl border border-slate-200 dark:border-[#243048] p-6 shadow-sm relative hover:border-amber-400 transition-colors text-center">
            <div className="w-8 h-8 mx-auto rounded-full bg-[#FEF3C7] dark:bg-[#78350F]/50 text-[#D97706] dark:text-[#FBBF24] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white">
              279
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Daily Followers
            </div>
          </div>

          {/* Card 4: Weekly Followers */}
          <div className="bg-white dark:bg-[#161F30] rounded-2xl border border-slate-200 dark:border-[#243048] p-6 shadow-sm relative hover:border-rose-400 transition-colors text-center">
            <div className="w-8 h-8 mx-auto rounded-full bg-[#FCE7F3] dark:bg-[#831843]/50 text-[#DB2777] dark:text-[#F472B6] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white">
              1,954
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Weekly Followers
            </div>
          </div>

          {/* Card 5: Monthly Followers */}
          <div className="bg-white dark:bg-[#161F30] rounded-2xl border border-slate-200 dark:border-[#243048] p-6 shadow-sm relative hover:border-sky-400 transition-colors text-center">
            <div className="w-8 h-8 mx-auto rounded-full bg-[#E0F2FE] dark:bg-[#0C4A6E]/50 text-[#0284C7] dark:text-[#38BDF8] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white">
              8,491
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Monthly Followers
            </div>
          </div>
        </div>
      </div>

      {/* 2. Benchmark Performance Section (Matching Screenshot 6) */}
      <div className="space-y-4 pt-4">
        <div className="text-center max-w-2xl mx-auto space-y-1">
          <h2 className="text-2xl font-black bg-gradient-to-r from-indigo-500 via-sky-400 to-cyan-400 bg-clip-text text-transparent">
            Benchmark Performance
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Audit the performance of any Instagram account by comparing it to{" "}
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              thousands of similar accounts
            </span>{" "}
            using different KPIs: Followers growth rate, engagement rate, posts, likes, comments and much more.
          </p>
        </div>

        {/* 3 Letter Grade Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* Card A: Average Comments (Grade A) */}
          <div className="bg-white dark:bg-[#161F30] rounded-2xl border border-slate-200 dark:border-[#243048] p-6 shadow-sm relative hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-[#EDE9FE] dark:bg-[#312E81]/50 text-[#7C3AED] dark:text-[#A78BFA] flex items-center justify-center">
                <MessageSquare className="w-4 h-4" />
              </div>
              <span className="w-7 h-7 rounded-lg bg-[#D1FAE5] dark:bg-[#064E3B]/80 text-[#059669] dark:text-[#34D399] font-black text-xs flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
                A
              </span>
            </div>

            <div className="mt-4 text-center">
              <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                136
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Average Comments
              </div>

              <div className="mt-3 inline-flex items-center space-x-1 text-xs font-bold text-[#10B981]">
                <ArrowUp className="w-3.5 h-3.5" />
                <span>69%</span>
              </div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500">
                compared to average of similar accounts
              </div>
            </div>

            {/* Range Line: min 0 ── avg 80 ── max 321 */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-[#243048] space-y-2">
              <div className="relative w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${(136 / 321) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>min<br />0</span>
                <span className="text-center font-bold text-slate-700 dark:text-slate-300">
                  avg<br />80
                </span>
                <span className="text-right">max<br />321</span>
              </div>
            </div>
          </div>

          {/* Card B: Engagement Rate (Grade B) */}
          <div className="bg-white dark:bg-[#161F30] rounded-2xl border border-slate-200 dark:border-[#243048] p-6 shadow-sm relative hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-[#EDE9FE] dark:bg-[#312E81]/50 text-[#7C3AED] dark:text-[#A78BFA] flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
              <span className="w-7 h-7 rounded-lg bg-[#E0F2FE] dark:bg-[#0C4A6E]/80 text-[#0284C7] dark:text-[#38BDF8] font-black text-xs flex items-center justify-center border border-sky-200 dark:border-sky-800">
                B
              </span>
            </div>

            <div className="mt-4 text-center">
              <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                2.42%
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Engagement Rate
              </div>

              <div className="mt-3 inline-flex items-center space-x-1 text-xs font-bold text-[#0284C7] dark:text-[#38BDF8]">
                <ArrowUp className="w-3.5 h-3.5" />
                <span>32%</span>
              </div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500">
                compared to average of similar accounts
              </div>
            </div>

            {/* Range Line: min 0.00% ── avg 1.84% ── max 7.35% */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-[#243048] space-y-2">
              <div className="relative w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-500 rounded-full"
                  style={{ width: `${(2.42 / 7.35) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>min<br />0.00%</span>
                <span className="text-center font-bold text-slate-700 dark:text-slate-300">
                  avg<br />1.84%
                </span>
                <span className="text-right">max<br />7.35%</span>
              </div>
            </div>
          </div>

          {/* Card C: Weekly Posts (Grade C) */}
          <div className="bg-white dark:bg-[#161F30] rounded-2xl border border-slate-200 dark:border-[#243048] p-6 shadow-sm relative hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-[#EDE9FE] dark:bg-[#312E81]/50 text-[#7C3AED] dark:text-[#A78BFA] flex items-center justify-center">
                <ImageIcon className="w-4 h-4" />
              </div>
              <span className="w-7 h-7 rounded-lg bg-[#FEF3C7] dark:bg-[#78350F]/80 text-[#D97706] dark:text-[#FBBF24] font-black text-xs flex items-center justify-center border border-amber-200 dark:border-amber-800">
                C
              </span>
            </div>

            <div className="mt-4 text-center">
              <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                4
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Weekly Posts
              </div>

              <div className="mt-3 inline-flex items-center space-x-1 text-xs font-bold text-[#F59E0B]">
                <ArrowDown className="w-3.5 h-3.5" />
                <span>26%</span>
              </div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500">
                compared to average of similar accounts
              </div>
            </div>

            {/* Range Line: min 0 ── avg 5 ── max 22 */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-[#243048] space-y-2">
              <div className="relative w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${(4 / 22) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>min<br />0</span>
                <span className="text-center font-bold text-slate-700 dark:text-slate-300">
                  avg<br />5
                </span>
                <span className="text-right">max<br />22</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
