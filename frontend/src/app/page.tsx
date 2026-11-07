"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, RefreshCw, Wand2, Terminal, ChevronRight } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { DraftQueue } from "@/components/DraftQueue";
import { MemoryDrawer } from "@/components/MemoryDrawer";
import { SimulatorBar } from "@/components/SimulatorBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  fetchGenerateDrafts,
  fetchMemoryInsights,
  approvePostAPI,
  feedSimulatorMetricsAPI,
  SimulatorFeedbackResult,
} from "@/lib/api";
import {
  MOCK_DRAFTS,
  MOCK_SELECTED_POST,
  MOCK_MEMORY_INSIGHTS,
  MockPostVariation,
  MockSelectedPost,
  MockMemoryInsights,
} from "@/mocks/mockData";

const SAMPLE_TOPICS = [
  "Deterministic State Management with LangGraph",
  "Agent Latency & Token Optimization in Production",
  "Memory Checkpointing vs Infinite Hallucination Loops",
  "Enterprise Agentic Architecture Playbook",
];

export default function DashboardPage() {
  const [brandName, setBrandName] = useState<string>("SocioTrack");
  const [topic, setTopic] = useState<string>("Deterministic State Management with LangGraph");
  const [drafts, setDrafts] = useState<MockPostVariation[]>(MOCK_DRAFTS);
  const [selectedPost, setSelectedPost] = useState<MockSelectedPost | null>(MOCK_SELECTED_POST);
  const [memoryInsights, setMemoryInsights] = useState<MockMemoryInsights | null>(MOCK_MEMORY_INSIGHTS);
  const [isGenerating, setIsGenerating] = useState(false);
  const [postForSimulation, setPostForSimulation] = useState<string>(MOCK_DRAFTS[0].full_text);

  // Initial load of insights
  useEffect(() => {
    refreshMemory();
  }, [brandName]);

  const refreshMemory = async () => {
    const data = await fetchMemoryInsights(brandName, topic);
    setMemoryInsights(data);
  };

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    const result = await fetchGenerateDrafts(brandName, topic);
    setDrafts(result.drafts);
    setSelectedPost(result.selected_post);
    if (result.selected_post) {
      setPostForSimulation(result.selected_post.draft.full_text);
    }
    setIsGenerating(false);
    await refreshMemory();
  };

  const handleApprove = async (postContent: string, format: string) => {
    await approvePostAPI(postContent, format);
  };

  const handleSimulate = async (metrics: {
    impressions: number;
    shares: number;
    replies: number;
    likes: number;
  }): Promise<SimulatorFeedbackResult | null> => {
    const targetContent = postForSimulation || drafts[0]?.full_text || "";
    return await feedSimulatorMetricsAPI(brandName, topic, targetContent, metrics);
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-100 flex flex-col pb-28">
      {/* 1. Global Navigation */}
      <Navbar
        brandName={brandName}
        onBrandChange={setBrandName}
        isGenerating={isGenerating}
      />

      {/* 2. Topic Input & Generation Control Bar */}
      <section className="border-b border-gray-800 bg-[#111726]/60 px-6 py-4">
        <div className="max-w-7xl mx-auto space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Input
                type="text"
                placeholder="Enter technical topic to generate content for..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                className="pl-3.5 pr-10 bg-gray-900 border-gray-700 text-sm h-11"
              />
              <Sparkles className="w-4 h-4 text-blue-400 absolute right-3.5 top-3.5 pointer-events-none" />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="h-11 px-6 bg-blue-600 hover:bg-blue-700 font-semibold flex items-center space-x-2 shrink-0 w-full sm:w-auto"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Agent Generating...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>Draft 3 Variations</span>
                </>
              )}
            </Button>
          </div>

          {/* Quick topic pills */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-gray-400 text-[11px] font-medium flex items-center space-x-1">
              <span>Quick Topics:</span>
            </span>
            {SAMPLE_TOPICS.map((t, idx) => (
              <button
                key={idx}
                onClick={() => setTopic(t)}
                className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                  topic === t
                    ? "bg-blue-900/50 text-blue-300 border-blue-700"
                    : "bg-gray-900/80 text-gray-400 border-gray-800 hover:text-gray-200 hover:border-gray-700"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Main Dashboard Workspace (Center Queue + Right Memory Drawer) */}
      <main className="max-w-7xl mx-auto w-full px-6 py-6 flex-1">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Center Column: Draft Queue */}
          <DraftQueue
            drafts={drafts}
            selectedPost={selectedPost}
            onApprove={handleApprove}
            onSelectForSimulation={(content) => setPostForSimulation(content)}
            isGenerating={isGenerating}
          />

          {/* Right Column: Learned Memory Drawer */}
          <MemoryDrawer
            memoryData={memoryInsights}
            onSelectTopic={(t) => setTopic(t)}
          />
        </div>
      </main>

      {/* 4. Bottom Metric Injection Simulator Bar */}
      <SimulatorBar
        postContentToSimulate={postForSimulation}
        topic={topic}
        brandName={brandName}
        onSimulate={handleSimulate}
        onRefreshMemory={refreshMemory}
      />
    </div>
  );
}
