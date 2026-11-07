"use client";

import React from "react";
import {
  LayoutDashboard,
  Wand2,
  CheckSquare,
  Users,
  BrainCircuit,
  BarChart3,
  Sliders,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Bot,
} from "lucide-react";
import { SocioTrackLogo } from "@/components/SocioTrackLogo";
import { UserSession } from "@/components/auth/AuthPage";

export type NavItem =
  | "overview"
  | "studio"
  | "queue"
  | "audience"
  | "memory"
  | "analytics"
  | "simulator"
  | "settings"
  | "help";

interface SidebarProps {
  currentTab: NavItem;
  onSelectTab: (tab: NavItem) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  user: UserSession;
  onLogout: () => void;
  pendingApprovalsCount?: number;
}

export function Sidebar({
  currentTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  user,
  onLogout,
  pendingApprovalsCount = 3,
}: SidebarProps) {
  const mainNavItems = [
    { id: "overview" as const, label: "Overview", icon: LayoutDashboard },
    { id: "studio" as const, label: "Generation Studio", icon: Wand2 },
    {
      id: "queue" as const,
      label: "Approval Queue",
      icon: CheckSquare,
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
    },
    { id: "audience" as const, label: "Audience Intelligence", icon: Users },
    { id: "memory" as const, label: "Agent Memory", icon: BrainCircuit },
    { id: "analytics" as const, label: "Performance Analytics", icon: BarChart3 },
    { id: "simulator" as const, label: "Engagement Simulator", icon: Sliders },
  ];

  const bottomNavItems = [
    { id: "settings" as const, label: "Settings", icon: Settings },
    { id: "help" as const, label: "Help Center", icon: HelpCircle },
  ];

  return (
    <aside
      className={`relative z-20 flex flex-col justify-between bg-white border-r border-[#E6E9F0] transition-all duration-300 shadow-sm ${
        isCollapsed ? "w-20" : "w-64"
      } shrink-0`}
    >
      {/* Top Branding & Status */}
      <div>
        {/* Logo and Collapse Toggle */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#E6E9F0]">
          {!isCollapsed ? (
            <SocioTrackLogo size="sm" showWordmark={true} />
          ) : (
            <div className="mx-auto">
              <SocioTrackLogo size="sm" showWordmark={false} />
            </div>
          )}

          <button
            onClick={onToggleCollapse}
            aria-label="Toggle Sidebar"
            className="w-7 h-7 rounded-lg border border-[#E6E9F0] hover:bg-[#F6F7FB] flex items-center justify-center text-[#718096] transition-colors ml-1"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* AI Agent Status Pill */}
        <div className={`px-4 py-3 border-b border-[#E6E9F0]/60 ${isCollapsed ? "text-center" : ""}`}>
          <div
            className={`inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-[#E8F8F3] border border-[#16A477]/20 text-[11px] font-semibold text-[#16A477] ${
              isCollapsed ? "justify-center w-full px-0" : ""
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#16A477] animate-pulse shrink-0" />
            {!isCollapsed && <span>AI Agent Online</span>}
          </div>
        </div>

        {/* Main Navigation List */}
        <nav className="p-3 space-y-1">
          {mainNavItems.map((item) => {
            const isSelected = currentTab === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center rounded-xl text-xs font-semibold transition-all group ${
                  isCollapsed ? "justify-center p-2.5" : "px-3 py-2.5 space-x-3"
                } ${
                  isSelected
                    ? "bg-[#ECE9FF] text-[#5146D8] shadow-sm font-bold"
                    : "text-[#718096] hover:bg-[#F6F7FB] hover:text-[#172033]"
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isSelected ? "text-[#5146D8]" : "text-[#718096] group-hover:text-[#172033]"
                  }`}
                />
                {!isCollapsed && (
                  <span className="flex-1 text-left truncate">{item.label}</span>
                )}
                {!isCollapsed && item.badge !== undefined && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#5146D8] text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Navigation & User Profile */}
      <div className="p-3 border-t border-[#E6E9F0] space-y-2">
        {/* Settings & Help */}
        <div className="space-y-1">
          {bottomNavItems.map((item) => {
            const isSelected = currentTab === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center rounded-xl text-xs font-semibold transition-all ${
                  isCollapsed ? "justify-center p-2.5" : "px-3 py-2 space-x-3"
                } ${
                  isSelected
                    ? "bg-[#ECE9FF] text-[#5146D8] font-bold"
                    : "text-[#718096] hover:bg-[#F6F7FB] hover:text-[#172033]"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!isCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </div>

        {/* User Profile Card */}
        <div className="pt-2 border-t border-[#E6E9F0]/80">
          <div
            className={`flex items-center rounded-xl p-2 bg-[#F6F7FB] border border-[#E6E9F0] ${
              isCollapsed ? "justify-center" : "justify-between"
            }`}
          >
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#5146D8] to-[#3478F6] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                {user.name.split(" ").map((n) => n[0]).join("")}
              </div>
              {!isCollapsed && (
                <div className="flex flex-col text-left overflow-hidden">
                  <span className="text-xs font-bold text-[#172033] truncate">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-[#718096] truncate">
                    {user.email}
                  </span>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <button
                onClick={onLogout}
                title="Sign out of SocioTrack"
                className="w-7 h-7 rounded-lg hover:bg-white hover:text-red-600 text-[#718096] flex items-center justify-center transition-colors shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
