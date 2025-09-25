const e = require('express');
const  educationParser  = require('./education');
const  experienceParser  = require('./experience');
const  skillsParser  = require('./skill');

function sectionParser(lines) {
  const section = {title: null, type: null, content: []};
  
  // Handle edge cases: empty lines array or undefined first line
  if (!lines || lines.length === 0) {
    return section;
  }
  
  const title = lines[0];
  const content = lines.slice(1);

  // Handle undefined or null title
  if (!title || typeof title !== 'string') {
    return section;
  }

  const titleLower = title.toLowerCase().trim();
  
  // Set the raw title first
  section.title = title.trim();
  
  // Determine type and process content based on keywords
  if (titleLower.includes("education") || titleLower.includes("academic")) {
    section.type = "Education";
    section.content = educationParser(content);
  }
  else if (titleLower.includes("experience") || titleLower.includes("work") || titleLower.includes("employment") || titleLower.includes("career") || titleLower.includes("projects experience") || titleLower.includes("research experience")) {
    section.type = "Experience";
    section.content = experienceParser(content);
  } 
  else if (titleLower.includes("skill") || titleLower.includes("competenc") || titleLower.includes("technolog") || titleLower.includes("technical")) {
    section.type = "Skills";
    section.content = skillsParser(content);
  }
  else if (titleLower.includes("summary") || titleLower.includes("profile") || titleLower.includes("objective")) {
    section.type = "Summary";
    section.content = content; // Keep as-is for summary sections
  }
  else if (titleLower.includes("project") || titleLower.includes("portfolio")) {
    section.type = "Projects";
    section.content = experienceParser(content); // Use experience parser for projects
  }
  else if (titleLower.includes("certif") || titleLower.includes("license")) {
    section.type = "Certifications";
    section.content = content;
  }
  else if (titleLower.includes("research")) {
    section.type = "Research";
    section.content = experienceParser(content); // Use experience parser for research
  }
  else {
    section.type = "Other";
    section.content = content;
  }
  
  return section;
}
module.exports = sectionParser;
