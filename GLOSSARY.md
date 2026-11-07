# SocioTrack Domain Glossary (`GLOSSARY.md`)

This glossary establishes the **ubiquitous domain language** for the SocioTrack project across engineering, product design, and presentation. All modules, tests, schemas, and UI components must strictly adhere to these definitions.

---

## 1. Core Concepts & Agentic Architecture

### **SocioTrack**
The autonomous, closed-loop AI social media engagement and audience intelligence agent built for the Microsoft Hackathon. Unlike traditional scheduling or generative tools, SocioTrack learns from real engagement feedback and continuously improves future content recommendations.

### **SocioTrack Intelligence Core**
The 4-node connected cognitive visualization representing the agent's internal architecture:
1. **Content Generation Node**: Synthesizes multi-format post drafts using retrieved memory patterns.
2. **Audience Analysis Node**: Tracks real-time audience sentiment signals and topic curiosity.
3. **Agent Memory Node**: The reinforced vector store holding empirical rules, save multipliers, and past winners.
4. **Engagement Prediction Node**: Neural evaluation pass calculating virality probability and brand voice compliance.

### **Closed-Loop Feedback System**
An autonomous reinforcement loop where published post engagement metrics (impressions, shares, replies, likes) are ingested, evaluated, and used to dynamically update agent memory weights and system prompt guidelines.

---

## 2. Metrics & Algorithmic Scoring

### **Composite Viral Score**
The weighted engagement formula used to evaluate post resonance:
$$\text{Composite Score} = \frac{(\text{Shares} \times 3) + (\text{Replies} \times 2) + (\text{Likes} \times 1)}{\text{Impressions}} \times 100$$
- **Shares ($3\times$)**: Highest-signal metric indicating peer advocacy and knowledge bookmarking.
- **Replies ($2\times$)**: High-signal metric representing conversation depth and audience investment.
- **Likes ($1\times$)**: Base-level positive sentiment signal.
- **Impressions**: Normalization baseline preventing high-follower distortion.

### **Memory Distillation Threshold (5.0 Barrier)**
- **$\text{Score} > 5.0$**: Qualifies for long-term memory distillation. The agent extracts the core empirical rule (e.g., *"Contrarian takes yield 3.4x more saves"*), boosts the topic weight ($+0.1$ to $+1.0$), and embeds the lesson into ChromaDB / Hindsight vector storage.
- **$\text{Score} \le 5.0$**: Fails the threshold. The post is discarded from long-term memory to protect the vector store from low-signal noise.

---

## 3. Brand Voice & Content Formats

### **Brand Voice Critique Pass**
A deterministic evaluation node scoring draft candidates from **0.0 to 10.0** against explicit brand Dos (e.g., quantified benchmark claims in opening lines) and Don'ts (e.g., no generic buzzwords or hollow marketing hype).

### **Hook Styles**
1. **Format A (Data-First Technical)**: Leads with concrete benchmark figures, token cost reductions, and quantitative architectural gaps.
2. **Format B (Contrarian Hot Take)**: Challenges industry dogma (e.g., unconstrained multi-agent loops) grounded in pragmatic engineering reality.
3. **Format C (Tactical Breakdown)**: A 4-step numbered procedural playbook optimized for developer bookmarking.

### **Explainability Callout ("Why SocioTrack generated this")**
A transparent UI callout citing the specific historical audience insight and memory vector that caused the agent to select a specific hook style and tone.

---

## 4. UI & Interaction Components

### **Live Engagement Lab**
The expandable floating bottom drawer enabling users and judges to inject live metrics into the feedback loop, test scenario presets (*Viral Outlier*, *Industry Average*, *Low Engagement*), and observe real-time memory updates.

### **Agent Memory Panel**
The right-hand workspace sidebar displaying the 4 core learned insight cards:
1. **Content Performance**: Quantified save multipliers and comparative bar charts.
2. **Peak Reply Window**: Weekly activity timeline highlighting peak velocity periods (e.g., Tuesday & Thursday 2:00 PM – 4:30 PM).
3. **Audience Sentiment**: Circular progress gauge representing topic consensus (e.g., 68% cost optimization curiosity).
4. **Learned Content Preference**: Emerging practitioner preferences with confidence indices.
