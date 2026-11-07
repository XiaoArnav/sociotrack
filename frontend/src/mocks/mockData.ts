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
    rationale: "Anchored on quantitative latency and cost benchmarks to capture technical leadership attention.",
    match_score: 9.8,
  },
  {
    id: "var_b",
    format: "Format B: Hot take",
    hook: "Hot take: 90% of teams building multi-agent systems don't need autonomous agent swarms.",
    body: `They need a deterministic, checkpointed state machine.

Autonomous open loops look magical in investor decks, but in production they burn enterprise budgets on infinite hallucination loops.

Here is what actually works:
1. A rigid LangGraph StateGraph with explicit memory contracts.
2. Deterministic validation checkpoints before external tool execution.
3. Memory is not a side effect—it is your entire operational moat.`,
    call_to_action: "Disagree? Where have you seen unconstrained autonomous multi-agent loops beat explicit workflows in prod?",
    full_text: `Hot take: 90% of teams building multi-agent systems don't need autonomous agent swarms.

They need a deterministic, checkpointed state machine.

Autonomous open loops look magical in investor decks, but in production they burn enterprise budgets on infinite hallucination loops.

Here is what actually works:
1. A rigid LangGraph StateGraph with explicit memory contracts.
2. Deterministic validation checkpoints before external tool execution.
3. Memory is not a side effect—it is your entire operational moat.

Disagree? Where have you seen unconstrained autonomous multi-agent loops beat explicit workflows in prod?

#SoftwareEngineering #AIAgents #TechDebate`,
    rationale: "Challenges prevailing industry hype with a battle-tested contrarian thesis to trigger practitioner debate.",
    match_score: 9.2,
  },
  {
    id: "var_c",
    format: "Format C: Tactical breakdown",
    hook: "How to architect an enterprise-ready agentic pipeline for LangGraph in 4 steps:",
    body: `Reliable production agents are built on disciplined state design, not prompt magic.

1. Enforce Typed State via Pydantic
   Never pass raw mutable dicts. Type-check memory_context, draft queues, and evaluation scores.

2. Decouple Memory Retrieval from LLM Generation
   Query winning patterns and real-time audience sentiment before invoking generation passes.

3. Embed a Brand Voice Critique Node
   Critique candidate outputs against Brand Dos & Don'ts before dispatching to users.

4. Closed-Loop Feedback Ingestion
   Calculate composite score: (Shares*3 + Replies*2 + Likes*1) / Impressions * 100. If > 5.0, embed winning lessons into long-term vector memory.`,
    call_to_action: "Bookmark this blueprint for your next sprint. Which step is currently your team's biggest challenge?",
    full_text: `How to architect an enterprise-ready agentic pipeline for LangGraph in 4 steps:

Reliable production agents are built on disciplined state design, not prompt magic.

1. Enforce Typed State via Pydantic
   Never pass raw mutable dicts. Type-check memory_context, draft queues, and evaluation scores.

2. Decouple Memory Retrieval from LLM Generation
   Query winning patterns and real-time audience sentiment before invoking generation passes.

3. Embed a Brand Voice Critique Node
   Critique candidate outputs against Brand Dos & Don'ts before dispatching to users.

4. Closed-Loop Feedback Ingestion
   Calculate composite score: (Shares*3 + Replies*2 + Likes*1) / Impressions * 100. If > 5.0, embed winning lessons into long-term vector memory.

Bookmark this blueprint for your next sprint. Which step is currently your team's biggest challenge?

#SystemDesign #LangGraph #SoftwareArchitecture`,
    rationale: "Step-by-step practical blueprint designed to maximize engineering bookmarks and repost velocity.",
    match_score: 9.6,
  },
];

export const MOCK_SELECTED_POST: MockSelectedPost = {
  draft: MOCK_DRAFTS[0],
  match_score: 9.8,
  evaluation_summary:
    "Evaluated against brand voice (Authoritative yet conversational, high-signal, zero-fluff). Achieved match score of 9.8/10. Demonstrated 5 brand dos and avoided all marketing hype constraints.",
  dos_matched: [
    "Backed by quantitative metrics & benchmarks (+0.8)",
    "Scannable bullet points and structured layout (+0.6)",
    "Engaging practitioner CTA (+0.5)",
    "Directly calibrated with audience demand for benchmark metrics (+0.5)",
  ],
  donts_avoided: [
    "Zero hollow marketing buzzwords or unsubstantiated superlatives",
    "Controlled hashtag usage (3 tags used)",
  ],
  scheduled_time: "Optimal distribution slot: Mon-Thu 09:30 AM EST",
};

export const MOCK_MEMORY_INSIGHTS: MockMemoryInsights = {
  brand_name: "SocioTrack",
  total_winning_posts: 12,
  total_lessons_learned: 8,
  current_sentiment: {
    topic: "Deterministic State Management with LangGraph",
    sentiment_label: "cautious_and_demanding",
    sentiment_score: 0.74,
    summary: "Engineers want verifiable benchmarks and state machine architectures over toy demos.",
    keywords: ["benchmarks", "state machines", "deterministic agents", "cost reduction"],
  },
  top_winning_posts: [
    {
      id: "post_01",
      topic: "Deterministic State Management with LangGraph",
      content: "We migrated our multi-agent pipelines to LangGraph StateGraph. P99 latency dropped 73% and recovery hit 99.4%.",
      hook: "We migrated our multi-agent pipelines from unbounded loops to LangGraph StateGraph.",
      composite_score: 8.8,
      impressions: 25000,
      shares: 320,
      replies: 140,
      likes: 850,
      key_takeaway: "Concrete latency & token cost benchmarks trigger 3x higher engineering shares.",
    },
    {
      id: "post_02",
      topic: "Agent Architecture Realities",
      content: "Hot take: 90% of 'multi-agent systems' are just overcomplicated while-loops.",
      hook: "Hot take: 90% of 'multi-agent systems' are overcomplicated while-loops.",
      composite_score: 7.2,
      impressions: 18000,
      shares: 210,
      replies: 190,
      likes: 620,
      key_takeaway: "Contrarian hook debunking agent swarms creates viral comment threads.",
    },
    {
      id: "post_03",
      topic: "Production LangGraph Framework",
      content: "4 rules for building bulletproof LangGraph workflows in production.",
      hook: "4 rules for building bulletproof LangGraph workflows in production:",
      composite_score: 7.9,
      impressions: 22000,
      shares: 290,
      replies: 95,
      likes: 710,
      key_takeaway: "Numbered actionable playbooks maximize bookmarking and reposts.",
    },
  ],
  learned_lessons: [
    {
      id: "lesson_01",
      topic: "Deterministic State Management with LangGraph",
      key_lesson: "P99 latency benchmarks and token reduction stats drive highest technical leadership share rates.",
      composite_score: 9.75,
      derived_at: "2026-11-06T18:20:00Z",
    },
    {
      id: "lesson_02",
      topic: "Agent Architecture Realities",
      key_lesson: "Debunking unconstrained autonomous swarms with deterministic state proof sparks 2.4x more comments.",
      composite_score: 8.4,
      derived_at: "2026-11-05T14:10:00Z",
    },
  ],
};
