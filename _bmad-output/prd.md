---
workflowType: 'prd'
workflow: 'edit'
classification:
  domain: 'general-productivity'
  projectType: 'web-application'
  complexity: 'low'
inputDocuments:
  - '_bmad/prd.md (legacy prose, preserved as Background & Context)'
stepsCompleted: ['step-e-01-discovery', 'step-e-01b-legacy-conversion', 'step-e-02-review', 'step-e-03-edit']
lastEdited: '2026-04-29'
editHistory:
  - date: '2026-04-29'
    author: 'John (BMad PM)'
    changes: 'Full restructuring from legacy prose to BMAD standard PRD. Added Executive Summary, Success Criteria, Product Scope, User Journeys, 12 Functional Requirements, 9 Non-Functional Requirements, Technical Assumptions (React + Express + PostgreSQL), and Risks. Original prose preserved verbatim as Background & Context.'
---

# Todo App — Product Requirements Document

## Executive Summary

**Vision.** A single-user, web-based personal task list that loads, lets you add a task, and gets out of your way. Zero onboarding, zero feature bloat, zero account setup.

**Problem.** General-purpose task managers ship with collaboration, projects, due dates, AI suggestions, and tag taxonomies. A user who wants to capture "buy milk" and tick it off pays for that surface area in cognitive overhead, load time, and learning curve.

**Target user.** A single individual operating their own deployment of the app for personal task management. Multi-tenant, multi-user, and shared-team use cases are explicitly out of scope.

**Differentiator.** Deliberately minimal scope: create, list, complete, delete. The product is the absence of features. Everything that ships in v1 is justified by the four core verbs.

**Strategic intent.** Establish a clean technical foundation (React + Express + PostgreSQL) that can host future features (auth, multi-user, sync) without rework, while shipping a v1 that is genuinely useful on its own.

## Background & Context

> The following prose is the original product brief, preserved verbatim. It captures the founding intent and tone of the product.

The goal of this project is to design and build a simple full-stack Todo application that allows individual users to manage personal tasks in a clear, reliable, and intuitive way. The application should focus on clarity and ease of use, avoiding unnecessary features or complexity, while providing a solid technical foundation that can be extended in the future if needed.

From a user perspective, the application should allow the creation, visualization, completion, and deletion of todo items. Each todo represents a single task and should include a short textual description, a completion status, and basic metadata such as creation time. Users should be able to immediately see their list of todos upon opening the application and interact with it without any onboarding or explanation.

The frontend experience should be fast and responsive, with updates reflected instantly when the user performs an action such as adding or completing a task. Completed tasks should be visually distinguishable from active ones to clearly communicate status at a glance. The interface should work well across desktop and mobile devices and include sensible empty, loading, and error states to maintain a polished user experience.

The backend will expose a small, well-defined API responsible for persisting and retrieving todo data. This API should support basic CRUD operations and ensure data consistency and durability across user sessions. While authentication and multi-user support are not required for the initial version, the architecture should not prevent these features from being added later if the product evolves.

From a non-functional standpoint, the system should prioritize simplicity, performance, and maintainability. Interactions should feel instantaneous under normal conditions, and the overall solution should be easy to understand, deploy, and extend by future developers. Basic error handling is expected both client-side and server-side to gracefully handle failures without disrupting the user flow.

The first version of the application intentionally excludes advanced features such as user accounts, collaboration, task prioritization, deadlines, or notifications. These capabilities may be considered in future iterations, but the initial delivery should remain focused on delivering a clean and reliable core experience.

Success for this project will be measured by the ability of a user to complete all core task-management actions without guidance, the stability of the application across refreshes and sessions, and the clarity of the overall user experience. The final result should feel like a complete, usable product despite its deliberately minimal scope.

## Success Criteria

| ID | Criterion | Measurement Method |
|---|---|---|
| **SC-1** | First-time user completes the round-trip (open → add a task → mark complete → delete) without external instruction in under 60 seconds | 5 unmoderated usability sessions; ≥ 4 of 5 succeed unaided |
| **SC-2** | 100% of created tasks persist across page refresh and across server restart | Automated test: 1000 add/refresh cycles + 10 server-restart cycles, asserting zero data loss |
| **SC-3** | Median round-trip latency from user action (click) to confirmed UI state is under 150ms on a wired desktop connection to a localhost backend | In-app `performance.mark()` instrumentation, p50 reported per release |
| **SC-4** | Application renders a usable UI on viewport widths from 320px to 1920px with no horizontal scroll | Automated responsive tests on Chrome, Safari, Firefox latest stable |
| **SC-5** | Every supported action (add, list, toggle, delete) is operable using keyboard alone | Manual accessibility walkthrough sign-off prior to release |

## Product Scope

### MVP (v1) — In scope

- Single-user, no authentication, single shared dataset
- CRUD on todo items: text title, completion status, created-at timestamp
- List view with visual differentiation between active and completed tasks
- Empty, loading, and error UI states for the list view
- Server-backed persistence (PostgreSQL via Express API)
- Responsive layout (320px–1920px)
- Keyboard operability for all four core actions
- The full set of FRs in this document constitutes the v1 acceptance contract

### Growth (v1.x) — Plausible next phase

- User accounts and authentication
- Per-user data scoping (todos owned by an authenticated identity)
- Cross-device sync via authenticated session
- Search / filter / sort

### Vision (v2+) — Possible future direction

- Multi-user collaboration and list sharing
- Task prioritization, due dates, recurrence, reminders, notifications
- Tags, projects, subtasks
- Native mobile clients
- Offline-first sync

### Explicitly out of scope for v1

- Authentication, identity, account management
- Collaboration, sharing, multi-tenancy
- Due dates, priorities, recurrence, reminders, notifications
- Search, filtering, sorting, tagging
- Bulk operations
- Offline mode

## User Journeys

### UJ-1: First-time use (cold start)
1. User opens the app URL in a browser.
2. App loads the list view; with no todos present, an empty state invites the first task.
3. User types task text and submits.
4. The new task appears in the active list.
5. **Time-to-first-task target:** under 30 seconds from URL load.

### UJ-2: Daily task management (warm start)
1. User reopens the app; previously created tasks are visible without further action.
2. User completes a real-world task; toggles the corresponding item to complete in the app.
3. The completed task is visually de-emphasized but remains in the list.
4. User adds a new task without disrupting the existing list.

### UJ-3: List cleanup
1. User identifies a task that is no longer needed (stale, mistaken, or completed and no longer worth keeping).
2. User deletes the task via an explicit delete control.
3. UI updates within 150ms median.
4. Deleted task does not return after refresh.

## Functional Requirements

Each FR is a capability contract: testable, traceable, free of implementation detail. Implementation decisions live in the architecture phase.

| ID | Requirement | Acceptance Criteria | Source |
|---|---|---|---|
| **FR-1** | User can create a new todo by entering text and submitting | Blank/whitespace-only submissions rejected with inline message; text up to 280 characters accepted; new task visible in the list within 150ms median; created-at timestamp recorded server-side | UJ-1, UJ-2, Background P2 |
| **FR-2** | User sees all existing todos on app load, ordered by created-at descending (newest first) | List renders within 500ms p95 on initial load with ≤ 50 todos; both active and completed tasks visible | UJ-1, UJ-2, Background P2–P3 |
| **FR-3** | User can toggle a task's completion state via single click or tap | State change reflected in UI within 150ms median; persisted server-side; idempotent (double-toggle returns to original state) | UJ-2, Background P2 |
| **FR-4** | User can delete a todo via an explicit delete control | Deleted task removed from UI within 150ms median; deletion persists across refresh; deleting a non-existent ID returns success (idempotent) | UJ-3, Background P2 |
| **FR-5** | Completed todos are visually distinguished from active todos | Distinction does not rely on color alone (e.g., strikethrough plus reduced opacity); contrast ratio between active and completed text states ≥ 3:1 | Background P3 |
| **FR-6** | The todo list survives page refresh, browser close/reopen, and backend restart | 1000-cycle add/refresh automated test passes with zero data loss; cold backend restart returns identical list on next GET | Background P4 |
| **FR-7** | When no todos exist, the app displays a non-blocking empty state inviting task creation | Empty state visible whenever todo count = 0; no error styling; includes a visible affordance to create the first task | Background P3 |
| **FR-8** | While the initial todo list is being fetched, the app displays a non-blocking loading indicator | Indicator visible if fetch exceeds 200ms; replaced by list or empty state on completion; never visible alongside data | Background P3 |
| **FR-9** | When a backend operation fails, the app displays an inline, dismissible error and preserves user input | Failed create does not clear the input field; error message names the failed operation; error remains until dismissed or until the next successful action | Background P3, P5 |
| **FR-10** | Create, toggle, and delete actions update the UI optimistically, then reconcile with the server response | UI reflects intended state within 50ms of user action; on server failure, UI rolls back to prior state and FR-9 fires | Background P3 ("instant updates") |
| **FR-11** | The app's layout adapts to viewports from 320px to 1920px wide | No horizontal scroll at any breakpoint in 320–1920px; all controls remain operable; input font size ≥ 16px to suppress mobile auto-zoom | Background P3 |
| **FR-12** | All actions (create, toggle, delete) are operable via keyboard alone | Tab order is logical; Enter submits a new task from the input field; visible focus indicators on all interactive elements | SC-5 |

## Non-Functional Requirements

Each NFR specifies a metric, condition, and measurement method.

| ID | Requirement | Measurement |
|---|---|---|
| **NFR-1** | Backend responds to all CRUD requests with p95 under 200ms and p99 under 500ms under expected single-user load (≤ 5 RPS) | Server-side request-timing instrumentation, reported per release |
| **NFR-2** | User-initiated state changes reach a confirmed UI state within 150ms median, 300ms p95, on a localhost or LAN backend | Client-side `performance.mark()` instrumentation around user actions |
| **NFR-3** | 100% of confirmed write operations (HTTP 2xx) survive backend process restart | Integration test: issue N writes → restart server → assert all N records returned by GET |
| **NFR-4** | App functions on the latest two major versions of Chrome, Firefox, Safari, and Edge as of release date | Automated cross-browser test runner (Playwright or equivalent) on every release candidate |
| **NFR-5** | App passes WCAG 2.1 Level AA for the four core flows (create, list, toggle, delete) | Automated axe-core scan in CI plus manual screen-reader pass (VoiceOver, NVDA) before release |
| **NFR-6** | Initial app shell + todo list (LCP) renders within 2.0s on Fast 3G simulated throttling with ≤ 50 todos in the dataset | Lighthouse CI on every PR; failures block merge |
| **NFR-7** | Any backend operation failure surfaces a user-visible error within 1 second of the failed call (including timeouts) | Chaos test injecting 500-class responses and timeout responses; assert error UI within budget |
| **NFR-8** | Codebase enforces lint, type-check, and ≥ 80% line coverage on backend route handlers and on frontend state-management logic | CI gates on every PR; coverage reported per release |
| **NFR-9** | A clean clone produces a running app via documented bootstrap commands in under 10 minutes | Quarterly walkthrough on a fresh environment by a developer not previously on the project |

## Technical Assumptions

These constrain implementation but live above architecture-level detail. The Architect (Winston) refines these into concrete decisions.

| ID | Assumption | Rationale / Notes |
|---|---|---|
| **TA-1** | Frontend: React (current stable, hooks-based functional components) | Stack constraint set by stakeholder. Build tooling (Vite, Next.js, etc.) deferred to architecture |
| **TA-2** | Backend: Express.js on Node.js LTS, REST API, JSON request/response | Stack constraint set by stakeholder |
| **TA-3** | Datastore: PostgreSQL, single `todos` table for v1 | Stack constraint set by stakeholder. Schema details deferred to architecture |
| **TA-4** | API contract: REST endpoints under `/api/todos` — `GET` (list), `POST` (create), `PATCH /:id` (update), `DELETE /:id` | Final shape ratified in architecture; this is a starting position |
| **TA-5** | No authentication in v1; single anonymous shared dataset, **with infrastructure designed for future per-user auth scoping** | ✅ **Resolved 2026-04-29** by stakeholder during architecture phase: "basic persistence with postgres, but leave the infrastructure open to auth scoping in the future." Architecture (Winston) will design schema and middleware seam so adding auth later is a localized change, not a refactor. |
| **TA-6** | Single-tenant deployment topology: web client + one backend instance + one Postgres instance | No horizontal scaling required for v1. Acceptable since target is personal-use deployments |
| **TA-7** | Optimistic UI per FR-10 with last-write-wins reconciliation | Acceptable for single-user v1 where conflicts are not expected |

## Risks & Open Questions

| ID | Risk / Question | Severity | Mitigation |
|---|---|---|---|
| **R-1** | ~~Persistence scoping ambiguity (see TA-5) — server-side global vs per-browser-anonymous~~ | Resolved | ✅ Resolved 2026-04-29: server-side Postgres, single anonymous shared dataset, future-auth-ready infrastructure (see TA-5) |
| **R-2** | With no auth and a shared dataset, deploying on a public URL exposes the same todo list to anyone who finds the URL | High | Explicit warning in README; default deployment instructions assume localhost / private network |
| **R-3** | 280-character title cap (FR-1) is an opinionated default; may not match user expectation | Low | Revisit after first round of usability testing (SC-1) |
| **R-4** | "Optimistic UI then reconcile" (FR-10) introduces edge cases on server failure | Medium | Architecture phase to specify rollback semantics; covered by chaos testing under NFR-7 |

## Traceability Summary

- **Vision** (Executive Summary) → **Success Criteria** SC-1..SC-5
- **Success Criteria** → **User Journeys** UJ-1..UJ-3 → **Functional Requirements** FR-1..FR-12
- **Background P3 ("polished UX")** → FR-5, FR-7, FR-8, FR-9, FR-10, FR-11
- **Background P4 ("durability")** → FR-6, NFR-3
- **Background P5 ("performance, maintainability")** → NFR-1, NFR-2, NFR-6, NFR-8, NFR-9
- **Background P6 ("out of scope")** → Product Scope: Out of scope for v1

---

**Next BMAD steps (suggested):**
1. Run **`bmad-validate-prd`** to lint this PRD against BMAD standards.
2. Resolve **TA-5 / R-1** with the stakeholder (persistence scoping).
3. Hand to **Sally (UX)** for `bmad-create-ux-design`.
4. Hand to **Winston (Architect)** for `bmad-create-architecture`.
5. Run **`bmad-create-epics-and-stories`** to break FR-1..FR-12 into shippable increments.
