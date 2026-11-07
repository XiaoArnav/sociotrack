"""
Person 2 & 4 Endpoint Verification: FastAPI Routes & Database Integration.
Tests:
- GET /health
- POST /api/generate-drafts
- POST /api/posts/approve
- GET /api/posts
- GET /api/memory/insights
- POST /api/simulator/feed-metrics
"""

import unittest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.db.session import init_db


class TestPerson2And4API(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()
        cls.client = TestClient(app)
        cls.brand_name = "APITestBrand"
        cls.topic = "Deterministic State Management with LangGraph"

    def test_01_health_check(self):
        res = self.client.get("/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "healthy")
        self.assertEqual(data["app"], "SocioTrack")

    def test_02_generate_drafts(self):
        payload = {
            "brand_name": self.brand_name,
            "topic": self.topic,
        }
        res = self.client.post("/api/generate-drafts", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["brand_name"], self.brand_name)
        self.assertEqual(len(data["drafts"]), 3)
        self.assertIn("selected_post", data)
        self.assertGreaterEqual(data["selected_post"]["match_score"], 0.0)

    def test_03_approve_post(self):
        payload = {
            "post_content": "Checkpointed state transitions slashed agent recovery latency by 64%.",
            "format": "Format A: Data-first",
            "scheduled_time": "2026-11-10T14:30:00Z",
            "approved_by": "qa_tester",
        }
        res = self.client.post("/api/posts/approve", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "approved")
        self.assertTrue("post_id" in data)

    def test_04_list_posts(self):
        res = self.client.get("/api/posts")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIsInstance(data, list)
        self.assertGreaterEqual(len(data), 1)

    def test_05_memory_insights(self):
        res = self.client.get(f"/api/memory/insights?brand_name={self.brand_name}&topic={self.topic}")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["brand_name"], self.brand_name)
        self.assertIn("current_sentiment", data)
        self.assertIn("top_winning_posts", data)
        self.assertIn("learned_lessons", data)

    def test_06_simulator_feed_metrics(self):
        payload = {
            "brand_name": self.brand_name,
            "topic": self.topic,
            "post_content": "Production agent workflows with LangGraph StateGraph.",
            "metrics": {
                "impressions": 10000,
                "shares": 160,
                "replies": 80,
                "likes": 400,
            },
        }
        res = self.client.post("/api/simulator/feed-metrics", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        # (160*3 + 80*2 + 400*1) / 10000 * 100 = (480 + 160 + 400) / 10000 * 100 = 10.4
        self.assertEqual(data["composite_score"], 10.4)
        self.assertTrue(data["qualifies_for_memory"])
        self.assertIsNotNone(data["key_lesson"])
        self.assertIsNotNone(data["memory_doc_id"])


if __name__ == "__main__":
    unittest.main()
