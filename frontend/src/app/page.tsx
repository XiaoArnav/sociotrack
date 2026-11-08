"use client";

import React, { useState, useEffect } from "react";
import { AuthPage, UserSession } from "@/components/auth/AuthPage";
import {
  InsTrackCreatorCard,
  SubNavTab,
  CreatorProfile,
  DEFAULT_CREATOR,
} from "@/components/InsTrackCreatorCard";
import {
  InsTrackBenchmarkCards,
  InsTrackGradeCards,
} from "@/components/InsTrackBenchmarkCards";
import { InsTrackGrowthCharts } from "@/components/InsTrackGrowthCharts";
import { InsTrackHistoricalTable } from "@/components/InsTrackHistoricalTable";
import { InsTrackCompetitorTable } from "@/components/InsTrackCompetitorTable";
import { InsTrackSurveyModal } from "@/components/InsTrackSurveyModal";
import { InsTrackAddAccountModal } from "@/components/InsTrackAddAccountModal";
import { InsTrackSaaSDashboard } from "@/components/InsTrackSaaSDashboard";
import { GenerationStudio } from "@/components/GenerationStudio";
import { AgentMemoryPanel } from "@/components/AgentMemoryPanel";
import { LiveEngagementLab } from "@/components/LiveEngagementLab";
import { InsTrackAuditReport } from "@/components/InsTrackAuditReport";
import { InsTrackEngagementView } from "@/components/InsTrackEngagementView";
import { InsTrackPredictionCard } from "@/components/InsTrackPredictionCard";
import {
  PostDraft,
  LearnedInsight,
  INITIAL_DRAFTS,
  INITIAL_INSIGHTS,
} from "@/mocks/mockData";
import {
  Sun,
  Moon,
  Search,
  CheckCircle2,
  Check,
  X,
  ChevronDown,
  ArrowRight,
  HelpCircle,
  TrendingUp,
  Sparkles,
  RefreshCw,
  Flame,
  Zap,
  BrainCircuit,
  Compass,
  ShieldCheck,
  Layers,
  Database,
  ArrowUpRight,
} from "lucide-react";

// Preset accounts for instantaneous realistic audits
const CREATOR_PRESETS: Record<string, CreatorProfile> = {
  "arnav.patel07": {
    handle: "arnav.patel07",
    name: "Arnav Patel | AI Systems Architect",
    avatar: "https://unavatar.io/github/XiaoArnav",
    bioLines: [
      "Building Autonomous AI Agent Systems & Persistent Vector Memory 🚀",
      "DevRelay Fellow • Open Source Contributor • Tech Innovator",
      "📍 Bangalore • High-throughput multi-agent architectures & live analytics",
    ],
    linkUrl: "https://github.com/XiaoArnav",
    trackedSince: "Tracked since Jan, 12 2023. Updated Just now via Meta Graph API.",
    followers: 34820,
    followersDelta: "+2,140 (6.55%)",
    following: 418,
    followingDelta: "+12 (2.95%)",
    posts: 84,
    postsDelta: "+4 (5.0%)",
    score: 88.4,
  },
  arnavpatel07: {
    handle: "arnav.patel07",
    name: "Arnav Patel | AI Systems Architect",
    avatar: "https://unavatar.io/github/XiaoArnav",
    bioLines: [
      "Building Autonomous AI Agent Systems & Persistent Vector Memory 🚀",
      "DevRelay Fellow • Open Source Contributor • Tech Innovator",
      "📍 Bangalore • High-throughput multi-agent architectures & live analytics",
    ],
    linkUrl: "https://github.com/XiaoArnav",
    trackedSince: "Tracked since Jan, 12 2023. Updated Just now via Meta Graph API.",
    followers: 34820,
    followersDelta: "+2,140 (6.55%)",
    following: 418,
    followingDelta: "+12 (2.95%)",
    posts: 84,
    postsDelta: "+4 (5.0%)",
    score: 88.4,
  },
  techno_gamerz: {
    handle: "techno_gamerz",
    name: "Ujjwal Chaurasia | Techno Gamerz",
    avatar: "https://unavatar.io/youtube/UCX8pnu3DYUnx8qy8V_c6oHg",
    bioLines: [
      "Ujjwal Chaurasia • Gamer & Content Creator 🎮",
      "YouTube: Techno Gamerz (40M+ Subscribers) • Ujjwal",
      "Creator of GameOn & Hitman • Delhi, India 🇮🇳",
    ],
    linkUrl: "https://youtube.com/technogamerzofficial",
    trackedSince: "Tracked since Aug, 18 2019. Updated 2 minutes ago via Graph API.",
    followers: 13420000,
    followersDelta: "+184,000 (1.39%)",
    following: 246,
    followingDelta: "+4 (1.65%)",
    posts: 492,
    postsDelta: "+12 (2.50%)",
    score: 94.6,
  },
  mnijungkook: {
    handle: "mnijungkook",
    name: "Jung Kook (정국) | BTS",
    avatar: "https://upload.wikimedia.org/wikipedia/commons/5/5b/Jungkook_for_BTS_5th_anniversary_party_in_LA_photoshoot_by_Dispatch%2C_May_2018_13.jpg",
    bioLines: [
      "Jung Kook of BTS • Solo Album 'GOLDEN' 🌟",
      "BIGHIT MUSIC / HYBE • Seven • 3D • Standing Next to You",
      "Connecting with global ARMY 💜",
    ],
    linkUrl: "https://bts-official.jp",
    trackedSince: "Tracked since Dec, 06 2021. Updated 10 minutes ago.",
    followers: 54200000,
    followersDelta: "+410,000 (0.76%)",
    following: 7,
    followingDelta: "+0 (0.0%)",
    posts: 85,
    postsDelta: "+2 (2.41%)",
    score: 98.2,
  },
  lalalalisa_m: {
    handle: "lalalalisa_m",
    name: "LISA (라리사) | LLOUD",
    avatar: "https://upload.wikimedia.org/wikipedia/commons/9/93/BLACKPINK%27s_Lisa_for_BULGARI_June_2023_01.jpg",
    bioLines: [
      "Lalisa Manobal • Founder @wearelloud ⚡️",
      "BLACKPINK • Rockstar • Moonlit Floor • RCA Records",
      "Louis Vuitton & BVLGARI Global House Ambassador",
    ],
    linkUrl: "https://wearelloud.com",
    trackedSince: "Tracked since Jun, 15 2018. Updated 5 minutes ago.",
    followers: 104800000,
    followersDelta: "+620,000 (0.59%)",
    following: 1,
    followingDelta: "+0 (0.0%)",
    posts: 1120,
    postsDelta: "+6 (0.54%)",
    score: 99.1,
  },
  sooyaaa__: {
    handle: "sooyaaa__",
    name: "JISOO (지수) | BLISSOO",
    avatar: "https://upload.wikimedia.org/wikipedia/commons/0/08/Jisoo_20220329_2.jpg",
    bioLines: [
      "JISOO • CEO @blissoo_official 🌸",
      "BLACKPINK • ME (FLOWER) • Actress & Artist",
      "Dior & Cartier Global Brand Ambassador",
    ],
    linkUrl: "https://blissoo.co.kr",
    trackedSince: "Tracked since Jun, 15 2018. Updated 12 minutes ago.",
    followers: 79400000,
    followersDelta: "+390,000 (0.49%)",
    following: 4,
    followingDelta: "+0 (0.0%)",
    posts: 1080,
    postsDelta: "+8 (0.75%)",
    score: 97.5,
  },
  thv: {
    handle: "thv",
    name: "V (뷔) | Kim Taehyung",
    avatar: "https://upload.wikimedia.org/wikipedia/commons/a/ac/V_%28Kim_Tae-hyung%29_at_a_fanmeet_in_May_2016_01_%28cropped%29.jpg",
    bioLines: [
      "V of BTS • Solo Album 'Layover' 🎷",
      "CELINE Boy & Cartier Global Brand Ambassador",
      "Visual Artist, Singer & Songwriter • Seoul 🇰🇷",
    ],
    linkUrl: "https://ibighit.com/bts",
    trackedSince: "Tracked since Dec, 06 2021. Updated 8 minutes ago.",
    followers: 67100000,
    followersDelta: "+480,000 (0.72%)",
    following: 7,
    followingDelta: "+0 (0.0%)",
    posts: 112,
    postsDelta: "+3 (2.75%)",
    score: 98.4,
  },
  "j.m": {
    handle: "j.m",
    name: "Jimin (지민) | Park Jimin",
    avatar: "https://upload.wikimedia.org/wikipedia/commons/7/70/180125_%EB%B0%A9%ED%83%84%EC%86%8C%EB%85%84%EB%8B%A8_%EC%A7%80%EB%AF%BC.jpg",
    bioLines: [
      "Jimin of BTS • Albums 'FACE' & 'MUSE' 🌙",
      "Dior Global Ambassador • Tiffany & Co. Ambassador",
      "Dancer, Singer & Performer",
    ],
    linkUrl: "https://ibighit.com/bts",
    trackedSince: "Tracked since Dec, 06 2021. Updated 15 minutes ago.",
    followers: 53800000,
    followersDelta: "+360,000 (0.67%)",
    following: 7,
    followingDelta: "+0 (0.0%)",
    posts: 89,
    postsDelta: "+1 (1.14%)",
    score: 97.8,
  },
  uarmyhope: {
    handle: "uarmyhope",
    name: "j-hope (제이홉) | Jung Hoseok",
    avatar: "https://upload.wikimedia.org/wikipedia/commons/5/57/J-Hope_at_W_Korea_Breast_Cancer_Campaign%2C_15_October_2025.png",
    bioLines: [
      "j-hope of BTS • 'HOPE ON THE STREET' 🐿️",
      "Jack In The Box • Louis Vuitton House Ambassador",
      "Dance, Music & Fashion • I'm your hope, you're my hope",
    ],
    linkUrl: "https://ibighit.com/bts",
    trackedSince: "Tracked since Dec, 06 2021. Updated 20 minutes ago.",
    followers: 50400000,
    followersDelta: "+310,000 (0.62%)",
    following: 7,
    followingDelta: "+0 (0.0%)",
    posts: 230,
    postsDelta: "+5 (2.22%)",
    score: 96.9,
  },
  chenzheyuanisssme: {
    handle: "chenzheyuanisssme",
    name: "Chen Zheyuan (陈哲远) | Actor",
    avatar: "https://upload.wikimedia.org/wikipedia/commons/e/ec/Chen_Zheyuan.jpg",
    bioLines: [
      "Chen Zheyuan (陈哲远) • Official Instagram 🎬",
      "Actor • Hidden Love (偷偷藏不住) • Our Secret",
      "Beijing, China • Represented by Gramarie Entertainment",
    ],
    linkUrl: "https://weibo.com/chenzheyuan",
    trackedSince: "Tracked since Sep, 14 2021. Updated 35 minutes ago.",
    followers: 3450000,
    followersDelta: "+68,000 (2.01%)",
    following: 92,
    followingDelta: "+0 (0.0%)",
    posts: 178,
    postsDelta: "+3 (1.71%)",
    score: 92.4,
  },
  "tomi.timetraveler": {
    handle: "tomi.timetraveler",
    name: "Tomi | Time Traveler CGI",
    avatar: "https://unavatar.io/x/tomi_timetraveler?fallback=https://api.dicebear.com/7.x/initials/svg?seed=tomi",
    bioLines: [
      "Tomi • Visual Storyteller & Cyberpunk CGI ⏳",
      "Exploring alternate timelines and futuristic worlds",
      "Tokyo • 3D Motion, Unreal Engine 5 & Generative Art",
    ],
    linkUrl: "https://tomitraveler.art",
    trackedSince: "Tracked since Feb, 02 2022. Updated 40 minutes ago.",
    followers: 1840000,
    followersDelta: "+45,000 (2.51%)",
    following: 312,
    followingDelta: "+8 (2.63%)",
    posts: 340,
    postsDelta: "+11 (3.34%)",
    score: 89.1,
  },
  itsjvke: {
    handle: "itsjvke",
    name: "JVKE | Singer & Producer",
    avatar: "https://upload.wikimedia.org/wikipedia/commons/9/9a/JVKE_performing_in_2023.png",
    bioLines: [
      "JVKE • 'golden hour' (3B+ streams worldwide) 🎹",
      "Singer, Songwriter & Producer • Making beats in my bedroom",
      "New music on the way • Listen on Spotify & Apple Music",
    ],
    linkUrl: "https://itsjvke.com",
    trackedSince: "Tracked since Jan, 10 2021. Updated 18 minutes ago.",
    followers: 6850000,
    followersDelta: "+92,000 (1.36%)",
    following: 418,
    followingDelta: "+6 (1.45%)",
    posts: 360,
    postsDelta: "+8 (2.27%)",
    score: 95.3,
  },
  moretomihika: {
    handle: "moretomihika",
    name: "Tomihika (トミヒカ) | Tokyo Lifestyle",
    avatar: "https://unavatar.io/x/tomihika?fallback=https://api.dicebear.com/7.x/initials/svg?seed=tomihika",
    bioLines: [
      "Tomihika • Fashion, Film & Modern Tokyo Living 🇯🇵",
      "Visual diary • Streetwear, coffee architecture & lifestyle",
      "Contact: tomihika.mgmt@gmail.com",
    ],
    linkUrl: "https://tomihika.jp",
    trackedSince: "Tracked since Mar, 19 2022. Updated 25 minutes ago.",
    followers: 1120000,
    followersDelta: "+24,000 (2.19%)",
    following: 480,
    followingDelta: "+15 (3.22%)",
    posts: 290,
    postsDelta: "+6 (2.11%)",
    score: 87.8,
  },
  rkive: {
    handle: "rkive",
    name: "RM (남준) | Kim Namjoon",
    avatar: "https://upload.wikimedia.org/wikipedia/commons/5/56/RM_at_W_Korea_Love_Your_W%2C_November_2023.jpg",
    bioLines: [
      "RM of BTS • 'Right Place, Wrong Person' • 'Indigo' 🏛️",
      "Bottega Veneta Ambassador • Modern Art & Architecture Archive",
      "Seoul, South Korea",
    ],
    linkUrl: "https://ibighit.com/bts",
    trackedSince: "Tracked since Dec, 06 2021. Updated 30 minutes ago.",
    followers: 47200000,
    followersDelta: "+280,000 (0.60%)",
    following: 7,
    followingDelta: "+0 (0.0%)",
    posts: 164,
    postsDelta: "+4 (2.50%)",
    score: 97.1,
  },
  mkbhd: {
    handle: "mkbhd",
    name: "Marques Brownlee",
    avatar: "https://unavatar.io/youtube/mkbhd",
    bioLines: [
      "Quality Tech Videos | YouTuber | Geek | Ultimate Frisbee",
      "Crisp tech reviews, automotive deep dives & high-fidelity gadgets",
      "MKBHD Studio • Waveform Podcast • 18M+ Subscribers",
    ],
    linkUrl: "https://youtube.com/mkbhd",
    trackedSince: "Tracked since Jan, 15 2017. Updated 5 minutes ago.",
    followers: 4820190,
    followersDelta: "+18,420 (0.38%)",
    following: 412,
    followingDelta: "+2 (0.49%)",
    posts: 1420,
    postsDelta: "+8 (0.57%)",
    score: 94.2,
  },
  mrbeast: {
    handle: "mrbeast",
    name: "Jimmy Donaldson",
    avatar: "https://unavatar.io/youtube/mrbeast",
    bioLines: [
      "I want to make the world a better place before I die",
      "Creator of Feastables & Beast Philanthropy",
      "New video every Saturday! • Over $20M+ donated to communities",
    ],
    linkUrl: "https://feastables.com",
    trackedSince: "Tracked since Sep, 10 2018. Updated 2 minutes ago.",
    followers: 62450800,
    followersDelta: "+312,000 (0.50%)",
    following: 355,
    followingDelta: "+0 (0.0%)",
    posts: 512,
    postsDelta: "+4 (0.78%)",
    score: 98.7,
  },
};

// Helper to extract clean handle from username or full Instagram URL
function cleanHandleFromInput(input: string): string {
  let clean = input.trim();
  try {
    if (clean.includes("instagram.com/")) {
      const match = clean.match(/instagram\.com\/([a-zA-Z0-9_\.]+)/);
      if (match && match[1]) {
        clean = match[1];
      }
    }
  } catch {}
  return clean.replace(/^@/, "").toLowerCase().trim();
}

// Deterministic generator for arbitrary handles entered by the user
function generateCreatorProfile(rawHandle: string): CreatorProfile {
  const clean = cleanHandleFromInput(rawHandle);
  if (CREATOR_PRESETS[clean]) {
    return CREATOR_PRESETS[clean];
  }

  const normalized = clean.replace(/[\._\-]/g, "");
  if (normalized.includes("arnav") || normalized.includes("patel")) {
    return CREATOR_PRESETS["arnav.patel07"];
  }
  if (CREATOR_PRESETS[normalized]) {
    return CREATOR_PRESETS[normalized];
  }

  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash << 5) - hash + clean.charCodeAt(i);
    hash |= 0;
  }
  const abs = Math.abs(hash);
  const followers = 15000 + (abs % 450000);
  const following = 120 + (abs % 950);
  const posts = 65 + (abs % 580);
  const score = 65 + ((abs % 300) / 10);
  const deltaF = 80 + (abs % 850);
  const pctF = ((deltaF / followers) * 100).toFixed(2);

  const displayTitle = clean
    .split(/[\._\-]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return {
    handle: clean,
    name: `${displayTitle || clean} | Content Creator`,
    avatar: `https://unavatar.io/x/${clean}?fallback=https://api.dicebear.com/7.x/initials/svg?seed=${clean}`,
    bioLines: [
      `Official Instagram account for @${clean}`,
      "Digital Strategy • Creative Storytelling • Community Growth",
      `Connecting with ${followers.toLocaleString()} engaged followers ✨`,
    ],
    linkUrl: `https://${clean}.bio.link`,
    trackedSince: `Tracked since Jan, 10 2022. Updated Just now.`,
    followers,
    followersDelta: `+${deltaF.toLocaleString()} (${pctF}%)`,
    following,
    followingDelta: `+${abs % 15} (1.2%)`,
    posts,
    postsDelta: `+${(abs % 8) + 1} (2.4%)`,
    score: Math.min(99.4, Math.max(58.0, Number(score.toFixed(1)))),
  };
}

export default function App() {
  // 1. Dark Mode State (Syncs directly with HTML class)
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  // 2. Authentication State
  const [currentUser, setCurrentUser] = useState<UserSession | null>({
    name: "Alex Chen",
    email: "alex.chen@enterprise.com",
    role: "Principal Content Architect",
  });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [viewMode, setViewMode] = useState<"public_report" | "saas_dashboard">("public_report");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("sociotrack_user_session");
      if (saved) {
        setCurrentUser(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  // 3. Active Creator Profile State
  const [activeCreator, setActiveCreator] = useState<CreatorProfile>(DEFAULT_CREATOR);
  const [isAuditingAccount, setIsAuditingAccount] = useState(false);
  const [telemetryStep, setTelemetryStep] = useState<string | null>(null);

  // 4. Navigation State: Sub-navigation active tab (Default: "growth")
  const [activeSubTab, setActiveSubTab] = useState<SubNavTab>("growth");

  // 5. Application Data State
  const [drafts, setDrafts] = useState<PostDraft[]>(INITIAL_DRAFTS);
  const [insights, setInsights] = useState<LearnedInsight[]>(INITIAL_INSIGHTS);
  const [searchQuery, setSearchQuery] = useState("");

  // Memory search query state in Memory Bank
  const [memorySearchQuery, setMemorySearchQuery] = useState("");

  // 6. Global Notification Toast
  const [toastMessage, setToastMessage] = useState<{
    title: string;
    description: string;
    type?: "success" | "info";
  } | null>(null);

  // 7. FAQ State
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const showToast = (
    title: string,
    description: string,
    type: "success" | "info" = "success"
  ) => {
    setToastMessage({ title, description, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // 8. Handler: Audit Any Account with Realistic Telemetry & Animated Transition
  const handleAuditAccount = (rawUsername: string) => {
    const handle = cleanHandleFromInput(rawUsername);
    if (!handle) return;

    setIsAuditingAccount(true);
    setTelemetryStep(`Connecting to Meta Graph API for @${handle}...`);

    showToast(
      "Auditing Account via Meta Graph API",
      `Connecting to @${handle} telemetry and indexing historical signals...`,
      "info"
    );

    setTimeout(() => {
      setTelemetryStep(`Observing @${handle}: Ingesting media nodes & Reel engagement...`);
    }, 350);

    setTimeout(() => {
      setTelemetryStep("Calculating algorithmic virality ratio & health benchmarks...");
    }, 700);

    setTimeout(() => {
      setTelemetryStep("Synthesizing AI content recommendations & winning hook formulas...");
    }, 1050);

    setTimeout(() => {
      const profile = generateCreatorProfile(handle);
      setActiveCreator(profile);
      setActiveSubTab("audit"); // Auto-switch to Audit view
      setIsAuditingAccount(false);
      setTelemetryStep(null);

      // Scroll smoothly to the creator card
      const el = document.getElementById("creator-card-section");
      el?.scrollIntoView({ behavior: "smooth" });

      showToast(
        "AI Diagnostic Audit Complete",
        `Synthesized real-time telemetry and winning predictions for @${profile.handle} (Score: ${profile.score}%).`,
        "success"
      );
    }, 1400);
  };

  // 9. Handler: Date Range Adjustment
  const handleDateRangeChange = (range: string) => {
    setActiveCreator((prev) => {
      let deltaStr = prev.followersDelta;
      if (range === "Last 7 Days") {
        deltaStr = `+${Math.round(prev.followers * 0.007).toLocaleString()} (0.7%)`;
      } else if (range === "Last 30 Days") {
        deltaStr = `+${Math.round(prev.followers * 0.025).toLocaleString()} (2.5%)`;
      } else if (range === "Last 90 Days") {
        deltaStr = `+${Math.round(prev.followers * 0.078).toLocaleString()} (7.8%)`;
      } else if (range === "All Time") {
        deltaStr = `+${Math.round(prev.followers * 0.52).toLocaleString()} (52.0%)`;
      }
      return { ...prev, followersDelta: deltaStr };
    });
    showToast("Date Filter Applied", `Audited statistics adjusted to ${range}.`, "info");
  };

  // 10. Handler: Toggle Star / Bookmark
  const handleToggleStar = (starred: boolean) => {
    showToast(
      starred ? "Account Bookmarked" : "Removed from Bookmarks",
      `@${activeCreator.handle} is ${starred ? "now" : "no longer"} pinned in your tracking workspace.`,
      "info"
    );
  };

  // 11. Approve Draft Handler
  const handleApproveDraft = (draft: PostDraft) => {
    setDrafts((prev) =>
      prev.map((d) =>
        d.id === draft.id
          ? {
              ...d,
              status: "Approved" as const,
              scheduledTime: "Tuesday at 2:30 PM (Peak Reply Window)",
            }
          : d
      )
    );

    showToast(
      "Draft Approved & Scheduled",
      `Post scheduled for ${draft.platform} on Tuesday at 2:30 PM (Peak Window).`,
      "success"
    );
  };

  // 12. Pattern Discovery from Live Simulator
  const handlePatternDiscovered = (newInsight: LearnedInsight) => {
    setInsights((prev) => [newInsight, ...prev]);
    showToast(
      "New Audience Pattern Discovered",
      "Vector memory reinforced and saved to pgvector / ChromaDB.",
      "success"
    );
  };

  // The 6 Exact FAQs from InsTrack (Screenshot 9)
  const FAQS = [
    {
      q: "Do I have to sign in to use this service?",
      a: "No, you don't have to sign in to search and explore public Instagram analytics. Creating a free account lets you bookmark accounts, save historical ledgers, and activate persistent AI memory.",
    },
    {
      q: "Do I have to sign in with Facebook?",
      a: "No, you do not need to sign in with Facebook or provide OAuth permissions to audit public accounts. SocioTrack utilizes the official Meta Graph API and autonomous agent simulation to safely index public performance.",
    },
    {
      q: "Do I have to pay to use this service?",
      a: "No, SocioTrack is free to use with full access to real-time analytics, historical CSV exports, and AI post generation.",
    },
    {
      q: "Do you offer a free trial?",
      a: "Yes! All users get an unlimited free tier with continuous metric tracking, PDF exports, and AI generation studio access.",
    },
    {
      q: "Why can't I find my account?",
      a: "Ensure the username is spelled accurately and the account is set to public. Private Instagram accounts cannot be analyzed in accordance with Meta Graph API privacy policies.",
    },
    {
      q: "Why can't I see all historical data for an account?",
      a: "Historical ledger data starts recording from the moment an account is first indexed in our system. For newly tracked creators, the past 30 to 90 days are automatically backfilled within minutes.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 max-w-sm bg-white dark:bg-[#161F30] border-2 border-emerald-500 rounded-2xl p-4 shadow-2xl flex items-start space-x-3 animate-slide-up">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="flex-1 space-y-0.5">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              {toastMessage.title}
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              {toastMessage.description}
            </p>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0B0F19]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-[#243048] px-4 sm:px-8 py-3.5 flex items-center justify-between transition-colors">
        {/* Left: SocioTrack Logo & App Name */}
        <button
          onClick={() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="flex items-center space-x-2.5 hover:opacity-90 transition-opacity"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#6366F1] to-[#06B6D4] flex items-center justify-center shadow-sm">
            <TrendingUp className="w-3.5 h-3.5 text-white stroke-[2.5]" />
          </div>
          <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
            SocioTrack
          </span>
        </button>

        {/* Right: SaaS App / Log In, Create a Free Account, and Dark Mode Toggle on extreme right */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {currentUser ? (
            <button
              onClick={() => setViewMode(viewMode === "public_report" ? "saas_dashboard" : "public_report")}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#243048] text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#161F30] transition-colors"
            >
              {viewMode === "public_report" ? "SaaS App →" : "Public View"}
            </button>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#243048] text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#161F30] transition-colors"
            >
              Log in
            </button>
          )}

          <button
            onClick={() => setShowSurveyModal(true)}
            className="px-4 py-1.5 rounded-lg bg-[#6366F1] hover:bg-[#5558E6] text-white text-xs font-semibold shadow-sm transition-colors"
          >
            Create a Free Account
          </button>

          {/* Extreme Right: Moon / Sun Toggle Button */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-xl border border-slate-200 dark:border-[#243048] hover:bg-slate-100 dark:hover:bg-[#161F30] text-slate-600 dark:text-slate-300 transition-colors ml-1"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-[#6366F1]" />
            )}
          </button>
        </div>
      </header>

      {viewMode === "saas_dashboard" ? (
        <InsTrackSaaSDashboard
          isDarkMode={isDarkMode}
          onToggleTheme={() => setIsDarkMode(!isDarkMode)}
          onViewPublicProfile={() => setViewMode("public_report")}
          onOpenSurvey={() => setShowSurveyModal(true)}
        />
      ) : (
        <>
          {/* HERO SECTION */}
          <section className="relative pt-12 pb-6 px-4 sm:px-8 max-w-5xl mx-auto text-center space-y-4">
            {/* Background Ambient Shapes */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-40 bg-indigo-500/10 dark:bg-indigo-500/5 blur-3xl pointer-events-none" />

            {/* Headline with Purple-to-Cyan Gradient Text (with pb-2.5 to prevent descender clipping on letters like y, p, g) */}
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight bg-gradient-to-r from-[#6366F1] via-[#8B5CF6] to-[#06B6D4] bg-clip-text text-transparent pb-2.5 pt-1 leading-[1.18] sm:leading-[1.18]">
              Powerful In-Depth Analytics for Instagram
            </h1>

            {/* Subhead text */}
            <p className="max-w-2xl mx-auto text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
              SocioTrack offers powerful in-depth analytics and actionable insights for brands, creators and agencies.
              Powered by the official Meta Graph API and autonomous agent intelligence.
            </p>

            {/* Search Bar with working submit, audit button and keyboard Enter listener */}
            <div className="max-w-xl mx-auto pt-2">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAuditAccount(searchQuery);
                }}
                className="relative"
              >
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search or paste Instagram URL (e.g. arnav.patel07, techno_gamerz, lalalalisa_m)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-12 pl-11 pr-28 rounded-full border border-slate-200 dark:border-[#243048] bg-white dark:bg-[#161F30] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6366F1] shadow-sm transition-colors"
                />
                <button
                  type="submit"
                  disabled={isAuditingAccount}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-2 rounded-full bg-[#6366F1] hover:bg-[#5558E6] text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center space-x-1 shadow-sm"
                >
                  {isAuditingAccount ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Auditing...</span>
                    </>
                  ) : (
                    <span>Audit</span>
                  )}
                </button>
              </form>

              {/* Live Telemetry Ingestion Progress Card */}
              {isAuditingAccount && telemetryStep && (
                <div className="mt-4 p-4 rounded-2xl bg-indigo-50/90 dark:bg-indigo-950/40 border-2 border-indigo-500/50 dark:border-indigo-500/40 shadow-xl backdrop-blur-md animate-fade-in text-left space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-spin" />
                      <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 uppercase tracking-wider">
                        AI Social Telemetry Engine
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-200/80 dark:bg-indigo-900/80 text-indigo-800 dark:text-indigo-200">
                      Live Ingestion
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center space-x-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-500 shrink-0" />
                    <span>{telemetryStep}</span>
                  </div>
                  <div className="w-full bg-indigo-200/60 dark:bg-indigo-900/60 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 h-1.5 rounded-full animate-pulse w-full" />
                  </div>
                </div>
              )}

              {/* Quick Account Suggestions: Click to immediately audit */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-3 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-slate-400">Quick Audit:</span>
                {["arnav.patel07", "techno_gamerz", "lalalalisa_m", "thv", "itsjvke", "chenzheyuanisssme", "rkive", "mkbhd"].map((handle) => (
                  <button
                    key={handle}
                    onClick={() => {
                      setSearchQuery(handle);
                      handleAuditAccount(handle);
                    }}
                    className={`px-2.5 py-1 rounded-full font-mono transition-all border ${
                      activeCreator.handle === handle
                        ? "bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border-indigo-400 dark:border-indigo-600 font-bold"
                        : "bg-slate-100 hover:bg-indigo-50 dark:bg-[#161F30] dark:hover:bg-[#1E2638] text-slate-700 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 border-slate-200/60 dark:border-[#243048]"
                    }`}
                  >
                    @{handle}
                  </button>
                ))}
              </div>

              {/* 3 Checkmarks below search bar */}
              <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-600 dark:text-slate-400 pt-3 font-medium">
                <span className="flex items-center space-x-1.5">
                  <Check className="w-3.5 h-3.5 text-[#6366F1] stroke-[3]" />
                  <span>Free to Try</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <Check className="w-3.5 h-3.5 text-[#6366F1] stroke-[3]" />
                  <span>Powerful Insights</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <Check className="w-3.5 h-3.5 text-[#6366F1] stroke-[3]" />
                  <span>Unlimited Historical Data</span>
                </span>
              </div>
            </div>
          </section>

          {/* MAIN CONTENT DASHBOARD */}
          <main className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-16 pb-32">
            {/* 1. CREATOR PROFILE CARD & RAINBOW SCORE */}
            <div id="creator-card-section" className="space-y-6 scroll-mt-20">
              <InsTrackCreatorCard
                activeTab={activeSubTab}
                onTabChange={setActiveSubTab}
                onExportClick={() => setActiveSubTab("historical")}
                creator={activeCreator}
                score={activeCreator.score}
                onDateRangeChange={handleDateRangeChange}
                onToggleStar={handleToggleStar}
              />

              {/* 2. CREATOR TAB CONTENT */}

              {/* OVERVIEW SUBTAB */}
              {activeSubTab === "overview" && (
                <div className="space-y-6 animate-fade-in">
                  <InsTrackBenchmarkCards creator={activeCreator} />
                  <InsTrackGrowthCharts
                    followers={activeCreator.followers}
                    following={activeCreator.following}
                  />

                  {/* Executive Intelligence Snapshot */}
                  <div className="bg-white dark:bg-[#161F30] rounded-2xl border border-slate-200 dark:border-[#243048] p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#243048]">
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                          <Compass className="w-4 h-4" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          Executive Intelligence Summary: @{activeCreator.handle}
                        </h3>
                      </div>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full">
                        Score {activeCreator.score}% • Verified
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1E2638] space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-slate-400">
                          Top Format Resonance
                        </span>
                        <div className="text-base font-extrabold text-slate-900 dark:text-white">
                          Educational Carousels (3.82% ER)
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          Saves outpace likes by 3.8x. Content acts as reference bookmarks for creator audiences.
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1E2638] space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-slate-400">
                          Peak Availability Window
                        </span>
                        <div className="text-base font-extrabold text-slate-900 dark:text-white">
                          Tuesday 08:30 – 10:00 AM UTC
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          Releasing technical breakdowns during this window yields +42% comment velocity.
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1E2638] space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-slate-400">
                          Recommended Action
                        </span>
                        <div className="text-base font-extrabold text-indigo-600 dark:text-indigo-400">
                          Convert 3 Static Posts to Carousels
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          Predicted to unlock +1,400 net monthly followers by raising session dwell duration.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* AUDIT SUBTAB */}
              {activeSubTab === "audit" && (
                <div className="space-y-6 animate-fade-in">
                  <InsTrackAuditReport
                    creator={activeCreator}
                    onRunAudit={() =>
                      showToast(
                        "Audit Completed",
                        `Fresh diagnostic metrics calculated for @${activeCreator.handle}.`,
                        "success"
                      )
                    }
                  />
                  <InsTrackPredictionCard
                    initialHandle={activeCreator.handle}
                    onSendToStudio={(hook, format) => {
                      setActiveSubTab("aistudio");
                      showToast(
                        "Hook Sent to AI Studio",
                        `Loaded winning hook: "${hook.slice(0, 45)}..." into draft generator.`
                      );
                    }}
                  />
                  <InsTrackGradeCards />
                </div>
              )}

              {/* GROWTH SUBTAB (Default) */}
              {activeSubTab === "growth" && (
                <div className="space-y-6 animate-fade-in">
                  <InsTrackBenchmarkCards creator={activeCreator} />
                  <InsTrackGrowthCharts
                    followers={activeCreator.followers}
                    following={activeCreator.following}
                  />
                </div>
              )}

              {/* ENGAGEMENT SUBTAB */}
              {activeSubTab === "engagement" && (
                <div className="space-y-6 animate-fade-in">
                  <InsTrackEngagementView creator={activeCreator} />
                </div>
              )}

              {/* HISTORICAL SUBTAB */}
              {activeSubTab === "historical" && (
                <div className="space-y-6 animate-fade-in">
                  <InsTrackHistoricalTable creator={activeCreator} />
                </div>
              )}

              {/* AI GENERATION STUDIO */}
              {activeSubTab === "aistudio" && (
                <div className="space-y-8 animate-fade-in">
                  <div className="bg-white dark:bg-[#161F30] rounded-2xl border border-slate-200 dark:border-[#243048] p-6 shadow-sm">
                    <GenerationStudio
                      drafts={drafts}
                      onDraftsChange={setDrafts}
                      onApproveDraft={handleApproveDraft}
                      onSendToSimulator={() => {
                        showToast(
                          "Post Sent to Simulator",
                          "Click Live Engagement Lab at bottom left to test real-time feedback.",
                          "info"
                        );
                      }}
                    />
                  </div>
                </div>
              )}

              {/* LEARNED MEMORY BANK */}
              {activeSubTab === "memorybank" && (
                <div className="space-y-8 animate-fade-in">
                  <div className="bg-white dark:bg-[#161F30] rounded-2xl border border-slate-200 dark:border-[#243048] p-6 sm:p-8 shadow-sm space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-[#243048]">
                      <div>
                        <div className="flex items-center space-x-2">
                          <BrainCircuit className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                            Persistent AI Agent Memory Bank
                          </h2>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Vector retention powered by Hindsight agent memory &amp; pgvector embeddings.
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            showToast(
                              "Vector Memory Recalibrated",
                              "Reinforced 15 indexed audience clusters and hook rules.",
                              "success"
                            );
                          }}
                          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-colors border border-indigo-200 dark:border-indigo-800"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Recalibrate Memory</span>
                        </button>
                      </div>
                    </div>

                    {/* Semantic Vector Search Simulator */}
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1E2638] border border-slate-200 dark:border-[#243048] space-y-3">
                      <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                        <Search className="w-4 h-4 text-indigo-500" />
                        <span>Semantic Vector Recall Test</span>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Search memory clusters (e.g. 'carousel slide structure', 'audio drop-off', 'best posting time')"
                          value={memorySearchQuery}
                          onChange={(e) => setMemorySearchQuery(e.target.value)}
                          className="flex-1 h-9 px-3 rounded-lg border border-slate-200 dark:border-[#243048] bg-white dark:bg-[#161F30] text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                        />
                        <button
                          onClick={() => {
                            showToast(
                              "Vector Search Executed",
                              `Cosine similarity score 0.942 matched top hook rules for '${memorySearchQuery || "audience retention"}'.`,
                              "info"
                            );
                          }}
                          className="px-4 py-2 rounded-lg bg-[#6366F1] text-white text-xs font-bold hover:bg-[#5558E6] transition-colors shrink-0"
                        >
                          Query Vector
                        </button>
                      </div>

                      {/* Quick query pills */}
                      <div className="flex flex-wrap gap-1.5 pt-1 text-[10px]">
                        <span className="text-slate-400 font-semibold">Try:</span>
                        {[
                          "Carousel Slide 1 Retention",
                          "Tuesday Morning Publishing",
                          "Open-Ended Questions in Comments",
                          "Single Photo Throttling",
                        ].map((q) => (
                          <button
                            key={q}
                            onClick={() => {
                              setMemorySearchQuery(q);
                              showToast(
                                "Vector Recall Retrieved",
                                `Retrieved high-confidence pattern for '${q}' with 0.96 cosine similarity.`,
                                "success"
                              );
                            }}
                            className="px-2 py-0.5 rounded bg-white dark:bg-[#161F30] border border-slate-200 dark:border-[#243048] text-slate-600 dark:text-slate-300 hover:text-indigo-600 font-mono"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Agent Memory Insight Cards */}
                    <AgentMemoryPanel
                      insights={insights}
                      onRecalibrateMemory={() => {
                        showToast(
                          "Vector Memory Recalibrated",
                          "Reinforced 15 indexed audience clusters and hook rules.",
                          "success"
                        );
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 3. SHOWCASE SECTION 1: BENCHMARK PERFORMANCE */}
            <section id="benchmark-section" className="space-y-6 pt-4">
              <InsTrackGradeCards />
            </section>

            {/* 4. SHOWCASE SECTION 2: INSTANT PERFORMANCE INSIGHTS / COMPETITOR TRACKING */}
            <section className="space-y-6 pt-4">
              <div className="text-center max-w-2xl mx-auto space-y-1">
                <h2 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-indigo-500 via-sky-400 to-cyan-400 bg-clip-text text-transparent pb-1.5 pt-0.5 leading-tight">
                  Instant Performance Insights
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Gain instant in-depth insights on any Instagram account:{" "}
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Competitors, clients or your own accounts
                  </span>
                  . Click any account below to inspect their full telemetry and audit scores.
                </p>
              </div>

              {/* Competitor Table connected to handleAuditAccount */}
              <InsTrackCompetitorTable
                onAddAccountClick={() => setShowAddAccountModal(true)}
                onSelectAccount={(handle) => handleAuditAccount(handle)}
              />
            </section>

            {/* 5. SHOWCASE SECTION 3: REPORTING AND DATA EXPORTS */}
            <section className="space-y-6 pt-4">
              <div className="text-center max-w-2xl mx-auto space-y-1">
                <h2 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-indigo-500 via-sky-400 to-cyan-400 bg-clip-text text-transparent pb-1.5 pt-0.5 leading-tight">
                  Reporting and Data Exports
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Streamline your reporting process and{" "}
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    save a lot of time
                  </span>{" "}
                  with our automated and{" "}
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    white-labeled PDF reports
                  </span>
                  . Live CSV exports for @{activeCreator.handle} are downloadable below.
                </p>
              </div>
              <InsTrackHistoricalTable creator={activeCreator} />
            </section>

            {/* 6. SHOWCASE SECTION 4: FREQUENTLY ASKED QUESTIONS */}
            <section className="bg-white dark:bg-[#161F30] rounded-2xl border border-slate-200/80 dark:border-[#243048] p-8 shadow-sm space-y-4 max-w-4xl mx-auto">
              <div className="border-b border-slate-100 dark:border-[#243048] pb-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Frequently Asked Question (FAQ)
                </h3>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-[#243048]">
                {FAQS.map((faq, idx) => {
                  const isOpen = openFaqIdx === idx;
                  return (
                    <div key={idx} className="py-3.5">
                      <button
                        onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                        className="w-full flex items-center justify-between text-left text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      >
                        <span>{faq.q}</span>
                        <ChevronDown
                          className={`w-4 h-4 text-slate-400 transition-transform ${
                            isOpen ? "transform rotate-180" : ""
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <p className="mt-2.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed pl-3 border-l-2 border-[#6366F1] animate-fade-in">
                          {faq.a}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 7. SHOWCASE SECTION 5: GRADIENT CALL TO ACTION BANNER */}
            <section className="rounded-2xl p-10 sm:p-14 bg-gradient-to-r from-[#7C3AED] via-[#6366F1] to-[#06B6D4] text-white shadow-xl text-center space-y-5 max-w-4xl mx-auto">
              <h3 className="text-2xl sm:text-4xl font-black tracking-tight">
                Start your adventure now! 🚀
              </h3>
              <div>
                <button
                  onClick={() => setShowSurveyModal(true)}
                  className="px-8 py-3.5 rounded-xl bg-white/20 hover:bg-white/30 border border-white/40 text-white font-bold text-sm shadow-lg transition-all inline-flex items-center space-x-2 hover:scale-105"
                >
                  <span>Create a Free Account</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </section>
          </main>

          {/* FOOTER */}
          <footer className="border-t border-slate-200 dark:border-[#243048] bg-white dark:bg-[#0B0F19] py-8 text-xs text-slate-500 dark:text-slate-400 transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
              <div>
                <div className="font-extrabold text-slate-900 dark:text-white text-sm">
                  SocioTrack
                </div>
                <p className="text-[11px] mt-0.5">
                  Autonomous Social Media Agent with Persistent Vector Memory & Real-Time Analytics.
                </p>
              </div>
              <div className="flex items-center space-x-6 text-[11px] font-medium">
                <button
                  onClick={() => {
                    setActiveSubTab("overview");
                    document.getElementById("creator-card-section")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="hover:text-indigo-500"
                >
                  Overview
                </button>
                <button
                  onClick={() => {
                    setActiveSubTab("audit");
                    document.getElementById("creator-card-section")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="hover:text-indigo-500"
                >
                  Audit
                </button>
                <button
                  onClick={() => {
                    setActiveSubTab("growth");
                    document.getElementById("creator-card-section")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="hover:text-indigo-500"
                >
                  Growth
                </button>
                <button
                  onClick={() => {
                    setActiveSubTab("engagement");
                    document.getElementById("creator-card-section")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="hover:text-indigo-500"
                >
                  Engagement
                </button>
                <button
                  onClick={() => {
                    setActiveSubTab("historical");
                    document.getElementById("creator-card-section")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="hover:text-indigo-500"
                >
                  History
                </button>
                <button
                  onClick={() => {
                    setActiveSubTab("aistudio");
                    document.getElementById("creator-card-section")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="hover:text-indigo-500"
                >
                  AI Studio
                </button>
              </div>
              <div className="text-[11px] font-mono">
                © 2026 SocioTrack. All rights reserved.
              </div>
            </div>
          </footer>
        </>
      )}

      {/* FLOATING LIVE ENGAGEMENT LAB & META WEBHOOK SIMULATOR */}
      <LiveEngagementLab onPatternDiscovered={handlePatternDiscovered} />

      {/* FLOATING HELP BUTTON */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setShowHelpModal(true)}
          className="flex items-center space-x-1.5 px-4 py-2.5 rounded-full bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-bold shadow-xl transition-all hover:scale-105"
        >
          <HelpCircle className="w-4 h-4" />
          <span>Help</span>
        </button>
      </div>

      {/* HELP MODAL DIALOG */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#161F30] rounded-2xl border border-slate-200 dark:border-[#243048] p-6 max-w-md w-full shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#243048]">
              <div className="flex items-center space-x-2">
                <HelpCircle className="w-5 h-5 text-[#0284C7]" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  SocioTrack Help Center
                </h4>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Need assistance auditing an account or verifying Meta webhook delivery?
              Our autonomous agent automatically ingests real-time engagement events, adjusts
              hook structures, and generates audit reports.
            </p>
            <div className="space-y-2 pt-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1E2638] text-slate-700 dark:text-slate-300">
                <strong>API Docs:</strong> Available locally at <code className="text-indigo-500 font-mono">http://localhost:8000/docs</code>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1E2638] text-slate-700 dark:text-slate-300">
                <strong>Meta Webhook:</strong> Verified at <code className="text-indigo-500 font-mono">/api/webhooks/instagram</code>
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-2 rounded-xl bg-[#6366F1] text-white text-xs font-bold"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AUTH SPLIT-SCREEN MODAL */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 overflow-y-auto">
          <div className="relative w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl bg-[#0B0F19]">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 z-50 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <AuthPage
              onLoginSuccess={(u) => {
                setCurrentUser(u);
                setShowAuthModal(false);
                setViewMode("saas_dashboard");
                showToast("Signed In Successfully", `Welcome to your SocioTrack Dashboard, ${u.name}!`);
              }}
            />
          </div>
        </div>
      )}

      {/* ONBOARDING SURVEY MODAL */}
      <InsTrackSurveyModal
        isOpen={showSurveyModal}
        onClose={() => setShowSurveyModal(false)}
        onComplete={(data) => {
          setViewMode("saas_dashboard");
          showToast(
            "Welcome to SocioTrack!",
            `Workspace configured for ${data.persona} focusing on ${data.goals.join(", ")}.`,
            "success"
          );
        }}
      />

      {/* ADD ACCOUNT MODAL */}
      <InsTrackAddAccountModal
        isOpen={showAddAccountModal}
        onClose={() => setShowAddAccountModal(false)}
        onAddAccount={(username) => {
          handleAuditAccount(username);
          showToast(
            "Account Added to Tracking List",
            `@${username} is now being audited daily with AI vector memory.`,
            "success"
          );
        }}
        onOpenProfile={(handle) => {
          setViewMode("public_report");
          setActiveSubTab("overview");
          handleAuditAccount(handle);
        }}
      />
    </div>
  );
}
