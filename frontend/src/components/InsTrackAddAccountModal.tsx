"use client";

import React, { useState, useMemo } from "react";
import { X, Search, Loader2, User, Check, Plus, ExternalLink } from "lucide-react";

export interface SuggestedAccount {
  username: string;
  fullName: string;
  avatarUrl?: string;
  isExact?: boolean;
}

interface InsTrackAddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAccount: (username: string) => void;
  onOpenProfile?: (username: string) => void;
}

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Real creators and accounts matching SocioTrack live intelligence
const POPULAR_ACCOUNTS: SuggestedAccount[] = [
  { username: "arnav.patel07", fullName: "Arnav Patel 👾", avatarUrl: `${BASE_PATH}/avatars/arnav.patel07.png` },
  { username: "zurikrishna", fullName: "krishna", avatarUrl: `${BASE_PATH}/avatars/zurikrishna.png` },
  { username: "keerz.core", fullName: "🪐", avatarUrl: `${BASE_PATH}/avatars/keerz.core.png` },
  { username: "techno_gamerz", fullName: "Ujjwal Chaurasia | Techno Gamerz", avatarUrl: `${BASE_PATH}/avatars/techno_gamerz.png` },
  { username: "aviralbhardwaj_ji", fullName: "Aviral Bhardwaj", avatarUrl: `${BASE_PATH}/avatars/aviralbhardwaj_ji.png` },
  { username: "lalalalisa_m", fullName: "LISA", avatarUrl: `${BASE_PATH}/avatars/lalalalisa_m.png` },
  { username: "thv", fullName: "V (뷔) | Kim Taehyung", avatarUrl: `${BASE_PATH}/avatars/thv.png` },
  { username: "sooyaaa__", fullName: "JISOO (지수) | BLISSOO", avatarUrl: `${BASE_PATH}/avatars/sooyaaa__.png` },
  { username: "mnijungkook", fullName: "Jung Kook (정국) | BTS", avatarUrl: `${BASE_PATH}/avatars/mnijungkook.png` },
  { username: "j.m", fullName: "Jimin (지민) | Park Jimin", avatarUrl: `${BASE_PATH}/avatars/j.m.png` },
  { username: "uarmyhope", fullName: "j-hope (제이홉) | Jung Hoseok", avatarUrl: `${BASE_PATH}/avatars/uarmyhope.png` },
  { username: "rkive", fullName: "RM (남준) | Kim Namjoon", avatarUrl: `${BASE_PATH}/avatars/rkive.png` },
  { username: "itsjvke", fullName: "JVKE | Singer & Producer", avatarUrl: `${BASE_PATH}/avatars/itsjvke.png` },
  { username: "chenzheyuanisssme", fullName: "Chen Zheyuan (陈哲远) | Actor", avatarUrl: `${BASE_PATH}/avatars/chenzheyuanisssme.png` },
  { username: "tomi.timetraveler", fullName: "Tomi (@tomi.timetraveler) | Creator", avatarUrl: `${BASE_PATH}/avatars/tomi.timetraveler.png` },
  { username: "moretomihika", fullName: "Mihika Sharma (@moretomihika) | Creator", avatarUrl: `${BASE_PATH}/avatars/moretomihika.png` },
  { username: "mkbhd", fullName: "Marques Brownlee", avatarUrl: "https://unavatar.io/youtube/mkbhd" },
  { username: "mrbeast", fullName: "Jimmy Donaldson", avatarUrl: "https://unavatar.io/youtube/mrbeast" },
];

export function InsTrackAddAccountModal({
  isOpen,
  onClose,
  onAddAccount,
  onOpenProfile,
}: InsTrackAddAccountModalProps) {
  const [query, setQuery] = useState("");
  const [addedHandles, setAddedHandles] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Compute live search suggestions based on query
  const suggestions = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];

    // Filter matching popular accounts
    const matches = POPULAR_ACCOUNTS.filter(
      (acc) =>
        acc.username.toLowerCase().includes(trimmed) ||
        acc.fullName.toLowerCase().includes(trimmed)
    );

    // If exact query isn't the first result, synthesize the primary row
    const exactExists = matches.some((m) => m.username.toLowerCase() === trimmed);
    const results: SuggestedAccount[] = [];

    if (!exactExists) {
      results.push({
        username: trimmed,
        fullName: 'Press "Enter" to open account profile',
        avatarUrl: `${API_BASE_URL}/api/creators/${encodeURIComponent(trimmed)}/avatar`,
        isExact: true,
      });
    }

    results.push(...matches);
    return results.slice(0, 5);
  }, [query]);

  if (!isOpen) return null;

  const handleAdd = (handle: string) => {
    setAddedHandles((prev) => new Set(prev).add(handle));
    onAddAccount(handle);
  };

  const handleOpen = (handle: string) => {
    if (onOpenProfile) {
      onOpenProfile(handle);
    }
    onClose();
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      onClose();
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      handleAdd(trimmed);
      setQuery("");
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#161F30] border border-[#243048] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden text-slate-100 animate-scale-up space-y-4 p-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#818CF8] tracking-tight">
            Who do you want to track?
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-[#243048]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Subtitle */}
        <p className="text-xs text-slate-400 -mt-1">
          Add some accounts to your dashboard to track their daily stats
        </p>

        {/* Search Input Bar */}
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <Search className="w-4 h-4 text-[#818CF8]" />
            </div>
            <input
              type="text"
              autoFocus
              placeholder="Search any account on Instagram"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full h-11 pl-10 pr-9 rounded-xl border border-[#243048] bg-[#0B0F19] text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#6366F1] transition-all"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Empty state hint when search input is empty */}
          {!query && (
            <p className="text-[11px] text-slate-500 pl-1">
              Enter exact username for your account or any other account (e.g. cristiano)
            </p>
          )}

          {/* Autocomplete / Suggested Accounts List (Matching Video 4 & 5) */}
          {query.trim().length > 0 && (
            <div className="rounded-xl border border-[#243048] bg-[#0B0F19] divide-y divide-[#1E2638] max-h-72 overflow-y-auto">
              {suggestions.map((acc, index) => {
                const isAdded = addedHandles.has(acc.username);
                const isFirstExact = index === 0 && acc.isExact;

                return (
                  <div
                    key={acc.username + index}
                    className="flex items-center justify-between px-4 py-3 hover:bg-[#161F30]/70 transition-colors"
                  >
                    {/* Left: Avatar & Handle/Name */}
                    <div className="flex items-center space-x-3 min-w-0 pr-2">
                      <div className="w-9 h-9 rounded-full bg-[#1E2638] border border-[#243048] flex items-center justify-center shrink-0 text-slate-400 overflow-hidden">
                        {acc.avatarUrl ? (
                          <img
                            src={acc.avatarUrl}
                            alt={acc.username}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              const clean = acc.username.replace(/^@/, "").toLowerCase().trim();
                              if (!target.dataset.triedProxy) {
                                target.dataset.triedProxy = "1";
                                target.src = `${API_BASE_URL}/api/creators/${encodeURIComponent(clean)}/avatar`;
                              } else {
                                target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(clean)}`;
                              }
                            }}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">
                          {acc.username}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {acc.fullName}
                        </div>
                      </div>
                    </div>

                    {/* Right Action Button */}
                    <div className="shrink-0">
                      {isFirstExact ? (
                        <button
                          type="button"
                          onClick={() => handleOpen(acc.username)}
                          className="px-3.5 py-1.5 rounded-lg bg-[#6366F1] hover:bg-[#5558E6] text-white text-xs font-semibold shadow-sm transition-colors flex items-center space-x-1"
                        >
                          <span>Open Profile</span>
                        </button>
                      ) : isAdded ? (
                        <span className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
                          <Check className="w-3.5 h-3.5" />
                          <span>Added</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAdd(acc.username)}
                          className="px-3.5 py-1.5 rounded-lg bg-[#6366F1] hover:bg-[#5558E6] text-white text-xs font-semibold shadow-sm transition-colors"
                        >
                          Add to Dashboard
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Modal Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-[#1E2638]">
            <span className="text-[11px] text-slate-500">
              {addedHandles.size > 0
                ? `${addedHandles.size} account${addedHandles.size > 1 ? "s" : ""} added to tracking ledger`
                : "Free tier tracks up to 2 accounts concurrently"}
            </span>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-2 rounded-xl bg-[#6366F1] hover:bg-[#5558E6] text-white text-xs font-bold shadow-md transition-all disabled:opacity-50"
            >
              Done
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
