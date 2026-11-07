# LOW migration roadmap

## Stage 0 — source preservation
- [x] Initialize the private GitHub repository with architecture and migration principles.
- [ ] Import the exact deployed source snapshot from AppDeploy.
- [ ] Compare imported files against the deployed snapshot and record its version.
- [ ] Confirm no secrets, user data, generated tokens or deployment credentials enter Git.

## Stage 1 — reproducible engineering
- [ ] Add lockfile and reproducible install/build scripts.
- [ ] Add typecheck, lint and unit-test commands.
- [ ] Add API contract tests for guest chat, media jobs, vault, API keys and security review.
- [ ] Add CI checks for pull requests.

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
