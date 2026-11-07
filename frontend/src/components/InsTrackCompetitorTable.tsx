"use client";

import React, { useState, useMemo } from "react";
import { Users, Plus, ArrowUpDown, ChevronDown, Check, Search } from "lucide-react";

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
    id: "c0",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
    handle: "thestevenmellor",
    name: "Steve | Growth Marketing",
    followers: 173435,
    followersDelta: "+4,227 (+2.50%)",
    isPositiveFollowers: true,
    following: 584,
    followingDelta: "+38 (+7.0%)",
    isPositiveFollowing: true,
    mediaCount: 353,
    mediaDelta: "+16 (+4.7%)",
    engagementRate: 2.42,
    group: "My Accounts",
  },
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
  onSelectAccount?: (handle: string) => void;
}

export function InsTrackCompetitorTable({
  onAddAccountClick,
  onSelectAccount,
}: InsTrackCompetitorTableProps = {}) {
  const [selectedGroup, setSelectedGroup] = useState("All");
  const [searchFilter, setSearchFilter] = useState("");
  const [sortField, setSortField] = useState<"followers" | "mediaCount" | "engagementRate">("followers");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const filteredAccounts = useMemo(() => {
    return COMPETITORS.filter((acc) => {
      const matchGroup = selectedGroup === "All" || acc.group === selectedGroup;
      const matchSearch =
        acc.handle.toLowerCase().includes(searchFilter.toLowerCase()) ||
        acc.name.toLowerCase().includes(searchFilter.toLowerCase());
      return matchGroup && matchSearch;
    }).sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      return sortOrder === "desc" ? valB - valA : valA - valB;
    });
  }, [selectedGroup, searchFilter, sortField, sortOrder]);

  const toggleSort = (field: "followers" | "mediaCount" | "engagementRate") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  return (
    <div className="space-y-4">
      {/* Section Header matching Screenshot 6 */}
      <div className="text-center max-w-2xl mx-auto space-y-1 pt-2">
        <h2 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-indigo-500 via-sky-400 to-cyan-400 bg-clip-text text-transparent">
          Powerful Tracking Dashboard
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          Track <span className="font-semibold text-slate-800 dark:text-slate-200">multiple Instagram accounts</span> and assign them to{" "}
          <span className="font-semibold text-slate-800 dark:text-slate-200">different groups</span>: Your accounts, competitors,
          clients, friends and more. Click any account to audit its profile.
        </p>
      </div>

      <div className="bg-white dark:bg-[#161F30] rounded-2xl border border-slate-200/80 dark:border-[#243048] p-6 shadow-sm space-y-4">
        {/* Top Bar with Group Tabs, Search Filter & Add Button */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-[#243048]">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Tracked Accounts &amp; Industry Benchmarks
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#1E2638] text-slate-600 dark:text-slate-300 font-medium">
                Tracking {filteredAccounts.length} accounts
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Click any row to instantly audit that creator&apos;s live analytics.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Live Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter accounts..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="h-8 pl-8 pr-3 rounded-xl border border-slate-200 dark:border-[#243048] bg-slate-50 dark:bg-[#1E2638] text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
              />
            </div>

            {/* Group Selector Pill */}
            <div className="inline-flex rounded-xl bg-slate-100 dark:bg-[#1E2638] p-1 text-xs font-semibold">
              {["All", "Competitors", "My Accounts"].map((grp) => (
                <button
                  key={grp}
                  onClick={() => setSelectedGroup(grp)}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    selectedGroup === grp
                      ? "bg-[#6366F1] text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {grp}
                </button>
              ))}
            </div>

            <button
              onClick={onAddAccountClick}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#6366F1] hover:bg-[#5558E6] text-white text-xs font-bold shadow-xs transition-colors"
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
                <th
                  onClick={() => toggleSort("followers")}
                  className="py-3 px-3 cursor-pointer hover:text-indigo-500 select-none"
                >
                  <div className="flex items-center space-x-1">
                    <span>Followers Count</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3">Following Count</th>
                <th
                  onClick={() => toggleSort("mediaCount")}
                  className="py-3 px-3 cursor-pointer hover:text-indigo-500 select-none"
                >
                  <div className="flex items-center space-x-1">
                    <span>Media Count</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort("engagementRate")}
                  className="py-3 px-3 cursor-pointer hover:text-indigo-500 select-none"
                >
                  <div className="flex items-center space-x-1">
                    <span>Engagement Rate</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3">Group</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#243048]">
              {filteredAccounts.map((acc) => (
                <tr
                  key={acc.id}
                  onClick={() => onSelectAccount?.(acc.handle)}
                  className="hover:bg-slate-50/80 dark:hover:bg-[#1E2638]/70 transition-colors cursor-pointer group"
                  title={`Click to audit @${acc.handle}`}
                >
                  {/* Account Avatar + Handle */}
                  <td className="py-3 px-3">
                    <div className="flex items-center space-x-3">
                      <img
                        src={acc.avatar}
                        alt={acc.name}
                        className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-[#243048] group-hover:ring-2 group-hover:ring-indigo-500 transition-all"
                      />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          @{acc.handle}
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

                  {/* Group Pill */}
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-[#1E2638] text-slate-600 dark:text-slate-300">
                      {acc.group}
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
