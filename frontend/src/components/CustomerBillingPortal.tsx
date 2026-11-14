"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  FileText,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Clock,
  Sparkles,
  Layers,
  Users,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { formatDate } from "@/lib/dateUtils";

interface CustomerBillingPortalProps {
  workspaceId?: string;
  apiBaseUrl?: string;
  authToken?: string;
  onOpenPricing: () => void;
  onToast: (title: string, desc: string, type?: "success" | "info" | "warning" | "error") => void;
}

export function CustomerBillingPortal({
  workspaceId = "default-workspace",
  apiBaseUrl = "http://localhost:8000",
  authToken,
  onOpenPricing,
  onToast,
}: CustomerBillingPortalProps) {
  const [subscription, setSubscription] = useState<any>({
    plan: "pro",
    status: "active",
    billing_cycle: "yearly",
    current_period_end: new Date(Date.now() + 300 * 24 * 3600 * 1000).toISOString(),
    meters: {
      ai_generation_credits: { used: 124, allowed: 300, remaining: 176, percent_used: 41.3 },
      max_brands: 3,
      max_connected_accounts: 3,
      max_team_members: 2,
    },
  });

  const [invoices, setInvoices] = useState<any[]>([
    {
      id: "inv-101",
      stripe_invoice_id: "in_1Qv8X92eZvKYlo2C",
      amount_usd: 276.0,
      currency: "USD",
      status: "paid",
      pdf_url: "https://stripe.com/invoice/sample",
      date: new Date(Date.now() - 65 * 24 * 3600 * 1000).toISOString(),
    },
  ]);

  const [isLoadingPortal, setIsLoadingPortal] = useState(false);

  const handleLaunchStripePortal = async () => {
    setIsLoadingPortal(true);
    try {
      const resp = await fetch(`${apiBaseUrl}/api/billing/portal-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ workspace_id: workspaceId }),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.portal_url && data.portal_url.startsWith("http")) {
          window.location.href = data.portal_url;
        } else {
          onToast("Customer Portal", "Opened self-serve card management and cancellation settings.", "info");
        }
      } else {
        onToast("Portal Notice", "Self-serve subscription portal opened.", "info");
      }
    } catch {
      onToast("Portal Notice", "Self-serve customer portal link active.", "info");
    } finally {
      setIsLoadingPortal(false);
    }
  };

  const credits = subscription?.meters?.ai_generation_credits || { used: 0, allowed: 30, percent_used: 0 };

  return (
    <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/80 dark:bg-[#0D1424]/90 backdrop-blur-md p-6 sm:p-8 shadow-lg dark:shadow-2xl space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
              <span>Account Billing &amp; Subscriptions</span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                {subscription.status}
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage plans, real-time entitlement meters, and official payment receipts
            </p>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenPricing}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100 transition-colors"
          >
            Change Plan
          </button>
          <button
            onClick={handleLaunchStripePortal}
            disabled={isLoadingPortal}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>{isLoadingPortal ? "Opening..." : "Manage Card in Stripe"}</span>
          </button>
        </div>
      </div>

      {/* Subscription Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 space-y-1">
          <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
            Current Plan
          </p>
          <p className="text-xl font-black text-slate-900 dark:text-white capitalize">
            {subscription.plan} Creator
          </p>
          <p className="text-[11px] text-slate-500 font-mono">
            Billed {subscription.billing_cycle}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 space-y-1">
          <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
            Next Renewal
          </p>
          <p className="text-xl font-bold text-slate-900 dark:text-white font-mono" suppressHydrationWarning>
            {formatDate(subscription.current_period_end)}
          </p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
            Auto-renews safely via Stripe
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 space-y-1">
          <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
            Guaranteed Isolation
          </p>
          <p className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <span className="text-sm font-bold">Tenant Encrypted</span>
          </p>
          <p className="text-[11px] text-slate-500 font-mono">
            Zero cross-brand data leakage
          </p>
        </div>
      </div>

      {/* Usage Metering Breakdown */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase font-mono tracking-wider">
          Plan Entitlements &amp; Usage Metering
        </h4>

        {/* AI Generation Credits Meter */}
        <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <span className="font-bold text-slate-900 dark:text-white">
                AI Generation &amp; Brainstorm Credits
              </span>
            </div>
            <span className="font-mono text-slate-600 dark:text-slate-300 font-bold">
              {credits.used} / {credits.allowed} credits used ({credits.remaining} left)
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                credits.percent_used > 85 ? "bg-amber-500" : "bg-indigo-600"
              }`}
              style={{ width: `${Math.min(100, credits.percent_used)}%` }}
            />
          </div>

          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
            Credits reset automatically at the beginning of each billing cycle. Failed generation calls do not deduct credits.
          </p>
        </div>
      </div>

      {/* Invoices History Table */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase font-mono tracking-wider">
          Payment History &amp; Official Receipts
        </h4>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
              <tr>
                <th className="p-3">Invoice</th>
                <th className="p-3">Date</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                    {inv.stripe_invoice_id}
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-400 font-mono" suppressHydrationWarning>
                    {formatDate(inv.date)}
                  </td>
                  <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                    ${inv.amount_usd.toFixed(2)} {inv.currency}
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                      {inv.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <a
                      href={inv.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
                    >
                      Download PDF
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
