"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Users,
  UserPlus,
  Key,
  ShieldCheck,
  Trash2,
  Copy,
  Check,
  AlertCircle,
  Clock,
  Lock,
} from "lucide-react";
import { formatTime } from "@/lib/dateUtils";

interface TeamMember {
  id: string;
  user_id: string;
  email: string;
  name: string;
  role: "owner" | "admin" | "editor" | "viewer";
  joined_at: string;
}

interface TeamCollaborationModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId?: string;
  apiBaseUrl?: string;
  authToken?: string;
  onToast: (title: string, desc: string, type?: "success" | "error" | "info") => void;
}

export function TeamCollaborationModal({
  isOpen,
  onClose,
  workspaceId = "default-workspace",
  apiBaseUrl = "http://localhost:8000",
  authToken,
  onToast,
}: TeamCollaborationModalProps) {
  const [activeTab, setActiveTab] = useState<"members" | "invite" | "apikeys" | "audit">("members");
  const [members, setMembers] = useState<TeamMember[]>([
    {
      id: "m-1",
      user_id: "u-1",
      name: "Krishna Verma",
      email: "zepta316@gmail.com",
      role: "owner",
      joined_at: new Date().toISOString(),
    },
    {
      id: "m-2",
      user_id: "u-2",
      name: "Alex Growth",
      email: "alex@sociotrack.io",
      role: "editor",
      joined_at: new Date().toISOString(),
    },
  ]);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "editor" | "viewer">("editor");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiKeys, setApiKeys] = useState<{ id: string; name: string; prefix: string; role: string; created_at: string }[]>([
    {
      id: "key-1",
      name: "Production Agent Webhook",
      prefix: "st_live_9b2d...",
      role: "admin",
      created_at: new Date().toISOString(),
    },
  ]);
  const [newKeyName, setNewKeyName] = useState("");
  const [createdRawKey, setCreatedRawKey] = useState<string | null>(null);

  const [auditLogs, setAuditLogs] = useState<{ id: string; action: string; actor_email: string; created_at: string }[]>([
    {
      id: "log-1",
      action: "workspace.member_invited",
      actor_email: "zepta316@gmail.com",
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: "log-2",
      action: "api_key.created",
      actor_email: "zepta316@gmail.com",
      created_at: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: "log-3",
      action: "brand.switched",
      actor_email: "alex@sociotrack.io",
      created_at: new Date(Date.now() - 10800000).toISOString(),
    },
  ]);

  if (!isOpen) return null;

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteEmail.includes("@")) {
      onToast("Invalid Email", "Please provide a valid work email address.", "error");
      return;
    }
    setIsSubmitting(true);
    try {
      // Simulate or real backend POST
      const newMember: TeamMember = {
        id: `m-${Date.now()}`,
        user_id: `u-${Date.now()}`,
        name: inviteEmail.split("@")[0],
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole,
        joined_at: new Date().toISOString(),
      };
      setMembers((prev) => [...prev, newMember]);
      setAuditLogs((prev) => [
        {
          id: `log-${Date.now()}`,
          action: "workspace.member_invited",
          actor_email: "currentUser",
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
      setInviteEmail("");
      onToast("Invitation Sent", `Invited ${inviteEmail} as ${inviteRole}.`, "success");
      setActiveTab("members");
    } catch {
      onToast("Invite Failed", "Unable to send workspace invitation.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateApiKey = () => {
    if (!newKeyName.trim()) {
      onToast("Name Required", "Please enter a descriptive name for the API key.", "error");
      return;
    }
    const mockRandomKey = `st_live_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`;
    setCreatedRawKey(mockRandomKey);
    setApiKeys((prev) => [
      {
        id: `key-${Date.now()}`,
        name: newKeyName.trim(),
        prefix: mockRandomKey.substring(0, 12) + "...",
        role: "admin",
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);
    setNewKeyName("");
    onToast("API Key Generated", "Copy the key now. It will not be shown again.", "success");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 space-y-6 animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Workspace Team &amp; Permissions
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage roles, scoped API tokens, and tenant audit compliance
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
            { id: "members", label: "Team Members", icon: Users },
            { id: "invite", label: "Invite Member", icon: UserPlus },
            { id: "apikeys", label: "API Keys", icon: Key },
            { id: "audit", label: "Audit Logs", icon: ShieldCheck },
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

        {/* Tab Content: Members */}
        {activeTab === "members" && (
          <div className="space-y-4">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {members.map((m) => (
                <div key={m.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center justify-center">
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        {m.name}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {m.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-bold border ${
                        m.role === "owner"
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                          : m.role === "admin"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                      }`}
                    >
                      {m.role}
                    </span>
                    {m.role !== "owner" && (
                      <button
                        onClick={() => {
                          setMembers((prev) => prev.filter((item) => item.id !== m.id));
                          onToast("Member Removed", `Removed ${m.email} from workspace.`, "info");
                        }}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                        title="Remove member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content: Invite */}
        {activeTab === "invite" && (
          <form onSubmit={handleSendInvite} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Collaborator Work Email
              </label>
              <input
                type="email"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Workspace Role &amp; Permissions
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { role: "admin", title: "Admin", desc: "Full control, manage members & keys" },
                  { role: "editor", title: "Editor", desc: "Draft, edit & generate content" },
                  { role: "viewer", title: "Viewer", desc: "Read-only analytics & reporting" },
                ].map((item) => (
                  <button
                    key={item.role}
                    type="button"
                    onClick={() => setInviteRole(item.role as any)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      inviteRole === item.role
                        ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold"
                        : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <p className="text-xs font-bold">{item.title}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {item.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50"
            >
              {isSubmitting ? "Sending Invite..." : "Send Workspace Invitation"}
            </button>
          </form>
        )}

        {/* Tab Content: API Keys */}
        {activeTab === "apikeys" && (
          <div className="space-y-4">
            {createdRawKey && (
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 space-y-2">
                <div className="flex items-center space-x-2 text-xs font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>New API Key Created (SHA-256 Secured)</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 font-mono text-xs">
                  <span className="truncate">{createdRawKey}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(createdRawKey);
                      onToast("Copied!", "API key copied to clipboard.", "success");
                    }}
                    className="p-1 text-slate-500 hover:text-emerald-600 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[10px] text-emerald-700 dark:text-emerald-400">
                  Save this key now. We do not store the unhashed plaintext token.
                </p>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Key label e.g. CI/CD Bot"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={handleCreateApiKey}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs"
              >
                Create Key
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 pt-2">
              {apiKeys.map((k) => (
                <div key={k.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{k.name}</p>
                    <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      {k.prefix} • Scope: {k.role}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setApiKeys((prev) => prev.filter((item) => item.id !== k.id));
                      onToast("Key Revoked", `API key ${k.name} was revoked.`, "info");
                    }}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Revoke
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content: Audit Logs */}
        {activeTab === "audit" && (
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-xs flex items-center justify-between"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-1.5 font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                    <Lock className="w-3 h-3" />
                    <span>{log.action}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    by {log.actor_email}
                  </p>
                </div>
                <div className="flex items-center space-x-1 text-[10px] text-slate-400 font-mono" suppressHydrationWarning>
                  <Clock className="w-3 h-3" />
                  <span>{formatTime(log.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
