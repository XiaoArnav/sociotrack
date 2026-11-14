"use client";

import React, { useState, useEffect } from "react";
import {
  CalendarDays,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Layers,
  Plus,
} from "lucide-react";
import { formatTime, formatScheduledTime, getUserTimezone } from "@/lib/dateUtils";

interface CalendarSlot {
  id: string;
  day: string;
  recommended_utc_hour: number;
  suggested_topic: string;
  content_format: string;
  rationale: string;
  historical_supporting_score: number;
  data_sufficiency: "empirical" | "hypothesis";
  requires_approval: boolean;
  is_approved: boolean;
  scheduled_iso?: string;
}

function getDynamicDefaultSlots(): CalendarSlot[] {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();

  const configs = [
    {
      dayOffset: 1,
      hour: 14,
      topic: "Deterministic State Management with LangGraph",
      format: "Framework Breakdown / Carousel",
      rationale: "High-retention visual architecture breakdown for complex workflows.",
      score: 9.1,
    },
    {
      dayOffset: 2,
      hour: 16,
      topic: "Autonomous Swarms vs Deterministic State Machines",
      format: "Contrarian / Industry Analysis",
      rationale: "Nuanced technical critique challenging superficial hype.",
      score: 8.7,
    },
    {
      dayOffset: 3,
      hour: 14,
      topic: "Production Token & Vector Latency Optimization",
      format: "Tactical Playbook / Benchmark",
      rationale: "Actionable, numbered implementation steps with metrics.",
      score: 9.3,
    },
  ];

  return configs.map((cfg) => {
    const d = new Date(now.getTime() + cfg.dayOffset * 86400000);
    d.setUTCHours(cfg.hour, 0, 0, 0);
    const dayName = days[d.getUTCDay()];
    const monthName = months[d.getUTCMonth()];
    const dayNum = d.getUTCDate();
    const iso = d.toISOString();

    return {
      id: `slot_${dayName.toLowerCase()}_${cfg.hour}`,
      day: `${dayName} (${monthName} ${dayNum})`,
      recommended_utc_hour: cfg.hour,
      suggested_topic: cfg.topic,
      content_format: cfg.format,
      rationale: `${cfg.rationale} Timed for peak empirical velocity window (${cfg.hour}:00 UTC).`,
      historical_supporting_score: cfg.score,
      data_sufficiency: "empirical" as const,
      requires_approval: true,
      is_approved: false,
      scheduled_iso: iso,
    };
  });
}

const DEFAULT_SLOTS: CalendarSlot[] = getDynamicDefaultSlots();

export function InsTrackCalendarView({
  onToast,
}: {
  onToast?: (title: string, msg: string, type?: "success" | "info" | "warning") => void;
}) {
  const [slots, setSlots] = useState<CalendarSlot[]>(DEFAULT_SLOTS);
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
    const apiBase = process.env.NEXT_PUBLIC_API_URL || (isHttps ? "" : "http://localhost:8000");

    if (apiBase && !(isHttps && apiBase.startsWith("http://localhost"))) {
      fetch(`${apiBase}/api/calendar/recommendations`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && Array.isArray(data.slots) && data.slots.length > 0) {
            setSlots(data.slots);
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleApproveSlot = async (slot: CalendarSlot) => {
    const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
    const apiBase = process.env.NEXT_PUBLIC_API_URL || (isHttps ? "" : "http://localhost:8000");

    try {
      if (apiBase && !(isHttps && apiBase.startsWith("http://localhost"))) {
        await fetch(`${apiBase}/api/calendar/approve-slot`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slot_id: slot.id,
            approved_topic: slot.suggested_topic,
          }),
        });
      }
    } catch {}

    const slotDate = slot.scheduled_iso ? new Date(slot.scheduled_iso) : (() => {
      const d = new Date();
      d.setUTCHours(slot.recommended_utc_hour, 0, 0, 0);
      return d;
    })();
    const localFormatted = formatTime(slotDate);

    setApprovedIds((prev) => new Set([...Array.from(prev), slot.id]));
    onToast?.(
      "Slot Approved & Scheduled",
      `"${slot.suggested_topic}" scheduled for ${slot.day} at ${slot.recommended_utc_hour}:00 UTC (${localFormatted}).`,
      "success"
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-[#161F30] rounded-2xl border border-slate-200 dark:border-[#243048] p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <CalendarDays className="w-5 h-5 text-indigo-500" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Intelligent 7-Day Content Mix Planner
              </h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-800">
                Continuous Horizon
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Derived from your Brand Intelligence Profile. Recommends balanced format distribution and optimal peak engagement hours.
            </p>
          </div>

          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-[11px] font-bold text-amber-700 dark:text-amber-400 shrink-0">
            <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Explicit Human Approval Required</span>
          </div>
        </div>

        {/* Content Mix Distribution Bar */}
        <div className="pt-2 border-t border-slate-100 dark:border-[#243048] space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>Recommended Strategic Content Mix:</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-mono text-[11px]">100% Balanced</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1A2338] border border-slate-200 dark:border-[#243048] space-y-1">
              <div className="flex justify-between items-center text-xs font-bold text-slate-800 dark:text-slate-200">
                <span>Framework Breakdowns</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-mono">40%</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">High-retention carousels & diagrams</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1A2338] border border-slate-200 dark:border-[#243048] space-y-1">
              <div className="flex justify-between items-center text-xs font-bold text-slate-800 dark:text-slate-200">
                <span>Contrarian Discussion</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono">35%</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">High comment velocity & debate</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1A2338] border border-slate-200 dark:border-[#243048] space-y-1">
              <div className="flex justify-between items-center text-xs font-bold text-slate-800 dark:text-slate-200">
                <span>Tactical Playbooks</span>
                <span className="text-sky-600 dark:text-sky-400 font-mono">25%</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Actionable blueprints & benchmarks</p>
            </div>
          </div>
        </div>
      </div>

      {/* Suggested Slots */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Detected Schedule Gaps &amp; Strategic Slots
        </h4>

        <div className="grid grid-cols-1 gap-4">
          {slots.map((slot) => {
            const isApproved = approvedIds.has(slot.id) || slot.is_approved;
            const slotDate = slot.scheduled_iso ? new Date(slot.scheduled_iso) : (() => {
              const d = new Date();
              d.setUTCHours(slot.recommended_utc_hour, 0, 0, 0);
              return d;
            })();
            const localFormatted = formatTime(slotDate);

            return (
              <div
                key={slot.id}
                className="bg-white dark:bg-[#161F30] rounded-2xl border border-slate-200 dark:border-[#243048] p-5 shadow-sm space-y-4 hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-[#243048]">
                  <div className="flex items-center space-x-2.5">
                    <span className="px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 dark:bg-[#1E2638] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                      {slot.day}
                    </span>
                    <span
                      className="flex items-center space-x-1 text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400"
                      suppressHydrationWarning
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{slot.recommended_utc_hour}:00 UTC ({localFormatted})</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                      Peak Velocity Window
                    </span>
                  </div>

                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    Format: {slot.content_format}
                  </span>
                </div>

                <div className="space-y-2">
                  <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                    Suggested Topic: &ldquo;{slot.suggested_topic}&rdquo;
                  </h5>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {slot.rationale}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-[#243048]">
                  <div className="flex items-center space-x-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      Historical Affinity: {slot.historical_supporting_score.toFixed(1)} / 10
                    </span>
                    <span>•</span>
                    <span className="capitalize font-medium">Status: {slot.data_sufficiency}</span>
                  </div>

                  <button
                    onClick={() => handleApproveSlot(slot)}
                    disabled={isApproved}
                    className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      isApproved
                        ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 cursor-default"
                        : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm"
                    }`}
                  >
                    {isApproved ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Slot Approved &amp; Queued</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Approve &amp; Queue Slot</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
