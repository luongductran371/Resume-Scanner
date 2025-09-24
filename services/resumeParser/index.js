const { sectionParser, personalInfoParser } = require('../../parsers');
const mergeSection = require('./sectionMerger');

function resumeParser(data) {
  const resultData = {
    name: null,
    location: null,
    phone: null,
    email: null,
    linkedin: null,
    sections: [],
  };

  const blocks = data.split(/\n\s*\n/);

  while (blocks.length) {
    const firstLine = blocks[0].split("\n")[0].trim();
    if (firstLine && /^[A-Z][A-Za-z\s]+$/.test(firstLine)) break;
    blocks.shift();
  }

  blocks.forEach((section, i) => {
    const lines = section
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (i === 0) {
      const personalInfo = personalInfoParser(lines);
      Object.assign(resultData, personalInfo);
    } else {
      // maybe this should return a list of parsed sections
      const parsedSection = sectionParser(lines);
      resultData.sections.push(parsedSection);}
  });

  resultData.sections = mergeSection(resultData.sections);

  // Fallback: if no phone was detected in header, try scanning the whole text
  if (!resultData.phone) {
    const globalPhone = extractPhoneFromText(data);
    if (globalPhone) {
      resultData.phone = globalPhone;
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
