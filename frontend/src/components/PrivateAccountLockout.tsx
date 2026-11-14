"use client";

import React from "react";
import { Lock, ArrowLeft, ShieldAlert, Instagram, HelpCircle } from "lucide-react";

interface PrivateAccountLockoutProps {
  handle: string;
  onReturnToSearch: () => void;
}

export function PrivateAccountLockout({
  handle,
  onReturnToSearch,
}: PrivateAccountLockoutProps) {
  return (
    <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 animate-scale-up">
      <div className="rounded-3xl bg-white dark:bg-[#111827] border-2 border-amber-500/30 dark:border-amber-500/20 p-8 sm:p-12 text-center shadow-2xl space-y-6">
        {/* Lock Icon */}
        <div className="mx-auto w-20 h-20 rounded-3xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-inner">
          <Lock className="w-10 h-10 stroke-[2.2]" />
        </div>

        {/* Heading & Notice */}
        <div className="space-y-3">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-500/20">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Privacy Guard Enforced</span>
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Analytics Unavailable
          </h2>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium max-w-lg mx-auto leading-relaxed">
            This account is private. Analytics are available only for public Instagram accounts.
          </p>
        </div>

        {/* Diagnostic Explainer */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#1E2638] border border-slate-200 dark:border-slate-800 text-left text-xs text-slate-600 dark:text-slate-400 space-y-2">
          <div className="flex items-center space-x-2 font-bold text-slate-900 dark:text-white">
            <Instagram className="w-4 h-4 text-[#E1306C]" />
            <span>Meta Graph API Privacy Compliance</span>
          </div>
          <p className="leading-relaxed">
            In accordance with Meta and Instagram Graph API Developer Policies, personal and private profile metrics, posts, followers, and engagement rates cannot be collected or surfaced without direct account holder authentication.
          </p>
          <div className="pt-1 text-[11px] font-mono text-slate-500 dark:text-slate-400">
            Account: @{handle} • Status: Private / Access Restricted
          </div>
        </div>

        {/* Return to Search Button */}
        <div className="pt-2">
          <button
            onClick={onReturnToSearch}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition-all inline-flex items-center justify-center space-x-2 hover:scale-102"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Search</span>
          </button>
        </div>
      </div>
    </div>
  );
}
