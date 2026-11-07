# ADR 0001: Split-Screen Authentication and Session Gating

## Status
Accepted

## Context
For enterprise production standards, SocioTrack requires an enterprise-ready entry point that immediately sets a professional, high-trust tone while demonstrating the product's intelligent capabilities before the user enters the main workspace. 

Requirements dictated that:
1. The first screen must always be the Login page (never open directly into the dashboard).
2. The authentication journey must support Sign In, Sign Up, and Password Reset.
3. The left 55% of the screen must showcase the brand vision with an abstract AI network visualization of the 4 interconnected nodes.
4. Prototype interactions must provide zero-friction evaluator access ("Instant Demo Access") while supporting real credential validation.

## Decision
We implemented a split-screen layout (`AuthPage.tsx`) using a client-side reactive state machine:
- The screen canvas is calibrated to 1440 × 900 px with responsive downscaling for tablets and mobile devices.
- The left presentation pane renders the custom SocioTrack vector logo, brand headline (*"Your Audience. Your Intelligence. Your Growth."*), and an SVG network graph with glowing node highlights.
- The right authentication card handles 3 sub-views (`login`, `signup`, `forgot_password`) with:
  - Form field validation (work email format, 6+ character password requirement).
  - Accurate Microsoft 4-square SVG and Google SSO integration.
  - An "Instant Demo Access" accelerator allowing judges to test without typing.
  - Session state gating in `page.tsx` (`currentUser` object) that mounts the workspace only after successful authentication.

## Consequences
- **Positive**: Strict adherence to the security invariant of never opening directly into an unauthenticated dashboard.
- **Positive**: Clear visual proof of enterprise identity and Microsoft Fluent design principles.
- **Positive**: Zero latency demo transition for technical evaluation.
