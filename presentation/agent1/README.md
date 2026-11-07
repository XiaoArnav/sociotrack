# Person 1 (Agent & Memory): Checklist & Production Callables

> See [agent1.md](../agent1.md) for full interface signatures and benchmark logs.

## Checklist
- [x] **run_agent_cycle**: Callable function executing in < 6 seconds (Benchmark: **~107 ms**).
- [x] **ingest_analytics**: Callable function executing in < 6 seconds (Benchmark: **~110 ms**).
- [x] **Vector Context Retrieval**: Pulls top 5 past winning posts and real-time audience sentiment from ChromaDB.
- [x] **Structured Drafts Generation**: Generates Format A (Data-first), Format B (Hot take), Format C (Tactical breakdown).
- [x] **Brand Voice Critique Pass**: Evaluates Dos & Don'ts, outputs 0-10 match score, and selects best draft.
- [x] **Dynamic Memory Weight Adjustment**:
  - Score > 5.0: Boosts topic/format weights ($+0.1$ to $+1.0$) and vectorizes key lesson into long-term memory.
  - Score <= 5.0: Dampens weights ($-0.05$ to $-0.4$) and shields memory from low-signal pollution.
- [x] **Unit & Benchmark Tests**: 12/12 passing tests in `backend/tests/`.
