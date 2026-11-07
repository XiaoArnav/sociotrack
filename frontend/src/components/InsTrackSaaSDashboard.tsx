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

const INITIAL_TRACKED: TrackedAccountItem[] = [
  {
    id: "t1",
    handle: "thestevenmellor",
    name: "Steve | Growth Marketing",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    followers: 173435,
    followersDelta: "+4,227 (+2.5%)",
    isPositiveFollowers: true,
    following: 584,
    followingDelta: "+38 (+7.0%)",
    mediaCount: 353,
    mediaDelta: "+16 (+4.7%)",
    engagementRate: 3.8,
    group: "My Business",
  },
  {
    id: "t2",
    handle: "chhotabheem",
    name: "Chhota Bheem Official",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80",
    followers: 2450800,
    followersDelta: "+12,390 (+0.5%)",
    isPositiveFollowers: true,
    following: 42,
    followingDelta: "+0 (+0.0%)",
    mediaCount: 1840,
    mediaDelta: "+8 (+0.4%)",
    engagementRate: 4.12,
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
    accounts: ["@thestevenmellor", "@acmemedia"],
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

  // Settings form states
  const [fullName, setFullName] = useState("ioij");
  const [email, setEmail] = useState("the13fool@gmail.com");
  const [accountType, setAccountType] = useState("Influencer / Creator");
  const [settingsSuccessNotice, setSettingsSuccessNotice] = useState("");

  const handleAddAccount = (handle: string) => {
    const cleanHandle = handle.replace(/^@/, "");
    if (trackedAccounts.some((a) => a.handle.toLowerCase() === cleanHandle.toLowerCase())) {
      return;
    }

    const newAccount: TrackedAccountItem = {
      id: "t_" + Date.now(),
      handle: cleanHandle,
      name: cleanHandle.charAt(0).toUpperCase() + cleanHandle.slice(1),
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
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
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col md:flex-row font-sans">
      {/* 1. LEFT SIDEBAR NAVIGATION (Matching Screenshot 6 & Video 4 & 5) */}
      <aside className="w-full md:w-60 bg-[#0E1526] border-r border-[#1E2638] flex flex-col shrink-0 select-none">
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-[#1E2638]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#6366F1] to-[#06B6D4] flex items-center justify-center shadow-md">
              <span className="text-white text-xs font-black">📈</span>
            </div>
            <span className="text-lg font-black tracking-tight text-white">InsTrack</span>
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
            onClick={() => setActiveTab("branding")}
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

        {/* Bottom Switcher: Jump back to Public Creator Audit (@thestevenmellor) */}
        <div className="p-4 border-t border-[#1E2638] space-y-2">
          <div className="p-3 rounded-xl bg-[#161F30] border border-[#243048]">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span>Auditing Account</span>
              <span className="text-[#818CF8] font-bold">Live</span>
            </div>
            <div className="text-xs font-bold text-white truncate">@thestevenmellor</div>
            <button
              onClick={() => onViewPublicProfile("thestevenmellor")}
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
        {/* TOP BAR (Sun toggle, Pricing, User profile IO) */}
        <header className="h-16 bg-[#0E1526]/80 backdrop-blur-md border-b border-[#1E2638] px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-xl border border-[#243048] hover:bg-[#161F30] text-slate-300 transition-colors"
              title="Toggle Theme"
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-[#818CF8]" />
              )}
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={onOpenSurvey}
              className="text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Pricing
            </button>

            {/* User Avatar matching video 4 & 5: ioij IO */}
            <div
              onClick={() => setActiveTab("branding")}
              className="flex items-center space-x-2 pl-2 cursor-pointer group"
            >
              <span className="text-xs font-medium text-slate-300 group-hover:text-white">
                {fullName}
              </span>
              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-900 font-bold text-xs flex items-center justify-center ring-2 ring-[#6366F1]/50 shadow-sm">
                IO
              </div>
            </div>
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

          {/* TAB 2: CLIENTS (Matching instrack.app/clients from Video) */}
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
                      accounts: ["@thestevenmellor"],
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

          {/* TAB 3: BRANDING & SETTINGS (Matching instrack.app/settings from Video 2) */}
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

              {/* Two Column Panels matching Screenshot 7 & Video 2 */}
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
                        <span className="text-[10px] text-amber-400 font-semibold">(Not Verified)</span>
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
            </div>
          )}

          {/* TAB 4: TOP ACCOUNTS */}
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { handle: "cristiano", name: "Cristiano Ronaldo", followers: "628M", er: "2.41%", score: 98.4 },
                  { handle: "leomessi", name: "Leo Messi", followers: "502M", er: "2.89%", score: 97.2 },
                  { handle: "thestevenmellor", name: "Steve | Growth Marketing", followers: "173K", er: "3.80%", score: 70.1 },
                ].map((top) => (
                  <div key={top.handle} className="rounded-2xl border border-[#1E2638] bg-[#161F30] p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">@{top.handle}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-[#818CF8]">
                        Score {top.score}%
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">{top.name}</div>
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-[#243048]">
                      <div>
                        <div className="text-slate-400 text-[10px]">Followers</div>
                        <div className="font-bold text-white">{top.followers}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-[10px]">Eng. Rate</div>
                        <div className="font-bold text-emerald-400">{top.er}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => onViewPublicProfile(top.handle)}
                      className="w-full py-1.5 rounded-lg bg-[#0B0F19] hover:bg-[#6366F1]/20 border border-[#243048] text-slate-200 text-xs font-semibold transition-colors"
                    >
                      Audit Account
                    </button>
                  </div>
                ))}
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
      </div>

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
