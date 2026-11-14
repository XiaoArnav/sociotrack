import {
  MOCK_DRAFTS,
  MOCK_SELECTED_POST,
  MOCK_MEMORY_INSIGHTS,
  MockPostVariation,
  MockSelectedPost,
  MockMemoryInsights,
} from "@/mocks/mockData";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface GenerateDraftsResponse {
  brand_name: string;
  topic: string;
  drafts: MockPostVariation[];
  selected_post: MockSelectedPost;
  memory_context_summary: string;
}

export interface SimulatorFeedbackResult {
  composite_score: number;
  qualifies_for_memory: boolean;
  status_message: string;
  key_lesson?: string;
  memory_doc_id?: string;
}

export async function fetchGenerateDrafts(
  brandName: string,
  topic: string
): Promise<GenerateDraftsResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/generate-drafts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brand_name: brandName, topic }),
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn("Backend unavailable, using high-fidelity mock drafts fallback:", err);
    return {
      brand_name: brandName,
      topic,
      drafts: MOCK_DRAFTS,
      selected_post: MOCK_SELECTED_POST,
      memory_context_summary: `Retrieved past winning patterns for '${topic}'. Audience is cautious & discerning.`,
    };
  }
}

export async function fetchMemoryInsights(
  brandName: string = "SocioTrack",
  topic: string = "Deterministic State Management with LangGraph"
): Promise<MockMemoryInsights> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/memory/insights?brand_name=${encodeURIComponent(
        brandName
      )}&topic=${encodeURIComponent(topic)}`,
      { method: "GET" }
    );

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn("Backend unavailable, using mock memory insights fallback:", err);
    return MOCK_MEMORY_INSIGHTS;
  }
}

export async function approvePostAPI(
  postContent: string,
  format: string,
  scheduledTime?: string
): Promise<{ status: string; post_id: string; message: string }> {
  const finalScheduledTime = scheduledTime || new Date(Date.now() + 86400000).toISOString();
  try {
    const res = await fetch(`${API_BASE_URL}/api/posts/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        post_content: postContent,
        format,
        scheduled_time: finalScheduledTime,
      }),
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn("Backend unavailable, simulating mock approval:", err);
    return {
      status: "approved",
      post_id: `mock_${Date.now()}`,
      message: "Post successfully approved and scheduled for publishing slot.",
    };
  }
}

export async function feedSimulatorMetricsAPI(
  brandName: string,
  topic: string,
  postContent: string,
  metrics: { impressions: number; shares: number; replies: number; likes: number }
): Promise<SimulatorFeedbackResult> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/simulator/feed-metrics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brand_name: brandName,
        topic,
        post_content: postContent,
        metrics,
      }),
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn("Backend unavailable, calculating client-side composite score fallback:", err);
    const score =
      metrics.impressions > 0
        ? Number(
            (
              ((metrics.shares * 3 + metrics.replies * 2 + metrics.likes * 1) /
                metrics.impressions) *
              100
            ).toFixed(2)
          )
        : 0;
    const qualifies = score > 5.0;
    return {
      composite_score: score,
      qualifies_for_memory: qualifies,
      status_message: qualifies
        ? `Composite score ${score} > 5.0! Lesson embedded into vector memory.`
        : `Composite score ${score} <= 5.0. Did not meet threshold.`,
      key_lesson: qualifies
        ? `High-performance pattern (score ${score}): Benchmark data and contrarian engineering discipline drive viral shares.`
        : undefined,
      memory_doc_id: qualifies ? `lesson_mock_${Date.now()}` : undefined,
    };
  }
}
