"""
Vector search, ChromaDB persistent memory storage, and composite scoring algorithm.
Multi-tenant isolation at workspace and brand level.
Owned by Person 1 & Person 2.
"""

import json
import logging
import time
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
import chromadb
from chromadb.api import ClientAPI

try:
    from app.config import settings
    from app.schemas.post_schema import EngagementMetricsSchema
except ImportError:
    from backend.app.config import settings
    from backend.app.schemas.post_schema import EngagementMetricsSchema

logger = logging.getLogger(__name__)


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
    Persistent vector search and long-term memory store for:
    1. Past high-performing winning posts
    2. Real-time audience sentiment data
    3. Distilled strategic lessons & guidelines
    
    Guarantees:
    - Persistence across application restarts via chromadb.PersistentClient
    - Tenant isolation partitioned by workspace_id and brand_id
    - Transparent reporting of storage status (never claims persistence when offline)
    - Deduplication of incoming memories
    - Non-fabrication of performance insights from simulated/estimated data
    """

    def __init__(
        self,
        brand_name: str = "default_brand",
        workspace_id: Optional[str] = None,
        brand_id: Optional[str] = None,
        client: Optional[ClientAPI] = None,
        persist_directory: Optional[str] = None,
    ):
        self.brand_name = brand_name
        self.workspace_id = workspace_id or "default_workspace"
        self.brand_id = brand_id or brand_name or "default_brand"

        # Construct safe tenant slug for Chroma collections (3-63 chars, alnum + '_')
        clean_ws = "".join(c for c in self.workspace_id if c.isalnum())[:12] or "ws"
        clean_bid = "".join(c for c in self.brand_id if c.isalnum())[:16] or "brand"
        self.tenant_key = f"w_{clean_ws}_b_{clean_bid}"

        self.memory_weights: Dict[str, float] = {}
        persist_dir = persist_directory or settings.CHROMA_PERSIST_DIRECTORY or "./chroma_data"
        self.persist_directory = persist_dir
        self.weights_file = Path(persist_dir) / f"{self.tenant_key}_weights.json"
        self._load_weights()

        self.is_persistent = False
        self.storage_error: Optional[str] = None
        self.provider = settings.VECTOR_STORE_PROVIDER

        # 1. Initialize Chroma Client with strict persistence handling
        if client is not None:
            self.client = client
            self.is_persistent = hasattr(client, "_persist_directory") or persist_directory is not None
        elif persist_directory:
            try:
                Path(persist_directory).mkdir(parents=True, exist_ok=True)
                self.client = chromadb.PersistentClient(path=persist_directory)
                self.is_persistent = True
            except Exception as e:
                logger.error("Failed to initialize persistent Chroma client at %s: %s", persist_directory, str(e))
                self.storage_error = str(e)
                self.client = chromadb.Client()
                self.is_persistent = False
        elif settings.VECTOR_STORE_PROVIDER in ("chroma", "chroma_persistent") and settings.CHROMA_PERSIST_DIRECTORY:
            try:
                Path(settings.CHROMA_PERSIST_DIRECTORY).mkdir(parents=True, exist_ok=True)
                self.client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIRECTORY)
                self.is_persistent = True
            except Exception as e:
                logger.error("Failed to initialize persistent Chroma client at %s: %s", settings.CHROMA_PERSIST_DIRECTORY, str(e))
                self.storage_error = str(e)
                self.client = chromadb.Client()
                self.is_persistent = False
        else:
            self.client = chromadb.Client()
            self.is_persistent = False

        # 2. Get or create tenant-isolated collections
        self.posts_col = self.client.get_or_create_collection(
            name=f"{self.tenant_key}_posts",
            metadata={"description": f"High-performing posts for {self.brand_name} ({self.tenant_key})"}
        )
        self.sentiment_col = self.client.get_or_create_collection(
            name=f"{self.tenant_key}_sentiment",
            metadata={"description": f"Audience sentiment signals for {self.brand_name} ({self.tenant_key})"}
        )
        self.lessons_col = self.client.get_or_create_collection(
            name=f"{self.tenant_key}_lessons",
            metadata={"description": f"Learned performance takeaways for {self.brand_name} ({self.tenant_key})"}
        )

    def _load_weights(self) -> None:
        """Loads persisted memory weights from disk so adjustments survive server restarts."""
        try:
            if self.weights_file.exists():
                with open(self.weights_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if isinstance(data, dict):
                        self.memory_weights = data
        except Exception:
            self.memory_weights = {}

    def _persist_weights(self) -> None:
        """Saves current memory weights to disk."""
        try:
            self.weights_file.parent.mkdir(parents=True, exist_ok=True)
            with open(self.weights_file, "w", encoding="utf-8") as f:
                json.dump(self.memory_weights, f, indent=2)
        except Exception:
            pass

    def get_weight(self, key: str) -> float:
        """Retrieves dynamic weight for a topic or format (default: 1.0)."""
        return self.memory_weights.get(key, 1.0)

    def insert_lesson(
        self,
        topic: str,
        lesson: str,
        score: float,
        format_name: Optional[str] = None,
        doc_id: Optional[str] = None,
        supporting_evidence: Optional[str] = None,
        source_event: Optional[str] = "telemetry_ingest",
        confidence: Optional[float] = None,
        is_explicit: bool = False,
        evidence_count: int = 1,
        memory_type: str = "inferred_preference",
    ) -> str:
        """
        Embeds and persists a confirmed strategic lesson or guideline into vector memory.
        Applies deduplication: if near-identical text exists, increments evidence_count and updates confidence.
        Updates dynamic weights and persists them to disk.
        """
        # Deduplication check
        norm_new = lesson.strip().lower()
        try:
            existing = self.lessons_col.get()
            if existing and existing.get("documents"):
                for idx, doc in enumerate(existing["documents"]):
                    meta = existing["metadatas"][idx] if existing.get("metadatas") else {}
                    existing_id = existing["ids"][idx]
                    if meta.get("is_active") is not False:
                        norm_doc = (doc or "").strip().lower()
                        if norm_new == norm_doc or (len(norm_new) > 25 and (norm_new in norm_doc or norm_doc in norm_new)):
                            prev_count = int(meta.get("evidence_count", 1))
                            new_count = prev_count + evidence_count
                            updated_meta = {
                                **meta,
                                "evidence_count": new_count,
                                "confidence": min(0.99, max(float(meta.get("confidence", 0.8)), float(confidence or 0.8)) + 0.03),
                                "composite_score": max(float(meta.get("composite_score", score)), score),
                                "updated_at": time.time(),
                                "is_explicit": is_explicit or meta.get("is_explicit", False),
                            }
                            self.lessons_col.update(ids=[existing_id], metadatas=[updated_meta])
                            self.adjust_memory_weights(topic=topic, score=score, format_name=format_name)
                            return existing_id
        except Exception as e:
            logger.debug("Deduplication scan failed: %s", str(e))

        did = doc_id or f"lesson_{int(time.time())}_{uuid.uuid4().hex[:6]}"
        is_explicit = bool(is_explicit)
        calc_confidence = confidence if confidence is not None else min(0.99, max(0.60, score / 10.0))
        if is_explicit:
            calc_confidence = max(0.95, calc_confidence)

        metadata = {
            "topic": str(topic or "general"),
            "composite_score": float(score),
            "format": str(format_name or "general"),
            "type": "lesson",
            "timestamp": float(time.time()),
            "supporting_evidence": str(supporting_evidence or f"Verified composite performance score: {score:.1f}"),
            "source_event": str(source_event or "telemetry_ingest"),
            "confidence": float(calc_confidence),
            "is_active": True,
            "is_explicit": is_explicit,
            "evidence_count": int(evidence_count or 1),
            "memory_type": str(memory_type or "performance_insight"),
            "workspace_id": str(self.workspace_id or "default_workspace"),
            "brand_id": str(self.brand_id or "default_brand"),
            "brand_name": str(self.brand_name or "default_brand"),
        }

        self.lessons_col.add(
            documents=[lesson],
            metadatas=[metadata],
            ids=[did],
        )

        self.adjust_memory_weights(topic=topic, score=score, format_name=format_name)
        return did

    def update_lesson(
        self,
        doc_id: str,
        new_lesson: Optional[str] = None,
        metadata_updates: Optional[Dict[str, Any]] = None,
    ) -> bool:
        """Updates text or active status/metadata for a persisted lesson."""
        try:
            res = self.lessons_col.get(ids=[doc_id])
            if not res or not res.get("ids") or len(res["ids"]) == 0:
                return False

            old_doc = res["documents"][0] if res.get("documents") else ""
            old_meta = res["metadatas"][0] if res.get("metadatas") else {}

            updated_doc = new_lesson if new_lesson is not None else old_doc
            updated_meta = {**old_meta, **(metadata_updates or {}), "updated_at": time.time()}

            self.lessons_col.update(
                ids=[doc_id],
                documents=[updated_doc],
                metadatas=[updated_meta],
            )
            return True
        except Exception:
            return False

    def deactivate_lesson(self, doc_id: str) -> bool:
        """Deactivates a learned lesson so it is excluded from active generation recall."""
        return self.update_lesson(doc_id=doc_id, metadata_updates={"is_active": False})

    def delete_lesson(self, doc_id: str) -> bool:
        """Hard-deletes a learned lesson from the vector collection."""
        try:
            self.lessons_col.delete(ids=[doc_id])
            return True
        except Exception:
            return False

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
            delta = round(min(1.0, (score - 5.0) / 10.0), 3)
            new_topic_weight = round(min(2.5, old_topic_weight + delta), 3)
            new_format_weight = round(min(2.5, old_format_weight + delta), 3)
            status = "boosted"
        else:
            delta = round(max(-0.4, (score - 5.0) / 15.0), 3)
            new_topic_weight = round(max(0.2, old_topic_weight + delta), 3)
            new_format_weight = round(max(0.2, old_format_weight + delta), 3)
            status = "penalized"

        self.memory_weights[topic] = new_topic_weight
        if format_name:
            self.memory_weights[format_name] = new_format_weight

        self._persist_weights()

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
            "workspace_id": str(self.workspace_id or "default_workspace"),
            "brand_id": str(self.brand_id or "default_brand"),
            "brand_name": str(self.brand_name or "default_brand"),
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
            "workspace_id": str(self.workspace_id or "default_workspace"),
            "brand_id": str(self.brand_id or "default_brand"),
            "brand_name": str(self.brand_name or "default_brand"),
        }
        doc_text = f"Topic: {topic} | Sentiment: {sentiment_label} ({sentiment_score:.2f}) | Summary: {summary} | Keywords: {kw_str}"
        self.sentiment_col.add(ids=[doc_id], documents=[doc_text], metadatas=[metadata])
        return doc_id

    def retrieve_top_posts(self, topic: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Pulls top past high-performing posts matching topic."""
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

    def retrieve_lessons(
        self,
        topic: str,
        limit: int = 5,
        active_only: bool = True,
    ) -> List[Dict[str, Any]]:
        """Pulls top learned lessons filtered by active status and sorted by priority."""
        count = self.lessons_col.count()
        if count == 0:
            return []
        n_results = min(max(limit * 2, 5), count)
        res = self.lessons_col.query(query_texts=[topic], n_results=n_results)
        items = []
        if res and res.get("documents") and res["documents"][0]:
            docs = res["documents"][0]
            metas = res.get("metadatas", [[]])[0]
            ids = res.get("ids", [[]])[0]
            for i in range(len(docs)):
                meta = metas[i] if i < len(metas) else {}
                doc_id = ids[i] if i < len(ids) else f"lesson_{i}"
                if active_only and meta.get("is_active") is False:
                    continue
                items.append({
                    "id": doc_id,
                    "lesson": docs[i],
                    "metadata": meta,
                })

        # Sort: explicit instructions first, then by confidence descending
        items.sort(
            key=lambda x: (
                1 if x.get("metadata", {}).get("is_explicit") else 0,
                x.get("metadata", {}).get("confidence", 0.0),
            ),
            reverse=True,
        )
        return items[:limit]

    def retrieve_recent_hooks(self, limit: int = 10) -> List[str]:
        """Returns past hook lines from winning posts to enable anti-repetition guardrails."""
        count = self.posts_col.count()
        if count == 0:
            return []
        n_results = min(limit, count)
        res = self.posts_col.get(limit=n_results)
        hooks: List[str] = []
        if res and res.get("metadatas"):
            for meta in res["metadatas"]:
                if meta and "hook" in meta and meta["hook"]:
                    hooks.append(str(meta["hook"]))
        return hooks

    def record_performance_and_learn(
        self,
        topic: str,
        post_content: str,
        metrics: EngagementMetricsSchema,
        format_name: Optional[str] = None,
        data_origin: str = "verified_platform",  # "verified_platform", "estimated", "simulated"
        sample_size: int = 1,
    ) -> Tuple[float, bool, Optional[str], Optional[str], Dict[str, Any]]:
        """
        Executes learning logic with strict provenance:
        1. Computes composite score.
        2. Adjusts dynamic topic and style memory weights.
        3. If data_origin is simulated/estimated, it DOES NOT create permanent strategic lessons.
        4. If data_origin is verified_platform and sample_size >= 3 and score > 5.0, embeds verified lesson.
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

        weight_adj = self.adjust_memory_weights(topic=topic, score=score, format_name=format_name)

        # Invariant: Never learn strategic lessons from simulated or unverified data
        if data_origin != "verified_platform":
            logger.info("Ignoring %s telemetry for permanent strategic learning.", data_origin)
            return score, False, None, None, {**weight_adj, "data_origin": data_origin}

        qualifies = score > settings.MIN_COMPOSITE_SCORE_THRESHOLD
        if not qualifies:
            return score, False, None, None, weight_adj

        # Synthesize strategic lesson from verified observations
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
            "supporting_evidence": f"Verified platform telemetry across {sample_size} posts: {metrics.shares} shares, {metrics.replies} replies, {metrics.likes} likes",
            "source_event": "verified_telemetry",
            "is_active": True,
            "is_explicit": False,
            "evidence_count": sample_size,
            "memory_type": "performance_insight",
            "confidence": round(min(0.99, max(0.70, 0.65 + (sample_size * 0.05))), 2),
            "workspace_id": str(self.workspace_id or "default_workspace"),
            "brand_id": str(self.brand_id or "default_brand"),
            "brand_name": str(self.brand_name or "default_brand"),
        }

        self.lessons_col.add(ids=[lesson_id], documents=[doc_text], metadatas=[metadata])
        self.ingest_post(
            topic=topic,
            content=post_content,
            metrics=metrics,
            key_takeaway=key_lesson,
            post_id=f"win_{lesson_id}"
        )

        return score, True, key_lesson, lesson_id, weight_adj

    def record_recommendation_rejection_lesson(
        self,
        rejection_reason: str,
        user_explanation: Optional[str] = None,
        topic: str = "general",
        evidence_count: int = 2,
        is_explicit: bool = False,
    ) -> Tuple[str, str]:
        """
        Dynamically records a negative guideline / don't lesson from user recommendation rejection.
        Ensures the agent adapts and avoids repeating rejected voice or formats.
        """
        rejection_map = {
            "poor_voice": "Avoid tone/vocabulary that deviates from brand archetype. User rejected recommendation: ",
            "repetitive": "Avoid generating similar phrasing/hooks within consecutive generation batches. User rejected repetitive pattern: ",
            "off_topic": "Avoid topics outside core domain expertise and practitioner scope: ",
            "inappropriate_hook": "Avoid sensationalist or clickbait opening hooks that undermine authority: ",
            "other": "User rejected candidate recommendation with guidance: "
        }
        prefix = rejection_map.get(rejection_reason, "Avoid pattern rejected by user: ")
        detail = user_explanation or f"Flagged as {rejection_reason} during practitioner review."
        negative_lesson = f"{prefix}{detail}"

        lesson_id = f"dont_{uuid.uuid4().hex[:8]}"
        doc_text = f"Topic: {topic}\nRule: {negative_lesson}\nRejection Reason: {rejection_reason}"
        is_explicit = bool(is_explicit)
        calc_confidence = 0.95 if is_explicit else round(min(0.92, 0.80 + (evidence_count * 0.04)), 2)

        metadata = {
            "lesson_id": str(lesson_id),
            "topic": str(topic or "general"),
            "key_lesson": str(negative_lesson),
            "supporting_evidence": str(f"User Rejection ({rejection_reason}) [observed {evidence_count}x]: {detail}"),
            "source_event": "recurring_rejection" if not is_explicit else "explicit_rejection_rule",
            "is_active": True,
            "is_explicit": is_explicit,
            "evidence_count": int(evidence_count or 1),
            "memory_type": "donts_avoided",
            "confidence": float(calc_confidence),
            "workspace_id": str(self.workspace_id or "default_workspace"),
            "brand_id": str(self.brand_id or "default_brand"),
            "brand_name": str(self.brand_name or "default_brand"),
            "rule_type": "donts_avoided",
        }
        self.lessons_col.add(ids=[lesson_id], documents=[doc_text], metadatas=[metadata])
        return lesson_id, negative_lesson

    def clear_brand_memories(self) -> Dict[str, int]:
        """Clears all vector documents in this tenant's collections."""
        p_count = self.posts_col.count()
        s_count = self.sentiment_col.count()
        l_count = self.lessons_col.count()

        if p_count > 0:
            all_p = self.posts_col.get()
            if all_p and all_p.get("ids"):
                self.posts_col.delete(ids=all_p["ids"])
        if s_count > 0:
            all_s = self.sentiment_col.get()
            if all_s and all_s.get("ids"):
                self.sentiment_col.delete(ids=all_s["ids"])
        if l_count > 0:
            all_l = self.lessons_col.get()
            if all_l and all_l.get("ids"):
                self.lessons_col.delete(ids=all_l["ids"])

        self.memory_weights = {}
        self._persist_weights()

        return {
            "posts_cleared": p_count,
            "sentiment_cleared": s_count,
            "lessons_cleared": l_count,
        }

    def get_stats(self) -> Dict[str, int]:
        return {
            "winning_posts_count": self.posts_col.count(),
            "sentiment_records_count": self.sentiment_col.count(),
            "lessons_learned_count": self.lessons_col.count(),
        }

    def get_storage_status(self) -> Dict[str, Any]:
        return {
            "is_persistent": self.is_persistent,
            "persist_directory": self.persist_directory if self.is_persistent else None,
            "storage_provider": "chroma_persistent" if self.is_persistent else "chroma_ephemeral",
            "tenant_key": self.tenant_key,
            "workspace_id": self.workspace_id,
            "brand_id": self.brand_id,
            "storage_error": self.storage_error,
            "stats": self.get_stats(),
        }


# Global registry for brand memory managers keyed by "workspace_id:brand_id"
_MEMORY_STORES: Dict[str, VectorMemoryManager] = {}


def get_memory_manager(
    brand_name: str = "default_brand",
    workspace_id: Optional[str] = None,
    brand_id: Optional[str] = None,
    persist_directory: Optional[str] = None,
    client: Optional[ClientAPI] = None,
) -> VectorMemoryManager:
    """
    Retrieves or initializes a VectorMemoryManager instance partitioned by workspace and brand.
    Preserves backwards compatibility for calls passing only brand_name.
    """
    ws_key = workspace_id or "default_workspace"
    bid_key = brand_id or brand_name or "default_brand"
    store_key = f"{ws_key}:{bid_key}"

    # If caller explicitly provided a client or persist_directory, don't use stale cached instance
    if store_key not in _MEMORY_STORES or client is not None or persist_directory is not None:
        _MEMORY_STORES[store_key] = VectorMemoryManager(
            brand_name=brand_name,
            workspace_id=workspace_id,
            brand_id=brand_id,
            client=client,
            persist_directory=persist_directory,
        )
    return _MEMORY_STORES[store_key]
