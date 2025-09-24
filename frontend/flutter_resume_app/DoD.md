# Definition of Done (DoD)

A test run is considered DONE when the following are true:

- [ ] The API server is running and reachable (default: http://localhost:3000).
- [ ] A PDF or DOC/DOCX file can be selected via the file picker.
- [ ] Upload completes without error (2xx status code).
- [ ] The app renders the following parsed fields without crashing:
  - Name
  - Email
  - Phone
  - LinkedIn
  - Location
  - Sections (at least one section item)
- [ ] If a field is not present in the resume, the UI shows a clear placeholder (e.g., "—") without exceptions.
- [ ] On network/server error, the UI shows an error banner and allows retry without restarting the app.
- [ ] All checklist items in `checklist.md` pass on at least one PDF and one DOCX sample.
