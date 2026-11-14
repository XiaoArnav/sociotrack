/**
 * Centralized Date, Time, and Timezone Utilities for SocioTrack.
 * Pure native zero-dependency implementation using Intl and browser APIs.
 * Guarantees SSR hydration safety, dynamic relative time, midnight rollover,
 * and seamless conversion across Asia/Kolkata, America/New_York, and UTC.
 */

import { useState, useEffect, useRef } from "react";

export interface TimezoneOption {
  value: string;
  label: string;
  abbr: string;
  offset: string;
}

export const COMMON_TIMEZONES: TimezoneOption[] = [
  { value: "SYSTEM", label: "System Default (Auto)", abbr: "Local", offset: "Local" },
  { value: "Asia/Kolkata", label: "India Standard Time (IST)", abbr: "IST", offset: "+05:30" },
  { value: "America/New_York", label: "Eastern Time (New York)", abbr: "ET", offset: "-05:00 / -04:00" },
  { value: "America/Los_Angeles", label: "Pacific Time (Los Angeles)", abbr: "PT", offset: "-08:00 / -07:00" },
  { value: "Europe/London", label: "Greenwich / British Time (London)", abbr: "GMT/BST", offset: "+00:00 / +01:00" },
  { value: "UTC", label: "Coordinated Universal Time (UTC)", abbr: "UTC", offset: "+00:00" },
];

const TIMEZONE_STORAGE_KEY = "sociotrack_timezone";
const TIMEZONE_CHANGE_EVENT = "sociotrack_timezone_change";

/**
 * Gets the user's active timezone preference.
 * Priority: localStorage -> browser detected -> "UTC".
 */
export function getUserTimezone(): string {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(TIMEZONE_STORAGE_KEY);
      if (stored && stored !== "SYSTEM") {
        return stored;
      }
    } catch {}
  }
  try {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (detected) return detected;
  } catch {}
  return "UTC";
}

/**
 * Updates the user's timezone preference and notifies listeners.
 */
export function setUserTimezone(tz: string): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(TIMEZONE_STORAGE_KEY, tz);
      window.dispatchEvent(new CustomEvent(TIMEZONE_CHANGE_EVENT, { detail: tz }));
    } catch {}
  }
}

/**
 * Resolves a timezone string to a valid IANA identifier.
 */
export function resolveTimezone(tz?: string): string {
  if (!tz || tz === "SYSTEM") {
    return getUserTimezone();
  }
  return tz;
}

/**
 * Returns the short timezone abbreviation for a given date in the specified timezone (e.g. "IST", "EDT", "EST", "UTC").
 */
export function getTimezoneAbbreviation(date: Date = new Date(), tz?: string): string {
  const resolved = resolveTimezone(tz);
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: resolved,
      timeZoneName: "short",
    });
    const parts = formatter.formatToParts(date);
    const tzPart = parts.find((p) => p.type === "timeZoneName");
    return tzPart ? tzPart.value : resolved;
  } catch {
    return resolved;
  }
}

/**
 * Safely parses any date input (ISO string, epoch ms, epoch seconds float/int, Date object)
 * into a valid Date object, or returns null if invalid.
 */
export function parseDateInput(input: unknown): Date | null {
  if (input === null || input === undefined || input === "") return null;
  if (input instanceof Date) {
    return isNaN(input.getTime()) ? null : input;
  }
  if (typeof input === "number") {
    // If input is in seconds (e.g., Python time.time() ~ 1.7e9), convert to ms
    const ms = input < 1e11 ? input * 1000 : input;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof input === "string") {
    const trimmed = input.trim();
    // Numeric string check (epoch)
    if (/^\d+(\.\d+)?$/.test(trimmed)) {
      const num = parseFloat(trimmed);
      const ms = num < 1e11 ? num * 1000 : num;
      const d = new Date(ms);
      return isNaN(d.getTime()) ? null : d;
    }
    // Attempt standard ISO parsing
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/**
 * Formats a relative time string dynamically (e.g. "just now", "45s ago", "5m ago", "2h ago", "3d ago").
 * Returns "Unavailable" if the input is missing, null, or invalid.
 */
export function formatRelativeTime(
  dateInput: unknown,
  baseDate: Date = new Date(),
  tz?: string
): string {
  const d = parseDateInput(dateInput);
  if (!d) return "Unavailable";

  const diffMs = baseDate.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  // If in the future or within 10 seconds
  if (diffSec < 10) {
    return "just now";
  }
  if (diffSec < 60) {
    return `${diffSec}s ago`;
  }
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return `${diffMin}m ago`;
  }
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) {
    return `${diffHour}h ago`;
  }
  const diffDays = Math.floor(diffHour / 24);
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  // Fallback to absolute short date
  return formatDate(d, { month: "short", day: "numeric", year: "numeric" }, tz);
}

/**
 * Hydration-safe date formatting.
 */
export function formatDate(
  dateInput: unknown,
  options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" },
  tz?: string
): string {
  const d = parseDateInput(dateInput);
  if (!d) return "Unavailable";
  const resolved = resolveTimezone(tz);

  try {
    return new Intl.DateTimeFormat("en-US", {
      ...options,
      timeZone: resolved,
    }).format(d);
  } catch {
    return d.toLocaleDateString("en-US");
  }
}

/**
 * Hydration-safe time formatting with timezone abbreviation (e.g., "2:30 PM IST").
 */
export function formatTime(
  dateInput: unknown,
  tz?: string,
  includeSeconds: boolean = false
): string {
  const d = parseDateInput(dateInput);
  if (!d) return "Unavailable";
  const resolved = resolveTimezone(tz);
  const abbr = getTimezoneAbbreviation(d, resolved);

  try {
    const timeStr = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: includeSeconds ? "2-digit" : undefined,
      hour12: true,
      timeZone: resolved,
    }).format(d);
    return `${timeStr} ${abbr}`;
  } catch {
    return `${d.toLocaleTimeString("en-US")} ${resolved}`;
  }
}

/**
 * Hydration-safe full date and time formatting (e.g., "Nov 14, 2026, 2:30 PM IST").
 */
export function formatDateTime(dateInput: unknown, tz?: string): string {
  const d = parseDateInput(dateInput);
  if (!d) return "Unavailable";
  const resolved = resolveTimezone(tz);
  const abbr = getTimezoneAbbreviation(d, resolved);

  try {
    const datePart = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: resolved,
    }).format(d);

    const timePart = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: resolved,
    }).format(d);

    return `${datePart}, ${timePart} ${abbr}`;
  } catch {
    return d.toLocaleString("en-US");
  }
}

/**
 * Preserves date-only values (e.g. "2022-01-10" or "Jan, 10 2022") strictly on their calendar day
 * without day-shifting across timezones.
 */
export function formatDateOnly(dateInput: unknown, tz?: string): string {
  if (typeof dateInput === "string") {
    const trimmed = dateInput.trim();
    // YYYY-MM-DD pattern
    const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      const year = parseInt(isoMatch[1], 10);
      const monthIndex = parseInt(isoMatch[2], 10) - 1;
      const day = parseInt(isoMatch[3], 10);
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${months[monthIndex]} ${day}, ${year}`;
    }
    // "Tracked since Jan, 10 2022" or "Jan 10, 2022" pattern
    const textMatch = trimmed.match(/(?:Tracked since\s+)?([A-Za-z]+)[,\s]+(\d{1,2})[,\s]+(\d{4})/i);
    if (textMatch) {
      const rawMonth = textMatch[1].slice(0, 3);
      const monthCapitalized = rawMonth.charAt(0).toUpperCase() + rawMonth.slice(1).toLowerCase();
      const day = parseInt(textMatch[2], 10);
      const year = textMatch[3];
      return `${monthCapitalized} ${day}, ${year}`;
    }
  }

  const d = parseDateInput(dateInput);
  if (!d) return typeof dateInput === "string" ? dateInput : "Unavailable";
  return formatDate(d, { month: "short", day: "numeric", year: "numeric" }, tz);
}

/**
 * Formats a scheduled time clearly indicating the applicable timezone.
 * E.g., "Tuesday, Nov 17 at 2:30 PM (IST)" or "Today at 7:30 PM (IST)".
 */
export function formatScheduledTime(dateInput: unknown, tz?: string): string {
  const d = parseDateInput(dateInput);
  if (!d) {
    return typeof dateInput === "string" && dateInput.trim() ? dateInput : "Scheduled (Time TBD)";
  }
  const resolved = resolveTimezone(tz);
  const abbr = getTimezoneAbbreviation(d, resolved);

  try {
    const dayName = new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: resolved }).format(d);
    const monthDay = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: resolved }).format(d);
    const timeStr = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: resolved,
    }).format(d);

    // Check if it is today or tomorrow in the target timezone
    const now = new Date();
    const todayStr = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "numeric", day: "numeric", timeZone: resolved }).format(now);
    const targetStr = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "numeric", day: "numeric", timeZone: resolved }).format(d);

    const tomorrow = new Date(now.getTime() + 86400000);
    const tomorrowStr = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "numeric", day: "numeric", timeZone: resolved }).format(tomorrow);

    if (targetStr === todayStr) {
      return `Today at ${timeStr} (${abbr})`;
    }
    if (targetStr === tomorrowStr) {
      return `Tomorrow at ${timeStr} (${abbr})`;
    }

    return `${dayName}, ${monthDay} at ${timeStr} (${abbr})`;
  } catch {
    return d.toLocaleString("en-US");
  }
}

/**
 * Computes exact start and end UTC ISO instants for standard date ranges
 * respecting the specified timezone.
 */
export function getDateRangeBounds(
  rangeName: "Today" | "Yesterday" | "This Week" | "Last 7 Days" | "Last 30 Days" | "Last 90 Days" | "All Time" | string,
  tz?: string
): { startIso: string | null; endIso: string } {
  const resolved = resolveTimezone(tz);
  const now = new Date();
  const endIso = now.toISOString();

  // Helper to construct a local Date in target timezone components
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: resolved,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  }).formatToParts(now);

  const getPart = (type: string) => parseInt(parts.find((p) => p.type === type)?.value || "0", 10);
  const year = getPart("year");
  const month = getPart("month") - 1;
  const day = getPart("day");

  switch (rangeName) {
    case "Today": {
      // Midnight in resolved timezone
      const startLocal = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
      return { startIso: startLocal.toISOString(), endIso };
    }
    case "Yesterday": {
      const startLocal = new Date(Date.UTC(year, month, day - 1, 0, 0, 0, 0));
      const endLocal = new Date(Date.UTC(year, month, day - 1, 23, 59, 59, 999));
      return { startIso: startLocal.toISOString(), endIso: endLocal.toISOString() };
    }
    case "This Week": {
      // Find Monday
      const dayOfWeekParts = new Intl.DateTimeFormat("en-US", { timeZone: resolved, weekday: "narrow" }).format(now);
      const dayIndex = now.getDay(); // 0 is Sunday, 1 is Monday
      const diffToMonday = dayIndex === 0 ? 6 : dayIndex - 1;
      const startLocal = new Date(Date.UTC(year, month, day - diffToMonday, 0, 0, 0, 0));
      return { startIso: startLocal.toISOString(), endIso };
    }
    case "Last 7 Days": {
      const start = new Date(now.getTime() - 7 * 86400000);
      return { startIso: start.toISOString(), endIso };
    }
    case "Last 30 Days": {
      const start = new Date(now.getTime() - 30 * 86400000);
      return { startIso: start.toISOString(), endIso };
    }
    case "Last 90 Days": {
      const start = new Date(now.getTime() - 90 * 86400000);
      return { startIso: start.toISOString(), endIso };
    }
    case "All Time":
    default:
      return { startIso: null, endIso };
  }
}

/**
 * Calculates milliseconds until the next midnight in the specified timezone.
 */
export function getMsUntilNextMidnight(tz?: string): number {
  const resolved = resolveTimezone(tz);
  const now = new Date();
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: resolved,
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: false,
    }).formatToParts(now);

    const getPart = (type: string) => parseInt(parts.find((p) => p.type === type)?.value || "0", 10);
    const hour = getPart("hour") % 24;
    const minute = getPart("minute");
    const second = getPart("second");
    const msPastMidnight = ((hour * 60 + minute) * 60 + second) * 1000 + now.getMilliseconds();
    const msInDay = 86400000;
    const remaining = msInDay - msPastMidnight;
    return remaining > 0 ? remaining : 1000;
  } catch {
    // Fallback: 60 seconds
    return 60000;
  }
}

/**
 * React hook for live clock updates with:
 * - precisionMs updates
 * - background tab return refresh (visibilitychange & focus)
 * - automatic midnight rollover in the active timezone
 * - dynamic timezone change event listening
 * - SSR hydration safety
 */
export function useLiveClock(precisionMs: number = 1000) {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState<Date>(new Date());
  const [timezone, setTimezoneState] = useState<string>("UTC");
  const midnightTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
    const currentTz = getUserTimezone();
    setTimezoneState(currentTz);
    setNow(new Date());

    // 1. Regular interval update
    const interval = setInterval(() => {
      setNow(new Date());
    }, precisionMs);

    // 2. Refresh on background tab return
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        setNow(new Date());
      }
    };
    const handleFocus = () => {
      setNow(new Date());
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    // 3. Timezone change listener
    const handleTimezoneChange = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      const newTz = customEvent.detail || getUserTimezone();
      setTimezoneState(newTz);
      setNow(new Date());
    };
    window.addEventListener(TIMEZONE_CHANGE_EVENT, handleTimezoneChange);

    // 4. Midnight rollover scheduling
    const scheduleMidnightRollover = () => {
      if (midnightTimerRef.current) clearTimeout(midnightTimerRef.current);
      const msUntilMidnight = getMsUntilNextMidnight(currentTz) + 100;
      midnightTimerRef.current = setTimeout(() => {
        setNow(new Date());
        scheduleMidnightRollover();
      }, msUntilMidnight);
    };
    scheduleMidnightRollover();

    return () => {
      clearInterval(interval);
      if (midnightTimerRef.current) clearTimeout(midnightTimerRef.current);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener(TIMEZONE_CHANGE_EVENT, handleTimezoneChange);
    };
  }, [precisionMs]);

  const activeTz = mounted ? timezone : "UTC";
  const formattedDate = formatDate(
    now,
    { weekday: "long", month: "short", day: "numeric", year: "numeric" },
    activeTz
  );
  const formattedTime = formatTime(now, activeTz, precisionMs < 1000);
  const timezoneAbbr = getTimezoneAbbreviation(now, activeTz);

  return {
    now,
    mounted,
    timezone: activeTz,
    timezoneAbbr,
    formattedDate,
    formattedTime,
  };
}
