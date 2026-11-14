"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  BrainCircuit,
  TrendingUp,
  Users,
  ShieldCheck,
  Lock,
  Mail,
  User,
} from "lucide-react";
import { SocioTrackLogo } from "@/components/SocioTrackLogo";
import { createClient as createSupabaseClient } from "@/utils/supabase/client";

export interface UserSession {
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  isDemo?: boolean;
  token?: string;
}

interface AuthPageProps {
  onLoginSuccess: (user: UserSession) => void;
  initialScreen?: AuthScreen;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type AuthScreen = "login" | "signup" | "forgot_password";

export function AuthPage({ onLoginSuccess, initialScreen = "login" }: AuthPageProps) {
  const [screen, setScreen] = useState<AuthScreen>(initialScreen);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form states - Empty initial values for authentic credential input
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Interaction feedback states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  // Keyboard navigation focus trap for accessibility
  const handleEscapeKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") setShowPassword(false);
  };

  // Submit Handler for Real Login via Supabase Auth
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Client-side Validation
    if (!email || !email.includes("@")) {
      setErrorMessage("Please enter a valid work email address.");
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);
    try {
      const supabase = createSupabaseClient();
      const { data: supaData, error: supaError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (supaError) {
        setErrorMessage(supaError.message || "Invalid email or password. Please try again.");
        return;
      }

      if (supaData?.user) {
        const session: UserSession = {
          name: supaData.user.user_metadata?.name || email.split("@")[0],
          email: supaData.user.email || email.trim().toLowerCase(),
          role: supaData.user.user_metadata?.role || "Growth & Content Lead",
          isDemo: false,
          token: supaData.session?.access_token,
        };
        localStorage.setItem("sociotrack_user_session", JSON.stringify(session));
        onLoginSuccess(session);
      }
    } catch (err: unknown) {
      let errorMsg = err instanceof Error ? err.message : "Authentication failed. Please try again.";
      if (errorMsg === "Load failed" || errorMsg === "Failed to fetch") {
        errorMsg = "Unable to connect to Supabase authentication server. Please check your network connection.";
      }
      setErrorMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Handler for Real Sign Up via Supabase Auth
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!name.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }
    if (!email || !email.includes("@")) {
      setErrorMessage("Please enter a valid work email address.");
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }
    if (!agreeTerms) {
      setErrorMessage("Please accept the terms and conditions.");
      return;
    }

    setIsLoading(true);
    try {
      const supabase = createSupabaseClient();
      const { data: supaData, error: supaError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            name: name.trim(),
            role: "Growth & Content Lead",
          },
        },
      });

      if (supaError) {
        setErrorMessage(supaError.message || "Registration failed. Please check inputs.");
        return;
      }

      if (supaData?.user) {
        // If the user already existed in Supabase, identities is empty
        if (supaData.user.identities && supaData.user.identities.length === 0) {
          setErrorMessage("An account with this email already exists. Please sign in instead.");
          return;
        }

        // Show explicit success message and prompt to log in now
        setErrorMessage(null);
        setSuccessMessage("Account created! Please log in now.");
        setScreen("login");
        setPassword("");
        setConfirmPassword("");
        return;
      }
    } catch (err: unknown) {
      let errorMsg = err instanceof Error ? err.message : "Registration failed. Please try again.";
      if (errorMsg === "Load failed" || errorMsg === "Failed to fetch") {
        errorMsg = "Unable to connect to Supabase authentication server. Please check your network connection.";
      }
      setErrorMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for Forgot Password via Supabase Auth
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !email.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);
    try {
      const supabase = createSupabaseClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
      if (error) {
        setErrorMessage(error.message || "Could not dispatch password reset link.");
      } else {
        setResetSent(true);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Could not send password reset request.";
      setErrorMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Keyboard handlers for accessibility
  useEffect(() => {
    document.addEventListener("keydown", handleEscapeKey);
    return () => document.removeEventListener("keydown", handleEscapeKey);
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#F6F7FB] flex flex-col lg:flex-row items-stretch selection:bg-[#ECE9FF] selection:text-[#5146D8]">
      {/* =========================================================================
          LEFT SECTION – BRAND PRESENTATION (~55% canvas)
          ========================================================================= */}
      <div
        className="lg:w-[55%] relative overflow-hidden bg-gradient-to-br from-[#172033] via-[#1E293B] to-[#2B1B54] text-white p-8 lg:p-14 flex flex-col justify-between"
        role="region"
        aria-label="Brand Presentation"
      >
        {/* Ambient AI Background Orbs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#5146D8]/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#3478F6]/25 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header: Logo & Status Pill */}
        <div className="relative z-10 flex items-center justify-between">
          <Link
            href="/"
            aria-label="SocioTrack home"
            className="hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#172033] rounded-xl p-1 -m-1"
          >
            <SocioTrackLogo size="lg" light={true} />
          </Link>
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs text-white">
            <span className="w-2 h-2 rounded-full bg-[#16A477] animate-pulse" />
            <span className="font-semibold tracking-wide">Autonomous Agent Platform</span>
          </div>
        </div>

        {/* Middle: Brand Pitch & Abstract AI Network Illustration */}
        <div className="relative z-10 my-10 space-y-8 max-w-xl">
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-lg bg-[#5146D8]/40 border border-[#5146D8]/50 text-indigo-200 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>Next-Gen Social Media Agent</span>
            </div>
            <h1 className="text-3xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Your Audience. <br />
              Your Intelligence. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ECE9FF] via-[#A5B4FC] to-[#60A5FA]">
                Your Growth.
              </span>
            </h1>
            <p className="text-sm lg:text-base text-slate-300 leading-relaxed font-normal">
              An intelligent social media engagement agent that understands your audience,
              predicts engagement before publishing, and continuously refines its strategy through
              closed-loop agent memory.
            </p>
          </div>

          {/* Abstract AI Network Illustration Box */}
          <div className="relative rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md p-6 overflow-hidden shadow-2xl">
            <div className="text-xs uppercase tracking-wider text-indigo-300 font-semibold mb-4 flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <BrainCircuit className="w-4 h-4 text-[#A5B4FC]" />
                <span>Interconnected Cognitive Architecture</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">100% Deterministic</span>
            </div>

            {/* Visual SVG Network of 4 Connected Nodes */}
            <div className="relative h-44 w-full">
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 170" fill="none">
                {/* Connecting glowing lines */}
                <path
                  d="M60 85 L150 40 L260 40 L340 85 L260 130 L150 130 Z"
                  stroke="rgba(81, 70, 216, 0.4)"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
                <line x1="150" y1="40" x2="260" y2="130" stroke="rgba(52, 120, 246, 0.3)" strokeWidth="1.5" />
                <line x1="260" y1="40" x2="150" y2="130" stroke="rgba(52, 120, 246, 0.3)" strokeWidth="1.5" />
              </svg>

              {/* Node 1: Content Generation */}
              <div className="absolute left-[5%] top-[50%] -translate-y-1/2 flex items-center space-x-2 bg-[#172033]/90 border border-[#5146D8] px-3 py-2 rounded-xl shadow-lg">
                <div className="w-6 h-6 rounded-lg bg-[#5146D8] flex items-center justify-center text-white">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <div className="text-[11px] font-bold text-white">Content Gen</div>
                  <div className="text-[9px] text-indigo-300">Multi-Format Variations</div>
                </div>
              </div>

              {/* Node 2: Audience Intelligence */}
              <div className="absolute left-[34%] top-[10%] flex items-center space-x-2 bg-[#172033]/90 border border-[#3478F6] px-3 py-2 rounded-xl shadow-lg">
                <div className="w-6 h-6 rounded-lg bg-[#3478F6] flex items-center justify-center text-white">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <div className="text-[11px] font-bold text-white">Audience Intel</div>
                  <div className="text-[9px] text-blue-300">Live Sentiment Vector</div>
                </div>
              </div>

              {/* Node 3: Agent Memory */}
              <div className="absolute right-[5%] top-[50%] -translate-y-1/2 flex items-center space-x-2 bg-[#172033]/90 border border-[#16A477] px-3 py-2 rounded-xl shadow-lg">
                <div className="w-6 h-6 rounded-lg bg-[#16A477] flex items-center justify-center text-white">
                  <BrainCircuit className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <div className="text-[11px] font-bold text-white">Agent Memory</div>
                  <div className="text-[9px] text-emerald-300">Reinforced Weight Store</div>
                </div>
              </div>

              {/* Node 4: Engagement Prediction */}
              <div className="absolute left-[34%] bottom-[10%] flex items-center space-x-2 bg-[#172033]/90 border border-[#8B5CF6] px-3 py-2 rounded-xl shadow-lg">
                <div className="w-6 h-6 rounded-lg bg-[#8B5CF6] flex items-center justify-center text-white">
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <div className="text-[11px] font-bold text-white">Prediction</div>
                  <div className="text-[9px] text-purple-300">Pre-Publish Scoring</div>
                </div>
              </div>
            </div>

            <div className="mt-2 text-center text-xs text-slate-300 font-medium">
              SocioTrack doesn't just generate content. It learns from audience behavior and becomes
              smarter with every interaction.
            </div>
          </div>
        </div>

        {/* Bottom Tagline & Brand Proof */}
        <div className="relative z-10 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <span className="font-semibold text-slate-200">
            &ldquo;Create Smarter. Engage Deeper. Grow Together.&rdquo;
          </span>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Enterprise Security &amp; Isolation Guaranteed</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          RIGHT SECTION – AUTHENTICATION CARD (~45% canvas)
          ========================================================================= */}
      <div className="lg:w-[45%] flex items-center justify-center p-6 lg:p-14">
        <div className="w-full max-w-md bg-white rounded-2xl border border-[#E6E9F0] shadow-card p-8 lg:p-10 space-y-6 animate-fade-in relative">
          {/* Error Banner */}
          {errorMessage && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3.5 flex items-start space-x-2 text-xs text-red-700 animate-slide-up">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {/* Success Banner */}
          {successMessage && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 flex items-start space-x-2 text-xs text-emerald-800 animate-slide-up">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-semibold">{successMessage}</div>
            </div>
          )}

          {/* =================================================================
              SCREEN 01: LOGIN
              ================================================================= */}
          {screen === "login" && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-2xl font-extrabold text-[#172033] tracking-tight">
                  Welcome back
                </h2>
                <p className="text-xs text-[#718096]">
                  Sign in with verified credentials to access your workspace.
                </p>
              </div>

              {/* Social Login Buttons - Informative SSO triggers */}
              <div className="space-y-2.5">
                {/* Continue with Microsoft */}
                <button
                  type="button"
                  onClick={() => setErrorMessage("Enterprise SSO (Microsoft) is currently being provisioned. Please enter your email and password below.")}
                  disabled={isLoading}
                  className="w-full h-11 px-4 rounded-xl border border-[#E6E9F0] bg-white hover:bg-slate-50 text-[#172033] text-xs font-semibold flex items-center justify-center space-x-3 transition-colors shadow-sm"
                >
                  {/* Microsoft SVG Quad Squares Logo */}
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 21 21">
                    <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                    <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                    <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                    <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
                  </svg>
                  <span>Continue with Microsoft SSO</span>
                </button>

                {/* Continue with Google */}
                <button
                  type="button"
                  onClick={() => setErrorMessage("Google Workspace SSO is currently being provisioned. Please enter your email and password below.")}
                  disabled={isLoading}
                  className="w-full h-11 px-4 rounded-xl border border-[#E6E9F0] bg-white hover:bg-slate-50 text-[#172033] text-xs font-semibold flex items-center justify-center space-x-3 transition-colors shadow-sm"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.4l3.7 2.9C6.5 7.4 9 5 12 5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.6 14.7c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.2C.7 9.6 0 12.3 0 15.2s.7 5.6 1.9 8l3.7-2.9z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.3L1.9 16.4C3.7 20.2 7.5 23.5 12 23.5z"
                    />
                  </svg>
                  <span>Continue with Google Workspace</span>
                </button>
              </div>

              {/* Divider */}
              <div className="relative flex items-center justify-center">
                <div className="border-t border-[#E6E9F0] w-full" />
                <span className="bg-white px-3 text-[11px] uppercase tracking-wider text-[#718096] relative">
                  or sign in with email
                </span>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {/* Email Field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#172033] block">
                    Work Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@enterprise.com"
                      className="w-full h-11 pl-10 pr-3 rounded-xl border border-[#E6E9F0] bg-white text-xs text-[#172033] placeholder-[#718096] focus:outline-none focus:ring-2 focus:ring-[#5146D8]/30 focus:border-[#5146D8] transition-all"
                    />
                    <Mail className="w-4 h-4 text-[#718096] absolute left-3.5 top-3.5" />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#172033]">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMessage(null);
                        setScreen("forgot_password");
                      }}
                      className="text-xs text-[#5146D8] hover:underline font-medium"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full h-11 pl-10 pr-10 rounded-xl border border-[#E6E9F0] bg-white text-xs text-[#172033] placeholder-[#718096] focus:outline-none focus:ring-2 focus:ring-[#5146D8]/30 focus:border-[#5146D8] transition-all"
                    />
                    <Lock className="w-4 h-4 text-[#718096] absolute left-3.5 top-3.5" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-[#718096] hover:text-[#172033]"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-[#5146D8] rounded border-[#E6E9F0] focus:ring-[#5146D8]"
                  />
                  <label htmlFor="remember" className="text-xs text-[#718096] select-none cursor-pointer">
                    Remember this device for 30 days
                  </label>
                </div>

                {/* Primary Action Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-[#5146D8] to-[#3478F6] hover:opacity-95 text-white text-xs font-bold tracking-wide uppercase shadow-md shadow-[#5146D8]/20 flex items-center justify-center space-x-2 transition-all"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Authenticating Workspace...</span>
                    </div>
                  ) : (
                    <>
                      <span>Sign In to SocioTrack</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Switch to Sign Up */}
              <div className="text-center text-xs text-[#718096] pt-2">
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setSuccessMessage(null);
                    setScreen("signup");
                  }}
                  className="text-[#5146D8] font-bold hover:underline"
                >
                  Create one now
                </button>
              </div>
            </div>
          )}

          {/* =================================================================
              SCREEN 02: SIGN UP
              ================================================================= */}
          {screen === "signup" && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-2xl font-extrabold text-[#172033] tracking-tight">
                  Create your SocioTrack account
                </h2>
                <p className="text-xs text-[#718096]">
                  Start building smarter audience connections.
                </p>
              </div>

              {/* Continue with Microsoft SSO */}
              <button
                type="button"
                onClick={() => setErrorMessage("Enterprise SSO (Microsoft) is currently being provisioned. Please enter your work email below to register.")}
                disabled={isLoading}
                className="w-full h-11 px-4 rounded-xl border border-[#E6E9F0] bg-white hover:bg-slate-50 text-[#172033] text-xs font-semibold flex items-center justify-center space-x-3 transition-colors shadow-sm"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 21 21">
                  <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                  <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                  <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                  <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
                </svg>
                <span>Continue with Microsoft SSO</span>
              </button>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-[#E6E9F0] w-full" />
                <span className="bg-white px-3 text-[11px] uppercase tracking-wider text-[#718096] relative">
                  or register with work email
                </span>
              </div>

              <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#172033]">
                    Full Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Alex Chen"
                      className="w-full h-10 pl-10 pr-3 rounded-xl border border-[#E6E9F0] bg-white text-xs text-[#172033] placeholder-[#718096] focus:outline-none focus:ring-2 focus:ring-[#5146D8]/30 focus:border-[#5146D8]"
                    />
                    <User className="w-4 h-4 text-[#718096] absolute left-3.5 top-3" />
                  </div>
                </div>

                {/* Work Email */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#172033]">
                    Work Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex.chen@enterprise.com"
                      className="w-full h-10 pl-10 pr-3 rounded-xl border border-[#E6E9F0] bg-white text-xs text-[#172033] placeholder-[#718096] focus:outline-none focus:ring-2 focus:ring-[#5146D8]/30 focus:border-[#5146D8]"
                    />
                    <Mail className="w-4 h-4 text-[#718096] absolute left-3.5 top-3" />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#172033]">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full h-10 pl-10 pr-10 rounded-xl border border-[#E6E9F0] bg-white text-xs text-[#172033] placeholder-[#718096] focus:outline-none focus:ring-2 focus:ring-[#5146D8]/30 focus:border-[#5146D8]"
                    />
                    <Lock className="w-4 h-4 text-[#718096] absolute left-3.5 top-3" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-[#718096] hover:text-[#172033]"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#172033]">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat your password"
                      className="w-full h-10 pl-10 pr-10 rounded-xl border border-[#E6E9F0] bg-white text-xs text-[#172033] placeholder-[#718096] focus:outline-none focus:ring-2 focus:ring-[#5146D8]/30 focus:border-[#5146D8]"
                    />
                    <Lock className="w-4 h-4 text-[#718096] absolute left-3.5 top-3" />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-3 text-[#718096] hover:text-[#172033]"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Terms and conditions checkbox */}
                <div className="flex items-start space-x-2 pt-1">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="w-4 h-4 mt-0.5 text-[#5146D8] rounded border-[#E6E9F0] focus:ring-[#5146D8]"
                  />
                  <label htmlFor="terms" className="text-[11px] text-[#718096] leading-tight select-none cursor-pointer">
                    I agree to the SocioTrack Terms of Service and Privacy Policy.
                  </label>
                </div>

                {/* Create Account Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-[#5146D8] to-[#3478F6] hover:opacity-95 text-white text-xs font-bold tracking-wide uppercase shadow-md shadow-[#5146D8]/20 flex items-center justify-center space-x-2 transition-all mt-2"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Creating Account...</span>
                    </div>
                  ) : (
                    <>
                      <span>Create SocioTrack Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Link to Sign In */}
              <div className="text-center text-xs text-[#718096]">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setSuccessMessage(null);
                    setScreen("login");
                  }}
                  className="text-[#5146D8] font-bold hover:underline"
                >
                  Sign in here
                </button>
              </div>
            </div>
          )}

          {/* =================================================================
              SCREEN 03: FORGOT PASSWORD
              ================================================================= */}
          {screen === "forgot_password" && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-2xl font-extrabold text-[#172033] tracking-tight">
                  Reset your password
                </h2>
                <p className="text-xs text-[#718096]">
                  Enter your email address to receive a password reset link.
                </p>
              </div>

              {resetSent ? (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 space-y-3 text-center animate-slide-up">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-[#16A477] flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-emerald-900">
                      Reset Link Dispatched
                    </h3>
                    <p className="text-xs text-emerald-700">
                      We have sent an authentication verification link to{" "}
                      <strong className="font-semibold">{email}</strong>.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setResetSent(false);
                      setScreen("login");
                    }}
                    className="w-full h-10 rounded-lg bg-[#16A477] text-white text-xs font-semibold hover:bg-[#138e67] transition-colors"
                  >
                    Return to Sign In
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#172033]">
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@enterprise.com"
                        className="w-full h-11 pl-10 pr-3 rounded-xl border border-[#E6E9F0] bg-white text-xs text-[#172033] placeholder-[#718096] focus:outline-none focus:ring-2 focus:ring-[#5146D8]/30 focus:border-[#5146D8]"
                      />
                      <Mail className="w-4 h-4 text-[#718096] absolute left-3.5 top-3.5" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-11 rounded-xl bg-gradient-to-r from-[#5146D8] to-[#3478F6] text-white text-xs font-bold tracking-wide uppercase shadow-md shadow-[#5146D8]/20 flex items-center justify-center space-x-2 transition-all"
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Sending Link...</span>
                      </div>
                    ) : (
                      <>
                        <span>Send Reset Link</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMessage(null);
                        setScreen("login");
                      }}
                      className="text-xs text-[#718096] hover:text-[#172033] font-medium"
                    >
                      ← Back to Sign In
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Footer Card Lock Proof */}
          <div className="pt-4 border-t border-[#E6E9F0] flex items-center justify-center space-x-2 text-[11px] text-[#718096]">
            <Lock className="w-3.5 h-3.5 text-[#16A477]" />
            <span>Secure access to your AI-powered workspace.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
