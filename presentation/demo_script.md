# SocioTrack: Hackathon Pitch & Live Demo Script

**Target Duration:** 3 minutes 30 seconds  
**Presenter:** Person 4 (with Person 1 & Person 3 co-piloting)  
**Track:** Agentic AI / Autonomous Systems / Enterprise AI

---

## 0:00 - 0:35 | Hook & The Problem: "The AI Content Trap"
- **Speaker:** "Judges, look at LinkedIn or Twitter right now. Over 80% of B2B SaaS accounts sound like the exact same generic AI copy: *'In today's fast-paced world, AI is a game-changing paradigm shift.'*
- Practitioners cringe. They scroll right past it.
- Why does this happen? Because generative AI tools are **amnesiac** and **unconstrained**.
- They don't remember what actually engaged your audience last week. They don't check brand voice rules. And when they get engagement data back, they completely discard it.
- Today, we're introducing **SocioTrack**: the first closed-loop Social Media Engagement Agent built with LangGraph and vector reinforcement learning that actually learns from live post performance."

---

## 0:35 - 1:15 | Architecture Overview: The LangGraph StateGraph
*(Display Slide 3 or the Next.js Dashboard at `http://localhost:3000`)*
- **Speaker:** "Instead of an unconstrained LLM loop that hallucinates and burns enterprise token budgets, SocioTrack runs on a deterministic **LangGraph StateGraph** with 4 specialized nodes:
  1. **`retrieve_brand_memory`**: Semantic vector search across past high-performing posts and live audience sentiment.
  2. **`draft_post_variations`**: Generates 3 distinct practitioner formats: Data-first, Contrarian Hot Take, and Tactical Breakdown.
  3. **`evaluate_brand_voice`**: A sub-second critique node checking brand Dos and Don'ts, scoring candidates from 0 to 10.
  4. **`update_memory_with_performance`**: Our reinforcement learning node. When post metrics are reported, it computes our viral composite score. If the score beats our 5.0 barrier, it extracts and embeds the winning rule into long-term vector memory."

---

## 1:15 - 2:10 | Live Demo 1: Multi-Format Generation & Voice Critique
*(Screen share Next.js Dashboard)*
- **Action:** Select brand `SocioTrack AI`, topic *"Deterministic State Management with LangGraph"*, click **"Draft 3 Variations"**.
- **Speaker:** "Watch what happens in real time:
  - First, the agent queries ChromaDB. It notices our audience sentiment is *'cautious and demanding'*, seeking concrete benchmarks.
  - Next, it produces 3 battle-tested formats:
    - **Format A (Data-first):** Leads with *'We analyzed 4,200 production runs... P99 latency dropped 73%'*.
    - **Format B (Hot take):** Leads with *'90% of multi-agent systems are overcomplicated while-loops'*.
    - **Format C (Tactical breakdown):** A clean 4-step architectural implementation framework.
  - Notice the green badge: our **Brand Voice Critique Node** evaluated all three against brand guidelines, awarded Format A a **10.0/10**, and verified zero hollow marketing hype."
- **Action:** Click **"Approve Post"** on Format A. Show the scheduled slot indicator.

---

## 2:10 - 3:00 | Live Demo 2: Closed-Loop Reinforcement Learning
*(Pan down to the SimulatorBar at the bottom)*
- **Speaker:** "Now comes the magic: **How does the agent learn?**
- In our bottom bar, we have our live engagement simulator.
- Let's test a mediocre post first: 10,000 views, 5 shares, 20 likes.
  - Composite Score: $0.45$.
  - Result: Ignored. The agent guards memory integrity so bad posts never pollute the knowledge store.
- Now let's inject a viral post: 10,000 views, 150 shares, 75 replies, 400 likes.
  - Formula: $(150 \times 3 + 75 \times 2 + 400 \times 1) / 10,000 \times 100 = 10.0$.
  - $10.0 > 5.0$!
- Click **'Simulate & Feed Memory'**!
- Look at the right drawer: **Learned Strategic Lessons** just updated!
- The agent extracted: *'P99 latency benchmarks and token reduction stats drive highest technical leadership share rates'*, embedded it with `all-MiniLM-L6-v2`, and stored it in ChromaDB."

---

## 3:00 - 3:30 | Technical Rigor & Business Impact
- **Speaker:** "Every single component is production-ready:
  - Strict Pydantic v2 schemas for all state contracts.
  - 10/10 passing unit and integration tests across LangGraph, ChromaDB, and FastAPI.
  - Supabase/PostgreSQL schema with `pgvector` compatibility and automatic SQLite local fallbacks.
  - Modular team ownership across Agent Core, FastAPI routes, Next.js UI, and Database seeding.
- SocioTrack transforms social media from an unpredictable cost center into an intelligent, compounding growth engine.
- Thank you! We are excited to take your questions."
