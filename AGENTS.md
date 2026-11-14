# Global Antigravity Operating Directives & Guidelines
# Inspired by Matt Pocock Engineering Philosophy & Classic Systems Design

## Git & GitHub Contribution Graph Guarantee ("Green Dot" Policy)

### Objective
Ensure that EVERY git commit and push performed by Antigravity in any project or workspace across the entire system reliably attributes to the user's GitHub profile (`Krishna Verma`) and registers as an active contribution (green dot) on the GitHub contribution matrix.

### The 6 Mandatory Git Rules for Antigravity

1. **User Identity Verification (Strict Author Attribution)**:
   - All commits must strictly use the verified GitHub account identity:
     - **Name**: `Krishna Verma`
     - **Email**: `zepta316@gmail.com`
   - Never use generic system usernames, machine hostnames (e.g., `polymath@MacBook-Air.local`), or unverified secondary emails.
   - If running git commands in new environments or subshells, verify `git config user.email` or pass `--author="Krishna Verma <zepta316@gmail.com>"`.

2. **Branch Targeting (Default Branch Priority)**:
   - GitHub only records contributions for commits present on the repository's **default branch** (typically `main`) or `gh-pages`. Commits left on orphan or unmerged feature branches do not register.
   - Always commit directly to `main` (or the default branch), or immediately merge feature branches into `main` before pushing.

3. **Remote Synchronization (Always Push)**:
   - Commits stored solely on the local drive do not light up the green dots.
   - Always push commits to the remote repository on GitHub (`git push origin <branch>`) upon completing a task or milestone.

4. **Standalone Repositories vs Forks**:
   - Commits in forked repositories do not count toward profile contributions unless merged into upstream via an accepted Pull Request.
   - When initializing new hackathons, demos, or projects, ensure they are initialized as independent standalone repositories under `stillzepta/` on GitHub.

5. **Clean History & Atomic Commits**:
   - Write clear Conventional Commit messages (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`).
   - Ensure commits preserve valid author timestamps matching current real time.
   - Avoid detached HEAD states or discarding commits during rebase.

6. **Private Repository Visibility**:
   - If working on a private repository, note that GitHub requires the user to enable **"Include private contributions on my profile"** in GitHub Profile Settings (`https://github.com/settings/profile`) for those dots to be publicly visible.

---

## The Matt Pocock Engineering Operating System (Pocock-OS)

We build software and AI agents adhering to the rigorous engineering disciplines distilled across Matt Pocock's 200+ repositories (`skills`, `sandcastle`, `evalite`, `agent-rules-books`, `ts-reset`):

### 1. The Deep Module Doctrine (Ousterhout's Razor)
- **Primary Success Metric**: Reduced cognitive load, zero change amplification, and elimination of hidden dependencies.
- **Deep Modules Only**: Small, semantic public interfaces hiding rich internal implementation. Reject pass-through services, thin wrappers, and tiny split-outs that add file count without reducing reader burden.
- **Pull Complexity Downward**: When a lower module owns the knowledge, it must absorb the complexity so that all callers enjoy clean, obvious public contracts.
- **Define Away Invalid States**: Reduce error/exception surfaces by designing interfaces and invariants where illegal states cannot be represented.

### 2. Public-Seam Testing Discipline (Zero Internal Coupling)
- **Tests Test The Public Seam Only**: Tests must interact with modules strictly through public entry points (as an external consumer would). Tests never import internal private helpers or reach across layer boundaries.
- **Test-Driven Development (TDD)**: Agree on observable public contracts first. Write failing red tests verifying observable behavior before implementing code.
- **No Mock Tautologies**: Avoid tautological tests coupled to implementation details; assert ground-truth observable outputs.

### 3. Agentic Context Hygiene & Progressive Disclosure
- **Context Load vs Cognitive Load**: Every word in an always-loaded prompt costs tokens and attention on every turn. Prune relentlessly.
- **Progressive Disclosure**: Keep root instructions concise; push specialized reference materials behind front-loaded **context pointers** loaded on-demand only when a branch triggers.
- **Sparse Subagent Communication**: Run implementer subagents with fresh context windows to eliminate context bleed. Communicate via context pointers to specs, commits, and diffs.
- **Task Graph Frontier**: Model implementations as directed acyclic graphs (DAGs) of tickets with explicit blocking boundaries, executing ready frontier tickets test-first.

### 4. Data-Intensive Invariant Modeling (Kleppmann Baseline)
- **Source of Truth & Durability**: Every write path must explicitly define its source of truth, consistency boundary, durability point, and idempotent retry contract.
- **Fault-Tolerant by Design**: Crashes, partial writes, network timeouts, and duplicate payloads are treated as normal inputs, guarded by deduplication keys and natural idempotency.

### 5. Continuous Documentation-Code Parity
- **Ubiquitous Language (`GLOSSARY.md`)**: Establish shared domain terminology early. When terms change, update the glossary immediately.
- **Architectural Decision Records (`docs/adr/`)**: Record non-obvious technical tradeoffs the moment they crystallize. Never re-litigate settled ADRs without new facts.
- **Tested Documentation**: Enforce that code, guides, and glossaries never drift apart.

---

## Mandatory Antigravity Operating Directives: Core Engineering Skills

1. **`git-guardrails`**: Intercepts dangerous operations (`reset --hard`, `push --force`, `branch -D`) and blocks accidental pushes of secrets or private academic records.
2. **`grill-me` / `grilling`**: Mandatory structured interview rounds settling every branch of the design tree before creating or altering code.
3. **`tdd`**: Mandatory Test-Driven Development for all calculations, data transformations, and API contracts.
4. **`diagnosing-bugs`**: Systematic 6-phase feedback loop (Red reproduce → Hypothesize 3–5 causes → Tagged instrument → Fix at true seam → Cleanup).
5. **`codebase-design` & `improve-codebase-architecture`**: Deep module refactoring and automated structural reports.
6. **`code-review`**: Exhaustive two-axis review (Standards + Spec) using parallel subagents and Fowler code smell baseline.
7. **`domain-modeling`**: Active DDD domain modeling and ADR documentation.
8. **`prototype`**: High-velocity throwaway logic demos (HTML/script) and UI variants to settle design questions fast.
9. **`implement-spec` & `to-tickets`**: Task graph decomposition and frontier ticket execution.
10. **`writing-for-agents` & `handoff`**: Context pointer optimization and zero-bloat session handoffs.
