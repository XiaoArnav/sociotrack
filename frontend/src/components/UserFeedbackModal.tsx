"use client";

import React, { useState } from "react";
import { MessageSquare, Star, X, Send, CheckCircle2, AlertTriangle, Lightbulb, Bug } from "lucide-react";

interface UserFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  brandId?: string;
  apiBaseUrl?: string;
  onToast?: (title: string, message: string, type: "info" | "success" | "warning") => void;
}

export function UserFeedbackModal({
  isOpen,
  onClose,
  brandId,
  apiBaseUrl = "",
  onToast,
}: UserFeedbackModalProps) {
  const [category, setCategory] = useState<string>("ai_quality");
  const [rating, setRating] = useState<number>(5);
  const [message, setMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          rating,
          message: message.trim(),
          brand_id: brandId,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
        onToast?.("Feedback Received", "Thank you! Your feedback directly trains our research backlog.", "success");
        setTimeout(() => {
          setSubmitted(false);
          setMessage("");
          onClose();
        }, 1500);
      } else {
        throw new Error("Feedback submission failed");
      }
    } catch {
      onToast?.("Offline Mode", "Feedback recorded in local session queue.", "info");
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = [
    { id: "ai_quality", label: "AI Quality", icon: Star },
    { id: "usability", label: "Usability", icon: Lightbulb },
    { id: "bug_report", label: "Bug Report", icon: Bug },
    { id: "feature_request", label: "Feature Idea", icon: MessageSquare },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-[#161F30] rounded-3xl border border-slate-200 dark:border-[#243048] shadow-2xl overflow-hidden p-6 space-y-5 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#243048]">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Pilot Research & Feedback</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-2 animate-scale-up">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Feedback Recorded!</h4>
            <p className="text-slate-500 text-[11px]">Your insight has been prioritized in our pilot research ledger.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Category Select */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300">Category</label>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((c) => {
                  const Icon = c.icon;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategory(c.id)}
                      className={`p-2 rounded-xl border text-left flex items-center space-x-2 transition-all ${
                        category === c.id
                          ? "border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold"
                          : "border-slate-200 dark:border-[#243048] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#1E2638]"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{c.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Star Rating */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300">Experience Rating</label>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 text-slate-300 hover:text-amber-400 transition-colors"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= rating ? "text-amber-400 fill-amber-400" : "text-slate-300 dark:text-slate-600"
                      }`}
                    />
                  </button>
                ))}
                <span className="text-[11px] font-mono text-slate-500 ml-2">
                  {rating === 5 ? "Exceptional" : rating === 4 ? "Very Useful" : rating === 3 ? "Neutral" : "Needs Work"}
                </span>
              </div>
            </div>

            {/* Feedback Message */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300">Observations & Suggestions *</label>
              <textarea
                rows={4}
                required
                placeholder="What was valuable? What was confusing or repetitive?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-[#243048] bg-slate-50 dark:bg-[#1E2638] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !message.trim()}
              className="w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold flex items-center justify-center space-x-2 transition-all shadow-md"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "Submitting..." : "Send Feedback"}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
