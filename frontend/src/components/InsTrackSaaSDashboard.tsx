"use client";

import React, { useState } from "react";
import {
  LayoutDashboard,
  Star,
  Users,
  Palette,
  Zap,
  Sun,
  Moon,
  Plus,
  ArrowUpDown,
  ChevronDown,
  Info,
  CheckCircle2,
  ExternalLink,
  Shield,
  Clock,
  Sparkles,
  Search,
  Filter,
  Trash2,
  FileSpreadsheet,
  FileText,
  Mail,
  Send,
  Upload,
  Settings,
  CreditCard,
  LogOut,
  Check,
  X,
} from "lucide-react";
import { InsTrackAddAccountModal } from "./InsTrackAddAccountModal";

export type SaaSTab = "dashboard" | "top_accounts" | "clients" | "branding" | "zapier";

interface TrackedAccountItem {
  id: string;
  handle: string;
  name: string;
  avatar: string;
  followers: number;
  followersDelta: string;
  isPositiveFollowers: boolean;
  following: number;
  followingDelta: string;
  mediaCount: number;
  mediaDelta: string;
  engagementRate: number;
  group: string;
}

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

const INITIAL_TRACKED: TrackedAccountItem[] = [
  {
    id: "t1",
    handle: "arnav.patel07",
    name: "Arnav Patel 👾",
    avatar: `${BASE_PATH}/avatars/arnav.patel07.png`,
    followers: 13,
    followersDelta: "+1 (+0.50%)",
    isPositiveFollowers: true,
    following: 61,
    followingDelta: "+0 (+0.0%)",
    mediaCount: 0,
    mediaDelta: "+0 (+0.0%)",
    engagementRate: 12.50,
    group: "My Business",
  },
  {
    id: "t2",
    handle: "techno_gamerz",
    name: "Ujjwal Chaurasia | Techno Gamerz",
    avatar: `${BASE_PATH}/avatars/techno_gamerz.png`,
    followers: 2000000,
    followersDelta: "+10,000 (+0.5%)",
    isPositiveFollowers: true,
    following: 3,
    followingDelta: "+0 (+0.0%)",
    mediaCount: 33,
    mediaDelta: "+0 (+0.0%)",
    engagementRate: 14.80,
    group: "Competitors",
  },
];

interface ClientItem {
  id: string;
  name: string;
  type: string;
  accounts: string[];
  reportCadence: "Daily" | "Weekly" | "Monthly";
  dateAdded: string;
}

const INITIAL_CLIENTS: ClientItem[] = [
  {
    id: "cl1",
    name: "Acme Agency Global",
    type: "Marketing Agency",
    accounts: ["@arnav.patel07", "@acmemedia"],
    reportCadence: "Weekly",
    dateAdded: "Oct 14, 2026",
  },
  {
    id: "cl2",
    name: "Horizon Studio London",
    type: "Creator Management",
    accounts: ["@horizonlondon"],
    reportCadence: "Monthly",
    dateAdded: "Nov 01, 2026",
  },
];

// Top accounts from video 4 & 5 (Screenshot 11)
interface TopAccountLeaderboard {
  rank: number;
  handle: string;
  name: string;
  avatar: string;
  followers: number;
  following: number;
  mediaCount: number;
  engagementRate: number;
}

const TOP_ACCOUNTS: TopAccountLeaderboard[] = [
  { rank: 9, handle: "beyonce", name: "Beyoncé", avatar: "https://unavatar.io/x/beyonce?fallback=https://api.dicebear.com/7.x/initials/svg?seed=beyonce", followers: 298432246, following: 1, mediaCount: 2443, engagementRate: 0.51 },
  { rank: 10, handle: "khloekardashian", name: "Khloé Kardashian", avatar: "https://unavatar.io/x/khloekardashian?fallback=https://api.dicebear.com/7.x/initials/svg?seed=khloekardashian", followers: 291188610, following: 155, mediaCount: 4920, engagementRate: 0.00 },
  { rank: 11, handle: "nike", name: "Nike", avatar: "https://unavatar.io/x/nike?fallback=https://api.dicebear.com/7.x/initials/svg?seed=nike", followers: 290822754, following: 269, mediaCount: 1678, engagementRate: 0.03 },
  { rank: 12, handle: "justinbieber", name: "Justin Bieber", avatar: "https://unavatar.io/x/justinbieber?fallback=https://api.dicebear.com/7.x/initials/svg?seed=justinbieber", followers: 285749761, following: 923, mediaCount: 9023, engagementRate: 0.49 },
  { rank: 13, handle: "kendalljenner", name: "Kendall", avatar: "https://unavatar.io/x/kendalljenner?fallback=https://api.dicebear.com/7.x/initials/svg?seed=kendalljenner", followers: 277639274, following: 281, mediaCount: 613, engagementRate: 0.62 },
  { rank: 14, handle: "taylorswift", name: "Taylor Swift", avatar: "https://unavatar.io/x/taylorswift13?fallback=https://api.dicebear.com/7.x/initials/svg?seed=taylorswift", followers: 272259393, following: 0, mediaCount: 714, engagementRate: 1.73 },
  { rank: 15, handle: "virat.kohli", name: "Virat Kohli", avatar: "https://unavatar.io/x/imVkohli?fallback=https://api.dicebear.com/7.x/initials/svg?seed=viratkohli", followers: 271155843, following: 279, mediaCount: 1058, engagementRate: 2.86 },
  { rank: 16, handle: "natgeo", name: "National Geographic", avatar: "https://unavatar.io/x/natgeo?fallback=https://api.dicebear.com/7.x/initials/svg?seed=natgeo", followers: 268192922, following: 195, mediaCount: 32171, engagementRate: 0.03 },
  { rank: 17, handle: "neymarjr", name: "Neymar Jr", avatar: "https://unavatar.io/x/neymarjr?fallback=https://api.dicebear.com/7.x/initials/svg?seed=neymarjr", followers: 241070209, following: 1987, mediaCount: 6101, engagementRate: 2.42 },
  { rank: 18, handle: "jlo", name: "Jennifer Lopez", avatar: "https://unavatar.io/x/jlo?fallback=https://api.dicebear.com/7.x/initials/svg?seed=jlo", followers: 239645083, following: 2079, mediaCount: 1240, engagementRate: 0.16 },
  { rank: 19, handle: "kourtneykardash", name: "Kourtney Kardashian Barker", avatar: "https://unavatar.io/x/kourtneykardash?fallback=https://api.dicebear.com/7.x/initials/svg?seed=kourtneykardash", followers: 208842932, following: 159, mediaCount: 4689, engagementRate: 0.03 },
  { rank: 20, handle: "mileycyrus", name: "Miley", avatar: "https://unavatar.io/x/mileycyrus?fallback=https://api.dicebear.com/7.x/initials/svg?seed=mileycyrus", followers: 205208239, following: 0, mediaCount: 1582, engagementRate: 0.16 },
  { rank: 21, handle: "katyperry", name: "KATY PERRY", avatar: "https://unavatar.io/x/katyperry?fallback=https://api.dicebear.com/7.x/initials/svg?seed=katyperry", followers: 194938143, following: 867, mediaCount: 2828, engagementRate: 0.00 },
  { rank: 22, handle: "realmadrid", name: "Real Madrid C.F.", avatar: "https://unavatar.io/x/realmadrid?fallback=https://api.dicebear.com/7.x/initials/svg?seed=realmadrid", followers: 182533354, following: 66, mediaCount: 22275, engagementRate: 0.19 },
  { rank: 23, handle: "zendaya", name: "Zendaya", avatar: "https://unavatar.io/x/zendaya?fallback=https://api.dicebear.com/7.x/initials/svg?seed=zendaya", followers: 178308489, following: 0, mediaCount: 3512, engagementRate: 3.69 },
];

interface InsTrackSaaSDashboardProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onViewPublicProfile: (handle?: string) => void;
  onOpenSurvey: () => void;
}

export function InsTrackSaaSDashboard({
  isDarkMode,
  onToggleTheme,
  onViewPublicProfile,
  onOpenSurvey,
}: InsTrackSaaSDashboardProps) {
  const [activeTab, setActiveTab] = useState<SaaSTab>("dashboard");
  const [trackedAccounts, setTrackedAccounts] = useState<TrackedAccountItem[]>(INITIAL_TRACKED);
  const [clients, setClients] = useState<ClientItem[]>(INITIAL_CLIENTS);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [selectedSort, setSelectedSort] = useState("Highest Followers Change");
  const [selectedGroupFilter, setSelectedGroupFilter] = useState("All Accounts");
  const [settingsSubTab, setSettingsSubTab] = useState<"Account" | "Password" | "Email Reports" | "Branding" | "Other">("Account");

  // Profile Dropdown state
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Email verification prompt state
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  // Settings form states
  const [fullName, setFullName] = useState("ioij");
  const [email, setEmail] = useState("the13fool@gmail.com");
  const [accountType, setAccountType] = useState("Influencer / Creator");
  const [settingsSuccessNotice, setSettingsSuccessNotice] = useState("");

  // White-label branding states (Matching Video 2)
  const [brandName, setBrandName] = useState("ioij");
  const [brandColor, setBrandColor] = useState("#6366F1");
  const [brandNamePartOfLogo, setBrandNamePartOfLogo] = useState(false);
  const [useBrandedEmail, setUseBrandedEmail] = useState(false);

  const handleAddAccount = (handle: string) => {
    const cleanHandle = handle.replace(/^@/, "");
    if (trackedAccounts.some((a) => a.handle.toLowerCase() === cleanHandle.toLowerCase())) {
      return;
    }

    const newAccount: TrackedAccountItem = {
      id: "t_" + Date.now(),
      handle: cleanHandle,
      name: cleanHandle.charAt(0).toUpperCase() + cleanHandle.slice(1),
      avatar: `https://unavatar.io/x/${cleanHandle}?fallback=https://api.dicebear.com/7.x/initials/svg?seed=${cleanHandle}`,
      followers: 86420,
      followersDelta: "+1,420 (+1.67%)",
      isPositiveFollowers: true,
      following: 340,
      followingDelta: "+5 (+1.49%)",
      mediaCount: 280,
      mediaDelta: "+4 (+1.45%)",
      engagementRate: 2.85,
      group: "Competitors",
    };

    setTrackedAccounts((prev) => [newAccount, ...prev]);
  };

  const handleRemoveAccount = (id: string) => {
    setTrackedAccounts((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSaveSettings = (section: string) => {
    setSettingsSuccessNotice(`${section} updated successfully.`);
    setTimeout(() => setSettingsSuccessNotice(""), 3000);
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col md:flex-row font-sans selection:bg-[#6366F1] selection:text-white">
      {/* 1. LEFT SIDEBAR NAVIGATION (Matching Video 4 & 5) */}
      <aside className="w-full md:w-60 bg-[#0E1526] border-r border-[#1E2638] flex flex-col shrink-0 select-none">
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-[#1E2638]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#6366F1] to-[#06B6D4] flex items-center justify-center shadow-md">
              <span className="text-white text-xs font-black">📈</span>
            </div>
            <span className="text-lg font-black tracking-tight text-white">SocioTrack</span>
          </div>
          <div className="w-4 h-4 rounded-full border border-slate-600 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          </div>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="p-3 space-y-1 flex-1">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "dashboard"
                ? "bg-[#6366F1]/20 text-[#818CF8] border border-[#6366F1]/30 shadow-xs"
                : "text-slate-400 hover:text-white hover:bg-[#161F30]"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab("top_accounts")}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "top_accounts"
                ? "bg-[#6366F1]/20 text-[#818CF8] border border-[#6366F1]/30 shadow-xs"
                : "text-slate-400 hover:text-white hover:bg-[#161F30]"
            }`}
          >
            <Star className="w-4 h-4" />
            <span>Top Accounts</span>
          </button>

          <button
            onClick={() => setActiveTab("clients")}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "clients"
                ? "bg-[#6366F1]/20 text-[#818CF8] border border-[#6366F1]/30 shadow-xs"
                : "text-slate-400 hover:text-white hover:bg-[#161F30]"
            }`}
          >
            <div className="flex items-center space-x-3">
              <Users className="w-4 h-4" />
              <span>Clients</span>
            </div>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              new
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab("branding");
              setSettingsSubTab("Branding");
            }}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "branding"
                ? "bg-[#6366F1]/20 text-[#818CF8] border border-[#6366F1]/30 shadow-xs"
                : "text-slate-400 hover:text-white hover:bg-[#161F30]"
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Branding</span>
          </button>

          <button
            onClick={() => setActiveTab("zapier")}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "zapier"
                ? "bg-[#6366F1]/20 text-[#818CF8] border border-[#6366F1]/30 shadow-xs"
                : "text-slate-400 hover:text-white hover:bg-[#161F30]"
            }`}
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Zapier</span>
          </button>
        </nav>

        {/* Bottom Switcher: Jump back to Public Creator Audit (@arnav.patel07) */}
        <div className="p-4 border-t border-[#1E2638] space-y-2">
          <div className="p-3 rounded-xl bg-[#161F30] border border-[#243048]">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span>Auditing Account</span>
              <span className="text-[#818CF8] font-bold">Live</span>
            </div>
            <div className="text-xs font-bold text-white truncate">@arnav.patel07</div>
            <button
              onClick={() => onViewPublicProfile("arnav.patel07")}
              className="mt-2.5 w-full py-1.5 rounded-lg bg-[#6366F1] hover:bg-[#5558E6] text-white text-[11px] font-bold flex items-center justify-center space-x-1.5 transition-colors"
            >
              <span>View Public Report</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. MAIN APP PORTAL */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP BAR (Workspace title, Feedback, User profile IO, and Theme toggle on extreme right) */}
        <header className="h-16 bg-[#0E1526]/90 backdrop-blur-md border-b border-[#1E2638] px-6 flex items-center justify-between shrink-0 relative z-30">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-semibold text-slate-400">Workspace Dashboard</span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={onOpenSurvey}
              className="text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Feedback
            </button>

            {/* User Profile Pill matching Video 1, 2, 4, 5 */}
            <div className="relative">
              <div
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center space-x-2 pl-2 cursor-pointer group select-none"
              >
                <span className="text-xs font-medium text-slate-300 group-hover:text-white">
                  {fullName}
                </span>
                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-900 font-bold text-xs flex items-center justify-center ring-2 ring-[#6366F1]/50 shadow-sm">
                  IO
                </div>
              </div>

              {/* Profile Dropdown Menu matching Video 1 */}
              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-[#161F30] border border-[#243048] shadow-2xl py-1 z-50 animate-scale-up text-xs">
                  <button
                    onClick={() => {
                      setActiveTab("branding");
                      setSettingsSubTab("Account");
                      setShowProfileDropdown(false);
                    }}
                    className="w-full flex items-center space-x-2.5 px-4 py-2.5 text-slate-300 hover:text-white hover:bg-[#1E2638] transition-colors"
                  >
                    <Settings className="w-4 h-4 text-[#818CF8]" />
                    <span>Settings</span>
                  </button>
                  <button
                    onClick={() => {
                      onOpenSurvey();
                      setShowProfileDropdown(false);
                    }}
                    className="w-full flex items-center space-x-2.5 px-4 py-2.5 text-slate-300 hover:text-white hover:bg-[#1E2638] transition-colors"
                  >
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                    <span>Billing</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowVerifyModal(true);
                      setShowProfileDropdown(false);
                    }}
                    className="w-full flex items-center space-x-2.5 px-4 py-2.5 text-slate-300 hover:text-white hover:bg-[#1E2638] transition-colors"
                  >
                    <Mail className="w-4 h-4 text-amber-400" />
                    <span>Verify Email</span>
                  </button>
                  <div className="border-t border-[#243048] my-1" />
                  <button
                    onClick={() => {
                      setShowProfileDropdown(false);
                      onViewPublicProfile("arnav.patel07");
                    }}
                    className="w-full flex items-center space-x-2.5 px-4 py-2.5 text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>

            {/* Extreme Right: Sun / Moon Toggle */}
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-xl border border-[#243048] hover:bg-[#161F30] text-slate-300 transition-colors"
              title="Toggle Theme"
              aria-label="Toggle Theme"
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-[#818CF8]" />
              )}
            </button>
          </div>
        </header>

        {/* NOTIFICATION NOTICE */}
        {settingsSuccessNotice && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-6 py-2.5 text-xs text-emerald-400 flex items-center space-x-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>{settingsSuccessNotice}</span>
          </div>
        )}

        {/* 3. DYNAMIC TAB CONTENT */}
        <main className="flex-1 p-6 sm:p-8 overflow-y-auto space-y-6">
          {/* TAB 1: DASHBOARD (TRACKED ACCOUNTS) */}
          {activeTab === "dashboard" && (
            <div className="space-y-6 animate-fade-in">
              {/* Green Free Trial Banner matching Video 4 & 5 */}
              <div className="rounded-xl bg-[#064E3B]/30 border border-[#059669]/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center space-x-2.5 text-emerald-300">
                  <Info className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>Your free trial has started and will expire in 14 days from now</span>
                </div>
                <button
                  onClick={onOpenSurvey}
                  className="px-4 py-1.5 rounded-lg bg-[#10B981] hover:bg-[#059669] text-white font-bold text-xs shadow-sm transition-colors self-start sm:self-auto"
                >
                  Upgrade
                </button>
              </div>

              {/* Page Title & Add Accounts Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl font-bold text-white tracking-tight">Tracked Accounts</h1>
                  <p className="text-xs text-slate-400 mt-0.5">
                    You&apos;re tracking {trackedAccounts.length} accounts out of 2 available
                  </p>
                </div>

                <button
                  onClick={() => setShowAddAccountModal(true)}
                  className="px-4 py-2 rounded-xl bg-[#6366F1] hover:bg-[#5558E6] text-white text-xs font-bold shadow-md transition-all flex items-center space-x-2 self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Accounts</span>
                </button>
              </div>

              {/* Filter Pills Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Left: All Accounts Dropdown */}
                <div className="relative">
                  <button className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-[#243048] bg-[#161F30] text-xs font-semibold text-slate-200 hover:border-slate-500 transition-colors">
                    <span>≡ {selectedGroupFilter}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>

                {/* Right: Sort Method & Last 7 Days */}
                <div className="flex items-center space-x-2">
                  <button className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-[#243048] bg-[#161F30] text-xs font-medium text-slate-300 hover:border-slate-500 transition-colors">
                    <span>Sort Method</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  <button className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-[#243048] bg-[#161F30] text-xs font-medium text-slate-300 hover:border-slate-500 transition-colors">
                    <span>Last 7 Days</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Tracked Accounts Table */}
              <div className="rounded-2xl border border-[#1E2638] bg-[#161F30] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#243048] text-[11px] font-mono uppercase text-slate-400 bg-[#0E1526]/50">
                        <th className="py-3 px-4">Account</th>
                        <th className="py-3 px-4">Followers Count</th>
                        <th className="py-3 px-4">Following Count</th>
                        <th className="py-3 px-4">Media Count</th>
                        <th className="py-3 px-4">Engagement Rate</th>
                        <th className="py-3 px-4">Groups</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1E2638]">
                      {trackedAccounts.map((acc) => (
                        <tr
                          key={acc.id}
                          className="hover:bg-[#1E2638]/50 transition-colors group"
                        >
                          {/* Account */}
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-3">
                              <img
                                src={acc.avatar}
                                alt={acc.name}
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  const clean = acc.handle.replace(/^@/, "").toLowerCase().trim();
                                  target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(clean)}&backgroundColor=4f46e5,06b6d4,10b981&textColor=ffffff`;
                                }}
                                className="w-8 h-8 rounded-full object-cover border border-[#243048]"
                              />
                              <div>
                                <div className="font-bold text-white flex items-center space-x-1.5">
                                  <span>@{acc.handle}</span>
                                </div>
                                <div className="text-[11px] text-slate-400">{acc.name}</div>
                              </div>
                            </div>
                          </td>

                          {/* Followers */}
                          <td className="py-3 px-4 font-mono">
                            <div className="font-bold text-white">
                              {acc.followers.toLocaleString()}
                            </div>
                            <div className="text-[10px] font-semibold text-emerald-400">
                              {acc.followersDelta}
                            </div>
                          </td>

                          {/* Following */}
                          <td className="py-3 px-4 font-mono">
                            <div className="text-slate-300 font-medium">{acc.following}</div>
                            <div className="text-[10px] font-semibold text-emerald-400">
                              {acc.followingDelta}
                            </div>
                          </td>

                          {/* Media */}
                          <td className="py-3 px-4 font-mono">
                            <div className="text-slate-300 font-medium">{acc.mediaCount}</div>
                            <div className="text-[10px] font-semibold text-emerald-400">
                              {acc.mediaDelta}
                            </div>
                          </td>

                          {/* Engagement */}
                          <td className="py-3 px-4 font-mono">
                            <div className="font-bold text-white">
                              {acc.engagementRate.toFixed(2)}%
                            </div>
                            <div className="text-[10px] text-slate-400">vs niche avg 1.84%</div>
                          </td>

                          {/* Group Pill */}
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#0B0F19] text-slate-300 border border-[#243048]">
                              <span>{acc.group}</span>
                              <ChevronDown className="w-3 h-3 text-slate-400" />
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => onViewPublicProfile(acc.handle)}
                                className="px-2.5 py-1 rounded-lg bg-[#6366F1]/20 hover:bg-[#6366F1]/30 text-[#818CF8] text-[11px] font-bold transition-colors"
                              >
                                View Report
                              </button>
                              {trackedAccounts.length > 1 && (
                                <button
                                  onClick={() => handleRemoveAccount(acc.id)}
                                  className="p-1 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                                  title="Stop tracking account"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CLIENTS (Matching instrack.app/clients from Video 2) */}
          {activeTab === "clients" && (
            <div className="space-y-6 animate-fade-in">
              {/* Notice Banner */}
              <div className="rounded-xl bg-[#161F30] border border-[#243048] p-4 text-xs text-slate-300 flex items-center space-x-3">
                <Info className="w-4 h-4 text-[#818CF8] shrink-0" />
                <span>
                  Setup your clients so they receive periodic email reports of their Instagram accounts.
                </span>
              </div>

              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-white tracking-tight">Clients</h1>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Managing {clients.length} active client workspaces
                  </p>
                </div>
                <button
                  onClick={() => {
                    const newCl: ClientItem = {
                      id: "cl_" + Date.now(),
                      name: "New Enterprise Partner",
                      type: "Brand",
                      accounts: ["@arnav.patel07"],
                      reportCadence: "Weekly",
                      dateAdded: "Just now",
                    };
                    setClients((prev) => [...prev, newCl]);
                    handleSaveSettings("Client Workspace");
                  }}
                  className="px-4 py-2 rounded-xl bg-[#6366F1] hover:bg-[#5558E6] text-white text-xs font-bold shadow-md transition-all flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add a New Client</span>
                </button>
              </div>

              {/* Clients Table */}
              <div className="rounded-2xl border border-[#1E2638] bg-[#161F30] overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#243048] text-[11px] font-mono uppercase text-slate-400 bg-[#0E1526]/50">
                      <th className="py-3 px-4">Client</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Instagram Accounts</th>
                      <th className="py-3 px-4">Email Reports</th>
                      <th className="py-3 px-4">Date Added</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E2638]">
                    {clients.map((cl) => (
                      <tr key={cl.id} className="hover:bg-[#1E2638]/50 transition-colors">
                        <td className="py-3 px-4 font-bold text-white">{cl.name}</td>
                        <td className="py-3 px-4 text-slate-300">{cl.type}</td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {cl.accounts.map((acc) => (
                              <span
                                key={acc}
                                className="px-2 py-0.5 rounded bg-[#0B0F19] border border-[#243048] text-[11px] text-[#818CF8]"
                              >
                                {acc}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[11px] font-semibold">
                            <Mail className="w-3 h-3" />
                            <span>{cl.reportCadence}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400">{cl.dateAdded}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleSaveSettings(`Reports dispatched to ${cl.name}`)}
                            className="px-3 py-1 rounded-lg bg-[#6366F1]/20 hover:bg-[#6366F1]/30 text-[#818CF8] text-[11px] font-bold"
                          >
                            Send Report
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: BRANDING & SETTINGS (Matching instrack.app/settings & /settings/branding from Video 1 & 2) */}
          {activeTab === "branding" && (
            <div className="space-y-6 animate-fade-in max-w-4xl">
              {/* Secondary Tabs */}
              <div className="flex items-center space-x-2 border-b border-[#1E2638] pb-3">
                {(["Account", "Password", "Email Reports", "Branding", "Other"] as const).map((sub) => (
                  <button
                    key={sub}
                    onClick={() => setSettingsSubTab(sub)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      settingsSubTab === sub
                        ? "bg-[#6366F1] text-white shadow-md"
                        : "text-slate-400 hover:text-white hover:bg-[#161F30]"
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>

              {/* Sub-view: Account Settings */}
              {settingsSubTab === "Account" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Card: Account Information */}
                  <div className="rounded-2xl border border-[#1E2638] bg-[#161F30] p-6 space-y-5">
                    <h3 className="text-sm font-bold text-white">Account Information</h3>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full h-10 px-3.5 rounded-xl border border-[#243048] bg-[#0B0F19] text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-semibold text-slate-400">
                            Email
                          </label>
                          <button
                            onClick={() => setShowVerifyModal(true)}
                            className="text-[10px] text-amber-400 font-semibold hover:underline"
                          >
                            (Not Verified - Click to Verify)
                          </button>
                        </div>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full h-10 px-3.5 rounded-xl border border-[#243048] bg-[#0B0F19] text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => handleSaveSettings("Account Information")}
                      className="w-full py-2.5 rounded-xl bg-[#6366F1] hover:bg-[#5558E6] text-white text-xs font-bold shadow-md transition-all"
                    >
                      Update Account Info
                    </button>
                  </div>

                  {/* Right Card: Account Type */}
                  <div className="rounded-2xl border border-[#1E2638] bg-[#161F30] p-6 space-y-5">
                    <h3 className="text-sm font-bold text-white">Account Type</h3>

                    <div className="space-y-2">
                      <p className="text-xs text-slate-400">What best describes you?</p>

                      <div className="space-y-2 pt-1">
                        {[
                          "Business / Brand",
                          "Influencer / Creator",
                          "Marketing Agency",
                          "Other",
                        ].map((type) => {
                          const isChecked = accountType === type;
                          return (
                            <label
                              key={type}
                              onClick={() => setAccountType(type)}
                              className="flex items-center space-x-3 p-2.5 rounded-xl hover:bg-[#1E2638]/50 cursor-pointer transition-colors"
                            >
                              <div
                                className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                                  isChecked
                                    ? "border-[#6366F1] bg-[#6366F1]"
                                    : "border-slate-500 bg-[#0B0F19]"
                                }`}
                              >
                                {isChecked && (
                                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                )}
                              </div>
                              <span className="text-xs text-slate-200 font-medium">{type}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      onClick={() => handleSaveSettings("Account Type")}
                      className="w-full py-2.5 rounded-xl bg-[#6366F1] hover:bg-[#5558E6] text-white text-xs font-bold shadow-md transition-all"
                    >
                      Update Account Type
                    </button>
                  </div>
                </div>
              )}

              {/* Sub-view: White-Label Branding Settings (Matching Video 2 /settings/branding) */}
              {(settingsSubTab === "Branding" || settingsSubTab === "Email Reports" || settingsSubTab === "Password" || settingsSubTab === "Other") && (
                <div className="space-y-6 animate-fade-in">
                  {/* Notice Banner matching Video 2 */}
                  <div className="rounded-xl bg-[#161F30] border border-[#243048] p-4 text-xs text-slate-300 flex items-center space-x-3">
                    <Info className="w-4 h-4 text-[#818CF8] shrink-0" />
                    <span>
                      To enable <strong className="text-white">branded white-labeled reports</strong>, just upload your brand logo. Your brand logo and name will be part of all generated client reports.
                    </span>
                  </div>

                  <div className="rounded-2xl border border-[#1E2638] bg-[#161F30] p-6 space-y-6">
                    <h3 className="text-sm font-bold text-white">Branding / White-Label Settings</h3>

                    {/* Brand Logo Upload Box */}
                    <div className="space-y-2">
                      <label className="block text-[11px] font-semibold text-slate-400">
                        Brand Logo
                      </label>
                      <div className="flex items-center space-x-4">
                        <div className="w-20 h-20 rounded-xl bg-[#1E2638] border border-[#243048] flex items-center justify-center text-slate-500 text-xs">
                          Logo
                        </div>
                        <div className="space-y-1.5">
                          <button
                            onClick={() => handleSaveSettings("Brand Logo uploaded")}
                            className="px-4 py-2 rounded-xl bg-[#6366F1] hover:bg-[#5558E6] text-white text-xs font-bold transition-colors inline-flex items-center space-x-2"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload</span>
                          </button>
                          <p className="text-[11px] text-slate-400">
                            Allowed PNG, JPG or JPEG. Max size is 1MB.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Brand Name & Color */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                          Brand Name
                        </label>
                        <input
                          type="text"
                          value={brandName}
                          onChange={(e) => setBrandName(e.target.value)}
                          className="w-full h-10 px-3.5 rounded-xl border border-[#243048] bg-[#0B0F19] text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                        />
                        <label className="flex items-center space-x-2 pt-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={brandNamePartOfLogo}
                            onChange={(e) => setBrandNamePartOfLogo(e.target.checked)}
                            className="rounded border-[#243048] bg-[#0B0F19] text-[#6366F1] focus:ring-0"
                          />
                          <span className="text-[11px] text-slate-400">Brand name is part of logo</span>
                        </label>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                          Brand Color
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="color"
                            value={brandColor}
                            onChange={(e) => setBrandColor(e.target.value)}
                            className="w-10 h-10 rounded-xl border border-[#243048] bg-[#0B0F19] cursor-pointer"
                          />
                          <input
                            type="text"
                            value={brandColor}
                            onChange={(e) => setBrandColor(e.target.value)}
                            className="flex-1 h-10 px-3.5 rounded-xl border border-[#243048] bg-[#0B0F19] text-xs text-white font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Branded email option */}
                    <div className="pt-2">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={useBrandedEmail}
                          onChange={(e) => setUseBrandedEmail(e.target.checked)}
                          className="rounded border-[#243048] bg-[#0B0F19] text-[#6366F1] focus:ring-0"
                        />
                        <span className="text-xs text-slate-300">
                          Use branded email address for client email reports
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#6366F1]/20 text-[#818CF8]">
                          Requires Verification
                        </span>
                      </label>
                    </div>

                    <button
                      onClick={() => handleSaveSettings("Branding / White-Label Settings")}
                      className="w-full py-2.5 rounded-xl bg-[#6366F1] hover:bg-[#5558E6] text-white text-xs font-bold shadow-md transition-all"
                    >
                      Update Branding Settings
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: TOP ACCOUNTS (Matching Video 3 & 4: /top-accounts Leaderboard) */}
          {activeTab === "top_accounts" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-white tracking-tight">Top Accounts</h1>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Benchmark against top global creators &amp; viral leaders in your niche
                  </p>
                </div>
              </div>

              {/* Full Leaderboard Table matching Video 3 */}
              <div className="rounded-2xl border border-[#1E2638] bg-[#161F30] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#243048] text-[11px] font-mono uppercase text-slate-400 bg-[#0E1526]/50">
                        <th className="py-3 px-4">#</th>
                        <th className="py-3 px-4">Account</th>
                        <th className="py-3 px-4">Followers Count</th>
                        <th className="py-3 px-4">Following Count</th>
                        <th className="py-3 px-4">Media Count</th>
                        <th className="py-3 px-4">Engagement Rate</th>
                        <th className="py-3 px-4 text-right">Audit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1E2638]">
                      {TOP_ACCOUNTS.map((top) => (
                        <tr
                          key={top.handle}
                          className="hover:bg-[#1E2638]/50 transition-colors group cursor-pointer"
                          onClick={() => onViewPublicProfile(top.handle)}
                        >
                          <td className="py-3 px-4 font-bold text-slate-400 font-mono">
                            #{top.rank}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-3">
                              <img
                                src={top.avatar}
                                alt={top.name}
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  const clean = top.handle.replace(/^@/, "").toLowerCase().trim();
                                  target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(clean)}&backgroundColor=4f46e5,06b6d4,10b981&textColor=ffffff`;
                                }}
                                className="w-8 h-8 rounded-full object-cover border border-[#243048]"
                              />
                              <div>
                                <div className="font-bold text-white group-hover:text-[#818CF8] transition-colors">
                                  {top.name}
                                </div>
                                <div className="text-[11px] text-slate-400">@{top.handle}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-white">
                            {top.followers.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-300">
                            {top.following.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-300">
                            {top.mediaCount.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 font-mono">
                            <span
                              className={`font-bold ${
                                top.engagementRate > 1.5
                                  ? "text-emerald-400"
                                  : "text-slate-300"
                              }`}
                            >
                              {top.engagementRate.toFixed(2)}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onViewPublicProfile(top.handle);
                              }}
                              className="px-3 py-1 rounded-lg bg-[#6366F1]/20 group-hover:bg-[#6366F1] text-[#818CF8] group-hover:text-white text-[11px] font-bold transition-all"
                            >
                              Audit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ZAPIER & WEBHOOK AUTOMATION */}
          {activeTab === "zapier" && (
            <div className="space-y-6 animate-fade-in max-w-3xl">
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">Zapier &amp; Meta Webhooks</h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Automate AI post generation and real-time Instagram webhook ingestion
                </p>
              </div>

              <div className="rounded-2xl border border-[#1E2638] bg-[#161F30] p-6 space-y-4">
                <div className="flex items-center space-x-3 text-emerald-400">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <div className="text-xs font-bold">Meta Graph API Handshake Active</div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Your webhook is configured to receive live Instagram story replies, reel comments, and follow events.
                  The autonomous agent immediately recalculates engagement scores and updates Vectorize.io persistent memory.
                </p>

                <div className="p-3 rounded-xl bg-[#0B0F19] border border-[#243048] font-mono text-[11px] text-slate-300">
                  Endpoint: <span className="text-[#818CF8]">POST /api/webhooks/instagram</span>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* BOTTOM SAAS FOOTER */}
        <footer className="border-t border-[#1E2638] bg-[#0E1526] px-8 py-6 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center sm:space-x-3 gap-1">
            <span className="font-extrabold text-white text-sm">SocioTrack</span>
            <span className="text-[11px] text-slate-400">
              SocioTrack is a product by Zyrohouse, an emerging startup.
            </span>
          </div>
          <div className="flex items-center space-x-6 text-[11px]">
            <button
              onClick={() => setActiveTab("top_accounts")}
              className="hover:text-slate-300 transition-colors"
            >
              Top Accounts
            </button>
            <button onClick={onOpenSurvey} className="hover:text-slate-300 transition-colors">
              Feedback Survey
            </button>
            <span className="hover:text-slate-300 cursor-pointer">Terms &amp; Privacy</span>
          </div>
        </footer>
      </div>

      {/* VERIFY EMAIL MODAL DIALOG (Matching Video 1 & Video 3 /verify-email) */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#161F30] border border-[#243048] rounded-2xl w-full max-w-md shadow-2xl p-8 text-center space-y-5 animate-scale-up">
            <div className="flex items-center justify-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-[#1E2638] border border-[#243048] flex items-center justify-center text-slate-400">
                <Mail className="w-6 h-6 text-slate-300" />
              </div>
              <span className="text-slate-500 text-lg">→</span>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Check className="w-6 h-6" />
              </div>
            </div>

            <h3 className="text-xl font-bold text-white tracking-tight">Verify your email</h3>

            <p className="text-xs text-slate-300 leading-relaxed">
              We sent a verification email to <strong className="text-white">{email}</strong>.<br />
              Please click on the button in that email to continue.<br />
              Most features require email verification.
            </p>

            <p className="text-[11px] text-slate-500">
              ⓘ Check All Mail and Spam folders if you don&apos;t see the email.
            </p>

            <div className="space-y-3 pt-2">
              <button
                onClick={() => {
                  handleSaveSettings("Verification email sent");
                  setShowVerifyModal(false);
                }}
                className="w-full py-2.5 rounded-xl border border-[#6366F1] text-[#818CF8] hover:bg-[#6366F1]/10 text-xs font-bold transition-colors"
              >
                Resend Verification Email
              </button>
              <button
                onClick={() => setShowVerifyModal(false)}
                className="w-full py-2 text-slate-400 hover:text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD ACCOUNT MODAL */}
      <InsTrackAddAccountModal
        isOpen={showAddAccountModal}
        onClose={() => setShowAddAccountModal(false)}
        onAddAccount={handleAddAccount}
        onOpenProfile={onViewPublicProfile}
      />
    </div>
  );
}
