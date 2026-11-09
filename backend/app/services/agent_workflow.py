"""
Agent Workflow Bridge for AI Brand Intelligence & Generation.

Coordinates the brand generation workflow:
1. Queries brand voice, industry, and target audience via BrandContextEngine.
2. Injects recalled Hindsight & Vector memories (hook rules, past lessons).
3. Executes BrandContentGenerator (genuine AI provider or context-aware synthesis).
4. Evaluates drafts against brand voice and platform rules.
"""

from typing import List, Dict, Any, Tuple, Optional
from app.config import settings

try:
    from app.core.agent import build_social_agent_graph, AgentGraphState
    from app.schemas.post_schema import BrandVoiceGuidelinesSchema, PostFormat
    from app.core.memory import get_memory_manager
    from app.services.brand_context_engine import (
        build_brand_context_from_brand,
        BrandContextSummary,
    )
    from app.services.brand_content_generator import (
        generate_brand_drafts,
        BrandGenerationResult,
    )
except ImportError:
    from backend.app.core.agent import build_social_agent_graph, AgentGraphState
    from backend.app.schemas.post_schema import BrandVoiceGuidelinesSchema, PostFormat
    from backend.app.core.memory import get_memory_manager
    from backend.app.services.brand_context_engine import (
        build_brand_context_from_brand,
        BrandContextSummary,
    )
    from backend.app.services.brand_content_generator import (
        generate_brand_drafts,
        BrandGenerationResult,
    )


async def trigger_agent_draft_generation(
    brand: Any,
    topic: str,
    past_memories: List[str],
    platform: str = "Instagram",
    target_tone: Optional[str] = None,
    objective: Optional[str] = None,
    custom_instructions: Optional[str] = None,
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """
    Executes brand-specific draft generation with real model calls or context-aware fallback.
    Returns (draft_specs, selected_post_details).
    """
    brand_name = getattr(brand, "name", "SocioTrack")

    # Fetch recent hooks from vector memory for anti-repetition check
    mem_mgr = get_memory_manager(brand_name)
    recent_hooks = mem_mgr.retrieve_recent_hooks(limit=10)

    # 1. Synthesize structured Brand Context
    brand_context = build_brand_context_from_brand(brand, db_memories=past_memories)

    # 2. Generate Brand-Specific Drafts & Evaluate Voice
    gen_result: BrandGenerationResult = await generate_brand_drafts(
        brand_context=brand_context,
        topic=topic,
        platform=platform,
        target_tone=target_tone,
        objective=objective,
        custom_instructions=custom_instructions,
        recent_hooks=recent_hooks,
        allow_model_call=True,
    )

    draft_specs = []
    for d in gen_result.drafts:
        draft_specs.append({
            "id": d.id,
            "topic": topic,
            "hook_style": d.format,
            "format": d.format,
            "content": d.full_text,
            "status": "draft",
            "memory_context_applied": brand_context.winning_memory_insights[:3] if brand_context.winning_memory_insights else [
                "Focus on concrete value and practical application.",
                "Maintain clear audience-specific framing.",
            ],
            "rationale": d.rationale,
            "recommendation_rationale": d.recommendation_rationale,
            "supporting_evidence": d.supporting_evidence,
            "memories_applied": brand_context.winning_memory_insights[:2],
            "confidence_score": d.confidence_score,
            "known_limitations": d.known_limitations,
            "platform_target": d.platform_target,
            "anti_repetition_passed": d.anti_repetition_passed,
            "match_score": d.evaluation.match_score,
            "evaluation": d.evaluation.model_dump(),
            "dos_matched": d.evaluation.dos_matched,
            "donts_avoided": d.evaluation.donts_avoided,
            "unsupported_claims": d.evaluation.unsupported_claims,
            "improvement_suggestions": d.evaluation.improvement_suggestions,
            # Provenance
            "is_ai_generated": d.is_ai_generated,
            "generation_method": d.generation_method,
            "provider": d.provider,
            "model": d.model,
            "latency_ms": d.latency_ms,
            "fallback_reason": d.fallback_reason,
            "assumptions_made": d.assumptions_made,
        })

    # Prepare selected winner post info
    winner = gen_result.selected_draft
    selected_info = {
        "match_score": winner.evaluation.match_score,
        "evaluation_summary": winner.evaluation.critique_summary,
        "dos_matched": winner.evaluation.dos_matched,
        "donts_avoided": winner.evaluation.donts_avoided,
        "unsupported_claims": winner.evaluation.unsupported_claims,
        "improvement_suggestions": winner.evaluation.improvement_suggestions,
        "format": winner.format,
        "content": winner.full_text,
        "scheduled_time": "Optimal distribution window: Mon-Thu 09:30 AM EST",
        "is_ai_generated": winner.is_ai_generated,
        "provider": winner.provider,
        "model": winner.model,
    }

    return draft_specs, selected_info
