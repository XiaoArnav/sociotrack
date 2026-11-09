"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Users,
  Plus,
  ArrowUpDown,
  Search,
  Trash2,
  Star,
  ExternalLink,
  RotateCcw,
  Sparkles,
  ChevronDown,
  Check,
  Activity,
} from "lucide-react";

export interface CompetitorAccount {
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
  isVerified?: boolean;
  isPrivate?: boolean;
}

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";
const STORAGE_KEY = "sociotrack_tracked_accounts_v3";

const DEFAULT_COMPETITORS: CompetitorAccount[] = [
  {
    id: "c0",
    avatar: `${BASE_PATH}/avatars/zyrohouse.png`,
    handle: "zyrohouse",
    name: "Zyro House",
    followers: 68,
    followersDelta: "+1 (+0.50%)",
    isPositiveFollowers: true,
    following: 1,
    followingDelta: "+0 (+0.0%)",
    isPositiveFollowing: true,
    mediaCount: 1,
    mediaDelta: "+1 (+1.50%)",
    engagementRate: 12.50,
    engagementDelta: "+0.35 (+5.4%)",
    isPositiveEngagement: true,
    group: "My Accounts",
    isVerified: false,
    isPrivate: false,
  },
  {
    id: "c1",
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
    isVerified: false,
    isPrivate: true,
  },
  {
    id: "c2",
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
    isVerified: true,
  },
  {
    id: "c3",
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
    isVerified: true,
  },
  {
    id: "c4",
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
    isVerified: true,
  },
  {
    id: "c5",
    avatar: `${BASE_PATH}/avatars/sooyaaa__.png`,
    handle: "sooyaaa__",
    name: "JISOO (지수) | BLISSOO",
    followers: 80000000,
    followersDelta: "+400,000 (+0.50%)",
    isPositiveFollowers: true,
    following: 0,
    mediaCount: 1390,
    mediaDelta: "+5 (+0.36%)",
    engagementRate: 11.20,
    engagementDelta: "+0.95 (+9.27%)",
    isPositiveEngagement: true,
    group: "Global Icons",
    isVerified: true,
  },
  {
    id: "c6",
    avatar: `${BASE_PATH}/avatars/mnijungkook.png`,
    handle: "mnijungkook",
    name: "Jung Kook (정국)",
    followers: 27000000,
    followersDelta: "+180,000 (+0.67%)",
    isPositiveFollowers: true,
    following: 8,
    mediaCount: 54,
    mediaDelta: "+1 (+1.89%)",
    engagementRate: 14.30,
    engagementDelta: "+1.10 (+8.33%)",
    isPositiveEngagement: true,
    group: "Global Icons",
    isVerified: true,
  },
  {
    id: "c7",
    avatar: `${BASE_PATH}/avatars/j.m.png`,
    handle: "j.m",
    name: "Jimin (지min)",
    followers: 61000000,
    followersDelta: "+310,000 (+0.51%)",
    isPositiveFollowers: true,
    following: 8,
    mediaCount: 25,
    mediaDelta: "+0 (+0.0%)",
    engagementRate: 15.60,
    engagementDelta: "+1.20 (+8.33%)",
    isPositiveEngagement: true,
    group: "Global Icons",
    isVerified: true,
  },
  {
    id: "c8",
    avatar: `${BASE_PATH}/avatars/uarmyhope.png`,
    handle: "uarmyhope",
    name: "j-hope (제이홉)",
    followers: 57000000,
    followersDelta: "+290,000 (+0.51%)",
    isPositiveFollowers: true,
    following: 8,
    mediaCount: 371,
    mediaDelta: "+4 (+1.09%)",
    engagementRate: 12.80,
    engagementDelta: "+0.85 (+7.11%)",
    isPositiveEngagement: true,
    group: "Global Icons",
    isVerified: true,
  },
  {
    id: "c9",
    avatar: `${BASE_PATH}/avatars/rkive.png`,
    handle: "rkive",
    name: "RM (남준)",
    followers: 54000000,
    followersDelta: "+270,000 (+0.50%)",
    isPositiveFollowers: true,
    following: 8,
    mediaCount: 41,
    mediaDelta: "+1 (+2.50%)",
    engagementRate: 13.90,
    engagementDelta: "+0.90 (+6.92%)",
    isPositiveEngagement: true,
    group: "Global Icons",
    isVerified: true,
  },
  {
    id: "c10",
    avatar: `${BASE_PATH}/avatars/itsjvke.png`,
    handle: "itsjvke",
    name: "JVKE",
    followers: 4000000,
    followersDelta: "+24,000 (+0.60%)",
    isPositiveFollowers: true,
    following: 1364,
    mediaCount: 312,
    mediaDelta: "+2 (+0.65%)",
    engagementRate: 8.90,
    engagementDelta: "+0.60 (+7.23%)",
    isPositiveEngagement: true,
    group: "Creators",
    isVerified: true,
  },
  {
    id: "c11",
    avatar: `${BASE_PATH}/avatars/chenzheyuanisssme.png`,
    handle: "chenzheyuanisssme",
    name: "Chen Zheyuan (陈哲远)",
    followers: 4000000,
    followersDelta: "+25,000 (+0.63%)",
    isPositiveFollowers: true,
    following: 0,
    mediaCount: 49,
    mediaDelta: "+1 (+2.08%)",
    engagementRate: 9.80,
    engagementDelta: "+0.70 (+7.69%)",
    isPositiveEngagement: true,
    group: "Creators",
    isVerified: true,
  },
  {
    id: "c12",
    avatar: `${BASE_PATH}/avatars/tomi.timetraveler.png`,
    handle: "tomi.timetraveler",
    name: "Tomi",
    followers: 3000000,
    followersDelta: "+18,000 (+0.60%)",
    isPositiveFollowers: true,
    following: 307,
    mediaCount: 579,
    mediaDelta: "+3 (+0.52%)",
    engagementRate: 7.40,
    engagementDelta: "+0.45 (+6.47%)",
    isPositiveEngagement: true,
    group: "Creators",
  },
  {
    id: "c13",
    avatar: `${BASE_PATH}/avatars/moretomihika.png`,
    handle: "moretomihika",
    name: "mihika sharma",
    followers: 383000,
    followersDelta: "+2,400 (+0.63%)",
    isPositiveFollowers: true,
    following: 425,
    mediaCount: 549,
    mediaDelta: "+2 (+0.37%)",
    engagementRate: 6.80,
    engagementDelta: "+0.40 (+6.25%)",
    isPositiveEngagement: true,
    group: "Creators",
  },
  {
    id: "c14",
    avatar: `${BASE_PATH}/avatars/aviralbhardwaj_ji.png`,
    handle: "aviralbhardwaj_ji",
    name: "Aviral Bhardwaj",
    followers: 319,
    followersDelta: "+2 (+0.63%)",
    isPositiveFollowers: true,
    following: 1052,
    mediaCount: 143,
    mediaDelta: "+1 (+0.70%)",
    engagementRate: 8.90,
    engagementDelta: "+0.55 (+6.59%)",
    isPositiveEngagement: true,
    group: "Creators",
  },
  {
    id: "c15",
    avatar: `${BASE_PATH}/avatars/zurikrishna.png`,
    handle: "zurikrishna",
    name: "krishna",
    followers: 42,
    followersDelta: "+1 (+2.44%)",
    isPositiveFollowers: true,
    following: 97,
    mediaCount: 39,
    mediaDelta: "+0 (+0.0%)",
    engagementRate: 11.40,
    engagementDelta: "+0.50 (+4.59%)",
    isPositiveEngagement: true,
    group: "Creators",
  },
  {
    id: "c16",
    avatar: `${BASE_PATH}/avatars/keerz.core.png`,
    handle: "keerz.core",
    name: "🪐",
    followers: 182,
    followersDelta: "+2 (+1.11%)",
    isPositiveFollowers: true,
    following: 1388,
    mediaCount: 1,
    mediaDelta: "+0 (+0.0%)",
    engagementRate: 10.20,
    engagementDelta: "+0.45 (+4.62%)",
    isPositiveEngagement: true,
    group: "Creators",
  },
];

interface InsTrackCompetitorTableProps {
  onAddAccountClick?: () => void;
  onSelectAccount?: (handle: string) => void;
  onSetPrimaryAccount?: (handle: string) => void;
  primaryHandle?: string;
  onToast?: (title: string, message: string, type?: "success" | "info" | "warning") => void;
}

export function InsTrackCompetitorTable({
  onAddAccountClick,
  onSelectAccount,
  onSetPrimaryAccount,
  primaryHandle = "zyrohouse",
  onToast,
}: InsTrackCompetitorTableProps = {}) {
  const [accounts, setAccounts] = useState<CompetitorAccount[]>(DEFAULT_COMPETITORS);
  const [selectedGroup, setSelectedGroup] = useState<string>("All");
  const [searchFilter, setSearchFilter] = useState("");
  const [sortField, setSortField] = useState<"followers" | "mediaCount" | "engagementRate">("followers");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [lastRemoved, setLastRemoved] = useState<CompetitorAccount | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);

  // Initialize and sync with localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setAccounts(parsed);
            return;
          }
        } catch {}
      }
    }

    // Hydrate live from Meta Graph / backend proxy whenever available
    const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
    const apiBase =
      process.env.NEXT_PUBLIC_API_URL ||
      (isHttps ? "https://sociotrack-api.onrender.com" : "http://localhost:8000");
    if (!apiBase || (isHttps && apiBase.startsWith("http://localhost"))) return;

    let isMounted = true;
    fetch(`${apiBase}/api/creators/competitors`)
      .then((res) => (res.ok ? res.json() : null))
      .then((liveData) => {
        if (isMounted && Array.isArray(liveData) && liveData.length > 0) {
          setAccounts(liveData);
          if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(liveData));
          }
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  // Listen for externally added accounts (e.g. from AddAccountModal)
  useEffect(() => {
    const handleAccountAdded = (e: any) => {
      const { username, fullName, group } = e.detail || {};
      if (!username) return;

      const clean = username.replace(/^@/, "").toLowerCase().trim();
      setAccounts((prev) => {
        if (prev.some((a) => a.handle.toLowerCase() === clean)) {
          return prev;
        }
        const newAcc: CompetitorAccount = {
          id: `custom_${Date.now()}`,
          avatar: `${BASE_PATH}/avatars/${clean}.png`,
          handle: clean,
          name: fullName || `@${clean}`,
          followers: 100,
          followersDelta: "+5 (+5.0%)",
          isPositiveFollowers: true,
          following: 50,
          mediaCount: 1,
          engagementRate: 8.5,
          group: group || "My Accounts",
        };
        const updated = [newAcc, ...prev];
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        }
        return updated;
      });
    };

    window.addEventListener("sociotrack:track_account", handleAccountAdded);
    return () => {
      window.removeEventListener("sociotrack:track_account", handleAccountAdded);
    };
  }, []);

  const persistAccounts = (newList: CompetitorAccount[]) => {
    setAccounts(newList);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
    }
  };

  // Remove Account handler
  const handleRemoveAccount = (e: React.MouseEvent, acc: CompetitorAccount) => {
    e.stopPropagation();
    const updated = accounts.filter((a) => a.handle.toLowerCase() !== acc.handle.toLowerCase());
    setLastRemoved(acc);
    persistAccounts(updated);
    onToast?.(
      "Account Removed",
      `@${acc.handle} untracked from dashboard. You can undo this action.`,
      "info"
    );
  };

  // Undo remove handler
  const handleUndoRemove = () => {
    if (!lastRemoved) return;
    const updated = [lastRemoved, ...accounts];
    persistAccounts(updated);
    onToast?.(
      "Account Restored",
      `@${lastRemoved.handle} re-added to your tracking list.`,
      "success"
    );
    setLastRemoved(null);
  };

  // Reset to default accounts
  const handleResetDefaults = () => {
    persistAccounts(DEFAULT_COMPETITORS);
    setLastRemoved(null);
    onToast?.(
      "Defaults Restored",
      "Reset tracking table to authentic default showcase creators.",
      "success"
    );
  };

  // Change group handler
  const handleUpdateGroup = (handle: string, newGroup: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = accounts.map((a) =>
      a.handle.toLowerCase() === handle.toLowerCase() ? { ...a, group: newGroup } : a
    );
    persistAccounts(updated);
    setEditingGroupId(null);
    onToast?.(
      "Category Updated",
      `@${handle} moved to "${newGroup}".`,
      "success"
    );
  };

  // Set as Primary Hero Account
  const handleSetPrimary = (e: React.MouseEvent, handle: string) => {
    e.stopPropagation();
    onSetPrimaryAccount?.(handle);
    onToast?.(
      "Primary Creator Set",
      `@${handle} promoted to main dashboard hero card.`,
      "success"
    );
  };

  // Open Instagram profile in new window
  const handleOpenInstagram = (e: React.MouseEvent, handle: string) => {
    e.stopPropagation();
    window.open(`https://www.instagram.com/${handle}/`, "_blank", "noopener,noreferrer");
  };

  const filteredAccounts = useMemo(() => {
    return accounts
      .filter((acc) => {
        const matchGroup = selectedGroup === "All" || acc.group === selectedGroup;
        const matchSearch =
          acc.handle.toLowerCase().includes(searchFilter.toLowerCase()) ||
          acc.name.toLowerCase().includes(searchFilter.toLowerCase());
        return matchGroup && matchSearch;
      })
      .sort((a, b) => {
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

  const availableGroups = ["All", "My Accounts", "Creators", "Global Icons", "Competitors"];

  return (
    <div className="space-y-4">
      {/* Section Header matching Screenshot */}
      <div className="text-center max-w-2xl mx-auto space-y-1 pt-2">
        <h2 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-indigo-500 via-sky-400 to-cyan-400 bg-clip-text text-transparent pb-1.5 pt-0.5 leading-tight">
          Powerful Tracking Dashboard
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          Track <span className="font-semibold text-slate-800 dark:text-slate-200">multiple Instagram accounts</span> and assign them to{" "}
          <span className="font-semibold text-slate-800 dark:text-slate-200">different groups</span>: Your accounts, competitors,
          clients, and global benchmarks. Click any account to audit its profile.
        </p>
      </div>

      <div className="bg-white dark:bg-[#161F30] rounded-2xl border border-slate-200/80 dark:border-[#243048] p-6 shadow-sm space-y-4">
        {/* Top Control Bar with Search, Group Pills & Add Button */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-[#243048]">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Tracked Accounts &amp; Industry Benchmarks
              </h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-[#1E2638] text-slate-700 dark:text-slate-300 font-semibold border border-slate-200/60 dark:border-slate-700/60">
                Tracking {filteredAccounts.length} {selectedGroup === "All" ? "accounts" : `in ${selectedGroup}`} ({accounts.length} total)
              </span>

              {lastRemoved && (
                <button
                  onClick={handleUndoRemove}
                  className="inline-flex items-center space-x-1 text-xs px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900 transition-colors font-medium shadow-xs"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Undo untrack @{lastRemoved.handle}</span>
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Click any row to audit live analytics, or use the action buttons to set primary, open Instagram, or untrack.
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
              {availableGroups.map((grp) => (
                <button
                  key={grp}
                  onClick={() => setSelectedGroup(grp)}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    selectedGroup === grp
                      ? "bg-[#6366F1] text-white shadow-xs font-bold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {grp}
                </button>
              ))}
            </div>

            {/* Add Accounts Button */}
            <button
              onClick={onAddAccountClick}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-[#6366F1] hover:bg-[#5558E6] text-white text-xs font-bold shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Accounts</span>
            </button>

            {/* Reset Defaults button */}
            <button
              onClick={handleResetDefaults}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-[#243048] hover:bg-slate-100 dark:hover:bg-[#1E2638] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
              title="Reset table to default showcase accounts"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-[#243048]">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-[#243048] text-[11px] font-mono uppercase text-slate-400 bg-slate-50/50 dark:bg-[#141B2B]">
                <th className="sticky left-0 z-20 bg-slate-50 dark:bg-[#141B2B] py-3 px-4 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)] dark:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.35)] border-r border-slate-100 dark:border-[#243048] min-w-[240px]">
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
                <th className="py-3 px-3 text-right pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#243048]">
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="space-y-2">
                      <p className="font-semibold text-slate-600 dark:text-slate-300">
                        No accounts found in &ldquo;{selectedGroup}&rdquo;
                      </p>
                      <p className="text-[11px]">
                        Click <span className="text-indigo-500 font-bold">+ Add Accounts</span> or switch groups to view tracked creators.
                      </p>
                      <button
                        onClick={handleResetDefaults}
                        className="mt-2 inline-flex items-center space-x-1 text-xs text-indigo-500 hover:underline"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Restore default list</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((acc) => {
                  const isPrimary = acc.handle.toLowerCase() === primaryHandle.toLowerCase();

                  return (
                    <tr
                      key={acc.handle}
                      onClick={() => onSelectAccount?.(acc.handle)}
                      className={`hover:bg-slate-50/80 dark:hover:bg-[#1E2638]/70 transition-colors cursor-pointer group ${
                        isPrimary ? "bg-indigo-50/30 dark:bg-indigo-950/20" : ""
                      }`}
                      title={`Click to audit @${acc.handle}`}
                    >
                      {/* Account Avatar + Handle (Permanently Pinned on Left) */}
                      <td className="sticky left-0 z-10 bg-white dark:bg-[#161F30] group-hover:bg-slate-50 dark:group-hover:bg-[#1E2638] py-3 px-4 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)] dark:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.35)] border-r border-slate-100 dark:border-[#243048] min-w-[240px] transition-colors">
                        <div className="flex items-center space-x-3">
                          <img
                            key={acc.handle}
                            src={acc.avatar}
                            alt={acc.name}
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
                              const apiBase = process.env.NEXT_PUBLIC_API_URL || (isHttps ? "https://sociotrack-api.onrender.com" : "http://localhost:8000");
                              const clean = acc.handle.replace(/^@/, "").toLowerCase().trim();
                              const proxyUrl = `${apiBase}/api/creators/${encodeURIComponent(clean)}/avatar`;

                              if (target.src !== proxyUrl && !target.dataset.triedProxy) {
                                target.dataset.triedProxy = "1";
                                target.src = proxyUrl;
                                return;
                              }
                              target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(clean)}&backgroundColor=4f46e5,06b6d4,10b981&textColor=ffffff`;
                            }}
                            className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-[#243048] group-hover:ring-2 group-hover:ring-indigo-500 transition-all shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center space-x-1 font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                              <span>@{acc.handle}</span>
                              {acc.isVerified && (
                                <span className="w-3.5 h-3.5 rounded-full bg-[#0095F6] text-white flex items-center justify-center text-[8px] font-black shrink-0">
                                  ✓
                                </span>
                              )}
                              {acc.isPrivate && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-400 font-bold shrink-0">
                                  🔒
                                </span>
                              )}
                              {isPrimary && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] bg-indigo-500 text-white font-extrabold uppercase shrink-0">
                                  Hero
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate max-w-[160px]">
                              {acc.name}
                            </div>
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

                      {/* Group Tag / Interactive Switcher */}
                      <td className="py-3 px-3">
                        <div className="relative inline-block">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingGroupId(editingGroupId === acc.handle ? null : acc.handle);
                            }}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-[#1E2638] dark:hover:bg-[#2A374F] text-slate-700 dark:text-slate-300 transition-colors flex items-center space-x-1"
                            title="Click to change group"
                          >
                            <span>{acc.group}</span>
                            <ChevronDown className="w-2.5 h-2.5 opacity-60" />
                          </button>

                          {/* Quick Group Popover */}
                          {editingGroupId === acc.handle && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute z-30 left-0 mt-1 w-36 bg-white dark:bg-[#1A2338] border border-slate-200 dark:border-[#2C3B59] rounded-xl shadow-xl p-1 text-xs space-y-0.5 animate-scale-up"
                            >
                              {["My Accounts", "Creators", "Global Icons", "Competitors"].map((grp) => (
                                <button
                                  key={grp}
                                  onClick={(e) => handleUpdateGroup(acc.handle, grp, e)}
                                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-medium flex items-center justify-between ${
                                    acc.group === grp
                                      ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold"
                                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#243048]"
                                  }`}
                                >
                                  <span>{grp}</span>
                                  {acc.group === grp && <Check className="w-3 h-3 text-indigo-500" />}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Dedicated Actions Column */}
                      <td className="py-3 px-3 text-right pr-4">
                        <div className="flex items-center justify-end space-x-1">
                          {/* Star / Set as Hero Primary button */}
                          <button
                            onClick={(e) => handleSetPrimary(e, acc.handle)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isPrimary
                                ? "bg-amber-100 dark:bg-amber-950 text-amber-500"
                                : "text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-[#1E2638]"
                            }`}
                            title={isPrimary ? "Current Hero Account" : "Pin as Hero Account on top"}
                          >
                            <Star className={`w-3.5 h-3.5 ${isPrimary ? "fill-current" : ""}`} />
                          </button>

                          {/* Open Instagram in new window */}
                          <button
                            onClick={(e) => handleOpenInstagram(e, acc.handle)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#E1306C] hover:bg-slate-100 dark:hover:bg-[#1E2638] transition-colors"
                            title="Open profile on Instagram"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>

                          {/* Remove / Untrack button */}
                          <button
                            onClick={(e) => handleRemoveAccount(e, acc)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                            title="Untrack / Remove this account"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
