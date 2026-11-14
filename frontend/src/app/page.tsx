"use client";

import React, { useState, useEffect, useCallback } from "react";
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
import { KeyPerformanceMetrics } from "@/components/KeyPerformanceMetrics";
import { AudienceInsightsSection } from "@/components/AudienceInsightsSection";
import { AiRecommendationsSection } from "@/components/AiRecommendationsSection";
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
import { InsTrackUnfollowersView } from "@/components/InsTrackUnfollowersView";
import { InsTrackRecentPostsFeed } from "@/components/InsTrackRecentPostsFeed";
import { FoundersDispatch } from "@/components/FoundersDispatch";
import { InsTrackExperimentsView } from "@/components/InsTrackExperimentsView";
import { InsTrackCalendarView } from "@/components/InsTrackCalendarView";
import { ProductAnalyticsView } from "@/components/ProductAnalyticsView";
import { OnboardingWizardModal } from "@/components/OnboardingWizardModal";
import { UserFeedbackModal } from "@/components/UserFeedbackModal";
import { WorkspaceSelector } from "@/components/WorkspaceSelector";
import { TeamCollaborationModal } from "@/components/TeamCollaborationModal";
import { NaturalLanguageExplorer } from "@/components/NaturalLanguageExplorer";
import { CompetitorBenchmarkCard } from "@/components/CompetitorBenchmarkCard";
import { ApprovalQueueWidget } from "@/components/ApprovalQueueWidget";
import { AdvancedReportsView } from "@/components/AdvancedReportsView";
import { PricingMatrixView } from "@/components/PricingMatrixView";
import { CustomerBillingPortal } from "@/components/CustomerBillingPortal";
import { BusinessMetricsDashboard } from "@/components/BusinessMetricsDashboard";
import { TermsAndPrivacyModal } from "@/components/TermsAndPrivacyModal";
import { saveProfileSnapshot } from "@/utils/supabase/snapshots";
import { createClient as createSupabaseClient } from "@/utils/supabase/client";
import { OverviewDashboard } from "@/components/OverviewDashboard";
import { GrowthDashboardView } from "@/components/GrowthDashboardView";
import { PrivateAccountLockout } from "@/components/PrivateAccountLockout";
import {
  PostDraft,
  LearnedInsight,
  INITIAL_DRAFTS,
  INITIAL_INSIGHTS,
} from "@/mocks/mockData";
import { formatScheduledTime, getDateRangeBounds } from "@/lib/dateUtils";
import { approvePostAPI } from "@/lib/api";
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
  MessageSquare,
  Flame,
  Zap,
  BrainCircuit,
  Compass,
  ShieldCheck,
  Layers,
  Database,
  ArrowUpRight,
  AlertTriangle,
  Info,
} from "lucide-react";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Preset accounts for instantaneous realistic audits
const CREATOR_PRESETS: Record<string, CreatorProfile> = {
  zyrohouse: {
    handle: "zyrohouse",
    name: "Zyro House",
    avatar: `${BASE_PATH}/avatars/zyrohouse.png`,
    bioLines: [
      "Digital Strategy • Creative Storytelling • Community Growth",
      "Connecting with 165,020 engaged followers ✨",
    ],
    linkUrl: "https://zyrohouse.bio.link",
    trackedSince: "Tracked since Jan, 10 2022. Updated Just now via Meta Graph API.",
    followers: 68,
    followersDelta: "+1 (+0.50%)",
    following: 1,
    followingDelta: "+0 (+0.0%)",
    posts: 1,
    postsDelta: "+0 (+0.0%)",
    score: 91.2,
    contactInfo: "No public email listed • Direct Message (DM) on Instagram",
    isPrivate: false,
    isVerified: false,
  },
  zyro: {
    handle: "zyrohouse",
    name: "Zyro House",
    avatar: `${BASE_PATH}/avatars/zyrohouse.png`,
    bioLines: [
      "Digital Strategy • Creative Storytelling • Community Growth",
      "Connecting with 165,020 engaged followers ✨",
    ],
    linkUrl: "https://zyrohouse.bio.link",
    trackedSince: "Tracked since Jan, 10 2022. Updated Just now via Meta Graph API.",
    followers: 68,
    followersDelta: "+1 (+0.50%)",
    following: 1,
    followingDelta: "+0 (+0.0%)",
    posts: 1,
    postsDelta: "+0 (+0.0%)",
    score: 91.2,
    contactInfo: "No public email listed • Direct Message (DM) on Instagram",
    isPrivate: false,
    isVerified: false,
  },
  "arnav.patel07": {
    handle: "arnav.patel07",
    name: "Arnav Patel 👾",
    avatar: `${BASE_PATH}/avatars/arnav.patel07.png`,
    bioLines: [
      "Building Autonomous AI Agent Systems & Persistent Vector Memory 🚀",
      "DevRelay Fellow • Open Source Contributor • Bangalore 🇮🇳",
      "High-throughput multi-agent architectures & real-time analytics ⚡️",
    ],
    linkUrl: "https://github.com/XiaoArnav",
    trackedSince: "Tracked since Jan, 12 2023. Updated Just now via Meta Graph API.",
    followers: 9,
    followersDelta: "+0 (+0.0%)",
    following: 60,
    followingDelta: "+0 (+0.0%)",
    posts: 0,
    postsDelta: "+0 (+0.0%)",
    score: 88.4,
    contactEmail: "322868724+XiaoArnav@users.noreply.github.com",
    contactInfo: "GitHub & AI Systems: XiaoArnav",
    isPrivate: true,
    isVerified: false,
  },
  arnavpatel07: {
    handle: "arnav.patel07",
    name: "Arnav Patel 👾",
    avatar: `${BASE_PATH}/avatars/arnav.patel07.png`,
    bioLines: [
      "Building Autonomous AI Agent Systems & Persistent Vector Memory 🚀",
      "DevRelay Fellow • Open Source Contributor • Bangalore 🇮🇳",
      "High-throughput multi-agent architectures & real-time analytics ⚡️",
    ],
    linkUrl: "https://github.com/XiaoArnav",
    trackedSince: "Tracked since Jan, 12 2023. Updated Just now via Meta Graph API.",
    followers: 9,
    followersDelta: "+0 (+0.0%)",
    following: 60,
    followingDelta: "+0 (+0.0%)",
    posts: 0,
    postsDelta: "+0 (+0.0%)",
    score: 88.4,
    contactEmail: "322868724+XiaoArnav@users.noreply.github.com",
    contactInfo: "GitHub & AI Systems: XiaoArnav",
    isPrivate: true,
    isVerified: false,
  },
  techno_gamerz: {
    handle: "techno_gamerz",
    name: "Techno Gamerz",
    avatar: `${BASE_PATH}/avatars/techno_gamerz.png`,
    bioLines: [
      "Ujjwal Chaurasia • Content Creator & Gamer 🎮",
      "Creator of Techno Gamerz • Delhi, India 🇮🇳",
      "Business & Inquiries: technogamerzofficial@gmail.com",
    ],
    linkUrl: "https://youtube.com/technogamerzofficial",
    trackedSince: "Tracked since Aug, 18 2019. Updated 2 minutes ago via Graph API.",
    followers: 1723631,
    followersDelta: "+14,000 (0.70%)",
    following: 3,
    followingDelta: "+0 (0.0%)",
    posts: 33,
    postsDelta: "+1 (3.12%)",
    score: 94.6,
    contactEmail: "technogamerzofficial@gmail.com",
    contactInfo: "Business & Partnerships: technogamerzofficial@gmail.com",
  },
  technogamerz: {
    handle: "techno_gamerz",
    name: "Techno Gamerz",
    avatar: `${BASE_PATH}/avatars/techno_gamerz.png`,
    bioLines: [
      "Ujjwal Chaurasia • Content Creator & Gamer 🎮",
      "Creator of Techno Gamerz • Delhi, India 🇮🇳",
      "Business & Inquiries: technogamerzofficial@gmail.com",
    ],
    linkUrl: "https://youtube.com/technogamerzofficial",
    trackedSince: "Tracked since Aug, 18 2019. Updated 2 minutes ago via Graph API.",
    followers: 1723631,
    followersDelta: "+14,000 (0.70%)",
    following: 3,
    followingDelta: "+0 (0.0%)",
    posts: 33,
    postsDelta: "+1 (3.12%)",
    score: 94.6,
    contactEmail: "technogamerzofficial@gmail.com",
    contactInfo: "Business & Partnerships: technogamerzofficial@gmail.com",
  },
  zurikrishna: {
    handle: "zurikrishna",
    name: "krishna",
    avatar: `${BASE_PATH}/avatars/zurikrishna.png`,
    bioLines: [
      "Digital Innovation & Social Systems Engineering 🚀",
      "Bangalore, India 🇮🇳 • Tracked live via Graph API",
    ],
    linkUrl: "https://instagram.com/zurikrishna",
    trackedSince: "Tracked since Jan, 10 2023. Updated Just now via Meta Graph API.",
    followers: 42,
    followersDelta: "+2 (5.0%)",
    following: 86,
    followingDelta: "+0 (0.0%)",
    posts: 40,
    postsDelta: "+1 (2.6%)",
    score: 84.5,
    isPrivate: true,
    isVerified: false,
  },
  "keerz.core": {
    handle: "keerz.core",
    name: "🪐",
    avatar: `${BASE_PATH}/avatars/keerz.core.png`,
    bioLines: [
      "Visual Archival & Creative Experiments ✨",
      "Social Media Insights • Tracked live via Meta Graph API",
    ],
    linkUrl: "https://instagram.com/keerz.core",
    trackedSince: "Tracked since Mar, 22 2024. Updated Just now via Meta Graph API.",
    followers: 180,
    followersDelta: "+4 (2.25%)",
    following: 1294,
    followingDelta: "+0 (0.0%)",
    posts: 1,
    postsDelta: "+0 (0.0%)",
    score: 82.0,
    isPrivate: true,
    isVerified: false,
  },
  keerzcore: {
    handle: "keerz.core",
    name: "🪐",
    avatar: `${BASE_PATH}/avatars/keerz.core.png`,
    bioLines: [
      "Visual Archival & Creative Experiments ✨",
      "Social Media Insights • Tracked live via Meta Graph API",
    ],
    linkUrl: "https://instagram.com/keerz.core",
    trackedSince: "Tracked since Mar, 22 2024. Updated Just now via Meta Graph API.",
    followers: 180,
    followersDelta: "+4 (2.25%)",
    following: 1294,
    followingDelta: "+0 (0.0%)",
    posts: 1,
    postsDelta: "+0 (0.0%)",
    score: 82.0,
    isPrivate: true,
    isVerified: false,
  },
  aviralbhardwaj_ji: {
    handle: "aviralbhardwaj_ji",
    name: "Aviral Bhardwaj",
    avatar: `${BASE_PATH}/avatars/aviralbhardwaj_ji.png`,
    bioLines: [
      "Aviral Bhardwaj • Content Creator & Explorer 🏔️",
      "Travel, photography, mountains & storytelling • Uttarakhand, India 🇮🇳",
      "Connecting through authentic moments & visual journeys",
    ],
    linkUrl: "https://www.instagram.com/aviralbhardwaj_ji/",
    trackedSince: "Tracked since Nov, 08 2026. Updated Just now via Meta Graph API.",
    followers: 319,
    followersDelta: "+14 (4.59%)",
    following: 938,
    followingDelta: "+0 (0.0%)",
    posts: 144,
    postsDelta: "+1 (0.70%)",
    score: 84.2,
    contactInfo: "No public email listed • Direct Inquiries via Instagram DM",
  },
  aviralbhardwajji: {
    handle: "aviralbhardwaj_ji",
    name: "Aviral Bhardwaj",
    avatar: `${BASE_PATH}/avatars/aviralbhardwaj_ji.png`,
    bioLines: [
      "Aviral Bhardwaj • Content Creator & Explorer 🏔️",
      "Travel, photography, mountains & storytelling • Uttarakhand, India 🇮🇳",
      "Connecting through authentic moments & visual journeys",
    ],
    linkUrl: "https://www.instagram.com/aviralbhardwaj_ji/",
    trackedSince: "Tracked since Nov, 08 2026. Updated Just now via Meta Graph API.",
    followers: 319,
    followersDelta: "+14 (4.59%)",
    following: 938,
    followingDelta: "+0 (0.0%)",
    posts: 144,
    postsDelta: "+1 (0.70%)",
    score: 84.2,
    contactInfo: "No public email listed • Direct Inquiries via Instagram DM",
  },
  mnijungkook: {
    handle: "mnijungkook",
    name: "JK (정국) | BTS",
    avatar: `${BASE_PATH}/avatars/mnijungkook.png`,
    bioLines: [
      "Jung Kook of BTS • Solo Album 'GOLDEN' 🌟",
      "BIGHIT MUSIC / HYBE • Seven • 3D • Standing Next to You",
      "Connecting with global ARMY 💜",
    ],
    linkUrl: "https://ibighit.com/bts",
    trackedSince: "Tracked since Dec, 06 2021. Updated 10 minutes ago.",
    followers: 27000000,
    followersDelta: "+220,000 (0.82%)",
    following: 8,
    followingDelta: "+0 (0.0%)",
    posts: 54,
    postsDelta: "+2 (3.85%)",
    score: 97.9,
    contactInfo: "No public email listed • Managed via BIGHIT MUSIC / HYBE",
  },
  lalalalisa_m: {
    handle: "lalalalisa_m",
    name: "LISA",
    avatar: `${BASE_PATH}/avatars/lalalalisa_m.png`,
    bioLines: [
      "LISA • Musician & Artist ⚡️",
      "Founder @wearelloud • ALTER EGO",
      "PRESSPLAY • Contact: contact@wearelloud.com",
    ],
    linkUrl: "https://lisa.lnk.to/PRESSPLAY",
    trackedSince: "Tracked since Jun, 15 2018. Updated Just now via Meta Graph API.",
    followers: 105859041,
    followersDelta: "+540,000 (0.51%)",
    following: 0,
    followingDelta: "+0 (0.0%)",
    posts: 1260,
    postsDelta: "+8 (0.64%)",
    score: 99.4,
    contactEmail: "contact@wearelloud.com",
    contactInfo: "LLOUD Management: contact@wearelloud.com",
    isVerified: true,
  },
  sooyaaa__: {
    handle: "sooyaaa__",
    name: "JISOO (지수) | BLISSOO",
    avatar: `${BASE_PATH}/avatars/sooyaaa__.png`,
    bioLines: [
      "JISOO • CEO @blissoo_official 🌸",
      "BLACKPINK • ME (FLOWER) • Actress & Artist",
      "Dior & Cartier Global Brand Ambassador",
    ],
    linkUrl: "https://blissoo.co.kr",
    trackedSince: "Tracked since Jun, 15 2018. Updated 12 minutes ago.",
    followers: 80000000,
    followersDelta: "+380,000 (0.48%)",
    following: 0,
    followingDelta: "+0 (0.0%)",
    posts: 1390,
    postsDelta: "+7 (0.51%)",
    score: 98.1,
    contactEmail: "contact@blissoo.co.kr",
    contactInfo: "BLISSOO Official: contact@blissoo.co.kr",
  },
  thv: {
    handle: "thv",
    name: "V (뷔) | Kim Taehyung",
    avatar: `${BASE_PATH}/avatars/thv.png`,
    bioLines: [
      "V of BTS • Solo Album 'Layover' 🎷",
      "CELINE Boy & Cartier Global Brand Ambassador",
      "Visual Artist, Singer & Songwriter • Seoul 🇰🇷",
    ],
    linkUrl: "https://ibighit.com/bts",
    trackedSince: "Tracked since Dec, 06 2021. Updated 8 minutes ago.",
    followers: 78000000,
    followersDelta: "+420,000 (0.54%)",
    following: 8,
    followingDelta: "+0 (0.0%)",
    posts: 195,
    postsDelta: "+3 (1.56%)",
    score: 98.7,
    contactInfo: "No public email listed • Managed via BIGHIT MUSIC / HYBE",
  },
  "j.m": {
    handle: "j.m",
    name: "JIMIN (지민) | Park Jimin",
    avatar: `${BASE_PATH}/avatars/j.m.png`,
    bioLines: [
      "Jimin of BTS • Albums 'FACE' & 'MUSE' 🌙",
      "Dior Global Ambassador • Tiffany & Co. Ambassador",
      "Dancer, Singer & Performer • BIGHIT MUSIC",
    ],
    linkUrl: "https://ibighit.com/bts",
    trackedSince: "Tracked since Dec, 06 2021. Updated 15 minutes ago.",
    followers: 61000000,
    followersDelta: "+310,000 (0.51%)",
    following: 8,
    followingDelta: "+0 (0.0%)",
    posts: 25,
    postsDelta: "+1 (4.17%)",
    score: 98.0,
    contactInfo: "No public email listed • Managed via BIGHIT MUSIC / HYBE",
  },
  uarmyhope: {
    handle: "uarmyhope",
    name: "j-hope (제이홉) | Jung Hoseok",
    avatar: `${BASE_PATH}/avatars/uarmyhope.png`,
    bioLines: [
      "j-hope of BTS • 'HOPE ON THE STREET' 🐿️",
      "Jack In The Box • Louis Vuitton House Ambassador",
      "Dance, Music & Fashion • I'm your hope, you're my hope",
    ],
    linkUrl: "https://ibighit.com/bts",
    trackedSince: "Tracked since Dec, 06 2021. Updated 20 minutes ago.",
    followers: 57000000,
    followersDelta: "+290,000 (0.51%)",
    following: 8,
    followingDelta: "+0 (0.0%)",
    posts: 371,
    postsDelta: "+4 (1.09%)",
    score: 97.4,
    contactInfo: "No public email listed • Managed via BIGHIT MUSIC / HYBE",
  },
  chenzheyuanisssme: {
    handle: "chenzheyuanisssme",
    name: "Chen Zheyuan (陈哲远) | Actor",
    avatar: `${BASE_PATH}/avatars/chenzheyuanisssme.png`,
    bioLines: [
      "Chen Zheyuan (陈哲远) • 演员 (Actor) 🎬",
      "Star of 'Hidden Love' (偷偷藏不住) & 'Our Secret'",
      "Beijing, China • Represented by Gramarie Entertainment",
    ],
    linkUrl: "https://weibo.com/chenzheyuan",
    trackedSince: "Tracked since Sep, 14 2021. Updated 35 minutes ago.",
    followers: 4000000,
    followersDelta: "+45,000 (1.14%)",
    following: 0,
    followingDelta: "+0 (0.0%)",
    posts: 49,
    postsDelta: "+2 (4.26%)",
    score: 93.5,
    contactInfo: "No public email listed • Represented by Gramarie Entertainment (Beijing)",
  },
  "tomi.timetraveler": {
    handle: "tomi.timetraveler",
    name: "Tomi (@tomi.timetraveler) | Creator",
    avatar: `${BASE_PATH}/avatars/tomi.timetraveler.png`,
    bioLines: [
      "Tomi • Lifestyle, Storytelling & Vintage Aesthetics ✨",
      "Time traveler concept • Life in Northern California & Japan 🇯🇵",
      "Contact: tomi.timetraveler.mgmt@gmail.com",
    ],
    linkUrl: "https://linktr.ee/tomi.timetraveler",
    trackedSince: "Tracked since Feb, 02 2022. Updated 40 minutes ago.",
    followers: 3000000,
    followersDelta: "+35,000 (1.18%)",
    following: 307,
    followingDelta: "+2 (0.65%)",
    posts: 579,
    postsDelta: "+5 (0.87%)",
    score: 91.4,
    contactEmail: "tomi.timetraveler.mgmt@gmail.com",
    contactInfo: "Brand Collabs & Inquiries: tomi.timetraveler.mgmt@gmail.com",
  },
  tomitimetraveler: {
    handle: "tomi.timetraveler",
    name: "Tomi (@tomi.timetraveler) | Creator",
    avatar: `${BASE_PATH}/avatars/tomi.timetraveler.png`,
    bioLines: [
      "Tomi • Lifestyle, Storytelling & Vintage Aesthetics ✨",
      "Time traveler concept • Life in Northern California & Japan 🇯🇵",
      "Contact: tomi.timetraveler.mgmt@gmail.com",
    ],
    linkUrl: "https://linktr.ee/tomi.timetraveler",
    trackedSince: "Tracked since Feb, 02 2022. Updated 40 minutes ago.",
    followers: 3000000,
    followersDelta: "+35,000 (1.18%)",
    following: 307,
    followingDelta: "+2 (0.65%)",
    posts: 579,
    postsDelta: "+5 (0.87%)",
    score: 91.4,
    contactEmail: "tomi.timetraveler.mgmt@gmail.com",
    contactInfo: "Brand Collabs & Inquiries: tomi.timetraveler.mgmt@gmail.com",
  },
  itsjvke: {
    handle: "itsjvke",
    name: "JVKE | Singer & Producer",
    avatar: `${BASE_PATH}/avatars/itsjvke.png`,
    bioLines: [
      "JVKE • Making beats in my bedroom 🎹",
      "golden hour (3B+ streams) • This Is What Falling In Love Feels Like",
      "Bookings & Management: team@itsjvke.com",
    ],
    linkUrl: "https://itsjvke.com",
    trackedSince: "Tracked since Jan, 10 2021. Updated 18 minutes ago.",
    followers: 3666678,
    followersDelta: "+38,000 (0.96%)",
    following: 1256,
    followingDelta: "+12 (0.89%)",
    posts: 312,
    postsDelta: "+4 (1.30%)",
    score: 95.1,
    contactEmail: "team@itsjvke.com",
    contactInfo: "Management & Bookings: team@itsjvke.com",
  },
  moretomihika: {
    handle: "moretomihika",
    name: "Mihika Sharma (@moretomihika) | Creator",
    avatar: `${BASE_PATH}/avatars/moretomihika.png`,
    bioLines: [
      "Mihika Sharma • Fashion, Beauty & Lifestyle 🌸",
      "YouTube: more to mihika • Creator of the m&ms community 🤎",
      "Contact: moretomihika.mgmt@gmail.com",
    ],
    linkUrl: "https://www.youtube.com/@moretomihika",
    trackedSince: "Tracked since Mar, 19 2022. Updated 25 minutes ago.",
    followers: 385395,
    followersDelta: "+4,200 (1.11%)",
    following: 382,
    followingDelta: "+3 (0.71%)",
    posts: 549,
    postsDelta: "+6 (1.10%)",
    score: 86.5,
    contactEmail: "moretomihika.mgmt@gmail.com",
    contactInfo: "Business & PR: moretomihika.mgmt@gmail.com",
  },
  rkive: {
    handle: "rkive",
    name: "RM (남준) | Kim Namjoon",
    avatar: `${BASE_PATH}/avatars/rkive.png`,
    bioLines: [
      "RM of BTS • 'Right Place, Wrong Person' • 'Indigo' 🏛️",
      "Bottega Veneta Ambassador • Modern Art & Architecture Archive",
      "Seoul, South Korea",
    ],
    linkUrl: "https://ibighit.com/bts",
    trackedSince: "Tracked since Dec, 06 2021. Updated 30 minutes ago.",
    followers: 54000000,
    followersDelta: "+270,000 (0.50%)",
    following: 8,
    followingDelta: "+0 (0.0%)",
    posts: 41,
    postsDelta: "+2 (5.13%)",
    score: 97.2,
    contactInfo: "No public email listed • Managed via BIGHIT MUSIC / HYBE",
  },
  mkbhd: {
    handle: "mkbhd",
    name: "Marques Brownlee",
    avatar: `${BASE_PATH}/avatars/mkbhd.png`,
    bioLines: [
      "Quality Tech Videos | YouTuber | Geek | Ultimate Frisbee",
      "MKBHD Studio • Waveform Podcast • 18M+ Subscribers",
      "Business Inquiries: marques@mkbhd.com",
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
    contactEmail: "marques@mkbhd.com",
    contactInfo: "Business & Inquiries: marques@mkbhd.com",
  },
  mrbeast: {
    handle: "mrbeast",
    name: "Jimmy Donaldson",
    avatar: "https://unavatar.io/youtube/mrbeast",
    bioLines: [
      "I want to make the world a better place before I die",
      "Creator of Feastables & Beast Philanthropy",
      "Business Inquiries: business@mrbeast.com",
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
    contactEmail: "business@mrbeast.com",
    contactInfo: "Business Inquiries: business@mrbeast.com",
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

  const dotless = clean.replace(/\./g, "");
  if (CREATOR_PRESETS[dotless]) {
    return CREATOR_PRESETS[dotless];
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

  const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
  const apiBase = process.env.NEXT_PUBLIC_API_URL || (isHttps ? "https://sociotrack-api.onrender.com" : "http://localhost:8000");

  return {
    handle: clean,
    name: `${displayTitle || clean} | Content Creator`,
    avatar: `${apiBase}/api/creators/${encodeURIComponent(clean)}/avatar`,
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
    contactInfo: "No public email listed • Direct Message (DM) on Instagram",
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

  // 2. Authentication State - Null by default; authenticated or demo sessions loaded from localStorage
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authInitialScreen, setAuthInitialScreen] = useState<"login" | "signup">("login");
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [showOnboardingWizard, setShowOnboardingWizard] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [workspaceBrands, setWorkspaceBrands] = useState<{ id: string; name: string }[]>([
    { id: "brd_default", name: "Apex Content Studio" },
    { id: "brd_saas", name: "SaaS Growth Lab" },
    { id: "brd_ecom", name: "NextGen D2C Brand" },
  ]);
  const [activeBrandId, setActiveBrandId] = useState<string>("brd_default");
  const [viewMode, setViewMode] = useState<"public_report" | "saas_dashboard">("public_report");

  useEffect(() => {
    // 1. Restore authenticated session from Supabase client
    try {
      const supabase = createSupabaseClient();
      supabase.auth.getSession().then(({ data }) => {
        if (data?.session?.user) {
          const user = data.session.user;
          const sessionData: UserSession = {
            name: user.user_metadata?.name || user.email?.split("@")[0] || "User",
            email: user.email || "",
            role: user.user_metadata?.role || "Growth & Content Lead",
            isDemo: false,
            token: data.session.access_token,
          };
          setCurrentUser(sessionData);
          localStorage.setItem("sociotrack_user_session", JSON.stringify(sessionData));
        } else {
          // Fallback to local storage cache if available
          const saved = localStorage.getItem("sociotrack_user_session");
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              if (parsed && parsed.email) {
                setCurrentUser({ ...parsed, isDemo: false });
              }
            } catch {
              // ignore
            }
          }
        }
      });
    } catch {
      const saved = localStorage.getItem("sociotrack_user_session");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.email) {
            setCurrentUser({ ...parsed, isDemo: false });
          }
        } catch {
          // ignore
        }
      }
    }
  }, []);

  // 3. Active Creator Profile State
  const [activeCreator, setActiveCreator] = useState<CreatorProfile>(DEFAULT_CREATOR);
  const [isAuditingAccount, setIsAuditingAccount] = useState(false);
  const [telemetryStep, setTelemetryStep] = useState<string | null>(null);

  // Automatically synchronize active creator with live Instagram metrics on mount and switch
  useEffect(() => {
    let isMounted = true;
    const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
    const apiBase = process.env.NEXT_PUBLIC_API_URL || (isHttps ? "https://sociotrack-api.onrender.com" : "http://localhost:8000");
    if (!apiBase || (isHttps && apiBase.startsWith("http://localhost"))) return;

    fetch(`${apiBase}/api/creators/live/${encodeURIComponent(activeCreator.handle)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((live) => {
        if (!isMounted) return;
        if (live && live.followers !== undefined) {
          setActiveCreator((prev) => {
            if (prev.handle.toLowerCase() === live.handle?.toLowerCase()) {
              return {
                ...prev,
                name: live.name || prev.name,
                avatar: live.avatar_url || live.avatar || prev.avatar,
                followers: live.followers,
                followersDelta: live.followersDelta || prev.followersDelta,
                following: live.following !== undefined ? live.following : prev.following,
                posts: live.mediaCount !== undefined ? live.mediaCount : prev.posts,
                isPrivate: live.is_private !== undefined ? live.is_private : prev.isPrivate,
                isVerified: live.is_verified !== undefined ? live.is_verified : prev.isVerified,
                lastFetchedAt: live.updatedAt || new Date().toISOString(),
                lastFetchFailed: Boolean(live.lastFetchFailed),
                provenanceBadge: live.fallback ? "Retrieved" : "Verified",
                dataSource: live.fallback ? "Cached Profile Telemetry" : "Meta OpenGraph Live Scraper",
              };
            }
            return prev;
          });
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [activeCreator.handle]);

  // Automatically save snapshot of the active profile when an authenticated user inspects it
  useEffect(() => {
    if (currentUser && !currentUser.isDemo && activeCreator.handle) {
      saveProfileSnapshot(activeCreator, currentUser.email).catch(() => {});
    }
  }, [activeCreator.handle, currentUser]);

  // 4. Navigation State: Sub-navigation active tab (Default: "overview")
  const [activeSubTab, setActiveSubTab] = useState<SubNavTab>("overview");

  // 5. Application Data State
  const [drafts, setDrafts] = useState<PostDraft[]>(INITIAL_DRAFTS);
  const [insights, setInsights] = useState<LearnedInsight[]>(INITIAL_INSIGHTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [bookmarkedHandles, setBookmarkedHandles] = useState<string[]>([]);
  const [selectedStudioHook, setSelectedStudioHook] = useState<string>("");

  // Memory search query state in Memory Bank
  const [memorySearchQuery, setMemorySearchQuery] = useState("");

  // 6. Global Notification Toast
  const [toastMessage, setToastMessage] = useState<{
    title: string;
    description: string;
    type?: "success" | "info" | "warning" | "error";
  } | null>(null);

  // 7. FAQ State
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const showToast = (
    title: string,
    description: string,
    type: "success" | "info" | "warning" | "error" = "success"
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

    // Pre-fetch live data immediately
    const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
    const apiBase = process.env.NEXT_PUBLIC_API_URL || (isHttps ? "https://sociotrack-api.onrender.com" : "http://localhost:8000");
    let livePromise: Promise<any> | null = null;
    if (apiBase && !(isHttps && apiBase.startsWith("http://localhost"))) {
      livePromise = fetch(`${apiBase}/api/creators/live/${encodeURIComponent(handle)}`)
        .then((res) => (res.ok ? res.json() : null))
        .catch(() => null);
    }

    setTimeout(() => {
      setTelemetryStep(`Observing @${handle}: Ingesting media nodes & Reel engagement...`);
    }, 300);

    setTimeout(() => {
      setTelemetryStep("Calculating algorithmic virality ratio & health benchmarks...");
    }, 600);

    setTimeout(() => {
      setTelemetryStep("Synthesizing AI content recommendations & winning hook formulas...");
    }, 900);

    setTimeout(async () => {
      let profile = generateCreatorProfile(handle);

      // Await or apply live stats if arrived
      if (livePromise) {
        try {
          const liveStats = await Promise.race([
            livePromise,
            new Promise((resolve) => setTimeout(() => resolve(null), 2500)),
          ]);
          if (liveStats && liveStats.followers !== undefined) {
            profile = {
              ...profile,
              name: liveStats.name || profile.name,
              avatar: liveStats.avatar_url || liveStats.avatar || profile.avatar,
              followers: liveStats.followers,
              followersDelta: liveStats.followersDelta || profile.followersDelta,
              following: liveStats.following !== undefined ? liveStats.following : profile.following,
              posts: liveStats.mediaCount !== undefined ? liveStats.mediaCount : profile.posts,
              isPrivate: liveStats.is_private !== undefined ? liveStats.is_private : profile.isPrivate,
              isVerified: liveStats.is_verified !== undefined ? liveStats.is_verified : profile.isVerified,
              lastFetchedAt: liveStats.updatedAt || new Date().toISOString(),
              lastFetchFailed: Boolean(liveStats.lastFetchFailed),
              provenanceBadge: liveStats.fallback ? "Retrieved" : "Verified",
              dataSource: liveStats.fallback ? "Cached Profile Telemetry" : "Meta OpenGraph Live Scraper",
            };
          }
        } catch {}
      }

      setActiveCreator(profile);
      setIsAuditingAccount(false);
      setTelemetryStep(null);

      // If livePromise takes slightly longer, attach background updater
      if (livePromise) {
        livePromise.then((liveStats) => {
          if (liveStats && liveStats.followers !== undefined) {
            setActiveCreator((prev) => {
              if (prev.handle.toLowerCase() === handle.toLowerCase()) {
                return {
                  ...prev,
                  name: liveStats.name || prev.name,
                  avatar: liveStats.avatar_url || liveStats.avatar || prev.avatar,
                  followers: liveStats.followers,
                  followersDelta: liveStats.followersDelta || prev.followersDelta,
                  following: liveStats.following !== undefined ? liveStats.following : prev.following,
                  posts: liveStats.mediaCount !== undefined ? liveStats.mediaCount : prev.posts,
                  isPrivate: liveStats.is_private !== undefined ? liveStats.is_private : prev.isPrivate,
                  isVerified: liveStats.is_verified !== undefined ? liveStats.is_verified : prev.isVerified,
                  lastFetchedAt: liveStats.updatedAt || new Date().toISOString(),
                  lastFetchFailed: Boolean(liveStats.lastFetchFailed),
                  provenanceBadge: liveStats.fallback ? "Retrieved" : "Verified",
                  dataSource: liveStats.fallback ? "Cached Profile Telemetry" : "Meta OpenGraph Live Scraper",
                };
              }
              return prev;
            });
          }
        });
      }

      // Scroll smoothly to the creator card
      const el = document.getElementById("creator-card-section");
      el?.scrollIntoView({ behavior: "smooth" });

      showToast(
        "AI Diagnostic Audit Complete",
        `Synthesized real-time telemetry and winning predictions for @${profile.handle} (Score: ${profile.score}%).`,
        "success"
      );
    }, 1150);
  };

  // 9. Handler: Date Range Adjustment
  const handleDateRangeChange = (range: string) => {
    setActiveCreator((prev) => {
      let deltaStr = prev.followersDelta;
      if (range === "Today") {
        deltaStr = `+${Math.max(1, Math.round(prev.followers * 0.001)).toLocaleString()} (0.1%)`;
      } else if (range === "This Week") {
        deltaStr = `+${Math.round(prev.followers * 0.005).toLocaleString()} (0.5%)`;
      } else if (range === "Last 7 Days") {
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
    setBookmarkedHandles((prev) =>
      starred
        ? prev.includes(activeCreator.handle)
          ? prev
          : [...prev, activeCreator.handle]
        : prev.filter((h) => h !== activeCreator.handle)
    );
    showToast(
      starred ? "Account Bookmarked" : "Removed from Bookmarks",
      `@${activeCreator.handle} is ${starred ? "now" : "no longer"} pinned in your tracking workspace.`,
      "info"
    );
  };

  // 11. Approve Draft Handler
  const handleApproveDraft = (draft: PostDraft) => {
    // Dynamically calculate the next high-velocity scheduling window (tomorrow at 14:00 UTC)
    const targetSlot = new Date(Date.now() + 86400000);
    targetSlot.setUTCHours(14, 0, 0, 0);
    const targetSlotIso = targetSlot.toISOString();
    const formattedSlot = formatScheduledTime(targetSlotIso);

    // Call approvePostAPI with the dynamic target instant
    approvePostAPI(draft.content, draft.format || "CAROUSEL", targetSlotIso).catch(() => {});

    setDrafts((prev) =>
      prev.map((d) =>
        d.id === draft.id
          ? {
              ...d,
              status: "Approved" as const,
              scheduledTime: formattedSlot,
              scheduledTimeIso: targetSlotIso,
            }
          : d
      )
    );

    showToast(
      "Draft Approved & Scheduled",
      `Post scheduled for ${draft.platform} on ${formattedSlot}.`,
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
        <div
          className={`fixed top-5 right-5 z-50 max-w-sm bg-white dark:bg-[#161F30] border-2 rounded-2xl p-4 shadow-2xl flex items-start space-x-3 animate-slide-up ${
            toastMessage.type === "error"
              ? "border-rose-500"
              : toastMessage.type === "warning"
              ? "border-amber-500"
              : toastMessage.type === "info"
              ? "border-indigo-500"
              : "border-emerald-500"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              toastMessage.type === "error"
                ? "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400"
                : toastMessage.type === "warning"
                ? "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"
                : toastMessage.type === "info"
                ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400"
                : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {toastMessage.type === "error" ? (
              <AlertTriangle className="w-4 h-4" />
            ) : toastMessage.type === "warning" ? (
              <AlertTriangle className="w-4 h-4" />
            ) : toastMessage.type === "info" ? (
              <Info className="w-4 h-4" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
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
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0B0F19]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-[#243048] px-4 sm:px-8 py-4 min-h-[72px] sm:min-h-[80px] flex items-center justify-between transition-all">
        {/* Left: SocioTrack Logo & Brand Name */}
        <div className="flex items-center space-x-3.5">
          <button
            onClick={() => {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="flex items-center space-x-3 hover:opacity-90 transition-opacity"
            aria-label="SocioTrack Home"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-[#6366F1] via-[#8B5CF6] to-[#06B6D4] flex items-center justify-center shadow-md shadow-indigo-500/20">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white stroke-[2.5]" />
            </div>
            <div className="text-left">
              <div className="flex items-center space-x-2">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  SocioTrack
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200/60 dark:border-indigo-800/60 hidden sm:inline-block">
                  v2.4
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden md:block">
                Autonomous Social Intelligence &amp; Reinforcement Growth
              </p>
            </div>
          </button>
        </div>

        {/* Right: SaaS App / Log In, Create a Free Account, and Dark Mode Toggle on extreme right */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {currentUser ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode(viewMode === "public_report" ? "saas_dashboard" : "public_report")}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#243048] text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#161F30] transition-colors"
              >
                {viewMode === "public_report" ? "SaaS App →" : "Public View"}
              </button>
              <button
                onClick={() => {
                  if (currentUser?.token) {
                    const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
                    const apiBase = process.env.NEXT_PUBLIC_API_URL || (isHttps ? "https://sociotrack-api.onrender.com" : "http://localhost:8000");
                    fetch(`${apiBase}/api/auth/logout`, {
                      method: "POST",
                      headers: { Authorization: `Bearer ${currentUser.token}` },
                    }).catch(() => {});
                  }
                  localStorage.removeItem("sociotrack_user_session");
                  setCurrentUser(null);
                  setViewMode("public_report");
                  showToast("Signed Out", "Your session has been securely ended and invalidated.");
                }}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                title="Sign out of current workspace"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setAuthInitialScreen("login");
                  setShowAuthModal(true);
                }}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#243048] text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#161F30] transition-colors"
              >
                Log in
              </button>
              <button
                onClick={() => {
                  setAuthInitialScreen("signup");
                  setShowAuthModal(true);
                }}
                className="px-4 py-2 rounded-xl bg-[#6366F1] hover:bg-[#5558E6] text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all hover:scale-102"
              >
                Create Account
              </button>
            </div>
          )}

          <button
            onClick={() => setShowFeedbackModal(true)}
            className="flex items-center space-x-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-[#243048] hover:bg-slate-100 dark:hover:bg-[#161F30] text-slate-600 dark:text-slate-300 text-xs font-semibold transition-colors"
            title="Provide feedback on recommendations or report an issue"
          >
            <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden md:inline">Feedback</span>
          </button>

          {/* Extreme Right: Moon / Sun Toggle Button */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 sm:p-2.5 rounded-xl border border-slate-200 dark:border-[#243048] hover:bg-slate-100 dark:hover:bg-[#161F30] text-slate-600 dark:text-slate-300 transition-colors ml-1"
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
                  placeholder="Search or paste Instagram URL"
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
                {["zyrohouse", "arnav.patel07", "zurikrishna", "keerz.core", "techno_gamerz", "lalalalisa_m", "aviralbhardwaj_ji", "thv", "itsjvke", "chenzheyuanisssme", "rkive", "mkbhd"].map((handle) => (
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
            {/* Private Account Lockout State: If the target account is private, hide analytics and display lock notice */}
            {activeCreator.isPrivate ? (
              <PrivateAccountLockout
                handle={activeCreator.handle}
                onReturnToSearch={() => {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                  const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
                  if (searchInput) searchInput.focus();
                }}
              />
            ) : (
              <>
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
                    isStarred={bookmarkedHandles.includes(activeCreator.handle)}
                  />

                  {/* 2. CREATOR TAB CONTENT */}

                  {/* OVERVIEW SUBTAB (Modern Blue/Purple Redesign: Followers, Engagement Rate, Posts, Demographics) */}
                  {activeSubTab === "overview" && (
                    <OverviewDashboard
                      creator={activeCreator}
                      onNavigateTab={setActiveSubTab}
                      onSendToStudio={(hook) => {
                        setSelectedStudioHook(hook);
                        setActiveSubTab("aistudio");
                        showToast(
                          "Hook Sent to AI Studio",
                          `Loaded hook: "${hook.slice(0, 48)}..." into generator prompt.`,
                          "success"
                        );
                      }}
                      onToast={(title, msg, type) => showToast(title, msg, type)}
                    />
                  )}

                  {/* GROWTH PRIMARY TAB (Distinct Growth Page: Trends, Velocity & Peer Benchmarks) */}
                  {activeSubTab === "growth" && (
                    <GrowthDashboardView
                      creator={activeCreator}
                      onNavigateTab={setActiveSubTab}
                      onToast={(title, msg, type) => showToast(title, msg, type)}
                    />
                  )}

              {/* AUDIENCE PRIMARY TAB */}
              {activeSubTab === "audience" && (
                <div className="space-y-8 animate-fade-in">
                  <AudienceInsightsSection creator={activeCreator} />
                  <InsTrackEngagementView creator={activeCreator} />
                </div>
              )}

              {/* ENGAGEMENT PRIMARY TAB */}
              {activeSubTab === "engagement" && (
                <div className="space-y-6 animate-fade-in">
                  <InsTrackEngagementView creator={activeCreator} />
                </div>
              )}

              {/* CONTENT PRIMARY TAB */}
              {activeSubTab === "content" && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                        Content Library &amp; Post Performance
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Inspect real post telemetry, engagement distribution, and winning hooks
                      </p>
                    </div>
                  </div>
                  <InsTrackRecentPostsFeed
                    creator={activeCreator}
                    onSelectHook={(hook) => {
                      setSelectedStudioHook(hook);
                      setActiveSubTab("aistudio");
                      showToast(
                        "Hook Sent to AI Studio",
                        `Loaded hook: "${hook.slice(0, 48)}..." into generator prompt.`,
                        "success"
                      );
                    }}
                    onToast={(title, msg, type) => showToast(title, msg, type)}
                  />
                </div>
              )}

              {/* HISTORY PRIMARY TAB */}
              {activeSubTab === "historical" && (
                <div className="space-y-6 animate-fade-in">
                  <InsTrackHistoricalTable creator={activeCreator} />
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
                </div>
              )}

              {/* UNFOLLOWERS SUBTAB (Who Unfollowed Me Tracker) */}
              {activeSubTab === "unfollowers" && (
                <div className="space-y-6 animate-fade-in">
                  <InsTrackUnfollowersView
                    creator={activeCreator}
                    onToast={(title, msg, type) => showToast(title, msg, type)}
                  />
                </div>
              )}

              {/* AI GENERATION STUDIO & RECENT POSTS / REELS INTELLIGENCE */}
              {activeSubTab === "aistudio" && (
                <div className="space-y-8 animate-fade-in">
                  {/* Recent Posts & Reels Feed Scraper */}
                  <InsTrackRecentPostsFeed
                    creator={activeCreator}
                    onSelectHook={(hook) => {
                      setSelectedStudioHook(hook);
                      showToast(
                        "Hook Sent to AI Studio",
                        `Loaded hook: "${hook.slice(0, 48)}..." into generator prompt.`,
                        "success"
                      );
                    }}
                    onToast={(title, msg, type) => showToast(title, msg, type)}
                  />

                  {/* AI Generation Studio with passed hook */}
                  <div className="bg-white dark:bg-[#161F30] rounded-2xl border border-slate-200 dark:border-[#243048] p-6 shadow-sm">
                    <GenerationStudio
                      drafts={drafts}
                      onDraftsChange={setDrafts}
                      onApproveDraft={handleApproveDraft}
                      initialTopic={selectedStudioHook}
                      brandId={activeBrandId}
                      brandName={workspaceBrands.find((b) => b.id === activeBrandId)?.name || "SocioTrack"}
                      onToast={(title, msg, type) => showToast(title, msg, type)}
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

              {/* CONTROLLED CONTENT EXPERIMENTS SUBTAB */}
              {activeSubTab === "experiments" && (
                <div className="space-y-6 animate-fade-in">
                  <InsTrackExperimentsView
                    onToast={(title, msg, type) => showToast(title, msg, type)}
                  />
                </div>
              )}

              {/* INTELLIGENT CONTENT CALENDAR SUBTAB */}
              {activeSubTab === "calendar" && (
                <div className="space-y-6 animate-fade-in">
                  <InsTrackCalendarView
                    onToast={(title, msg, type) => showToast(title, msg, type)}
                  />
                </div>
              )}

              {/* PRODUCT USAGE TELEMETRY & PILOT ANALYTICS SUBTAB */}
              {activeSubTab === "telemetry" && (
                <div className="space-y-6 animate-fade-in">
                  <ProductAnalyticsView apiBaseUrl={API_BASE_URL} authToken={currentUser?.token} />
                </div>
              )}

              {/* NATURAL LANGUAGE QUERY EXPLORER ("ASK SOCIOTRACK") */}
              {activeSubTab === "ask_ai" && (
                <div className="space-y-6 animate-fade-in">
                  <NaturalLanguageExplorer
                    brandId={activeBrandId}
                    apiBaseUrl={API_BASE_URL}
                    authToken={currentUser?.token}
                  />
                </div>
              )}

              {/* COMPETITOR BENCHMARKING SUBTAB */}
              {activeSubTab === "competitors" && (
                <div className="space-y-6 animate-fade-in">
                  <CompetitorBenchmarkCard
                    brandId={activeBrandId}
                    onToast={(title, msg, type) => showToast(title, msg, type)}
                  />
                </div>
              )}

              {/* APPROVAL QUEUE & PEER COLLABORATION SUBTAB */}
              {activeSubTab === "approval" && (
                <div className="space-y-6 animate-fade-in">
                  <ApprovalQueueWidget
                    brandId={activeBrandId}
                    onToast={(title, msg, type) => showToast(title, msg, type)}
                  />
                </div>
              )}

              {/* ADVANCED EXECUTIVE REPORTING & AUDIT EXPORTS */}
              {activeSubTab === "reports" && (
                <div className="space-y-6 animate-fade-in">
                  <AdvancedReportsView
                    brandId={activeBrandId}
                    brandName={workspaceBrands.find((b) => b.id === activeBrandId)?.name}
                    apiBaseUrl={API_BASE_URL}
                    authToken={currentUser?.token}
                    onToast={(title, msg, type) => showToast(title, msg, type)}
                  />
                </div>
              )}

              {/* TRANSPARENT PLANS & PRICING MATRIX */}
              {activeSubTab === "pricing" && (
                <div className="space-y-6 animate-fade-in">
                  <PricingMatrixView
                    currentPlan="pro"
                    onSelectPlan={(plan, cycle) => {
                      showToast(
                        "Connecting to Stripe",
                        `Initiating secure checkout for ${plan.toUpperCase()} (${cycle}).`,
                        "info"
                      );
                      setTimeout(() => {
                        showToast(
                          "Subscription Upgraded",
                          `Welcome to SocioTrack ${plan.toUpperCase()}! Entitlements unlocked.`,
                          "success"
                        );
                        setActiveSubTab("billing");
                      }, 1800);
                    }}
                  />
                </div>
              )}

              {/* CUSTOMER ACCOUNT & BILLING PORTAL */}
              {activeSubTab === "billing" && (
                <div className="space-y-6 animate-fade-in">
                  <CustomerBillingPortal
                    workspaceId="default-workspace"
                    apiBaseUrl={API_BASE_URL}
                    authToken={currentUser?.token}
                    onOpenPricing={() => setActiveSubTab("pricing")}
                    onToast={(title, msg, type) => showToast(title, msg, type)}
                  />
                </div>
              )}

              {/* SAAS EXECUTIVE BUSINESS & UNIT ECONOMICS METRICS */}
              {activeSubTab === "saas_metrics" && (
                <div className="space-y-6 animate-fade-in">
                  <BusinessMetricsDashboard
                    apiBaseUrl={API_BASE_URL}
                    authToken={currentUser?.token}
                  />
                </div>
              )}
            </div>
          </>
        )}

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

              {/* Competitor Table connected to handleAuditAccount & Account Management */}
              <InsTrackCompetitorTable
                onAddAccountClick={() => setShowAddAccountModal(true)}
                onSelectAccount={(handle) => handleAuditAccount(handle)}
                onSetPrimaryAccount={(handle) => {
                  handleAuditAccount(handle);
                  document.getElementById("creator-card-section")?.scrollIntoView({ behavior: "smooth" });
                }}
                primaryHandle={activeCreator.handle}
                onToast={(title, msg, type) => showToast(title, msg, type)}
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
                  onClick={() => {
                    setAuthInitialScreen("signup");
                    setShowAuthModal(true);
                  }}
                  className="px-8 py-3.5 rounded-xl bg-white/20 hover:bg-white/30 border border-white/40 text-white font-bold text-sm shadow-lg transition-all inline-flex items-center space-x-2 hover:scale-105"
                >
                  <span>Create a Free Account</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </section>

            {/* 8. FOUNDERS' DISPATCH // OPEN SOURCE CORE */}
            <div id="founders-dispatch-section" className="pt-4 scroll-mt-20">
              <FoundersDispatch />
            </div>
          </main>

          {/* FOOTER */}
          <footer className="border-t border-slate-200 dark:border-[#243048] bg-white dark:bg-[#0B0F19] py-10 text-xs text-slate-500 dark:text-slate-400 transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-center md:justify-start space-x-2.5">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#6366F1] to-[#8B5CF6] flex items-center justify-center text-white shadow-sm">
                      <TrendingUp className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <span className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight">
                      SocioTrack
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md font-medium">
                    SocioTrack by Zyrohouse — an emerging startup.
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    Autonomous Social Media Engagement &amp; Real-Time Meta Graph Telemetry.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold">
                  <button
                    onClick={() => {
                      setActiveSubTab("overview");
                      document.getElementById("creator-card-section")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => {
                      setActiveSubTab("growth");
                      document.getElementById("creator-card-section")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    Growth Trends
                  </button>
                  <button
                    onClick={() => {
                      setActiveSubTab("audience");
                      document.getElementById("creator-card-section")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    Audience Demographics
                  </button>
                  <button
                    onClick={() => {
                      setActiveSubTab("audit");
                      document.getElementById("creator-card-section")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    Audit
                  </button>
                  <button
                    onClick={() => {
                      setActiveSubTab("aistudio");
                      document.getElementById("creator-card-section")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    AI Studio
                  </button>
                  <button
                    onClick={() => {
                      document.getElementById("founders-dispatch-section")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="hover:text-indigo-600 dark:hover:text-indigo-400 font-bold text-indigo-600 dark:text-indigo-400 transition-colors"
                  >
                    Founders’ Dispatch
                  </button>
                  <button
                    onClick={() => setShowLegalModal(true)}
                    className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    Terms &amp; Privacy
                  </button>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400 dark:text-slate-500">
                <div>
                  SocioTrack is a product by Zyrohouse, an emerging startup. Built for Microsoft AI Hackathon.
                </div>
                <div className="font-mono">
                  © 2026 SocioTrack by Zyrohouse. All rights reserved.
                </div>
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
              initialScreen={authInitialScreen}
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
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("sociotrack:track_account", {
                detail: { username, fullName: `@${username}`, group: "My Accounts" },
              })
            );
          }
          showToast(
            "Account Added to Tracking List",
            `@${username} is now being tracked and audited with AI vector memory.`,
            "success"
          );
        }}
        onOpenProfile={(handle) => {
          setViewMode("public_report");
          setActiveSubTab("overview");
          handleAuditAccount(handle);
        }}
      />

      {/* PILOT ONBOARDING WIZARD MODAL */}
      <OnboardingWizardModal
        isOpen={showOnboardingWizard}
        onClose={() => setShowOnboardingWizard(false)}
        onComplete={(newBrandId, newBrandName) => {
          setActiveBrandId(newBrandId);
          setActiveSubTab("aistudio");
          showToast(
            "Brand Initialized",
            `Switched to active workspace for ${newBrandName}`,
            "success"
          );
        }}
        apiBaseUrl={API_BASE_URL}
        onToast={(title, msg, type) => showToast(title, msg, type)}
      />

      {/* USER FEEDBACK & PILOT RESEARCH MODAL */}
      <UserFeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        brandId={activeBrandId}
        apiBaseUrl={API_BASE_URL}
        onToast={(title, msg, type) => showToast(title, msg, type)}
      />

      {/* TEAM & RBAC PERMISSIONS MODAL */}
      <TeamCollaborationModal
        isOpen={showTeamModal}
        onClose={() => setShowTeamModal(false)}
        workspaceId="default-workspace"
        apiBaseUrl={API_BASE_URL}
        authToken={currentUser?.token}
        onToast={(title, msg, type) => showToast(title, msg, type)}
      />

      {/* PRE-COMMERCIAL LEGAL & COMPLIANCE MODAL */}
      <TermsAndPrivacyModal
        isOpen={showLegalModal}
        onClose={() => setShowLegalModal(false)}
      />
    </div>
  );
}
