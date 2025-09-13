// mergeSections.js
// input: array of sections [{title, content}, ...]
// output: array where same titles are merged (content concatenated)
function mergeSections(sections) {
  const map = new Map();
  for (const s of sections) {
    const title = s.title || 'Untitled';
    if (!map.has(title)) map.set(title, { title, content: [] });
    const entry = map.get(title);
    // content might be an array or object; normalize to array
    if (Array.isArray(s.content)) {
      entry.content.push(...s.content);
    } else {
      entry.content.push(s.content);
    }
  }
  return Array.from(map.values());
}

module.exports = mergeSections;
