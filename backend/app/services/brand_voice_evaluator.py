"""
Brand Voice Evaluator Module.
Provides semantic and rule-based evaluation of draft copy against brand guidelines,
tone standards, platform constraints, and unsupported factual claims.
Distinguishes objective validations from subjective model judgments.
"""

import json
import logging
import re
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from app.services.ai_provider_service import ai_provider_service, AIProviderResult
from app.services.brand_context_engine import BrandContextSummary

logger = logging.getLogger("sociotrack.brand_voice_evaluator")


class BrandVoiceEvaluationResult(BaseModel):
    """Structured brand voice critique result."""
    match_score: float = Field(..., ge=0.0, le=10.0, description="Overall alignment score (0-10)")
    tone_alignment_score: float = Field(default=8.0, ge=0.0, le=10.0)
    audience_relevance_score: float = Field(default=8.0, ge=0.0, le=10.0)
    clarity_score: float = Field(default=8.5, ge=0.0, le=10.0)
    platform_fit_score: float = Field(default=8.5, ge=0.0, le=10.0)
    dos_matched: List[str] = Field(default_factory=list)
    donts_avoided: List[str] = Field(default_factory=list)
    unsupported_claims: List[str] = Field(default_factory=list)
    improvement_suggestions: List[str] = Field(default_factory=list)
    critique_summary: str
    is_model_evaluated: bool = Field(default=False)
    evaluator_model: Optional[str] = None


# ------------------------------------------------------------------------------
# Objective Rules Evaluation (Transparent Fallback)
# ------------------------------------------------------------------------------

def evaluate_objective_rules(
    content: str,
    brand_context: BrandContextSummary,
    platform: str = "Instagram",
    format_name: Optional[str] = None,
    target_tone: Optional[str] = None,
) -> BrandVoiceEvaluationResult:
    """
    Executes deterministic, transparent objective checks.
    Does not present superficial heuristics as proven performance metrics.
    """
    dos_matched = []
    donts_avoided = []
    unsupported_claims = []
    improvement_suggestions = []

    clean_text = content.strip()
    lower_text = clean_text.lower()

    # 1. Platform-Specific Objective Formatting Checks
    platform_fit_score = 8.5
    plat_lower = platform.lower()
    if plat_lower == "linkedin":
        if len(clean_text) < 150:
            platform_fit_score -= 1.0
            improvement_suggestions.append("Expand on the core takeaway with scannable paragraph breaks for LinkedIn dwell time.")
        else:
            dos_matched.append("Sufficient depth and paragraph structure for LinkedIn professional feed")
        if clean_text.count("#") > 3:
            platform_fit_score -= 1.0
            improvement_suggestions.append("LinkedIn posts perform best with 0-3 focused hashtags; reduce hashtag count.")
        else:
            donts_avoided.append("Controlled hashtag usage (avoided hashtag stuffing)")
    elif plat_lower == "instagram":
        if clean_text.count("#") > 5:
            platform_fit_score -= 1.5
            improvement_suggestions.append("Reduce Instagram hashtags to at most 3-5 high-relevance tags.")
        else:
            donts_avoided.append("Controlled hashtag usage suited for clean caption layout")
    elif plat_lower in ("x", "twitter"):
        if len(clean_text) > 280:
            platform_fit_score -= 2.0
            improvement_suggestions.append("Post exceeds 280 characters for single tweet; consider thread breakdown.")

    # 2. Check Call to Action / Engagement Prompt
    clarity_score = 8.5
    if "?" in clean_text or any(k in lower_text for k in ["comment", "share", "thoughts?", "bookmark", "save"]):
        dos_matched.append("Ends with a clear engagement prompt or practitioner question")
    else:
        clarity_score -= 1.0
        improvement_suggestions.append("Add an engaging closing question or clear action step to drive audience discussion.")

    # 3. Check for Hollow Hype / Buzzwords (Don'ts)
    buzzwords = ["game-changer", "revolutionary", "paradigm shift", "synergy", "miracle", "100x easier"]
    found_buzzwords = [bw for bw in buzzwords if bw in lower_text]
    tone_score = 8.5
    if not found_buzzwords:
        donts_avoided.append("Zero hollow marketing hype or unsubstantiated superlatives")
    else:
        tone_score -= 1.5
        improvement_suggestions.append(f"Remove generic marketing superlatives: {', '.join(found_buzzwords)}.")

    # 4. Check for Unsupported Factual Claims
    # Detect suspicious specific percentages without context (e.g., "boosts by 95%", "grew 400%")
    suspicious_claim_matches = re.findall(r"\b(\d{2,3}%\s+(?:increase|growth|boost|drop|reduction))\b", lower_text)
    if suspicious_claim_matches:
        for claim in suspicious_claim_matches:
            unsupported_claims.append(f"Claim '{claim}' requires empirical verification or framing as an industry benchmark.")
        tone_score -= 1.0
        improvement_suggestions.append("Frame specific numerical claims with clear source attribution or context.")
    else:
        donts_avoided.append("No unsubstantiated empirical percentage claims detected")

    # 5. Audience Relevance
    audience_score = 8.0
    if brand_context.target_audience and any(w in lower_text for w in brand_context.target_audience.lower().split()[:3]):
        audience_score = 9.0
        dos_matched.append(f"Directly references audience context ({brand_context.target_audience})")

    # Overall Match Score (Composite of objective checks)
    total_score = round(
        (tone_score * 0.3) + (audience_score * 0.25) + (clarity_score * 0.25) + (platform_fit_score * 0.2),
        1,
    )
    final_score = max(5.0, min(10.0, total_score))

    critique_summary = (
        f"Objective evaluation for {brand_context.brand_name} on {platform}: Match score {final_score}/10. "
        f"Demonstrated {len(dos_matched)} brand guidelines and avoided {len(donts_avoided)} negative patterns."
    )

    return BrandVoiceEvaluationResult(
        match_score=final_score,
        tone_alignment_score=round(tone_score, 1),
        audience_relevance_score=round(audience_score, 1),
        clarity_score=round(clarity_score, 1),
        platform_fit_score=round(platform_fit_score, 1),
        dos_matched=dos_matched,
        donts_avoided=donts_avoided,
        unsupported_claims=unsupported_claims,
        improvement_suggestions=improvement_suggestions,
        critique_summary=critique_summary,
        is_model_evaluated=False,
        evaluator_model="objective_rules_engine",
    )


# ------------------------------------------------------------------------------
# Model-Based Semantic Evaluation
# ------------------------------------------------------------------------------

async def evaluate_draft_voice(
    content: str,
    brand_context: BrandContextSummary,
    platform: str = "Instagram",
    format_name: Optional[str] = None,
    target_tone: Optional[str] = None,
    allow_model_call: bool = True,
) -> BrandVoiceEvaluationResult:
    """
    Evaluates candidate draft copy using genuine model reasoning where available,
    falling back to transparent objective rule checks when unconfigured.
    """
    if not allow_model_call or not ai_provider_service.is_provider_configured():
        return evaluate_objective_rules(
            content=content,
            brand_context=brand_context,
            platform=platform,
            format_name=format_name,
            target_tone=target_tone,
        )

    # Prepare Semantic Evaluation Prompt
    system_prompt = (
        "You are SocioTrack's Brand Voice & Quality Evaluation Agent. "
        "Your task is to critique social media copy against brand voice guidelines, target audience relevance, "
        "platform appropriateness, and check for unsupported factual claims.\n\n"
        "EVALUATION CRITERIA:\n"
        "1. Tone Alignment (0-10): Does the copy embody the brand's voice and tone?\n"
        "2. Audience Relevance (0-10): Is the message compelling for the target demographic?\n"
        "3. Clarity & Structure (0-10): Is it readable, scannable, with an effective hook and CTA?\n"
        "4. Platform Fit (0-10): Does it respect the platform's conventions and length?\n"
        "5. Unsupported Claims: Identify any fabricated statistics, customer testimonials, or unsupported metrics.\n"
        "6. Dos & Don'ts: List specific brand rules satisfied or avoided.\n"
        "7. Suggestions: Provide actionable improvement tips for the author.\n\n"
        "Respond strictly with valid JSON conforming to the requested schema."
    )

    dos_str = "\n".join(f"- {d}" for d in brand_context.content_dos)
    donts_str = "\n".join(f"- {d}" for d in brand_context.content_donts)

    user_prompt = f"""BRAND CONTEXT:
- Brand Name: {brand_context.brand_name}
- Voice: {target_tone or brand_context.voice_description}
- Target Audience: {brand_context.target_audience}
- Platform: {platform}
- Target Format: {format_name or 'General Post'}

BRAND GUIDELINES:
DO:
{dos_str}

DON'T:
{donts_str}

CONTENT TO EVALUATE:
\"\"\"
{content}
\"\"\"

Respond with valid JSON matching this schema:
{{
  "match_score": 8.7,
  "tone_alignment_score": 8.5,
  "audience_relevance_score": 9.0,
  "clarity_score": 8.5,
  "platform_fit_score": 9.0,
  "dos_matched": ["Demonstrates concrete practical utility", "Hook matches brand voice"],
  "donts_avoided": ["Zero generic buzzwords", "No hashtag stuffing"],
  "unsupported_claims": [],
  "improvement_suggestions": ["Consider adding a specific question at the end to prompt peer debate"],
  "critique_summary": "High alignment with brand voice. Strong hook and scannable layout."
}}"""

    try:
        provider_res: AIProviderResult = await ai_provider_service.call_ai_model(
            prompt=user_prompt,
            system_prompt=system_prompt,
            temperature=0.2,
            timeout_seconds=20.0,
            allow_fallback=True,
        )

        if provider_res.is_ai_generated and provider_res.structured_data:
            data = provider_res.structured_data
            return BrandVoiceEvaluationResult(
                match_score=float(data.get("match_score", 8.0)),
                tone_alignment_score=float(data.get("tone_alignment_score", 8.0)),
                audience_relevance_score=float(data.get("audience_relevance_score", 8.0)),
                clarity_score=float(data.get("clarity_score", 8.0)),
                platform_fit_score=float(data.get("platform_fit_score", 8.0)),
                dos_matched=data.get("dos_matched", []),
                donts_avoided=data.get("donts_avoided", []),
                unsupported_claims=data.get("unsupported_claims", []),
                improvement_suggestions=data.get("improvement_suggestions", []),
                critique_summary=data.get("critique_summary", "Model evaluation completed successfully."),
                is_model_evaluated=True,
                evaluator_model=f"{provider_res.provider}:{provider_res.model}",
            )
    except Exception as e:
        logger.warning(f"Semantic model evaluation failed ({e}). Falling back to objective rules.")

    # Fallback to objective rules if model call failed or returned empty
    return evaluate_objective_rules(
        content=content,
        brand_context=brand_context,
        platform=platform,
        format_name=format_name,
        target_tone=target_tone,
    )
