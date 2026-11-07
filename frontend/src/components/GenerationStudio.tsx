"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Wand2,
  RefreshCw,
  SlidersHorizontal,
  Layers,
  ArrowRight,
  Filter,
} from "lucide-react";
import {
  PostDraft,
  PlatformType,
  TargetTone,
  INITIAL_DRAFTS,
} from "@/mocks/mockData";
import { DraftCard } from "@/components/DraftCard";

interface GenerationStudioProps {
  drafts: PostDraft[];
  onDraftsChange: (drafts: PostDraft[]) => void;
  onApproveDraft: (draft: PostDraft) => void;
  onSendToSimulator: (content: string) => void;
  onAgentGeneratingStart?: () => void;
  onAgentGeneratingEnd?: () => void;
}

const SAMPLE_TOPICS = [
  "Deterministic State Management with LangGraph",
  "Agent Latency & Token Optimization in Production",
  "Memory Checkpointing vs Infinite Hallucination Loops",
  "Enterprise Agentic Architecture Playbook",
];

export function GenerationStudio({
  drafts,
  onDraftsChange,
  onApproveDraft,
  onSendToSimulator,
  onAgentGeneratingStart,
  onAgentGeneratingEnd,
}: GenerationStudioProps) {
  const [topic, setTopic] = useState("Deterministic State Management with LangGraph");
  const [targetTone, setTargetTone] = useState<TargetTone>("Thought Leadership");
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType>("LinkedIn");
  const [isGenerating, setIsGenerating] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [filterPlatform, setFilterPlatform] = useState<string>("all");

  const tones: TargetTone[] = [
    "Professional",
    "Conversational",
    "Educational",
    "Witty",
    "Thought Leadership",
  ];

  const platforms: PlatformType[] = ["LinkedIn", "Instagram", "X"];

  // Generate with Agent handler
  const handleGenerate = () => {
    if (!topic.trim()) return;

    setIsGenerating(true);
    if (onAgentGeneratingStart) onAgentGeneratingStart();

    setTimeout(() => {
      const newDraftId = `draft_${Date.now()}`;
      const newGeneratedPost: PostDraft = {
        id: newDraftId,
        platform: selectedPlatform,
        tone: targetTone,
        hookStyle:
          targetTone === "Thought Leadership"
            ? "Contrarian Thought Leadership"
            : targetTone === "Educational"
            ? "Data-First Technical Breakdown"
            : targetTone === "Witty"
            ? "Punchy Contrarian Take"
            : "Tactical Execution Checklist",
        status: "Draft",
        content: `Most teams building with ${topic} focus on the wrong metric.

They optimize for prompt cleverness instead of deterministic state boundaries.

Here is what our production benchmarks revealed:
• 64% latency drop when state checkpointing is enforced
• Vectorized audience memory reduces recurring token costs by 87%
• Closed-loop engagement feedback prevents hallucination drift

${
  selectedPlatform === "LinkedIn"
    ? "Are you checkpointing your agent states before scaling token budgets? Let's discuss below."
    : "Bookmark this for your next agent deployment sprint. 🧵👇"
}`,
        predictedEngagement: "HIGH",
        confidenceScore: 95,
        aiExplanation: `Generated using retrieved agent memory patterns for topic '${topic}'. Prioritizes quantitative proof points based on audience save preference.`,
        createdAt: "Just now",
        dosMatched: [
          "Quantitative proof in opening 3 lines",
          `Matched selected tone: ${targetTone}`,
          `Formatted natively for ${selectedPlatform}`,
        ],
        dontsAvoided: ["No vague generalities", "No unverified buzzwords"],
      };

      onDraftsChange([newGeneratedPost, ...drafts]);
      setIsGenerating(false);
      if (onAgentGeneratingEnd) onAgentGeneratingEnd();
    }, 1200);
  };

  // Regenerate individual card
  const handleRegenerate = (id: string) => {
    setRegeneratingId(id);
    if (onAgentGeneratingStart) onAgentGeneratingStart();

    setTimeout(() => {
      const updated = drafts.map((d) => {
        if (d.id !== id) return d;
        return {
          ...d,
          content: `${d.content.split("\n\n")[0]}\n\n[Regenerated Pass]: Here is an alternative architectural angle based on recent feedback metrics:\n\n1. Enforce immutable state transitions\n2. Index winning post hooks into vector storage\n3. Discard low-signal impressions (<5.0 viral score)`,
          confidenceScore: Math.min(98, d.confidenceScore + 2),
          aiExplanation: "Refined variation with updated hook focus from live agent memory weights.",
          status: "Draft" as const,
        };
      });
      onDraftsChange(updated);
      setRegeneratingId(null);
      if (onAgentGeneratingEnd) onAgentGeneratingEnd();
    }, 900);
  };

  // Live content update
  const handleUpdateContent = (id: string, newContent: string) => {
    onDraftsChange(
      drafts.map((d) => (d.id === id ? { ...d, content: newContent } : d))
    );
  };

  const filteredDrafts = drafts.filter((d) => {
    if (filterPlatform === "all") return true;
    return d.platform.toLowerCase() === filterPlatform.toLowerCase();
  });

  return (
    <div className="space-y-6">
      {/* Section Heading & Subtitle */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl lg:text-2xl font-extrabold text-[#172033] tracking-tight">
              Generation &amp; Approval Queue
            </h2>
            <p className="text-xs text-[#718096] mt-0.5">
              Turn audience intelligence into content that connects.
            </p>
          </div>
          <span className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#ECE9FF] text-[#5146D8]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Agentic Synthesis Active</span>
          </span>
        </div>
      </div>

      {/* CONTENT GENERATION INPUT PANEL */}
      <div className="bg-white rounded-2xl border border-[#E6E9F0] p-6 shadow-card hover:shadow-card-hover transition-all duration-300 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#E6E9F0]">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-[#ECE9FF] text-[#5146D8] flex items-center justify-center">
              <Wand2 className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold text-[#172033]">
              AI Generation Studio
            </span>
          </div>
          <span className="text-[11px] text-[#718096]">
            Targeting High-Signal Enterprise Audiences
          </span>
        </div>

        {/* Topic Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#172033] block">
            Conversation Topic
          </label>
          <div className="relative">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              placeholder="What conversation would you like to start?"
              className="w-full h-12 pl-4 pr-10 rounded-xl border border-[#E6E9F0] bg-[#F6F7FB] text-xs sm:text-sm text-[#172033] placeholder-[#718096] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5146D8]/20 focus:border-[#5146D8] transition-all font-medium"
            />
            <Sparkles className="w-4 h-4 text-[#5146D8] absolute right-3.5 top-4 pointer-events-none" />
          </div>

          {/* Quick Topic Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] text-[#718096] font-semibold uppercase tracking-wider mr-1">
              Suggestions:
            </span>
            {SAMPLE_TOPICS.map((t, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setTopic(t)}
                className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                  topic === t
                    ? "bg-[#ECE9FF] text-[#5146D8] border-[#5146D8]/30 font-semibold shadow-xs"
                    : "bg-[#F6F7FB] text-[#718096] border-[#E6E9F0] hover:text-[#172033] hover:border-[#CBD5E1]"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Tone & Platform Selectors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Target Tone Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#172033] block">
              Target Tone
            </label>
            <div className="flex flex-wrap gap-1.5">
              {tones.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTargetTone(t)}
                  className={`text-xs px-3 py-1.5 rounded-xl border transition-all ${
                    targetTone === t
                      ? "bg-[#5146D8] text-white border-[#5146D8] font-bold shadow-xs"
                      : "bg-[#F6F7FB] text-[#718096] border-[#E6E9F0] hover:text-[#172033] hover:bg-slate-100"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Platform Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#172033] block">
              Primary Platform
            </label>
            <div className="flex items-center space-x-2">
              {platforms.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setSelectedPlatform(p)}
                  className={`flex-1 h-9 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
                    selectedPlatform === p
                      ? "bg-[#172033] text-white border-[#172033] shadow-xs"
                      : "bg-[#F6F7FB] text-[#718096] border-[#E6E9F0] hover:text-[#172033]"
                  }`}
                >
                  <span>{p}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Button: Generate with Agent */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || !topic.trim()}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-[#5146D8] via-[#4336c5] to-[#3478F6] hover:opacity-95 text-white text-xs sm:text-sm font-bold uppercase tracking-wider shadow-md shadow-[#5146D8]/20 flex items-center justify-center space-x-2.5 transition-all"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Agent Reasoning &amp; Retrieving Past Memory...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-yellow-300" />
                <span>✦ Generate with Agent</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Drafts Filter & Count Bar */}
      <div className="flex items-center justify-between text-xs text-[#718096] px-1">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-[#5146D8]" />
          <span className="font-bold text-[#172033]">
            Active Drafts ({filteredDrafts.length})
          </span>
        </div>

        <div className="flex items-center space-x-1.5">
          <Filter className="w-3.5 h-3.5 text-[#718096]" />
          <span className="text-[11px]">Filter:</span>
          {["all", "linkedin", "x", "instagram"].map((filt) => (
            <button
              key={filt}
              onClick={() => setFilterPlatform(filt)}
              className={`px-2 py-0.5 rounded text-[11px] capitalize transition-colors ${
                filterPlatform === filt
                  ? "bg-[#ECE9FF] text-[#5146D8] font-bold"
                  : "text-[#718096] hover:text-[#172033]"
              }`}
            >
              {filt}
            </button>
          ))}
        </div>
      </div>

      {/* List of Generated Post Cards */}
      <div className="space-y-4">
        {filteredDrafts.map((draft) => (
          <DraftCard
            key={draft.id}
            draft={draft}
            onUpdateContent={handleUpdateContent}
            onApprove={onApproveDraft}
            onRegenerate={handleRegenerate}
            onSendToSimulator={onSendToSimulator}
            isRegenerating={regeneratingId === draft.id}
          />
        ))}

        {filteredDrafts.length === 0 && (
          <div className="bg-white rounded-2xl border border-dashed border-[#E6E9F0] p-10 text-center space-y-2">
            <Sparkles className="w-6 h-6 text-[#5146D8] mx-auto animate-pulse" />
            <div className="text-sm font-bold text-[#172033]">
              No drafts matching filter
            </div>
            <p className="text-xs text-[#718096]">
              Generate a new draft above or reset your platform filter.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
