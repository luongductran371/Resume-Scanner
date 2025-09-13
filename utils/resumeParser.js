const parsePersonalInfo = require('./personalInfoParser');
const parseSection = require('./sectionParser');
const mergeSection = require('./mergeSection');

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
      const personalInfo = parsePersonalInfo(lines);
      Object.assign(resultData, personalInfo);
    } else {
      // maybe this should return a list of parsed sections
      const parsedSection = parseSection(lines);
      resultData.sections.push(parsedSection);}
  });

  resultData.sections = mergeSection(resultData.sections);

  return resultData;
}

module.exports = resumeParser;
