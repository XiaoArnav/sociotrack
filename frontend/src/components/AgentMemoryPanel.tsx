"use client";

import React, { useState } from "react";
import {
  BrainCircuit,
  TrendingUp,
  Clock,
  Users,
  Sparkles,
  RotateCw,
  Award,
  ShieldCheck,
  CheckCircle2,
  Zap,
  BarChart2,
  Edit3,
  Trash2,
  Check,
  X,
} from "lucide-react";
import { LearnedInsight } from "@/mocks/mockData";
import { formatRelativeTime } from "@/lib/dateUtils";

interface AgentMemoryPanelProps {
  insights: LearnedInsight[];
  onRecalibrateMemory: () => void;
  isRecalibrating?: boolean;
}

export function AgentMemoryPanel({
  insights,
  onRecalibrateMemory,
  isRecalibrating = false,
}: AgentMemoryPanelProps) {
  const [lastUpdatedInstant] = useState<Date>(() => new Date());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [activeList, setActiveList] = useState<LearnedInsight[]>(insights);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  React.useEffect(() => {
    setActiveList(insights);
  }, [insights]);

  const handleSaveEdit = async (id: string) => {
    if (!editText.trim()) return;
    const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
    const apiBase = process.env.NEXT_PUBLIC_API_URL || (isHttps ? "" : "http://localhost:8000");
    const token = typeof window !== "undefined" ? localStorage.getItem("sociotrack_token") : null;

    try {
      if (apiBase && !(isHttps && apiBase.startsWith("http://localhost"))) {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;
        await fetch(`${apiBase}/api/memory/insights/${id}`, {
          method: "PUT",
          headers,
          body: JSON.stringify({ insight_text: editText }),
        });
      }
    } catch {}

    setActiveList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, insight: editText } : item))
    );
    setEditingId(null);
  };

  const handleDeactivate = async (id: string) => {
    const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
    const apiBase = process.env.NEXT_PUBLIC_API_URL || (isHttps ? "" : "http://localhost:8000");
    const token = typeof window !== "undefined" ? localStorage.getItem("sociotrack_token") : null;

    try {
      if (apiBase && !(isHttps && apiBase.startsWith("http://localhost"))) {
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;
        await fetch(`${apiBase}/api/memory/insights/${id}`, {
          method: "DELETE",
          headers,
        });
      }
    } catch {}

    setActiveList((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="w-full lg:w-96 shrink-0 space-y-5">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#E6E9F0]">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-[#ECE9FF] text-[#5146D8] flex items-center justify-center">
            <BrainCircuit className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-[#172033] tracking-tight">
              Agent Memory
            </h3>
            <p className="text-[11px] text-[#718096]">
              What your AI has learned about your audience.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#E8F8F3] text-[#16A477] border border-[#16A477]/30">
          <span className="w-1.5 h-1.5 rounded-full bg-[#16A477] animate-pulse" />
          <span>ChromaDB Persistent</span>
        </span>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center space-x-1 overflow-x-auto pb-1 text-[11px] font-semibold text-[#718096]">
        {[
          { id: "all", label: "All Memories" },
          { id: "directives", label: "Directives" },
          { id: "performance", label: "Performance" },
          { id: "avoided", label: "Avoided Patterns" },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-2.5 py-1 rounded-full transition-all shrink-0 ${
              selectedCategory === cat.id
                ? "bg-[#172033] text-white dark:bg-white dark:text-[#172033]"
                : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Memory Insights Cards List */}
      <div className="space-y-3.5">
        {activeList
          .filter((item) => {
            if (selectedCategory === "all") return true;
            if (selectedCategory === "directives") return item.isExplicit || item.type === "preference";
            if (selectedCategory === "avoided") return item.type === "discovered" || item.insight.toLowerCase().includes("avoid");
            if (selectedCategory === "performance") return item.type === "performance";
            return true;
          })
          .map((card) => {
          const isEditingThis = editingId === card.id;

          // If this is a dynamically newly discovered insight from feedback loop
          if (card.isNew) {
            return (
              <div
                key={card.id}
                className="bg-white dark:bg-[#161F30] rounded-2xl border-2 border-[#5146D8] dark:border-indigo-500 p-4 shadow-float transition-all animate-slide-up relative overflow-hidden ring-4 ring-[#ECE9FF] dark:ring-indigo-950/40 space-y-2.5"
              >
                {/* Header pill */}
                <div className="flex items-center justify-between pb-2 border-b border-[#ECE9FF] dark:border-[#243048]">
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-[#5146D8] text-white uppercase tracking-wider animate-pulse">
                      <Sparkles className="w-3 h-3 text-yellow-300" />
                      <span>NEW</span>
                    </span>
                    <span className="text-[11px] font-bold text-[#5146D8] dark:text-indigo-400">
                      Recently Learned
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => {
                        setEditingId(isEditingThis ? null : card.id);
                        setEditText(card.insight);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-indigo-600 transition-colors"
                      title="Edit rule"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDeactivate(card.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-500 transition-colors"
                      title="Deactivate rule"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-start justify-between">
                    <h4 className="text-xs font-bold text-[#172033] dark:text-white">
                      {card.title}
                    </h4>
                    {card.metric && (
                      <span className="text-xs font-black text-[#16A477] bg-[#E8F8F3] dark:bg-emerald-950/60 dark:text-emerald-400 px-2 py-0.5 rounded-md">
                        {card.metric}
                      </span>
                    )}
                  </div>

                  {isEditingThis ? (
                    <div className="space-y-2">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full text-xs p-2 rounded-lg border border-indigo-400 bg-slate-50 dark:bg-[#1E2638] text-slate-800 dark:text-slate-100 focus:outline-none"
                        rows={3}
                      />
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-2 py-1 text-[10px] rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEdit(card.id)}
                          className="px-2.5 py-1 text-[10px] rounded bg-indigo-600 text-white font-bold"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-[#172033] dark:text-slate-200 leading-relaxed font-medium">
                      &ldquo;{card.insight}&rdquo;
                    </p>
                  )}

                  {card.supportingEvidence && (
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                      Evidence: {card.supportingEvidence}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-[#E6E9F0] dark:border-[#243048] flex items-center justify-between text-[10px] text-[#718096] dark:text-slate-400">
                  <span className="font-semibold text-[#16A477] dark:text-emerald-400 flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{card.confidence}</span>
                  </span>
                  <span className="font-mono text-[#5146D8] dark:text-indigo-400">
                    {card.sourceEvent || "ChromaDB Ingested"}
                  </span>
                </div>
              </div>
            );
          }

          // INSIGHT CARD 01 – CONTENT PERFORMANCE
          if (card.type === "performance") {
            return (
              <div
                key={card.id}
                className="bg-white rounded-2xl border border-[#E6E9F0] p-4 shadow-card hover:shadow-card-hover transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-lg bg-[#ECE9FF] text-[#5146D8] flex items-center justify-center">
                      <TrendingUp className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-[#172033]">
                      {card.title}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#E8F8F3] text-[#16A477] border border-[#16A477]/30">
                    High Confidence
                  </span>
                </div>

                <p className="text-xs text-[#172033] leading-relaxed font-medium">
                  {card.insight}
                </p>

                {/* Mini Comparison Chart */}
                <div className="p-2.5 rounded-xl bg-[#F6F7FB] border border-[#E6E9F0] space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-[#172033]">Saves Metric</span>
                    <span className="font-extrabold text-[#5146D8] text-sm">
                      3.4x
                    </span>
                  </div>
                  <div className="space-y-1 text-[10px]">
                    <div>
                      <div className="flex justify-between text-[#718096] mb-0.5">
                        <span className="font-medium">Contrarian Takes</span>
                        <span className="font-bold text-[#5146D8]">85 saves/k</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#CBD5E1]/40 rounded-full overflow-hidden">
                        <div className="h-full bg-[#5146D8] w-[85%] rounded-full" />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[#718096] mb-0.5">
                        <span className="font-medium">Generic Tutorials</span>
                        <span className="font-bold text-slate-500">25 saves/k</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#CBD5E1]/40 rounded-full overflow-hidden">
                        <div className="h-full bg-slate-400 w-[25%] rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          // INSIGHT CARD 02 – PEAK ENGAGEMENT TIME
          if (card.type === "timing") {
            return (
              <div
                key={card.id}
                className="bg-white rounded-2xl border border-[#E6E9F0] p-4 shadow-card hover:shadow-card-hover transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-[#172033]">
                      {card.title}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#ECE9FF] text-[#5146D8]">
                    Peak Velocity
                  </span>
                </div>

                <p className="text-xs text-[#172033] leading-relaxed font-medium">
                  {card.insight}
                </p>

                {/* Weekly Activity Timeline with Highlighted Peak Periods */}
                <div className="p-2.5 rounded-xl bg-[#F6F7FB] border border-[#E6E9F0] space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-[#718096] font-medium">
                    <span>Weekly Reply Intensity</span>
                    <span className="text-[#5146D8] font-bold">2:00 PM – 4:30 PM</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5 pt-1">
                    {[
                      { day: "Mon", intensity: "h-6 bg-slate-300", highlight: false },
                      { day: "Tue", intensity: "h-11 bg-[#5146D8]", highlight: true },
                      { day: "Wed", intensity: "h-7 bg-slate-300", highlight: false },
                      { day: "Thu", intensity: "h-10 bg-[#5146D8]", highlight: true },
                      { day: "Fri", intensity: "h-5 bg-slate-300", highlight: false },
                    ].map((col) => (
                      <div
                        key={col.day}
                        className="flex flex-col items-center justify-end space-y-1"
                      >
                        <div
                          className={`w-full rounded-md transition-all ${col.intensity}`}
                        />
                        <span
                          className={`text-[9px] ${
                            col.highlight ? "font-bold text-[#5146D8]" : "text-[#718096]"
                          }`}
                        >
                          {col.day}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          }

          // INSIGHT CARD 03 – AUDIENCE SENTIMENT
          if (card.type === "sentiment") {
            return (
              <div
                key={card.id}
                className="bg-white rounded-2xl border border-[#E6E9F0] p-4 shadow-card hover:shadow-card-hover transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-lg bg-indigo-50 text-[#3478F6] flex items-center justify-center">
                      <Users className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-[#172033]">
                      {card.title}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-[#3478F6] border border-[#3478F6]/20">
                    High Alignment
                  </span>
                </div>

                <p className="text-xs text-[#172033] leading-relaxed font-medium">
                  {card.insight}
                </p>

                {/* Circular Progress & Sentiment Visualization */}
                <div className="p-2.5 rounded-xl bg-[#F6F7FB] border border-[#E6E9F0] flex items-center space-x-3">
                  {/* SVG Circular Donut Chart 68% */}
                  <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#E2E8F0"
                        strokeWidth="3.5"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#5146D8"
                        strokeWidth="3.5"
                        strokeDasharray="68, 100"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute text-[11px] font-black text-[#172033]">
                      68%
                    </span>
                  </div>

                  <div className="flex-1 text-left">
                    <div className="text-[11px] font-bold text-[#172033]">
                      Cost &amp; Latency Focus
                    </div>
                    <div className="text-[10px] text-[#718096]">
                      Sentiment: Cautious &amp; ROI-Driven
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          // INSIGHT CARD 04 – LEARNED CONTENT PREFERENCE
          return (
            <div
              key={card.id}
              className="bg-white rounded-2xl border border-[#E6E9F0] p-4 shadow-card hover:shadow-card-hover transition-all space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-lg bg-[#E8F8F3] text-[#16A477] flex items-center justify-center">
                    <BrainCircuit className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-[#172033]">
                    {card.title}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F8F3] text-[#16A477] border border-[#16A477]/30">
                  AI Discovered
                </span>
              </div>

              <p className="text-xs text-[#172033] leading-relaxed font-medium">
                {card.insight}
              </p>

              <div className="pt-2 border-t border-[#E6E9F0] flex items-center justify-between text-[10px] text-[#718096]">
                <span className="font-semibold text-[#16A477]">
                  Confidence: {card.confidence}
                </span>
                <span className="font-mono">{card.timestamp}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* MEMORY CONTROLS */}
      <div className="bg-white rounded-2xl border border-[#E6E9F0] p-4 shadow-card space-y-3">
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between text-[#718096]">
            <span>Total Learned Patterns:</span>
            <span className="font-bold text-[#172033] font-mono">
              {insights.length + 10} rules indexed
            </span>
          </div>
          <div className="flex items-center justify-between text-[#718096]">
            <span>Last Memory Update:</span>
            <span className="font-semibold text-[#172033]" suppressHydrationWarning>
              {formatRelativeTime(lastUpdatedInstant)}
            </span>
          </div>
          <div className="flex items-center justify-between text-[#718096]">
            <span>Memory Confidence Index:</span>
            <span className="font-bold text-[#16A477] font-mono">96.4%</span>
          </div>
        </div>

        {/* Force Memory Recalibration Button */}
        <button
          type="button"
          onClick={onRecalibrateMemory}
          disabled={isRecalibrating}
          className="w-full h-10 rounded-xl border border-[#5146D8] bg-[#ECE9FF] hover:bg-[#5146D8] hover:text-white text-[#5146D8] text-xs font-bold flex items-center justify-center space-x-2 transition-all duration-200"
        >
          <RotateCw
            className={`w-3.5 h-3.5 ${isRecalibrating ? "animate-spin" : ""}`}
          />
          <span>
            {isRecalibrating ? "Recalibrating Weights..." : "Force Memory Recalibration"}
          </span>
        </button>
      </div>
    </div>
  );
}
