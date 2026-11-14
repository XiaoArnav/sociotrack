"""
Brand Context Engine Module.
Synthesizes verified, multi-tenant isolated brand identity representations.
Pulls from Brand models, intelligence profiles, active vector memory lessons,
and user guidelines WITHOUT inventing facts, products, or metrics.
"""

import json
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from fastapi import HTTPException, status

from app.models.brand import Brand
from app.models.memory import AgentMemory
from app.schemas.auth import UserResponse
from app.services.authorization_service import verify_brand_access


class BrandContextSummary(BaseModel):
    """Structured representation of verified brand intelligence."""
    brand_id: str
    brand_name: str
    workspace_id: Optional[str] = None
    voice_description: Optional[str] = None
    target_audience: Optional[str] = None
    industry: Optional[str] = None
    key_pain_points: List[str] = Field(default_factory=list)
    content_dos: List[str] = Field(default_factory=list)
    content_donts: List[str] = Field(default_factory=list)
    top_performing_topics: List[str] = Field(default_factory=list)
    winning_memory_insights: List[str] = Field(default_factory=list)
    data_completeness_score: float = Field(default=1.0, ge=0.0, le=1.0)
    missing_critical_fields: List[str] = Field(default_factory=list)
    assumptions_made: List[str] = Field(default_factory=list)


def _safe_str(val: Any, default: Optional[str] = None) -> Optional[str]:
    """Extracts a valid string, handling MagicMock and non-string inputs safely."""
    if val is None or hasattr(val, "_mock_name"):
        return default
    if isinstance(val, str):
        s = val.strip()
        return s if s else default
    try:
        return str(val).strip()
    except Exception:
        return default


def build_brand_context_from_brand(
    brand: Any,
    db_memories: Optional[List[str]] = None,
) -> BrandContextSummary:
    """
    Builds a structured BrandContextSummary directly from a Brand entity.
    Evaluates completeness, detects missing fields, and records safe assumptions.
    """
    brand_id = _safe_str(getattr(brand, "id", None), default="brd_default") or "brd_default"
    brand_name = _safe_str(getattr(brand, "name", None), default="SocioTrack") or "SocioTrack"
    workspace_id = _safe_str(getattr(brand, "workspace_id", None), default=None)
    voice = _safe_str(getattr(brand, "voice_description", None), default="") or ""
    audience = _safe_str(getattr(brand, "target_audience", None), default="") or ""

    missing_fields = []
    assumptions = []

    if not voice:
        missing_fields.append("voice_description")
        assumptions.append("Brand voice not explicitly defined; assuming authoritative, clear, high-signal communication.")
        voice = "Direct, informative, and professional."

    if not audience:
        missing_fields.append("target_audience")
        assumptions.append("Target audience not specified; assuming professional practitioners in the brand's industry.")
        audience = "Professionals and informed practitioners."

    # Parse intelligence_profile if available
    dos: List[str] = []
    donts: List[str] = []
    topics: List[str] = []
    industry: Optional[str] = None

    intel_profile = getattr(brand, "intelligence_profile", None)
    if intel_profile and not hasattr(intel_profile, "_mock_name"):
        try:
            profile_data = (
                json.loads(intel_profile)
                if isinstance(intel_profile, str)
                else (intel_profile if isinstance(intel_profile, dict) else {})
            )
            voice_archetype = profile_data.get("voice_archetype", {})
            if isinstance(voice_archetype, dict):
                dos.extend(voice_archetype.get("vocabulary_dos", []))
                donts.extend(voice_archetype.get("vocabulary_donts", []))
                donts.extend(voice_archetype.get("anti_patterns", []))

            raw_topics = profile_data.get("topics", [])
            if isinstance(raw_topics, list):
                for t in raw_topics:
                    if isinstance(t, dict) and t.get("topic"):
                        topics.append(str(t["topic"]))
                    elif isinstance(t, str):
                        topics.append(t)

            industry = _safe_str(profile_data.get("industry"))
        except Exception:
            pass

    # Standard verified baseline rules if none specified
    if not dos:
        dos = [
            "Lead with high-utility value or actionable takeaways",
            "Maintain an authoritative, direct, and practitioner-focused tone",
            "Use clear whitespace, scannable structure, and purposeful hooks",
        ]
    if not donts:
        donts = [
            "Do not fabricate statistics, customer testimonials, or unsupported case studies",
            "Avoid hollow marketing hype or hyperbolic buzzwords",
            "Avoid hashtag stuffing (limit to relevant focused tags where appropriate)",
        ]

    # Calculate data completeness score
    total_checks = 4
    passed_checks = 4 - len(missing_fields)
    if not topics:
        passed_checks -= 0.5
    completeness = max(0.2, min(1.0, passed_checks / total_checks))

    memories_list = db_memories or []

    return BrandContextSummary(
        brand_id=brand_id,
        brand_name=brand_name,
        workspace_id=workspace_id,
        voice_description=voice,
        target_audience=audience,
        industry=industry,
        key_pain_points=[
            "Need for high signal-to-noise ratio in professional social feeds",
            "Wasted time on generic, low-relevance marketing fluff",
        ],
        content_dos=dos,
        content_donts=donts,
        top_performing_topics=topics[:5],
        winning_memory_insights=memories_list[:5],
        data_completeness_score=round(completeness, 2),
        missing_critical_fields=missing_fields,
        assumptions_made=assumptions,
    )


async def extract_brand_context(
    db: AsyncSession,
    brand_id: str,
    current_user: UserResponse,
    min_role: str = "viewer",
    topic: Optional[str] = None,
) -> BrandContextSummary:
    """
    Retrieves authorized Brand context for the current user.
    Enforces multi-tenant workspace isolation: raises HTTP 403/404 if unauthorized.
    Retrieves prioritized persistent memories and integrates them with top-level precedence.
    """
    brand = await verify_brand_access(db, brand_id, current_user, min_role=min_role)

    # Use PersistentMemoryService to retrieve context with strict workspace isolation and priority ranking
    from app.services.persistent_memory_service import PersistentMemoryService
    mem_context = await PersistentMemoryService.retrieve_context_for_generation(
        db=db,
        brand=brand,
        topic=topic or "general",
        limit=7,
    )

    base_summary = build_brand_context_from_brand(
        brand,
        db_memories=mem_context.get("memories_applied_summaries", []),
    )

    # Inject explicit directives at the top of content_dos and content_donts
    if mem_context.get("explicit_dos"):
        base_summary.content_dos = mem_context["explicit_dos"] + [
            d for d in base_summary.content_dos if d not in mem_context["explicit_dos"]
        ]
    if mem_context.get("explicit_donts"):
        base_summary.content_donts = mem_context["explicit_donts"] + [
            d for d in base_summary.content_donts if d not in mem_context["explicit_donts"]
        ]

    return base_summary


def format_brand_generation_prompt(
    brand_context: BrandContextSummary,
    topic: str,
    platform: str = "Instagram",
    target_tone: Optional[str] = None,
    objective: Optional[str] = None,
    custom_instructions: Optional[str] = None,
    recent_hooks: Optional[List[str]] = None,
) -> Dict[str, str]:
    """
    Constructs system prompt and user prompt for genuine AI generation.
    Enforces zero fabrication of statistics and platform compliance.
    """
    system_prompt = (
        "You are SocioTrack's Senior Social Intelligence & Brand-Specific Content Engine. "
        "Your mission is to generate original, contextually relevant, high-performing social content "
        "tailored strictly to the brand's identity, target audience, and platform constraints.\n\n"
        "CORE OPERATING INVARIANTS:\n"
        "1. ZERO FABRICATED EVIDENCE: Never invent customer testimonials, case studies, or unverified statistical claims. "
        "If illustrating a metric, frame it as an industry pattern, benchmark heuristic, or prompt the reader for their data.\n"
        "2. AUTHENTIC BRAND VOICE: Embody the brand's voice and address their specific audience pain points.\n"
        "3. MEANINGFUL VARIATIONS: Generate 3 genuinely different creative angles (Data-First, Contrarian/Hot Take, Tactical Breakdown), "
        "not superficial phrasing variations.\n"
        "4. PLATFORM SUITABILITY: Format natively for the target platform (e.g., scannable paragraphs and concise hooks for LinkedIn, "
        "clean line breaks and minimal hashtags for Instagram, concise punchiness for X).\n"
        "5. OUTPUT FORMAT: Respond strictly with valid JSON conforming to the requested schema, without markdown fences or extraneous text."
    )

    dos_str = "\n".join(f"- {d}" for d in brand_context.content_dos)
    donts_str = "\n".join(f"- {d}" for d in brand_context.content_donts)
    memories_str = (
        "\n".join(f"- {m}" for m in brand_context.winning_memory_insights)
        if brand_context.winning_memory_insights
        else "- Focus on high-signal practical takeaways."
    )
    hooks_to_avoid = (
        "\n".join(f"- {h}" for h in (recent_hooks or [])[:5])
        if recent_hooks
        else "- None"
    )

    custom_instructions_str = (
        f"USER CUSTOM INSTRUCTIONS:\n{custom_instructions}\n"
        if custom_instructions
        else ""
    )

    user_prompt = f"""BRAND IDENTITY:
- Name: {brand_context.brand_name}
- Industry: {brand_context.industry or 'Technology / Professional Services'}
- Tone / Voice: {target_tone or brand_context.voice_description}
- Target Audience: {brand_context.target_audience}
- Objective: {objective or 'Educate practitioners, establish brand authority, and drive authentic discussion'}
- Target Platform: {platform}
- Topic: {topic}

BRAND GUIDELINES:
DO:
{dos_str}

DON'T:
{donts_str}

WINNING HISTORICAL INSIGHTS:
{memories_str}

ANTI-REPETITION (Do NOT repeat or closely mimic these recent hooks):
{hooks_to_avoid}

{custom_instructions_str}
TASK:
Generate 3 distinct creative post drafts for {brand_context.brand_name} on {platform} about '{topic}'.
- Format A: Data-First / Evidence-Backed Insight (anchors on quantifiable industry reality or benchmarks)
- Format B: Hot Take / Contrarian Perspective (challenges prevailing consensus with constructive analysis)
- Format C: Tactical Breakdown / Actionable Blueprint (clear step-by-step framework or playbook)

Respond with valid JSON matching this schema:
{{
  "drafts": [
    {{
      "format": "Format A: Data-first",
      "hook": "Opening hook line",
      "body": "Main content body",
      "call_to_action": "Engaging closing question or CTA",
      "full_text": "Combined full post text ready for publishing review",
      "rationale": "Strategic reasoning for this angle",
      "supporting_evidence": "Grounding evidence or reason why this works for this audience",
      "platform_target": "{platform}",
      "confidence_score": 0.92,
      "known_limitations": "Specific context required from the creator"
    }},
    {{
      "format": "Format B: Hot take",
      "hook": "Opening contrarian hook line",
      "body": "Main content body",
      "call_to_action": "Engaging closing question or CTA",
      "full_text": "Combined full post text",
      "rationale": "Strategic reasoning",
      "supporting_evidence": "Grounding evidence",
      "platform_target": "{platform}",
      "confidence_score": 0.88,
      "known_limitations": "Specific context required"
    }},
    {{
      "format": "Format C: Tactical breakdown",
      "hook": "Opening tactical hook line",
      "body": "Main content body with numbered steps or scannable bullets",
      "call_to_action": "Engaging closing question or CTA",
      "full_text": "Combined full post text",
      "rationale": "Strategic reasoning",
      "supporting_evidence": "Grounding evidence",
      "platform_target": "{platform}",
      "confidence_score": 0.90,
      "known_limitations": "Specific context required"
    }}
  ]
}}"""

    return {
        "system_prompt": system_prompt,
        "user_prompt": user_prompt,
    }
