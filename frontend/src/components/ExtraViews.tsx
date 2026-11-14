"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  BrainCircuit,
  BarChart3,
  Sliders,
  Settings as SettingsIcon,
  HelpCircle,
  TrendingUp,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowRight,
  Database,
  Compass,
} from "lucide-react";
import { PostDraft, LearnedInsight } from "@/mocks/mockData";
import {
  formatScheduledTime,
  COMMON_TIMEZONES,
  getUserTimezone,
  setUserTimezone,
  useLiveClock,
} from "@/lib/dateUtils";

interface ViewProps {
  drafts?: PostDraft[];
  insights?: LearnedInsight[];
  onApproveDraft?: (draft: PostDraft) => void;
  onSelectTab?: (tab: any) => void;
}

// 1. APPROVAL QUEUE VIEW
export function ApprovalQueueView({ drafts = [], onApproveDraft }: ViewProps) {
  const pendingDrafts = drafts.filter((d) => d.status === "Draft");
  const approvedDrafts = drafts.filter((d) => d.status === "Approved" || d.status === "Scheduled");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-[#E6E9F0]">
        <div>
          <h2 className="text-xl font-extrabold text-[#172033]">Approval &amp; Scheduling Queue</h2>
          <p className="text-xs text-[#718096]">
            Review, fine-tune, and schedule agent-generated drafts for peak audience windows.
          </p>
        </div>
        <span className="text-xs font-semibold px-3 py-1 bg-[#ECE9FF] text-[#5146D8] rounded-full">
          {pendingDrafts.length} Pending Human Review
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pending Card List */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-[#172033] flex items-center space-x-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <span>Pending Approvals ({pendingDrafts.length})</span>
          </h3>

          {pendingDrafts.map((draft) => (
            <div
              key={draft.id}
              className="bg-white rounded-2xl border border-[#E6E9F0] p-4 shadow-card space-y-3"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#5146D8] bg-[#ECE9FF] px-2 py-0.5 rounded">
                  {draft.platform} • {draft.hookStyle}
                </span>
                <span className="text-[#16A477] font-semibold">
                  Pred: {draft.predictedEngagement} ({draft.confidenceScore}%)
                </span>
              </div>
              <p className="text-xs text-[#172033] line-clamp-3 leading-relaxed">
                {draft.content}
              </p>
              <div className="pt-2 border-t border-[#E6E9F0] flex items-center justify-between">
                <span className="text-[10px] text-[#718096]">Scheduled for Peak Window</span>
                <button
                  onClick={() => onApproveDraft && onApproveDraft(draft)}
                  className="px-3 py-1.5 rounded-lg bg-[#5146D8] text-white text-xs font-bold hover:bg-[#4336c5] transition-colors"
                >
                  Approve &amp; Schedule
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Approved & Scheduled */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-[#172033] flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-[#16A477]" />
            <span>Approved &amp; Scheduled ({approvedDrafts.length})</span>
          </h3>

          {approvedDrafts.map((draft) => (
            <div
              key={draft.id}
              className="bg-white rounded-2xl border border-[#16A477]/30 p-4 shadow-card space-y-3"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#16A477] bg-[#E8F8F3] px-2 py-0.5 rounded">
                  Scheduled for {draft.platform}
                </span>
                <span className="text-[10px] text-[#718096] flex items-center space-x-1" suppressHydrationWarning>
                  <Calendar className="w-3 h-3 text-[#5146D8]" />
                  <span>{formatScheduledTime(draft.scheduledTime || draft.scheduledTimeIso)}</span>
                </span>
              </div>
              <p className="text-xs text-[#172033] line-clamp-3 leading-relaxed">
                {draft.content}
              </p>
              <div className="pt-2 border-t border-[#E6E9F0] flex items-center justify-between text-[11px] text-[#16A477] font-semibold">
                <span>✓ Verified against Brand Dos &amp; Don&apos;ts</span>
                <span className="text-[#718096]">Ready to Publish</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 2. AUDIENCE INTELLIGENCE VIEW
export function AudienceIntelligenceView() {
  return (
    <div className="space-y-6">
      <div className="pb-3 border-b border-[#E6E9F0]">
        <h2 className="text-xl font-extrabold text-[#172033]">Audience Intelligence</h2>
        <p className="text-xs text-[#718096]">
          Real-time analysis of sentiment signals, conversation clusters, and engagement resonance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Sentiment Signal */}
        <div className="bg-white rounded-2xl border border-[#E6E9F0] p-5 shadow-card space-y-3">
          <div className="flex items-center space-x-2 text-[#5146D8]">
            <Compass className="w-5 h-5" />
            <h3 className="text-sm font-bold text-[#172033]">Current Sentiment Vector</h3>
          </div>
          <div className="text-3xl font-black text-[#5146D8]">68%</div>
          <p className="text-xs text-[#718096] leading-relaxed">
            Consensus mood: <strong className="text-[#172033]">Cautious &amp; ROI-Driven</strong>.
            Audience actively ignores generic AI hype and favors deterministic benchmarks.
          </p>
          <div className="pt-2 border-t border-[#E6E9F0] flex flex-wrap gap-1">
            {["#cost-optimization", "#langgraph", "#latency", "#benchmarks"].map((t) => (
              <span key={t} className="text-[10px] bg-[#F6F7FB] px-2 py-0.5 rounded text-[#718096]">
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Top Demographics */}
        <div className="bg-white rounded-2xl border border-[#E6E9F0] p-5 shadow-card space-y-3">
          <div className="flex items-center space-x-2 text-[#3478F6]">
            <Users className="w-5 h-5" />
            <h3 className="text-sm font-bold text-[#172033]">Audience Roles</h3>
          </div>
          <div className="space-y-2 text-xs">
            <div>
              <div className="flex justify-between text-[#718096] mb-1">
                <span>AI / ML Engineers</span>
                <span className="font-bold text-[#172033]">46%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-[#5146D8] w-[46%]" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[#718096] mb-1">
                <span>CTOs &amp; Tech Leads</span>
                <span className="font-bold text-[#172033]">32%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-[#3478F6] w-[32%]" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[#718096] mb-1">
                <span>Technical Founders</span>
                <span className="font-bold text-[#172033]">22%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-[#16A477] w-[22%]" />
              </div>
            </div>
          </div>
        </div>

        {/* Content Resonance */}
        <div className="bg-white rounded-2xl border border-[#E6E9F0] p-5 shadow-card space-y-3">
          <div className="flex items-center space-x-2 text-[#16A477]">
            <TrendingUp className="w-5 h-5" />
            <h3 className="text-sm font-bold text-[#172033]">Format Save Multipliers</h3>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center p-2 rounded-lg bg-[#F6F7FB]">
              <span className="font-medium text-[#172033]">Contrarian Hot Takes</span>
              <span className="font-black text-[#5146D8]">+3.4x Saves</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded-lg bg-[#F6F7FB]">
              <span className="font-medium text-[#172033]">Tactical Numbered Checklists</span>
              <span className="font-black text-[#3478F6]">+2.8x Saves</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded-lg bg-[#F6F7FB]">
              <span className="font-medium text-[#172033]">Generic Announcements</span>
              <span className="font-semibold text-slate-400">0.4x Baseline</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 3. PERFORMANCE ANALYTICS VIEW
export function PerformanceAnalyticsView() {
  return (
    <div className="space-y-6">
      <div className="pb-3 border-b border-[#E6E9F0]">
        <h2 className="text-xl font-extrabold text-[#172033]">Performance Analytics</h2>
        <p className="text-xs text-[#718096]">
          Real-time composite viral scoring, impression conversion, and reinforcement feedback.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[#E6E9F0] shadow-card">
          <span className="text-[10px] text-[#718096] uppercase font-bold">Avg Composite Score</span>
          <div className="text-2xl font-black text-[#16A477] mt-1">7.84</div>
          <span className="text-[10px] text-[#16A477] font-semibold">+1.2 vs last week</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#E6E9F0] shadow-card">
          <span className="text-[10px] text-[#718096] uppercase font-bold">Total Impressions</span>
          <div className="text-2xl font-black text-[#172033] mt-1">142,500</div>
          <span className="text-[10px] text-[#5146D8] font-semibold">92% retention rate</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#E6E9F0] shadow-card">
          <span className="text-[10px] text-[#718096] uppercase font-bold">Total Shares</span>
          <div className="text-2xl font-black text-[#5146D8] mt-1">2,840</div>
          <span className="text-[10px] text-[#16A477] font-semibold">3x viral weighting</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#E6E9F0] shadow-card">
          <span className="text-[10px] text-[#718096] uppercase font-bold">Agent Memory Hits</span>
          <div className="text-2xl font-black text-[#3478F6] mt-1">98.2%</div>
          <span className="text-[10px] text-[#718096]">Sub-110ms vector retrieval</span>
        </div>
      </div>
    </div>
  );
}

// 4. SETTINGS VIEW
export function SettingsView() {
  const [currentTimezone, setCurrentTimezone] = useState("SYSTEM");
  const { formattedDate, formattedTime, mounted } = useLiveClock(1000);

  useEffect(() => {
    setCurrentTimezone(typeof window !== "undefined" ? localStorage.getItem("sociotrack_timezone") || "SYSTEM" : "SYSTEM");
  }, []);

  const handleTimezoneChange = (newTz: string) => {
    setCurrentTimezone(newTz);
    setUserTimezone(newTz);
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="pb-3 border-b border-[#E6E9F0]">
        <h2 className="text-xl font-extrabold text-[#172033]">Agent &amp; Brand Settings</h2>
        <p className="text-xs text-[#718096]">
          Configure deterministic brand voice guidelines, workspace timezone, creator bios, and vector storage.
        </p>
      </div>

      {/* Timezone & Localization Preferences Card */}
      <div className="bg-white rounded-2xl border border-[#E6E9F0] p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E6E9F0]">
          <div>
            <h3 className="text-sm font-bold text-[#172033] flex items-center space-x-2">
              <Clock className="w-4 h-4 text-[#5146D8]" />
              <span>Workspace Timezone &amp; Calendar Precision</span>
            </h3>
            <p className="text-[11px] text-[#718096]">
              Controls midnight rollover, analytics date filtering, and publishing schedule timestamps across screens.
            </p>
          </div>
          <span className="px-2.5 py-1 text-[11px] font-semibold bg-[#ECE9FF] text-[#5146D8] border border-[#5146D8]/30 rounded-full font-mono" suppressHydrationWarning>
            {currentTimezone}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-semibold text-[#172033] block mb-1">Active Timezone</label>
            <select
              value={currentTimezone}
              onChange={(e) => handleTimezoneChange(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-[#E6E9F0] bg-[#F6F7FB] font-medium text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#5146D8]/20 focus:border-[#5146D8]"
            >
              {COMMON_TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label} ({tz.offset})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-[#718096] mt-1">
              Supports seamless scheduling and automatic daylight-saving conversions for Eastern, Pacific, India, and UTC.
            </p>
          </div>

          <div>
            <label className="font-semibold text-[#172033] block mb-1">Live Local Clock Preview</label>
            <div className="w-full h-10 px-3 rounded-xl border border-[#E6E9F0] bg-[#F6F7FB] flex items-center justify-between font-mono font-bold text-[#172033]" suppressHydrationWarning>
              <span>{mounted ? formattedDate : "--"}</span>
              <span className="text-[#5146D8]">{mounted ? formattedTime : "--:--"}</span>
            </div>
            <p className="text-[11px] text-[#16A477] mt-1 font-medium flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Automatic midnight rollover and background tab synchronization active.</span>
            </p>
          </div>
        </div>
      </div>

      {/* Brand & Creator Bio Card */}
      <div className="bg-white rounded-2xl border border-[#E6E9F0] p-6 shadow-card space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#E6E9F0]">
          <div>
            <h3 className="text-sm font-bold text-[#172033]">Brand &amp; Creator Profiles</h3>
            <p className="text-[11px] text-[#718096]">Governs identity framing, tone, and audience alignment across all agent draft generations.</p>
          </div>
          <span className="px-2.5 py-1 text-[11px] font-semibold bg-[#E8F8F3] text-[#16A477] border border-[#16A477]/30 rounded-full">
            Active in Agent Prompts
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-semibold text-[#172033] block mb-1">Brand Handle &amp; Name</label>
            <input
              type="text"
              readOnly
              value="SocioTrack (@DevRelay)"
              className="w-full h-10 px-3 rounded-xl border border-[#E6E9F0] bg-[#F6F7FB] font-medium text-[#172033]"
            />
          </div>
          <div>
            <label className="font-semibold text-[#172033] block mb-1">Target Audience Profile</label>
            <input
              type="text"
              readOnly
              value="Staff+ Engineers, CTOs, AI Founders, DevRel Leads"
              className="w-full h-10 px-3 rounded-xl border border-[#E6E9F0] bg-[#F6F7FB] font-medium text-[#172033]"
            />
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="font-semibold text-[#172033] block mb-1">Brand Identity Bio</label>
            <textarea
              readOnly
              rows={3}
              value="SocioTrack is the autonomous, closed-loop AI social media engagement and audience intelligence engine. Fusing statistical anomaly detection, dynamic memory weights, and LangGraph state machines to transform post-performance metrics into continuous algorithmic learning, turning social feeds into high-converting audience growth."
              className="w-full p-3 rounded-xl border border-[#E6E9F0] bg-[#F6F7FB] font-sans text-xs text-[#172033] leading-relaxed"
            />
          </div>

          <div>
            <label className="font-semibold text-[#172033] block mb-1">Creator Bio (@DevRelay / @dev_dan)</label>
            <textarea
              readOnly
              rows={3}
              value="Full-stack systems engineer &amp; AI researcher building deterministic agentic architectures, state machines, and vector memory engines. Delivering verified production benchmarks, hard architectural teardowns, and zero-hype engineering playbooks."
              className="w-full p-3 rounded-xl border border-[#E6E9F0] bg-[#F6F7FB] font-sans text-xs text-[#172033] leading-relaxed"
            />
          </div>
        </div>
      </div>

      {/* Guidelines Engine Card */}
      <div className="bg-white rounded-2xl border border-[#E6E9F0] p-6 shadow-card space-y-4">
        <h3 className="text-sm font-bold text-[#172033]">Deterministic Brand Voice Constraints</h3>
        <div className="space-y-3 text-xs">
          <div>
            <label className="font-semibold text-[#172033] block mb-1">Brand Voice Dos</label>
            <textarea
              readOnly
              rows={3}
              value="• Quantified benchmark claim in opening 3 lines (e.g., '73% token reduction', '108ms latency')&#10;• Focus on state management, deterministic seams, and cost optimization&#10;• Direct questions or numbered checklists for audience bookmarking"
              className="w-full p-3 rounded-xl border border-[#E6E9F0] bg-[#F6F7FB] font-mono text-[11px] leading-relaxed"
            />
          </div>
          <div>
            <label className="font-semibold text-[#172033] block mb-1">Brand Voice Don&apos;ts</label>
            <textarea
              readOnly
              rows={2}
              value="• No generic hype buzzwords ('groundbreaking', 'game-changing', 'disruptive')&#10;• No unverified performance claims or hollow engagement bait"
              className="w-full p-3 rounded-xl border border-[#E6E9F0] bg-[#F6F7FB] font-mono text-[11px] leading-relaxed"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// 5. HELP CENTER VIEW
export function HelpCenterView() {
  return (
    <div className="max-w-3xl space-y-6">
      <div className="pb-3 border-b border-[#E6E9F0]">
        <h2 className="text-xl font-extrabold text-[#172033]">Help Center &amp; User Guide</h2>
        <p className="text-xs text-[#718096]">
          Walkthrough of the SocioTrack closed-loop social intelligence agent.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-[#E6E9F0] p-6 shadow-card space-y-4 text-xs text-[#718096] leading-relaxed">
        <h3 className="text-sm font-bold text-[#172033]">How the SocioTrack Feedback Loop Works</h3>
        <ol className="list-decimal pl-5 space-y-2">
          <li>
            <strong className="text-[#172033]">Generation:</strong> Select a topic and tone. The LangGraph StateGraph queries ChromaDB vector memory for past winning posts and current audience sentiment.
          </li>
          <li>
            <strong className="text-[#172033]">Evaluation &amp; Approval:</strong> The brand voice evaluator verifies the draft against Dos &amp; Don&apos;ts, assigning an objective match score.
          </li>
          <li>
            <strong className="text-[#172033]">Simulation &amp; Feedback:</strong> Use the bottom Live Engagement Lab to inject live impressions, shares, and likes.
          </li>
          <li>
            <strong className="text-[#172033]">Reinforcement Learning:</strong> If composite score &gt; 5.0, the key lesson is automatically distilled and added to Agent Memory!
          </li>
        </ol>
      </div>
    </div>
  );
}
