# SocioTrack — AI Social Media Engagement Agent

SocioTrack is an autonomous social media content optimization and audience memory agent that generates brand-aligned post drafts, schedules approved content, simulates engagement feedback, and continuously refines cognitive memory rules.

## Ubiquitous Language

### Core Entities

**Brand**:
The organizational identity defining audience constraints, voice guidelines, and content guidelines.
_Avoid_: Account, client, tenant, profile

**Post**:
A unit of social media content authored for a brand with a defined hook, topic, and delivery lifecycle.
_Avoid_: Tweet, status, update, submission

**Post Status**:
The lifecycle state of a post: `draft` (generated), `pending_approval` (submitted for human sign-off), `scheduled` (approved with target publication timestamp), or `published` (broadcasted).
_Avoid_: Post state, status flag

**Hook Style**:
The stylistic angle or narrative pattern of a post's opener (e.g., `question`, `contrarian`, `statistic`, `story`, `bullet_list`).
_Avoid_: Format, hook type, angle, style template

**Engagement Score**:
The normalized weighted metric evaluating audience response: `(likes * 2 + replies * 3 + shares * 4) / max(impressions, 1) * 100`.
_Avoid_: Composite score, viral score, performance index

**Agent Memory**:
A learned cognitive behavioral rule or audience insight derived from observed post engagement, stored with a 1536-dimensional vector embedding.
_Avoid_: Rule, vector entry, knowledge base item

**Insight Category**:
The taxonomy of learned memories: `hook_rule` (content structure), `timing_rule` (temporal publication bias), or `audience_pain_point` (topical resonance).
_Avoid_: Rule type, memory type, tag

**Confidence Score**:
A decimal rating between 0.0 and 1.0 quantifying how reliably a learned memory predicts audience resonance.
_Avoid_: Weight, threshold, certainty

### Feedback & Simulation

**Feed Simulation**:
Synthetic or recorded injection of social reactions (`impressions`, `likes`, `replies`, `shares`) for a scheduled or published post to test the feedback loop.
_Avoid_: Mock feedback, test event, metric dump

**Cognitive Feedback Loop**:
The reflection and retention cycle where high or low engagement triggers an update or reinforcement to `AgentMemory` (via pgvector or Hindsight API).
_Avoid_: Memory loop, reinforcement pipeline, training step
