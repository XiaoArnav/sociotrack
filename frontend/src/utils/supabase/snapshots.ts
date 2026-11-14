import { createClient } from "./client";
import { CreatorProfile } from "@/components/InsTrackCreatorCard";

export interface ProfileSnapshot {
  id?: string;
  user_email?: string;
  handle: string;
  name: string;
  followers: number;
  following: number;
  posts: number;
  score: number;
  engagement_rate?: number;
  avatar_url?: string;
  bio_lines?: string[];
  demographics?: {
    recorded_at: string;
    followersDelta: string;
    followingDelta: string;
    postsDelta: string;
    isVerified?: boolean;
    isPrivate?: boolean;
    source?: string;
  };
  weekly_crawl_enabled: boolean;
  created_at?: string;
}

const LOCAL_STORAGE_SNAPSHOTS_KEY = "sociotrack_saved_snapshots";
const LOCAL_STORAGE_WEEKLY_CRAWLS_KEY = "sociotrack_weekly_crawls";

/**
 * Saves a creator profile snapshot with its complete demographic and performance data.
 * Tries Supabase `profile_snapshots` table first; seamlessly falls back to localStorage.
 */
export async function saveProfileSnapshot(
  creator: CreatorProfile,
  userEmail?: string,
  enableWeeklyCrawl: boolean = false
): Promise<{ success: boolean; id: string; storageType: "supabase" | "local" }> {
  const snapshotData: ProfileSnapshot = {
    user_email: userEmail || "anonymous",
    handle: creator.handle.toLowerCase().replace(/^@/, ""),
    name: creator.name,
    followers: creator.followers,
    following: creator.following,
    posts: creator.posts,
    score: creator.score,
    avatar_url: creator.avatar,
    bio_lines: creator.bioLines,
    demographics: {
      recorded_at: new Date().toISOString(),
      followersDelta: creator.followersDelta,
      followingDelta: creator.followingDelta,
      postsDelta: creator.postsDelta,
      isVerified: creator.isVerified,
      isPrivate: creator.isPrivate,
      source: creator.dataSource || "Meta OpenGraph Live Scraper",
    },
    weekly_crawl_enabled: enableWeeklyCrawl,
    created_at: new Date().toISOString(),
  };

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("profile_snapshots")
      .insert([snapshotData])
      .select("id")
      .single();

    if (!error && data?.id) {
      // Also update local cache for offline agility
      saveSnapshotLocally({ ...snapshotData, id: data.id });
      return { success: true, id: data.id, storageType: "supabase" };
    }
  } catch {
    // Supabase table or network unavailable, continue to local storage
  }

  // Graceful resilient local storage persistence
  const localId = `snap_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const saved = saveSnapshotLocally({ ...snapshotData, id: localId });
  return { success: saved, id: localId, storageType: "local" };
}

/**
 * Saves snapshot in browser localStorage
 */
function saveSnapshotLocally(snapshot: ProfileSnapshot): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SNAPSHOTS_KEY);
    const existing: ProfileSnapshot[] = raw ? JSON.parse(raw) : [];
    // Keep most recent first, limit to 50
    const filtered = existing.filter((s) => !(s.handle === snapshot.handle && s.demographics?.recorded_at === snapshot.demographics?.recorded_at));
    const updated = [snapshot, ...filtered].slice(0, 50);
    localStorage.setItem(LOCAL_STORAGE_SNAPSHOTS_KEY, JSON.stringify(updated));
    return true;
  } catch {
    return false;
  }
}

/**
 * Fetches all saved profile snapshots for a user or handle.
 */
export async function getProfileSnapshots(handle?: string): Promise<ProfileSnapshot[]> {
  try {
    const supabase = createClient();
    let query = supabase.from("profile_snapshots").select("*").order("created_at", { ascending: false });
    if (handle) {
      query = query.eq("handle", handle.toLowerCase().replace(/^@/, ""));
    }
    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      return data as ProfileSnapshot[];
    }
  } catch {
    // fallback to local
  }

  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_SNAPSHOTS_KEY);
      if (raw) {
        const parsed: ProfileSnapshot[] = JSON.parse(raw);
        if (handle) {
          return parsed.filter((s) => s.handle.toLowerCase() === handle.toLowerCase().replace(/^@/, ""));
        }
        return parsed;
      }
    } catch {}
  }
  return [];
}

/**
 * Toggles weekly crawl automation for a creator profile.
 */
export async function toggleWeeklyCrawl(
  handle: string,
  enabled: boolean,
  userEmail?: string
): Promise<{ success: boolean; nextCrawlDate?: string }> {
  const cleanHandle = handle.toLowerCase().replace(/^@/, "");
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + 7);
  const nextCrawlIso = nextDate.toISOString();

  const record = {
    handle: cleanHandle,
    user_email: userEmail || "anonymous",
    enabled,
    interval_days: 7,
    next_crawl_at: nextCrawlIso,
    last_updated_at: new Date().toISOString(),
  };

  // 1. Persist to Supabase if table ready
  try {
    const supabase = createClient();
    await supabase.from("scheduled_crawls").upsert(record, { onConflict: "handle" });
  } catch {
    // Supabase table fallback
  }

  // 2. Persist to localStorage
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_WEEKLY_CRAWLS_KEY);
      const list = raw ? JSON.parse(raw) : {};
      list[cleanHandle] = { enabled, nextCrawlAt: nextCrawlIso };
      localStorage.setItem(LOCAL_STORAGE_WEEKLY_CRAWLS_KEY, JSON.stringify(list));
    } catch {}
  }

  return { success: true, nextCrawlDate: nextCrawlIso };
}

/**
 * Checks if weekly crawl is currently enabled for a creator profile.
 */
export function isWeeklyCrawlEnabled(handle: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const cleanHandle = handle.toLowerCase().replace(/^@/, "");
    const raw = localStorage.getItem(LOCAL_STORAGE_WEEKLY_CRAWLS_KEY);
    if (!raw) return false;
    const list = JSON.parse(raw);
    return Boolean(list[cleanHandle]?.enabled);
  } catch {
    return false;
  }
}
