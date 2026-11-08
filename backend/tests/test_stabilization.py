"""
Unit and integration tests for SocioTrack stabilization fixes:
- Fix 1: LangGraph pipeline execution in trigger_agent_draft_generation
- Fix 2: Evaluation donts_avoided mapping accuracy in evaluate_brand_voice_node
- Fix 3: Memory manager insert_lesson and weight persistence across restarts
"""
import pytest
import os
import shutil
import tempfile
from unittest.mock import MagicMock
from app.core.agent import (
    AgentGraphState,
    build_social_agent_graph,
    evaluate_brand_voice_node,
)
from app.schemas.post_schema import (
    BrandVoiceGuidelinesSchema,
    PostVariationSchema,
    PostFormat,
)
from app.core.memory import VectorMemoryManager
from app.services.agent_workflow import trigger_agent_draft_generation


def test_donts_avoided_mapping():
    """Verify that evaluate_brand_voice_node correctly sets donts_avoided without referencing best_dos."""
    guidelines = BrandVoiceGuidelinesSchema(
        dos=["Use concrete metrics", "Maintain an authoritative tone"],
        donts=["Zero hollow marketing hype", "Avoid hashtag stuffing"],
    )
    draft_a = PostVariationSchema(
        id="test_a",
        format=PostFormat.DATA_FIRST,
        hook="We achieved 99.9% uptime with 0 marketing hype.",
        body="Concrete metrics show 42% latency reduction.",
        call_to_action="Share your thoughts.",
        full_text="We achieved 99.9% uptime with 0 marketing hype. Concrete metrics show 42% latency reduction. Share your thoughts.",
        rationale="Data-backed.",
    )

    state = AgentGraphState(
        brand_name="TestBrand",
        topic="Architecture",
        drafts=[draft_a],
        brand_guidelines=guidelines,
    )

    res = evaluate_brand_voice_node(state)
    selected = res["selected_post"]
    assert selected is not None
    # dos_matched should contain dos
    assert any("concrete metrics" in d.lower() or "authoritative" in d.lower() for d in selected.dos_matched)
    # donts_avoided should NOT be identical to best_dos
    assert selected.donts_avoided != []
    for d in selected.donts_avoided:
        assert "hype" in d.lower() or "hashtag" in d.lower()


def test_memory_weight_persistence():
    """Verify that dynamic weights and lessons persist to disk and reload on new instance."""
    temp_dir = tempfile.mkdtemp()
    try:
        mgr1 = VectorMemoryManager(brand_name="PersistBrand", persist_directory=temp_dir)
        mgr1.insert_lesson(
            topic="Reliability",
            lesson="Deterministic state prevents infinite retry loops.",
            score=8.5,
            format_name="Format A: Data-first",
        )
        assert mgr1.get_weight("Format A: Data-first") > 1.0

        # Create new manager pointing to same persist directory
        mgr2 = VectorMemoryManager(brand_name="PersistBrand", persist_directory=temp_dir)
        # Verify format weight survived
        assert mgr2.get_weight("Format A: Data-first") == mgr1.get_weight("Format A: Data-first")
        assert mgr2.get_weight("Reliability") == mgr1.get_weight("Reliability")
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)


@pytest.mark.asyncio
async def test_trigger_agent_draft_generation_langgraph():
    """Verify that trigger_agent_draft_generation invokes LangGraph and yields 3 variations with evaluation."""
    brand = MagicMock()
    brand.name = "SocioTrack"
    brand.voice_description = "Rigorous, analytical, direct."
    brand.target_audience = "Distributed systems engineers"

    drafts, selected = await trigger_agent_draft_generation(
        brand=brand,
        topic="Fault-Tolerant State Machines",
        past_memories=["Always cite latency percentiles."],
    )

    assert len(drafts) == 3
    for d in drafts:
        assert d["topic"] == "Fault-Tolerant State Machines"
        assert d["status"] == "draft"
        assert len(d["content"]) > 30
        assert "memory_context_applied" in d

    assert selected is not None
    assert "match_score" in selected
    assert selected["match_score"] >= 6.0
    assert "dos_matched" in selected
    assert "donts_avoided" in selected
