"use client";

import React, { useState } from "react";
import {
  X,
  HelpCircle,
  Briefcase,
  Megaphone,
  Building2,
  Users,
  Search,
  BarChart2,
  Rocket,
  Smile,
  Check,
} from "lucide-react";

interface InsTrackSurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: { persona: string; goals: string[] }) => void;
}

export function InsTrackSurveyModal({
  isOpen,
  onClose,
  onComplete,
}: InsTrackSurveyModalProps) {
  const [step, setStep] = useState<1 | 4>(1);
  const [selectedPersona, setSelectedPersona] = useState<string>("Influencer / Creator");
  const [selectedGoals, setSelectedGoals] = useState<string[]>([
    "In-depth Analytics",
    "Get Growth Tips",
  ]);

  if (!isOpen) return null;

  const toggleGoal = (goal: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  };

  const handleFinish = () => {
    onComplete({
      persona: selectedPersona,
      goals: selectedGoals,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0B0F19]/95 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-4xl text-slate-100 flex flex-col justify-between min-h-[580px] py-4">
        {/* Top Header matching Screenshot (frame_0.png) */}
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium px-2">
          <span>Sign-up Survey</span>
          <span>Step {step} of 4</span>
        </div>

        {/* Content Body */}
        <div className="my-auto py-6 space-y-8 max-w-3xl mx-auto w-full">
          {/* Main Question & Subtitle */}
          <div className="text-left space-y-1">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Let&apos;s get to know you
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              To make your product experience more personal
            </p>
          </div>

          {/* STEP 1: What best describes you? */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-sm font-semibold text-slate-300">
                What best describes you?
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* Option 1: Brand / Business */}
                <div
                  onClick={() => setSelectedPersona("Brand / Business")}
                  className={`cursor-pointer rounded-2xl p-8 bg-[#161F30] border-2 flex flex-col items-center justify-center space-y-4 text-center transition-all ${
                    selectedPersona === "Brand / Business"
                      ? "border-[#6366F1] shadow-lg shadow-indigo-500/20 scale-102"
                      : "border-transparent hover:border-slate-700"
                  }`}
                >
                  <div className="w-16 h-16 rounded-full bg-[#1E2638] flex items-center justify-center text-indigo-400">
                    <Building2 className="w-8 h-8" />
                  </div>
                  <span className="text-sm font-bold text-slate-200">
                    Brand / Business
                  </span>
                </div>

                {/* Option 2: Influencer / Creator (Golden Megaphone) */}
                <div
                  onClick={() => setSelectedPersona("Influencer / Creator")}
                  className={`cursor-pointer rounded-2xl p-8 bg-[#161F30] border-2 flex flex-col items-center justify-center space-y-4 text-center transition-all ${
                    selectedPersona === "Influencer / Creator"
                      ? "border-[#6366F1] shadow-lg shadow-indigo-500/20 scale-102"
                      : "border-transparent hover:border-slate-700"
                  }`}
                >
                  <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400">
                    <Megaphone className="w-8 h-8" />
                  </div>
                  <span className="text-sm font-bold text-white">
                    Influencer / Creator
                  </span>
                </div>

                {/* Option 3: Marketing Agency (Briefcase) */}
                <div
                  onClick={() => setSelectedPersona("Marketing Agency")}
                  className={`cursor-pointer rounded-2xl p-8 bg-[#161F30] border-2 flex flex-col items-center justify-center space-y-4 text-center transition-all ${
                    selectedPersona === "Marketing Agency"
                      ? "border-[#6366F1] shadow-lg shadow-indigo-500/20 scale-102"
                      : "border-transparent hover:border-slate-700"
                  }`}
                >
                  <div className="w-16 h-16 rounded-full bg-[#1E2638] flex items-center justify-center text-amber-600">
                    <Briefcase className="w-8 h-8" />
                  </div>
                  <span className="text-sm font-bold text-slate-200">
                    Marketing Agency
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: What are your top goals? */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-sm font-semibold text-slate-300">
                What are your top goals for using InsTrack? (Pick 2 or more)
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { id: "Track My Accounts", label: "Track My Accounts", icon: Users, color: "text-sky-400" },
                  { id: "Track Client Accounts", label: "Track Client Accounts", icon: Briefcase, color: "text-amber-500" },
                  { id: "Monitor Competitors", label: "Monitor Competitors", icon: Search, color: "text-slate-300" },
                  { id: "In-depth Analytics", label: "In-depth Analytics", icon: BarChart2, color: "text-indigo-400" },
                  { id: "Get Growth Tips", label: "Get Growth Tips", icon: Rocket, color: "text-rose-400" },
                  { id: "Research", label: "Research", icon: Smile, color: "text-amber-400" },
                ].map((item) => {
                  const isSelected = selectedGoals.includes(item.id);
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleGoal(item.id)}
                      className={`cursor-pointer rounded-2xl p-6 bg-[#161F30] border-2 flex flex-col items-center justify-center space-y-3 text-center transition-all ${
                        isSelected
                          ? "border-[#6366F1] shadow-md shadow-indigo-500/20 scale-102"
                          : "border-transparent hover:border-slate-700"
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl bg-[#1E2638] flex items-center justify-center ${item.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-bold text-slate-200">
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions Bar matching Screenshot */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-800">
          <div>
            {step === 4 ? (
              <button
                onClick={() => setStep(1)}
                className="px-6 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition-colors"
              >
                Previous
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition-colors"
              >
                Skip
              </button>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {step === 1 ? (
              <button
                onClick={() => setStep(4)}
                className="px-8 py-2.5 rounded-xl bg-[#6366F1] hover:bg-[#5558E6] text-white text-xs font-bold shadow-lg transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="px-8 py-2.5 rounded-xl bg-[#6366F1] hover:bg-[#5558E6] text-white text-xs font-bold shadow-lg transition-colors"
              >
                Finish
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
