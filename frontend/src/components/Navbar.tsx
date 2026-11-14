"use client";

import React from "react";
import Link from "next/link";
import { Activity, Bot, Database, ExternalLink } from "lucide-react";

export interface NavbarProps {
  brandName?: string;
  onBrandChange?: (brand: string) => void;
  isGenerating?: boolean;
}

export function Navbar({ brandName = "SocioTrack", onBrandChange, isGenerating }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-800 bg-[#0f172a]/95 backdrop-blur-md min-h-[72px] sm:min-h-[80px] flex items-center px-4 sm:px-8 transition-all">
      <div className="flex w-full items-center justify-between gap-4">
        {/* Brand & Logo */}
        <Link
          href="/"
          aria-label="SocioTrack home"
          className="flex items-center space-x-3.5 hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0f172a] rounded-xl p-1 -m-1"
        >
          <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-blue-500/25 shrink-0">
            <Bot className="h-6 w-6 sm:h-7 sm:w-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white">
                SocioTrack
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-blue-900/60 text-blue-300 font-mono font-medium border border-blue-700/60">
                LangGraph Core
              </span>
            </div>
            <p className="text-xs text-gray-400 hidden sm:block">
              Autonomous Social Media Engagement & Reinforcement Learning
            </p>
          </div>
        </Link>

        {/* Center: System Status & Routing Indicator */}
        <div className="hidden lg:flex items-center space-x-3 text-xs text-gray-300">
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

        {/* Right: Active Brand & Docs */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-400 font-medium hidden sm:inline">Workspace:</span>
            <span className="px-2.5 py-1 rounded-lg bg-gray-900 border border-gray-700 text-xs text-gray-200 font-semibold">
              {brandName || "SocioTrack AI"}
            </span>
          </div>
          <a
            href="https://frontend-taupe-zeta-84.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 text-xs text-blue-400 hover:text-blue-300 hover:underline px-2 py-1"
          >
            <span>Live Web</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </header>
  );
}

