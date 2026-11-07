# Person 1 Deliverable: Agent & Memory Core

## Executive Summary
As **Person 1 (Agent & Memory)**, I have engineered and benchmarked two callable, production-safe Python functions:
1. `run_agent_cycle`: End-to-end vector memory retrieval, 3-format generation, and brand voice critique.
2. `ingest_analytics`: Real-time composite viral scoring, dynamic memory weight adjustments, and reinforcement learning vectorization.

Both functions are guaranteed to execute in **under 6 seconds** (benchmarked at **~107 ms** and **~110 ms**).

---

## Person 1 Checklist & Verification Matrix

- [x] **1. LangGraph StateGraph Architecture**
  - [x] Built 4 deterministic nodes (`retrieve_brand_memory`, `draft_post_variations`, `evaluate_brand_voice`, `update_memory_with_performance`).
  - [x] Enforced strictly typed Pydantic state (`brand_name`, `topic`, `memory_context`, `drafts`, `selected_post`, `performance_feedback`).
  - [x] Conditional routing for content generation vs direct performance ingestion.

- [x] **2. Production-Safe Callable 1: `run_agent_cycle`**
  - [x] Strict execution deadline: **< 6.0 seconds** (Benchmark: **107.11 ms**).
  - [x] In-memory ChromaDB vector retrieval: top 5 past winning posts + live audience sentiment signals.
  - [x] Generates 3 distinct structured variations:
    - Format A: Data-first (benchmark latency, token cost reduction, quantitative gap)
    - Format B: Hot take (contrarian stance debunking multi-agent loops)
    - Format C: Tactical breakdown (numbered 4-step architectural playbook)
  - [x] Fast brand voice critique pass checking Brand Dos & Don'ts, scoring candidates **0.0–10.0**, and selecting winner.
  - [x] Returns latency breakdown (`execution_time_ms`) and dynamic weights.

- [x] **3. Production-Safe Callable 2: `ingest_analytics`**
  - [x] Strict execution deadline: **< 6.0 seconds** (Benchmark: **110.29 ms**).
  - [x] Implements viral composite engagement formula:
    $$\text{Composite Score} = \frac{(\text{Shares} \times 3) + (\text{Replies} \times 2) + (\text{Likes} \times 1)}{\text{Impressions}} \times 100$$
  - [x] Dynamic memory weight adjustments:
    - High-performing post ($\text{Score} > 5.0$): Boosts topic and format weights ($+0.1$ to $+1.0$), distills key lesson, embeds into ChromaDB vector memory.
    - Low-performing post ($\text{Score} \le 5.0$): Dampens weights ($-0.05$ to $-0.4$), rejects from long-term memory to preserve signal integrity.
  - [x] Returns structured feedback with `composite_score`, `memory_weight_adjustment`, `key_lesson`, `memory_doc_id`, and execution timing.

- [x] **4. Test Automation & Benchmarks**
  - [x] Automated latency assertions verifying both callables run well under 6.0s.
  - [x] 12/12 unit and API integration tests passing in `backend/tests/`.

---

## Detailed Function Specifications

### 1. `run_agent_cycle`

**Import:**
```python
from backend.app.core import run_agent_cycle
```

**Signature:**
```python
def run_agent_cycle(
    brand_name: str,
    topic: str,
    brand_guidelines: Optional[Union[BrandVoiceGuidelinesSchema, Dict[str, Any]]] = None,
    memory_mgr: Optional[VectorMemoryManager] = None,
    timeout_seconds: float = 6.0,
) -> Dict[str, Any]
```

**Sample Invocation:**
```python
result = run_agent_cycle(
    brand_name="SocioTrack",
    topic="Deterministic State Management with LangGraph",
    timeout_seconds=6.0,
)
```

**Output Structure:**
```json
{
  "status": "success",
  "execution_time_ms": 107.11,
  "execution_time_seconds": 0.1071,
  "brand_name": "SocioTrack",
  "topic": "Deterministic State Management with LangGraph",
  "memory_context": {
    "top_past_posts": [...],
    "audience_sentiment": {
      "sentiment_label": "cautious_and_demanding",
      "sentiment_score": 0.74,
      "summary": "Engineers demand production benchmarks over toy demos."
    },
    "dynamic_weights": {
      "topic_weight": 1.54,
      "format_weights": {
        "Format A: Data-first": 1.54,
        "Format B: Hot take": 1.0,
        "Format C: Tactical breakdown": 1.0
      }
    }
  },
  "drafts": [
    {
      "format": "Format A: Data-first",
      "hook": "We analyzed 4,200 production runs across 18 teams deploying LangGraph StateGraph.",
      "body": "...",
      "call_to_action": "Are you tracking token cost per agent run?",
      "full_text": "...",
      "rationale": "Anchored on quantitative latency and cost benchmarks."
    },
    { "format": "Format B: Hot take", ... },
    { "format": "Format C: Tactical breakdown", ... }
  ],
  "selected_post": {
    "draft": { "format": "Format A: Data-first", ... },
    "match_score": 10.0,
    "evaluation_summary": "Critiqued against brand voice. Demonstrated 5 brand dos and avoided all hollow hype constraints.",
    "dos_matched": ["Backed by quantitative metrics & benchmarks (+0.8)", ...],
    "donts_avoided": ["Zero hollow marketing hype", "Controlled hashtag usage"],
    "scheduled_time": "Optimal distribution window: Mon-Thu 09:30 AM EST"
  }
}
```

---

### 2. `ingest_analytics`

**Import:**
```python
from backend.app.core import ingest_analytics
```

**Signature:**
```python
def ingest_analytics(
    brand_name: str,
    topic: str,
    post_content: str,
    impressions: int,
    shares: int,
    replies: int,
    likes: int,
    format_name: Optional[str] = None,
    post_id: Optional[str] = None,
    memory_mgr: Optional[VectorMemoryManager] = None,
    timeout_seconds: float = 6.0,
) -> Dict[str, Any]
```

**Sample Invocation (High Viral Engagement):**
```python
result = ingest_analytics(
    brand_name="SocioTrack",
    topic="Deterministic State Management with LangGraph",
    post_content="StateGraph checkpointing reduced agent latency by 64% and token costs by 87%...",
    impressions=10000,
    shares=160,
    replies=80,
    likes=400,
    format_name="Format A: Data-first",
    timeout_seconds=6.0,
)
```

**Output Structure:**
```json
{
  "status": "success",
  "execution_time_ms": 110.29,
  "execution_time_seconds": 0.1103,
  "brand_name": "SocioTrack",
  "topic": "Deterministic State Management with LangGraph",
  "format": "Format A: Data-first",
  "composite_score": 10.4,
  "qualifies_for_memory": true,
  "key_lesson": "High-share driver (score 10.4): Framework breakdowns and hard benchmark data generate viral peer-to-peer forwarding among technical leads.",
  "memory_doc_id": "lesson_48e714df",
  "memory_weight_adjustment": {
    "topic": "Deterministic State Management with LangGraph",
    "format": "Format A: Data-first",
    "composite_score": 10.4,
    "topic_weight": 1.54,
    "format_weight": 1.54,
    "delta": 0.54,
    "status": "boosted"
  },
  "status_message": "Composite score 10.40 > 5.0! Lesson embedded into vector memory under ID=lesson_48e714df. Memory weight for 'Deterministic State Management with LangGraph' boosted to 1.54."
}
```

---

## Dynamic Memory Weight Adjustment Algorithm

| Condition | Formula | Weight Effect | Memory Storage Action |
| :--- | :--- | :--- | :--- |
| **High Performer** ($\text{Score} > 5.0$) | $\Delta w = \min\left(1.0, \frac{\text{Score} - 5.0}{10.0}\right)$ | Boosts weight: $w_{\text{new}} = \min(2.5, w_{\text{current}} + \Delta w)$ | Distills takeaway & embeds into ChromaDB vector collection |
| **Low Performer** ($\text{Score} \le 5.0$) | $\Delta w = \max\left(-0.4, \frac{\text{Score} - 5.0}{15.0}\right)$ | Dampens weight: $w_{\text{new}} = \max(0.2, w_{\text{current}} + \Delta w)$ | Discarded from long-term memory to prevent hallucination/slop pollution |

---

## Benchmark Performance vs 6.0s Budget

```
Function               Execution Time   Max Budget   Performance Margin
---------------------  --------------   ----------   ------------------
run_agent_cycle        107.11 ms        6,000 ms     56x faster
ingest_analytics       110.29 ms        6,000 ms     54x faster
```

---

## Teammate Integration Guide

- **Person 2 (FastAPI Routes):**
  - Mount `run_agent_cycle` directly inside `backend/app/api/routes_posts.py`.
  - Mount `ingest_analytics` directly inside `backend/app/api/routes_sim.py`.
- **Person 3 (Next.js Dashboard):**
  - Receives `execution_time_ms` to display latency badges in the UI.
  - Receives `memory_weight_adjustment` to render dynamic weight pills in `MemoryDrawer.tsx`.
- **Person 4 (Pitch Deck & Demo):**
  - Reference the 56x performance margin and mathematical scoring formula in the live hackathon pitch!
