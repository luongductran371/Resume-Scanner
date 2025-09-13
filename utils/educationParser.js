// return a list of education objects
function educationParser(lines) {
    const educationList = [];
    let currentEducation = initialEducationObject();
  
    for (let i = 0; i < lines.length; i++) {

        let line = cleanLine(lines[i]);

        if (!line) continue; // skip empty lines

        //check if it's the last line then push the curernt education
        // if the line indicates a new school, push the current one to the list and start a new one
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

        if (!currentEducation.school && isNewSchool(line) ) {
            const parts = line.split(',');
            currentEducation.school = parts[0];
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
        grade: null
    }; 
}

module.exports = educationParser;

