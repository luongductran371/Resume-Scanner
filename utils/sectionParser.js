const educationParser = require('./educationParser');

function parseSection(lines) {

  // i'm rewriting this function to return education, experience, skills, projects, etc
  // based on the first line as the title and the rest as content
  const section = {title: null, content: []};
  const title = lines[0];
  const content = lines.slice(1);

  if (title.toLowerCase().includes("education")) {
    section.title = "Education";
    section.content = educationParser(content);
  }
  return section;
}

module.exports = parseSection;
