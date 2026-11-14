"""
Persistent Memory & Continuous Learning Service.
Orchestrates multi-tenant relational memory (SQLite/PostgreSQL) and semantic vector memory (ChromaDB).
Implements trustworthy learning pipeline, deduplication, conflict resolution, and provenance tracking.

Owned by Person 1 & Person 2.
"""

import logging
import time
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, or_, and_, update

from app.models.memory import AgentMemory
from app.models.brand import Brand
from app.models.feedback import UserFeedback
from app.core.memory import get_memory_manager, VectorMemoryManager
from app.config import settings

logger = logging.getLogger(__name__)


class PersistentMemoryService:
    """
    Unified, deep service for all brand memory operations.
    Hides internal persistence mechanics (relational SQL vs Chroma vector store)
    behind a clean, semantic public interface.
    """

    @staticmethod
    async def get_storage_status(
        workspace_id: Optional[str] = None,
        brand_id: Optional[str] = None,
        brand_name: str = "SocioTrack",
    ) -> Dict[str, Any]:
        """Returns genuine health and persistence diagnostics of the storage backends."""
        mem_mgr = get_memory_manager(
            brand_name=brand_name,
            workspace_id=workspace_id,
            brand_id=brand_id,
        )
        return mem_mgr.get_storage_status()

    @staticmethod
    async def get_brand_memories(
        db: AsyncSession,
        brand_id: str,
        workspace_id: Optional[str] = None,
        category: Optional[str] = None,
        search: Optional[str] = None,
        include_inactive: bool = False,
        limit: int = 50,
    ) -> List[AgentMemory]:
        """
        Retrieves queryable memories for a brand with strict workspace boundary checks.
        Orders by explicit directives first, then confidence score, then recency.
        """
        query = select(AgentMemory).where(AgentMemory.brand_id == brand_id)

        if workspace_id:
            query = query.where(
                or_(
                    AgentMemory.workspace_id == workspace_id,
                    AgentMemory.workspace_id.is_(None),
                )
            )

        if not include_inactive:
            query = query.where(AgentMemory.is_active.is_(True))

        if category:
            query = query.where(AgentMemory.category == category)

        if search and search.strip():
            term = f"%{search.strip()}%"
            query = query.where(
                or_(
                    AgentMemory.insight_text.ilike(term),
                    AgentMemory.supporting_evidence.ilike(term),
                )
            )

        query = query.order_by(
            AgentMemory.is_explicit.desc(),
            AgentMemory.confidence_score.desc(),
            AgentMemory.created_at.desc(),
        ).limit(limit)

        res = await db.execute(query)
        return list(res.scalars().all())

    @staticmethod
    async def create_memory(
        db: AsyncSession,
        brand: Brand,
        insight_text: str,
        category: str = "content_preferences",
        confidence_score: float = 0.85,
        supporting_evidence: Optional[str] = None,
        source_event: str = "explicit_directive",
        is_explicit: bool = False,
        evidence_count: int = 1,
        memory_type: str = "explicit_directive",
    ) -> AgentMemory:
        """
        Creates a new memory record, resolves conflicts, and syncs to both SQL and Chroma vector store.
        """
        clean_text = insight_text.strip()

        # Deduplication in SQL: If identical active memory exists for this brand, update and increment evidence
        existing_stmt = select(AgentMemory).where(
            AgentMemory.brand_id == brand.id,
            AgentMemory.insight_text == clean_text,
            AgentMemory.is_active.is_(True),
        )
        res = await db.execute(existing_stmt)
        existing = res.scalars().first()
        if existing:
            existing.evidence_count = int(existing.evidence_count or 1) + evidence_count
            existing.is_explicit = existing.is_explicit or is_explicit
            if existing.is_explicit:
                existing.confidence_score = max(0.95, confidence_score, existing.confidence_score)
            else:
                existing.confidence_score = max(existing.confidence_score, confidence_score)
            existing.updated_at = datetime.now(timezone.utc)
            if existing.is_explicit:
                supersede_stmt = (
                    update(AgentMemory)
                    .where(
                        AgentMemory.brand_id == brand.id,
                        AgentMemory.category == category,
                        AgentMemory.id != existing.id,
                        AgentMemory.is_active.is_(True),
                        AgentMemory.is_explicit.is_(False),
                    )
                    .values(is_active=False, conflict_status="superseded")
                )
                await db.execute(supersede_stmt)
            await db.flush()
            return existing

        # Conflict Resolution: If new rule is explicit, supersede older conflicting memories in same category
        if is_explicit:
            confidence_score = max(0.95, confidence_score)
            supersede_stmt = (
                update(AgentMemory)
                .where(
                    AgentMemory.brand_id == brand.id,
                    AgentMemory.category == category,
                    AgentMemory.is_active.is_(True),
                    AgentMemory.is_explicit.is_(False),  # Inferred rules are superseded by explicit
                )
                .values(is_active=False, conflict_status="superseded")
            )
            await db.execute(supersede_stmt)

        memory = AgentMemory(
            id=str(uuid.uuid4()),
            workspace_id=brand.workspace_id,
            brand_id=brand.id,
            insight_text=clean_text,
            category=category,
            confidence_score=confidence_score,
            supporting_evidence=supporting_evidence or ("Direct user-confirmed instruction" if is_explicit else "System observation"),
            source_event=source_event,
            is_active=True,
            is_explicit=is_explicit,
            evidence_count=evidence_count,
            memory_type=memory_type,
            conflict_status="active",
        )
        db.add(memory)
        await db.flush()
        await db.refresh(memory)

        # Sync to VectorMemoryManager
        mem_mgr = get_memory_manager(
            brand_name=brand.name,
            workspace_id=brand.workspace_id,
            brand_id=brand.id,
        )
        mem_mgr.insert_lesson(
            topic=category,
            lesson=clean_text,
            score=confidence_score * 10.0,
            doc_id=memory.id,
            supporting_evidence=memory.supporting_evidence,
            source_event=source_event,
            confidence=confidence_score,
            is_explicit=is_explicit,
            evidence_count=evidence_count,
            memory_type=memory_type,
        )

        return memory

    @staticmethod
    async def record_feedback_learning(
        db: AsyncSession,
        brand: Brand,
        decision: str,
        rejection_reason: Optional[str] = None,
        user_explanation: Optional[str] = None,
        is_explicit_rule: bool = False,
    ) -> Tuple[bool, Optional[str], int]:
        """
        Trustworthy learning pipeline for draft evaluations.
        Invariant: A single rejection does NOT create an unsupported permanent negative rule.
        Only recurring rejections (>= 2 times) OR explicit rule requests trigger memory creation.
        Returns: (memory_created: bool, lesson_id: Optional[str], rejection_count: int)
        """
        if decision != "rejected" or not rejection_reason:
            return False, None, 0

        # Query total rejections for this brand and rejection reason (including current flushed record)
        count_stmt = select(func.count(UserFeedback.id)).where(
            UserFeedback.brand_id == brand.id,
            UserFeedback.rejection_reason == rejection_reason,
        )
        res = await db.execute(count_stmt)
        total_observations = max(1, res.scalar() or 1)

        min_rejections = getattr(settings, "MEMORY_MIN_REJECTIONS_FOR_PATTERN", 2)
        if is_explicit_rule is True:
            should_create_rule = True
        elif is_explicit_rule is False:
            should_create_rule = (total_observations >= min_rejections)
        else:
            # None: if user provided written explanation, treat as explicit feedback; else require recurring pattern
            should_create_rule = bool(user_explanation and len(user_explanation.strip()) >= 5) or (total_observations >= min_rejections)

        if not should_create_rule:
            logger.info(
                "Rejection recorded for brand %s (%s, count=%d). Pending recurring pattern threshold (%d).",
                brand.name,
                rejection_reason,
                total_observations,
                min_rejections,
            )
            return False, None, total_observations

        # Synthesize negative guideline
        is_explicit_flag = bool(is_explicit_rule) or (is_explicit_rule is None and bool(user_explanation and len(user_explanation.strip()) >= 5))
        mem_mgr = get_memory_manager(
            brand_name=brand.name,
            workspace_id=brand.workspace_id,
            brand_id=brand.id,
        )
        lesson_id, negative_lesson = mem_mgr.record_recommendation_rejection_lesson(
            rejection_reason=rejection_reason,
            user_explanation=user_explanation,
            topic="general",
            evidence_count=total_observations,
            is_explicit=is_explicit_flag,
        )

        db_memory = AgentMemory(
            id=lesson_id,
            workspace_id=brand.workspace_id,
            brand_id=brand.id,
            category="donts_avoided",
            insight_text=negative_lesson,
            confidence_score=0.95 if is_explicit_flag else round(min(0.92, 0.80 + (total_observations * 0.04)), 2),
            supporting_evidence=f"User Rejection ({rejection_reason}) [observed {total_observations}x]: {user_explanation or 'Observed friction'}",
            source_event="explicit_rejection_rule" if is_explicit_flag else "recurring_rejection",
            is_active=True,
            is_explicit=is_explicit_flag,
            evidence_count=total_observations,
            memory_type="donts_avoided",
            conflict_status="active",
        )
        db.add(db_memory)

        # Invalidate cached intelligence profile so next generation refreshes
        brand.intelligence_profile = None

        return True, lesson_id, total_observations

    @staticmethod
    async def record_user_edit_learning(
        db: AsyncSession,
        brand: Brand,
        post_id: str,
        original_draft: str,
        approved_text: str,
        hook_style: str = "general",
    ) -> Optional[AgentMemory]:
        """
        Extracts editorial preferences when a user modifies AI-generated copy before approving.
        Differentiates single edit (inferred) from recurring stylistic preference.
        """
        if not original_draft or not approved_text or original_draft.strip() == approved_text.strip():
            return None

        orig_len = len(original_draft.strip())
        appr_len = len(approved_text.strip())

        # Check stylistic delta
        if appr_len < orig_len * 0.75:
            delta_desc = "Prefers concise, punchy copy with minimal filler words."
        elif "\n-" in approved_text or "\n•" in approved_text or "\n1." in approved_text:
            delta_desc = "Prefers structured bulleted lists over dense narrative blocks."
        else:
            delta_desc = "Refined voice phrasing to match authentic brand vocabulary."

        insight_text = f"Editorial preference ({hook_style}): {delta_desc}"

        # Check existing user edit memories to elevate evidence count
        existing_stmt = select(AgentMemory).where(
            AgentMemory.brand_id == brand.id,
            AgentMemory.source_event == "user_edit",
            AgentMemory.is_active.is_(True),
        )
        res = await db.execute(existing_stmt)
        past_edits = list(res.scalars().all())
        evidence_count = len(past_edits) + 1
        calc_confidence = round(min(0.92, 0.70 + (evidence_count * 0.05)), 2)

        return await PersistentMemoryService.create_memory(
            db=db,
            brand=brand,
            insight_text=insight_text,
            category="content_preferences",
            confidence_score=calc_confidence,
            supporting_evidence=f"User edited draft prior to approval. Original chars: {orig_len}, Approved chars: {appr_len}",
            source_event="user_edit",
            is_explicit=False,
            evidence_count=evidence_count,
            memory_type="recurring_pattern" if evidence_count >= 2 else "inferred_preference",
        )

    @staticmethod
    async def update_memory(
        db: AsyncSession,
        memory: AgentMemory,
        brand: Brand,
        new_text: Optional[str] = None,
        new_category: Optional[str] = None,
        new_confidence: Optional[float] = None,
        is_active: Optional[bool] = None,
        supporting_evidence: Optional[str] = None,
    ) -> AgentMemory:
        """Updates memory record in SQL and synchronizes with Chroma vector store."""
        if new_text is not None and new_text.strip():
            memory.insight_text = new_text.strip()
        if new_category is not None:
            memory.category = new_category
        if new_confidence is not None:
            memory.confidence_score = new_confidence
        if is_active is not None:
            memory.is_active = is_active
        if supporting_evidence is not None:
            memory.supporting_evidence = supporting_evidence

        await db.flush()
        await db.refresh(memory)

        # Sync to Vector Store
        mem_mgr = get_memory_manager(
            brand_name=brand.name,
            workspace_id=brand.workspace_id,
            brand_id=brand.id,
        )
        mem_mgr.update_lesson(
            doc_id=memory.id,
            new_lesson=memory.insight_text,
            metadata_updates={
                "is_active": memory.is_active,
                "confidence": memory.confidence_score,
                "supporting_evidence": memory.supporting_evidence,
                "is_explicit": memory.is_explicit,
            },
        )

        return memory

    @staticmethod
    async def delete_memory(
        db: AsyncSession,
        memory: AgentMemory,
        brand: Brand,
        hard_delete: bool = False,
    ) -> bool:
        """Deletes or soft-deactivates memory in both SQL and Chroma vector store."""
        mem_mgr = get_memory_manager(
            brand_name=brand.name,
            workspace_id=brand.workspace_id,
            brand_id=brand.id,
        )

        if hard_delete:
            mem_mgr.delete_lesson(memory.id)
            await db.delete(memory)
        else:
            memory.is_active = False
            memory.conflict_status = "deactivated"
            mem_mgr.deactivate_lesson(memory.id)

        await db.flush()
        return True

    @staticmethod
    async def clear_all_brand_memories(
        db: AsyncSession,
        brand: Brand,
    ) -> Dict[str, int]:
        """Clears all memories for a brand across SQL and Chroma vector store."""
        # 1. Clear SQL
        del_stmt = select(AgentMemory).where(AgentMemory.brand_id == brand.id)
        res = await db.execute(del_stmt)
        memories = list(res.scalars().all())
        sql_count = len(memories)

        for m in memories:
            await db.delete(m)

        # 2. Clear Vector Store
        mem_mgr = get_memory_manager(
            brand_name=brand.name,
            workspace_id=brand.workspace_id,
            brand_id=brand.id,
        )
        vec_stats = mem_mgr.clear_brand_memories()

        await db.flush()
        return {
            "sql_memories_deleted": sql_count,
            **vec_stats,
        }

    @staticmethod
    async def retrieve_context_for_generation(
        db: AsyncSession,
        brand: Brand,
        topic: str,
        limit: int = 7,
    ) -> Dict[str, Any]:
        """
        Retrieves, ranks, and budgets memories for LLM prompt context injection.
        Guarantees:
        - Strict tenant isolation: only memories matching brand.id and brand.workspace_id
        - Explicit user directives always take top priority
        - Excludes inactive and superseded memories
        - Topic-relevant vector search
        - Returns structured provenance mapping
        """
        # 1. Fetch active SQL memories for this brand
        sql_stmt = (
            select(AgentMemory)
            .where(
                AgentMemory.brand_id == brand.id,
                AgentMemory.is_active.is_(True),
            )
            .order_by(
                AgentMemory.is_explicit.desc(),
                AgentMemory.confidence_score.desc(),
                AgentMemory.created_at.desc(),
            )
        )
        res = await db.execute(sql_stmt)
        sql_memories = list(res.scalars().all())

        explicit_dos: List[str] = []
        explicit_donts: List[str] = []
        learned_preferences: List[str] = []
        memories_applied: List[Dict[str, Any]] = []

        for m in sql_memories:
            if m.is_explicit:
                if m.category == "donts_avoided":
                    if m.insight_text not in explicit_donts:
                        explicit_donts.append(m.insight_text)
                else:
                    if m.insight_text not in explicit_dos:
                        explicit_dos.append(m.insight_text)
            else:
                if m.category == "donts_avoided":
                    if m.insight_text not in explicit_donts:
                        explicit_donts.append(m.insight_text)
                else:
                    if m.insight_text not in learned_preferences:
                        learned_preferences.append(m.insight_text)

            memories_applied.append({
                "id": m.id,
                "text": m.insight_text,
                "category": m.category,
                "confidence": m.confidence_score,
                "is_explicit": m.is_explicit,
                "source": m.source_event,
            })

        # 2. Query semantic vector store for topic-specific lessons
        mem_mgr = get_memory_manager(
            brand_name=brand.name,
            workspace_id=brand.workspace_id,
            brand_id=brand.id,
        )
        semantic_lessons = mem_mgr.retrieve_lessons(topic=topic, limit=5, active_only=True)
        top_posts = mem_mgr.retrieve_top_posts(topic=topic, limit=3)
        sentiment = mem_mgr.retrieve_sentiment(topic=topic)
        recent_hooks = mem_mgr.retrieve_recent_hooks(limit=10)

        # Merge unique vector lessons
        for sl in semantic_lessons:
            lesson_txt = sl.get("lesson", "")
            meta = sl.get("metadata", {})
            if lesson_txt and lesson_txt not in learned_preferences and lesson_txt not in explicit_dos:
                learned_preferences.append(lesson_txt)
                memories_applied.append({
                    "id": sl.get("id"),
                    "text": lesson_txt,
                    "category": meta.get("memory_type", "lesson"),
                    "confidence": float(meta.get("confidence", 0.8)),
                    "is_explicit": bool(meta.get("is_explicit", False)),
                    "source": meta.get("source_event", "vector_search"),
                })

        # Budget token limits: cap total context items
        budgeted_dos = explicit_dos[: max(5, limit)]
        budgeted_donts = explicit_donts[: max(5, limit)]
        budgeted_learned = learned_preferences[: max(5, limit)]
        budgeted_applied = memories_applied[:limit]

        return {
            "explicit_dos": budgeted_dos,
            "explicit_donts": budgeted_donts,
            "learned_preferences": budgeted_learned,
            "top_posts": top_posts,
            "recent_hooks": recent_hooks,
            "sentiment": sentiment,
            "memories_applied": budgeted_applied,
            "memories_applied_summaries": [m["text"] for m in budgeted_applied],
        }
