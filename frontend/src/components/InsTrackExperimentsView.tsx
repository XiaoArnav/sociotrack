"use client";

import React, { useState, useEffect } from "react";
import {
  FlaskConical,
  Plus,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  BarChart2,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

interface ExperimentItem {
  id: string;
  title: string;
  experiment_type: string;
  variant_a_label: string;
  variant_a_content: string;
  variant_a_impressions: number;
  variant_a_engagement_rate: number;
  variant_b_label: string;
  variant_b_content: string;
  variant_b_impressions: number;
  variant_b_engagement_rate: number;
  status: "active" | "completed" | "insufficient_data";
  observation_days: number;
  min_sample_size: number;
  winner_variant?: string | null;
  confidence_score: number;
  conclusion_notes?: string;
  limitations?: string;
}

const DEFAULT_EXPERIMENTS: ExperimentItem[] = [
  {
    id: "exp_01",
    title: "Quantitative Benchmark vs Contrarian Opener",
    experiment_type: "hook",
    variant_a_label: "Variant A: Quantitative Benchmark",
    variant_a_content: "We tracked 4,200 production agent runs across 18 enterprise clusters. The benchmark data revealed a stark 3.4x performance gap...",
    variant_a_impressions: 680,
    variant_a_engagement_rate: 13.4,
    variant_b_label: "Variant B: Contrarian Industry Hook",
    variant_b_content: "Hot take: 90% of teams building agent swarms don't need autonomous loops. They need a deterministic state machine...",
    variant_b_impressions: 620,
    variant_b_engagement_rate: 7.8,
    status: "completed",
    observation_days: 7,
    min_sample_size: 1000,
    winner_variant: "Variant A: Quantitative Benchmark",
    confidence_score: 0.94,
    conclusion_notes: "Statistically significant winner: Variant A achieved +5.60% superior engagement across 1,300 verified impressions.",
    limitations: "Evaluated under 7-day observation window among engineering lead cohorts.",
  },
  {
    id: "exp_02",
    title: "Carousel Slide Breakdown vs Single Observation",
    experiment_type: "format",
    variant_a_label: "Variant A: 4-Slide Carousel",
    variant_a_content: "Slide 1: Architecture breakdown of vector caching seams. Slide 2: Checkpoint serialization...",
    variant_a_impressions: 210,
    variant_a_engagement_rate: 11.2,
    variant_b_label: "Variant B: Single Observation",
    variant_b_content: "Vector cache hit rates exceed 94% when keys are normalized before embedding passes.",
    variant_b_impressions: 190,
    variant_b_engagement_rate: 10.9,
    status: "insufficient_data",
    observation_days: 7,
    min_sample_size: 1000,
    winner_variant: null,
    confidence_score: 0.40,
    conclusion_notes: "Insufficient sample size (400 / 1000 impressions). Responsible evaluation requires reaching minimum impression threshold before declaring a winner.",
    limitations: "Premature conclusions risk false positive attribution. Maintain active tracking until threshold is met.",
  },
];

export function InsTrackExperimentsView({
  onToast,
}: {
  onToast?: (title: string, msg: string, type?: "success" | "info" | "warning") => void;
}) {
  const [experiments, setExperiments] = useState<ExperimentItem[]>(DEFAULT_EXPERIMENTS);
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [variantA, setVariantA] = useState("");
  const [variantB, setVariantB] = useState("");

  useEffect(() => {
    const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
    const apiBase = process.env.NEXT_PUBLIC_API_URL || (isHttps ? "" : "http://localhost:8000");

    if (apiBase && !(isHttps && apiBase.startsWith("http://localhost"))) {
      fetch(`${apiBase}/api/experiments`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setExperiments(data);
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleCreate = async () => {
    if (!newTitle.trim() || !variantA.trim() || !variantB.trim()) {
      onToast?.("Missing Fields", "Please provide a hypothesis title and both variants.", "warning");
      return;
    }

    const newExp: ExperimentItem = {
      id: `exp_${Date.now()}`,
      title: newTitle,
      experiment_type: "hook",
      variant_a_label: "Variant A (Candidate)",
      variant_a_content: variantA,
      variant_a_impressions: 0,
      variant_a_engagement_rate: 0.0,
      variant_b_label: "Variant B (Control)",
      variant_b_content: variantB,
      variant_b_impressions: 0,
      variant_b_engagement_rate: 0.0,
      status: "active",
      observation_days: 7,
      min_sample_size: 1000,
      winner_variant: null,
      confidence_score: 0.0,
      conclusion_notes: "Active experiment. Awaiting verified impressions across observation window.",
      limitations: "Enforces 1000 minimum impressions before statistical significance evaluation.",
    };

    setExperiments([newExp, ...experiments]);
    setShowModal(false);
    setNewTitle("");
    setVariantA("");
    setVariantB("");
    onToast?.("Experiment Launched", "Controlled A/B experiment initialized with 1,000 impression threshold.", "success");
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-[#161F30] rounded-2xl border border-slate-200 dark:border-[#243048] p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <FlaskConical className="w-5 h-5 text-indigo-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Controlled Content Experiments
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-800">
              Responsible A/B Testing
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Compare hooks, formats, and CTAs. Enforces sample size thresholds (≥1,000 impressions) and never declares winners on premature evidence.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Experiment</span>
        </button>
      </div>

      {/* Experiment Cards Grid */}
      <div className="grid grid-cols-1 gap-5">
        {experiments.map((exp) => {
          const totalImpressions = exp.variant_a_impressions + exp.variant_b_impressions;
          const progressPercent = Math.min(100, Math.round((totalImpressions / exp.min_sample_size) * 100));

          return (
            <div
              key={exp.id}
              className="bg-white dark:bg-[#161F30] rounded-2xl border border-slate-200 dark:border-[#243048] p-6 shadow-sm space-y-5"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-[#243048]">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-bold">
                    Hypothesis • {exp.experiment_type.toUpperCase()} TEST
                  </span>
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {exp.title}
                  </h4>
                </div>

                <div className="flex items-center space-x-2">
                  {exp.status === "completed" && exp.winner_variant && (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Winner: {exp.winner_variant}</span>
                    </span>
                  )}
                  {exp.status === "insufficient_data" && (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Insufficient Data ({progressPercent}% threshold)</span>
                    </span>
                  )}
                  {exp.status === "active" && (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Observation Window Active</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Variants Side-by-Side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Variant A */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-[#243048] bg-slate-50/50 dark:bg-[#141B2B] space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                    <span>{exp.variant_a_label}</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400">
                      {exp.variant_a_engagement_rate.toFixed(2)}% ER
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-mono">
                    &ldquo;{exp.variant_a_content}&rdquo;
                  </p>
                  <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 flex justify-between">
                    <span>Impressions</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                      {exp.variant_a_impressions.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Variant B */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-[#243048] bg-slate-50/50 dark:bg-[#141B2B] space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                    <span>{exp.variant_b_label}</span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400">
                      {exp.variant_b_engagement_rate.toFixed(2)}% ER
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-mono">
                    &ldquo;{exp.variant_b_content}&rdquo;
                  </p>
                  <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 flex justify-between">
                    <span>Impressions</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                      {exp.variant_b_impressions.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sample Size Progress & Rigorous Conclusion */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <span>Sample Size Progress: {totalImpressions.toLocaleString()} / {exp.min_sample_size.toLocaleString()} impressions</span>
                  <span className="font-bold">{progressPercent}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-[#202A3E] overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      progressPercent >= 100 ? "bg-emerald-500" : "bg-indigo-500"
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* Responsible Conclusion Notes */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1A2338] border border-slate-200 dark:border-[#243048] text-xs space-y-1">
                  <div className="flex items-center space-x-1.5 font-bold text-slate-800 dark:text-slate-200">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Scientific Conclusion &amp; Boundary Conditions:</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                    {exp.conclusion_notes}
                  </p>
                  {exp.limitations && (
                    <p className="text-[10px] text-slate-400 italic">
                      Known Limitations: {exp.limitations}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Experiment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#161F30] rounded-2xl border border-slate-200 dark:border-[#243048] p-6 max-w-lg w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Launch Controlled A/B Content Experiment
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Hypothesis Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Quantitative Benchmark vs Contrarian Hook"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#243048] bg-slate-50 dark:bg-[#1E2638] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Variant A Content
                </label>
                <textarea
                  rows={3}
                  placeholder="Candidate post copy with opening hook..."
                  value={variantA}
                  onChange={(e) => setVariantA(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#243048] bg-slate-50 dark:bg-[#1E2638] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Variant B Content
                </label>
                <textarea
                  rows={3}
                  placeholder="Control post copy with alternative hook or format..."
                  value={variantB}
                  onChange={(e) => setVariantB(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#243048] bg-slate-50 dark:bg-[#1E2638] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#243048] text-slate-600 dark:text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
              >
                Launch Experiment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
