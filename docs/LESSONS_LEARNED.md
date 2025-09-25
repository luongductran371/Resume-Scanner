# Lessons Learned and Best Practices

This document captures key lessons from building and debugging the Resume Scanner across Flutter (web/mobile) and Node.

## API Base URL & Platforms

- **Localhost is device-scoped.** On physical Android, `localhost` means the phone, not the PC. For the emulator, the host PC is `10.0.2.2`.
- **Make the base URL configurable.** Read `BASE_URL` via `String.fromEnvironment` in `lib/services/api_service.dart`. Fall back to sane defaults per platform.
- **Prefer ADB reverse for phones during dev.** Use `adb reverse tcp:3000 tcp:3000` and run the app with `BASE_URL=http://127.0.0.1:3000` for a no-network-hassle workflow.
- **Tunnels for LTE.** If the phone is on LTE, use ngrok/Cloudflare Tunnel and set `BASE_URL` to the public HTTPS URL.

## Flutter File Upload (Web vs Mobile)

- **Web:** `PlatformFile.path` is null. Use `withData: kIsWeb` and upload via `bytes`. Display `PlatformFile.name`.
- **Mobile/Desktop:** Use `http.MultipartFile.fromPath` for efficiency and avoid large memory spikes.

## Robust Networking

- **Add a health endpoint.** Implement `GET /health` in `app.js` and probe it client-side before upload. Fail fast with helpful errors.
- **Use timeouts.** Apply request/response timeouts in the Flutter client to avoid infinite spinners.
- **CORS for web.** Enable `cors()` in Express and handle preflight.
- **Listen on all interfaces.** Bind to `0.0.0.0` on the server and allow firewall TCP 3000.

## Backend Reliability

- **Always respond on error.** Ensure `.catch()` returns a 4xx/5xx so clients don’t hang.
- **Log structured data.** Log parsed output and errors with context.

## UI/UX Rendering

- **Graceful fallbacks.** Show `—` for missing data; don’t crash.
- **Heuristic rendering.** Map sections by title keyword (skills/experience/education) and render appropriately (chips/cards/bullets).
- **Clickable links.** Use `url_launcher` for Email/LinkedIn.

## Emulator Stability (Windows)

- **Graphics backend.** Set AVD Graphics to ANGLE/Software; OpenGL ES 2.0; cold boot and wipe data.
- **AVD config fallback.** Force `swiftshader_indirect` in `~/.android/avd/<AVD>.avd/config.ini` if needed.
- **Hypervisor & images.** Enable Windows Hypervisor Platform; use x86_64 images with Google APIs; update GPU drivers.

## Run Recipes

- **Web (Chrome):**
  - `flutter run -d chrome --web-renderer html`
  - API: `http://localhost:3000`

- **Android Emulator:**
  - `flutter run` (defaults to `http://10.0.2.2:3000`)

- **Android Phone (USB, simplest):**
  - `adb reverse tcp:3000 tcp:3000`
  - `flutter run -d "Pixel 7 Pro" --dart-define=BASE_URL=http://127.0.0.1:3000`

- **Android Phone (Wi‑Fi):**
  - `flutter run -d "Pixel 7 Pro" --dart-define=BASE_URL=http://<PC_IP>:3000`

- **Android Phone (LTE):**
  - `ngrok http 3000`
  - `flutter run -d "Pixel 7 Pro" --dart-define=BASE_URL=https://<ngrok-id>.ngrok.io`

## Future Improvements

- **In-app API Settings screen** using SharedPreferences to persist base URL and a toggle for "Use ADB reverse (localhost)" to eliminate `--dart-define`.
- **Add integration tests** that mock the upload endpoint for consistent CI checks.
- **Auto-detect network** and suggest the appropriate base URL at startup (emulator vs device).
