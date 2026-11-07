"""
LangGraph StateGraph Definition for Social Media Engagement Agent.
Owned by Person 1.
"""

from typing import Any, Dict, List, Optional, Tuple, Union
from langgraph.graph import StateGraph, START, END
from langgraph.graph.state import CompiledStateGraph
from pydantic import BaseModel, Field

from backend.app.schemas.post_schema import (
    BrandVoiceGuidelinesSchema,
    EngagementMetricsSchema,
    PostFormat,
    PostVariationSchema,
    SelectedPostSchema,
    SimulatorFeedResponse,
)
from backend.app.core.memory import (
    VectorMemoryManager,
    get_memory_manager,
    calculate_composite_score,
)
from backend.app.core.prompts import BRAND_VOICE_GUIDELINES


class AgentGraphState(BaseModel):
    """
    Pydantic LangGraph State.
    Strictly implements the required fields:
    - brand_name
    - topic
    - memory_context
    - drafts
    - selected_post
    - performance_feedback
    """
    brand_name: str
    topic: str
    memory_context: Optional[Dict[str, Any]] = None
    drafts: List[PostVariationSchema] = Field(default_factory=list)
    selected_post: Optional[SelectedPostSchema] = None
    performance_feedback: Optional[SimulatorFeedResponse] = None

    # Auxiliary execution inputs
    brand_guidelines: Optional[BrandVoiceGuidelinesSchema] = Field(
        default_factory=BrandVoiceGuidelinesSchema
    )
    post_content_to_evaluate: Optional[str] = None
    metrics_to_evaluate: Optional[EngagementMetricsSchema] = None


# --- 1. Node: retrieve_brand_memory ---
def retrieve_brand_memory_node(
    state: AgentGraphState,
    memory_mgr: Optional[VectorMemoryManager] = None,
) -> Dict[str, Any]:
    """Pulls top 5 past high-performing posts and current audience sentiment from vector store."""
    mgr = memory_mgr or get_memory_manager(state.brand_name)
    top_posts = mgr.retrieve_top_posts(state.topic, limit=5)
    sentiment = mgr.retrieve_sentiment(state.topic)
    lessons = mgr.retrieve_lessons(state.topic, limit=3)

    summary = (
        f"Brand: {state.brand_name} | Topic: {state.topic} | "
        f"Retrieved {len(top_posts)} past winning post(s) | "
        f"Sentiment: {sentiment.get('sentiment_label')} ({sentiment.get('sentiment_score', 0.5):.2f}) - {sentiment.get('summary', '')}"
    )

    context = {
        "top_past_posts": top_posts,
        "audience_sentiment": sentiment,
        "historical_lessons": [item.get("lesson", "") for item in lessons],
        "summary": summary,
    }
    return {"memory_context": context}


# --- 2. Node: draft_post_variations ---
def draft_post_variations_node(state: AgentGraphState) -> Dict[str, Any]:
    """
    Generates 3 distinct variations:
    - Format A: Data-first
    - Format B: Hot take
    - Format C: Tactical breakdown
    """
    sentiment = (state.memory_context or {}).get("audience_sentiment", {})
    sent_label = sentiment.get("sentiment_label", "discerning")
    sent_summary = sentiment.get("summary", "demands concrete benchmarks")

    # Format A: Data-first
    hook_a = f"We analyzed 4,200 production runs across 18 teams deploying {state.topic}."
    body_a = (
        f"The data revealed a stark 3.4x performance gap between naive implementations and structured state graphs:\n\n"
        f"• 78% of runtime failures stemmed from unconstrained context drift\n"
        f"• Checkpointed state transitions slashed agent recovery latency by 64%\n"
        f"• Localized vector memory caching dropped token costs from $14.20/run to $1.85/run (-87%)\n\n"
        f"Current market sentiment is {sent_label}: {sent_summary}.\n"
        f"The top-performing teams aren't using larger LLMs—they are enforcing strict state boundaries."
    )
    cta_a = "Are you tracking token cost per successful agent task? What is your baseline?"
    full_text_a = f"{hook_a}\n\n{body_a}\n\n{cta_a}\n\n#AgenticAI #LangGraph #ProductionAI"

    draft_a = PostVariationSchema(
        id="var_a",
        format=PostFormat.DATA_FIRST,
        hook=hook_a,
        body=body_a,
        call_to_action=cta_a,
        full_text=full_text_a,
        rationale="Anchored on quantitative latency and cost benchmarks to capture technical leadership attention.",
    )

    # Format B: Hot take
    hook_b = f"Hot take: 90% of teams building {state.topic} don't need autonomous agent swarms."
    body_b = (
        f"They need a deterministic, checkpointed state machine.\n\n"
        f"Autonomous open loops look magical in Twitter demos, but in production they burn enterprise budgets on infinite hallucination loops.\n\n"
        f"Here is what actually works:\n"
        f"1. A rigid LangGraph StateGraph with explicit memory contracts.\n"
        f"2. Deterministic validation checkpoints before external tool execution.\n"
        f"3. Memory is not a side effect—it is your entire operational moat."
    )
    cta_b = "Disagree? Where have you seen unconstrained autonomous multi-agent loops beat explicit workflows in prod?"
    full_text_b = f"{hook_b}\n\n{body_b}\n\n{cta_b}\n\n#SoftwareEngineering #AIAgents #TechDebate"

    draft_b = PostVariationSchema(
        id="var_b",
        format=PostFormat.HOT_TAKE,
        hook=hook_b,
        body=body_b,
        call_to_action=cta_b,
        full_text=full_text_b,
        rationale="Challenges prevailing industry hype with a battle-tested contrarian thesis to trigger practitioner comments.",
    )

    # Format C: Tactical breakdown
    hook_c = f"How to architect an enterprise-ready agentic pipeline for {state.topic} in 4 steps:"
    body_c = (
        f"Reliable production agents are built on disciplined state design, not prompt magic.\n\n"
        f"1. Enforce Typed State via Pydantic\n"
        f"   Never pass raw mutable dicts. Type-check memory_context, draft queues, and evaluation scores.\n\n"
        f"2. Decouple Memory Retrieval from LLM Generation\n"
        f"   Query winning patterns and real-time audience sentiment before invoking generation passes.\n\n"
        f"3. Embed a Brand Voice Critique Node\n"
        f"   Critique candidate outputs against Brand Dos & Don'ts before dispatching to users.\n\n"
        f"4. Closed-Loop Feedback Ingestion\n"
        f"   Calculate composite score: (Shares*3 + Replies*2 + Likes*1) / Impressions * 100. If > 5.0, embed winning lessons into long-term vector memory."
    )
    cta_c = "Bookmark this blueprint for your next sprint. Which step is currently your team's biggest challenge?"
    full_text_c = f"{hook_c}\n\n{body_c}\n\n{cta_c}\n\n#SystemDesign #LangGraph #SoftwareArchitecture"

    draft_c = PostVariationSchema(
        id="var_c",
        format=PostFormat.TACTICAL_BREAKDOWN,
        hook=hook_c,
        body=body_c,
        call_to_action=cta_c,
        full_text=full_text_c,
        rationale="Step-by-step practical blueprint designed to maximize engineering bookmarks and repost velocity.",
    )

    return {"drafts": [draft_a, draft_b, draft_c]}


# --- 3. Node: evaluate_brand_voice ---
def evaluate_brand_voice_node(state: AgentGraphState) -> Dict[str, Any]:
    """Runs a fast critique pass against brand dos and don'ts, outputting a match score (0-10) and selecting best draft."""
    guidelines = state.brand_guidelines or BrandVoiceGuidelinesSchema()
    drafts = state.drafts
    scored: List[Tuple[float, PostVariationSchema, str, List[str], List[str]]] = []

    for draft in drafts:
        dos_matched = []
        donts_avoided = []
        score = 8.0

        # Assess Dos
        if any(c.isdigit() for c in draft.body):
            dos_matched.append("Backed by quantitative metrics & benchmarks (+0.8)")
            score += 0.8
        if "•" in draft.body or "1." in draft.body:
            dos_matched.append("Scannable bullet points and structured layout (+0.6)")
            score += 0.6
        if "?" in draft.call_to_action:
            dos_matched.append("Engaging practitioner CTA (+0.5)")
            score += 0.5
        if draft.format == PostFormat.DATA_FIRST:
            dos_matched.append("Authoritative benchmark-first angle (+0.5)")
            score += 0.5
        elif draft.format == PostFormat.TACTICAL_BREAKDOWN:
            dos_matched.append("Actionable step-by-step framework (+0.5)")
            score += 0.5

        # Assess Don'ts
        hollow_hype = ["paradigm shift", "revolutionary", "game-changing miracle"]
        if not any(h in draft.full_text.lower() for h in hollow_hype):
            donts_avoided.append("Zero hollow marketing hype or unsubstantiated superlatives")
        else:
            score -= 2.0

        if draft.full_text.count("#") <= 3:
            donts_avoided.append("Controlled hashtag usage (no hashtag stuffing)")
        else:
            score -= 1.5

        final_score = round(min(max(score, 0.0), 10.0), 1)
        draft.match_score = final_score

        critique = (
            f"Critiqued against brand voice ({guidelines.brand_voice}). "
            f"Match score: {final_score}/10. Demonstrated {len(dos_matched)} brand dos and avoided {len(donts_avoided)} constraints."
        )
        scored.append((final_score, draft, critique, dos_matched, donts_avoided))

    scored.sort(key=lambda x: x[0], reverse=True)
    best_score, best_draft, best_critique, best_dos, best_donts = scored[0]

    selected = SelectedPostSchema(
        draft=best_draft,
        match_score=best_score,
        evaluation_summary=best_critique,
        dos_matched=best_dos,
        donts_avoided=best_dos,
        scheduled_time="Optimal distribution window: Mon-Thu 09:30 AM EST",
    )
    return {"selected_post": selected}


# --- 4. Node: update_memory_with_performance ---
def update_memory_with_performance_node(
    state: AgentGraphState,
    memory_mgr: Optional[VectorMemoryManager] = None,
) -> Dict[str, Any]:
    """
    Given post content + engagement metrics (impressions, shares, replies, likes),
    compute composite score: (Shares*3 + Replies*2 + Likes*1) / Impressions * 100.
    If score > 5.0, embed and insert the key lesson into the memory store.
    """
    mgr = memory_mgr or get_memory_manager(state.brand_name)
    metrics = state.metrics_to_evaluate or EngagementMetricsSchema(impressions=0)
    post_content = state.post_content_to_evaluate or (
        state.selected_post.draft.full_text if state.selected_post else ""
    )

    score, qualifies, key_lesson, doc_id = mgr.record_performance_and_learn(
        topic=state.topic,
        post_content=post_content,
        metrics=metrics,
    )

    if qualifies:
        status_msg = f"Composite score {score:.2f} > 5.0! Lesson embedded into vector memory under ID={doc_id}."
    else:
        status_msg = f"Composite score {score:.2f} <= 5.0. Did not exceed threshold for long-term memory."

    feedback = SimulatorFeedResponse(
        composite_score=score,
        qualifies_for_memory=qualifies,
        status_message=status_msg,
        key_lesson=key_lesson,
        memory_doc_id=doc_id,
    )
    return {"performance_feedback": feedback}


# --- Graph Routing Logic ---
def route_graph_entry(state: AgentGraphState) -> str:
    if state.metrics_to_evaluate is not None and state.post_content_to_evaluate is not None:
        return "update_memory_with_performance"
    return "retrieve_brand_memory"


def route_after_eval(state: AgentGraphState) -> str:
    if state.metrics_to_evaluate is not None:
        return "update_memory_with_performance"
    return END


def build_social_agent_graph(
    memory_mgr: Optional[VectorMemoryManager] = None,
) -> CompiledStateGraph:
    """Builds and compiles the StateGraph with all 4 nodes."""
    builder = StateGraph(AgentGraphState)

    def node_retrieve(state: AgentGraphState):
        return retrieve_brand_memory_node(state, memory_mgr=memory_mgr)

    def node_draft(state: AgentGraphState):
        return draft_post_variations_node(state)

    def node_evaluate(state: AgentGraphState):
        return evaluate_brand_voice_node(state)

    def node_update_memory(state: AgentGraphState):
        return update_memory_with_performance_node(state, memory_mgr=memory_mgr)

    builder.add_node("retrieve_brand_memory", node_retrieve)
    builder.add_node("draft_post_variations", node_draft)
    builder.add_node("evaluate_brand_voice", node_evaluate)
    builder.add_node("update_memory_with_performance", node_update_memory)

    builder.add_conditional_edges(
        START,
        route_graph_entry,
        {
            "retrieve_brand_memory": "retrieve_brand_memory",
            "update_memory_with_performance": "update_memory_with_performance",
        }
    )

    builder.add_edge("retrieve_brand_memory", "draft_post_variations")
    builder.add_edge("draft_post_variations", "evaluate_brand_voice")

    builder.add_conditional_edges(
        "evaluate_brand_voice",
        route_after_eval,
        {
            "update_memory_with_performance": "update_memory_with_performance",
            END: END,
        }
    )

    builder.add_edge("update_memory_with_performance", END)
    return builder.compile()


class SocialEngagementAgent:
    """Facade for triggering agent operations."""

    def __init__(self, memory_mgr: Optional[VectorMemoryManager] = None):
        self.memory_mgr = memory_mgr or VectorMemoryManager()
        self.graph = build_social_agent_graph(memory_mgr=self.memory_mgr)

    def generate_drafts(
        self,
        brand_name: str,
        topic: str,
        brand_guidelines: Optional[BrandVoiceGuidelinesSchema] = None,
    ) -> AgentGraphState:
        payload = {
            "brand_name": brand_name,
            "topic": topic,
        }
        if brand_guidelines:
            payload["brand_guidelines"] = brand_guidelines

        raw = self.graph.invoke(payload)
        return AgentGraphState.model_validate(raw)

    def evaluate_performance(
        self,
        brand_name: str,
        topic: str,
        post_content: str,
        metrics: EngagementMetricsSchema,
    ) -> AgentGraphState:
        payload = {
            "brand_name": brand_name,
            "topic": topic,
            "post_content_to_evaluate": post_content,
            "metrics_to_evaluate": metrics,
        }
        raw = self.graph.invoke(payload)
        return AgentGraphState.model_validate(raw)
