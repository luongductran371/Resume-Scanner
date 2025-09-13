const e = require('express');
const  educationParser  = require('./education');
const  experienceParser  = require('./experience');
const  skillsParser  = require('./skill');

function sectionParser(lines) {

  // i'm rewriting this function to return education, experience, skills, projects, etc
  // based on the first line as the title and the rest as content
  const section = {title: null, content: []};
  const title = lines[0];
  const content = lines.slice(1);

  if (title.toLowerCase().includes("education")) {
    section.title = "Education";
    section.content = educationParser(content);
  }
  else if (title.toLowerCase().includes("experience") || title.toLowerCase().includes("work")) {
    section.title = "Experience";
    section.content = experienceParser(content);
  } else if (title.toLowerCase().includes("skill")) {
    section.title = "Skills";
    section.content = skillsParser(content);
  }
  return section;
}

module.exports = sectionParser;
