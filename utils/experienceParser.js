// return a list of experience objects
function experienceParser(lines) {
    const experienceList = [];
    let currentExperience = initialExperienceObject();

    for (let i = 0; i < lines.length; i++) {
        let line = cleanLine(lines[i]);

        if (!line) continue; // skip empty lines

        // check if it's the last line then push the current experience
        // if the line indicates a new job, push the current one to the list and start a new one
        if (isNewJob(line) || i === lines.length - 1) {
            if (hasAnyData(currentExperience)) {
                experienceList.push(currentExperience);
                currentExperience = initialExperienceObject();
            }
        }

        // check for job title (usually comes first and doesn't have company indicators)
        if (!currentExperience.title && !isCompanyLine(line) && !isDateLine(line)) {
            currentExperience.title = line;
        }

        // check for company name
        if (!currentExperience.company && isCompanyLine(line)) {
            // Extract company name, removing common suffixes
            currentExperience.company = extractCompanyName(line);
        }

        // check for dates/duration
        if (!currentExperience.duration && isDateLine(line)) {
            currentExperience.duration = extractDuration(line);
        }

        // collect responsibilities/descriptions
        if (currentExperience.title && currentExperience.company && 
            !isNewJob(line) && !isDateLine(line) && !isCompanyLine(line)) {
            if (!currentExperience.responsibilities) {
                currentExperience.responsibilities = [];
            }
            currentExperience.responsibilities.push(line);
        }
    }

    return experienceList;
}

function isNewJob(line) {
    // Look for patterns that indicate a new job entry
    return /^[A-Z][A-Za-z\s]+(Engineer|Developer|Manager|Analyst|Director|Lead|Senior|Junior|Intern)/i.test(line) ||
           /^(Software|Senior|Junior|Lead|Principal|Staff|Head of)/i.test(line);
}

function isCompanyLine(line) {
    return /(Inc|LLC|Ltd|Corp|Corporation|Company|Technologies|Systems|Solutions|Group|Team)/i.test(line) ||
           /\b(at\s+|@\s*)/i.test(line);
}

function isDateLine(line) {
    return /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{1,2}\/|\d{4})\b/i.test(line) ||
           /\b(19|20)\d{2}\s*[-–—]\s*(19|20)\d{2}|\b(19|20)\d{2}\s*[-–—]\s*present/i.test(line) ||
           /\d+\s*(year|month|yr|mo)s?\b/i.test(line);
}

function extractCompanyName(line) {
    // Remove "at" or "@" prefixes and clean up
    let company = line.replace(/^(at\s+|@\s*)/i, '').trim();
    
    // Remove location if present (usually after comma)
    const parts = company.split(',');
    return parts[0].trim();
}

function extractDuration(line) {
    // Extract date ranges or duration
    const dateRange = line.match(/\b(19|20)\d{2}\s*[-–—]\s*((19|20)\d{2}|present)/i);
    if (dateRange) return dateRange[0];
    
    const monthYear = line.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(19|20)\d{2}\s*[-–—]\s*((Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(19|20)\d{2}|present)/i);
    if (monthYear) return monthYear[0];
    
    const duration = line.match(/\d+\s*(year|month|yr|mo)s?\b/i);
    if (duration) return duration[0];
    
    return line.trim();
}

function cleanLine(line) {
    return line.replace(/^[-•●\s]+/, '').trim();
}

function hasAnyData(experience) {
    return experience.title || experience.company || experience.duration || 
           (experience.responsibilities && experience.responsibilities.length > 0);
}

function initialExperienceObject() {
    return {
        title: null,
        company: null,
        duration: null,
        responsibilities: null
    };
}

module.exports = experienceParser;