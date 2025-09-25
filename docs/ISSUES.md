# Project Issue Log

This document summarizes the key issues encountered during development and how each was resolved. It is intended to help future contributors quickly diagnose similar problems.

## Frontend (Flutter)

- **Web file picker throws: "On web path is unavailable"**
  - Cause: Accessing `PlatformFile.path` on Web. On Web, only `bytes` is available.
  - Fix: In `lib/screens/home_screen.dart`, store `PlatformFile` and use `FilePicker.platform.pickFiles(withData: kIsWeb)`. Display `PlatformFile.name`. In upload, use `bytes` on Web.
  - Files: `frontend/flutter_resume_app/lib/screens/home_screen.dart`, `frontend/flutter_resume_app/lib/services/api_service.dart`

- **Web upload fails: `Failed to fetch` (CORS)**
  - Cause: Flutter web origin differs from API origin.
  - Fix: Add `cors()` and preflight handling to backend.
  - Files: `app.js` (added `app.use(cors())`, `app.options('*', cors())`).

- **Android (physical device) cannot reach `http://localhost:3000`**
  - Cause: On device, `localhost` points to the phone, not the PC.
  - Fix: Make API base URL platform-aware and overrideable via `--dart-define=BASE_URL=...`.
  - Files: `frontend/flutter_resume_app/lib/services/api_service.dart` (added `String.fromEnvironment('BASE_URL')`, defaults to `10.0.2.2` on Android, `localhost` elsewhere).

- **Android upload "hangs"**
  - Cause: Unreachable server or no error returned from backend.
  - Fix: Add `GET /health` probe and 30s timeouts in `ApiService`; ensure backend returns 500 on parse errors.
  - Files: `app.js` (added `/health`, fixed DOC/DOCX error path), `lib/services/api_service.dart` (health check + timeouts).

- **Build error: `Undefined name 'Platform'`**
  - Cause: Using `Platform` without import or wrong alias.
  - Fix: Use `io.Platform` with `import 'dart:io' as io;`.
  - Files: `frontend/flutter_resume_app/lib/services/api_service.dart`.

- **Emulator fails to start (code -1073740940)**
  - Cause: Graphics backend/virtualization on Windows (Intel UHD Graphics + ANGLE/OpenGL).
  - Fix: Set AVD Graphics to ANGLE/Software, OpenGL ES 2.0, perform Cold Boot and Wipe Data; optionally force `swiftshader_indirect` in AVD `config.ini`; ensure Windows Hypervisor Platform enabled and x86_64 image used.

## Backend (Node)

- **Requests hang on DOC/DOCX parsing errors**
  - Cause: Missing error response in `.catch()`.
  - Fix: Return `res.status(500).send("Failed to parse resume.")` on errors.
  - Files: `app.js`.

- **Physical device cannot connect to API**
  - Cause: Server binds to `localhost` only.
  - Fix: Listen on all interfaces with `app.listen(port, '0.0.0.0', ...)` and open Windows Firewall TCP 3000.
  - Files: `app.js`.

## Dev UX / Utilities

- **Hard to remember correct base URL**
  - Fix: Add `--dart-define=BASE_URL=` override; create helper script `run_on_phone.ps1` to auto-detect IP, verify `/health`, and run with the correct flag.
  - Files: `frontend/flutter_resume_app/run_on_phone.ps1`.

---

## Quick Verification Checklist

- **Server**: `node app.js` → prints `http://0.0.0.0:3000`.
- **Health**: `http://<HOST>:3000/health` returns `{ "status": "ok" }`.
- **Web**: `flutter run -d chrome --web-renderer html` (CORS enabled on server).
- **Android Emulator**: `flutter run` (defaults to `http://10.0.2.2:3000`).
- **Android Phone (USB)**: `adb reverse tcp:3000 tcp:3000` then `flutter run --dart-define=BASE_URL=http://127.0.0.1:3000`.
- **Android Phone (Wi‑Fi)**: `flutter run --dart-define=BASE_URL=http://<PC_IP>:3000` (PC and phone on same LAN; firewall allows 3000).
