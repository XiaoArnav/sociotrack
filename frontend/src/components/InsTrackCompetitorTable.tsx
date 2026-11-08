"use client";

import React, { useState, useMemo, useEffect } from "react";
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

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

const COMPETITORS: CompetitorAccount[] = [
  {
    id: "c0",
    avatar: `${BASE_PATH}/avatars/arnav.patel07.png`,
    handle: "arnav.patel07",
    name: "Arnav Patel 👾",
    followers: 13,
    followersDelta: "+1 (+8.33%)",
    isPositiveFollowers: true,
    following: 61,
    followingDelta: "+0 (+0.0%)",
    isPositiveFollowing: true,
    mediaCount: 0,
    mediaDelta: "+0 (+0.0%)",
    engagementRate: 12.50,
    engagementDelta: "+0.00 (+0.0%)",
    isPositiveEngagement: true,
    group: "My Accounts",
  },
  {
    id: "c1",
    avatar: `${BASE_PATH}/avatars/techno_gamerz.png`,
    handle: "techno_gamerz",
    name: "Techno Gamerz",
    followers: 2000000,
    followersDelta: "+14,000 (+0.70%)",
    isPositiveFollowers: true,
    following: 3,
    followingDelta: "+0 (+0.0%)",
    isPositiveFollowing: true,
    mediaCount: 33,
    mediaDelta: "+1 (+3.12%)",
    engagementRate: 6.45,
    engagementDelta: "+0.35 (+5.74%)",
    isPositiveEngagement: true,
    group: "Creators",
  },
  {
    id: "c2",
    avatar: `${BASE_PATH}/avatars/lalalalisa_m.png`,
    handle: "lalalalisa_m",
    name: "LISA",
    followers: 105000000,
    followersDelta: "+540,000 (+0.51%)",
    isPositiveFollowers: true,
    following: 0,
    mediaCount: 1260,
    mediaDelta: "+8 (+0.64%)",
    engagementRate: 7.90,
    engagementDelta: "+0.82 (+11.58%)",
    isPositiveEngagement: true,
    group: "Global Icons",
  },
  {
    id: "c3",
    avatar: `${BASE_PATH}/avatars/thv.png`,
    handle: "thv",
    name: "V (뷔) | Kim Taehyung",
    followers: 78000000,
    followersDelta: "+420,000 (+0.54%)",
    isPositiveFollowers: true,
    following: 8,
    mediaCount: 195,
    mediaDelta: "+3 (+1.56%)",
    engagementRate: 16.80,
    engagementDelta: "+1.40 (+9.09%)",
    isPositiveEngagement: true,
    group: "Global Icons",
  },
  {
    id: "c4",
    avatar: `${BASE_PATH}/avatars/sooyaaa__.png`,
    handle: "sooyaaa__",
    name: "JISOO (지수) | BLISSOO",
    followers: 80000000,
    followersDelta: "+380,000 (+0.48%)",
    isPositiveFollowers: true,
    following: 0,
    mediaCount: 1390,
    mediaDelta: "+7 (+0.51%)",
    engagementRate: 6.40,
    engagementDelta: "+0.32 (+5.26%)",
    isPositiveEngagement: true,
    group: "Global Icons",
  },
  {
    id: "c5",
    avatar: `${BASE_PATH}/avatars/mnijungkook.png`,
    handle: "mnijungkook",
    name: "JK (정국) | BTS",
    followers: 27000000,
    followersDelta: "+220,000 (+0.82%)",
    isPositiveFollowers: true,
    following: 8,
    mediaCount: 54,
    mediaDelta: "+2 (+3.85%)",
    engagementRate: 14.20,
    engagementDelta: "+0.95 (+7.17%)",
    isPositiveEngagement: true,
    group: "Global Icons",
  },
  {
    id: "c6",
    avatar: `${BASE_PATH}/avatars/j.m.png`,
    handle: "j.m",
    name: "JIMIN (지민) | Park Jimin",
    followers: 61000000,
    followersDelta: "+310,000 (+0.51%)",
    isPositiveFollowers: true,
    following: 8,
    mediaCount: 25,
    mediaDelta: "+1 (+4.17%)",
    engagementRate: 15.40,
    engagementDelta: "+1.10 (+7.69%)",
    isPositiveEngagement: true,
    group: "Global Icons",
  },
  {
    id: "c7",
    avatar: `${BASE_PATH}/avatars/uarmyhope.png`,
    handle: "uarmyhope",
    name: "j-hope (제이홉) | Jung Hoseok",
    followers: 57000000,
    followersDelta: "+290,000 (+0.51%)",
    isPositiveFollowers: true,
    following: 8,
    mediaCount: 371,
    mediaDelta: "+4 (+1.09%)",
    engagementRate: 11.20,
    engagementDelta: "+0.70 (+6.67%)",
    isPositiveEngagement: true,
    group: "Global Icons",
  },
  {
    id: "c8",
    avatar: `${BASE_PATH}/avatars/rkive.png`,
    handle: "rkive",
    name: "RM (남준) | Kim Namjoon",
    followers: 54000000,
    followersDelta: "+270,000 (+0.50%)",
    isPositiveFollowers: true,
    following: 8,
    mediaCount: 41,
    mediaDelta: "+2 (+5.13%)",
    engagementRate: 12.10,
    engagementDelta: "+0.85 (+7.56%)",
    isPositiveEngagement: true,
    group: "Global Icons",
  },
  {
    id: "c9",
    avatar: `${BASE_PATH}/avatars/itsjvke.png`,
    handle: "itsjvke",
    name: "JVKE | Singer & Producer",
    followers: 4000000,
    followersDelta: "+38,000 (+0.96%)",
    isPositiveFollowers: true,
    following: 1364,
    followingDelta: "+12 (+0.89%)",
    isPositiveFollowing: true,
    mediaCount: 312,
    mediaDelta: "+4 (+1.30%)",
    engagementRate: 8.90,
    engagementDelta: "+0.60 (+7.23%)",
    isPositiveEngagement: true,
    group: "Creators",
  },
  {
    id: "c10",
    avatar: `${BASE_PATH}/avatars/chenzheyuanisssme.png`,
    handle: "chenzheyuanisssme",
    name: "Chen Zheyuan (陈哲远) | Actor",
    followers: 4000000,
    followersDelta: "+45,000 (+1.14%)",
    isPositiveFollowers: true,
    following: 0,
    mediaCount: 49,
    mediaDelta: "+2 (+4.26%)",
    engagementRate: 12.60,
    engagementDelta: "+1.20 (+10.5%)",
    isPositiveEngagement: true,
    group: "Creators",
  },
  {
    id: "c11",
    avatar: `${BASE_PATH}/avatars/tomi.timetraveler.png`,
    handle: "tomi.timetraveler",
    name: "Tomi (@tomi.timetraveler) | Creator",
    followers: 3000000,
    followersDelta: "+35,000 (+1.18%)",
    isPositiveFollowers: true,
    following: 307,
    followingDelta: "+2 (+0.65%)",
    isPositiveFollowing: true,
    mediaCount: 579,
    mediaDelta: "+5 (+0.87%)",
    engagementRate: 6.70,
    engagementDelta: "+0.50 (+8.06%)",
    isPositiveEngagement: true,
    group: "Creators",
  },
  {
    id: "c12",
    avatar: `${BASE_PATH}/avatars/moretomihika.png`,
    handle: "moretomihika",
    name: "Mihika Sharma (@moretomihika) | Creator",
    followers: 383000,
    followersDelta: "+4,200 (+1.11%)",
    isPositiveFollowers: true,
    following: 425,
    followingDelta: "+3 (+0.71%)",
    isPositiveFollowing: true,
    mediaCount: 549,
    mediaDelta: "+6 (+1.10%)",
    engagementRate: 5.40,
    engagementDelta: "+0.35 (+6.93%)",
    isPositiveEngagement: true,
    group: "Creators",
  },
  {
    id: "c13",
    avatar: `${BASE_PATH}/avatars/aviralbhardwaj_ji.png`,
    handle: "aviralbhardwaj_ji",
    name: "Aviral Bhardwaj",
    followers: 319,
    followersDelta: "+14 (+4.59%)",
    isPositiveFollowers: true,
    following: 1052,
    followingDelta: "+3 (+0.29%)",
    isPositiveFollowing: true,
    mediaCount: 143,
    mediaDelta: "+1 (+0.70%)",
    engagementRate: 8.42,
    engagementDelta: "+0.65 (+8.37%)",
    isPositiveEngagement: true,
    group: "Creators",
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
  const [accounts, setAccounts] = useState<CompetitorAccount[]>(COMPETITORS);
  const [selectedGroup, setSelectedGroup] = useState("All");
  const [searchFilter, setSearchFilter] = useState("");
  const [sortField, setSortField] = useState<"followers" | "mediaCount" | "engagementRate">("followers");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Hydrate live from Meta Graph / backend proxy whenever available
  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    let isMounted = true;
    fetch(`${apiBase}/api/creators/competitors`)
      .then((res) => (res.ok ? res.json() : null))
      .then((liveData) => {
        if (isMounted && Array.isArray(liveData) && liveData.length > 0) {
          setAccounts(liveData);
        }
      })
      .catch(() => {
        // Fallback to presets if backend is offline or static deploy
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
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
  }, [accounts, selectedGroup, searchFilter, sortField, sortOrder]);

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
        <h2 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-indigo-500 via-sky-400 to-cyan-400 bg-clip-text text-transparent pb-1.5 pt-0.5 leading-tight">
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
              {["All", "My Accounts", "Creators", "Global Icons"].map((grp) => (
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
                <th className="sticky left-0 z-20 bg-white dark:bg-[#161F30] py-3 px-4 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)] dark:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.35)] border-r border-slate-100 dark:border-[#243048] min-w-[220px]">
                  Account
                </th>
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
                  {/* Account Avatar + Handle (Permanently Pinned on Left) */}
                  <td className="sticky left-0 z-10 bg-white dark:bg-[#161F30] group-hover:bg-slate-50 dark:group-hover:bg-[#1E2638] py-3 px-4 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)] dark:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.35)] border-r border-slate-100 dark:border-[#243048] min-w-[220px] transition-colors">
                    <div className="flex items-center space-x-3">
                      <img
                        src={acc.avatar}
                        alt={acc.name}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          const clean = acc.handle.replace(/^@/, "").toLowerCase().trim();
                          const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
                          if (!target.dataset.triedProxy) {
                            target.dataset.triedProxy = "1";
                            target.src = `${apiBase}/api/creators/${encodeURIComponent(clean)}/avatar`;
                          } else {
                            target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(clean)}`;
                          }
                        }}
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
