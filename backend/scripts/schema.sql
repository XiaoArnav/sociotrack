-- ========================================================
-- SocioTrack Database Schema (Supabase / PostgreSQL + pgvector)
-- ========================================================

-- Enable vector extension for embeddings if on Supabase / PostgreSQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Posts & Drafts Table
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_name VARCHAR(100) NOT NULL,
    topic VARCHAR(255) NOT NULL,
    format VARCHAR(50) NOT NULL,
    hook TEXT NOT NULL,
    body TEXT NOT NULL,
    call_to_action TEXT NOT NULL,
    full_text TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'draft', -- draft, approved, scheduled, published, rejected
    match_score FLOAT DEFAULT 0.0,
    scheduled_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_brand ON posts(brand_name);
CREATE INDEX IF NOT EXISTS idx_posts_topic ON posts(topic);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);

-- 2. Engagement Metrics Table
CREATE TABLE IF NOT EXISTS metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    impressions INT DEFAULT 0,
    shares INT DEFAULT 0,
    replies INT DEFAULT 0,
    likes INT DEFAULT 0,
    composite_score FLOAT DEFAULT 0.0,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_metrics_post_id ON metrics(post_id);

-- 3. Learned Lessons Table (Score > 5.0 Memory Ingestion)
CREATE TABLE IF NOT EXISTS learned_lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_name VARCHAR(100) NOT NULL,
    topic VARCHAR(255) NOT NULL,
    post_content TEXT NOT NULL,
    key_lesson TEXT NOT NULL,
    composite_score FLOAT NOT NULL,
    memory_doc_id VARCHAR(100),
    embedding vector(384), -- all-MiniLM-L6-v2 vector dimension
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lessons_brand ON learned_lessons(brand_name);
CREATE INDEX IF NOT EXISTS idx_lessons_topic ON learned_lessons(topic);

-- 4. Audience Sentiments Table
CREATE TABLE IF NOT EXISTS audience_sentiments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_name VARCHAR(100) NOT NULL,
    topic VARCHAR(255) NOT NULL,
    sentiment_label VARCHAR(50) NOT NULL,
    sentiment_score FLOAT DEFAULT 0.5,
    summary TEXT NOT NULL,
    keywords TEXT,
    embedding vector(384),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sentiment_topic ON audience_sentiments(topic);
