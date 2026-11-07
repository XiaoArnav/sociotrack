"use client";

import React, { useState } from "react";
import { Users, Plus, ArrowUpDown, ChevronDown, Check } from "lucide-react";

interface CompetitorAccount {
  id: string;
  avatar: string;
  handle: string;
  name: string;
  followers: number;
  followersDelta: string;
  isPositiveFollowers: boolean;
  following: number;
  followingDelta?: string;
  isPositiveFollowing?: boolean;
  mediaCount: number;
  mediaDelta?: string;
  engagementRate: number;
  engagementDelta?: string;
  isPositiveEngagement?: boolean;
  group: string;
}

const COMPETITORS: CompetitorAccount[] = [
  {
    id: "c1",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80",
    handle: "brewhavencafe",
    name: "Brew Haven Café",
    followers: 14038,
    followersDelta: "+154 (+1.11%)",
    isPositiveFollowers: true,
    following: 51,
    followingDelta: "-1 (-1.92%)",
    isPositiveFollowing: false,
    mediaCount: 101,
    mediaDelta: "+3 (+3.06%)",
    engagementRate: 1.84,
    group: "Competitors",
  },
  {
    id: "c2",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
    handle: "beanblossombrew",
    name: "Bean Blossom Brew",
    followers: 84597,
    followersDelta: "+564 (+0.67%)",
    isPositiveFollowers: true,
    following: 239,
    mediaCount: 1793,
    mediaDelta: "+10 (+0.56%)",
    engagementRate: 0.52,
    engagementDelta: "-0.09 (-14.75%)",
    isPositiveEngagement: false,
    group: "Competitors",
  },
  {
    id: "c3",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80",
    handle: "mochameadows",
    name: "Mocha Meadows Coffee",
    followers: 3409,
    followersDelta: "+20 (+0.59%)",
    isPositiveFollowers: true,
    following: 89,
    followingDelta: "+2 (+2.30%)",
    isPositiveFollowing: true,
    mediaCount: 257,
    mediaDelta: "+5 (+1.98%)",
    engagementRate: 0.59,
    engagementDelta: "+0.07 (+13.46%)",
    isPositiveEngagement: true,
    group: "Competitors",
  },
  {
    id: "c4",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    handle: "espressoemporium",
    name: "Espresso Emporium",
    followers: 16548,
    followersDelta: "+69 (+0.42%)",
    isPositiveFollowers: true,
    following: 349,
    followingDelta: "-1 (-0.29%)",
    isPositiveFollowing: false,
    mediaCount: 495,
    mediaDelta: "+2 (+0.41%)",
    engagementRate: 1.02,
    engagementDelta: "-0.20 (-16.39%)",
    isPositiveEngagement: false,
    group: "Competitors",
  },
  {
    id: "c5",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
    handle: "cuppacosmos",
    name: "Cuppa Cosmos Café",
    followers: 15602,
    followersDelta: "+42 (+0.27%)",
    isPositiveFollowers: true,
    following: 2,
    mediaCount: 1768,
    mediaDelta: "+2 (+0.11%)",
    engagementRate: 0.17,
    group: "Competitors",
  },
];

interface InsTrackCompetitorTableProps {
  onAddAccountClick?: () => void;
}

export function InsTrackCompetitorTable({ onAddAccountClick }: InsTrackCompetitorTableProps = {}) {
  const [selectedGroup, setSelectedGroup] = useState("Competitors");
  const [sortBy, setSortBy] = useState("highest_followers_change");

  return (
    <div className="space-y-4">
      {/* Section Header matching Screenshot 6 */}
      <div className="text-center max-w-2xl mx-auto space-y-1 pt-2">
        <h2 className="text-2xl font-black bg-gradient-to-r from-indigo-500 via-sky-400 to-cyan-400 bg-clip-text text-transparent">
          Powerful Tracking Dashboard
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Track <span className="font-semibold text-slate-800 dark:text-slate-200">multiple Instagram accounts</span> and assign them to{" "}
          <span className="font-semibold text-slate-800 dark:text-slate-200">different groups</span>: Your accounts, competitors,
          clients, friends and more. Compare accounts against each other at a glance using different metrics, sorting
          methods and time periods.
        </p>
      </div>

      <div className="bg-white dark:bg-[#161F30] rounded-2xl border border-slate-200 dark:border-[#243048] p-6 shadow-sm space-y-4">
      {/* Top Bar with Group Tabs & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-[#243048]">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Tracked Accounts &amp; Industry Benchmarks
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#1E2638] text-slate-600 dark:text-slate-300 font-medium">
              Tracking 47 accounts
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Accounts are sorted by highest percentage of change in follower growth and engagement
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Group Selector Pill */}
          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-[#1E2638] p-1 text-xs font-semibold">
            {["Competitors", "My Accounts", "Clients"].map((grp) => (
              <button
                key={grp}
                onClick={() => setSelectedGroup(grp)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  selectedGroup === grp
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {grp}
              </button>
            ))}
          </div>

          <button
            onClick={onAddAccountClick}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Accounts</span>
          </button>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 dark:border-[#243048] text-[11px] font-mono uppercase text-slate-400">
              <th className="py-3 px-3">Account</th>
              <th className="py-3 px-3">Followers Count</th>
              <th className="py-3 px-3">Following Count</th>
              <th className="py-3 px-3">Media Count</th>
              <th className="py-3 px-3">Engagement Rate</th>
              <th className="py-3 px-3">Group</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#243048]">
            {COMPETITORS.map((acc) => (
              <tr
                key={acc.id}
                className="hover:bg-slate-50/70 dark:hover:bg-[#1E2638]/50 transition-colors"
              >
                {/* Account Avatar + Handle */}
                <td className="py-3 px-3">
                  <div className="flex items-center space-x-3">
                    <img
                      src={acc.avatar}
                      alt={acc.name}
                      className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-[#243048]"
                    />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">
                        {acc.handle}
                      </div>
                      <div className="text-[11px] text-slate-400">{acc.name}</div>
                    </div>
                  </div>
                </td>

                {/* Followers with Delta */}
                <td className="py-3 px-3 font-mono">
                  <div className="font-bold text-slate-900 dark:text-white">
                    {acc.followers.toLocaleString()}
                  </div>
                  <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                    {acc.followersDelta}
                  </div>
                </td>

                {/* Following with Delta */}
                <td className="py-3 px-3 font-mono">
                  <div className="text-slate-800 dark:text-slate-200 font-medium">
                    {acc.following}
                  </div>
                  {acc.followingDelta && (
                    <div
                      className={`text-[10px] font-semibold ${
                        acc.isPositiveFollowing
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-500"
                      }`}
                    >
                      {acc.followingDelta}
                    </div>
                  )}
                </td>

                {/* Media Count with Delta */}
                <td className="py-3 px-3 font-mono">
                  <div className="text-slate-800 dark:text-slate-200 font-medium">
                    {acc.mediaCount}
                  </div>
                  {acc.mediaDelta && (
                    <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                      {acc.mediaDelta}
                    </div>
                  )}
                </td>

                {/* Engagement Rate */}
                <td className="py-3 px-3 font-mono">
                  <div className="font-bold text-slate-900 dark:text-white">
                    {acc.engagementRate.toFixed(2)}%
                  </div>
                  {acc.engagementDelta && (
                    <div
                      className={`text-[10px] font-semibold ${
                        acc.isPositiveEngagement
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-500"
                      }`}
                    >
                      {acc.engagementDelta}
                    </div>
                  )}
                </td>

                {/* Group Badge */}
                <td className="py-3 px-3">
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-[#1E2638] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#243048]">
                    <span>{acc.group}</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);
}
