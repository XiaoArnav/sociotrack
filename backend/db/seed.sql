-- SocioTrack Initial Seed Data
-- Provides realistic sample brands, posts, analytics, and agent memories

-- Clear existing data if re-seeding
-- TRUNCATE TABLE brands CASCADE;

-- Insert Brands
INSERT INTO brands (id, name, voice_description, target_audience, created_at)
VALUES 
  ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'DevRelay', 'Pragmatic, technical, no-nonsense senior engineer tone with subtle dry humor. Prefers direct code examples over buzzwords.', 'Full-stack developers, engineering leads, open-source contributors, devops practitioners.', NOW() - INTERVAL '30 days'),
  ('b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'CloudPulse', 'Authoritative, enterprise-ready, architecture-focused. Data-driven insights on cloud infrastructure and cost optimization.', 'CTOs, VP of Engineering, Cloud Architects, Site Reliability Engineers.', NOW() - INTERVAL '20 days')
ON CONFLICT (id) DO NOTHING;

-- Insert Posts
INSERT INTO posts (id, brand_id, content, topic, hook_style, status, scheduled_for, created_at)
VALUES
  ('c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Most agents forget the context 5 turns later. Here is how we wired Hindsight memory banks to retain developer preferences across sessions.', 'Agent Memory', 'problem_agitation', 'published', NOW() - INTERVAL '3 days', NOW() - INTERVAL '4 days'),
  ('d4e5f6a7-b89c-0d1e-2f3a-4b5c6d7e8f90', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Stop dumping your entire database schema into the system prompt. Deep module architecture + vector memory cuts token burn by 73%.', 'Architecture & Token Optimization', 'contrarian', 'published', NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 days'),
  ('e5f6a7b8-9c0d-1e2f-3a4b-5c6d7e8f9012', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'How do you test non-deterministic AI agents? We wrote 40 pytest cases around deterministic boundary seams. Thread below 👇', 'Testing & TDD for AI', 'question_hook', 'scheduled', NOW() + INTERVAL '4 hours', NOW() - INTERVAL '6 hours'),
  ('f6a7b89c-0d1e-2f3a-4b5c-6d7e8f901234', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Controversial take: LLMs shouldn''t manage their own state. You need an external memory engine that distinguishes facts from hallucinated summaries.', 'Agent Architecture', 'contrarian', 'pending_approval', NULL, NOW() - INTERVAL '1 hour'),
  ('11223344-5566-7788-9900-aabbccddeeff', 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'Kubernetes clusters without egress cost visibility are financial black holes. Here are 3 metrics to monitor today.', 'Cloud Cost Optimization', 'data_backed', 'published', NOW() - INTERVAL '5 days', NOW() - INTERVAL '6 days')
ON CONFLICT (id) DO NOTHING;

-- Insert Post Analytics
INSERT INTO post_analytics (id, post_id, impressions, likes, replies, shares, engagement_score, recorded_at)
VALUES
  ('aa11bb22-cc33-dd44-ee55-ff6677889900', 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f', 12500, 480, 72, 54, 6.79, NOW() - INTERVAL '2 days'),
  ('bb22cc33-dd44-ee55-ff66-778899001122', 'd4e5f6a7-b89c-0d1e-2f3a-4b5c6d7e8f90', 21400, 1150, 185, 142, 9.86, NOW() - INTERVAL '12 hours'),
  ('cc33dd44-ee55-ff66-7788-990011223344', '11223344-5566-7788-9900-aabbccddeeff', 8900, 190, 24, 18, 3.52, NOW() - INTERVAL '4 days')
ON CONFLICT (id) DO NOTHING;

-- Insert Agent Memories
INSERT INTO agent_memories (id, brand_id, insight_text, category, confidence_score, created_at)
VALUES
  ('dd44ee55-ff66-7788-9900-112233445566', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Contrarian hooks challenging industry orthodoxy on agent state generate 2.8x higher reply rates among senior engineers.', 'hook_rule', 0.920, NOW() - INTERVAL '2 days'),
  ('ee55ff66-7788-9900-1122-334455667788', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Dev audiences disengage from generic hype; posts citing specific architectural percentages (e.g. 73% token reduction) double bookmark and share velocity.', 'hook_rule', 0.880, NOW() - INTERVAL '1 day'),
  ('ff667788-9900-1122-3344-556677889900', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Publishing technical posts between 08:30 and 10:15 AM EST on Tuesday and Thursday produces peak tech Twitter/LinkedIn dwell time.', 'timing_rule', 0.850, NOW() - INTERVAL '10 days'),
  ('00112233-4455-6677-8899-aabbccddeeff', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Audience intensely feels the pain of non-deterministic LLM behavior in production and high API token expenses in multi-agent loops.', 'audience_pain_point', 0.940, NOW() - INTERVAL '5 days'),
  ('12345678-90ab-cdef-1234-567890abcdef', 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'Target audience of CTOs responds strongest to concrete AWS/GCP cost leakage metrics rather than abstract multi-cloud strategies.', 'audience_pain_point', 0.890, NOW() - INTERVAL '4 days')
ON CONFLICT (id) DO NOTHING;
