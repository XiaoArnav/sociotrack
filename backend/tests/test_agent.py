"""
Person 1 Standalone Test: LangGraph StateGraph & Vector Memory.
Tests:
1. Ingesting 3 past winning posts into in-memory ChromaDB.
2. Running the LangGraph StateGraph to produce 3 variations and select the winning scheduled post.
3. Updating memory with a high score post (score > 5.0) and proving the agent learns and retrieves the lesson.
4. Updating memory with a low score post (score <= 5.0) and confirming rejection from long-term memory.
"""

import unittest
import uuid
import chromadb

from backend.app.schemas.post_schema import (
    BrandVoiceGuidelinesSchema,
    EngagementMetricsSchema,
    PostFormat,
)
from backend.app.core.memory import (
    VectorMemoryManager,
    calculate_composite_score,
)
from backend.app.core.agent import (
    AgentGraphState,
    SocialEngagementAgent,
    build_social_agent_graph,
)


class TestPerson1Agent(unittest.TestCase):
    def setUp(self):
        self.brand_name = f"TestBrand_{uuid.uuid4().hex[:6]}"
        self.chroma_client = chromadb.Client()
        self.memory_mgr = VectorMemoryManager(
            brand_name=self.brand_name,
            client=self.chroma_client,
        )
        self.agent = SocialEngagementAgent(memory_mgr=self.memory_mgr)
        self.topic = "Deterministic State Management with LangGraph"

    def _seed_sample_data(self):
        p1_content = "We dropped agent latency by 73% using LangGraph StateGraph."
        m1 = EngagementMetricsSchema(impressions=20000, shares=250, replies=100, likes=600)
        self.memory_mgr.ingest_post(
            topic=self.topic,
            content=p1_content,
            metrics=m1,
            hook="We dropped agent latency by 73% using LangGraph StateGraph.",
            key_takeaway="Concrete benchmarks drive high engineering reposts.",
        )

        p2_content = "Hot take: Autonomous multi-agent loops burn enterprise budgets."
        m2 = EngagementMetricsSchema(impressions=15000, shares=180, replies=150, likes=500)
        self.memory_mgr.ingest_post(
            topic=self.topic,
            content=p2_content,
            metrics=m2,
            hook="Hot take: Autonomous multi-agent loops burn enterprise budgets.",
            key_takeaway="Contrarian perspective sparks viral practitioner comments.",
        )

        p3_content = "4 rules for bulletproof LangGraph workflows in production."
        m3 = EngagementMetricsSchema(impressions=22000, shares=290, replies=90, likes=700)
        self.memory_mgr.ingest_post(
            topic=self.topic,
            content=p3_content,
            metrics=m3,
            hook="4 rules for bulletproof LangGraph workflows in production.",
            key_takeaway="Numbered actionable playbooks maximize engineering bookmarks.",
        )

        self.memory_mgr.ingest_sentiment(
            topic=self.topic,
            sentiment_label="cautious_and_demanding",
            sentiment_score=0.74,
            summary="Engineers want verifiable benchmarks over speculative marketing claims.",
            keywords=["benchmarks", "state machines", "cost reduction"],
        )

    def test_01_ingest_winning_posts(self):
        self._seed_sample_data()
        stats = self.memory_mgr.get_stats()
        self.assertEqual(stats["winning_posts_count"], 3)
        self.assertEqual(stats["sentiment_records_count"], 1)

    def test_02_run_graph_and_produce_post(self):
        self._seed_sample_data()
        result: AgentGraphState = self.agent.generate_drafts(
            brand_name=self.brand_name,
            topic=self.topic,
            brand_guidelines=BrandVoiceGuidelinesSchema(),
        )

        # 1. Memory context retrieved
        self.assertIsNotNone(result.memory_context)
        self.assertIn("top_past_posts", result.memory_context)
        self.assertGreaterEqual(len(result.memory_context["top_past_posts"]), 1)

        # 2. Exactly 3 distinct draft variations
        self.assertEqual(len(result.drafts), 3)
        formats = [d.format for d in result.drafts]
        self.assertIn(PostFormat.DATA_FIRST, formats)
        self.assertIn(PostFormat.HOT_TAKE, formats)
        self.assertIn(PostFormat.TACTICAL_BREAKDOWN, formats)

        # 3. Selected best post with 0-10 score
        self.assertIsNotNone(result.selected_post)
        self.assertGreaterEqual(result.selected_post.match_score, 0.0)
        self.assertLessEqual(result.selected_post.match_score, 10.0)
        self.assertIsNotNone(result.selected_post.scheduled_time)

    def test_03_memory_update_high_score_and_learn(self):
        initial_stats = self.memory_mgr.get_stats()

        # Score: (150*3 + 75*2 + 400*1) / 10000 * 100 = (450 + 150 + 400) / 10000 * 100 = 10.0 > 5.0
        metrics = EngagementMetricsSchema(impressions=10000, shares=150, replies=75, likes=400)
        result: AgentGraphState = self.agent.evaluate_performance(
            brand_name=self.brand_name,
            topic=self.topic,
            post_content="StateGraph checkpointing reduced agent latency by 64% and token costs by 87%.",
            metrics=metrics,
        )

        fb = result.performance_feedback
        self.assertIsNotNone(fb)
        self.assertEqual(fb.composite_score, 10.0)
        self.assertTrue(fb.qualifies_for_memory)
        self.assertIsNotNone(fb.key_lesson)
        self.assertIsNotNone(fb.memory_doc_id)

        # Verify insertion into memory
        updated_stats = self.memory_mgr.get_stats()
        self.assertEqual(
            updated_stats["lessons_learned_count"],
            initial_stats["lessons_learned_count"] + 1,
        )

        # Prove retrieval of the newly learned lesson
        lessons = self.memory_mgr.retrieve_lessons(self.topic, limit=1)
        self.assertTrue(len(lessons) >= 1)
        self.assertIn("Winning Lesson", lessons[0]["lesson"])

    def test_04_memory_update_low_score_threshold(self):
        # Score: (5*3 + 5*2 + 20*1) / 10000 * 100 = 0.45 <= 5.0
        metrics = EngagementMetricsSchema(impressions=10000, shares=5, replies=5, likes=20)
        result: AgentGraphState = self.agent.evaluate_performance(
            brand_name=self.brand_name,
            topic=self.topic,
            post_content="Generic post without benchmarks.",
            metrics=metrics,
        )

        fb = result.performance_feedback
        self.assertIsNotNone(fb)
        self.assertEqual(fb.composite_score, 0.45)
        self.assertFalse(fb.qualifies_for_memory)
        self.assertIsNone(fb.memory_doc_id)


if __name__ == "__main__":
    unittest.main()
