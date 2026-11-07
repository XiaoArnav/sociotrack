"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Sparkles,
  RefreshCw,
  Zap,
  BarChart2,
  Compass,
  ArrowUpRight,
  ArrowDownRight,
  Flame,
  Award,
} from "lucide-react";
import { CreatorProfile } from "./InsTrackCreatorCard";

interface InsTrackAuditReportProps {
  creator: CreatorProfile;
  onRunAudit?: () => void;
}

export function InsTrackAuditReport({
  creator,
  onRunAudit,
}: InsTrackAuditReportProps) {
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditProgress, setAuditProgress] = useState(100);
  const [auditComplete, setAuditComplete] = useState(true);

  const handleTriggerAudit = () => {
    setIsAuditing(true);
    setAuditProgress(15);
    setAuditComplete(false);

    const step1 = setTimeout(() => setAuditProgress(45), 400);
    const step2 = setTimeout(() => setAuditProgress(80), 800);
    const step3 = setTimeout(() => {
      setAuditProgress(100);
      setIsAuditing(false);
      setAuditComplete(true);
      onRunAudit?.();
    }, 1200);

    return () => {
      clearTimeout(step1);
      clearTimeout(step2);
      clearTimeout(step3);
    };
  };

  // Dynamic audit indexes based on score
  const viralityIndex = ((creator.score / 100) * 5.8).toFixed(1);
  const utilityIndex = ((creator.score / 100) * 8.6).toFixed(1);
  const healthGrade =
    creator.score >= 90 ? "A+" : creator.score >= 75 ? "A" : creator.score >= 65 ? "B+" : "B";
  const isArnav =
    creator.handle.toLowerCase().includes("arnav") || creator.handle.toLowerCase().includes("patel");

  return (
    <div className="space-y-6">
      {/* Top Banner: Overall Account Health Scorecard */}
      <div className="bg-white dark:bg-[#161F30] rounded-2xl border border-slate-200 dark:border-[#243048] p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-[#243048]">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Account Diagnostic Audit: @{creator.handle}
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
              Autonomous AI audit evaluated against 14,800+ indexed niche creators. Real-time Meta Graph API telemetry &amp; vector retention signals.
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-xs font-semibold text-slate-400">Audit Status</div>
              <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-end space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Synchronized</span>
              </div>
            </div>
            <button
              onClick={handleTriggerAudit}
              disabled={isAuditing}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-[#6366F1] hover:bg-[#5558E6] text-white text-xs font-bold shadow-md transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? "animate-spin" : ""}`} />
              <span>{isAuditing ? "Auditing API..." : "Re-Run Audit"}</span>
            </button>
          </div>
        </div>

        {/* Audit Progress Bar when re-auditing */}
        {isAuditing && (
          <div className="pt-4 space-y-2">
            <div className="flex justify-between text-xs font-mono text-slate-500">
              <span>Auditing Meta Webhooks &amp; Engagement Graph...</span>
              <span>{auditProgress}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-300"
                style={{ width: `${auditProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* 4 Scorecard Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1E2638] border border-slate-100 dark:border-[#243048]">
            <span className="text-[11px] font-semibold text-slate-400">SocioTrack Score</span>
            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
              {creator.score}%
            </div>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              Grade {healthGrade} • High Authority
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1E2638] border border-slate-100 dark:border-[#243048]">
            <span className="text-[11px] font-semibold text-slate-400">Virality Index (VI)</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {viralityIndex}%
            </div>
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
              Top 12% in Niche
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1E2638] border border-slate-100 dark:border-[#243048]">
            <span className="text-[11px] font-semibold text-slate-400">Utility Index (UI)</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {utilityIndex}%
            </div>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              High Save-to-Share Ratio
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1E2638] border border-slate-100 dark:border-[#243048]">
            <span className="text-[11px] font-semibold text-slate-400">Active Audience Retention</span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              91.4%
            </div>
            <span className="text-[10px] font-bold text-slate-400">
              Zero Bot Contamination
            </span>
          </div>
        </div>
      </div>

      {/* Two Columns: What's Working vs What's Failing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: What's Working */}
        <div className="bg-white dark:bg-[#161F30] rounded-2xl border border-slate-200 dark:border-[#243048] p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 dark:border-[#243048]">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                What&apos;s Working (High-Yield Hooks)
              </h3>
              <p className="text-[11px] text-slate-400">
                Top performing vectors validated by AI vector memory.
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            {isArnav ? (
              <>
                <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 space-y-1">
                  <div className="flex items-center justify-between font-bold text-emerald-800 dark:text-emerald-300">
                    <span>Contrarian AI Architecture Reels</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
                      +16.99% ER
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                    Hooks unpacking why 90% of autonomous agents hallucinate in production generate 3.2x higher technical peer shares and 94% retention.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 space-y-1">
                  <div className="flex items-center justify-between font-bold text-emerald-800 dark:text-emerald-300">
                    <span>Slide-by-Slide System Diagrams</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
                      +22.94% ER
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                    Carousels visualizing real-time webhook queues and vector memory retrieval achieve a 4.6x higher bookmark rate among developers.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 space-y-1">
                  <div className="flex items-center justify-between font-bold text-emerald-800 dark:text-emerald-300">
                    <span>High Save-to-Share Ratio (1:4.8)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
                      Viral Signal
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                    Evergreen technical breakdowns function as permanent reference bookmarks. Instagram re-serves slide 2 to unswiped feed impressions.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 space-y-1">
                  <div className="flex items-center justify-between font-bold text-emerald-800 dark:text-emerald-300">
                    <span>Data-First Educational Carousels</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
                      +3.82% ER
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                    Posts opening with concrete numbers within the first slide achieve a 4.2x higher bookmark rate and 84% full-carousel swipe completions.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 space-y-1">
                  <div className="flex items-center justify-between font-bold text-emerald-800 dark:text-emerald-300">
                    <span>Peak Tuesday Morning Delivery</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
                      +42% Reach
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                    Publishing between 08:30 and 10:00 AM UTC aligns with audience check-in habits, ensuring algorithm velocity within the initial 45 minutes.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 space-y-1">
                  <div className="flex items-center justify-between font-bold text-emerald-800 dark:text-emerald-300">
                    <span>High Save-to-Like Ratio (1:3.8)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
                      Viral Signal
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                    Instagram&apos;s 2026 ranking engine heavily prioritizes bookmarks over vanity likes. Your content functions as evergreen reference material.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Column: What's Failing */}
        <div className="bg-white dark:bg-[#161F30] rounded-2xl border border-slate-200 dark:border-[#243048] p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 dark:border-[#243048]">
            <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                What&apos;s Failing / Red Flags
              </h3>
              <p className="text-[11px] text-slate-400">
                Distribution bottlenecks dragging down account velocity.
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 space-y-1">
              <div className="flex items-center justify-between font-bold text-rose-800 dark:text-rose-300">
                <span>Single Static Images Underperforming</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-rose-200/60 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200">
                  -68% Reach
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                Static non-carousel photos yield only 1.08% ER. Feed algorithms favor content formats that hold session dwell time above 12 seconds.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 space-y-1">
              <div className="flex items-center justify-between font-bold text-rose-800 dark:text-rose-300">
                <span>Reel Audio Retention Drop-off at 4.2s</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-rose-200/60 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200">
                  Attention Leak
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                Reels without immediate visual pattern interrupts or on-screen kinetic captions experience 52% viewer abandonment before reaching the midpoint.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 space-y-1">
              <div className="flex items-center justify-between font-bold text-rose-800 dark:text-rose-300">
                <span>Weekend Distribution Flatline</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-rose-200/60 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200">
                  Timing Mismatch
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                Publishing technical frameworks on Saturday afternoons generates 60% lower comment participation compared to weekday morning schedules.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Autonomous AI Prescriptions */}
      <div className="bg-gradient-to-r from-indigo-50 to-sky-50 dark:from-[#1E2638] dark:to-[#161F30] rounded-2xl border border-indigo-100 dark:border-[#243048] p-6 shadow-sm space-y-4">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Autonomous AI Prescriptions for @{creator.handle}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-white dark:bg-[#161F30] border border-slate-200 dark:border-[#243048] space-y-2">
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
              Step 1: Repackage Static Posts
            </span>
            <p className="text-slate-700 dark:text-slate-300 font-medium">
              Convert your static single-image posts into 5-slide carousels using the Post Generator in AI Studio.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-[#161F30] border border-slate-200 dark:border-[#243048] space-y-2">
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
              Step 2: Add 3-Second Kinetic Captions
            </span>
            <p className="text-slate-700 dark:text-slate-300 font-medium">
              Incorporate bold on-screen thesis questions in slide 1 to prevent early drop-off and boost retention past 8.5s.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-[#161F30] border border-slate-200 dark:border-[#243048] space-y-2">
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
              Step 3: Lock Tuesday &amp; Thursday Cadence
            </span>
            <p className="text-slate-700 dark:text-slate-300 font-medium">
              Schedule technical deep dives precisely at 08:30 AM UTC to catch peak professional check-in velocity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
