"use client";

import React, { useState } from "react";
import { AuthPage, UserSession } from "@/components/auth/AuthPage";
import { Sidebar, NavItem } from "@/components/Sidebar";
import { Header, DashboardMetrics } from "@/components/Header";
import { IntelligenceCore, IntelligenceNode } from "@/components/IntelligenceCore";
import { GenerationStudio } from "@/components/GenerationStudio";
import { AgentMemoryPanel } from "@/components/AgentMemoryPanel";
import { LiveEngagementLab } from "@/components/LiveEngagementLab";
import {
  ApprovalQueueView,
  AudienceIntelligenceView,
  PerformanceAnalyticsView,
  SettingsView,
  HelpCenterView,
} from "@/components/ExtraViews";
import {
  PostDraft,
  LearnedInsight,
  INITIAL_DRAFTS,
  INITIAL_INSIGHTS,
} from "@/mocks/mockData";
import { CheckCircle2, Sparkles, X } from "lucide-react";

export default function App() {
  // 1. Authentication State: Always start at Login!
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);

  // 2. Navigation State
  const [currentTab, setCurrentTab] = useState<NavItem>("overview");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // 3. Application Data State
  const [drafts, setDrafts] = useState<PostDraft[]>(INITIAL_DRAFTS);
  const [insights, setInsights] = useState<LearnedInsight[]>(INITIAL_INSIGHTS);

  // 4. Intelligence Core Reactive State
  const [activeCoreNode, setActiveCoreNode] = useState<IntelligenceNode>("idle");

  // 5. Memory Recalibration State
  const [isRecalibrating, setIsRecalibrating] = useState(false);

  // 6. Global Notification Toast
  const [toastMessage, setToastMessage] = useState<{
    title: string;
    description: string;
    type?: "success" | "info";
  } | null>(null);

  // Overview metrics
  const pendingApprovals = drafts.filter((d) => d.status === "Draft").length;
  const publishedPosts = 42;
  const metrics: DashboardMetrics = {
    totalDrafts: drafts.length + 15,
    pendingApprovals: pendingApprovals,
    publishedPosts: publishedPosts,
    insightsLearned: insights.length + 10,
  };

  // Login handler
  const handleLoginSuccess = (user: UserSession) => {
    setCurrentUser(user);
    showToast(
      "Signed in successfully",
      `Welcome to SocioTrack workspace, ${user.name}.`,
      "success"
    );
  };

  // Logout handler
  const handleLogout = () => {
    setCurrentUser(null);
  };

  // Toast trigger helper
  const showToast = (
    title: string,
    description: string,
    type: "success" | "info" = "success"
  ) => {
    setToastMessage({ title, description, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Approve & Schedule Draft Handler
  const handleApproveDraft = (draft: PostDraft) => {
    setDrafts((prev) =>
      prev.map((d) =>
        d.id === draft.id
          ? {
              ...d,
              status: "Approved" as const,
              scheduledTime: "Tuesday at 2:30 PM (Peak Reply Window)",
            }
          : d
      )
    );

    showToast(
      "Draft Approved & Scheduled",
      `Post scheduled for ${draft.platform} on Tuesday at 2:30 PM (Peak Window).`,
      "success"
    );
  };

  // Send Draft to Simulator
  const handleSendToSimulator = (content: string) => {
    showToast(
      "Post Injected into Simulator",
      "Expand the Live Engagement Lab at the bottom to test metrics.",
      "info"
    );
  };

  // Recalibrate Memory Handler
  const handleRecalibrateMemory = () => {
    setIsRecalibrating(true);
    setActiveCoreNode("analysis");

    setTimeout(() => {
      setIsRecalibrating(false);
      setActiveCoreNode("memory");

      showToast(
        "Memory Recalibrated Successfully",
        "Vector weights updated across all 15 indexed audience clusters.",
        "success"
      );

      setTimeout(() => {
        setActiveCoreNode("idle");
      }, 1500);
    }, 1200);
  };

  // Live Engagement Feedback Loop Handler (The key Hackathon demo!)
  const handlePatternDiscovered = (newInsight: LearnedInsight) => {
    // Prepend new insight into Agent Memory immediately!
    setInsights((prev) => [newInsight, ...prev]);

    // Highlight Memory node on Intelligence Core
    setActiveCoreNode("memory");

    setTimeout(() => {
      setActiveCoreNode("idle");
    }, 3000);
  };

  // If user is not authenticated, render Authentication Split-Screen!
  if (!currentUser) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Once authenticated, render Main SocioTrack Dashboard
  return (
    <div className="min-h-screen bg-[#F6F7FB] flex text-[#172033] selection:bg-[#ECE9FF] selection:text-[#5146D8]">
      {/* Global Interactive Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 max-w-sm bg-white border border-[#E6E9F0] rounded-2xl p-4 shadow-float animate-slide-up flex items-start space-x-3">
          <div className="w-8 h-8 rounded-xl bg-[#E8F8F3] text-[#16A477] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="flex-1 space-y-0.5">
            <h4 className="text-xs font-bold text-[#172033]">
              {toastMessage.title}
            </h4>
            <p className="text-[11px] text-[#718096] leading-relaxed">
              {toastMessage.description}
            </p>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-[#718096] hover:text-[#172033]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* A. LEFT NAVIGATION SIDEBAR */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        user={currentUser}
        onLogout={handleLogout}
        pendingApprovalsCount={pendingApprovals}
      />

      {/* MAIN WORKSPACE COLUMN */}
      <div className="flex-1 flex flex-col min-w-0 pb-28">
        {/* B. DASHBOARD HEADER */}
        <Header user={currentUser} metrics={metrics} />

        {/* WORKSPACE CONTENT AREA */}
        <main className="flex-1 p-4 lg:p-6 max-w-7xl w-full mx-auto space-y-6">
          {/* Active Tab: Overview (The complete flagship workspace) */}
          {currentTab === "overview" && (
            <div className="space-y-6">
              {/* SocioTrack Intelligence Core Visualization Banner */}
              <IntelligenceCore activeNode={activeCoreNode} />

              {/* 2-Column Split: Center Queue (visual priority) + Right Agent Memory */}
              <div className="flex flex-col lg:flex-row gap-6 items-start">
                {/* Center Column: Generation & Approval Queue */}
                <div className="flex-1 min-w-0 w-full">
                  <GenerationStudio
                    drafts={drafts}
                    onDraftsChange={setDrafts}
                    onApproveDraft={handleApproveDraft}
                    onSendToSimulator={handleSendToSimulator}
                    onAgentGeneratingStart={() => setActiveCoreNode("generation")}
                    onAgentGeneratingEnd={() => setActiveCoreNode("idle")}
                  />
                </div>

                {/* Right Sidebar: Agent Memory & Learned Audience Insights */}
                <AgentMemoryPanel
                  insights={insights}
                  onRecalibrateMemory={handleRecalibrateMemory}
                  isRecalibrating={isRecalibrating}
                />
              </div>
            </div>
          )}

          {/* Subview: Generation Studio */}
          {currentTab === "studio" && (
            <div className="space-y-6">
              <IntelligenceCore activeNode={activeCoreNode} />
              <GenerationStudio
                drafts={drafts}
                onDraftsChange={setDrafts}
                onApproveDraft={handleApproveDraft}
                onSendToSimulator={handleSendToSimulator}
                onAgentGeneratingStart={() => setActiveCoreNode("generation")}
                onAgentGeneratingEnd={() => setActiveCoreNode("idle")}
              />
            </div>
          )}

          {/* Subview: Approval Queue */}
          {currentTab === "queue" && (
            <ApprovalQueueView drafts={drafts} onApproveDraft={handleApproveDraft} />
          )}

          {/* Subview: Audience Intelligence */}
          {currentTab === "audience" && <AudienceIntelligenceView />}

          {/* Subview: Agent Memory Dedicated Explorer */}
          {currentTab === "memory" && (
            <div className="space-y-6">
              <IntelligenceCore activeNode={activeCoreNode} />
              <div className="flex justify-center">
                <AgentMemoryPanel
                  insights={insights}
                  onRecalibrateMemory={handleRecalibrateMemory}
                  isRecalibrating={isRecalibrating}
                />
              </div>
            </div>
          )}

          {/* Subview: Performance Analytics */}
          {currentTab === "analytics" && <PerformanceAnalyticsView />}

          {/* Subview: Engagement Simulator */}
          {currentTab === "simulator" && (
            <div className="space-y-6">
              <IntelligenceCore activeNode={activeCoreNode} />
              <div className="bg-white rounded-2xl border border-[#E6E9F0] p-6 shadow-card space-y-4">
                <h3 className="text-sm font-bold text-[#172033]">
                  Interactive Engagement Simulator
                </h3>
                <p className="text-xs text-[#718096]">
                  Use the floating drawer docked at the bottom of the screen to adjust impressions, shares, and likes in real time and trigger autonomous memory updating.
                </p>
              </div>
            </div>
          )}

          {/* Subview: Settings */}
          {currentTab === "settings" && <SettingsView />}

          {/* Subview: Help Center */}
          {currentTab === "help" && <HelpCenterView />}
        </main>
      </div>

      {/* FLOATING BOTTOM DRAWER – LIVE ENGAGEMENT LAB */}
      <LiveEngagementLab
        onPatternDiscovered={handlePatternDiscovered}
        onSimulationStart={() => setActiveCoreNode("memory")}
        onSimulationEnd={() => setActiveCoreNode("idle")}
      />
    </div>
  );
}
