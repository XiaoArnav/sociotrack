const test = require("node:test");
const assert = require("node:assert/strict");

// Mirror of pure date utilities for Node unit testing
function parseDateInput(input) {
  if (input === null || input === undefined || input === "") return null;
  if (input instanceof Date) {
    return isNaN(input.getTime()) ? null : input;
  }
  if (typeof input === "number") {
    const ms = input < 1e11 ? input * 1000 : input;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof input === "string") {
    const trimmed = input.trim();
    if (/^\d+(\.\d+)?$/.test(trimmed)) {
      const num = parseFloat(trimmed);
      const ms = num < 1e11 ? num * 1000 : num;
      const d = new Date(ms);
      return isNaN(d.getTime()) ? null : d;
    }
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function getTimezoneAbbreviation(date = new Date(), tz = "UTC") {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "short",
    });
    const parts = formatter.formatToParts(date);
    const tzPart = parts.find((p) => p.type === "timeZoneName");
    return tzPart ? tzPart.value : tz;
  } catch {
    return tz;
  }
}

function formatDate(dateInput, options = { month: "short", day: "numeric", year: "numeric" }, tz = "UTC") {
  const d = parseDateInput(dateInput);
  if (!d) return "Unavailable";
  try {
    return new Intl.DateTimeFormat("en-US", {
      ...options,
      timeZone: tz,
    }).format(d);
  } catch {
    return d.toLocaleDateString("en-US");
  }
}

function formatRelativeTime(dateInput, baseDate = new Date(), tz = "UTC") {
  const d = parseDateInput(dateInput);
  if (!d) return "Unavailable";

  const diffMs = baseDate.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 10) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDays = Math.floor(diffHour / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return formatDate(d, { month: "short", day: "numeric", year: "numeric" }, tz);
}

function formatDateOnly(dateInput, tz = "UTC") {
  if (typeof dateInput === "string") {
    const trimmed = dateInput.trim();
    const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      const year = parseInt(isoMatch[1], 10);
      const monthIndex = parseInt(isoMatch[2], 10) - 1;
      const day = parseInt(isoMatch[3], 10);
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${months[monthIndex]} ${day}, ${year}`;
    }
  }
  const d = parseDateInput(dateInput);
  if (!d) return typeof dateInput === "string" ? dateInput : "Unavailable";
  return formatDate(d, { month: "short", day: "numeric", year: "numeric" }, tz);
}

function formatScheduledTime(dateInput, tz = "UTC", baseNow = new Date()) {
  const d = parseDateInput(dateInput);
  if (!d) return typeof dateInput === "string" && dateInput.trim() ? dateInput : "Scheduled (Time TBD)";
  const abbr = getTimezoneAbbreviation(d, tz);

  const dayName = new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: tz }).format(d);
  const monthDay = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: tz }).format(d);
  const timeStr = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: tz,
  }).format(d);

  const todayStr = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "numeric", day: "numeric", timeZone: tz }).format(baseNow);
  const targetStr = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "numeric", day: "numeric", timeZone: tz }).format(d);

  const tomorrow = new Date(baseNow.getTime() + 86400000);
  const tomorrowStr = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "numeric", day: "numeric", timeZone: tz }).format(tomorrow);

  if (targetStr === todayStr) {
    return `Today at ${timeStr} (${abbr})`;
  }
  if (targetStr === tomorrowStr) {
    return `Tomorrow at ${timeStr} (${abbr})`;
  }

  return `${dayName}, ${monthDay} at ${timeStr} (${abbr})`;
}

function getMsUntilNextMidnight(tz = "UTC", baseNow = new Date()) {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: false,
    }).formatToParts(baseNow);

    const getPart = (type) => parseInt(parts.find((p) => p.type === type)?.value || "0", 10);
    const hour = getPart("hour") % 24;
    const minute = getPart("minute");
    const second = getPart("second");
    const msPastMidnight = ((hour * 60 + minute) * 60 + second) * 1000 + baseNow.getMilliseconds();
    const msInDay = 86400000;
    const remaining = msInDay - msPastMidnight;
    return remaining > 0 ? remaining : 1000;
  } catch {
    return 60000;
  }
}

// ==========================================
// TEST SUITE
// ==========================================

test("Relative time returns 'just now' for recent events", () => {
  const now = new Date("2026-11-14T12:00:00Z");
  const event = new Date("2026-11-14T11:59:55Z"); // 5s ago
  assert.equal(formatRelativeTime(event, now), "just now");
});

test("Relative time computes seconds, minutes, hours, days correctly", () => {
  const now = new Date("2026-11-14T12:00:00Z");
  assert.equal(formatRelativeTime(new Date(now.getTime() - 45000), now), "45s ago");
  assert.equal(formatRelativeTime(new Date(now.getTime() - 5 * 60000), now), "5m ago");
  assert.equal(formatRelativeTime(new Date(now.getTime() - 2 * 3600000), now), "2h ago");
  assert.equal(formatRelativeTime(new Date(now.getTime() - 3 * 86400000), now), "3d ago");
});

test("Relative time handles null, undefined, invalid timestamps as 'Unavailable'", () => {
  assert.equal(formatRelativeTime(null), "Unavailable");
  assert.equal(formatRelativeTime(undefined), "Unavailable");
  assert.equal(formatRelativeTime("not-a-valid-date"), "Unavailable");
  assert.equal(formatRelativeTime(""), "Unavailable");
});

test("Relative time accepts Unix epoch seconds (Python time.time() float)", () => {
  const now = new Date("2026-11-14T12:00:00Z");
  const pythonEpochSeconds = (now.getTime() - 120000) / 1000; // 2m ago in seconds
  assert.equal(formatRelativeTime(pythonEpochSeconds, now), "2m ago");
});

test("Date-only values stay strictly on their calendar day across timezones without skew", () => {
  const dateStr = "2022-01-10";
  // In Asia/Kolkata (+05:30)
  const kolkataFormatted = formatDateOnly(dateStr, "Asia/Kolkata");
  assert.equal(kolkataFormatted, "Jan 10, 2022");

  // In America/New_York (-05:00)
  const nyFormatted = formatDateOnly(dateStr, "America/New_York");
  assert.equal(nyFormatted, "Jan 10, 2022");

  // In UTC
  const utcFormatted = formatDateOnly(dateStr, "UTC");
  assert.equal(utcFormatted, "Jan 10, 2022");
});

test("Timezone abbreviations and conversions for Asia/Kolkata and America/New_York", () => {
  const instant = new Date("2026-11-14T08:30:00Z"); // 08:30 UTC

  // In Asia/Kolkata (+05:30): 08:30 + 5:30 = 14:00 (2:00 PM)
  const kolkataAbbr = getTimezoneAbbreviation(instant, "Asia/Kolkata");
  assert.match(kolkataAbbr, /IST|GMT\+5:30/);

  // In America/New_York (-05:00 in November): 08:30 - 5:00 = 03:30 (3:30 AM)
  const nyAbbr = getTimezoneAbbreviation(instant, "America/New_York");
  assert.match(nyAbbr, /EST|EDT|GMT-5/);
});

test("Daylight Saving Time transitions for America/New_York", () => {
  // Summer (July) -> EDT (UTC-4)
  const summerDate = new Date("2026-07-15T16:00:00Z"); // 16:00 UTC -> 12:00 PM EDT
  const summerParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    timeZoneName: "short",
  }).formatToParts(summerDate);
  const summerTzName = summerParts.find((p) => p.type === "timeZoneName")?.value;
  assert.match(summerTzName || "", /EDT|GMT-4/);

  // Winter (December) -> EST (UTC-5)
  const winterDate = new Date("2026-12-15T17:00:00Z"); // 17:00 UTC -> 12:00 PM EST
  const winterParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    timeZoneName: "short",
  }).formatToParts(winterDate);
  const winterTzName = winterParts.find((p) => p.type === "timeZoneName")?.value;
  assert.match(winterTzName || "", /EST|GMT-5/);
});

test("Scheduled time formatting handles 'Today at ...' and explicit timezone", () => {
  const baseNow = new Date("2026-11-14T10:00:00Z");
  const laterToday = new Date("2026-11-14T14:30:00Z");
  const scheduledStr = formatScheduledTime(laterToday, "UTC", baseNow);
  assert.equal(scheduledStr, "Today at 2:30 PM (UTC)");
});

test("Scheduled time formatting handles 'Tomorrow at ...'", () => {
  const baseNow = new Date("2026-11-14T10:00:00Z");
  const tomorrow = new Date("2026-11-15T09:00:00Z");
  const scheduledStr = formatScheduledTime(tomorrow, "UTC", baseNow);
  assert.equal(scheduledStr, "Tomorrow at 9:00 AM (UTC)");
});

test("Scheduled time formatting displays day, date, and local timezone for future slots", () => {
  const baseNow = new Date("2026-11-14T10:00:00Z");
  const futureDate = new Date("2026-11-17T14:30:00Z"); // Tuesday
  const scheduledStr = formatScheduledTime(futureDate, "Asia/Kolkata", baseNow);
  // 14:30 UTC is 8:00 PM IST
  assert.match(scheduledStr, /Tuesday, Nov 17 at 8:00 PM \((IST|GMT\+5:30)\)/);
});

test("Local midnight rollover calculation returns valid ms until midnight", () => {
  const baseNow = new Date("2026-11-14T23:59:50Z"); // 10 seconds before UTC midnight
  const msRemaining = getMsUntilNextMidnight("UTC", baseNow);
  assert(msRemaining > 0 && msRemaining <= 10000, `Expected <= 10000 ms, got ${msRemaining}`);

  const kolkataRemaining = getMsUntilNextMidnight("Asia/Kolkata", baseNow);
  assert(kolkataRemaining > 0 && kolkataRemaining <= 86400000);
});
