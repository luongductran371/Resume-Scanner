// return a list of education objects
function educationParser(lines) {
    const educationList = [];
    let currentEducation = {school: null, degree: null, grade: null, year: null};
  
    lines.forEach((line) => {

        //check if it's the last line then push the curernt education
        // if the line indicates a new school, push the current one to the list and start a new one
        if (isNewSchool(line) || lines.indexOf(line) === lines.length - 1) {
            if (hasAnyData(currentEducation)) {
                educationList.push(currentEducation);
            }
            currentEducation = {}; // start fresh for the next school
        }

        line = cleanLine(line);

        // check for keywords to identify different parts of the education entry
        if (/degree|bachelor|master|phd|associate/i.test(line)) {
            currentEducation.degree = line;
        }

        if (/university|college|institute|school/i.test(line)) {
            const parts = line.split(',');
            currentEducation.school = parts[0];
        }

        if (/\b(19|20)\d{2}\b/.test(line)) {
            const yearMatch = line.match(/\b(19|20)\d{2}\b/);
            if (yearMatch) currentEducation.year = yearMatch[0];
        }

        if (/\b(gpa|grade|cgpa|percentage)\b/i.test(line)) {
            const gradeMatch = line.match(/\b(gpa|grade|cgpa|percentage)\b[:\s]*([\d.]+%?)/i);
            if (gradeMatch) currentEducation.grade = gradeMatch[2];
        }
    })    

    return educationList;
}

function isNewSchool(line) {
    return /university|college|institute|school/i.test(line);
}

function cleanLine(line) {
    return line.replace(/^[-•\s]+/, '').trim();
}

function hasAnyData(education) {
    return education.school || education.degree || education.grade || education.year;
}

module.exports = educationParser;

