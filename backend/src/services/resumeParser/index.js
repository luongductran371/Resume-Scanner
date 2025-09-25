const { sectionParser, personalInfoParser } = require('../../parsers');
const mergeSection = require('./sectionMerger');

// Strict header detection - only actual section headers, not content lines
function isHeader(line) {
  if (!line) return false;
  const s = line.trim();
  if (s.length === 0) return false;
  const lower = s.toLowerCase();
  
  // Must be short enough to be a header (not a long sentence/paragraph)
  if (s.length > 50) return false;
  
  // Exact matches for known section headers
  const exactHeaders = [
    'projects experience', 'research experience', 'work experience',
    'professional experience', 'education', 'technical skills',
    'skills', 'summary', 'objective', 'certifications', 'relevant coursework'
  ];
  if (exactHeaders.some(h => lower === h)) return true;
  
  // Single word headers that are common (but not if they contain action words)
  const singleWordHeaders = ['education', 'skills', 'experience', 'projects', 'summary', 'objective', 'certifications'];
  if (singleWordHeaders.includes(lower)) {
    // Additional check: make sure it's not part of a sentence
    const actionWords = ['led', 'developed', 'implemented', 'created', 'managed', 'designed', 'collaborated', 'streamlined', 'conducted', 'devised', 'ensured', 'initiated', 'contributed', 'parsed'];
    const hasActionWords = actionWords.some(word => lower.includes(word));
    if (!hasActionWords) return true;
  }
  
  // ALL CAPS headers (but not long sentences or action-based content)
  if (s.length <= 25) { // Even shorter limit
    const letters = s.replace(/[^A-Za-z\s]/g, '');
    if (letters.length > 0) {
      const upper = letters.replace(/[^A-Z\s]/g, '').length;
      if (upper / letters.length >= 0.95) { // Higher threshold
        // Additional check: must not contain common sentence words or action verbs
        const forbiddenWords = ['the', 'and', 'or', 'to', 'for', 'with', 'by', 'in', 'on', 'at', 'from', 'led', 'developed', 'implemented', 'created', 'managed', 'designed', 'collaborated', 'streamlined', 'conducted', 'devised', 'ensured', 'initiated', 'contributed', 'parsed', 'analyzed', 'built', 'established'];
        const words = lower.split(/\s+/);
        const hasForbiddenWords = words.some(w => forbiddenWords.includes(w));
        if (!hasForbiddenWords) return true;
      }
    }
  }
  
  return false;
}

function segmentByHeaders(text) {
  if (!text) return { personalLines: [], sections: [] };
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const sections = [];
  let current = [];
  let seenHeader = false;
  const personalLines = [];

  for (const ln of lines) {
    if (isHeader(ln)) {
      if (!seenHeader) {
        // Everything accumulated before first header is personal info
        personalLines.push(...current);
        current = [ln];
        seenHeader = true;
      } else {
        if (current.length) sections.push(current);
        current = [ln];
      }
    } else {
      current.push(ln);
    }
  }
  if (current.length) sections.push(current);
  return { personalLines, sections };
}

function resumeParser(data) {
  const resultData = {
    name: null,
    location: null,
    phone: null,
    email: null,
    linkedin: null,
    sections: [],
  };

  // For DOCX, use header-based segmentation since blank lines may not exist
  // For PDF, fall back to block-based if header segmentation fails
  const seg = segmentByHeaders(data);
  
  // Personal info from header area (everything before first section header)
  if (seg.personalLines && seg.personalLines.length > 0) {
    const personalInfo = personalInfoParser(seg.personalLines);
    Object.assign(resultData, personalInfo);
  }

  // Parse sections
  seg.sections.forEach((lines) => {
    const parsedSection = sectionParser(lines);
    if (parsedSection) resultData.sections.push(parsedSection);
  });

  // If header-based segmentation found no sections, fall back to block-based
  if (resultData.sections.length === 0) {
    const blocks = data.split(/\r?\n\s*\r?\n/);
    blocks.forEach((section, i) => {
      const lines = section
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      if (i === 0 && (!resultData.name || !resultData.email)) {
        // Only override personal info if we didn't get it from header segmentation
        const personalInfo = personalInfoParser(lines);
        resultData.name = resultData.name || personalInfo.name;
        resultData.email = resultData.email || personalInfo.email;
        resultData.phone = resultData.phone || personalInfo.phone;
        resultData.location = resultData.location || personalInfo.location;
        resultData.linkedin = resultData.linkedin || personalInfo.linkedin;
      } else if (i > 0) {
        const parsedSection = sectionParser(lines);
        if (parsedSection) resultData.sections.push(parsedSection);
      }
    });
  }

  resultData.sections = mergeSection(resultData.sections);

  // Keep only the core section types to mimic the PDF output baseline, but
  // if filtering removes everything, keep the unfiltered sections.
  const allowedTypes = new Set(["Skills", "Experience", "Education", "Summary", "Projects", "Certifications", "Research"]);
  const filtered = resultData.sections.filter(s => s && s.type && allowedTypes.has(s.type));
  if (filtered.length > 0) {
    resultData.sections = filtered;
  }

  // Fallback: if no phone was detected in header, try scanning the whole text
  if (!resultData.phone) {
    const globalPhone = extractPhoneFromText(data);
    if (globalPhone) {
      resultData.phone = globalPhone;
    }
  }

  // Fallback: extract email from entire text if still missing
  if (!resultData.email) {
    const globalEmail = extractEmailFromText(data);
    if (globalEmail) {
      resultData.email = globalEmail;
    }
  }

  // Fallback: extract a plausible location from the entire text
  if (!resultData.location) {
    const globalLocation = extractLocationFromText(data);
    if (globalLocation) {
      resultData.location = globalLocation;
    }
  }

  // Fallback: extract LinkedIn from entire text if still missing
  if (!resultData.linkedin) {
    const globalLinkedIn = extractLinkedInFromText(data);
    if (globalLinkedIn) {
      resultData.linkedin = globalLinkedIn;
    }
  }

  // Fallback: extract a reasonable name if still missing
  if (!resultData.name) {
    const globalName = extractNameFromText(data);
    if (globalName) {
      resultData.name = globalName;
    }
  }

  return resultData;
}

module.exports = resumeParser;

// Lightweight phone extractor scanning across the entire resume text.
// Reuses a liberal pattern and validates by digit count (10–15 digits).
function extractPhoneFromText(text) {
  if (!text) return null;
  const candidates = text.match(/[+]?[(]?[0-9]{1,4}[)]?[0-9\s\-\.]{5,}/g);
  if (!candidates) return null;
  for (const c of candidates) {
    const digits = c.replace(/\D/g, '');
    if (digits.length >= 10 && digits.length <= 15) {
      return c.trim();
    }
  }
  return null;
}

// Heuristic name extractor: pick the first plausible name-like line near the top
function extractNameFromText(text) {
  if (!text) return null;
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const maxScan = Math.min(lines.length, 20);
  for (let i = 0; i < maxScan; i++) {
    const ln = lines[i];
    // Skip lines that look like contact info
    if (/[\w.-]+@[\w.-]+\.[A-Za-z]{2,}/.test(ln)) continue;
    if (/[+]?[(]?[0-9]{1,4}[)]?[0-9\s\-\.]{5,}/.test(ln)) continue;
    // Prefer 2-5 words, letters-heavy, not all caps
    const words = ln.split(/\s+/);
    if (words.length < 2 || words.length > 6) continue;
    const letters = ln.replace(/[^A-Za-z]/g, '');
    if (letters.length / ln.length < 0.6) continue;
    const upper = letters.replace(/[^A-Z]/g, '').length;
    if (upper / letters.length > 0.9) continue; // avoid SHOUTING headers
    return ln;
  }
  return null;
}

function extractEmailFromText(text) {
  if (!text) return null;
  const match = text.match(/[^\s@]+@[^\s@]+\.[^\s@]+/);
  return match ? match[0] : null;
}

function extractLinkedInFromText(text) {
  if (!text) return null;
  const match = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|pub|company)\/[A-Za-z0-9_\-\/%\.]+/i);
  if (!match) return null;
  let url = match[0].replace(/[).,;]+$/, '');
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url.replace(/^\/\//, '');
  }
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }
  return url;
}

// Heuristic location extractor: look for patterns like "City, ST" in the first part of the text
function extractLocationFromText(text) {
  if (!text) return null;
  const lines = text.split(/\n/).map(l => l.trim()).filter(Boolean);
  const maxScan = Math.min(lines.length, 40);
  const cityStateRegex = /[A-Za-z][A-Za-z\s\.-]+,\s*[A-Za-z]{2,}/;
  for (let i = 0; i < maxScan; i++) {
    const ln = lines[i];
    if (cityStateRegex.test(ln) && !/\d/.test(ln)) {
      return ln.match(cityStateRegex)[0];
    }
  }
  // Fallback: search whole text if not found early
  const m = text.match(/[A-Za-z][A-Za-z\s\.-]+,\s*[A-Za-z]{2,}/);
  if (m) return m[0];
  return null;
}
