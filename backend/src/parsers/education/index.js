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

        // Set school first, then look for degree in other lines
        if (!currentEducation.school && isNewSchool(line)) {
            const parts = line.split(',');
            currentEducation.school = parts[0];
            currentEducation.location = extractLocation(line);
        }
        
        // Look for degree in separate lines (not the school line)
        if (!currentEducation.degree && !isNewSchool(line)) {
            if (/degree|bachelor|master|phd|associate|bs|ba|ms|ma|computer science|engineering|science|arts|major/i.test(line)) {
                currentEducation.degree = line.trim();
            }
            // Also check for degree patterns that start the line
            else if (/^(bachelor|master|phd|associate|bs|ba|ms|ma|computer science|data science|software engineering)/i.test(line.trim())) {
                currentEducation.degree = line.trim();
            }
        }

        if (!currentEducation.year && /\b(19|20)\d{2}\b/.test(line)) {
            const yearMatch = line.match(/\b(19|20)\d{2}\b/);
            if (yearMatch) currentEducation.year = yearMatch[0];
        }

        // Look for GPA/grade patterns (more comprehensive)
        if (!currentEducation.grade) {
            // Pattern with keywords: "GPA: 3.8", "Grade: 3.8"
            if (/\b(gpa|grade|cgpa|percentage)\b/i.test(line)) {
                const gradeMatch = line.match(/\b(gpa|grade|cgpa|percentage)\b[:\s]*([\d.]+%?)/i);
                if (gradeMatch) currentEducation.grade = gradeMatch[2];
            }
            // Pattern like "3.8/4.0" or "3.8 / 4.0"
            else if (/\b\d\.\d+\s*\/\s*\d\.\d+\b/.test(line)) {
                const gpaRatioMatch = line.match(/\b(\d\.\d+)\s*\/\s*(\d\.\d+)\b/);
                if (gpaRatioMatch) {
                    currentEducation.grade = `${gpaRatioMatch[1]}/${gpaRatioMatch[2]}`;
                }
            }
            // Pattern like standalone "3.8" in short lines (likely GPA)
            else if (line.length < 30 && /\b\d\.\d{1,2}\b/.test(line)) {
                const standaloneGpa = line.match(/\b(\d\.\d{1,2})\b/);
                if (standaloneGpa && parseFloat(standaloneGpa[1]) <= 4.0 && parseFloat(standaloneGpa[1]) >= 2.0) {
                    currentEducation.grade = standaloneGpa[1];
                }
            }
            // Pattern like "Cumulative GPA: 3.8" or similar
            else if (/cumulative|overall|final/i.test(line) && /\d\.\d+/.test(line)) {
                const cumulativeGpa = line.match(/(\d\.\d+)/);
                if (cumulativeGpa && parseFloat(cumulativeGpa[1]) <= 4.0) {
                    currentEducation.grade = cumulativeGpa[1];
                }
            }
        }
    }

    return educationList;
}

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
