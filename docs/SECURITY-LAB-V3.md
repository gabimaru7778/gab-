# LOW / GPT-6 Cyber Lab V3 — Defensive Security Lab

Status: architecture and acceptance criteria (not yet runtime-integrated).

This repository is LOW. The V3 work is deliberately isolated on branch `security-lab-v3`; it does not alter production or claim that device capabilities are already running.

## Scope and safety model

All testing is limited to devices, accounts, networks and data explicitly enrolled by their owner. No covert access, credential harvesting, persistence on third-party devices, stealth camera/microphone activation, anti-forensics, attribution evasion, or autonomous propagation.

## Modules

1. **Camera Lab** — capture/stream from an enrolled test device only after an OS permission prompt and a visible recording indicator. Stop/revoke must immediately terminate capture.
2. **Audio Lab** — same consent and visible-state requirements; no background or silent recording.
3. **Wi-Fi Decoy Lab** — isolated lab AP and clearly labeled captive-portal simulation using synthetic credentials/events. Never collect real Wi-Fi passwords or impersonate a third-party network.
4. **Device Radar** — passive inventory of explicitly scoped lab subnets; display only metadata needed for inventory. No exploitation or arbitrary probing outside the allowlist.
5. **Attack Simulator** — deterministic tabletop/sandbox scenarios for unauthorized enrollment, suspicious discovery, attempted data access and simulated exfiltration. Use synthetic data and fixtures.
6. **Emergency isolation** — revoke lab sessions/tokens, stop capture/jobs, quarantine the lab network and delete ephemeral test artifacts. Preserve tamper-evident security/audit events and backups; do not erase evidence or destroy host devices.
7. **Location simulation** — virtual location profiles in test fixtures only; never falsify real device/network location or conceal real source attribution.
8. **Learning and updates** — ingest trusted advisories and signed releases as proposals; pin versions, verify signatures/checksums, scan dependencies, run tests in CI, and require human approval before merge/deploy. No execution of unreviewed code fetched from the Internet.

## Required controls

- Device enrollment bound to a named owner, device identity and expiring credential.
- Least-privilege scopes: inventory, camera, microphone and lab-network access are separate grants.
- Explicit consent prompt for every sensitive sensor session; visible active indicator and persistent stop control.
- Short-lived tokens, rotation/revocation, rate limits and replay protection.
- Server-side secrets only; never commit credentials, tokens, user data or private keys.
- Append-only audit trail with request ID, actor, enrolled device, scope, timestamp and outcome. Redact secrets and sensitive payloads.
- Lab network isolation; deny-by-default egress; allowlisted targets.
- Signed builds/releases, dependency lockfile, SBOM and rollback procedure.

## Acceptance tests (must be implemented and run before marking a module functional)

- Unenrolled device is denied; expired/revoked token is denied.
- Camera/microphone permission denial causes a safe failure; no sensor starts without explicit OS permission and visible state.
- Stop/revoke terminates active capture and invalidates the session.
- Decoy portal accepts only synthetic test fixtures and never stores submitted real credentials.
- Device Radar refuses targets outside the configured lab CIDR allowlist.
- Attack Simulator uses fixtures only and cannot open sockets to external targets.
- Emergency isolation stops jobs, revokes sessions and quarantines lab traffic while preserving audit records.
- Location simulation changes fixture output only and does not alter network routing or device geolocation.
- Update pipeline rejects unsigned/unpinned artifacts and blocks deployment when tests fail.
- CI runs typecheck, lint, unit/integration tests, secret scanning and dependency vulnerability scanning.

## Implementation status

Every module remains **planned** until its runtime code, permissions, automated tests and a successful staging run are present. Documentation alone is not implementation. Do not report a green check without recorded test output.
