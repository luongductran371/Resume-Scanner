// mergeSections.js
// input: array of sections [{title, type, content}, ...]
// output: array where same types are merged (content concatenated)
function mergeSections(sections) {
  const map = new Map();
  for (const s of sections) {
    if (!s) continue; // Skip null sections
    
    // Use type as primary key, fall back to title
    const key = s.type || s.title || 'Untitled';
    
    if (!map.has(key)) {
      map.set(key, { 
        title: s.title || key, 
        type: s.type || key,
        content: [] 
      });
    }
    
    const entry = map.get(key);
    
    // Merge content arrays
    if (Array.isArray(s.content)) {
      entry.content.push(...s.content);
    } else if (s.content) {
      entry.content.push(s.content);
    }
  }
  return Array.from(map.values());
}

module.exports = mergeSections;
