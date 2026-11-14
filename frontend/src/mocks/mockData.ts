export type PlatformType = "LinkedIn" | "X" | "Instagram";
export type TargetTone =
  | "Professional"
  | "Conversational"
  | "Educational"
  | "Witty"
  | "Thought Leadership";

export interface PostDraft {
  id: string;
  platform: PlatformType;
  tone: TargetTone;
  hookStyle: string;
  format?: string;
  status: "Draft" | "Approved" | "Scheduled";
  scheduledTime?: string;
  scheduledTimeIso?: string;
  content: string;
  predictedEngagement: "LOW" | "MEDIUM" | "HIGH";
  confidenceScore: number; // e.g. 94%
  aiExplanation: string;
  createdAt: string;
  dosMatched: string[];
  dontsAvoided: string[];
  recommendationRationale?: string;
  supportingEvidence?: string;
  memoriesApplied?: string[];
  knownLimitations?: string;
  platformTarget?: string;
  isAiGenerated?: boolean;
  generationMethod?: string;
  provider?: string;
  model?: string;
  latencyMs?: number;
  fallbackReason?: string;
  unsupportedClaims?: string[];
  improvementSuggestions?: string[];
  matchScore?: number;
  assumptionsMade?: string[];
}

export interface LearnedInsight {
  id: string;
  type: "performance" | "timing" | "sentiment" | "preference" | "discovered";
  title: string;
  insight: string;
  metric?: string;
  confidence: string;
  timestamp: string;
  isNew?: boolean;
  metadata?: any;
  supportingEvidence?: string;
  sourceEvent?: string;
  isActive?: boolean;
  isExplicit?: boolean;
  memoryType?: string;
}

export const INITIAL_DRAFTS: PostDraft[] = [
  {
    id: "draft_01",
    platform: "LinkedIn",
    tone: "Thought Leadership",
    hookStyle: "Contrarian Thought Leadership",
    status: "Draft",
    content: `Everyone talks about scaling their business. But what if the real competitive advantage isn't spending more?

It's understanding where your existing resources are being wasted.

We benchmarked 4,200 production workflows across 18 teams:
• 78% of runtime budget was burnt on recursive agent re-prompts
• Deterministic checkpointing slashed recovery latency by 64%
• Vectorized audience memory dropped token costs from $14.20/run to $1.85/run (-87%)

Stop brute-forcing token scale. Tighten your state architecture.

What is your current cost per successful AI task?`,
    predictedEngagement: "HIGH",
    confidenceScore: 94,
    aiExplanation:
      "Your audience has historically saved opinion-driven technical posts more frequently than generic tutorials. The agent selected a contrarian hook based on this learned preference.",
    createdAt: "Just now",
    dosMatched: [
      "Quantified benchmark claim in opening 3 lines",
      "Contrarian angle addressing architectural waste",
      "Direct question call to action",
    ],
    dontsAvoided: ["No hype words ('groundbreaking', 'game changer')", "No generic buzzwords"],
  },
  {
    id: "draft_02",
    platform: "X",
    tone: "Educational",
    hookStyle: "Data-First Technical Breakdown",
    status: "Draft",
    content: `The dirty secret of enterprise AI agents:

Most 'failures' aren't model hallucinations.
They are unconstrained state machines running in loops.

Here is the 3-step checklist we use to keep agents deterministic:
1. Checkpoint state after every tool execution
2. Enforce strict Pydantic schemas over raw JSON
3. Cap conversation memory to top-5 vector embeddings

Save this before your next LangGraph deploy. 🧵👇`,
    predictedEngagement: "HIGH",
    confidenceScore: 91,
    aiExplanation:
      "Learned audience pattern #3 indicates engineers engage 3.1x more on numbered technical checklists than high-level commentary.",
    createdAt: "5 mins ago",
    dosMatched: ["Numbered procedural checklist", "Specific framework attribution (LangGraph)"],
    dontsAvoided: ["No vague generalities"],
  },
  {
    id: "draft_03",
    platform: "Instagram",
    tone: "Conversational",
    hookStyle: "Visual Architecture Carousel",
    status: "Draft",
    content: `Building AI agents that actually remember? 🧠✨

Swipe through to see the exact memory loop SocioTrack uses:
→ Ingests live analytics in under 120ms
→ Re-ranks vector embeddings by audience resonance
→ Automatically prunes low-signal impressions

Drop a 'MEMORY' in the comments for our architectural whitepaper! 👇`,
    predictedEngagement: "MEDIUM",
    confidenceScore: 82,
    aiExplanation:
      "Visual carousel format aligns with Instagram technical micro-creators. Generates strong DM saves.",
    createdAt: "12 mins ago",
    dosMatched: ["Clear swipe incentive", "Visual slide progression mapping"],
    dontsAvoided: ["No wall of dense prose"],
  },
];

export const INITIAL_INSIGHTS: LearnedInsight[] = [
  {
    id: "insight_01",
    type: "performance",
    title: "Contrarian Content Wins",
    insight: "Contrarian technical takes get 3.4x more saves than tutorials.",
    metric: "3.4x",
    confidence: "High Confidence (96%)",
    timestamp: "Updated 10m ago",
    metadata: {
      metricLabel: "Save Multiplier",
      comparison: [
        { label: "Contrarian", value: 85, color: "#5146D8" },
        { label: "Tutorial", value: 25, color: "#CBD5E1" },
      ],
    },
  },
  {
    id: "insight_02",
    type: "timing",
    title: "Peak Reply Window",
    insight: "Tuesday & Thursday, 2:00 PM – 4:30 PM.",
    metric: "2:00 PM - 4:30 PM",
    confidence: "High Confidence (92%)",
    timestamp: "Synchronized",
    metadata: {
      peakDays: ["Tue", "Thu"],
      windows: [
        { day: "Mon", intensity: 45 },
        { day: "Tue", intensity: 95 },
        { day: "Wed", intensity: 60 },
        { day: "Thu", intensity: 90 },
        { day: "Fri", intensity: 40 },
      ],
    },
  },
  {
    id: "insight_03",
    type: "sentiment",
    title: "Audience Interest",
    insight: "68% of your audience is currently curious about cost optimization.",
    metric: "68%",
    confidence: "Solid Consensus (88%)",
    timestamp: "Refreshed today",
    metadata: {
      percentage: 68,
      topics: ["Cost Optimization", "Token Caching", "Agent Latency"],
    },
  },
  {
    id: "insight_04",
    type: "preference",
    title: "Emerging Audience Preference",
    insight: "Practical, data-backed opinions generate stronger audience conversations.",
    metric: "+48% Replies",
    confidence: "AI Discovered (94%)",
    timestamp: "Learned 2 hours ago",
    metadata: {
      aiDiscovered: true,
      tag: "Vector Clustered",
    },
  },
];

export const PUBLISHED_POSTS_OPTIONS = [
  {
    id: "pub_101",
    title: "Why Multi-Agent Swarms Fail in Production",
    platform: "LinkedIn",
    defaultImpressions: 18200,
    defaultShares: 320,
    defaultLikes: 740,
    defaultReplies: 95,
  },
  {
    id: "pub_102",
    title: "The 4-Step Playbook for Checkpointing AI State",
    platform: "X",
    defaultImpressions: 9800,
    defaultShares: 110,
    defaultLikes: 390,
    defaultReplies: 42,
  },
  {
    id: "pub_103",
    title: "How We Slashed Token Spend by 87% with Memory Pruning",
    platform: "LinkedIn",
    defaultImpressions: 24500,
    defaultShares: 580,
    defaultLikes: 1120,
    defaultReplies: 160,
  },
];

// Preserved backwards compatibility for original lib/api contracts
export interface MockPostVariation {
  id: string;
  format: "Format A: Data-first" | "Format B: Hot take" | "Format C: Tactical breakdown";
  hook: string;
  body: string;
  call_to_action: string;
  full_text: string;
  rationale: string;
  match_score?: number;
}

export interface MockSelectedPost {
  draft: MockPostVariation;
  match_score: number;
  evaluation_summary: string;
  dos_matched: string[];
  donts_avoided: string[];
  dosMatched?: string[];
  dontsAvoided?: string[];
  scheduled_time: string;
}

export interface MockMemoryInsights {
  brand_name: string;
  total_winning_posts: number;
  total_lessons_learned: number;
  current_sentiment: {
    topic: string;
    sentiment_label: string;
    sentiment_score: number;
    summary: string;
    keywords: string[];
  };
  top_winning_posts: Array<{
    id: string;
    topic: string;
    content: string;
    hook: string;
    composite_score: number;
    impressions: number;
    shares: number;
    replies: number;
    likes: number;
    key_takeaway: string;
  }>;
  learned_lessons: Array<{
    id: string;
    topic: string;
    key_lesson: string;
    composite_score: number;
    derived_at?: string;
  }>;
}

export const MOCK_DRAFTS: MockPostVariation[] = [
  {
    id: "var_a",
    format: "Format A: Data-first",
    hook: "We analyzed 4,200 production agent runs across 18 teams deploying LangGraph StateGraph.",
    body: `The data revealed a stark 3.4x performance gap between naive implementations and structured memory systems:

• 78% of runtime failures were caused by unconstrained context drift
• Checkpointed state transitions slashed agent recovery latency by 64%
• Memory caching with vector indexing decreased token costs from $14.20/run to $1.85/run (-87%)

Current audience mood is cautious and demanding: Engineers demand production benchmarks over toy demos.
The top-performing teams aren't using bigger models—they are building tighter state architectures.`,
    call_to_action: "Are you tracking token cost per successful agent task yet? What is your baseline?",
    full_text: `We analyzed 4,200 production agent runs across 18 teams deploying LangGraph StateGraph.

The data revealed a stark 3.4x performance gap between naive implementations and structured memory systems:

• 78% of runtime failures were caused by unconstrained context drift
• Checkpointed state transitions slashed agent recovery latency by 64%
• Memory caching with vector indexing decreased token costs from $14.20/run to $1.85/run (-87%)

Current audience mood is cautious and demanding: Engineers demand production benchmarks over toy demos.
The top-performing teams aren't using bigger models—they are building tighter state architectures.

Are you tracking token cost per successful agent task yet? What is your baseline?

#AgenticAI #LangGraph #ProductionAI`,
    rationale: "Data-backed benchmark with quantifiable percentages matching top audience save signals.",
    match_score: 9.4,
  },
  {
    id: "var_b",
    format: "Format B: Hot take",
    hook: "Everyone talks about scaling their business. But what if the real competitive advantage isn't spending more?",
    body: `It's understanding where your existing resources are being wasted.

Most AI initiatives fail not from inadequate models, but from catastrophic state leakage and untracked latency loops. The true breakthroughs in AI systems won't come from chaining 10 fragile agents together; they will come from making a single agent deeply reliable.`,
    call_to_action: "Simplicity beats hype every single time. Agree or disagree?",
    full_text: `Everyone talks about scaling their business. But what if the real competitive advantage isn't spending more?

It's understanding where your existing resources are being wasted.

Most AI initiatives fail not from inadequate models, but from catastrophic state leakage and untracked latency loops. The true breakthroughs in AI systems won't come from chaining 10 fragile agents together; they will come from making a single agent deeply reliable.

Simplicity beats hype every single time. Agree or disagree?

#AIArchitecture #SocioTrack #PragmaticAI`,
    rationale: "Contrarian hook debunking industry obsession with agent swarm complexity.",
    match_score: 9.1,
  },
  {
    id: "var_c",
    format: "Format C: Tactical breakdown",
    hook: "A 4-step architectural checklist for deterministic agent memory.",
    body: `1. Checkpoint node outputs after every state mutation
2. Vectorize past winners into ChromaDB using composite viral score > 5.0
3. Calculate dynamic topic weights on live impressions
4. Feed negative reinforcement back into system prompt exclusions`,
    call_to_action: "Bookmark this post for your next agent deployment sprint.",
    full_text: `A 4-step architectural checklist for deterministic agent memory:

1. Checkpoint node outputs after every state mutation
2. Vectorize past winners into ChromaDB using composite viral score > 5.0
3. Calculate dynamic topic weights on live impressions
4. Feed negative reinforcement back into system prompt exclusions

Bookmark this post for your next agent deployment sprint.

#Engineering #LangGraph #Memory`,
    rationale: "Numbered procedural steps optimized for bookmarking and engineering teams.",
    match_score: 8.7,
  },
];

export const MOCK_SELECTED_POST: MockSelectedPost = {
  draft: MOCK_DRAFTS[1],
  match_score: 9.4,
  evaluation_summary:
    "Your audience has historically saved opinion-driven technical posts more frequently than generic tutorials. The agent selected a contrarian hook based on this learned preference.",
  dosMatched: [
    "Quantified claim in opening 3 lines",
    "Contrarian angle addressing architectural waste",
    "Direct question call to action",
  ],
  dontsAvoided: ["No hype words ('groundbreaking', 'game changer')", "No generic buzzwords"],
  dos_matched: [
    "Quantified claim in opening 3 lines",
    "Contrarian angle addressing architectural waste",
    "Direct question call to action",
  ],
  donts_avoided: ["No hype words ('groundbreaking', 'game changer')", "No generic buzzwords"],
  scheduled_time: "Tuesday at 2:30 PM (Peak Reply Window)",
};

export const MOCK_MEMORY_INSIGHTS: MockMemoryInsights = {
  brand_name: "SocioTrack",
  total_winning_posts: 14,
  total_lessons_learned: 28,
  current_sentiment: {
    topic: "Cost Optimization & Deterministic State",
    sentiment_label: "cautious_and_demanding",
    sentiment_score: 0.68,
    summary: "68% of your audience is currently curious about cost optimization and ROI.",
    keywords: ["latency", "token-cost", "stategraph", "benchmarks", "roi"],
  },
  top_winning_posts: [
    {
      id: "win_1",
      topic: "Deterministic State Management",
      hook: "Everyone talks about scaling their business...",
      content: "Everyone talks about scaling their business. But what if the real competitive advantage isn't spending more?...",
      composite_score: 9.42,
      impressions: 24500,
      shares: 580,
      replies: 160,
      likes: 1120,
      key_takeaway: "Contrarian opinions outperform tutorials by 3.4x in saves.",
    },
    {
      id: "win_2",
      topic: "Token Cost Optimization",
      hook: "We analyzed 4,200 production runs across 18 teams...",
      content: "We analyzed 4,200 production runs across 18 teams deploying LangGraph StateGraph...",
      composite_score: 8.71,
      impressions: 18200,
      shares: 320,
      replies: 95,
      likes: 740,
      key_takeaway: "Benchmark numbers in opening sentence yield 92% scroll-stop rate.",
    },
  ],
  learned_lessons: [
    {
      id: "les_1",
      topic: "Contrarian Content",
      key_lesson: "Contrarian technical takes get 3.4x more saves than tutorials.",
      composite_score: 9.42,
      derived_at: "2026-11-06T14:20:00Z",
    },
    {
      id: "les_2",
      topic: "Peak Reply Window",
      key_lesson: "Tuesday & Thursday, 2:00 PM – 4:30 PM yields highest comment volume.",
      composite_score: 8.95,
      derived_at: "2026-11-05T18:10:00Z",
    },
    {
      id: "les_3",
      topic: "Practical Examples",
      key_lesson: "Posts featuring practical cost-saving examples generate 2.1x more shares.",
      composite_score: 8.64,
      derived_at: "2026-11-04T11:00:00Z",
    },
  ],
};
