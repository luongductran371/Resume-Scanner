// experienceParser.js
// return a list of experience objects
function experienceParser(lines) {
  const experienceList = [];
  let currentCompany = null;
  let currentPosition = null;
  let i = 0;
  while (i < lines.length) {
    let line = cleanLine(lines[i]);
    if (!line) { i++; continue; }

    // Skip section headers
    if (/^(WORK|PROJECTS|RESEARCH) EXPERIENCE$/i.test(line)) { i++; continue; }

    // Detect company + date on same line
    if (isCompanyLine(line) && isDateLine(line)) {
      // Save previous company
      if (currentCompany) {
        if (currentPosition) {
          currentCompany.positions.push(currentPosition);
          currentPosition = null;
        }
        experienceList.push(currentCompany);
      }
      currentCompany = {
        company: extractCompanyName(line),
        duration: extractDuration(line),
        location: extractLocation(line),
        positions: []
      };
      i++;
      // Check if next line is a title
      if (i < lines.length && looksLikeTitleLine(cleanLine(lines[i]))) {
        currentPosition = {
          title: cleanLine(lines[i]),
          responsibilities: []
        };
        i++;
      } else {
        currentPosition = null;
      }
      continue;
    }

    // Detect company line followed by title line
    if (isCompanyLine(line) && i + 1 < lines.length && looksLikeTitleLine(cleanLine(lines[i + 1]))) {
      if (currentCompany) {
        if (currentPosition) {
          currentCompany.positions.push(currentPosition);
          currentPosition = null;
        }
        experienceList.push(currentCompany);
      }
      currentCompany = {
        company: extractCompanyName(line),
        duration: null,
        location: extractLocation(line),
        positions: []
      };
      i++;
      currentPosition = {
        title: cleanLine(lines[i]),
        responsibilities: []
      };
      i++;
      continue;
    }

    // Detect date line (duration only for position)
    if (isDateLine(line) && !isCompanyLine(line)) {
      if (currentPosition) {
        currentPosition.duration = extractDuration(line);
      } else if (currentCompany) {
        currentCompany.duration = extractDuration(line);
      }
      i++;
      continue;
    }

    // Detect title line (standalone, new position in same company)
    if (looksLikeTitleLine(line) && !isCompanyLine(line) && !isDateLine(line)) {
      if (currentPosition && currentCompany) {
        currentCompany.positions.push(currentPosition);
      }
      currentPosition = {
        title: line,
        responsibilities: []
      };
      i++;
      continue;
    }

    // Detect bullet/responsibility
    if (/^[-•●]/.test(lines[i]) || (line && !isCompanyLine(line) && !isDateLine(line) && !looksLikeTitleLine(line))) {
      if (currentPosition) {
        currentPosition.responsibilities.push(line);
      }
      i++;
      continue;
    }

    // If line doesn't match anything, treat as company if empty
    if (!currentCompany && isCompanyLine(line)) {
      currentCompany = {
        company: extractCompanyName(line),
        duration: null,
        location: extractLocation(line),
        positions: []
      };
      i++;
      continue;
    }

    i++;
  }
  // Push last position and company
  if (currentPosition && currentCompany) {
    currentCompany.positions.push(currentPosition);
  }
  if (currentCompany) {
    experienceList.push(currentCompany);
  }
  return experienceList;
// Extract location from a line using regex and known patterns
function extractLocation(line) {
  // US states and some common cities
  const locationRegex = /,\s*([A-Za-z .]+,\s*[A-Z]{2})|,\s*([A-Za-z .]+)$/;
  const match = line.match(locationRegex);
  if (match) {
    return match[1] || match[2];
  }
  // Try splitting by comma and checking for state abbreviations
  const parts = line.split(',').map(p => p.trim());
  const usStates = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];
  for (let part of parts) {
    if (usStates.includes(part)) {
      return part;
    }
    // If part looks like a city, return it
    if (/^[A-Za-z .]+$/.test(part) && part.length > 2) {
      return part;
    }
  }
  return null;
}
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

// No longer needed

module.exports = experienceParser;
