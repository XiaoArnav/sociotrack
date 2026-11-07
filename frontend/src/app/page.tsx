"use client";

import React, { useState, useEffect } from "react";
import { AuthPage, UserSession } from "@/components/auth/AuthPage";
import { InsTrackCreatorCard, SubNavTab } from "@/components/InsTrackCreatorCard";
import {
  InsTrackBenchmarkCards,
  InsTrackGradeCards,
} from "@/components/InsTrackBenchmarkCards";
import { InsTrackGrowthCharts } from "@/components/InsTrackGrowthCharts";
import { InsTrackHistoricalTable } from "@/components/InsTrackHistoricalTable";
import { InsTrackCompetitorTable } from "@/components/InsTrackCompetitorTable";
import { InsTrackSurveyModal } from "@/components/InsTrackSurveyModal";
import { InsTrackAddAccountModal } from "@/components/InsTrackAddAccountModal";
import { InsTrackSaaSDashboard } from "@/components/InsTrackSaaSDashboard";
import { GenerationStudio } from "@/components/GenerationStudio";
import { AgentMemoryPanel } from "@/components/AgentMemoryPanel";
import { LiveEngagementLab } from "@/components/LiveEngagementLab";
import {
  PostDraft,
  LearnedInsight,
  INITIAL_DRAFTS,
  INITIAL_INSIGHTS,
} from "@/mocks/mockData";
import {
  Sun,
  Moon,
  Search,
  CheckCircle2,
  Check,
  X,
  ChevronDown,
  ArrowRight,
  HelpCircle,
  TrendingUp,
  Sparkles,
} from "lucide-react";

export default function App() {
  // 1. Dark Mode State (Syncs directly with HTML class)
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  // 2. Authentication State: Default to demo session for instant presentation access
  const [currentUser, setCurrentUser] = useState<UserSession | null>({
    name: "Alex Chen",
    email: "alex.chen@enterprise.com",
    role: "Principal Content Architect",
  });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  // View mode switcher: "public_report" (landing / creator audit) vs "saas_dashboard" (logged-in InsTrack app from video 4 & 5)
  const [viewMode, setViewMode] = useState<"public_report" | "saas_dashboard">("public_report");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("sociotrack_user_session");
      if (saved) {
        setCurrentUser(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  // 3. Navigation State: Sub-navigation active tab (Default: "growth" matching Screenshot 4)
  const [activeSubTab, setActiveSubTab] = useState<SubNavTab>("growth");

  // 4. Application Data State
  const [drafts, setDrafts] = useState<PostDraft[]>(INITIAL_DRAFTS);
  const [insights, setInsights] = useState<LearnedInsight[]>(INITIAL_INSIGHTS);
  const [searchQuery, setSearchQuery] = useState("");

  // 5. Global Notification Toast
  const [toastMessage, setToastMessage] = useState<{
    title: string;
    description: string;
    type?: "success" | "info";
  } | null>(null);

  // 6. FAQ State
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);

  // Login handler
  const handleLoginSuccess = (user: UserSession) => {
    setCurrentUser(user);
    try {
      localStorage.setItem("sociotrack_user_session", JSON.stringify(user));
    } catch {
      // ignore
    }
    showToast(
      "Signed in successfully",
      `Welcome to SocioTrack workspace, ${user.name}.`,
      "success"
    );
  };

  // Logout handler
  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem("sociotrack_user_session");
    } catch {
      // ignore
    }
    showToast("Signed Out", "Session ended.", "info");
  };

  // 7. Help Widget Modal State
  const [showHelpModal, setShowHelpModal] = useState(false);
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

  // Live Engagement Feedback Loop Handler
  const handlePatternDiscovered = (newInsight: LearnedInsight) => {
    setInsights((prev) => [newInsight, ...prev]);
    showToast(
      "New Audience Pattern Discovered",
      "Vector memory reinforced and saved to pgvector / ChromaDB.",
      "success"
    );
  };

  // The 6 Exact FAQs from InsTrack (Screenshot 9)
  const FAQS = [
    {
      q: "Do I have to sign in to use this service?",
      a: "No, you don't have to sign in to search and explore public Instagram analytics. Creating a free account lets you bookmark accounts, save historical ledgers, and activate persistent AI memory.",
    },
    {
      q: "Do I have to sign in with Facebook?",
      a: "No, you do not need to sign in with Facebook or provide OAuth permissions to audit public accounts. SocioTrack utilizes the official Meta Graph API and autonomous agent simulation to safely index public performance.",
    },
    {
      q: "Do I have to pay to use this service?",
      a: "No, SocioTrack is free to use with full access to real-time analytics, historical CSV exports, and AI post generation during the Hack With Bangalore evaluation.",
    },
    {
      q: "Do you offer a free trial?",
      a: "Yes! All users get an unlimited free tier with continuous metric tracking, PDF exports, and AI generation studio access.",
    },
    {
      q: "Why can't I find my account?",
      a: "Ensure the username is spelled accurately and the account is set to public. Private Instagram accounts cannot be analyzed in accordance with Meta Graph API privacy policies.",
    },
    {
      q: "Why can't I see all historical data for an account?",
      a: "Historical ledger data starts recording from the moment an account is first indexed in our system. For newly tracked creators, the past 30 to 90 days are automatically backfilled within minutes.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 max-w-sm bg-white dark:bg-[#161F30] border-2 border-emerald-500 rounded-2xl p-4 shadow-2xl flex items-start space-x-3 animate-slide-up">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="flex-1 space-y-0.5">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              {toastMessage.title}
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              {toastMessage.description}
            </p>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* TOP NAVIGATION BAR (Matching Screenshot 1, 3, 4, 6) */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0B0F19]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-[#243048] px-4 sm:px-8 py-3.5 flex items-center justify-between transition-colors">
        {/* Left: Moon / Sun Toggle Button */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-xl border border-slate-200 dark:border-[#243048] hover:bg-slate-100 dark:hover:bg-[#161F30] text-slate-600 dark:text-slate-300 transition-colors"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-[#6366F1]" />
            )}
          </button>
        </div>

        {/* Center: InsTrack Logo (Screenshot 1, 3, 4) */}
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#6366F1] to-[#06B6D4] flex items-center justify-center shadow-sm">
            <TrendingUp className="w-3.5 h-3.5 text-white stroke-[2.5]" />
          </div>
          <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
            InsTrack
          </span>
        </div>

        {/* Right: Pricing, Log in, Create a Free Account + optional Workspace Toggle */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={() => {
              const el = document.getElementById("benchmark-section");
              el?.scrollIntoView({ behavior: "smooth" });
            }}
            className="hidden sm:inline-block text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors px-2 py-1"
          >
            Pricing
          </button>

          {currentUser ? (
            <button
              onClick={() => setViewMode(viewMode === "public_report" ? "saas_dashboard" : "public_report")}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#243048] text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#161F30] transition-colors"
            >
              {viewMode === "public_report" ? "SaaS App →" : "Public View"}
            </button>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#243048] text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#161F30] transition-colors"
            >
              Log in
            </button>
          )}

          <button
            onClick={() => setShowSurveyModal(true)}
            className="px-4 py-1.5 rounded-lg bg-[#6366F1] hover:bg-[#5558E6] text-white text-xs font-semibold shadow-sm transition-colors"
          >
            Create a Free Account
          </button>
        </div>
      </header>

      {viewMode === "saas_dashboard" ? (
        <InsTrackSaaSDashboard
          isDarkMode={isDarkMode}
          onToggleTheme={() => setIsDarkMode(!isDarkMode)}
          onViewPublicProfile={() => setViewMode("public_report")}
          onOpenSurvey={() => setShowSurveyModal(true)}
        />
      ) : (
        <>
          {/* HERO SECTION (Matching Screenshot 3 & 4) */}
      <section className="relative pt-12 pb-6 px-4 sm:px-8 max-w-5xl mx-auto text-center space-y-4">
        {/* Background Ambient Shapes */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-40 bg-indigo-500/10 dark:bg-indigo-500/5 blur-3xl pointer-events-none" />

        {/* Headline with Purple-to-Cyan Gradient Text */}
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight bg-gradient-to-r from-[#6366F1] via-[#8B5CF6] to-[#06B6D4] bg-clip-text text-transparent">
          Powerful In-Depth Analytics for Instagram
        </h1>

        {/* Subhead text */}
        <p className="max-w-2xl mx-auto text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
          InsTrack offers powerful in-depth analytics and actionable insights for brands, influencers and agencies.
          Trusted by millions since 2012. Powered by the official Instagram API.
        </p>

        {/* Search Bar matching Screenshot 3 */}
        <div className="max-w-xl mx-auto pt-2">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search any account on Instagram"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-11 pr-4 rounded-full border border-slate-200 dark:border-[#243048] bg-white dark:bg-[#161F30] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6366F1] shadow-sm transition-colors"
            />
          </div>

          {/* 3 Checkmarks below search bar (Screenshot 3 & 4) */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-600 dark:text-slate-400 pt-3 font-medium">
            <span className="flex items-center space-x-1.5">
              <Check className="w-3.5 h-3.5 text-[#6366F1] stroke-[3]" />
              <span>Free to Try</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <Check className="w-3.5 h-3.5 text-[#6366F1] stroke-[3]" />
              <span>Powerful Insights</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <Check className="w-3.5 h-3.5 text-[#6366F1] stroke-[3]" />
              <span>Unlimited Historical Data</span>
            </span>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT DASHBOARD */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-16 pb-32">
        {/* 1. CREATOR PROFILE CARD & RAINBOW SCORE (Screenshot 2 & 4) */}
        <div className="space-y-6">
          <InsTrackCreatorCard
            activeTab={activeSubTab}
            onTabChange={setActiveSubTab}
            onExportClick={() => setActiveSubTab("historical")}
            score={70.1}
          />

          {/* 2. CREATOR TAB CONTENT (Default: Growth) */}
          {activeSubTab === "growth" && (
            <div className="space-y-6 animate-fade-in">
              <InsTrackBenchmarkCards />
              <InsTrackGrowthCharts />
            </div>
          )}

          {activeSubTab === "overview" && (
            <div className="space-y-6 animate-fade-in">
              <InsTrackBenchmarkCards />
              <InsTrackGrowthCharts />
            </div>
          )}

          {activeSubTab === "audit" && (
            <div className="space-y-6 animate-fade-in">
              <InsTrackBenchmarkCards />
              <InsTrackGradeCards />
            </div>
          )}

          {activeSubTab === "engagement" && (
            <div className="space-y-6 animate-fade-in">
              <InsTrackBenchmarkCards />
              <InsTrackGrowthCharts />
            </div>
          )}

          {activeSubTab === "historical" && (
            <div className="space-y-6 animate-fade-in">
              <InsTrackHistoricalTable />
            </div>
          )}

          {/* AI GENERATION STUDIO (LangGraph Integration) */}
          {activeSubTab === "aistudio" && (
            <div className="space-y-8 animate-fade-in">
              <div className="bg-white dark:bg-[#161F30] rounded-2xl border border-slate-200 dark:border-[#243048] p-6 shadow-sm">
                <GenerationStudio
                  drafts={drafts}
                  onDraftsChange={setDrafts}
                  onApproveDraft={handleApproveDraft}
                  onSendToSimulator={() => {
                    showToast(
                      "Post Sent to Simulator",
                      "Click Live Engagement Lab at bottom left to test real-time feedback.",
                      "info"
                    );
                  }}
                />
              </div>
            </div>
          )}

          {/* LEARNED MEMORY BANK (Hindsight & Vector Reinforcement) */}
          {activeSubTab === "memorybank" && (
            <div className="space-y-8 animate-fade-in">
              <div className="bg-white dark:bg-[#161F30] rounded-2xl border border-slate-200 dark:border-[#243048] p-6 shadow-sm">
                <AgentMemoryPanel
                  insights={insights}
                  onRecalibrateMemory={() => {
                    showToast(
                      "Vector Memory Recalibrated",
                      "Reinforced 15 indexed audience clusters and hook rules.",
                      "success"
                    );
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* 3. SHOWCASE SECTION 1: BENCHMARK PERFORMANCE (Matching Screenshot 5 & 6) */}
        <section id="benchmark-section" className="space-y-6 pt-4">
          <InsTrackGradeCards />
        </section>

        {/* 4. SHOWCASE SECTION 2: INSTANT PERFORMANCE INSIGHTS / COMPETITOR TRACKING (Matching Screenshot 8) */}
        <section className="space-y-6 pt-4">
          <div className="text-center max-w-2xl mx-auto space-y-1">
            <h2 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-indigo-500 via-sky-400 to-cyan-400 bg-clip-text text-transparent">
              Instant Performance Insights
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Gain instant in-depth insights on any Instagram account:{" "}
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Competitors, clients or your own accounts
              </span>
              . Just enter username and specify date range, and we&apos;ll take care of the rest. Data is updated hourly and is presented in the most visually-appealing and insightful reports.
            </p>
          </div>
          <InsTrackCompetitorTable onAddAccountClick={() => setShowAddAccountModal(true)} />
        </section>

        {/* 5. SHOWCASE SECTION 3: REPORTING AND DATA EXPORTS (Matching Screenshot 1 & 2 & 6) */}
        <section className="space-y-6 pt-4">
          <div className="text-center max-w-2xl mx-auto space-y-1">
            <h2 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-indigo-500 via-sky-400 to-cyan-400 bg-clip-text text-transparent">
              Reporting and Data Exports
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Streamline your reporting process and <span className="font-semibold text-slate-800 dark:text-slate-200">save a lot of time</span> with our beautiful, automated and{" "}
              <span className="font-semibold text-slate-800 dark:text-slate-200">branded white-labeled PDF reports</span>. Schedule{" "}
              <span className="font-semibold text-slate-800 dark:text-slate-200">email reports</span> to be sent daily, weekly or monthly to yourself, your team members or directly to your clients.{" "}
              <span className="font-semibold text-slate-800 dark:text-slate-200">CSV exports</span> are also available for historical Instagram stats.
            </p>
          </div>
          <InsTrackHistoricalTable />
        </section>

        {/* 6. SHOWCASE SECTION 4: FREQUENTLY ASKED QUESTIONS (Matching Screenshot 2 & 3 & 6) */}
        <section className="bg-white dark:bg-[#161F30] rounded-2xl border border-slate-200/80 dark:border-[#243048] p-8 shadow-sm space-y-4 max-w-4xl mx-auto">
          <div className="border-b border-slate-100 dark:border-[#243048] pb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Frequently Asked Question (FAQ)
            </h3>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-[#243048]">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaqIdx === idx;
              return (
                <div key={idx} className="py-3.5">
                  <button
                    onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between text-left text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform ${
                        isOpen ? "transform rotate-180" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <p className="mt-2.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed pl-3 border-l-2 border-[#6366F1] animate-fade-in">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 7. SHOWCASE SECTION 5: GRADIENT CALL TO ACTION BANNER (Matching Screenshot 3 & 10) */}
        <section className="rounded-2xl p-10 sm:p-14 bg-gradient-to-r from-[#7C3AED] via-[#6366F1] to-[#06B6D4] text-white shadow-xl text-center space-y-5 max-w-4xl mx-auto">
          <h3 className="text-2xl sm:text-4xl font-black tracking-tight">
            Start your adventure now! 🚀
          </h3>
          <div>
            <button
              onClick={() => setShowSurveyModal(true)}
              className="px-8 py-3.5 rounded-xl bg-white/20 hover:bg-white/30 border border-white/40 text-white font-bold text-sm shadow-lg transition-all inline-flex items-center space-x-2 hover:scale-105"
            >
              <span>Create a Free Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 dark:border-[#243048] bg-white dark:bg-[#0B0F19] py-8 text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <div className="font-extrabold text-slate-900 dark:text-white text-sm">
              InsTrack by SocioTrack
            </div>
            <p className="text-[11px] mt-0.5">
              Autonomous Social Media Agent with Persistent Memory. Built for Hack With Bangalore 4.0.
            </p>
          </div>
          <div className="flex items-center space-x-6 text-[11px] font-medium">
            <button onClick={() => setActiveSubTab("overview")} className="hover:text-indigo-500">
              Overview
            </button>
            <button onClick={() => setActiveSubTab("growth")} className="hover:text-indigo-500">
              Growth
            </button>
            <button onClick={() => setActiveSubTab("historical")} className="hover:text-indigo-500">
              History
            </button>
            <button onClick={() => setActiveSubTab("aistudio")} className="hover:text-indigo-500">
              AI Studio
            </button>
          </div>
          <div className="text-[11px] font-mono">
            © 2026 InsTrack / SocioTrack. All rights reserved.
          </div>
        </div>
      </footer>
      </>
      )}

      {/* 5. FLOATING LIVE ENGAGEMENT LAB & META WEBHOOK SIMULATOR */}
      <LiveEngagementLab onPatternDiscovered={handlePatternDiscovered} />

      {/* 6. FLOATING HELP BUTTON (Matching Screenshot 3, 5, 6, 7, 9, 10) */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setShowHelpModal(true)}
          className="flex items-center space-x-1.5 px-4 py-2.5 rounded-full bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-bold shadow-xl transition-all hover:scale-105"
        >
          <HelpCircle className="w-4 h-4" />
          <span>Help</span>
        </button>
      </div>

      {/* HELP MODAL DIALOG */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#161F30] rounded-2xl border border-slate-200 dark:border-[#243048] p-6 max-w-md w-full shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#243048]">
              <div className="flex items-center space-x-2">
                <HelpCircle className="w-5 h-5 text-[#0284C7]" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  InsTrack &amp; SocioTrack Help Center
                </h4>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Need assistance auditing an account or verifying Meta webhook delivery?
              Our autonomous agent automatically ingests real-time engagement events, adjusts
              hook structures, and generates audit reports.
            </p>
            <div className="space-y-2 pt-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1E2638] text-slate-700 dark:text-slate-300">
                <strong>API Docs:</strong> Available locally at <code className="text-indigo-500 font-mono">http://localhost:8000/docs</code>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1E2638] text-slate-700 dark:text-slate-300">
                <strong>Meta Webhook:</strong> Verified at <code className="text-indigo-500 font-mono">/api/webhooks/instagram</code>
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-2 rounded-xl bg-[#6366F1] text-white text-xs font-bold"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AUTH SPLIT-SCREEN MODAL (Triggered on 'Log in' or 'Create a Free Account') */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 overflow-y-auto">
          <div className="relative w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl bg-[#0B0F19]">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 z-50 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <AuthPage
              onLoginSuccess={(u) => {
                setCurrentUser(u);
                setShowAuthModal(false);
                setViewMode("saas_dashboard");
                showToast("Signed In Successfully", `Welcome to your InsTrack Dashboard, ${u.name}!`);
              }}
            />
          </div>
        </div>
      )}

      {/* ONBOARDING SURVEY MODAL (instrack.app/survey from video 3) */}
      <InsTrackSurveyModal
        isOpen={showSurveyModal}
        onClose={() => setShowSurveyModal(false)}
        onComplete={(data) => {
          setViewMode("saas_dashboard");
          showToast(
            "Welcome to InsTrack!",
            `Workspace configured for ${data.persona} focusing on ${data.goals.join(", ")}.`,
            "success"
          );
        }}
      />

      {/* ADD ACCOUNT MODAL (from video 4 & 5) */}
      <InsTrackAddAccountModal
        isOpen={showAddAccountModal}
        onClose={() => setShowAddAccountModal(false)}
        onAddAccount={(username) => {
          showToast(
            "Account Added to Tracking List",
            `@${username} is now being audited daily with AI vector memory.`,
            "success"
          );
        }}
        onOpenProfile={(handle) => {
          setViewMode("public_report");
          setActiveSubTab("overview");
          showToast("Opening Creator Profile", `Viewing @${handle} audit report.`);
        }}
      />
    </div>
  );
}
