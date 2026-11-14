"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  Send,
  AlertCircle,
  FileCheck,
  UserCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { formatRelativeTime } from "@/lib/dateUtils";

interface DraftItem {
  id: string;
  topic: string;
  hook: string;
  format: string;
  status: "draft" | "pending_review" | "approved" | "rejected";
  author: string;
  reviewerNotes?: string;
  comments: { id: string; author: string; content: string; time: string; createdAt?: string }[];
}

interface ApprovalQueueWidgetProps {
  brandId: string;
  onToast: (title: string, desc: string, type?: "success" | "error" | "info") => void;
}

export function ApprovalQueueWidget({
  brandId,
  onToast,
}: ApprovalQueueWidgetProps) {
  const [drafts, setDrafts] = useState<DraftItem[]>([
    {
      id: "draft-101",
      topic: "Multi-Agent State Systems",
      hook: "Most teams fail at AI workflows because their state machines are leaky. Here is the invariant boundary design:",
      format: "CAROUSEL",
      status: "pending_review",
      author: "Alex Growth",
      comments: [
        {
          id: "comm-1",
          author: "Krishna Verma",
          content: "Clarify slide 4 with concrete code seams before final sign-off.",
          time: "10m ago",
        },
      ],
    },
    {
      id: "draft-102",
      topic: "Real-time Telemetry Ingestion",
      hook: "Why 90% of creator metrics are vanity noise — and the 3 numbers that actually predict conversion.",
      format: "REELS",
      status: "draft",
      author: "Alex Growth",
      comments: [],
    },
  ]);

  const [expandedDraftId, setExpandedDraftId] = useState<string | null>("draft-101");
  const [newComment, setNewComment] = useState("");
  const [feedbackInput, setFeedbackInput] = useState<{ [draftId: string]: string }>({});

  const handleAction = (draftId: string, action: "submit" | "approve" | "reject") => {
    const feedback = feedbackInput[draftId] || "";
    setDrafts((prev) =>
      prev.map((d) => {
        if (d.id === draftId) {
          if (action === "submit") return { ...d, status: "pending_review" };
          if (action === "approve") return { ...d, status: "approved", reviewerNotes: feedback || "Approved for publishing" };
          if (action === "reject") return { ...d, status: "rejected", reviewerNotes: feedback || "Revisions required" };
        }
        return d;
      })
    );
    const actionLabel = action === "submit" ? "Submitted for Review" : action === "approve" ? "Approved" : "Revision Requested";
    onToast(actionLabel, `Post draft ${actionLabel.toLowerCase()} successfully.`, "success");
    setFeedbackInput((prev) => ({ ...prev, [draftId]: "" }));
  };

  const handleAddComment = (draftId: string) => {
    if (!newComment.trim()) return;
    setDrafts((prev) =>
      prev.map((d) => {
        if (d.id === draftId) {
          return {
            ...d,
            comments: [
              ...d.comments,
              {
                id: `comm-${Date.now()}`,
                author: "Krishna Verma",
                content: newComment.trim(),
                time: "Just now",
                createdAt: new Date().toISOString(),
              },
            ],
          };
        }
        return d;
      })
    );
    setNewComment("");
    onToast("Comment Posted", "Internal feedback thread updated.", "info");
  };

  return (
    <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/80 dark:bg-[#0D1424]/90 backdrop-blur-md p-6 sm:p-7 shadow-lg dark:shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
              <span>Approval Queue &amp; Peer Collaboration</span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800">
                State Machine
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Multi-tiered review governance, draft commenting, and feedback iterations
            </p>
          </div>
        </div>
      </div>

      {/* Queue Items */}
      <div className="space-y-4">
        {drafts.map((draft) => {
          const isExpanded = expandedDraftId === draft.id;
          return (
            <div
              key={draft.id}
              className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 p-4 sm:p-5 space-y-4 transition-all"
            >
              {/* Draft Summary Row */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      {draft.topic}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {draft.format}
                    </span>
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-bold border ${
                        draft.status === "approved"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                          : draft.status === "rejected"
                          ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-red-200 dark:border-red-800"
                          : draft.status === "pending_review"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                          : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                      }`}
                    >
                      {draft.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic line-clamp-2">
                    &ldquo;{draft.hook}&rdquo;
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Created by {draft.author}
                  </p>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center space-x-1.5 shrink-0">
                  {draft.status === "draft" && (
                    <button
                      onClick={() => handleAction(draft.id, "submit")}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs"
                    >
                      Submit for Review
                    </button>
                  )}
                  {draft.status === "pending_review" && (
                    <>
                      <button
                        onClick={() => handleAction(draft.id, "approve")}
                        className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleAction(draft.id, "reject")}
                        className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-xs"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setExpandedDraftId(isExpanded ? null : draft.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Reviewer notes banner */}
              {draft.reviewerNotes && (
                <div className="p-2.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 text-[11px] text-slate-700 dark:text-slate-300">
                  <strong>Reviewer Feedback:</strong> {draft.reviewerNotes}
                </div>
              )}

              {/* Expanded Discussion & Comments Thread */}
              {isExpanded && (
                <div className="pt-3 border-t border-slate-200/50 dark:border-slate-800 space-y-3">
                  <p className="text-[11px] font-mono uppercase tracking-widest text-slate-400 font-bold flex items-center space-x-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Internal Discussion ({draft.comments.length})</span>
                  </p>

                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {draft.comments.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic">
                        No internal comments yet. Start the conversation below.
                      </p>
                    ) : (
                      draft.comments.map((c) => (
                        <div
                          key={c.id}
                          className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 text-xs space-y-0.5"
                        >
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span className="font-bold text-slate-700 dark:text-slate-300">{c.author}</span>
                            <span suppressHydrationWarning>{formatRelativeTime(c.createdAt || c.time)}</span>
                          </div>
                          <p className="text-slate-800 dark:text-slate-200 text-xs">{c.content}</p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add comment row */}
                  <div className="flex items-center space-x-2 pt-1">
                    <input
                      type="text"
                      placeholder="Add an internal review comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddComment(draft.id)}
                      className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      onClick={() => handleAddComment(draft.id)}
                      className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
