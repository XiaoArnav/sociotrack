# Global Antigravity Operating Directives & Guidelines

## Git & GitHub Contribution Graph Guarantee ("Green Dot" Policy)

### Objective
Ensure that EVERY git commit and push performed by Antigravity in any project or workspace across the entire system reliably attributes to the user's GitHub profile (`XiaoArnav`) and registers as an active contribution (green dot) on the GitHub contribution matrix.

### The 6 Mandatory Git Rules for Antigravity

1. **User Identity Verification (Strict Author Attribution)**:
   - All commits must strictly use the verified GitHub account identity:
     - **Name**: `XiaoArnav`
     - **Email**: `322868724+XiaoArnav@users.noreply.github.com`
   - Never use generic system usernames, machine hostnames (e.g., `polymath@MacBook-Air.local`), or unverified secondary emails.
   - If running git commands in new environments or subshells, verify `git config user.email` or pass `--author="XiaoArnav <322868724+XiaoArnav@users.noreply.github.com>"`.

2. **Branch Targeting (Default Branch Priority)**:
   - GitHub only records contributions for commits present on the repository's **default branch** (typically `main`) or `gh-pages`. Commits left on orphan or unmerged feature branches do not register.
   - Always commit directly to `main` (or the default branch), or immediately merge feature branches into `main` before pushing.

3. **Remote Synchronization (Always Push)**:
   - Commits stored solely on the local drive do not light up the green dots.
   - Always push commits to the remote repository on GitHub (`git push origin <branch>`) upon completing a task or milestone.

4. **Standalone Repositories vs Forks**:
   - Commits in forked repositories do not count toward profile contributions unless merged into upstream via an accepted Pull Request.
   - When initializing new hackathons, demos, or projects, ensure they are initialized as independent standalone repositories under `XiaoArnav/` on GitHub.

5. **Clean History & Atomic Commits**:
   - Write clear Conventional Commit messages (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`).
   - Ensure commits preserve valid author timestamps matching current real time.
   - Avoid detached HEAD states or discarding commits during rebase.

6. **Private Repository Visibility**:
   - If working on a private repository, note that GitHub requires the user to enable **"Include private contributions on my profile"** in GitHub Profile Settings (`https://github.com/settings/profile`) for those dots to be publicly visible.

---

## Mandatory Antigravity Operating Directives: Core Engineering & Safety Skills

Across the **entire Antigravity system** and in every workspace, Antigravity agents MUST strictly adhere to and execute the following core skill workflows to get things done, code better, and ship high-impact products:

1. **`git-guardrails` (Mandatory Privacy & Safety Gate)**:
   - Active on every tool execution via lifecycle hooks (`PreToolUse`).
   - Accidental `git push` of private workspaces, academic records (USN, attendance, internal grading rubrics), personal tokens, or unverified repos is unconditionally blocked.
   - Destructive operations (`git reset --hard`, `git clean -fd`, `git checkout .`, `git restore .`, `push --force`, `branch -D`) are strictly forbidden.

2. **`grill-me` / `grilling` (Mandatory Design Alignment Before Implementation)**:
   - Before writing code for non-trivial features, architectural migrations, or new data models, Antigravity MUST run a structured interview round.
   - Work the design tree in rounds: number questions (Q1, Q2), provide clear recommended answers (➡️), and word them so "yes" accepts recommendations.
   - Never silently assume requirements; settle all open branches of the design tree before creating or altering code.

3. **`tdd` (Mandatory Mathematical & Core Logic Integrity)**:
   - For all calculation engines (SGPA/CGPA formulas, cohort percentiles, dense rankings, data sync transformers, converters), Test-Driven Development is mandatory.
   - Agree on public seams with the user first; write failing tests verifying observable behavior before implementing code (Red → Green loop).
   - Avoid tautological or implementation-coupled tests; verify against independent, ground-truth expected values.

4. **`diagnosing-bugs` (Mandatory Systematic Debugging Discipline)**:
   - When fixing bugs, data parsing errors, or regressions, NEVER guess code changes or edit files without an automated feedback loop.
   - Follow the 6-phase discipline: (1) Build a tight, red-capable feedback loop, (2) Reproduce and minimise, (3) Hypothesise 3–5 ranked falsifiable causes, (4) Instrument with tagged logs (`[DEBUG-xxxx]`), (5) Fix & write regression test at a true seam, (6) Cleanup.

5. **`codebase-design` & `improve-codebase-architecture` (Deep Module Architecture)**:
   - Structure code as **deep modules**: small, clear interfaces hiding rich implementation.
   - Prevent monolithic single-file bloat; cleanly separate rendering/UI state, business logic, and external data sync adapters.
   - Scan for shallow modules and refactor toward testable, AI-navigable seams.

6. **`code-review` (Two-Axis Standards & Spec Review)**:
   - Review changes along two distinct axes: Standards (conformance to repo conventions + Fowler code smell baseline) and Spec (verifying observable requirements match the spec).
   - Catch subtle regressions, race conditions, edge cases, and typing holes before shipping.

7. **`domain-modeling` (Ubiquitous Language & Clear Invariants)**:
   - Build and sharpen the project's domain model: challenge fuzzy terms, define entity lifecycles, and record architectural decisions (ADRs).

8. **`prototype` (Rapid Throwaway Verification)**:
   - Build throwaway logic walkthroughs or UI variants to answer core design questions fast before committing to heavy implementation.

9. **`implement-spec` & `to-tickets` (Task Graph Frontier)**:
   - Convert specs into actionable task graphs with blocking boundaries. Execute ready frontier tickets test-first.

10. **`writing-for-agents` & `handoff` (High-Signal Agent Context)**:
    - Structure prompts, docs, and handoffs with clean context pointers, front-loaded triggers, and zero bloat.
