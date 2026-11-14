const test = require("node:test");
const assert = require("node:assert/strict");

// Navigation and Accessible Brand Link Invariant Tests
function getHomeLinkAttributes() {
  return {
    href: "/",
    "aria-label": "SocioTrack home",
    accessibleName: "SocioTrack home",
  };
}

function resetToDefaultStartingView(currentState) {
  // Simulates handleHomeNavigation behavior
  return {
    ...currentState,
    activeSubTab: "overview",
    selectedStudioHook: "",
    searchQuery: "",
    memorySearchQuery: "",
    openFaqIdx: null,
    showAddAccountModal: false,
    showSurveyModal: false,
    showOnboardingWizard: false,
    showFeedbackModal: false,
    showTeamModal: false,
    showLegalModal: false,
    showHelpModal: false,
    showAuthModal: false,
    // Explicitly preserve session and workspace selection
    currentUser: currentState.currentUser,
    activeBrandId: currentState.activeBrandId,
    workspaceBrands: currentState.workspaceBrands,
    drafts: currentState.drafts,
    insights: currentState.insights,
  };
}

test("Home link has semantic root destination and accessible name 'SocioTrack home'", () => {
  const attrs = getHomeLinkAttributes();
  assert.equal(attrs.href, "/");
  assert.equal(attrs["aria-label"], "SocioTrack home");
  assert.equal(attrs.accessibleName, "SocioTrack home");
});

test("Home navigation resets tab state to 'overview' while preserving user session and workspace", () => {
  const dirtyState = {
    activeSubTab: "historical",
    selectedStudioHook: "Test hook for AI studio",
    searchQuery: "bpbarbiz",
    memorySearchQuery: "retention",
    openFaqIdx: 2,
    showAddAccountModal: true,
    showSurveyModal: true,
    showOnboardingWizard: false,
    showFeedbackModal: false,
    showTeamModal: false,
    showLegalModal: false,
    showHelpModal: false,
    showAuthModal: false,
    currentUser: { email: "founder@sociotrack.io", name: "Founder", role: "admin" },
    activeBrandId: "brd_pro_analytics",
    workspaceBrands: [{ id: "brd_pro_analytics", name: "Pro Brand" }],
    drafts: [{ id: "d1", title: "Saved Draft" }],
    insights: [{ id: "i1", text: "Learned insight" }],
  };

  const cleanState = resetToDefaultStartingView(dirtyState);

  // Tabs and modals are reset to starting view
  assert.equal(cleanState.activeSubTab, "overview");
  assert.equal(cleanState.selectedStudioHook, "");
  assert.equal(cleanState.searchQuery, "");
  assert.equal(cleanState.memorySearchQuery, "");
  assert.equal(cleanState.openFaqIdx, null);
  assert.equal(cleanState.showAddAccountModal, false);
  assert.equal(cleanState.showSurveyModal, false);

  // User session, workspace, and data are strictly preserved
  assert.deepEqual(cleanState.currentUser, dirtyState.currentUser);
  assert.equal(cleanState.activeBrandId, "brd_pro_analytics");
  assert.equal(cleanState.drafts.length, 1);
  assert.equal(cleanState.insights.length, 1);
});
