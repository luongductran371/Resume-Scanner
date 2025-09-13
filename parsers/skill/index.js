// skillsParser.js
// return categorized skills object
function skillsParser(lines) {
  const skillsData = {
    languages: [],
    frameworks: [],
    tools: [],
    technical: [],
    soft: [],
    other: []
  };

  const allSkills = [];

  for (let raw of lines) {
    let line = cleanLine(raw);
    if (!line) continue;
    if (isHeaderLine(line)) continue;

    // If the line contains "Label: items", split label and items
    const colonIndex = line.indexOf(':');
    if (colonIndex !== -1) {
      const label = line.slice(0, colonIndex).trim().toLowerCase();
      const items = line.slice(colonIndex + 1).trim();
      const parts = splitSkillItems(items);
      // Map label => preferred category
      if (/programming|language|languages/i.test(label)) {
        parts.forEach(p => allSkills.push({skill:p, cat:'languages'}));
        continue;
      }
      if (/tool|framework|frameworks|tools|libraries/i.test(label)) {
        parts.forEach(p => allSkills.push({skill:p, cat:'frameworks'}));
        continue;
      }
      if (/skill(s)?$/i.test(label)) {
        parts.forEach(p => allSkills.push({skill:p, cat:'technical'}));
        continue;
      }
      // fallback: just push items without category
      parts.forEach(p => allSkills.push({skill:p, cat:null}));
      continue;
    }

    // if no colon, split using delimiters
    const parts = splitSkillItems(line);
    parts.forEach(p => allSkills.push({skill:p, cat:null}));
  }

  // categorize and dedupe
  allSkills.forEach(({skill, cat}) => {
    const normalized = skill.trim();
    const inferred = cat || categorizeSkill(normalized);
    if (!skillsData[inferred]) skillsData[inferred] = [];
    if (!skillsData[inferred].includes(normalized)) {
      skillsData[inferred].push(normalized);
    }
  });

  // remove empty categories
  Object.keys(skillsData).forEach(k => {
    if (!skillsData[k] || skillsData[k].length === 0) delete skillsData[k];
  });

  return skillsData;
}

function splitSkillItems(text) {
  // split by commas, semicolons, pipes or bullets
  const parts = text.split(/[,;|•●·\/\\]/).map(p => p.trim()).filter(Boolean);
  return parts;
}

function categorizeSkill(skill) {
  const s = skill.toLowerCase();

  const languages = ['javascript','python','java','sql','c#','c++','typescript','ruby','go','php','rust','swift','kotlin'];
  const frameworks = ['react','reactjs','node','node.js','express','spring','django','flask','angular','vue','flutter'];
  const tools = ['git','docker','kubernetes','aws','azure','gcp','firebase','mysql','postgresql','mongodb','redis','jira','postman'];

  if (languages.some(l => s === l || s.includes(l + ' ' ) || s.includes(' ' + l))) return 'languages';
  if (frameworks.some(f => s.includes(f))) return 'frameworks';
  if (tools.some(t => s.includes(t))) return 'tools';

  if (/\b(api|rest|graphql|microservices|devops|ci\/cd|serverless|cloud)\b/i.test(s)) return 'technical';
  if (/\b(communication|leadership|teamwork|management|agile|scrum|problem solving)\b/i.test(s)) return 'soft';
  return 'other';
}

function isHeaderLine(line) {
  return /^(skills?|technical skills?|technologies?|programming|languages?|tools?|expertise|competencies)$/i.test(line.trim());
}

function cleanLine(line) {
  return (line || '').replace(/^[-•●\s]+/, '').trim();
}

module.exports = skillsParser;
