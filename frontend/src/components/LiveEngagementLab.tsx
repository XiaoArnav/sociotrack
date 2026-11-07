"use client";

import React, { useState } from "react";
import {
  Activity,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Play,
  CheckCircle2,
  Sliders,
  Send,
  Zap,
  RotateCw,
  Trophy,
  ArrowRight,
} from "lucide-react";
import { PUBLISHED_POSTS_OPTIONS, LearnedInsight } from "@/mocks/mockData";

interface LiveEngagementLabProps {
  onPatternDiscovered: (newInsight: LearnedInsight) => void;
  onSimulationStart?: () => void;
  onSimulationEnd?: () => void;
}

export function LiveEngagementLab({
  onPatternDiscovered,
  onSimulationStart,
  onSimulationEnd,
}: LiveEngagementLabProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(PUBLISHED_POSTS_OPTIONS[0].id);

  // Sliders state
  const [impressions, setImpressions] = useState(18500);
  const [shares, setShares] = useState(380);
  const [likes, setLikes] = useState(890);
  const [replies, setReplies] = useState(145);

  // Simulation running state & active step (1 to 5)
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Compute composite engagement score dynamically
  const compositeScore =
    impressions > 0
      ? Number((((shares * 3 + replies * 2 + likes * 1) / impressions) * 100).toFixed(2))
      : 0;
  const qualifiesForMemory = compositeScore > 5.0;

  const steps = [
    { num: 1, label: "Engagement data received" },
    { num: 2, label: "AI analyzing audience response" },
    { num: 3, label: "New engagement pattern identified" },
    { num: 4, label: "Agent memory updated" },
    { num: 5, label: "Future recommendations improved" },
  ];

  // Presets
  const handleApplyPreset = (type: "viral" | "average" | "low") => {
    if (type === "viral") {
      setImpressions(22000);
      setShares(540);
      setReplies(210);
      setLikes(1400);
    } else if (type === "average") {
      setImpressions(15000);
      setShares(140);
      setReplies(60);
      setLikes(450);
    } else {
      setImpressions(10000);
      setShares(20);
      setReplies(10);
      setLikes(80);
    }
  };

  const handleSubmitMetrics = () => {
    setIsSimulating(true);
    if (onSimulationStart) onSimulationStart();

    // Step 1
    setActiveStep(1);
    setTimeout(() => {
      // Step 2
      setActiveStep(2);
      setTimeout(() => {
        // Step 3
        setActiveStep(3);
        setTimeout(() => {
          // Step 4: Dispatch new memory insight!
          setActiveStep(4);
          const newInsight: LearnedInsight = {
            id: `insight_discovered_${Date.now()}`,
            type: "discovered",
            title: "Dynamic Audience Breakthrough",
            insight:
              compositeScore > 7.0
                ? "Posts featuring practical cost-saving examples generate 2.1x more shares."
                : "Audience responds +42% more to concise numbered checklists than prose.",
            metric: `${compositeScore.toFixed(1)} Composite Score`,
            confidence: "Confidence: 98% (Ingested)",
            timestamp: "Just now",
            isNew: true,
          };
          onPatternDiscovered(newInsight);

          setTimeout(() => {
            // Step 5
            setActiveStep(5);
            setShowSuccessToast(true);
            setIsSimulating(false);
            if (onSimulationEnd) onSimulationEnd();

            // Auto-hide success toast after 5s
            setTimeout(() => {
              setShowSuccessToast(false);
              setActiveStep(0);
            }, 6000);
          }, 700);
        }, 700);
      }, 700);
    }, 600);
  };

  return (
    <>
      {/* Dynamic Success Toast */}
      {showSuccessToast && (
        <div className="fixed top-6 right-6 z-50 max-w-md bg-white border-2 border-[#16A477] rounded-2xl p-4 shadow-float animate-slide-up flex items-start space-x-3">
          <div className="w-9 h-9 rounded-xl bg-[#E8F8F3] text-[#16A477] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <h4 className="text-xs font-bold text-[#172033]">
                New audience pattern discovered!
              </h4>
              <span className="text-[10px] font-bold bg-[#E8F8F3] text-[#16A477] px-2 py-0.5 rounded-full">
                Saved to Memory
              </span>
            </div>
            <p className="text-xs text-[#718096] leading-relaxed">
              SocioTrack has learned a new audience preference and updated its memory.
              Future generated drafts will automatically apply this rule.
            </p>
          </div>
        </div>
      )}

      {/* Floating Bottom Drawer Container */}
      <div className="fixed bottom-0 left-0 right-0 z-40 px-4 sm:px-6 pb-3 pointer-events-none">
        <div className="max-w-5xl mx-auto bg-white rounded-2xl border border-[#E6E9F0] shadow-float pointer-events-auto transition-all duration-300 overflow-hidden">
          {/* =================================================================
              COLLAPSED BAR HEADER
              ================================================================= */}
          <div
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-between px-5 py-3 cursor-pointer bg-white hover:bg-[#F6F7FB] transition-colors select-none"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#5146D8] to-[#3478F6] text-white flex items-center justify-center shadow-sm">
                <Activity className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-xs font-extrabold text-[#172033] tracking-tight">
                    Live Engagement Lab
                  </h3>
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ECE9FF] text-[#5146D8]">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>Demo Mode</span>
                  </span>
                </div>
                <p className="text-[11px] text-[#718096]">
                  Teach your AI agent through engagement feedback.
                </p>
              </div>
            </div>

            {/* Right: Quick Composite preview & expand button */}
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex items-center space-x-2 text-xs">
                <span className="text-[#718096]">Score:</span>
                <span
                  className={`font-black font-mono px-2 py-0.5 rounded text-xs ${
                    qualifiesForMemory
                      ? "bg-[#E8F8F3] text-[#16A477]"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {compositeScore}
                </span>
              </div>
              <button
                type="button"
                className="w-8 h-8 rounded-xl border border-[#E6E9F0] bg-[#F6F7FB] flex items-center justify-center text-[#5146D8] hover:bg-[#ECE9FF] transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronUp className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* =================================================================
              EXPANDED DRAWER CONTENT
              ================================================================= */}
          {isExpanded && (
            <div className="p-5 border-t border-[#E6E9F0] space-y-5 bg-[#FAF9FF]/40 animate-slide-up">
              {/* Published Post Selector & Presets */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex-1 space-y-1">
                  <label className="text-xs font-semibold text-[#172033] block">
                    Published Post for Metric Injection:
                  </label>
                  <select
                    value={selectedPostId}
                    onChange={(e) => setSelectedPostId(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-[#E6E9F0] bg-white text-xs text-[#172033] font-medium focus:outline-none focus:ring-2 focus:ring-[#5146D8]/20 focus:border-[#5146D8]"
                  >
                    {PUBLISHED_POSTS_OPTIONS.map((p) => (
                      <option key={p.id} value={p.id}>
                        [{p.platform}] {p.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quick Presets */}
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-[#718096] block">
                    Quick Scenario Presets:
                  </span>
                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => handleApplyPreset("viral")}
                      className="px-2.5 py-1.5 rounded-lg border border-[#16A477]/30 bg-[#E8F8F3] text-[#16A477] text-xs font-bold hover:opacity-90"
                    >
                      🚀 Viral Outlier (&gt;8.0)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset("average")}
                      className="px-2.5 py-1.5 rounded-lg border border-[#E6E9F0] bg-white text-[#718096] text-xs font-semibold hover:text-[#172033]"
                    >
                      📊 Industry Avg (~4.2)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset("low")}
                      className="px-2.5 py-1.5 rounded-lg border border-[#E6E9F0] bg-white text-[#718096] text-xs font-semibold hover:text-[#172033]"
                    >
                      📉 Low Engagement
                    </button>
                  </div>
                </div>
              </div>

              {/* Engagement Sliders Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-2xl bg-white border border-[#E6E9F0]">
                {/* 1. Impressions Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-[#718096]">Impressions</span>
                    <span className="font-mono font-bold text-[#172033]">
                      {impressions.toLocaleString()}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1000}
                    max={50000}
                    step={500}
                    value={impressions}
                    onChange={(e) => setImpressions(Number(e.target.value))}
                    className="w-full cursor-pointer h-2 bg-slate-200 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-[#718096]">
                    <span>1k</span>
                    <span>50k</span>
                  </div>
                </div>

                {/* 2. Shares Slider (weight x3) */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-[#718096]">
                      Shares <span className="text-[#5146D8] font-bold">(3x)</span>
                    </span>
                    <span className="font-mono font-bold text-[#172033]">
                      {shares.toLocaleString()}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={1000}
                    step={10}
                    value={shares}
                    onChange={(e) => setShares(Number(e.target.value))}
                    className="w-full cursor-pointer h-2 bg-slate-200 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-[#718096]">
                    <span>5</span>
                    <span>1,000</span>
                  </div>
                </div>

                {/* 3. Replies Slider (weight x2) */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-[#718096]">
                      Replies <span className="text-[#3478F6] font-bold">(2x)</span>
                    </span>
                    <span className="font-mono font-bold text-[#172033]">
                      {replies.toLocaleString()}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={500}
                    step={5}
                    value={replies}
                    onChange={(e) => setReplies(Number(e.target.value))}
                    className="w-full cursor-pointer h-2 bg-slate-200 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-[#718096]">
                    <span>0</span>
                    <span>500</span>
                  </div>
                </div>

                {/* 4. Likes Slider (weight x1) */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-[#718096]">
                      Likes <span className="text-[#16A477] font-bold">(1x)</span>
                    </span>
                    <span className="font-mono font-bold text-[#172033]">
                      {likes.toLocaleString()}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={3000}
                    step={25}
                    value={likes}
                    onChange={(e) => setLikes(Number(e.target.value))}
                    className="w-full cursor-pointer h-2 bg-slate-200 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-[#718096]">
                    <span>10</span>
                    <span>3,000</span>
                  </div>
                </div>
              </div>

              {/* Engagement Summary & Submit Action */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-[#E6E9F0]">
                {/* Score Formula Display */}
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="text-[#718096] font-medium">Composite Viral Score:</span>
                    <span
                      className={`font-black font-mono text-base px-2.5 py-0.5 rounded-lg ${
                        qualifiesForMemory
                          ? "bg-[#E8F8F3] text-[#16A477] border border-[#16A477]/30"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {compositeScore}
                    </span>
                  </div>

                  <span className="text-[#718096]">|</span>

                  <div className="text-[11px] text-[#718096]">
                    Formula:{" "}
                    <code className="font-mono bg-[#F6F7FB] px-1.5 py-0.5 rounded border border-[#E6E9F0]">
                      ((Shares*3 + Replies*2 + Likes*1) / Impr) * 100
                    </code>
                  </div>

                  <span className="text-[#718096]">|</span>

                  <span
                    className={`text-xs font-bold ${
                      qualifiesForMemory ? "text-[#16A477]" : "text-amber-600"
                    }`}
                  >
                    {qualifiesForMemory
                      ? "✓ Qualifies for Long-Term Memory (Score > 5.0)"
                      : "✕ Below 5.0 Threshold (Discarded from Memory)"}
                  </span>
                </div>

                {/* Primary Button */}
                <button
                  type="button"
                  onClick={handleSubmitMetrics}
                  disabled={isSimulating}
                  className="h-11 px-6 rounded-xl bg-gradient-to-r from-[#5146D8] to-[#3478F6] hover:opacity-95 text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-[#5146D8]/20 flex items-center justify-center space-x-2 transition-all shrink-0"
                >
                  {isSimulating ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      <span>Simulating AI Feedback Loop...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Metrics</span>
                    </>
                  )}
                </button>
              </div>

              {/* 5-Step Visual Feedback Loop Stepper */}
              {(isSimulating || activeStep > 0) && (
                <div className="p-4 rounded-2xl bg-white border border-[#5146D8]/30 shadow-card space-y-3 animate-slide-up">
                  <div className="flex items-center justify-between text-xs font-bold text-[#5146D8]">
                    <span className="flex items-center space-x-2">
                      <Zap className="w-4 h-4 animate-bounce" />
                      <span>Autonomous Closed-Loop Feedback Ingestion</span>
                    </span>
                    <span>Step {Math.max(1, activeStep)} of 5</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                    {steps.map((step) => {
                      const isComplete = activeStep > step.num;
                      const isCurrent = activeStep === step.num;

                      return (
                        <div
                          key={step.num}
                          className={`p-2.5 rounded-xl border text-xs transition-all ${
                            isComplete
                              ? "bg-[#E8F8F3] border-[#16A477]/40 text-[#16A477]"
                              : isCurrent
                              ? "bg-[#ECE9FF] border-[#5146D8] text-[#5146D8] ring-2 ring-[#5146D8]/20 animate-pulse font-bold"
                              : "bg-[#F6F7FB] border-[#E6E9F0] text-[#718096]"
                          }`}
                        >
                          <div className="flex items-center space-x-1.5 mb-1">
                            {isComplete ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#16A477]" />
                            ) : (
                              <span
                                className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center ${
                                  isCurrent
                                    ? "bg-[#5146D8] text-white"
                                    : "bg-slate-200 text-[#718096]"
                                }`}
                              >
                                {step.num}
                              </span>
                            )}
                            <span className="font-bold text-[10px]">
                              Step {step.num}
                            </span>
                          </div>
                          <p className="text-[11px] leading-tight">
                            {step.label}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
