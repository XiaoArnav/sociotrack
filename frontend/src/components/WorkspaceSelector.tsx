"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Building2,
  ChevronDown,
  Check,
  Plus,
  Users,
  Shield,
  Layers,
  Sparkles,
} from "lucide-react";

interface BrandItem {
  id: string;
  name: string;
  workspace_id?: string;
}

interface WorkspaceSelectorProps {
  workspaceName?: string;
  activeBrandId: string;
  brands: BrandItem[];
  onSelectBrand: (brandId: string) => void;
  onOpenTeamModal: () => void;
  onNewBrand: () => void;
}

export function WorkspaceSelector({
  workspaceName = "Production Workspace",
  activeBrandId,
  brands,
  onSelectBrand,
  onOpenTeamModal,
  onNewBrand,
}: WorkspaceSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeBrand = brands.find((b) => b.id === activeBrandId) || brands[0] || {
    id: activeBrandId,
    name: "Apex Studio",
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 transition-all shadow-xs"
        aria-expanded={isOpen}
      >
        <div className="w-5 h-5 rounded-md bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
          <Building2 className="w-3.5 h-3.5" />
        </div>
        <div className="flex flex-col text-left">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
            {workspaceName}
          </span>
          <span className="font-bold text-slate-900 dark:text-white truncate max-w-[120px] sm:max-w-[160px]">
            {activeBrand.name}
          </span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-500 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-64 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 animate-scale-up">
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
            <p className="text-[10px] uppercase font-mono tracking-widest text-slate-400 dark:text-slate-400">
              Multi-Brand Tenancy
            </p>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
              {workspaceName}
            </p>
          </div>

          <div className="py-1 max-h-48 overflow-y-auto space-y-0.5">
            {brands.map((b) => {
              const isSelected = b.id === activeBrandId;
              return (
                <button
                  key={b.id}
                  onClick={() => {
                    onSelectBrand(b.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                    isSelected
                      ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 font-bold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <Layers className="w-3.5 h-3.5 shrink-0 opacity-70" />
                    <span className="truncate">{b.name}</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
            <button
              onClick={() => {
                setIsOpen(false);
                onNewBrand();
              }}
              className="w-full flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Create New Brand</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                onOpenTeamModal();
              }}
              className="w-full flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
            >
              <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Team &amp; RBAC Permissions</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
