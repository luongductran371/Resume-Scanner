function personalInfoParser(lines) {
  const info = {
    name: null,
    location: null,
    phone: null,
    email: null,
    linkedin: null,
  };

  if (lines[0]) info.name = lines[0];

  // Consider the first few lines for personal/contact info (in many resumes
  // name is on line 0, contact details are on the next 1-4 lines)
  const headerDetails = (lines && lines.length > 1)
    ? lines.slice(1, Math.min(lines.length, 5)).join(' | ')
    : '';

  if (headerDetails) {
    // Normalize common separators to a pipe to split reliably
    // Includes pipes, bullets, middots, hyphens, en/em dashes, slashes, middle dots
    const normalized = headerDetails.replace(/[|•·∙‧·\-–—‒/]+/g, '|');

    // Split and trim each part
    const parts = normalized.split('|').map(p => p.trim()).filter(Boolean);

    for (const rawPart of parts) {
      const part = rawPart.replace(/^((phone|mobile|tel)\s*:?)\s*/i, '');

      // Phone extraction: support international formats and validate by digit count
      if (!info.phone) {
        const phoneMatch = extractPhone(part);
        if (phoneMatch) {
          info.phone = phoneMatch;
        }
      }

      // Email extraction
      if (!info.email && /[^\s@]+@[^\s@]+\.[^\s@]+/.test(part)) {
        const emailMatch = part.match(/[^\s@]+@[^\s@]+\.[^\s@]+/);
        if (emailMatch) info.email = emailMatch[0];
      }

      // LinkedIn extraction: accept various URL styles
      if (!info.linkedin) {
        const linkedinMatch = part.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|pub|company)\/[A-Za-z0-9_\-/%\.]+/i);
        if (linkedinMatch) {
          let url = linkedinMatch[0].replace(/[).,;]+$/, '');
          if (!/^https?:\/\//i.test(url)) {
            url = 'https://' + url.replace(/^\/\//, '');
          }
          if (!/^https?:\/\//i.test(url)) {
            url = 'https://' + url; // ensure protocol
          }
          info.linkedin = url;
        }
      }

      // Location heuristic (keep last)
      if (!info.location && isLocation(part)) {
        info.location = part;
      }
    }
  }

  return info;
}

function isLocation(str) {
  return /[A-Za-z]{2,},?\s?[A-Za-z]{2,}/.test(str) && !/\d/.test(str);
}

// Extract a phone number from a text fragment. Returns the matched substring
// (trimmed) or null if not found.
function extractPhone(text) {
  if (!text) return null;
  // Look for sequences with digits, spaces, parentheses, dots or dashes
  // Ensure at least 10 digits in total (common minimum for many regions)
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

module.exports = personalInfoParser;
