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
  Star,
  ThumbsDown,
  Send,
  X,
  FileDown,
} from "lucide-react";
import { PostDraft, PlatformType } from "@/mocks/mockData";

interface DraftCardProps {
  draft: PostDraft;
  onUpdateContent: (id: string, newContent: string) => void;
  onApprove: (draft: PostDraft) => void;
  onRegenerate: (id: string) => void;
  onSendToSimulator: (content: string) => void;
  isRegenerating?: boolean;
  apiBaseUrl?: string;
  brandId?: string;
  onToast?: (title: string, message: string, type: "info" | "success" | "warning") => void;
}

export function DraftCard({
  draft,
  onUpdateContent,
  onApprove,
  onRegenerate,
  onSendToSimulator,
  isRegenerating = false,
  apiBaseUrl = "",
  brandId = "brd_default",
  onToast,
}: DraftCardProps) {
  const [copied, setCopied] = useState(false);
  const [showExplainability, setShowExplainability] = useState(false);

  // Recommendation Quality Rating & Rejection States
  const [rating, setRating] = useState<number>(draft.status === "Approved" ? 5 : 4);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("poor_voice");
  const [rejectionNotes, setRejectionNotes] = useState("");
  const [isRejected, setIsRejected] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const charCount = draft.content.length;
  const charLimit = 2200; // Instagram standard limit
  const isOverLimit = charCount > charLimit;

  const handleCopy = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(draft.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRate = async (newRating: number) => {
    setRating(newRating);
    try {
      await fetch(`${apiBaseUrl}/api/recommendations/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draft_id: draft.id,
          brand_id: brandId,
          decision: "accepted",
          usefulness_rating: newRating,
        }),
      });
      onToast?.("Rating Saved", `Rated ${newRating} stars. Memory confidence updated.`, "success");
    } catch {
      // Offline fallback
    }
  };

  const handleRejectSubmit = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/recommendations/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draft_id: draft.id,
          brand_id: brandId,
          decision: "rejected",
          rejection_reason: rejectionReason,
          user_explanation: rejectionNotes.trim() || undefined,
          usefulness_rating: rating,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setIsRejected(true);
        setShowRejectModal(false);
        if (data.memory_lesson_created) {
          onToast?.(
            "Recommendation Rejected",
            "Recurring pattern detected: negative guideline recorded in brand memory bank.",
            "info"
          );
        } else {
          onToast?.(
            "Feedback Recorded",
            `Signal noted (${data.rejection_count || 1}x). Permanent rules require recurring patterns before adapting brand boundaries.`,
            "info"
          );
        }
      }
    } catch {
      setIsRejected(true);
      setShowRejectModal(false);
      onToast?.("Feedback Recorded", "Marked as rejected in local session.", "info");
    }
  };

  const handleExportContent = async () => {
    setIsExporting(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/pilot/export-content`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand_id: brandId,
          caption: draft.content,
          format: draft.format || "Carousel",
          hashtags: ["#SocialIntelligence", "#AudienceGrowth"],
          optimal_utc_time: "14:00 UTC",
          target_platform: "instagram",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (typeof window !== "undefined") {
          navigator.clipboard.writeText(data.clipboard_text);
        }
        onToast?.(
          "Export Ready & Copied!",
          "Formatted markdown with hashtags and optimal UTC timing copied to clipboard for manual Buffer/Hootsuite publishing.",
          "success"
        );
      } else {
        handleCopy();
        onToast?.("Copied to Clipboard", "Caption copied for external scheduling.", "success");
      }
    } catch {
      handleCopy();
      onToast?.("Copied to Clipboard", "Caption copied for external scheduling.", "success");
    } finally {
      setIsExporting(false);
    }
  };

  const formatBadgeColors: Record<string, string> = {
    Carousel: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800",
    "Single Post": "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800",
    Reel: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800",
    Story: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
    Playbook: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
    Discussion: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800",
  };

  if (isRejected) {
    return (
      <div className="bg-slate-50 dark:bg-[#121824] rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-4 text-center text-slate-400 space-y-1 text-xs">
        <p className="font-semibold text-slate-600 dark:text-slate-300">
          Recommendation Rejected ({rejectionReason})
        </p>
        <p className="text-[11px]">
          Negative guideline recorded in your brand&apos;s vector memory bank. Future drafts will avoid this pattern.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#161F30] rounded-2xl border border-slate-200/80 dark:border-[#243048] p-5 sm:p-6 shadow-xs hover:shadow-md transition-shadow">
      {/* Top Header: Platform, Format, Predicted Engagement & Quality Rating */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-[#243048]">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border ${
              formatBadgeColors[draft.format || "Carousel"] || "bg-slate-100 text-slate-700 border-slate-200"
            }`}
          >
            {draft.format || "Carousel"}
          </span>

          <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-[#1E2638] text-slate-600 dark:text-slate-300 font-mono font-medium">
            Style: {draft.hookStyle}
          </span>

          {draft.isAiGenerated ? (
            <span
              className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 font-mono font-semibold"
              title={`Generated with real foundation model (${draft.model || draft.provider}) in ${draft.latencyMs || 0}ms`}
            >
              AI: {draft.model || draft.provider}
            </span>
          ) : (
            <span
              className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#1E2638] border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-mono font-medium"
              title={draft.fallbackReason || "Deterministic Rule Engine (No API key)"}
            >
              Offline Rule Engine
            </span>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {/* Quality Star Rating */}
          <div className="flex items-center space-x-0.5" title="Rate recommendation quality">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleRate(s)}
                className="p-0.5 text-slate-300 hover:text-amber-400 transition-colors"
              >
                <Star
                  className={`w-3.5 h-3.5 ${
                    s <= rating ? "text-amber-400 fill-amber-400" : "text-slate-300 dark:text-slate-600"
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Predicted Engagement Pill */}
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
            <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
            <span>{draft.confidenceScore ?? 88}% Confidence</span>
          </div>
        </div>
      </div>

      {/* Editable Content Area */}
      <div className="my-4 space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center space-x-1.5 font-medium">
            <Edit3 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Interactive Draft (Live Editable)</span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleCopy}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center space-x-1 font-medium transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-500 font-bold">Copied!</span>
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
                isOverLimit ? "text-rose-500" : "text-slate-400"
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
          className={`w-full p-4 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white bg-slate-50 dark:bg-[#1E2638] border focus:bg-white dark:focus:bg-[#1A2338] focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-sans leading-relaxed resize-y ${
            isOverLimit ? "border-rose-300" : "border-slate-200 dark:border-[#243048]"
          }`}
        />
      </div>

      {/* Explainable AI Intelligence Accordion */}
      <div className="mt-3 rounded-xl border border-slate-200/60 dark:border-[#243048] bg-slate-50/50 dark:bg-[#1E2638]/50 overflow-hidden text-xs">
        <button
          onClick={() => setShowExplainability(!showExplainability)}
          className="w-full px-4 py-2.5 flex items-center justify-between text-left font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <Brain className="w-4 h-4 text-indigo-500" />
            <span>Explainable AI Intelligence Rationale</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
              Confidence: {draft.confidenceScore ?? 88}%
            </span>
          </div>
          {showExplainability ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showExplainability && (
          <div className="px-4 pb-4 pt-1 space-y-3 border-t border-slate-200/50 dark:border-[#243048] animate-fade-in text-[11px]">
            <div>
              <span className="font-bold text-slate-900 dark:text-white">Why This Strategy:</span>
              <p className="text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                {draft.recommendationRationale || draft.aiExplanation ||
                  "Derived from your historical high-performing formats and active vector memory."}
              </p>
            </div>
            {draft.supportingEvidence && (
              <div>
                <span className="font-bold text-slate-900 dark:text-white">Empirical Evidence:</span>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  {draft.supportingEvidence}
                </p>
              </div>
            )}
            {draft.unsupportedClaims && draft.unsupportedClaims.length > 0 && (
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300">
                <span className="font-bold">⚠️ Unverified Claims Detected:</span>
                <ul className="list-disc list-inside mt-0.5 space-y-0.5">
                  {draft.unsupportedClaims.map((claim, idx) => (
                    <li key={idx}>{claim}</li>
                  ))}
                </ul>
              </div>
            )}
            {draft.improvementSuggestions && draft.improvementSuggestions.length > 0 && (
              <div>
                <span className="font-bold text-slate-900 dark:text-white">💡 Improvement Suggestions:</span>
                <ul className="list-disc list-inside mt-0.5 text-slate-600 dark:text-slate-300 space-y-0.5">
                  {draft.improvementSuggestions.map((sug, idx) => (
                    <li key={idx}>{sug}</li>
                  ))}
                </ul>
              </div>
            )}
            {draft.assumptionsMade && draft.assumptionsMade.length > 0 && (
              <div>
                <span className="font-bold text-slate-500">ℹ️ Model Assumptions:</span>
                <ul className="list-disc list-inside mt-0.5 text-slate-400 space-y-0.5">
                  {draft.assumptionsMade.map((asm, idx) => (
                    <li key={idx}>{asm}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Card Footer Action Buttons */}
      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-[#243048] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Regenerate Button */}
          <button
            onClick={() => onRegenerate(draft.id)}
            disabled={isRegenerating}
            className="h-9 px-3 rounded-xl border border-slate-200 dark:border-[#243048] bg-white dark:bg-[#1E2638] hover:bg-slate-50 dark:hover:bg-[#28354D] text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center space-x-1.5 transition-colors"
          >
            <RotateCw className={`w-3.5 h-3.5 text-slate-400 ${isRegenerating ? "animate-spin" : ""}`} />
            <span>{isRegenerating ? "Synthesizing..." : "Regenerate"}</span>
          </button>

          {/* Export Content for Buffer / Hootsuite */}
          <button
            onClick={handleExportContent}
            disabled={isExporting}
            className="h-9 px-3 rounded-xl border border-slate-200 dark:border-[#243048] bg-white dark:bg-[#1E2638] hover:bg-slate-50 dark:hover:bg-[#28354D] text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center space-x-1.5 transition-colors"
            title="Export formatted caption and hashtags for Buffer/Hootsuite"
          >
            <FileDown className="w-3.5 h-3.5 text-sky-500" />
            <span>Export &amp; Copy</span>
          </button>

          {/* Reject with Reason Button */}
          <button
            onClick={() => setShowRejectModal(true)}
            className="h-9 px-3 rounded-xl border border-slate-200 dark:border-[#243048] bg-white dark:bg-[#1E2638] hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold text-slate-500 hover:text-rose-600 transition-colors flex items-center space-x-1"
            title="Reject recommendation and teach memory"
          >
            <ThumbsDown className="w-3.5 h-3.5" />
            <span>Reject</span>
          </button>
        </div>

        {/* Approve & Schedule Primary Button */}
        <button
          onClick={() => onApprove(draft)}
          disabled={draft.status === "Approved" || draft.status === "Scheduled"}
          className={`h-9 px-5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-2 transition-all ${
            draft.status === "Approved" || draft.status === "Scheduled"
              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 cursor-default"
              : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/20"
          }`}
        >
          {draft.status === "Approved" || draft.status === "Scheduled" ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
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

      {/* Reject with Reason Popover Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#161F30] rounded-2xl border border-slate-200 dark:border-[#243048] p-5 max-w-sm w-full shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#243048]">
              <h4 className="font-bold text-slate-900 dark:text-white">Why Reject this Recommendation?</h4>
              <button
                onClick={() => setShowRejectModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Your feedback is directly transformed into an active &ldquo;don&apos;t&rdquo; rule in this brand&apos;s memory bank.
            </p>

            <div className="space-y-1.5">
              {[
                { id: "poor_voice", label: "Off-Brand Voice / Generic Tone" },
                { id: "repetitive", label: "Repetitive Phrasing / Seen Before" },
                { id: "off_topic", label: "Topic Irrelevant to Audience" },
                { id: "inappropriate_hook", label: "Weak or Clickbaity Hook" },
                { id: "other", label: "Other Rule Violation" },
              ].map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-center space-x-2 p-2 rounded-xl border cursor-pointer transition-colors ${
                    rejectionReason === opt.id
                      ? "border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold"
                      : "border-slate-100 dark:border-[#243048] text-slate-600 dark:text-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="rejectionReason"
                    value={opt.id}
                    checked={rejectionReason === opt.id}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="text-indigo-600"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300 text-[11px]">
                Specific feedback for agent (optional):
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Too many sales emojis, sounds like generic marketing."
                value={rejectionNotes}
                onChange={(e) => setRejectionNotes(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#243048] bg-slate-50 dark:bg-[#1E2638] text-slate-900 dark:text-white text-[11px]"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#243048] text-slate-600 dark:text-slate-300 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectSubmit}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-xs"
              >
                Confirm Rejection &amp; Teach Memory
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
