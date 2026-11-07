# LOW

LOW is a modular personal AI workspace. This repository is the source-control home for the LOW application and its planned migration away from a single hosting runtime.

## Current migration baseline

The existing deployed application is a React + TypeScript frontend with an AppDeploy TypeScript backend. The first migration stage preserves existing behavior and documents runtime dependencies before changing providers or infrastructure.

## Architecture direction

- CORE: model routing, orchestration, policy and response composition
- MEMORY: user-controlled encrypted memory and retrieval
- RESEARCH: source-grounded research and retrieval
- DEVELOPER: code analysis, patch proposals and test execution
- CREATOR: image and video provider adapters
- VOICE: speech input/output adapters
- WORK: bounded agents and durable task execution
- CONNECT: external APIs and tool adapters
- CLOUD: storage, jobs and deployment adapters
- SHIELD: defensive security review and audit logging
- LEARNING: evaluation, regression tests and improvement proposals

## Safety and engineering principles

1. Provider credentials are server-side secrets and must never be committed.
2. Agents propose changes in isolated branches; tests and human approval gate production deployment.
3. Security testing is limited to owned systems, explicit authorization, and safe passive review or controlled labs.
4. Model providers are adapters, not hard-coded assumptions.
5. Every capability must be marked as implemented, experimental, or planned.

## Migration stages

1. Import and verify the existing application source.
2. Add reproducible build, typecheck and regression tests.
3. Separate provider adapters and configuration.
4. Add controlled agent workflows and observability.
5. Deploy a staging environment before production cutover.

See `docs/ROADMAP.md` for the staged plan.
