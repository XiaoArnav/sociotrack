const test = require("node:test");
const assert = require("node:assert/strict");

// Verification of historical stats deltas and CSV export generator logic
function computeConsecutiveDeltas(observations) {
  // observations chronologically ordered (ASC)
  return observations.map((curr, idx) => {
    if (idx === 0) {
      return {
        ...curr,
        followers_delta: null,
        following_delta: null,
        media_delta: null,
        engagement_delta: null,
      };
    }
    const prev = observations[idx - 1];
    return {
      ...curr,
      followers_delta: curr.followers - prev.followers,
      following_delta: curr.following - prev.following,
      media_delta: curr.media_count - prev.media_count,
      engagement_delta:
        curr.engagement_rate !== null && prev.engagement_rate !== null
          ? Number((curr.engagement_rate - prev.engagement_rate).toFixed(2))
          : null,
    };
  });
}

function formatDeltaPill(delta, unit = "") {
  if (delta === null || delta === undefined) return "—";
  if (delta === 0) return "0" + (unit ? ` ${unit}` : "");
  const prefix = delta > 0 ? "+" : "";
  return `${prefix}${delta}` + (unit ? ` ${unit}` : "");
}

function generateHistoricalCsv(creatorHandle, dateRange, timezone, rows) {
  if (!rows || rows.length === 0) {
    return null;
  }
  const meta = [
    `# SocioTrack Verified Historical Stats Report`,
    `# Creator: @${creatorHandle}`,
    `# Date Range: ${dateRange}`,
    `# Applicable Timezone: ${timezone}`,
    `# Total Records: ${rows.length}`,
    ``,
  ].join("\n");

  const headers = "Date,Observation Time (UTC),Followers,Followers Delta,Following,Following Delta,Media Count,Media Delta,Engagement Rate,Engagement Delta (pp)\n";
  const body = rows.map((r) => {
    const folDelta = formatDeltaPill(r.followers_delta);
    const focDelta = formatDeltaPill(r.following_delta);
    const medDelta = formatDeltaPill(r.media_delta);
    const engRate = r.engagement_rate !== null ? `${r.engagement_rate.toFixed(2)}%` : "—";
    const engDelta = formatDeltaPill(r.engagement_delta, "pp");
    return `"${r.formattedDate}","${r.date}",${r.followers},${folDelta},${r.following},${focDelta},${r.media_count},${medDelta},${engRate},${engDelta}`;
  }).join("\n");

  return meta + headers + body;
}

test("Initial observation has no delta and renders as '—'", () => {
  const initial = [
    {
      date: "2026-11-12T10:00:00Z",
      followers: 5000,
      following: 200,
      media_count: 50,
      engagement_rate: 6.5,
    },
  ];
  const computed = computeConsecutiveDeltas(initial);
  assert.equal(computed[0].followers_delta, null);
  assert.equal(computed[0].following_delta, null);
  assert.equal(computed[0].media_delta, null);
  assert.equal(computed[0].engagement_delta, null);
  assert.equal(formatDeltaPill(computed[0].followers_delta), "—");
});

test("Consecutive observations calculate exact differences and preserve real zeros", () => {
  const timeline = [
    { date: "2026-11-12T10:00:00Z", followers: 10000, following: 300, media_count: 80, engagement_rate: 4.5 },
    { date: "2026-11-13T10:00:00Z", followers: 10150, following: 302, media_count: 81, engagement_rate: 4.75 },
    { date: "2026-11-14T10:00:00Z", followers: 10120, following: 302, media_count: 81, engagement_rate: 4.6 },
  ];
  const computed = computeConsecutiveDeltas(timeline);

  // Day 2
  assert.equal(computed[1].followers_delta, 150);
  assert.equal(formatDeltaPill(computed[1].followers_delta), "+150");
  assert.equal(computed[1].following_delta, 2);
  assert.equal(computed[1].media_delta, 1);
  assert.equal(computed[1].engagement_delta, 0.25);
  assert.equal(formatDeltaPill(computed[1].engagement_delta, "pp"), "+0.25 pp");

  // Day 3 (loss of 30 followers, 0 change in following and media)
  assert.equal(computed[2].followers_delta, -30);
  assert.equal(formatDeltaPill(computed[2].followers_delta), "-30");
  assert.equal(computed[2].following_delta, 0);
  assert.equal(formatDeltaPill(computed[2].following_delta), "0"); // Real zero preserved!
  assert.equal(computed[2].media_delta, 0);
  assert.equal(formatDeltaPill(computed[2].media_delta), "0"); // Real zero preserved!
  assert.equal(computed[2].engagement_delta, -0.15);
  assert.equal(formatDeltaPill(computed[2].engagement_delta, "pp"), "-0.15 pp");
});

test("CSV export contains creator handle, date range, timezone, and exact figures", () => {
  const rows = [
    {
      formattedDate: "Nov 14, 2026",
      date: "2026-11-14T10:00:00Z",
      followers: 10120,
      followers_delta: -30,
      following: 302,
      following_delta: 0,
      media_count: 81,
      media_delta: 0,
      engagement_rate: 4.6,
      engagement_delta: -0.15,
    },
    {
      formattedDate: "Nov 13, 2026",
      date: "2026-11-13T10:00:00Z",
      followers: 10150,
      followers_delta: 150,
      following: 302,
      following_delta: 2,
      media_count: 81,
      media_delta: 1,
      engagement_rate: 4.75,
      engagement_delta: 0.25,
    },
  ];

  const csv = generateHistoricalCsv("bpbarbiz", "Last 7 Days", "Asia/Kolkata", rows);
  assert.ok(csv.includes("# Creator: @bpbarbiz"));
  assert.ok(csv.includes("# Date Range: Last 7 Days"));
  assert.ok(csv.includes("# Applicable Timezone: Asia/Kolkata"));
  assert.ok(csv.includes('"Nov 14, 2026","2026-11-14T10:00:00Z",10120,-30,302,0,81,0,4.60%,-0.15 pp'));
  assert.ok(csv.includes('"Nov 13, 2026","2026-11-13T10:00:00Z",10150,+150,302,+2,81,+1,4.75%,+0.25 pp'));
});

test("CSV export returns null when dataset is empty", () => {
  const csv = generateHistoricalCsv("empty_user", "All Time", "UTC", []);
  assert.equal(csv, null);
});
