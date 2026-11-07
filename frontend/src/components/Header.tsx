"use client";

import React, { useState } from "react";
import {
  Search,
  Bell,
  Calendar,
  Sparkles,
  FileText,
  Clock,
  Send,
  BrainCircuit,
  CheckCircle2,
  X,
  ExternalLink,
} from "lucide-react";
import { UserSession } from "@/components/auth/AuthPage";

export interface DashboardMetrics {
  totalDrafts: number;
  pendingApprovals: number;
  publishedPosts: number;
  insightsLearned: number;
}

interface HeaderProps {
  user: UserSession;
  metrics: DashboardMetrics;
  onSearchChange?: (val: string) => void;
  onQuickTopicSelect?: (topic: string) => void;
}

export function Header({
  user,
  metrics,
  onSearchChange,
  onQuickTopicSelect,
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  const notifications = [
    {
      id: "n1",
      title: "New Audience Preference Discovered",
      desc: "Contrarian technical takes get 3.4x more saves than generic tutorials.",
      time: "2 mins ago",
      type: "memory",
    },
    {
      id: "n2",
      title: "Draft Approved & Scheduled",
      desc: "Post scheduled for Tuesday at 2:30 PM (Peak Reply Window).",
      time: "15 mins ago",
      type: "schedule",
    },
    {
      id: "n3",
      title: "Viral Ingestion Triggered",
      desc: "Reinforcement score: 8.42 composite. Topic weight boosted +0.4.",
      time: "1 hour ago",
      type: "agent",
    },
  ];

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    if (onSearchChange) onSearchChange(e.target.value);
  };

  return (
    <header className="w-full bg-white border-b border-[#E6E9F0] px-6 py-4 space-y-4">
      {/* Top Row: Title, Date, Search, Notifications, Profile */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Title & Subtitle */}
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-xl lg:text-2xl font-extrabold text-[#172033] tracking-tight">
              Welcome to SocioTrack
            </h1>
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E8F8F3] text-[#16A477] border border-[#16A477]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16A477] animate-pulse" />
              <span>AI Agent Active</span>
            </span>
          </div>
          <p className="text-xs text-[#718096] mt-0.5">
            Your AI-powered social media intelligence workspace.
          </p>
        </div>

        {/* Action Controls: Search, Date, Notifications */}
        <div className="flex items-center space-x-3">
          {/* Current Date Badge */}
          <div className="hidden lg:flex items-center space-x-1.5 text-xs text-[#718096] px-3 py-1.5 rounded-xl bg-[#F6F7FB] border border-[#E6E9F0]">
            <Calendar className="w-3.5 h-3.5 text-[#5146D8]" />
            <span className="font-medium">{formattedDate}</span>
          </div>

          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              value={searchValue}
              onChange={handleSearch}
              placeholder="Search drafts, insights..."
              className="w-48 sm:w-64 h-9 pl-8 pr-8 rounded-xl border border-[#E6E9F0] bg-[#F6F7FB] text-xs text-[#172033] placeholder-[#718096] focus:outline-none focus:ring-2 focus:ring-[#5146D8]/20 focus:border-[#5146D8] transition-all"
            />
            <Search className="w-3.5 h-3.5 text-[#718096] absolute left-2.5 top-3" />
            <kbd className="hidden sm:inline-block absolute right-2.5 top-2.5 text-[9px] font-mono text-[#718096] bg-white px-1.5 py-0.5 rounded border border-[#E6E9F0]">
              ⌘K
            </kbd>
          </div>

          {/* Notification Bell Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-9 h-9 rounded-xl border border-[#E6E9F0] bg-white hover:bg-[#F6F7FB] flex items-center justify-center text-[#172033] relative transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4 text-[#718096]" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#5146D8] ring-2 ring-white" />
            </button>

            {/* Notifications Menu */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-[#E6E9F0] shadow-dropdown p-4 z-50 animate-slide-up space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#E6E9F0]">
                  <div className="flex items-center space-x-2">
                    <Bell className="w-4 h-4 text-[#5146D8]" />
                    <span className="text-xs font-bold text-[#172033]">
                      Agent Intelligence Logs
                    </span>
                  </div>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-[#718096] hover:text-[#172033]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className="p-2.5 rounded-xl bg-[#F6F7FB] border border-[#E6E9F0] text-left space-y-1 hover:bg-[#ECE9FF]/40 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#172033]">
                          {n.title}
                        </span>
                        <span className="text-[10px] text-[#718096]">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-[#718096] line-clamp-2">
                        {n.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: 4 Compact Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
        {/* Metric 1: Total Drafts */}
        <div className="bg-[#F6F7FB] border border-[#E6E9F0] rounded-xl p-3 flex items-center space-x-3 transition-all hover:bg-white hover:shadow-card">
          <div className="w-9 h-9 rounded-lg bg-[#ECE9FF] text-[#5146D8] flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-[#718096] uppercase tracking-wider">
              Total Drafts
            </div>
            <div className="text-lg font-black text-[#172033] leading-tight">
              {metrics.totalDrafts}
            </div>
          </div>
        </div>

        {/* Metric 2: Pending Approvals */}
        <div className="bg-[#F6F7FB] border border-[#E6E9F0] rounded-xl p-3 flex items-center space-x-3 transition-all hover:bg-white hover:shadow-card">
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-[#718096] uppercase tracking-wider">
              Pending Approvals
            </div>
            <div className="text-lg font-black text-[#172033] leading-tight">
              {metrics.pendingApprovals}
            </div>
          </div>
        </div>

        {/* Metric 3: Published Posts */}
        <div className="bg-[#F6F7FB] border border-[#E6E9F0] rounded-xl p-3 flex items-center space-x-3 transition-all hover:bg-white hover:shadow-card">
          <div className="w-9 h-9 rounded-lg bg-[#E8F8F3] text-[#16A477] flex items-center justify-center shrink-0">
            <Send className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-[#718096] uppercase tracking-wider">
              Published Posts
            </div>
            <div className="text-lg font-black text-[#172033] leading-tight">
              {metrics.publishedPosts}
            </div>
          </div>
        </div>

        {/* Metric 4: Audience Insights Learned */}
        <div className="bg-[#F6F7FB] border border-[#E6E9F0] rounded-xl p-3 flex items-center space-x-3 transition-all hover:bg-white hover:shadow-card">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 text-[#3478F6] flex items-center justify-center shrink-0">
            <BrainCircuit className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-[#718096] uppercase tracking-wider">
              Insights Learned
            </div>
            <div className="text-lg font-black text-[#172033] leading-tight flex items-center space-x-1">
              <span>{metrics.insightsLearned}</span>
              <span className="text-[10px] font-normal text-[#16A477]">
                (+2 this week)
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
