# SocioTrack — Hackathon Scope & Boundary Contract

This document locks the architectural and functional boundaries for **Hack With Bangalore 4.0** (Hindsight Track) to eliminate change amplification and scope creep.

---

## 1. Team Ownership & Public Seams

```
┌────────────────────────────────────────────────────────┐
│                   Person 3 (Frontend)                  │
│       Next.js 14 Dashboard: DraftQueue, SimulatorBar,   │
│                      MemoryDrawer                      │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP JSON Contracts
┌───────────────────────────▼────────────────────────────┐
│              Person 2 (Backend API & DB Layer)         │
│     FastAPI Public Seam: 5 Endpoints & PostgreSQL      │
│             engagement_score calculation               │
└─────────────┬────────────────────────────┬─────────────┘
              │ Direct Python Seam         │ OpenAPI / SDK
┌─────────────▼───────────────┐ ┌──────────▼─────────────┐
│    Person 1 (Agent Core)    │ │ Person 4 (Data & Eval) │
│ LangGraph StateGraph Core & │ │ Seed Scripts, 15 Posts │
│    Hindsight Memory Loop    │ │ Pitch Deck & Demo Script│
└─────────────────────────────┘ └────────────────────────┘
```

| Team Member | Subsystem | Public Seam (Input/Output Contract) |
| :--- | :--- | :--- |
| **Person 1** | Agent Workflow & Prompt Core | `run_agent_cycle(brand_id, topic) -> list[PostDraft]` |
| **Person 2** | Backend API & Database | 5 REST Routes (`/generate-drafts`, `/posts/approve`, `/posts/queue`, `/simulator/feed-metrics`, `/memory/insights`) + PostgreSQL Schema |
| **Person 3** | Frontend Dashboard | UI components consuming `/api/*` (`DraftQueue`, `SimulatorBar`, `MemoryDrawer`) |
| **Person 4** | Seed Data & Pitch Deck | `backend/db/seed.sql`, `seed_data.json`, `pitch_deck.pdf`, `demo_script.md` |

---

## 2. The 5 Core Invariant Endpoints

All 4 teammates develop strictly against these 5 HTTP contracts:

1. `POST /api/generate-drafts`
   - Input: `{ "brand_id": UUID, "topic": string }`
   - Output: `{ "drafts": [ { "id": UUID, "content": string, "topic": string, "hook_style": string, "status": "draft" } ] }`

2. `POST /api/posts/approve`
   - Input: `{ "post_id": UUID, "approved_content": string, "scheduled_time": ISO8601 }`
   - Output: `{ "id": UUID, "status": "scheduled", "scheduled_for": ISO8601 }`

3. `GET /api/posts/queue`
   - Query: None (or optional `brand_id`)
   - Output: `[ { "id": UUID, "content": string, "hook_style": string, "status": "scheduled" | "pending_approval", "scheduled_for": ISO8601 } ]`

4. `POST /api/simulator/feed-metrics`
   - Input: `{ "post_id": UUID, "impressions": int, "likes": int, "replies": int, "shares": int }`
   - Logic: Computes `engagement_score = (likes*2 + replies*3 + shares*4) / impressions * 100`
   - Side Effect: Triggers `retain` / `reflect` on `AgentMemory`
   - Output: `{ "post_id": UUID, "engagement_score": float, "insight_generated": string | null }`

5. `GET /api/memory/insights?brand_id={id}`
   - Query: `brand_id: UUID`
   - Output: `[ { "id": UUID, "insight_text": string, "category": string, "confidence_score": float } ]`

---

## 3. Strict Inclusions (IN SCOPE)

- **PostgreSQL + pgvector / Hindsight Integration**: Vector dimension `1536` for semantic audience pain points and hook rules.
- **Offline / Graceful Fallback**: If OpenAI API key is unavailable or rate-limited, system falls back gracefully to template heuristics with valid vector hashes so the demo **never crashes on stage**.
- **Deterministic Seed Data**: 3 distinct brand profiles (Tech SaaS, Health/Wellness, FinTech) preloaded with realistic historical posts and memories.
- **CORS & Immediate UI Unblocking**: Allow all origins on local ports (`localhost:3000`, `localhost:8000`).

---

## 4. Strict Exclusions (OUT OF SCOPE — Cut to Prevent Bloat)

- ❌ **Real Social Media OAuth**: No Twitter/X or LinkedIn OAuth integrations. All publishing and metric ingestion are handled via the Simulator.
- ❌ **User Authentication / RBAC**: No multi-tenant user signup/login screens. The dashboard operates on single active brand selector.
- ❌ **Multimedia / Video Rendering**: Posts are text and markdown-focused. No Canva or video generation pipelines.
- ❌ **External Distributed Brokers**: No Celery, Redis, or Kafka. Asynchronous operations run in FastAPI background tasks or standard Python `asyncio`.
