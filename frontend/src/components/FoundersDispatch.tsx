"use client";

import React, { useState } from "react";
import {
  Linkedin,
  Terminal,
  ExternalLink,
  Code2,
  Sparkles,
  Quote,
  Check,
  Copy,
  Users2,
} from "lucide-react";

interface Founder {
  id: string;
  name: string;
  role: string;
  specialty: string;
  avatarSeed: string;
  linkedin: string;
  quote: string;
  badges: string[];
}

const FOUNDERS: Founder[] = [
  {
    id: "krishna",
    name: "Krishna Verma",
    role: "Systems Architect & Engine Lead",
    specialty: "Fault-Tolerant Distributed Pipelines & Proxy Resilience",
    avatarSeed: "krishna",
    linkedin: "https://www.linkedin.com/in/krishna-verma-03610136a/",
    quote:
      "Building resilient agent systems means designing invariant boundaries where network timeouts and proxy blocks are treated as normal inputs, never fatal crashes.",
    badges: ["Backend Core", "Crawler Resilience", "FastAPI"],
  },
  {
    id: "arnav",
    name: "Arnav Patel",
    role: "Autonomous Agent & Vector Memory Lead",
    specialty: "Hindsight Persistent Memory & Algorithmic Virality",
    avatarSeed: "arnav",
    linkedin: "https://www.linkedin.com/in/arnavpatel369/",
    quote:
      "Agents should not be amnesiac chatbots. Real social intelligence requires continuous semantic recall across months of creator performance data.",
    badges: ["LangGraph", "Vector Memory", "AI Studio"],
  },
  {
    id: "shreya",
    name: "Shreya R",
    role: "Product Design & Intelligence Systems",
    specialty: "High-Density Analytics UX & Responsive Telemetry",
    avatarSeed: "shreya",
    linkedin: "http://linkedin.com/in/shreya-r-a88783428/",
    quote:
      "Great telemetry tools distill overwhelming firehoses of raw metrics into immediate, intuitive clarity that creators can act on in seconds.",
    badges: ["Design Systems", "Component Architecture", "Tailwind"],
  },
  {
    id: "keerthana",
    name: "Keerthana M",
    role: "Telemetry Engine & Analytics Pipelines",
    specialty: "Audience Retention Modeling & Automated Schedulers",
    avatarSeed: "keerthana",
    linkedin: "https://www.linkedin.com/in/keerthana-m-a47537428/",
    quote:
      "True audience growth isn't simply vanity follower totals—it is measured by retention health, churn velocity, and algorithmic community loyalty.",
    badges: ["Retention Radar", "Cron Schedulers", "Data Modeling"],
  },
];

export function FoundersDispatch() {
  const [activeFounderId, setActiveFounderId] = useState<string>("krishna");
  const [copiedLink, setCopiedLink] = useState(false);

  const activeFounder =
    FOUNDERS.find((f) => f.id === activeFounderId) || FOUNDERS[0];

  const handleCopyDispatch = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(
        `SocioTrack Founders & Builders:\n` +
          FOUNDERS.map((f) => `• ${f.name} (${f.role}) - ${f.linkedin}`).join("\n")
      );
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200/90 dark:border-[#243048] bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-[#111726] dark:via-[#161F30] dark:to-[#0D121F] p-8 sm:p-12 shadow-xl space-y-10 transition-colors">
      {/* Background Cybernetic Glow */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Banner */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200/70 dark:border-[#243048]">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Open Source Core • Built in Public</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Founders’ Dispatch //{" "}
            <span className="bg-gradient-to-r from-indigo-500 via-sky-400 to-cyan-400 bg-clip-text text-transparent">
              Behind the Architecture
            </span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            We built <strong className="text-slate-900 dark:text-white font-bold">SocioTrack</strong> with a singular conviction: creators, data engineers, and social teams deserve autonomous social intelligence that doesn’t treat audience telemetry as an opaque black box. By uniting deterministic state machines, sub-second crawlers, and persistent vector memory, we engineered a platform that is transparent, open, and resilient.
          </p>
        </div>

        {/* Action Pills */}
        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={handleCopyDispatch}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-[#1E2638] hover:bg-slate-200 dark:hover:bg-[#28354D] text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200/60 dark:border-[#2C3B59] transition-all shadow-xs"
            title="Copy all founders' LinkedIn links"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Copied Socials!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Share Team</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 4 Interactive Founders Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {FOUNDERS.map((founder) => {
          const isActive = activeFounderId === founder.id;
          return (
            <div
              key={founder.id}
              onClick={() => setActiveFounderId(founder.id)}
              className={`relative rounded-2xl p-5 cursor-pointer transition-all border flex flex-col justify-between ${
                isActive
                  ? "bg-white dark:bg-[#1C263B] border-indigo-500/80 shadow-lg shadow-indigo-500/10 ring-2 ring-indigo-500/20 scale-[1.02]"
                  : "bg-white/60 dark:bg-[#161F30]/60 border-slate-200/70 dark:border-[#243048] hover:border-slate-300 dark:hover:border-[#334366] hover:bg-white dark:hover:bg-[#1A2338]"
              }`}
            >
              <div className="space-y-4">
                {/* Avatar and Verification */}
                <div className="flex items-center justify-between">
                  <div className="relative">
                    <img
                      src={`https://api.dicebear.com/7.x/identicon/svg?seed=${founder.avatarSeed}&backgroundColor=b6e3f4,c0aede,d1d4f9`}
                      alt={founder.name}
                      className="w-12 h-12 rounded-xl object-cover border-2 border-indigo-500/30 p-1 bg-slate-50 dark:bg-[#0E1526]"
                    />
                    {isActive && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-indigo-500 ring-2 ring-white dark:ring-[#161F30]" />
                    )}
                  </div>

                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#202B42] text-slate-500 dark:text-slate-400 font-bold uppercase">
                    Founder
                  </span>
                </div>

                {/* Name & Role */}
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {founder.name}
                  </h4>
                  <p className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 mt-0.5 leading-snug">
                    {founder.role}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {founder.specialty}
                  </p>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {founder.badges.map((b) => (
                    <span
                      key={b}
                      className="text-[9px] font-mono font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#1F293D] text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50"
                    >
                      {b}
                    </span>
                  ))}
                </div>
              </div>

              {/* LinkedIn Direct CTA Button */}
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-[#243048]">
                <a
                  href={founder.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="w-full flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#0077B5]/10 hover:bg-[#0077B5] text-[#0077B5] hover:text-white border border-[#0077B5]/30 text-xs font-bold transition-all shadow-xs group"
                >
                  <Linkedin className="w-3.5 h-3.5 fill-current" />
                  <span>Connect</span>
                  <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Philosophy Spotlight Console */}
      <div className="relative rounded-2xl border border-indigo-500/30 bg-slate-900 text-slate-100 p-6 shadow-inner font-mono text-xs overflow-hidden">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-slate-400 text-[11px]">
          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>DISPATCH://{activeFounder.name.toLowerCase().replace(/\s+/g, "_")}.md</span>
          </div>
          <span className="text-[10px] text-indigo-400 font-bold uppercase">
            Click any founder card to view perspective
          </span>
        </div>

        <div className="mt-4 flex items-start space-x-3">
          <Quote className="w-6 h-6 text-indigo-400 shrink-0 opacity-80" />
          <div className="space-y-2">
            <p className="text-sm font-sans font-medium text-slate-200 leading-relaxed italic">
              &ldquo;{activeFounder.quote}&rdquo;
            </p>
            <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-sans">
              <span className="font-bold text-white">— {activeFounder.name}</span>
              <span>•</span>
              <span className="text-indigo-400">{activeFounder.role}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
