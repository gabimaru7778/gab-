# LOW migration roadmap

## Stage 0 — source preservation
- [x] Use the single public GitHub repository with architecture and migration principles.
- [ ] Import the exact deployed source snapshot from AppDeploy.
- [ ] Compare imported files against the deployed snapshot and record its version.
- [ ] Confirm no secrets, user data, generated tokens or deployment credentials enter Git.

## Stage 1 — reproducible engineering
- [ ] Add lockfile and reproducible install/build scripts.
- [ ] Add typecheck, lint and unit-test commands.
- [ ] Add API contract tests for guest chat, media jobs, vault, API keys and security review.
- [x] Add CI checks for pushes and pull requests.
- [x] Add daily scheduled CI and manual workflow dispatch.

## Stage 2 — backend modularization
- [ ] Extract routes into domain modules.
- [ ] Add typed provider interfaces and a model router.
- [ ] Add structured error codes, request IDs, timeouts and retry budgets.
- [ ] Add provider health checks and quota-aware fallback.

## Stage 3 — model and tool adapters
- [ ] Implement configurable model adapters (GLM and other providers only when credentials and API compatibility are verified).
- [ ] Add tool registry with schemas, permission scopes and audit events.
- [ ] Add retrieval and citation checks for research.
- [ ] Add safe code execution in isolated environments; never execute arbitrary code in the API process.

## Stage 4 — controlled agents
- [ ] Add planner, researcher, developer, tester, security reviewer and creator roles.
- [ ] Require branch isolation, tests, diff review and explicit approval before merge/deploy.
- [ ] Persist task state and support cancellation, budgets and deadlines.
- [ ] Keep scheduled jobs bounded and observable; no claim of unattended self-modifying production code.

## Stage 5 — privacy and security
- [ ] Threat-model authentication, session handling, vault encryption and API-key storage.
- [ ] Add rate limits, input validation, CSRF/origin protections where applicable, and audit logging.
- [ ] Keep security assessments passive or restricted to assets with explicit authorization.
- [ ] Add data export and deletion workflows.

## Stage 6 — staging and cutover
- [ ] Build a staging deployment from GitHub.
- [ ] Run regression, security and mobile usability checks.
- [ ] Verify backups, rollback and environment secrets.
- [ ] Switch production only after acceptance checks pass.

## Current known baseline
The recovered AppDeploy snapshot is version `1794036989678`. It contains a React/TypeScript UI, a TypeScript backend, a calculator tool, a client-side encrypted vault flow, an initial agent endpoint, Higgsfield media integration and a passive authorized security-review route. These are baseline observations, not a claim that every external provider or workflow is fully operational.


## GitHub-native progress (2026-11-16)
- [x] Create `low-github-native` integration branch from `main`.
- [x] Import the LOW React interface and remove its direct dependency on `@appdeploy/client`.
- [x] Add a first-party Node/Express API with SQLite, account sessions, chat/agent adapter, encrypted-vault persistence and defensive text review.
- [x] Add basic in-memory API rate limits and configurable production origin allowlist.
- [x] Add GitHub Actions CI; current verified run: typecheck, Vite build and tests succeeded before the rate-limit patch. A new run is checking the latest patch.
- [ ] Add a committed npm lockfile (CI currently uses `npm install`).
- [x] Add runtime API smoke tests for auth, vault persistence/isolation, API keys, SHIELD, Research and Creator provider readiness.
- [ ] Complete CSRF strategy, durable rate limiting, account verification/recovery, backups and audit events.
- [x] Add real web-search adapter (Tavily; requires `TAVILY_API_KEY`).
- [x] Add Higgsfield image/video job adapter (requires API key ID/secret and funded API balance).
- [x] Add browser voice dictation and speech playback (browser-dependent).
- [ ] Add isolated code execution, persistent cloud backups, scheduler-driven learning and Android app packaging.
- [ ] Build Android wrapper against a GitHub-hosted API; do not use the former AppDeploy URL.
- [ ] Create staging deployment from this repository and cut over only after acceptance tests.

### Current truth
The frontend UI is present. CORE/WORK/SHIELD/CONNECT/VOICE are partial; MEMORY persists client-encrypted records per account; RESEARCH and CREATOR have provider adapters but require secrets and live account verification. DEVELOPER sandbox, scheduled learning and Android packaging remain incomplete. No production deployment has been switched to this GitHub backend. AppDeploy is no longer the development target; it remains an old deployment and migration source only.


## Audit patches (2026-11-16 late)
- [x] Fix MEMORY list response field mismatch (`records`, not `items`).
- [x] Validate vault encryption metadata and cap registration password length.
- [x] Correct module readiness labels and remove the false daily-learning claim.
- [x] Protect paid Creator generation behind LOW authentication and per-IP rate limits.
- [x] Separate Creator submission and polling limits so polling is not blocked after a few checks.
- [x] Store opaque job-token digests and enforce token ownership on media status requests; expire jobs after 24 hours.
- [x] Add real Research and Higgsfield adapters with explicit missing-credential errors.
- [ ] Add persistent rate limiting, audit events, account recovery, backups and production deployment.
- [ ] Generate and commit `package-lock.json`.
- [ ] Build Android only after a production HTTPS API URL and cross-origin/mobile session strategy exist.
