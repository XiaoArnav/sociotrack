"use client";

import React from "react";
import { Sparkles, Activity, Bot, Database, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface NavbarProps {
  brandName: string;
  onBrandChange: (brand: string) => void;
  isGenerating?: boolean;
}

export function Navbar({ brandName, onBrandChange, isGenerating }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-800 bg-[#0f172a]/90 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Brand & Logo */}
        <div className="flex items-center space-x-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-purple-600 text-white shadow-md shadow-blue-500/20">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-base tracking-tight text-white">
                SocioTrack
              </span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-blue-900/50 text-blue-300 font-mono font-medium border border-blue-700/50">
                LangGraph Core
              </span>
            </div>
            <p className="text-[11px] text-gray-400">
              Autonomous Social Media Engagement & Reinforcement Learning
            </p>
          </div>
        </div>

        {/* Center: System Status & Routing Indicator */}
        <div className="hidden md:flex items-center space-x-3 text-xs text-gray-300">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-gray-900/80 border border-gray-800">
            <Activity className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
            <span className="text-gray-400">Agent Status:</span>
            <span className="font-medium text-emerald-400">Online & Checkpointed</span>
          </div>
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-gray-900/80 border border-gray-800">
            <Database className="h-3.5 w-3.5 text-purple-400" />
            <span className="text-gray-400">Memory:</span>
            <span className="font-medium text-purple-300">ChromaDB In-Memory</span>
          </div>
        </div>

        {/* Right: Brand Selector */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <label className="text-xs text-gray-400 font-medium hidden sm:inline">Brand:</label>
            <select
              value={brandName}
              onChange={(e) => onBrandChange(e.target.value)}
              className="h-8 rounded-lg bg-gray-900 border border-gray-700 px-2.5 text-xs text-gray-200 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="SocioTrack">SocioTrack AI</option>
              <option value="AgentOps_Pro">AgentOps Pro</option>
              <option value="GraphEngine">GraphEngine Enterprise</option>
            </select>
          </div>
          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 text-xs text-blue-400 hover:text-blue-300 hover:underline px-2 py-1"
          >
            <span>FastAPI Docs</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </header>
  );
}
