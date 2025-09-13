// experienceParser.js
// return a list of experience objects
function experienceParser(lines) {
  const experienceList = [];
  let current = initialExperienceObject();
  let i = 0;
  while (i < lines.length) {
    let line = cleanLine(lines[i]);
    if (!line) { i++; continue; }

    // Skip section headers
    if (/^(WORK|PROJECTS|RESEARCH) EXPERIENCE$/i.test(line)) { i++; continue; }

    // Detect job entry: company + date on same line
    if (isCompanyLine(line) && isDateLine(line)) {
      if (hasAnyData(current)) {
        experienceList.push(current);
        current = initialExperienceObject();
      }
      current.company = extractCompanyName(line);
      current.duration = extractDuration(line);
      i++;
      // Check if next line is a title
      if (i < lines.length && looksLikeTitleLine(cleanLine(lines[i]))) {
        current.title = cleanLine(lines[i]);
        i++;
      }
      continue;
    }

    // Detect company line followed by title line
    if (isCompanyLine(line) && i + 1 < lines.length && looksLikeTitleLine(cleanLine(lines[i + 1]))) {
      if (hasAnyData(current)) {
        experienceList.push(current);
        current = initialExperienceObject();
      }
      current.company = extractCompanyName(line);
      i++;
      current.title = cleanLine(lines[i]);
      i++;
      continue;
    }

    // Detect date line (duration only)
    if (isDateLine(line) && !isCompanyLine(line)) {
      current.duration = extractDuration(line);
      i++;
      continue;
    }

    // Detect title line (standalone)
    if (looksLikeTitleLine(line) && !isCompanyLine(line) && !isDateLine(line)) {
      current.title = line;
      i++;
      continue;
    }

    // Detect bullet/responsibility
    if (/^[-•●]/.test(lines[i]) || (line && !isCompanyLine(line) && !isDateLine(line) && !looksLikeTitleLine(line))) {
      if (!current.responsibilities) current.responsibilities = [];
      current.responsibilities.push(line);
      i++;
      continue;
    }

    // If line doesn't match anything, treat as company if empty
    if (!current.company && isCompanyLine(line)) {
      current.company = extractCompanyName(line);
      i++;
      continue;
    }

    i++;
  }
  if (hasAnyData(current)) experienceList.push(current);
  return experienceList;
}

function looksLikeTitleLine(line) {
  // Titles often contain role keywords and may not include commas/years
  return /\b(Engineer|Developer|Manager|Analyst|Director|Lead|Coordinator|Consultant|Assistant|Intern|Fullstack|Full[-\s]?Stack)\b/i.test(line)
         && !isCompanyLine(line)
         && !isDateLine(line);
}

function isCompanyLine(line) {
  // Broader company heuristics: comma-separated location/company patterns OR capitalized proper nouns
  if (/(Inc|LLC|Ltd|Corp|Corporation|Company|Institute|College|University|Center|School|Solutions|Technologies|Group|Studio|Lab)/i.test(line)) {
    return true;
  }
  // also treat lines with commas and no verbs and with location-like tokens as company lines
  if (/,/.test(line) && /\b(MI|CA|NY|TX|FL|WA|IL|OH|IN|GA|PA|MA|TN|VA|NC|SC|MI|Holland|Ho Chi Minh|HCM)\b/i.test(line)) {
    return true;
  }
  return false;
}

function isDateLine(line) {
  // month-year ranges or 4-digit years or "Present"
  if (/\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\b.*\b(?:19|20)\d{2}/i.test(line)) return true;
  if (/\b(19|20)\d{2}\s*[-–—]\s*(present|(19|20)\d{2})/i.test(line)) return true;
  if (/\b(?:\d{1,2}\/\d{4}|\d{4})\b/.test(line)) return true;
  return false;
}

function extractCompanyName(line) {
  let company = line.replace(/^(at\s+|@\s*)/i, '').trim();
  // if there's a date in line, take before date
  const dateMatch = company.match(/\b(19|20)\d{2}\b/);
  if (dateMatch) {
    company = company.slice(0, dateMatch.index).trim();
  }
  // remove trailing dashes or dates
  company = company.replace(/[-–—]\s*$/, '').trim();
  // if comma present, first part is likely name
  if (company.includes(',')) {
    return company.split(',')[0].trim();
  }
  return company;
}

function extractDuration(line) {
  const dateRange = line.match(/\b(19|20)\d{2}\s*[-–—]\s*(present|(19|20)\d{2})/i);
  if (dateRange) return dateRange[0];
  const monthYearRange = line.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\s*[-–—]\s*(present|(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})/i);
  if (monthYearRange) return monthYearRange[0];
  const singleYear = line.match(/\b(19|20)\d{2}\b/);
  if (singleYear) return singleYear[0];
  return line.trim();
}

function cleanLine(line) {
  return (line || '').replace(/^[-•●\s]+/, '').trim();
}

function hasAnyData(exp) {
  return !!(exp.title || exp.company || exp.duration || (exp.responsibilities && exp.responsibilities.length));
}

function initialExperienceObject() {
  return {
    title: null,
    company: null,
    duration: null,
    responsibilities: null
  };
}

module.exports = experienceParser;
