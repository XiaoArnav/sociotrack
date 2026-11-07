"use client";

import React, { useState } from "react";
import { Play, Sparkles, AlertCircle, CheckCircle2, RefreshCw, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SimulatorFeedbackResult } from "@/lib/api";

export interface SimulatorBarProps {
  postContentToSimulate: string;
  topic: string;
  brandName: string;
  onSimulate: (metrics: {
    impressions: number;
    shares: number;
    replies: number;
    likes: number;
  }) => Promise<SimulatorFeedbackResult | null>;
  onRefreshMemory: () => Promise<void>;
}

export function SimulatorBar({
  postContentToSimulate,
  topic,
  brandName,
  onSimulate,
  onRefreshMemory,
}: SimulatorBarProps) {
  const [impressions, setImpressions] = useState<number>(10000);
  const [shares, setShares] = useState<number>(140);
  const [replies, setReplies] = useState<number>(70);
  const [likes, setLikes] = useState<number>(350);

  const [isSimulating, setIsSimulating] = useState(false);
  const [feedback, setFeedback] = useState<SimulatorFeedbackResult | null>(null);

  // Real-time projected preview
  const previewScore =
    impressions > 0
      ? Number((((shares * 3 + replies * 2 + likes * 1) / impressions) * 100).toFixed(2))
      : 0;
  const qualifiesPreview = previewScore > 5.0;

  const handleSimulateClick = async () => {
    setIsSimulating(true);
    const res = await onSimulate({ impressions, shares, replies, likes });
    setIsSimulating(false);
    if (res) {
      setFeedback(res);
      if (res.qualifies_for_memory) {
        await onRefreshMemory();
      }
    }
  };

  const applyPreset = (type: "viral" | "average" | "low") => {
    if (type === "viral") {
      setImpressions(15000);
      setShares(260);
      setReplies(120);
      setLikes(650);
    } else if (type === "average") {
      setImpressions(10000);
      setShares(80);
      setReplies(40);
      setLikes(250);
    } else {
      setImpressions(10000);
      setShares(10);
      setReplies(5);
      setLikes(30);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-800 bg-[#0f172a]/95 backdrop-blur-md px-6 py-3.5 shadow-2xl">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Left: Simulator Title & Formula Info */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600/20 text-purple-400 border border-purple-500/30">
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-white tracking-wide uppercase">
                Engagement Simulator
              </span>
              <Badge variant="outline" className="text-[10px] py-0">
                Formula: (S*3 + R*2 + L*1)/Imp * 100
              </Badge>
            </div>
            <p className="text-[11px] text-gray-400">
              Inject metrics to verify reinforcement learning gating (&gt; 5.0 score threshold).
            </p>
          </div>
        </div>

        {/* Center: Numeric Metric Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-1.5">
            <span className="text-[11px] text-gray-400 font-medium">Views:</span>
            <input
              type="number"
              value={impressions}
              onChange={(e) => setImpressions(Math.max(1, parseInt(e.target.value) || 0))}
              className="w-20 h-8 rounded bg-gray-900 border border-gray-700 px-2 text-xs text-white text-right font-mono"
            />
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-[11px] text-purple-300 font-medium">Shares (×3):</span>
            <input
              type="number"
              value={shares}
              onChange={(e) => setShares(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-16 h-8 rounded bg-gray-900 border border-purple-900/60 px-2 text-xs text-purple-300 text-right font-mono"
            />
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-[11px] text-blue-300 font-medium">Replies (×2):</span>
            <input
              type="number"
              value={replies}
              onChange={(e) => setReplies(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-16 h-8 rounded bg-gray-900 border border-blue-900/60 px-2 text-xs text-blue-300 text-right font-mono"
            />
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-[11px] text-emerald-300 font-medium">Likes (×1):</span>
            <input
              type="number"
              value={likes}
              onChange={(e) => setLikes(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-16 h-8 rounded bg-gray-900 border border-emerald-900/60 px-2 text-xs text-emerald-300 text-right font-mono"
            />
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex items-center space-x-1 pl-1">
            <button
              onClick={() => applyPreset("viral")}
              className="px-2 py-1 text-[10px] rounded bg-purple-950/60 hover:bg-purple-900 text-purple-300 border border-purple-800/40"
            >
              Viral Presets
            </button>
            <button
              onClick={() => applyPreset("low")}
              className="px-2 py-1 text-[10px] rounded bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700"
            >
              Low Presets
            </button>
          </div>
        </div>

        {/* Right: Projected Score & Trigger Action */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="text-right">
            <div className="text-[10px] text-gray-400">Projected Score:</div>
            <div
              className={`text-sm font-mono font-bold ${
                qualifiesPreview ? "text-emerald-400" : "text-amber-400"
              }`}
            >
              {previewScore.toFixed(2)}{" "}
              <span className="text-[10px] font-normal">
                {qualifiesPreview ? "(>5.0 Stored)" : "(≤5.0 Ignored)"}
              </span>
            </div>
          </div>

          <Button
            size="sm"
            onClick={handleSimulateClick}
            disabled={isSimulating}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {isSimulating ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>{isSimulating ? "Injecting..." : "Simulate & Feed Memory"}</span>
          </Button>
        </div>
      </div>

      {/* Floating Feedback Notification */}
      {feedback && (
        <div className="mt-2 text-center text-xs">
          <span
            className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full border ${
              feedback.qualifies_for_memory
                ? "bg-emerald-950/80 text-emerald-300 border-emerald-700/60"
                : "bg-gray-900 text-amber-300 border-amber-800/60"
            }`}
          >
            {feedback.qualifies_for_memory ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span>{feedback.status_message}</span>
            {feedback.key_lesson && (
              <span className="font-semibold italic truncate max-w-md hidden md:inline">
                - "{feedback.key_lesson}"
              </span>
            )}
          </span>
        </div>
      )}
    </div>
  );
}
