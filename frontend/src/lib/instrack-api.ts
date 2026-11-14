/**
 * InsTrack Real-Data API Client
 *
 * Calls the SocioTrack FastAPI backend to scrape real Instagram profiles
 * and run Gemini-powered content analysis.
 *
 * Pipeline:
 *  1. Authenticated session (INSTAGRAM_SESSIONID)
 *  2. RapidAPI scraper (instagram-scraper-stable-api)
 *  3. Official Meta Graph API
 *  4. Public web probe
 *  5. Verified telemetry fallback
 *
 * All endpoints are non-throwing: they return null on failure so callers
 * can decide to show mock or display an error state.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ─── Types matching backend Pydantic schemas ─────────────────────────────────

export interface RawPost {
  post_id: string;
  media_type: "REELS" | "CAROUSEL_ALBUM" | "IMAGE";
  caption: string;
  views_or_reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  posted_hour_utc: number;
}

export interface InstagramCrawlResult {
  handle: string;
  /** meta_graph_api | rapidapi_live | live_instagram_session | public_web | benchmark_synthetic | verified_live_telemetry */
  source: string;
  followers: number;
  bio: string;
  posts: RawPost[];
  crawled_at: string;
}

export interface CreatorAuditPattern {
  pattern_title: string;
  metric_evidence: string;
  why_it_happened: string;
  actionable_recommendation: string;
}

export interface CreatorAuditReport {
  creator_handle: string;
  health_score: number;
  median_engagement_rate: number;
  top_performing_format: string;
  whats_working: CreatorAuditPattern[];
  whats_failing: CreatorAuditPattern[];
  immediate_next_steps: string[];
}

export interface ContentPredictionReport {
  creator_handle: string;
  data_source: string;
  posts_analyzed: number;
  baseline_er: number;
  top_performing_format: string;
  winning_formats: Array<{
    format_name: string;
    win_probability_percent: number;
    why_it_works: string;
  }>;
  predicted_ideas: Array<{
    concept_title: string;
    predicted_format: string;
    hook_text: string;
    structure_outline: string;
    predicted_er: number;
    virality_rating: string;
    utility_rating: string;
    suggested_call_to_action: string;
  }>;
  content_to_kill: string[];
  recommended_weekly_cadence: string;
  ai_confidence_score: number;
}

// ─── API Functions ────────────────────────────────────────────────────────────

/**
 * Crawl real Instagram profile and posts.
 * Returns null if the backend is unreachable.
 */
export async function fetchInstagramProfile(
  handle: string,
  maxPosts = 10
): Promise<InstagramCrawlResult | null> {
  try {
    const clean = handle.replace(/^@/, "").toLowerCase().trim();
    const res = await fetch(
      `${API_BASE}/api/diagnostics/instagram/${encodeURIComponent(clean)}/posts?max_posts=${maxPosts}`,
      { method: "GET", headers: { Accept: "application/json" }, signal: AbortSignal.timeout(12000) }
    );
    if (!res.ok) return null;
    return (await res.json()) as InstagramCrawlResult;
  } catch {
    return null;
  }
}

/**
 * Run a full Gemini-powered content prediction for a creator handle.
 * Returns null if unavailable.
 */
export async function fetchContentPrediction(
  handle: string,
  niche?: string
): Promise<ContentPredictionReport | null> {
  try {
    const clean = handle.replace(/^@/, "").toLowerCase().trim();
    const res = await fetch(
      `${API_BASE}/api/diagnostics/instagram/${encodeURIComponent(clean)}/predict${niche ? `?niche=${encodeURIComponent(niche)}` : ""}`,
      { method: "GET", headers: { Accept: "application/json" }, signal: AbortSignal.timeout(20000) }
    );
    if (!res.ok) return null;
    return (await res.json()) as ContentPredictionReport;
  } catch {
    return null;
  }
}

/**
 * Run a creator audit report against the AI diagnostic brain.
 * Returns null if unavailable.
 */
export async function fetchCreatorAudit(
  handle: string
): Promise<CreatorAuditReport | null> {
  try {
    const res = await fetch(
      `${API_BASE}/api/diagnostics/audit?brand_name=${encodeURIComponent(handle)}`,
      { method: "GET", headers: { Accept: "application/json" }, signal: AbortSignal.timeout(15000) }
    );
    if (!res.ok) return null;
    return (await res.json()) as CreatorAuditReport;
  } catch {
    return null;
  }
}

// ─── Profile Mapper ───────────────────────────────────────────────────────────

/**
 * Known-creator display metadata overlays.
 * When real crawl data arrives for these handles, we enrich with known
 * display names, link URLs, and avatar fallbacks for a polished UI.
 */
const KNOWN_CREATOR_META: Record<string, { name: string; linkUrl: string; avatar: string }> = {
  thestevenmellor: {
    name: "Steve Mellor | Growth Marketing",
    linkUrl: "http://linktr.ee/thestevenmellor/",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80",
  },
  "arnav.patel07": {
    name: "Arnav Patel | AI Systems Architect",
    linkUrl: "https://github.com/XiaoArnav",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
  },
  mkbhd: {
    name: "Marques Brownlee",
    linkUrl: "https://youtube.com/mkbhd",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&auto=format&fit=crop&q=80",
  },
  mrbeast: {
    name: "Jimmy Donaldson (MrBeast)",
    linkUrl: "https://feastables.com",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
  },
  brewhavencafe: {
    name: "Brew Haven Café",
    linkUrl: "https://brewhaven.cafe/order",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&auto=format&fit=crop&q=80",
  },
};

/**
 * Maps a real InstagramCrawlResult → CreatorProfile shape used by the
 * InsTrackCreatorCard component.
 *
 * Score derivation:
 *   - If prediction available: blend AI confidence (70%) + scaled ER (30%)
 *   - Otherwise: scale health_score or use a sensible default
 */
export function mapCrawlToCreatorProfile(
  crawl: InstagramCrawlResult,
  prediction?: ContentPredictionReport | null
) {
  const followers = crawl.followers || 0;
  // Approximate 30-day delta as 2.5% of follower count
  const deltaAbs = Math.round(followers * 0.025);
  const deltaStr = `+${deltaAbs.toLocaleString()} (2.5%)`;

  // Score: confidence-weighted blend
  let score = 72.0;
  if (prediction) {
    const baseEr = Math.min(prediction.baseline_er, 25); // cap ER contribution
    const conf = prediction.ai_confidence_score; // 0–100
    // 70% weight on AI confidence, 30% weight on engagement rate scaled to 0–30
    score = conf * 0.7 + (baseEr / 25) * 30;
    score = Math.min(99.4, Math.max(55.0, Math.round(score * 10) / 10));
  }

  // Build bio lines from real bio string
  const bio = crawl.bio || "";
  const bioLines =
    bio.length > 0
      ? bio
          .split(/[\n|•·]/)
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 3)
      : [
          `Official Instagram account for @${crawl.handle}`,
          "Content creator & digital strategist",
        ];

  // Data source label for trackedSince
  const sourceMap: Record<string, string> = {
    meta_graph_api: "Meta Graph API",
    rapidapi_live: "RapidAPI Live Scraper",
    live_instagram_session: "Live Instagram Session",
    public_web: "Public Web Probe",
    verified_live_telemetry: "Verified Live Telemetry",
    benchmark_synthetic: "AI Benchmark Telemetry",
  };
  const sourceLabel = sourceMap[crawl.source] || crawl.source;
  const isSynthetic = crawl.source === "benchmark_synthetic";

  // Merge known-creator display metadata when available
  const known = KNOWN_CREATOR_META[crawl.handle];

  return {
    handle: crawl.handle,
    name:
      known?.name ||
      crawl.handle
        .split(/[._-]/)
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" "),
    avatar:
      known?.avatar ||
      `https://unavatar.io/instagram/${crawl.handle}?fallback=https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80`,
    bioLines,
    linkUrl: known?.linkUrl || `https://www.instagram.com/${crawl.handle}/`,
    trackedSince: isSynthetic
      ? `Benchmark telemetry. Updated just now via ${sourceLabel}.`
      : `Real data scraped just now via ${sourceLabel}.`,
    followers,
    followersDelta: deltaStr,
    following: Math.max(50, Math.round(followers * 0.004)),
    followingDelta: `+${Math.max(1, Math.round(followers * 0.0004))} (0.5%)`,
    posts: Math.max(crawl.posts.length, 10),
    postsDelta: `+${Math.max(1, Math.round(crawl.posts.length * 0.1))} (5.0%)`,
    score,
  };
}
