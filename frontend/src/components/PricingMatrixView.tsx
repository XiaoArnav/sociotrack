"use client";

import React, { useState } from "react";
import {
  Check,
  Sparkles,
  Zap,
  Building2,
  Users,
  ShieldCheck,
  ArrowRight,
  HelpCircle,
} from "lucide-react";

interface PricingMatrixViewProps {
  currentPlan?: string;
  onSelectPlan: (plan: "pro" | "team" | "agency", cycle: "monthly" | "yearly") => void;
  isLoading?: boolean;
}

export function PricingMatrixView({
  currentPlan = "free",
  onSelectPlan,
  isLoading = false,
}: PricingMatrixViewProps) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");

  const plans = [
    {
      id: "free",
      name: "Free",
      tagline: "Essential diagnostics & basic recommendations for individual creators.",
      priceMonthly: 0,
      priceYearly: 0,
      credits: 30,
      features: [
        "30 AI Generation Credits / mo",
        "1 Brand Workspace",
        "1 Connected Instagram Account",
        "14 Days Analytics History",
        "1 Tracked Competitor",
        "Community Support",
      ],
      isPopular: false,
    },
    {
      id: "pro",
      name: "Pro Creator",
      tagline: "Full autonomous agent capabilities, adaptive memory, and multi-format studio.",
      priceMonthly: 29,
      priceYearly: 23, // $276/yr
      credits: 300,
      features: [
        "300 AI Generation Credits / mo",
        "3 Brand Workspaces",
        "3 Connected Social Accounts",
        "90 Days Analytics History",
        "5 Tracked Competitors",
        "A/B Controlled Experiments",
        "Verifiable Audit CSV Exports",
        "Standard Priority Support",
      ],
      isPopular: true,
    },
    {
      id: "team",
      name: "Growth Team",
      tagline: "Collaborative social intelligence for marketing teams and agencies.",
      priceMonthly: 79,
      priceYearly: 63, // $756/yr
      credits: 1200,
      features: [
        "1,200 AI Generation Credits / mo",
        "10 Brand Workspaces",
        "10 Connected Social Accounts",
        "10 Team Members with RBAC",
        "365 Days Analytics History",
        "20 Tracked Competitors",
        "Review & Approval State Machine",
        "Scoped Developer API Keys",
      ],
      isPopular: false,
    },
    {
      id: "agency",
      name: "Agency & Enterprise",
      tagline: "Maximum scale, dedicated tenant boundaries, and multi-client operations.",
      priceMonthly: 199,
      priceYearly: 159, // $1,908/yr
      credits: 5000,
      features: [
        "5,000 AI Generation Credits / mo",
        "50 Brand Workspaces",
        "50 Connected Social Accounts",
        "50 Team Members with Full RBAC",
        "Unlimited Analytics History",
        "100 Tracked Competitors",
        "Multi-Platform Publishing Abstraction",
        "Executive Audit Reports & Provenance",
        "Dedicated Support & SLA",
      ],
      isPopular: false,
    },
  ];

  return (
    <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/80 dark:bg-[#0D1424]/90 backdrop-blur-md p-6 sm:p-8 shadow-lg dark:shadow-2xl space-y-8">
      {/* Header & Billing Cycle Switcher */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold font-mono">
          <Sparkles className="w-3.5 h-3.5" />
          <span>TRANSPARENT USAGE-ALIGNED PLANS</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Simple Pricing for Creators &amp; Growth Teams
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          No hidden fees or artificial limitations. Choose the plan that matches your production frequency.
        </p>

        {/* Toggle Billing Cycle */}
        <div className="pt-2 flex items-center justify-center space-x-3">
          <span
            className={`text-xs font-semibold ${
              billingCycle === "monthly"
                ? "text-slate-900 dark:text-white"
                : "text-slate-400"
            }`}
          >
            Monthly
          </span>
          <button
            type="button"
            onClick={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
            className="relative w-12 h-6 rounded-full bg-slate-200 dark:bg-slate-700 p-0.5 transition-colors focus:outline-none"
          >
            <div
              className={`w-5 h-5 rounded-full bg-indigo-600 shadow-md transition-transform ${
                billingCycle === "yearly" ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
          <span
            className={`text-xs font-semibold flex items-center space-x-1.5 ${
              billingCycle === "yearly"
                ? "text-slate-900 dark:text-white"
                : "text-slate-400"
            }`}
          >
            <span>Annual</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
              Save 20%
            </span>
          </span>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((plan) => {
          const isCurrent = currentPlan.toLowerCase() === plan.id;
          const displayPrice = billingCycle === "yearly" ? plan.priceYearly : plan.priceMonthly;

          return (
            <div
              key={plan.id}
              className={`relative rounded-3xl p-6 flex flex-col justify-between transition-all ${
                plan.isPopular
                  ? "border-2 border-indigo-500 bg-white dark:bg-[#111827] shadow-xl dark:shadow-indigo-950/20"
                  : "border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40"
              }`}
            >
              {plan.isPopular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
                  Most Popular
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {plan.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                    {plan.tagline}
                  </p>
                </div>

                <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-baseline space-x-1">
                    <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">
                      ${displayPrice}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">/ month</span>
                  </div>
                  {billingCycle === "yearly" && plan.priceMonthly > 0 && (
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                      Billed annually (${displayPrice * 12}/yr)
                    </p>
                  )}
                </div>

                {/* Features List */}
                <div className="space-y-2.5">
                  <p className="text-[10px] uppercase font-mono tracking-widest text-slate-400 font-bold">
                    Included Capabilities
                  </p>
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start space-x-2 text-xs">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-slate-700 dark:text-slate-300 leading-snug">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
                {isCurrent ? (
                  <button
                    disabled
                    className="w-full py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-bold cursor-default"
                  >
                    Current Plan
                  </button>
                ) : plan.id === "free" ? (
                  <button
                    disabled
                    className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 text-xs font-semibold cursor-default"
                  >
                    Included Base
                  </button>
                ) : (
                  <button
                    onClick={() => onSelectPlan(plan.id as any, billingCycle)}
                    disabled={isLoading}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center space-x-1.5 ${
                      plan.isPopular
                        ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20 hover:scale-[1.02]"
                        : "bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900"
                    }`}
                  >
                    <span>Upgrade to {plan.name}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Trust & Compliance Banner */}
      <div className="p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center space-x-2 font-mono text-[11px]">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>PCI-DSS Compliant 256-Bit SSL • 14-Day Money Back Guarantee • Cancel Anytime</span>
        </div>
        <div className="text-[11px] font-mono">
          Powered by Stripe Official Hosted Checkout
        </div>
      </div>
    </div>
  );
}
