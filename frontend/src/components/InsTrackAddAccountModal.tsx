"use client";

import React, { useState } from "react";
import { X, Search, Loader2 } from "lucide-react";

interface InsTrackAddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAccount: (username: string) => void;
}

export function InsTrackAddAccountModal({
  isOpen,
  onClose,
  onAddAccount,
}: InsTrackAddAccountModalProps) {
  const [username, setUsername] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      onAddAccount(username.trim());
      setUsername("");
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#161F30] border border-[#243048] rounded-2xl w-full max-w-lg shadow-2xl p-6 text-slate-100 animate-scale-up space-y-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#818CF8] tracking-tight">
            Who do you want to track?
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Subtitle */}
        <p className="text-xs text-slate-400">
          Add some accounts to your dashboard to track their daily stats
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#818CF8]" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </div>
            <input
              type="text"
              autoFocus
              placeholder="Enter exact username for your account or any other account (e.g. cristiano)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full h-11 pl-10 pr-9 rounded-xl border border-[#243048] bg-[#0B0F19] text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#6366F1] transition-all"
            />
            {username && (
              <button
                type="button"
                onClick={() => setUsername("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={!username.trim() || isSearching}
              className="px-6 py-2.5 rounded-xl bg-[#6366F1] hover:bg-[#5558E6] text-white text-xs font-bold shadow-md transition-all disabled:opacity-50"
            >
              Done
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
