# ADR 0002: Closed-Loop Feedback and Dynamic Memory Injection

## Status
Accepted

## Context
The primary differentiating capability of SocioTrack over static generative AI dashboards is that it **learns from audience behavior and becomes smarter with every interaction**. 

The hackathon demonstration requires an interactive feedback loop where:
1. A user adjusts live engagement metrics (impressions, shares, replies, likes).
2. The agent executes a 5-step analysis process.
3. If the composite score exceeds the 5.0 quality barrier, a new learned audience preference is synthesized.
4. The newly learned rule is injected dynamically into the Agent Memory panel with visual prominence (`NEW` badge, glowing entrance) without requiring a full page refresh.

## Decision
We implemented a decoupled event-driven feedback pipeline across `LiveEngagementLab.tsx`, `IntelligenceCore.tsx`, and `AgentMemoryPanel.tsx`:
1. **Mathematical Scoring Function**:
   $$\text{Composite Score} = \frac{(\text{Shares} \times 3) + (\text{Replies} \times 2) + (\text{Likes} \times 1)}{\text{Impressions}} \times 100$$
2. **5-Step Simulation Stepper**: A timed progression through data ingestion, audience response analysis, pattern identification, memory distillation, and recommendation refinement.
3. **Reactive Core State**: The `SocioTrack Intelligence Core` transitions its active node to `memory` during submission, providing unified visual confirmation of internal cognitive activity.
4. **Optimistic Memory Prepending**: The synthesized insight card is prepended to the `insights` state array with `isNew: true`, triggering a distinct border, lavender halo, and `NEW` pill.

## Consequences
- **Positive**: Directly satisfies the most critical hackathon demonstration criteria.
- **Positive**: Zero coupling to slow external network loops—delivers instant feedback with realistic millisecond timing.
- **Positive**: Clean public seam between metric submission and memory rendering.
