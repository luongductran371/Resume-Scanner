# DOC/DOCX Upload Implementation Guide

## Phase 1: Infrastructure Setup - HOW TO Execute

### Step 1-2: Enable DOCX Support
**File**: `backend/src/middleware/uploadMiddleware.js`
```javascript
// Add to allowedTypes array:
"application/vnd.openxmlformats-officedocument.wordprocessingml.document"

// Add to allowedExtensions array:
".docx"

// Update error message:
"Only PDF, TXT, DOC, and DOCX files are allowed"
```

### Step 3: Robust Error Handling
**File**: `backend/src/app.js`
- Convert callback-based parsing to async/await
- Wrap parsing in try-catch blocks
- Return JSON error responses with details
- Add global error middleware for multer errors
- Always cleanup uploaded temp files

### Step 4: Fix Parser Null Handling
**File**: `backend/src/parsers/sectionParser.js`
```javascript
// Add null checks before string operations:
if (!lines || lines.length === 0) return section;
if (!title || typeof title !== 'string') return section;
```

## Phase 2: Testing & Validation - HOW TO Execute

### Step 5-6: Create Test Script
**Location**: `backend/tests/test/test_upload_doc.ps1`
- Mirror structure of existing PDF test
- Use manual multipart construction (consistent with original)
- Include same logging and validation patterns
- Default to localhost:3000 but allow endpoint override

### Step 7-8: Validation Testing
**Commands**:
```powershell
# Start server
cd backend && npm start

# Run test
.\backend\tests\test\test_upload_doc.ps1

# Check logs
Get-Content .\backend\tests\test\upload_doc_response.log
```

**Expected Success Indicators**:
- Status Code: 200
- Response contains: name, email, sections
- Node terminal shows: "Parsed Data: {...}"
- No error logs

### Step 9: Edge Case Testing
**Test Cases**:
```powershell
# Empty DOCX
# Corrupted file (rename .txt to .docx)
# Password-protected DOCX
# Very large DOCX (>10MB)
```

## Phase 3: Documentation - HOW TO Execute

### Step 11-14: Knowledge Capture
1. Update `docs/RULES.md` with checklist workflow
2. Create/update `checklist_Purpose.md` with WHY explanations
3. Create/update `checklist_Guide.md` with HOW-TO steps
4. Document verification methods for future issues

## Gap Analysis & Problem-Solving Approach

### When User-AI Approaches Differ:
1. **Identify the Gap**: What's the core disagreement?
2. **Analyze Trade-offs**: List pros/cons of each approach
3. **Test Both**: If feasible, implement both and compare results
4. **Document Decision**: Record why one approach was chosen
5. **Plan Rollback**: How to revert if chosen approach fails

### Common Gaps in This Project:
- **Manual vs Built-in Multipart**: Manual gives control, built-in is simpler
- **Detailed vs Simple Errors**: Detailed helps debugging, simple is cleaner
- **Strict vs Lenient Parsing**: Strict catches issues, lenient handles edge cases

## Verification Methods

### After Each Phase:
1. **Unit Test**: Does the individual component work?
2. **Integration Test**: Do components work together?
3. **End-to-End Test**: Does the full workflow succeed?
4. **Error Test**: Do failures fail gracefully?
5. **Performance Test**: Does it handle expected load?
