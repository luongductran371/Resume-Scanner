# Flutter Resume Parser Client

A simple Flutter app to upload a resume (PDF/DOC/DOCX) to your Resume Parser API and display the parsed fields.

## Requirements
- Flutter 3.x
- The API server running locally at `http://localhost:3000` with `/upload` endpoint

## Getting Started

```bash
# go to the app folder
cd frontend/flutter_resume_app

# fetch dependencies
flutter pub get

# run the app
flutter run
```

## App Structure
- `lib/main.dart`: App entry
- `lib/screens/home_screen.dart`: UI – pick file, upload, show results
- `lib/services/api_service.dart`: API client (multipart upload to `/upload`)
- `lib/models/parsed_resume.dart`: Models for parsed response
- `lib/utils/logger.dart`: Minimal logging helpers

## Notes
- The API call targets `http://localhost:3000/upload`. If you run on a device/emulator that cannot access host `localhost`, update `ApiService.baseUrl` to your machine IP (e.g. `http://192.168.x.x:3000`).
- Field name used in multipart is `resume` to match server-side `multer` config.

## Troubleshooting
- If uploads fail on a real device, ensure your device and server are on the same network and the firewall allows inbound connections on port 3000.
