"""
Memory Router: Handles persistent memory endpoints, insights retrieval, and memory lifecycle controls.
Multi-tenant isolation at workspace and brand level.
"""
from typing import Optional, List
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models.brand import Brand
from app.models.memory import AgentMemory
from app.schemas.memory import (
    MemoryInsightsResponse,
    AgentMemoryCreate,
    AgentMemoryUpdate,
    AgentMemoryResponse,
    AudienceSentimentSchema,
    PastWinningPostSchema,
    LearnedLessonSchema,
    MemoryStatusResponse,
    MemoryClearRequest,
)
from app.schemas.auth import UserResponse
from app.routers.auth import get_current_user, is_admin_user
from app.services.authorization_service import (
    verify_brand_access,
    verify_memory_access,
    check_brand_access,
    get_accessible_brand_ids,
)
from app.services.persistent_memory_service import PersistentMemoryService
from app.core.memory import get_memory_manager

router = APIRouter(prefix="/memory", tags=["Memory"])


@router.get(
    "/status",
    response_model=MemoryStatusResponse,
    status_code=status.HTTP_200_OK,
    summary="Get genuine persistence health and vector store storage status",
)
async def get_memory_storage_status(
    brand_id: Optional[str] = Query(None, description="UUID of brand"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    brand = None
    if brand_id:
        brand = await verify_brand_access(db, brand_id, current_user, min_role="viewer")

    workspace_id = getattr(current_user, "active_workspace_id", None)
    brand_name = brand.name if brand else "SocioTrack"
    brand_id_val = brand.id if brand else (brand_id or "default_brand")

    raw_status = await PersistentMemoryService.get_storage_status(
        workspace_id=workspace_id,
        brand_id=brand_id_val,
        brand_name=brand_name,
    )

    # Count SQL memories
    count_stmt = select(func.count(AgentMemory.id))
    if brand:
        count_stmt = count_stmt.where(AgentMemory.brand_id == brand.id)
    total_res = await db.execute(count_stmt)
    total_sql = total_res.scalar() or 0

    active_stmt = select(func.count(AgentMemory.id)).where(AgentMemory.is_active.is_(True))
    if brand:
        active_stmt = active_stmt.where(AgentMemory.brand_id == brand.id)
    active_res = await db.execute(active_stmt)
    active_sql = active_res.scalar() or 0

    stats = raw_status.get("stats", {})
    return MemoryStatusResponse(
        status="healthy" if not raw_status.get("storage_error") else "degraded",
        is_persistent=bool(raw_status.get("is_persistent", False)),
        storage_provider=str(raw_status.get("storage_provider", "chroma")),
        persist_directory=raw_status.get("persist_directory"),
        total_memories=total_sql,
        active_memories=active_sql,
        vector_collections_count=stats.get("lessons_learned_count", 0),
        vector_store_healthy=raw_status.get("storage_error") is None,
        storage_error=raw_status.get("storage_error"),
    )


@router.get(
    "/insights",
    response_model=MemoryInsightsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get all learned audience insights stored for a brand",
)
async def get_memory_insights(
    brand_id: Optional[str] = Query(None, description="UUID of the brand"),
    brand_name: Optional[str] = Query(None, description="Brand name if querying by identifier"),
    topic: Optional[str] = Query(None, description="Context topic"),
    category: Optional[str] = Query(None, description="Filter by memory category"),
    search: Optional[str] = Query(None, description="Search memory insights"),
    include_inactive: bool = Query(False, description="Whether to include deactivated lessons"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    brand = None
    if brand_id:
        brand = await verify_brand_access(db, brand_id, current_user, min_role="viewer")

    if not brand and brand_name:
        brand_res = await db.execute(select(Brand).where(Brand.name == brand_name))
        brand = brand_res.scalar_one_or_none()
        if brand:
            has_access = await check_brand_access(db, brand, current_user, min_role="viewer")
            if not has_access:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Forbidden: You do not have access to brand '{brand_name}'.",
                )

    if not brand and not brand_id:
        accessible_ids = await get_accessible_brand_ids(db, current_user)
        if accessible_ids:
            brand_res = await db.execute(select(Brand).where(Brand.id.in_(accessible_ids)).limit(1))
            brand = brand_res.scalar_one_or_none()
        elif is_admin_user(current_user) or current_user.is_demo:
            brand_res = await db.execute(select(Brand).limit(1))
            brand = brand_res.scalar_one_or_none()

    active_brand_id = brand.id if brand else (brand_id or "mock_brand_id")
    active_brand_name = brand.name if brand else (brand_name or "SocioTrack")
    active_workspace_id = brand.workspace_id if brand else getattr(current_user, "active_workspace_id", None)
    active_topic = topic or "Deterministic State Management with LangGraph"

    # Query SQL memories using PersistentMemoryService
    memories = []
    if brand:
        memories = await PersistentMemoryService.get_brand_memories(
            db=db,
            brand_id=brand.id,
            workspace_id=brand.workspace_id,
            category=category,
            search=search,
            include_inactive=include_inactive,
            limit=50,
        )

    insights_list = [
        AgentMemoryResponse(
            id=m.id,
            brand_id=m.brand_id,
            workspace_id=m.workspace_id,
            insight_text=m.insight_text,
            category=m.category,
            confidence_score=m.confidence_score,
            supporting_evidence=m.supporting_evidence,
            source_post_id=m.source_post_id,
            source_event=m.source_event,
            is_active=m.is_active if m.is_active is not None else True,
            is_explicit=bool(m.is_explicit),
            evidence_count=int(m.evidence_count or 1),
            memory_type=m.memory_type or "inferred_preference",
            conflict_status=m.conflict_status or "active",
            created_at=m.created_at,
            updated_at=m.updated_at,
        )
        for m in memories
    ]

    # Query Vector Memory Manager with workspace isolation
    mem_mgr = get_memory_manager(
        brand_name=active_brand_name,
        workspace_id=active_workspace_id,
        brand_id=active_brand_id,
    )
    raw_lessons = mem_mgr.retrieve_lessons(topic=active_topic, limit=5, active_only=not include_inactive)
    raw_posts = mem_mgr.retrieve_top_posts(topic=active_topic, limit=5)
    raw_sentiment = mem_mgr.retrieve_sentiment(topic=active_topic)

    top_winning_posts = []
    for p in raw_posts:
        meta = p.get("metadata", {})
        top_winning_posts.append(
            PastWinningPostSchema(
                id=p.get("id", str(uuid.uuid4())),
                topic=meta.get("topic", active_topic),
                content=p.get("content", ""),
                hook=meta.get("hook", "High-retention hook"),
                composite_score=float(meta.get("composite_score", 6.5)),
                impressions=int(meta.get("impressions", 1000)),
                shares=int(meta.get("shares", 50)),
                replies=int(meta.get("replies", 20)),
                likes=int(meta.get("likes", 100)),
                key_takeaway=meta.get("key_takeaway", "Observed historical engagement"),
            )
        )

    learned_lessons = []
    for idx, l in enumerate(raw_lessons):
        meta = l.get("metadata", {})
        derived_iso = None
        if meta.get("timestamp"):
            try:
                derived_iso = datetime.fromtimestamp(meta["timestamp"], tz=timezone.utc).isoformat()
            except Exception:
                derived_iso = None

        learned_lessons.append(
            LearnedLessonSchema(
                id=l.get("id", f"lesson_{idx}"),
                topic=meta.get("topic", active_topic),
                key_lesson=l.get("lesson", ""),
                composite_score=float(meta.get("composite_score", 5.5)),
                derived_at=derived_iso,
                supporting_evidence=meta.get("supporting_evidence", "Derived from persistent vector telemetry"),
                source_event=meta.get("source_event", "telemetry_ingest"),
                is_active=meta.get("is_active", True),
                brand_id=active_brand_id,
            )
        )

    # If database memories exist, map them into learned lessons if lessons are empty
    if not learned_lessons and memories:
        for m in memories:
            learned_lessons.append(
                LearnedLessonSchema(
                    id=m.id,
                    topic=active_topic,
                    key_lesson=m.insight_text,
                    composite_score=round(m.confidence_score * 10, 1),
                    supporting_evidence=m.supporting_evidence or "Manual or user-confirmed rule",
                    source_event=m.source_event or "user_edit",
                    is_active=m.is_active if m.is_active is not None else True,
                    brand_id=m.brand_id,
                )
            )

    sentiment_score = raw_sentiment.get("sentiment_score", 0.82)
    sentiment_label = raw_sentiment.get("sentiment_label", "positive_growth")
    keywords_raw = raw_sentiment.get("keywords", ["architecture", "telemetry", "retention", "langgraph"])
    if isinstance(keywords_raw, str):
        keywords = [k.strip() for k in keywords_raw.split(",") if k.strip()]
    elif isinstance(keywords_raw, (list, tuple)):
        keywords = [str(k) for k in keywords_raw]
    else:
        keywords = ["architecture", "telemetry", "retention", "langgraph"]

    current_sentiment = AudienceSentimentSchema(
        topic=active_topic,
        sentiment_label=sentiment_label,
        sentiment_score=float(sentiment_score),
        summary=raw_sentiment.get("summary", f"Audience engagement signals active for {active_topic}"),
        keywords=keywords,
    )

    storage_status = mem_mgr.get_storage_status()

    return MemoryInsightsResponse(
        brand_id=active_brand_id,
        brand_name=active_brand_name,
        topic=active_topic,
        total_insights=len(insights_list),
        total_active_memories=len([m for m in insights_list if m.is_active]),
        insights=insights_list,
        total_winning_posts=len(top_winning_posts),
        total_lessons_learned=max(len(insights_list), len(learned_lessons)),
        current_sentiment=current_sentiment,
        top_winning_posts=top_winning_posts,
        learned_lessons=learned_lessons,
        persistence_status=storage_status,
    )


@router.post(
    "/insights",
    response_model=AgentMemoryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Record a new explicit or confirmed audience guideline",
)
async def create_memory_insight(
    payload: AgentMemoryCreate,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    brand = None
    if payload.brand_id:
        brand = await verify_brand_access(db, payload.brand_id, current_user, min_role="editor")

    if not brand:
        accessible_ids = await get_accessible_brand_ids(db, current_user)
        if accessible_ids:
            b_res = await db.execute(select(Brand).where(Brand.id.in_(accessible_ids)).limit(1))
            brand = b_res.scalar_one_or_none()
        elif is_admin_user(current_user) or current_user.is_demo:
            b_res = await db.execute(select(Brand).limit(1))
            brand = b_res.scalar_one_or_none()
        if not brand:
            brand = Brand(name="SocioTrack", user_id=current_user.id, voice_description="Analytical, technical")
            db.add(brand)
            await db.flush()

    memory = await PersistentMemoryService.create_memory(
        db=db,
        brand=brand,
        insight_text=payload.insight_text,
        category=payload.category or "content_preferences",
        confidence_score=payload.confidence_score or 0.95,
        supporting_evidence=payload.supporting_evidence or "Direct user-entered guideline",
        source_event=payload.source_event or "explicit_directive",
        is_explicit=True,  # Explicit directive entered by user
        evidence_count=payload.evidence_count or 1,
        memory_type="explicit_directive",
    )

    return AgentMemoryResponse.model_validate(memory)


@router.put(
    "/insights/{insight_id}",
    response_model=AgentMemoryResponse,
    status_code=status.HTTP_200_OK,
    summary="Update or correct a learned insight",
)
async def update_memory_insight(
    insight_id: str,
    payload: AgentMemoryUpdate,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    memory, brand = await verify_memory_access(db, insight_id, current_user, min_role="editor")

    updated = await PersistentMemoryService.update_memory(
        db=db,
        memory=memory,
        brand=brand,
        new_text=payload.insight_text,
        new_category=payload.category,
        new_confidence=payload.confidence_score,
        is_active=payload.is_active,
        supporting_evidence=payload.supporting_evidence,
    )

    return AgentMemoryResponse.model_validate(updated)


@router.delete(
    "/insights/{insight_id}",
    status_code=status.HTTP_200_OK,
    summary="Deactivate or delete a learned insight",
)
async def delete_or_deactivate_memory_insight(
    insight_id: str,
    hard_delete: bool = Query(False, description="Whether to permanently delete instead of soft-deactivate"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    memory, brand = await verify_memory_access(db, insight_id, current_user, min_role="editor")

    await PersistentMemoryService.delete_memory(
        db=db,
        memory=memory,
        brand=brand,
        hard_delete=hard_delete,
    )

    action_label = "deleted" if hard_delete else "deactivated"
    return {"status": "success", "message": f"Insight '{insight_id}' {action_label}."}


@router.post(
    "/clear",
    status_code=status.HTTP_200_OK,
    summary="Clear all learned memories for a brand",
)
async def clear_brand_memories(
    payload: MemoryClearRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    brand = await verify_brand_access(db, payload.brand_id, current_user, min_role="admin")
    result = await PersistentMemoryService.clear_all_brand_memories(db, brand)
    return {
        "status": "success",
        "message": f"All memories cleared for brand '{brand.name}'.",
        "cleared_stats": result,
    }
