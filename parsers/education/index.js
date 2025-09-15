// return a list of education objects
function educationParser(lines) {
    const educationList = [];
    let currentEducation = initialEducationObject();

    for (let i = 0; i < lines.length; i++) {
        let line = cleanLine(lines[i]);
        if (!line) continue; // skip empty lines

        // If the line indicates a new school or it's the last line, push the current education
        if (isNewSchool(line) || i === lines.length - 1) {
            if (hasAnyData(currentEducation)) {
                educationList.push(currentEducation);
                currentEducation = initialEducationObject();
            }
        }

        // check for keywords to identify different parts of the education entry
        if (!currentEducation.degree && /degree|bachelor|master|phd|associate/i.test(line)) {
            currentEducation.degree = line;
        }

        if (!currentEducation.school && isNewSchool(line)) {
            const parts = line.split(',');
            currentEducation.school = parts[0];
            currentEducation.location = extractLocation(line);
        }

        if (!currentEducation.year && /\b(19|20)\d{2}\b/.test(line)) {
            const yearMatch = line.match(/\b(19|20)\d{2}\b/);
            if (yearMatch) currentEducation.year = yearMatch[0];
        }

        if (!currentEducation.grade && /\b(gpa|grade|cgpa|percentage)\b/i.test(line)) {
            const gradeMatch = line.match(/\b(gpa|grade|cgpa|percentage)\b[:\s]*([\d.]+%?)/i);
            if (gradeMatch) currentEducation.grade = gradeMatch[2];
        }
    }

    return educationList;
// Extract location from a line using regex and known patterns
function extractLocation(line) {
    // US states and some common cities
    const locationRegex = /,\s*([A-Za-z .]+,\s*[A-Z]{2})|,\s*([A-Za-z .]+)$/;
    const match = line.match(locationRegex);
    if (match) {
        return match[1] || match[2];
    }
    // Try splitting by comma and checking for state abbreviations
    const parts = line.split(',').map(p => p.trim());
    const usStates = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];
    for (let part of parts) {
        if (usStates.includes(part)) {
            return part;
        }
        // If part looks like a city, return it
        if (/^[A-Za-z .]+$/.test(part) && part.length > 2) {
            return part;
        }
    }
    return null;
}
}

function isNewSchool(line) {
    return /university|college|institute|school/i.test(line);
}

function cleanLine(line) {
    return line.replace(/^[-•●\s]+/, '').trim();
}

function hasAnyData(education) {
    return education.school || education.degree || education.grade || education.year;
}

function initialEducationObject() {
    return {
        school: null,
        degree: null,
        year: null,
        grade: null,
        location: null
    };
}

module.exports = educationParser;
