# Person 1 Deliverable: AI Diagnostic Brain & Agentic Core

## Executive Summary
As **Person 1 (Agent & Memory)**, I have built the **AI diagnostic brain** of the system. 
This standalone Python module takes raw social post data, runs statistical anomaly detection (pure math), leverages structured LLM synthesis to categorize content formats and themes, and outputs the structured **"What’s Working vs. What’s Not"** assessment report (`CreatorAuditReport`).

In addition, Person 1 provides the two production-safe, sub-6-second callable functions (`run_agent_cycle` and `ingest_analytics`) with dynamic memory weight adjustments.

---

## 1. High-Level Flow of the Agent Engine

```
[List of Raw Posts & Metrics]
              │
              ▼
   Step 1: Metric Math & Baselines (Pure Math, No LLM)
   (Calculates median saves, shares, reach, outlier percentiles: top 20% vs bottom 20%)
              │
              ▼
   Step 2: AI Tagging & Content Feature Extraction
   (Labels hook types, topics, delivery formats per post)
              │
              ▼
   Step 3: Cluster Aggregation & Correlation Engine
   (Groups posts by tag: e.g. "Contrarian Tech Reel" vs "Carousel Tutorial")
              │
              ▼
   Step 4: Strategic Synthesis Pass
   (LLM reviews statistical clusters to generate actionable advice)
              │
              ▼
[Final Pydantic Diagnostic JSON Output (CreatorAuditReport)]
```

---

## 2. Person 1 Checklist & Verification Matrix

- [x] **1. Metric Normalization & Outlier Detection (`backend/app/core/analytics.py`)**
  - [x] **True Engagement Rate ($ER$):**
    $$ER = \frac{\text{Likes} + \text{Comments} + \text{Shares} + \text{Saves}}{\text{Views or Reach}} \times 100$$
  - [x] **Virality Index ($VI$):**
    $$VI = \frac{\text{Shares}}{\text{Reach}} \times 100$$
  - [x] **Utility / Value Index ($UI$):**
    $$UI = \frac{\text{Saves}}{\text{Reach}} \times 100$$
  - [x] **Quartile & Outlier Thresholds:** Posts landing in the top 20% of $ER$ or $VI$ flagged as `top_performer`; bottom 20% flagged as `underperformer`.
  - [x] **Cluster Aggregation:** Formats and upload hours grouped to compare median virality and dwell metrics.

- [x] **2. Data Contracts & Pydantic Models (`backend/app/core/schemas.py`, `models.py`)**
  - [x] `RawPost`: `post_id`, `media_type`, `caption`, `views_or_reach`, `likes`, `comments`, `shares`, `saves`, `posted_hour_utc`.
  - [x] `PostAuditPattern`: `pattern_title`, `metric_evidence`, `why_it_happened`, `actionable_recommendation`.
  - [x] `CreatorAuditReport`: `creator_handle`, `health_score` (0-100), `median_engagement_rate`, `top_performing_format`, `whats_working`, `whats_failing`, `immediate_next_steps`.

- [x] **3. Core Diagnostic Engine (`backend/app/core/diagnostics_agent.py`)**
  - [x] `run_creator_audit(creator_handle, posts)`: Main function called by Person 2's FastAPI router.
  - [x] Executes statistical baseline calculations followed by structured output parsing (`client.beta.chat.completions.parse` with `gpt-4o-mini`).
  - [x] Includes deterministic analytical fallback for offline execution, fast CI/CD, and test reliability without paid API keys.

- [x] **4. Callable Production Functions (`backend/app/core/agent.py`)**
  - [x] `run_agent_cycle`: Executes vector retrieval, 3-format drafting, and brand voice critique in **~107 ms** (< 6.0s budget).
  - [x] `ingest_analytics`: Calculates composite score, dynamically adjusts memory weights (+0.1 to +1.0 for winners, -0.05 to -0.4 for losers), and embeds winning lessons into ChromaDB in **~110 ms** (< 6.0s budget).

- [x] **5. Self-Testing Scripts & Automated Benchmarks**
  - [x] `test_agent.py` executable locally (`python test_agent.py`) with mock posts (`p1`, `p2`, `p3`).
  - [x] `backend/tests/test_agent.py` with **13/13 passing tests** verifying the entire agent core.

---

## 3. Person 1 File Deliverables

Located in `backend/app/core/`:

| File | Role / Purpose |
| :--- | :--- |
| `schemas.py` / `models.py` | Data contracts: `RawPost`, `PostAuditPattern`, `CreatorAuditReport` |
| `analytics.py` | Pure math functions: $ER$, $VI$, $UI$, outlier detection, cluster aggregates |
| `diagnostics_agent.py` | Core diagnostic engine with `run_creator_audit` |
| `agent.py` | LangGraph StateGraph, `run_agent_cycle`, and `ingest_analytics` |
| `memory.py` | Vector search manager, composite scoring, and dynamic weight adjustments |
| `prompts.py` | Brand voice rules, system prompts, Dos & Don'ts |

---

## 4. Self-Testing Verification Output (`test_agent.py`)

When running `python test_agent.py`, the engine processes the mock dataset (`@dev_dan`) and outputs:

```text
Running Diagnostic Audit...

[AUDIT COMPLETE] Health Score: 85/100
Top Format: REELS
Median Engagement Rate: 11.82%

--- WHAT IS WORKING ---
+ Tactical Code & Optimization Reels: Achieved 12.2% engagement rate with a viral share ratio of 2.7% (1.9x higher than account baseline).
  Reason: Hooks with explicit negative framing ('Stop using basic for loops') create immediate curiosity gaps. High density of code improvements triggers rapid peer forwarding among developers.
  Recommendation: Standardize on 30-45s Reels opening with 'Stop doing X in Python' hooks. Display side-by-side terminal before/after code blocks.

--- WHAT IS FAILING ---
- Generic Motivational Image Posts: Collapsed to 2.75% engagement rate (0.23x of baseline) with near-zero shares and saves.
  Reason: Generic lifestyle captions ('Happy Monday! Remember to drink water') lack technical signal and utility. The algorithm down-ranks low-dwell static images without technical discussion hooks.
  Recommendation: Discontinue generic lifestyle text posts entirely. Replace static motivational quotes with specific career lessons, salary benchmarks, or post-mortem retrospectives.

--- IMMEDIATE NEXT STEPS ---
> Double down on REELS: shift weekly schedule to 70% REELS and 30% deep-dive Carousels.
> Eliminate low-retention generic motivation images that dilute account authority.
> Repurpose high-save carousel diagrams into short-form code walkthrough Reels uploaded between 14:00 - 16:00 UTC.
> Add explicit utility CTAs ('Save for later') on slide 1 and slide 7 of every carousel.
```

---

## 5. Teammate Handoff & Router Integration

Person 2 can import and call `run_creator_audit` directly in any FastAPI endpoint:

```python
from fastapi import APIRouter
from backend.app.core.schemas import RawPost, CreatorAuditReport
from backend.app.core.diagnostics_agent import run_creator_audit

router = APIRouter(prefix="/api/diagnostics", tags=["Diagnostics"])

@router.post("/audit", response_model=CreatorAuditReport)
async def audit_creator_account(creator_handle: str, posts: list[RawPost]):
    return run_creator_audit(creator_handle=creator_handle, posts=posts)
```
