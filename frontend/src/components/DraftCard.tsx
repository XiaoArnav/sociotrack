"use client";

import React, { useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  Calendar,
  RotateCw,
  ChevronDown,
  ChevronUp,
  Brain,
  Share2,
  TrendingUp,
  Sliders,
  Copy,
  Check,
  Edit3,
} from "lucide-react";
import { PostDraft, PlatformType } from "@/mocks/mockData";

interface DraftCardProps {
  draft: PostDraft;
  onUpdateContent: (id: string, newContent: string) => void;
  onApprove: (draft: PostDraft) => void;
  onRegenerate: (id: string) => void;
  onSendToSimulator: (content: string) => void;
  isRegenerating?: boolean;
}

export function DraftCard({
  draft,
  onUpdateContent,
  onApprove,
  onRegenerate,
  onSendToSimulator,
  isRegenerating = false,
}: DraftCardProps) {
  const [showExplanation, setShowExplanation] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const charLimit = draft.platform === "X" ? 280 : draft.platform === "LinkedIn" ? 3000 : 2200;
  const charCount = draft.content.length;
  const isOverLimit = charCount > charLimit;

  const handleCopy = () => {
    navigator.clipboard.writeText(draft.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Platform icon helper
  const renderPlatformBadge = (platform: PlatformType) => {
    switch (platform) {
      case "LinkedIn":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#0A66C2]/10 text-[#0A66C2] border border-[#0A66C2]/20">
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.45a1.6 1.6 0 0 0-1.6 1.6 1.6 1.6 0 0 0 1.6 1.6 1.6 1.6 0 0 0 1.6-1.6 1.6 1.6 0 0 0-1.6-1.6Z" />
            </svg>
            <span>LinkedIn</span>
          </span>
        );
      case "X":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-black/5 text-[#172033] border border-black/15">
            <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            <span>X (Twitter)</span>
          </span>
        );
      case "Instagram":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-pink-50 text-pink-600 border border-pink-200">
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
            <span>Instagram</span>
          </span>
        );
    }
  };

  // Predicted Engagement meter color helper
  const getEngagementBadge = (level: "LOW" | "MEDIUM" | "HIGH") => {
    switch (level) {
      case "HIGH":
        return {
          bg: "bg-[#E8F8F3] text-[#16A477] border-[#16A477]/30",
          barColor: "bg-[#16A477]",
          width: "92%",
          label: "HIGH",
        };
      case "MEDIUM":
        return {
          bg: "bg-amber-50 text-amber-700 border-amber-300",
          barColor: "bg-amber-500",
          width: "65%",
          label: "MEDIUM",
        };
      case "LOW":
        return {
          bg: "bg-slate-100 text-slate-700 border-slate-300",
          barColor: "bg-slate-400",
          width: "35%",
          label: "LOW",
        };
    }
  };

  const engInfo = getEngagementBadge(draft.predictedEngagement);

  return (
    <div
      className={`bg-white rounded-2xl border transition-all duration-300 shadow-card hover:shadow-card-hover p-6 relative ${
        draft.status === "Approved" || draft.status === "Scheduled"
          ? "border-[#16A477]/40 ring-1 ring-[#16A477]/20"
          : "border-[#E6E9F0]"
      }`}
    >
      {/* Top Meta Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#E6E9F0]">
        <div className="flex items-center space-x-2.5">
          {renderPlatformBadge(draft.platform)}
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#ECE9FF] text-[#5146D8]">
            <Sparkles className="w-3 h-3" />
            <span>{draft.hookStyle}</span>
          </span>
          <span className="inline-flex items-center space-x-1 text-[11px] font-medium text-[#718096] bg-[#F6F7FB] px-2 py-0.5 rounded">
            <span>Tone: {draft.tone}</span>
          </span>
        </div>

        {/* Status Pill */}
        <div className="flex items-center space-x-2">
          {draft.status === "Draft" ? (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              Draft Pending
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#E8F8F3] text-[#16A477] border border-[#16A477]/30">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Approved &amp; Scheduled</span>
            </span>
          )}
        </div>
      </div>

      {/* Editable Content Area */}
      <div className="my-4 space-y-2">
        <div className="flex items-center justify-between text-xs text-[#718096]">
          <div className="flex items-center space-x-1.5 font-medium">
            <Edit3 className="w-3.5 h-3.5 text-[#5146D8]" />
            <span>Interactive Draft (Live Editable)</span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleCopy}
              className="text-[#718096] hover:text-[#5146D8] flex items-center space-x-1 font-medium transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#16A477]" />
                  <span className="text-[#16A477]">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
            <span
              className={`font-mono text-[11px] font-semibold ${
                isOverLimit ? "text-red-600" : "text-[#718096]"
              }`}
            >
              {charCount} / {charLimit} chars
            </span>
          </div>
        </div>

        <textarea
          rows={6}
          value={draft.content}
          onChange={(e) => onUpdateContent(draft.id, e.target.value)}
          disabled={isRegenerating}
          className={`w-full p-4 rounded-xl text-xs sm:text-sm text-[#172033] bg-[#F6F7FB] border focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5146D8]/20 transition-all font-sans leading-relaxed resize-y ${
            isOverLimit ? "border-red-300" : "border-[#E6E9F0] focus:border-[#5146D8]"
          }`}
        />
      </div>

      {/* Predicted Engagement Meter Bar */}
      <div className="p-3.5 rounded-xl bg-[#F6F7FB] border border-[#E6E9F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-white border border-[#E6E9F0] flex items-center justify-center text-[#5146D8]">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-[#718096] uppercase tracking-wider">
              Predicted Engagement
            </div>
            <div className="flex items-center space-x-2">
              <span
                className={`px-2 py-0.5 rounded text-xs font-bold border ${engInfo.bg}`}
              >
                {engInfo.label}
              </span>
              <span className="text-xs font-bold text-[#172033]">
                {draft.confidenceScore}% Confidence
              </span>
            </div>
          </div>
        </div>

        {/* Engagement Progress Bar */}
        <div className="w-full sm:w-44 space-y-1">
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${engInfo.barColor} transition-all duration-500 rounded-full`}
              style={{ width: engInfo.width }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-[#718096] font-mono">
            <span>Low</span>
            <span>Med</span>
            <span>High</span>
          </div>
        </div>
      </div>

      {/* Collapsible Explainability Section: "Why SocioTrack generated this" */}
      <div className="mt-3.5">
        <button
          onClick={() => setShowExplanation(!showExplanation)}
          className="w-full flex items-center justify-between p-3 rounded-xl bg-[#ECE9FF]/50 border border-[#ECE9FF] hover:bg-[#ECE9FF]/80 transition-colors text-left"
        >
          <div className="flex items-center space-x-2">
            <Brain className="w-4 h-4 text-[#5146D8]" />
            <span className="text-xs font-bold text-[#5146D8]">
              Why SocioTrack generated this
            </span>
          </div>
          {showExplanation ? (
            <ChevronUp className="w-4 h-4 text-[#5146D8]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#5146D8]" />
          )}
        </button>

        {showExplanation && (
          <div className="p-3.5 bg-[#FAF9FF] border border-[#ECE9FF] border-t-0 rounded-b-xl text-xs text-[#172033] leading-relaxed space-y-2 animate-slide-up">
            <p className="italic text-[#172033]">
              &ldquo;{draft.aiExplanation}&rdquo;
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-[11px]">
              <div className="bg-white p-2 rounded-lg border border-[#ECE9FF]">
                <span className="font-bold text-[#16A477] block mb-1">
                  ✓ Brand Dos Matched:
                </span>
                <ul className="space-y-0.5 text-[#718096]">
                  {draft.dosMatched.map((d, i) => (
                    <li key={i} className="truncate">• {d}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-white p-2 rounded-lg border border-[#ECE9FF]">
                <span className="font-bold text-[#5146D8] block mb-1">
                  🛡 Constraints Respected:
                </span>
                <ul className="space-y-0.5 text-[#718096]">
                  {draft.dontsAvoided.map((d, i) => (
                    <li key={i} className="truncate">• {d}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Card Footer Action Buttons */}
      <div className="mt-5 pt-4 border-t border-[#E6E9F0] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          {/* Regenerate Button */}
          <button
            onClick={() => onRegenerate(draft.id)}
            disabled={isRegenerating}
            className="h-9 px-3.5 rounded-xl border border-[#E6E9F0] bg-white hover:bg-[#F6F7FB] text-xs font-semibold text-[#172033] flex items-center space-x-1.5 transition-colors"
          >
            <RotateCw className={`w-3.5 h-3.5 text-[#718096] ${isRegenerating ? "animate-spin" : ""}`} />
            <span>{isRegenerating ? "Synthesizing..." : "Regenerate"}</span>
          </button>

          {/* Test in Simulator Button */}
          <button
            onClick={() => onSendToSimulator(draft.content)}
            className="h-9 px-3.5 rounded-xl border border-[#E6E9F0] bg-white hover:bg-[#F6F7FB] text-xs font-semibold text-[#5146D8] flex items-center space-x-1.5 transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-[#5146D8]" />
            <span>Simulate Engagement</span>
          </button>
        </div>

        {/* Approve & Schedule Primary Button */}
        <button
          onClick={() => onApprove(draft)}
          disabled={draft.status === "Approved" || draft.status === "Scheduled"}
          className={`h-9 px-5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-2 transition-all ${
            draft.status === "Approved" || draft.status === "Scheduled"
              ? "bg-[#E8F8F3] text-[#16A477] border border-[#16A477]/30 cursor-default"
              : "bg-gradient-to-r from-[#5146D8] to-[#3478F6] text-white hover:opacity-95 shadow-md shadow-[#5146D8]/20"
          }`}
        >
          {draft.status === "Approved" || draft.status === "Scheduled" ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-[#16A477]" />
              <span>Approved &amp; Scheduled</span>
            </>
          ) : (
            <>
              <Calendar className="w-4 h-4" />
              <span>Approve &amp; Schedule</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
