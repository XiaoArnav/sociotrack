"use client";

import React, { useState } from "react";
import { X, ShieldCheck, FileText, Scale, Lock, AlertTriangle, ExternalLink } from "lucide-react";

interface TermsAndPrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TermsAndPrivacyModal({ isOpen, onClose }: TermsAndPrivacyModalProps) {
  const [activeTab, setActiveTab] = useState<"terms" | "privacy" | "meta">("terms");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 space-y-6 animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Legal &amp; Compliance Center
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Terms of Service, Privacy Policy, and Meta Platform Agreements
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-2">
          {[
            { id: "terms", label: "Terms of Service", icon: FileText },
            { id: "privacy", label: "Privacy & GDPR", icon: Lock },
            { id: "meta", label: "Platform Compliance", icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Tabs */}
        <div className="max-h-72 overflow-y-auto text-xs text-slate-700 dark:text-slate-300 space-y-3 pr-1">
          {activeTab === "terms" && (
            <div className="space-y-3 leading-relaxed">
              <h4 className="font-bold text-slate-900 dark:text-white">1. Subscription Terms &amp; Billing</h4>
              <p>
                SocioTrack provides subscription software billed on a recurring monthly or annual basis. Subscriptions renew automatically unless canceled prior to the renewal date via the Customer Billing Portal.
              </p>
              <h4 className="font-bold text-slate-900 dark:text-white">2. 14-Day Money Back Guarantee</h4>
              <p>
                Customers on Pro, Team, or Agency tiers may request a full refund within 14 calendar days of initial subscription purchase if not fully satisfied with our diagnostic agent capabilities.
              </p>
              <h4 className="font-bold text-slate-900 dark:text-white">3. Acceptable Use Policy</h4>
              <p>
                Users agree not to use SocioTrack for spam generation, abusive DM automation, or deceptive impersonation. All AI generation credits must adhere to community safety standards.
              </p>
            </div>
          )}

          {activeTab === "privacy" && (
            <div className="space-y-3 leading-relaxed">
              <h4 className="font-bold text-slate-900 dark:text-white">1. Tenant Isolation &amp; Zero Sale of Data</h4>
              <p>
                We do not sell, rent, or monetize your workspace data. All brand vector memories and historical post metrics are strictly isolated within your encrypted tenant boundary.
              </p>
              <h4 className="font-bold text-slate-900 dark:text-white">2. GDPR &amp; CCPA Data Rights</h4>
              <p>
                Users have the right to request a complete machine-readable export of all stored telemetry and personal data, or permanent account deletion cascades via our automated Privacy API (/api/privacy/delete-account).
              </p>
              <h4 className="font-bold text-slate-900 dark:text-white">3. LLM Training Opt-Out</h4>
              <p>
                Your brand's private draft copy and proprietary intelligence profiles are never used to train generalized foundation models without explicit opt-in consent.
              </p>
            </div>
          )}

          {activeTab === "meta" && (
            <div className="space-y-3 leading-relaxed">
              <h4 className="font-bold text-slate-900 dark:text-white">1. Official Meta Graph API Integration</h4>
              <p>
                SocioTrack connects to Instagram business accounts using official OAuth2 scopes granted by Meta. We never request or store user passwords.
              </p>
              <h4 className="font-bold text-slate-900 dark:text-white">2. Public Diagnostic Feeds</h4>
              <p>
                Competitor benchmark figures originate solely from public accounts adhering to rate-limit quotas and Meta Developer Guidelines.
              </p>
            </div>
          )}
        </div>

        {/* Disclaimer Notice */}
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <p>
            <strong>Pre-Commercial Compliance Notice:</strong> These terms reflect SocioTrack&apos;s technical data architecture and privacy safeguards. Final commercial launch terms should be reviewed by qualified legal counsel in your operating jurisdiction.
          </p>
        </div>
      </div>
    </div>
  );
}
