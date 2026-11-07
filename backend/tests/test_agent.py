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
    run_agent_cycle,
    ingest_analytics,
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

    def test_05_run_agent_cycle_benchmark_within_six_seconds(self):
        """Person 1 Deliverable: run_agent_cycle executes within 6.0s deadline."""
        self._seed_sample_data()
        res = run_agent_cycle(
            brand_name=self.brand_name,
            topic=self.topic,
            memory_mgr=self.memory_mgr,
            timeout_seconds=6.0,
        )

        self.assertEqual(res["status"], "success")
        self.assertLess(res["execution_time_seconds"], 6.0)
        print(f"\n[Benchmark] run_agent_cycle Latency: {res['execution_time_ms']} ms (< 6000 ms)")

        # Verify output integrity
        self.assertEqual(len(res["drafts"]), 3)
        self.assertIsNotNone(res["selected_post"])
        self.assertIn("memory_context", res)
        self.assertIn("dynamic_weights", res["memory_context"])
        self.assertGreaterEqual(res["selected_post"]["match_score"], 0.0)

    def test_06_ingest_analytics_benchmark_and_memory_weight_adjustment(self):
        """Person 1 Deliverable: ingest_analytics executes within 6.0s & adjusts memory weights."""
        # 1. High-performing post
        res_high = ingest_analytics(
            brand_name=self.brand_name,
            topic=self.topic,
            post_content="StateGraph checkpointing reduced agent latency by 64% and token costs by 87%.",
            impressions=10000,
            shares=160,
            replies=80,
            likes=400,
            memory_mgr=self.memory_mgr,
            timeout_seconds=6.0,
        )

        self.assertEqual(res_high["status"], "success")
        self.assertLess(res_high["execution_time_seconds"], 6.0)
        self.assertEqual(res_high["composite_score"], 10.4)
        self.assertTrue(res_high["qualifies_for_memory"])
        self.assertIsNotNone(res_high["memory_doc_id"])
        self.assertEqual(res_high["memory_weight_adjustment"]["status"], "boosted")
        self.assertGreater(res_high["memory_weight_adjustment"]["topic_weight"], 1.0)
        print(f"[Benchmark] ingest_analytics (High Score) Latency: {res_high['execution_time_ms']} ms (< 6000 ms)")

        # 2. Low-performing post
        res_low = ingest_analytics(
            brand_name=self.brand_name,
            topic=self.topic,
            post_content="Generic post without benchmarks.",
            impressions=10000,
            shares=5,
            replies=5,
            likes=20,
            memory_mgr=self.memory_mgr,
            timeout_seconds=6.0,
        )

        self.assertEqual(res_low["status"], "success")
        self.assertLess(res_low["execution_time_seconds"], 6.0)
        self.assertEqual(res_low["composite_score"], 0.45)
        self.assertFalse(res_low["qualifies_for_memory"])
        self.assertIsNone(res_low["memory_doc_id"])
        self.assertEqual(res_low["memory_weight_adjustment"]["status"], "penalized")
        print(f"[Benchmark] ingest_analytics (Low Score) Latency: {res_low['execution_time_ms']} ms (< 6000 ms)")


if __name__ == "__main__":
    unittest.main()
