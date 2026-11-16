# LOW — Personal Intelligence

LOW is a modular personal AI workspace, not a login-page project or a single-purpose chatbot. This repository now starts with the LOW operating interface: control center, assistant shell, local network/API diagnostics, local JSON/CSV validation, and clear connection states for integrations.

## Current foundation

- Spanish-first responsive interface with obsidian/violet visual identity and LOW holographic core.
- Navigation for LOW CORE, agents, GitHub Developer, network, data validation, creator and settings.
- Local network check measures browser connectivity and the LOW API health endpoint only.
- JSON validation (syntax + required keys) and strict CSV structure validation run in the browser; input is not uploaded.\n- Academy Lab includes an offline SQL-authentication teaching simulation with fictional accounts; it does not execute SQL or contact external systems.
- Backend health endpoint reports service state and whether a provider credential exists without exposing it.
- Helmet, rate limiting, request-size limits, same-origin deployment and server-side secrets.
- No login page in this foundation and no false claim that external providers are connected.

## Run

- Node.js 22+
- `npm install`
- `npm run dev`

The frontend runs on Vite and proxies `/api` to Express on port 3001. The server uses an exact origin allowlist (`APP_ORIGINS`); native Capacitor Android uses `https://localhost` with the configured `androidScheme`, while a deployed PWA origin must be added explicitly.

## Configuration

Provider credentials belong in the hosting environment, never in the browser or repository. No live model adapter is connected in this foundation. For Android, set the repository Actions variable `LOW_API_URL` to the public HTTPS origin of the deployed LOW API before building; without it the APK can open its local interface but cannot reach a remote API.

## Roadmap modules

LOW CORE, ROUTER, MEMORY, RESEARCH, DEVELOPER, AGENTS, CREATOR, VOICE, WORK, CONNECT, CLOUD, SHIELD, CONTROL, NETWORK, DATA, MULTIDEVICE and ANDROID.

## Honest capability status

- Implemented: responsive shell, navigation, local JSON/CSV validation, browser online state, LOW API health check.
- Not connected: live AI providers, GitHub App/OAuth inside LOW, agent runtime, persistent cloud jobs, private memory sync, voice, media generation and native device pairing.
- Android: a debug APK artifact was built by GitHub Actions. It is a test build, not a signed release; install and hardware compatibility have not been tested here.
- Planned: Capacitor Android project and CI APK artifact after the mobile build configuration is verified.

This is a foundation build, not a production-ready release. Run CI and test the deployment on actual target devices before treating integrations as operational.
