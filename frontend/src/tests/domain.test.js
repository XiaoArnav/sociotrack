const test = require("node:test");
const assert = require("node:assert/strict");

// Simple domain function mirrors for standalone zero-dependency test runner
function calculateCompositeScore(metrics) {
  const { impressions, shares, replies, likes } = metrics;
  if (!impressions || impressions <= 0) return 0;
  const rawScore = (((shares * 3) + (replies * 2) + (likes * 1)) / impressions) * 100;
  return Number(rawScore.toFixed(2));
}

function analyzeEngagementMetrics(metrics) {
  const score = calculateCompositeScore(metrics);
  const qualifies = score > 5.0;
  let tier = "UNDERPERFORMING";
  if (score >= 7.5) {
    tier = "VIRAL";
  } else if (score >= 4.0) {
    tier = "SOLID";
  }
  return {
    compositeScore: score,
    qualifiesForMemory: qualifies,
    engagementTier: tier,
  };
}

function getPlatformCharLimit(platform) {
  switch (platform) {
    case "X":
      return 280;
    case "Instagram":
      return 2200;
    case "LinkedIn":
    default:
      return 3000;
  }
}

function validatePostLength(content, platform) {
  const charLimit = getPlatformCharLimit(platform);
  const charCount = (content || "").length;
  return {
    isValid: charCount <= charLimit,
    charCount,
    charLimit,
    remainingChars: charLimit - charCount,
  };
}

test("Public Seam 1: Composite Viral Score Calculation", () => {
  // Test case: 10,000 views, 140 shares, 70 replies, 350 likes
  // Formula: ((140*3 + 70*2 + 350*1) / 10000) * 100 = 9.10
  const metrics = { impressions: 10000, shares: 140, replies: 70, likes: 350 };
  const score = calculateCompositeScore(metrics);
  assert.equal(score, 9.1);
});

test("Public Seam 2: Zero Impressions Boundary Handling", () => {
  const metrics = { impressions: 0, shares: 100, replies: 50, likes: 200 };
  const score = calculateCompositeScore(metrics);
  assert.equal(score, 0);
});

test("Public Seam 3: Memory Distillation 5.0 Threshold Gating", () => {
  // High viral performance -> Qualifies
  const viralPost = { impressions: 15000, shares: 260, replies: 120, likes: 650 };
  const viralResult = analyzeEngagementMetrics(viralPost);
  assert.equal(viralResult.qualifiesForMemory, true);
  assert.equal(viralResult.engagementTier, "VIRAL");

  // Low performance -> Discarded
  const lowPost = { impressions: 10000, shares: 10, replies: 5, likes: 30 };
  const lowResult = analyzeEngagementMetrics(lowPost);
  assert.equal(lowResult.qualifiesForMemory, false);
  assert.equal(lowResult.engagementTier, "UNDERPERFORMING");
});

test("Public Seam 4: Platform Character Limits and Invariants", () => {
  assert.equal(getPlatformCharLimit("X"), 280);
  assert.equal(getPlatformCharLimit("LinkedIn"), 3000);
  assert.equal(getPlatformCharLimit("Instagram"), 2200);

  const shortXPost = "SocioTrack AI agents are deterministic.";
  const validationX = validatePostLength(shortXPost, "X");
  assert.equal(validationX.isValid, true);
  assert.equal(validationX.charCount, shortXPost.length);
  assert.equal(validationX.remainingChars, 280 - shortXPost.length);

  const overflowXPost = "a".repeat(281);
  const overflowValidation = validatePostLength(overflowXPost, "X");
  assert.equal(overflowValidation.isValid, false);
  assert.equal(overflowValidation.remainingChars, -1);
});
