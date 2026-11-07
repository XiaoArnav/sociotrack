-- SocioTrack PostgreSQL Database Schema
-- AI Social Media Engagement Agent
-- Compatible with PostgreSQL 15+ and pgvector

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgvector extension for agent memory embeddings
CREATE EXTENSION IF NOT EXISTS "vector";

-- Enums
CREATE TYPE post_status AS ENUM ('draft', 'pending_approval', 'scheduled', 'published');
CREATE TYPE memory_category AS ENUM ('hook_rule', 'timing_rule', 'audience_pain_point');

-- 1. Brands Table
CREATE TABLE IF NOT EXISTS brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    voice_description TEXT,
    target_audience TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Posts Table
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    topic VARCHAR(255) NOT NULL,
    hook_style VARCHAR(100),
    status post_status NOT NULL DEFAULT 'draft',
    scheduled_for TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Post Analytics Table
CREATE TABLE IF NOT EXISTS post_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    impressions INTEGER NOT NULL DEFAULT 0 CHECK (impressions >= 0),
    likes INTEGER NOT NULL DEFAULT 0 CHECK (likes >= 0),
    replies INTEGER NOT NULL DEFAULT 0 CHECK (replies >= 0),
    shares INTEGER NOT NULL DEFAULT 0 CHECK (shares >= 0),
    engagement_score NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Agent Memories Table (with Hindsight sync & 1536-dim vector embedding)
CREATE TABLE IF NOT EXISTS agent_memories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    insight_text TEXT NOT NULL,
    category memory_category NOT NULL,
    confidence_score NUMERIC(4, 3) NOT NULL DEFAULT 0.850 CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0),
    embedding vector(1536),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Performance & Query Optimization Indexes
CREATE INDEX IF NOT EXISTS idx_posts_brand_status ON posts(brand_id, status);
CREATE INDEX IF NOT EXISTS idx_posts_scheduled_for ON posts(scheduled_for) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_post_id ON post_analytics(post_id);
CREATE INDEX IF NOT EXISTS idx_analytics_recorded_at ON post_analytics(recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_memories_brand_category ON agent_memories(brand_id, category);
CREATE INDEX IF NOT EXISTS idx_memories_created_at ON agent_memories(created_at DESC);

-- Vector Cosine Distance Index (IVFFlat for similarity searches)
-- Run after populating initial data:
-- CREATE INDEX IF NOT EXISTS idx_memories_embedding ON agent_memories USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
