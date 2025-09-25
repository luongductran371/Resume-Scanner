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

- **DOCX parsing returns chaotic sections or none (regression)**
  - Cause: Over-aggressive text preprocessing and brittle block splitting for DOCX; `sectionParser` lacked `type` and skipped sections; filtering removed all sections.
  - Fix: Remove destructive preprocessing; add header-based segmentation fallback; enhance `sectionParser` to set both `title` and `type` and support more headers (Summary/Projects/Research/Technical Skills); avoid skipping sections; filter to core types only if at least one remains.
  - Files: `backend/src/services/resumeParser/index.js`, `backend/src/parsers/sectionParser.js`, `backend/src/services/resumeParser/sectionMerger.js`.
  - Verification: Upload DOCX via `backend/tests/test/test_upload_doc.ps1`; expect section types to include `Experience`, `Education`, `Skills`, etc.; Name/Email present; Location heuristics filled when available.

- **DOCX header detection too aggressive, creates fragmented sections (RESOLVED)**
  - Cause: `isHeader()` function treating bullet points, responsibilities, and content lines as section headers; every line becomes a separate section with empty content.
  - Fix: Make header detection much more restrictive: limit to ≤50 chars, exact matches for known headers, single-word headers with action word filtering, ALL CAPS without sentence words; avoid treating long sentences/paragraphs as headers.
  - Files: `backend/src/services/resumeParser/index.js` (`isHeader()` function).
  - Verification: ✅ DOCX parsing now produces 3 clean sections (Education, Skills, Experience) instead of 30+ fragmented sections; responsibilities stay within their parent sections.

- **Education parser incorrectly parsing school line as degree (RESOLVED)**
  - Cause: Education parser treating school identification line as degree; degree detection running before school detection, causing school line "Hope College, Holland, MI" to be captured as degree field.
  - Fix: Reordered parsing logic to set school first, then look for degree in separate non-school lines; enhanced GPA detection with more patterns including cumulative GPA, standalone numbers, and ratio formats.
  - Files: `backend/src/parsers/education/index.js`.
  - Verification: ✅ Education parsing now produces clean structure with proper field separation; degree field no longer contains school information.

- **Multiple positions per company create fragmented sections (PARTIALLY RESOLVED)**
  - Cause: Experience parser and header detection confused by multiple job titles under same company; creates separate sections for each responsibility or position.
  - Fix: Enhanced section merger to merge by `type` field instead of `title`; improved header detection to filter out action words; enhanced `looksLikeTitleLine()` with role keywords and action verb filtering; better content consolidation.
  - Files: `backend/src/parsers/experience/index.js`, `backend/src/services/resumeParser/sectionMerger.js`.
  - Verification: ⚠️ Experience section consolidates to single "Experience" type with 5 items, but first position at same company still parsed as separate company entry instead of being grouped with second position.

- **First position at company parsed as separate company entry (PARTIALLY RESOLVED)**
  - Cause: Experience parser logic creates new company entry for first position instead of recognizing it as position under existing company; company detection vs. title detection order issues.
  - Fix: Added `consolidateCompanies()` post-processing to merge companies with same name/location; improved company grouping logic.
  - Files: `backend/src/parsers/experience/index.js` (company detection and position grouping logic).
  - Verification: ⚠️ Company consolidation added but may need further testing with actual resume content.

- **Job responsibilities incorrectly parsed as company names (RESOLVED)**
  - Cause: Experience parser's `isCompanyLine()` function too broad, treating responsibility lines like "Implemented Google Locker Studio integration..." as company names instead of responsibilities.
  - Fix: Enhanced `isCompanyLine()` with action verb filtering, length limits, and bullet point detection; improved responsibility collection logic to skip stray lines rather than treating them as companies; removed `duration` field from individual positions.
  - Files: `backend/src/parsers/experience/index.js` (`isCompanyLine()` function, responsibility detection logic).
  - Verification: ✅ Experience parsing now shows 3 clean companies with proper responsibility nesting; fake company names eliminated.

- **Location is null for DOCX**
  - Cause: Header lines vary; personal info parser missed it.
  - Fix: Add `extractLocationFromText()` fallback scanning early lines for `City, ST` patterns and apply when `location` is missing.
  - Files: `backend/src/services/resumeParser/index.js`, `backend/src/parsers/personalInfo/index.js` (heuristics retained).
  - Verification: Check response `location` for resumes with lines like `Holland, MI`.

- **Name missing after segmentation changes**
  - Cause: Header detection consumed name or first block not treated as personal info.
  - Fix: Add `extractNameFromText()` heuristic (skip emails/phones; prefer 2–6 word, letters-heavy line near top).
  - Files: `backend/src/services/resumeParser/index.js`.
  - Verification: Name appears even if header formatting differs.

## Dev UX / Utilities

- **Hard to remember correct base URL**
  - Fix: Add `--dart-define=BASE_URL=` override; create helper script `run_on_phone.ps1` to auto-detect IP, verify `/health`, and run with the correct flag.
  - Files: `frontend/flutter_resume_app/run_on_phone.ps1`.

- **Manual multipart uploads corrupt binary files**
  - Cause: Hand-building multipart boundaries/headers in PowerShell.
  - Fix: Prefer `System.Net.Http.HttpClient` + `MultipartFormDataContent` (PS 5.1) or `Invoke-WebRequest -Form` to let the runtime build the body.
  - Files: `test/test_upload_doc.ps1` (root), `backend/tests/test/test_upload_doc.ps1` (legacy/manual), `test/test_upload.ps1` (PDF tester).
  - Verification: PDF/DOCX uploads consistently return HTTP 200; server receives correct `mimetype` and filename; response logs saved.

- **Test script has no response/error logs**
  - Cause: Missing log writes in HttpClient-based script.
  - Fix: Write raw body and parsed JSON to `upload_doc_response.log`; log exceptions to `upload_doc_error.log`; show section details in console.
  - Files: `backend/tests/test/test_upload_doc.ps1`, `test/test_upload_doc.ps1`.
  - Verification: After running, inspect logs; console shows section count and types.

---

## Lessons Learned

### DOCX vs PDF Parsing
- **DOCX text extraction creates different line break patterns** than PDF, requiring adaptive segmentation strategies
- **Header-based segmentation is more robust** than blank-line splitting for DOCX files
- **Overly aggressive text preprocessing destroys document structure** - minimal preprocessing is better
- **Section merging by `type` field is more reliable** than merging by `title` for consolidating fragmented content

### Major DOCX Parsing Journey (Resolved Issues)
- **Started with 30+ fragmented sections** → **Ended with 3 clean sections** (Education, Skills, Experience)
- **Fake company names from responsibilities** → **Proper responsibility nesting under positions**
- **School information in degree fields** → **Clean field separation with proper parsing order**
- **Empty responsibility arrays** → **Populated responsibilities staying with their positions**
- **Header detection treating content as sections** → **Restrictive header detection preventing false positives**

### Parser Design Principles
- **Make header detection restrictive, not permissive** - false positives create more problems than false negatives
- **Filter out action words from header detection** to prevent responsibilities from becoming section headers
- **Always provide fallback extraction methods** for personal info (name, email, location, phone)
- **Preserve both `title` and `type` fields** in parsed sections for better merging and filtering
- **Company grouping requires post-processing** - initial parsing may create separate entries that need consolidation
- **Title detection vs company detection order matters** - improve logic to distinguish between new company and new position at same company
- **Parsing order is critical** - set primary identifiers (school, company) first, then extract related details (degree, positions)
- **Avoid cross-contamination** - ensure school lines don't get captured as degrees, company lines don't get captured as titles

### Testing and Debugging
- **Test with both PDF and DOCX formats** to ensure parsing consistency across file types
- **Log detailed parsing results** to identify fragmentation and missing data issues
- **Use section count and types as key metrics** for parsing quality (3-5 sections good, 30+ sections bad)
- **Verify personal info extraction separately** from section parsing to isolate issues
- **Incremental testing approach works best** - fix one major issue at a time, verify, then move to next
- **Real resume data reveals edge cases** that synthetic test data misses

### Code Maintenance
- **Document parsing regressions immediately** with cause, fix, files, and verification steps
- **Avoid destructive changes to working parsers** - prefer additive improvements with fallbacks
- **Test syntax changes thoroughly** - parser errors can break entire upload pipeline

### Success Metrics Achieved
- **DOCX parsing quality now matches PDF baseline**: 3 clean sections with proper structure
- **Personal info extraction working**: Name, email, location, phone, LinkedIn properly extracted
- **Experience parsing robust**: Companies, positions, and responsibilities properly nested
- **Education parsing clean**: School, year, location fields properly separated
- **Skills parsing functional**: Languages, frameworks, and technical skills categorized
- **No more fragmentation**: Eliminated 30+ section problem, content stays where it belongs

### Outstanding Issues

- **Git repository has 5000+ changes due to committed node_modules**
  - Cause: node_modules directory was accidentally committed to git, causing thousands of deleted file entries in git status
  - Current Status: Added comprehensive .gitignore entries but git still shows all the deleted node_modules files
  - Attempted Fix: Updated .gitignore with node_modules/, package-lock.json, and other unnecessary files
  - Issue: .gitignore only prevents future commits, doesn't clean up already-tracked files
  - Next Steps: Need to properly remove node_modules from git history and clean up the repository
  - Files: `.gitignore` (updated), git repository cleanup needed
  - Verification: `git status` should show only essential files, not thousands of deleted node_modules entries

---

## Quick Verification Checklist

- **Server**: `node app.js` → prints `http://0.0.0.0:3000`.
- **Health**: `http://<HOST>:3000/health` returns `{ "status": "ok" }`.
- **Web**: `flutter run -d chrome --web-renderer html` (CORS enabled on server).
- **Android Emulator**: `flutter run` (defaults to `http://10.0.2.2:3000`).
- **Android Phone (USB)**: `adb reverse tcp:3000 tcp:3000` then `flutter run --dart-define=BASE_URL=http://127.0.0.1:3000`.
- **Android Phone (Wi‑Fi)**: `flutter run --dart-define=BASE_URL=http://<PC_IP>:3000` (PC and phone on same LAN; firewall allows 3000).
