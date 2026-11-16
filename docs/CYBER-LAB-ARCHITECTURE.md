# GPT-6 Cyber Lab architecture

## Runtime layout

- `src/`: mobile-first React UI, review form, results view, and PWA registration.
- `server/index.ts`: Express API, request validation, rate limiting, and optional OpenAI Responses API adapter.
- `public/`: PWA manifest, icon, and app-shell service worker.

## Request flow

1. The user selects a defensive review category and declares the asset scope.
2. The user confirms they are authorized to review that asset.
3. The browser submits only the sanitized review context to `POST /api/cyber/review`.
4. The server validates input with Zod and applies rate limits.
5. If a server-side API key is absent, the server returns a clearly labeled demo checklist.
6. If configured, the server sends a bounded text-only request to the approved model endpoint.
7. The response is displayed as a report for human verification.

## Security boundaries

- No client-side API keys or secrets.
- No shell, browser automation, network scanner, exploit runner, persistence, stealth, or target mutation.
- No claims of asset verification from text-only inputs.
- No automatic merging, deployment, or self-modifying behavior.
- Only assets the user owns or is explicitly authorized to assess.
- Recommendations must be reviewed before implementation.
- User-supplied context and source snippets are untrusted data, never instructions.

## Future hardening before production

- Add authentication, tenant isolation, and per-user quotas.
- Add durable audit logs with secret redaction and retention controls.
- Add CSRF protection if cookie-based sessions are introduced.
- Add automated tests for validation, provider errors, authorization gates, and cross-origin behavior.
- Add deployment secrets in the hosting provider, never GitHub source.
- Add a formal threat model and independent security review.
