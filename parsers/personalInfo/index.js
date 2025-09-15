function personalInfoParser(lines) {
  const info = {
    name: null,
    location: null,
    phone: null,
    email: null,
    linkedin: null,
  };

  if (lines[0]) info.name = lines[0];

  if (lines[1]) {

    const detailsLine = lines[1] || '';

    // Normalize separators: pipe, bullet, dot, dash, etc.
    const normalized = detailsLine.replace(/[|•·\-—‒]+/g, '|');

    // Split and trim each part
    const parts = normalized.split('|').map(p => p.trim()).filter(Boolean);
    parts.forEach(part => {
      if (!info.phone && /^\+?\d{10,}$/.test(part.replace(/[\s\-()]/g, ''))) {
        info.phone = part;
      } else if (!info.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(part)) {
        info.email = part;
      } else if (!info.linkedin && /linkedin\.com\/[A-Za-z0-9_-]+/.test(part)) {
        info.linkedin = part;
      } else if(!info.location && isLocation(part)) {
        info.location = part;
      }
    });
  }

  return info;
}

function isLocation(str) {
  return /[A-Za-z]{2,},?\s?[A-Za-z]{2,}/.test(str) && !/\d/.test(str);
}

module.exports = personalInfoParser;
