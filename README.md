# LOW — Personal Intelligence

LOW is a modular personal AI workspace, not a login-page project or a single-purpose chatbot. This repository now starts with the LOW operating interface: control center, assistant shell, local network/API diagnostics, local JSON/CSV validation, and clear connection states for integrations.

## Current foundation

- Spanish-first responsive interface with obsidian/violet visual identity and LOW holographic core.
- Navigation for LOW CORE, agents, GitHub Developer, network, data validation, creator and settings.
- Local network check measures browser connectivity and the LOW API health endpoint only.
- JSON validation (syntax + required keys) and strict CSV structure validation run in the browser; input is not uploaded.\n- Academy Lab includes offline SQL-authentication and Wi-Fi network simulations with fictional accounts/devices; neither executes SQL, creates an access point, scans, captures traffic or contacts external systems.
- Network Lab presents a step-by-step execution trace, fictional topology, synthetic events, defensive detection of simulated stealth behavior, and an audit trail preserved when the ephemeral lab state is cleared.
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
- Android: Capacitor debug APK is produced by CI; it remains a test build and requires hardware QA and release signing.
- Academy Network Lab: local-only simulation and transparent step trace implemented; real network discovery, remote device observation and native pairing are not implemented.

This is a foundation build, not a production-ready release. Run CI and test the deployment on actual target devices before treating integrations as operational.
