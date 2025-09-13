function parsePersonalInfo(lines) {
  const info = {
    name: null,
    location: null,
    phone: null,
    email: null,
    linkedin: null,
  };

  if (lines[0]) info.name = lines[0];

  if (lines[1]) {
    const parts = lines[1].split("|").map(part => part.trim());
    parts.forEach(part => {
      if (/^\+?\d{10,}$/.test(part.replace(/[\s\-()]/g, ''))) {
        info.phone = part;
      } else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(part)) {
        info.email = part;
      } else if (/linkedin\.com\/[A-Za-z0-9_-]+/.test(part)) {
        info.linkedin = part;
      } else {
        info.location = part;
      }
    });
  }

  return info;
}

module.exports = parsePersonalInfo;
