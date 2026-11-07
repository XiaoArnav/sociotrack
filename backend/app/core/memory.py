"""
Vector search, ChromaDB memory storage, and composite scoring algorithm.
Owned by Person 1.
"""

import uuid
from typing import Any, Dict, List, Optional, Tuple
import chromadb
from chromadb.api import ClientAPI

from backend.app.config import settings
from backend.app.schemas.post_schema import EngagementMetricsSchema


def calculate_composite_score(
    shares: int,
    replies: int,
    likes: int,
    impressions: int,
    weight_shares: float = 3.0,
    weight_replies: float = 2.0,
    weight_likes: float = 1.0,
) -> float:
    """
    Computes composite engagement score:
    Score = ((Shares * 3) + (Replies * 2) + (Likes * 1)) / Impressions * 100
    Guards against division by zero.
    """
    if impressions <= 0:
        return 0.0
    raw_score = (
        (shares * weight_shares) + (replies * weight_replies) + (likes * weight_likes)
    ) / impressions * 100.0
    return round(float(raw_score), 2)


class VectorMemoryManager:
    """
    Vector search and long-term memory store for:
    1. Past high-performing winning posts
    2. Real-time audience sentiment data
    3. Distilled strategic lessons
    """

    def __init__(
        self,
        brand_name: str = "default_brand",
        client: Optional[ClientAPI] = None,
        persist_directory: Optional[str] = None,
    ):
        self.brand_name = brand_name
        sanitized = "".join(c if c.isalnum() else "_" for c in brand_name.lower())
        self.memory_weights: Dict[str, float] = {}

        if client is not None:
            self.client = client
        elif persist_directory:
            self.client = chromadb.PersistentClient(path=persist_directory)
        elif settings.CHROMA_PERSIST_DIRECTORY and settings.VECTOR_STORE_PROVIDER == "chroma_persistent":
            self.client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIRECTORY)
        else:
            self.client = chromadb.Client()

        self.posts_col = self.client.get_or_create_collection(
            name=f"{sanitized}_winning_posts",
            metadata={"description": "High-performing posts"}
        )
        self.sentiment_col = self.client.get_or_create_collection(
            name=f"{sanitized}_audience_sentiment",
            metadata={"description": "Audience sentiment signals"}
        )
        self.lessons_col = self.client.get_or_create_collection(
            name=f"{sanitized}_learned_lessons",
            metadata={"description": "Learned performance takeaways"}
        )

    def get_weight(self, key: str) -> float:
        """Retrieves dynamic weight for a topic or format (default: 1.0)."""
        return self.memory_weights.get(key, 1.0)

    def adjust_memory_weights(
        self,
        topic: str,
        score: float,
        format_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Dynamically adjusts memory weights based on performance.
        - High score (> 5.0): boosts topic & style weight by delta proportional to excess engagement.
        - Low score (<= 5.0): applies penalty dampening, downweighting style to prevent repetition.
        """
        old_topic_weight = self.get_weight(topic)
        old_format_weight = self.get_weight(format_name) if format_name else 1.0

        if score > 5.0:
            # Positive reinforcement delta (capped between +0.1 and +1.0)
            delta = round(min(1.0, (score - 5.0) / 10.0), 3)
            new_topic_weight = round(min(2.5, old_topic_weight + delta), 3)
            new_format_weight = round(min(2.5, old_format_weight + delta), 3)
            status = "boosted"
        else:
            # Negative penalty delta (capped between -0.05 and -0.4)
            delta = round(max(-0.4, (score - 5.0) / 15.0), 3)
            new_topic_weight = round(max(0.2, old_topic_weight + delta), 3)
            new_format_weight = round(max(0.2, old_format_weight + delta), 3)
            status = "penalized"

        self.memory_weights[topic] = new_topic_weight
        if format_name:
            self.memory_weights[format_name] = new_format_weight

        return {
            "topic": topic,
            "format": format_name,
            "composite_score": score,
            "topic_weight": new_topic_weight,
            "format_weight": new_format_weight,
            "delta": delta,
            "status": status,
        }

    def ingest_post(
        self,
        topic: str,
        content: str,
        metrics: EngagementMetricsSchema,
        hook: Optional[str] = None,
        key_takeaway: Optional[str] = None,
        post_id: Optional[str] = None,
    ) -> str:
        """Stores a high-performing post into vector memory."""
        doc_id = post_id or f"post_{uuid.uuid4().hex[:8]}"
        score = calculate_composite_score(
            shares=metrics.shares,
            replies=metrics.replies,
            likes=metrics.likes,
            impressions=metrics.impressions,
        )

        metadata = {
            "post_id": doc_id,
            "topic": topic,
            "impressions": int(metrics.impressions),
            "shares": int(metrics.shares),
            "replies": int(metrics.replies),
            "likes": int(metrics.likes),
            "composite_score": score,
            "hook": hook or content.split("\n")[0][:100],
            "key_takeaway": key_takeaway or "High engagement through clear practitioner value",
        }

        doc_text = f"Topic: {topic}\nTakeaway: {metadata['key_takeaway']}\nContent: {content}"
        self.posts_col.add(ids=[doc_id], documents=[doc_text], metadatas=[metadata])
        return doc_id

    def ingest_sentiment(
        self,
        topic: str,
        sentiment_label: str,
        sentiment_score: float,
        summary: str,
        keywords: Optional[List[str]] = None,
    ) -> str:
        """Indexes audience sentiment signals."""
        doc_id = f"sent_{uuid.uuid4().hex[:8]}"
        kw_str = ", ".join(keywords or [])
        metadata = {
            "topic": topic,
            "sentiment_label": sentiment_label,
            "sentiment_score": float(sentiment_score),
            "summary": summary,
            "keywords": kw_str,
        }
        doc_text = f"Topic: {topic} | Sentiment: {sentiment_label} ({sentiment_score:.2f}) | Summary: {summary} | Keywords: {kw_str}"
        self.sentiment_col.add(ids=[doc_id], documents=[doc_text], metadatas=[metadata])
        return doc_id

    def retrieve_top_posts(self, topic: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Pulls top past high-performing posts (up to limit) matching topic."""
        count = self.posts_col.count()
        if count == 0:
            return []

        n_results = min(limit, count)
        res = self.posts_col.query(query_texts=[topic], n_results=n_results)
        items: List[Dict[str, Any]] = []

        if res and "documents" in res and res["documents"]:
            docs = res["documents"][0]
            metas = res["metadatas"][0] if "metadatas" in res else []
            for i in range(len(docs)):
                items.append({
                    "content": docs[i],
                    "metadata": metas[i] if i < len(metas) else {},
                })

        # Sort primarily by composite score descending
        items.sort(key=lambda x: x.get("metadata", {}).get("composite_score", 0.0), reverse=True)
        return items

    def retrieve_sentiment(self, topic: str) -> Dict[str, Any]:
        """Pulls closest audience sentiment data."""
        count = self.sentiment_col.count()
        if count == 0:
            return {
                "sentiment_label": "curious_and_discerning",
                "sentiment_score": 0.70,
                "summary": "Audiences actively demand verifiable benchmarks over speculative marketing claims.",
                "keywords": "benchmarks, state management, latency, cost reduction",
            }

        res = self.sentiment_col.query(query_texts=[topic], n_results=1)
        if res and res.get("metadatas") and res["metadatas"][0]:
            return dict(res["metadatas"][0][0])

        return {
            "sentiment_label": "neutral_interested",
            "sentiment_score": 0.5,
            "summary": f"Interest in production {topic} practices.",
            "keywords": topic,
        }

    def retrieve_lessons(self, topic: str, limit: int = 3) -> List[Dict[str, Any]]:
        """Pulls top learned lessons."""
        count = self.lessons_col.count()
        if count == 0:
            return []
        n_results = min(limit, count)
        res = self.lessons_col.query(query_texts=[topic], n_results=n_results)
        items = []
        if res and res.get("documents") and res["documents"][0]:
            docs = res["documents"][0]
            metas = res.get("metadatas", [[]])[0]
            for i in range(len(docs)):
                items.append({
                    "lesson": docs[i],
                    "metadata": metas[i] if i < len(metas) else {},
                })
        return items

    def record_performance_and_learn(
        self,
        topic: str,
        post_content: str,
        metrics: EngagementMetricsSchema,
        format_name: Optional[str] = None,
    ) -> Tuple[float, bool, Optional[str], Optional[str], Dict[str, Any]]:
        """
        Executes learning logic:
        1. Computes composite score.
        2. Adjusts dynamic topic and style memory weights.
        3. If score > 5.0, extracts key lesson and embeds into vector memory.
        Returns: (composite_score, qualifies_for_memory, key_lesson, memory_doc_id, weight_adjustment)
        """
        score = calculate_composite_score(
            shares=metrics.shares,
            replies=metrics.replies,
            likes=metrics.likes,
            impressions=metrics.impressions,
            weight_shares=settings.WEIGHT_SHARES,
            weight_replies=settings.WEIGHT_REPLIES,
            weight_likes=settings.WEIGHT_LIKES,
        )

        # Adjust dynamic memory weights based on performance
        weight_adj = self.adjust_memory_weights(topic=topic, score=score, format_name=format_name)

        qualifies = score > settings.MIN_COMPOSITE_SCORE_THRESHOLD
        if not qualifies:
            return score, False, None, None, weight_adj

        # Synthesize strategic lesson
        if metrics.shares > metrics.replies and metrics.shares > 50:
            key_lesson = (
                f"High-share driver (score {score:.1f}): Framework breakdowns and hard benchmark data "
                f"generate viral peer-to-peer forwarding among technical leads."
            )
        elif metrics.replies > 30:
            key_lesson = (
                f"High-conversation driver (score {score:.1f}): Contrarian hooks with nuanced practitioner arguments "
                f"drive high comment counts and feed algorithm ranking."
            )
        else:
            key_lesson = (
                f"High-engagement driver (score {score:.1f}): Quantitative evidence combined with zero buzzwords "
                f"drives superior retention and engagement."
            )

        lesson_id = f"lesson_{uuid.uuid4().hex[:8]}"
        doc_text = f"Topic: {topic}\nWinning Lesson: {key_lesson}\nPost Excerpt: {post_content[:200]}"
        metadata = {
            "lesson_id": lesson_id,
            "topic": topic,
            "composite_score": score,
            "shares": int(metrics.shares),
            "replies": int(metrics.replies),
            "likes": int(metrics.likes),
            "impressions": int(metrics.impressions),
            "key_lesson": key_lesson,
            "adjusted_weight": weight_adj["topic_weight"],
        }

        self.lessons_col.add(ids=[lesson_id], documents=[doc_text], metadatas=[metadata])
        # Also persist to past winning posts to enrich retrieval
        self.ingest_post(
            topic=topic,
            content=post_content,
            metrics=metrics,
            key_takeaway=key_lesson,
            post_id=f"win_{lesson_id}"
        )

        return score, True, key_lesson, lesson_id, weight_adj

    def get_stats(self) -> Dict[str, int]:
        return {
            "winning_posts_count": self.posts_col.count(),
            "sentiment_records_count": self.sentiment_col.count(),
            "lessons_learned_count": self.lessons_col.count(),
        }


# Global registry for singleton brand memory managers
_MEMORY_STORES: Dict[str, VectorMemoryManager] = {}


def get_memory_manager(brand_name: str = "default_brand") -> VectorMemoryManager:
    if brand_name not in _MEMORY_STORES:
        _MEMORY_STORES[brand_name] = VectorMemoryManager(brand_name=brand_name)
    return _MEMORY_STORES[brand_name]
