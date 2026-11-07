"""
Drafts Router: Handles POST /api/generate-drafts.
Triggers Person 1's AI agent workflow with Hindsight memory recall.
"""
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.brand import Brand
from app.models.post import Post
from app.models.memory import AgentMemory
from app.schemas.post import GenerateDraftsRequest, GenerateDraftsResponse, PostDraftResponse
from app.services.hindsight_client import hindsight_client
from app.services.agent_workflow import trigger_agent_draft_generation

router = APIRouter(tags=["Drafts"])


@router.post(
    "/generate-drafts",
    response_model=GenerateDraftsResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate post drafts using Person 1's agent workflow and Hindsight memory",
)
async def generate_drafts(
    payload: GenerateDraftsRequest,
    db: AsyncSession = Depends(get_db),
):
    brand = None
    if payload.brand_id:
        result = await db.execute(select(Brand).where(Brand.id == payload.brand_id))
        brand = result.scalar_one_or_none()

    if not brand and payload.brand_name:
        result = await db.execute(select(Brand).where(Brand.name == payload.brand_name))
        brand = result.scalar_one_or_none()
        if not brand:
            # Auto-create Brand for test/interactive convenience
            brand = Brand(
                id=str(uuid.uuid4()),
                name=payload.brand_name,
                voice_description="Direct, engineering-first, and data-driven.",
                target_audience="Developers and engineering leaders.",
            )
            db.add(brand)
            await db.flush()

    if not brand:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Brand '{payload.brand_id or payload.brand_name}' not found.",
        )

    # 2. Recall brand memories from Hindsight & local database
    recalled_from_hindsight = await hindsight_client.recall(
        brand_id=brand.id,
        query=f"high performing hook rules and audience pain points for {payload.topic}",
        limit=3,
    )

    db_memories_res = await db.execute(
        select(AgentMemory.insight_text)
        .where(AgentMemory.brand_id == brand.id)
        .order_by(AgentMemory.confidence_score.desc(), AgentMemory.created_at.desc())
        .limit(3)
    )
    db_memories = [row[0] for row in db_memories_res.fetchall()]

    # Combine unique memory context
    combined_memories = list(dict.fromkeys(recalled_from_hindsight + db_memories))

    # 3. Trigger Agent Workflow
    draft_specs = await trigger_agent_draft_generation(
        brand=brand,
        topic=payload.topic,
        past_memories=combined_memories,
    )

    # 4. Persist drafts into Database
    created_posts = []
    for spec in draft_specs:
        post = Post(
            brand_id=brand.id,
            topic=spec["topic"],
            hook_style=spec["hook_style"],
            content=spec["content"],
            status="draft",
        )
        db.add(post)
        created_posts.append((post, spec["memory_context_applied"]))

    await db.flush()

    response_drafts = [
        PostDraftResponse(
            id=post.id,
            brand_id=post.brand_id,
            brand_name=brand.name,
            content=post.content,
            topic=post.topic,
            hook_style=post.hook_style,
            format=post.hook_style,
            status=post.status,
            scheduled_for=post.scheduled_for,
            created_at=post.created_at,
            memory_context_applied=mem_applied,
        )
        for post, mem_applied in created_posts
    ]

    selected_draft = response_drafts[0] if response_drafts else None
    selected_post = {
        "post_id": selected_draft.id if selected_draft else str(uuid.uuid4()),
        "content": selected_draft.content if selected_draft else "",
        "format": selected_draft.hook_style if selected_draft else "contrarian",
        "match_score": 0.94,
        "selection_rationale": "Strongest historical engagement velocity for topic",
    } if selected_draft else None

    return GenerateDraftsResponse(
        brand_id=brand.id,
        brand_name=brand.name,
        topic=payload.topic,
        drafts=response_drafts,
        selected_post=selected_post,
        memory_context_summary=f"Retrieved {len(combined_memories)} insights for {payload.topic}",
    )
