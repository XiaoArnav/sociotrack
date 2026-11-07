"use client";

import React from "react";
import { Sparkles, BrainCircuit, Users, TrendingUp, Zap, Cpu } from "lucide-react";

export type IntelligenceNode = "generation" | "analysis" | "memory" | "prediction" | "idle";

interface IntelligenceCoreProps {
  activeNode?: IntelligenceNode;
  statusText?: string;
  className?: string;
}

export function IntelligenceCore({
  activeNode = "idle",
  statusText,
  className = "",
}: IntelligenceCoreProps) {
  const nodes = [
    {
      id: "generation" as const,
      name: "Content Generation",
      label: "LangGraph Draft Engine",
      icon: Sparkles,
      x: 18,
      y: 28,
      color: "#5146D8",
    },
    {
      id: "analysis" as const,
      name: "Audience Analysis",
      label: "Sentiment & Topics",
      icon: Users,
      x: 82,
      y: 28,
      color: "#3478F6",
    },
    {
      id: "memory" as const,
      name: "Agent Memory",
      label: "Reinforced Vector Store",
      icon: BrainCircuit,
      x: 82,
      y: 78,
      color: "#16A477",
    },
    {
      id: "prediction" as const,
      name: "Engagement Prediction",
      label: "Viral Scoring Neural Pass",
      icon: TrendingUp,
      x: 18,
      y: 78,
      color: "#8B5CF6",
    },
  ];

  const getStatusMessage = () => {
    if (statusText) return statusText;
    switch (activeNode) {
      case "generation":
        return "Synthesizing 3 multi-format drafts based on learned memory...";
      case "analysis":
        return "Analyzing audience sentiment signals & topic resonance...";
      case "memory":
        return "Recalibrating agent memory & updating long-term knowledge weights...";
      case "prediction":
        return "Calculating composite engagement vectors and virality score...";
      default:
        return "Core synchronized. Monitoring audience feedback loop.";
    }
  };

  return (
    <div
      className={`bg-white rounded-2xl border border-[#E6E9F0] p-4 shadow-card hover:shadow-card-hover transition-all duration-300 relative overflow-hidden ${className}`}
    >
      {/* Background ambient gradient glow */}
      <div className="absolute -top-16 -right-16 w-36 h-36 bg-[#ECE9FF] rounded-full blur-2xl opacity-60 pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-[#E8F8F3] rounded-full blur-2xl opacity-50 pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E6E9F0] relative z-10">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-lg bg-[#ECE9FF] flex items-center justify-center text-[#5146D8]">
            <Cpu className="w-3.5 h-3.5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-[#172033] tracking-tight">
              SocioTrack Intelligence Core
            </h3>
            <p className="text-[10px] text-[#718096]">
              Autonomous 4-Node Closed Feedback Loop
            </p>
          </div>
        </div>

        <span
          className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold transition-colors ${
            activeNode !== "idle"
              ? "bg-[#ECE9FF] text-[#5146D8] border border-[#5146D8]/30 animate-pulse"
              : "bg-[#E8F8F3] text-[#16A477] border border-[#16A477]/30"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              activeNode !== "idle" ? "bg-[#5146D8] animate-ping" : "bg-[#16A477]"
            }`}
          />
          <span>{activeNode !== "idle" ? "Processing" : "Live & Synced"}</span>
        </span>
      </div>

      {/* 4-Node Interconnected Visualization Canvas */}
      <div className="relative h-44 w-full my-2 flex items-center justify-center">
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {/* Subtle Grid Pattern */}
          <defs>
            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#5146D8" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#3478F6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#16A477" stopOpacity="0.4" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Connected Pathways between Nodes */}
          {/* 1. Gen -> Analysis */}
          <line
            x1="22"
            y1="28"
            x2="78"
            y2="28"
            stroke={activeNode === "generation" || activeNode === "analysis" ? "#5146D8" : "#E2E8F0"}
            strokeWidth={activeNode === "generation" || activeNode === "analysis" ? "1.8" : "1.2"}
            strokeDasharray={activeNode !== "idle" ? "2,2" : "none"}
            className={activeNode !== "idle" ? "animate-pulse" : ""}
          />
          {/* 2. Analysis -> Memory */}
          <line
            x1="82"
            y1="34"
            x2="82"
            y2="72"
            stroke={activeNode === "analysis" || activeNode === "memory" ? "#3478F6" : "#E2E8F0"}
            strokeWidth={activeNode === "analysis" || activeNode === "memory" ? "1.8" : "1.2"}
            strokeDasharray={activeNode !== "idle" ? "2,2" : "none"}
            className={activeNode !== "idle" ? "animate-pulse" : ""}
          />
          {/* 3. Memory -> Prediction */}
          <line
            x1="78"
            y1="78"
            x2="22"
            y2="78"
            stroke={activeNode === "memory" || activeNode === "prediction" ? "#16A477" : "#E2E8F0"}
            strokeWidth={activeNode === "memory" || activeNode === "prediction" ? "1.8" : "1.2"}
            strokeDasharray={activeNode !== "idle" ? "2,2" : "none"}
            className={activeNode !== "idle" ? "animate-pulse" : ""}
          />
          {/* 4. Prediction -> Gen */}
          <line
            x1="18"
            y1="72"
            x2="18"
            y2="34"
            stroke={activeNode === "prediction" || activeNode === "generation" ? "#8B5CF6" : "#E2E8F0"}
            strokeWidth={activeNode === "prediction" || activeNode === "generation" ? "1.8" : "1.2"}
            strokeDasharray={activeNode !== "idle" ? "2,2" : "none"}
            className={activeNode !== "idle" ? "animate-pulse" : ""}
          />
          {/* Center Cross Interconnects */}
          <line
            x1="22"
            y1="32"
            x2="78"
            y2="74"
            stroke="#F1F5F9"
            strokeWidth="0.8"
          />
          <line
            x1="78"
            y1="32"
            x2="22"
            y2="74"
            stroke="#F1F5F9"
            strokeWidth="0.8"
          />

          {/* Central Core Pulse Indicator */}
          <circle
            cx="50"
            cy="53"
            r="8"
            fill="#ECE9FF"
            className="animate-pulse opacity-70"
          />
          <circle
            cx="50"
            cy="53"
            r="3.5"
            fill="#5146D8"
          />
        </svg>

        {/* The 4 Rendered Node Cards */}
        {nodes.map((node) => {
          const isActive = activeNode === node.id;
          const Icon = node.icon;

          // Position style based on percentage
          const posStyle: React.CSSProperties = {
            position: "absolute",
            left: `${node.x}%`,
            top: `${node.y}%`,
            transform: "translate(-50%, -50%)",
          };

          return (
            <div
              key={node.id}
              style={posStyle}
              className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-xl border text-xs transition-all duration-300 select-none cursor-default ${
                isActive
                  ? "bg-white border-[#5146D8] shadow-lg shadow-[#5146D8]/20 scale-105 ring-2 ring-[#5146D8]/20"
                  : "bg-white/95 border-[#E6E9F0] text-[#172033] shadow-sm hover:border-[#CBD5E1]"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  isActive
                    ? "bg-[#5146D8] text-white"
                    : "bg-[#F6F7FB] text-[#718096]"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "animate-spin" : ""}`} />
              </div>
              <div className="flex flex-col text-left">
                <span
                  className={`text-[11px] font-bold leading-tight ${
                    isActive ? "text-[#5146D8]" : "text-[#172033]"
                  }`}
                >
                  {node.name}
                </span>
                <span className="text-[9px] text-[#718096] leading-none hidden sm:inline">
                  {node.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dynamic Status Ticker Bar */}
      <div className="mt-2 bg-[#F6F7FB] border border-[#E6E9F0] rounded-xl px-3 py-2 flex items-center space-x-2 text-[11px] text-[#718096]">
        <Zap
          className={`w-3.5 h-3.5 shrink-0 ${
            activeNode !== "idle" ? "text-[#5146D8] animate-bounce" : "text-[#16A477]"
          }`}
        />
        <span className="truncate text-[#172033] font-medium">
          {getStatusMessage()}
        </span>
      </div>
    </div>
  );
}
