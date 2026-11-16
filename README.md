# GPT-6 Cyber Lab

An original, responsive defensive-security workspace in the LOW repository. This project does **not** reproduce OpenAI model weights, proprietary training, or private systems. It provides a mobile-first Progressive Web App (PWA), a scoped defensive-review workflow, and an optional server-side model adapter.

## Included in this branch

- Responsive React + TypeScript interface for phones, tablets, and desktop browsers.
- Installable PWA manifest and basic offline app-shell cache.
- Spanish dashboard for authorized defensive reviews.
- Review categories: configuration, code, dependency/supply-chain, and hardening plans.
- Server-side model adapter using the OpenAI Responses API.
- Local demonstration mode when no provider credential is configured.
- Authorization confirmation, Zod input validation, request size limit, rate limiting, Helmet, and server-only API credentials.

## Requirements

- Node.js 20+
- npm
- An API credential for an organization approved to use the configured model, if live AI analysis is required.

## Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

Open the Vite URL printed in the terminal (normally http://localhost:5173). The frontend proxies `/api` to the Express server on port 3001.

To enable live model responses, set `OPENAI_API_KEY` in the server-side `.env` file and set `OPENAI_MODEL` to a model your organization is authorized to use. The default is `gpt-6-cyber`; access is restricted by OpenAI and is not guaranteed for every API account. Never place keys in frontend code or browser storage.

## Production

```bash
npm run build
NODE_ENV=production npm start
```

The Express server serves the built frontend and API from the same origin. Configure `APP_ORIGIN`, `PORT`, and secrets in the hosting provider's environment settings.

## Security boundary

This initial version is deliberately limited to analysis of user-provided, sanitized text. It does not scan hosts, connect to targets, execute shell commands, generate operational exploit payloads, or modify systems. A checkbox is not proof of ownership; keep reviews limited to assets you own or are explicitly authorized to assess. Human review is required before applying recommendations.

Do not paste secrets, access tokens, private personal data, or production credentials into the form. Demo mode produces a static checklist, not a genuine security assessment.

## Current status

This is an initial scaffold and should be typechecked, built, reviewed, and deployed to staging before production use. Work is isolated in branch `feature/gpt-6-cyber-lab`.
