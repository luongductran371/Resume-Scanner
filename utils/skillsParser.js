// return categorized skills object
function skillsParser(lines) {
    const skillsData = {
        technical: [],
        languages: [],
        frameworks: [],
        tools: [],
        soft: [],
        other: []
    };

    const allSkills = [];

    // First, extract all potential skills from lines
    for (let line of lines) {
        line = cleanLine(line);
        if (!line) continue;

        // Skip section headers
        if (isHeaderLine(line)) continue;

        // Split by common delimiters and extract skills
        const skills = extractSkillsFromLine(line);
        allSkills.push(...skills);
    }

    // Categorize each skill
    allSkills.forEach(skill => {
        const category = categorizeSkill(skill);
        if (!skillsData[category].includes(skill)) {
            skillsData[category].push(skill);
        }
    });

    // Remove empty categories
    Object.keys(skillsData).forEach(category => {
        if (skillsData[category].length === 0) {
            delete skillsData[category];
        }
    });

    return skillsData;
}

function extractSkillsFromLine(line) {
    const skills = [];
    
    // Split by various delimiters
    const delimiters = /[,;•●|·\n]/;
    const parts = line.split(delimiters);
    
    parts.forEach(part => {
        part = part.trim();
        
        // Skip empty parts or very short parts
        if (!part || part.length < 2) return;
        
        // Skip common non-skill words
        if (isNonSkillWord(part)) return;
        
        // Handle parenthetical experience levels like "JavaScript (5 years)"
        const cleanSkill = part.replace(/\s*\([^)]*\)\s*$/, '').trim();
        
        if (cleanSkill && cleanSkill.length >= 2) {
            skills.push(cleanSkill);
        }
    });
    
    return skills;
}

function categorizeSkill(skill) {
    const skillLower = skill.toLowerCase();
    
    // Programming languages
    const languages = [
        'javascript', 'python', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust',
        'typescript', 'swift', 'kotlin', 'scala', 'perl', 'r', 'matlab', 'sql',
        'html', 'css', 'bash', 'powershell'
    ];
    
    // Frameworks and libraries
    const frameworks = [
        'react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask',
        'spring', 'laravel', 'rails', 'asp.net', 'jquery', 'bootstrap',
        'tailwind', 'next.js', 'nuxt.js', 'gatsby', 'svelte', 'ember'
    ];
    
    // Tools and technologies
    const tools = [
        'git', 'docker', 'kubernetes', 'jenkins', 'aws', 'azure', 'gcp',
        'linux', 'windows', 'macos', 'mysql', 'postgresql', 'mongodb',
        'redis', 'elasticsearch', 'nginx', 'apache', 'webpack', 'babel',
        'jest', 'cypress', 'selenium', 'postman', 'jira', 'confluence'
    ];
    
    // Soft skills
    const softSkills = [
        'leadership', 'communication', 'teamwork', 'problem solving',
        'project management', 'agile', 'scrum', 'mentoring', 'training',
        'presentation', 'analytical thinking', 'creativity', 'adaptability'
    ];
    
    // Check categories
    if (languages.some(lang => skillLower.includes(lang))) {
        return 'languages';
    }
    
    if (frameworks.some(fw => skillLower.includes(fw))) {
        return 'frameworks';
    }
    
    if (tools.some(tool => skillLower.includes(tool))) {
        return 'tools';
    }
    
    if (softSkills.some(soft => skillLower.includes(soft))) {
        return 'soft';
    }
    
    // If it looks technical but didn't match above categories
    if (isTechnicalSkill(skillLower)) {
        return 'technical';
    }
    
    return 'other';
}

function isTechnicalSkill(skill) {
    // Look for technical patterns
    const technicalPatterns = [
        /\b(api|rest|graphql|microservices|devops|ci\/cd)\b/,
        /\b(machine learning|ai|data science|analytics)\b/,
        /\b(frontend|backend|full.?stack|mobile|web)\b/,
        /\b(database|nosql|orm|mvc|spa|pwa)\b/,
        /\b(cloud|serverless|container|virtualization)\b/
    ];
    
    return technicalPatterns.some(pattern => pattern.test(skill));
}

function isHeaderLine(line) {
    // Skip common section headers
    const headers = /^(skills?|technical skills?|technologies?|programming|languages?|tools?|expertise|competencies)$/i;
    return headers.test(line.trim());
}

function isNonSkillWord(word) {
    const nonSkills = [
        'and', 'or', 'with', 'in', 'of', 'for', 'at', 'on', 'the', 'a', 'an',
        'years?', 'months?', 'experience', 'proficient', 'familiar', 'knowledge',
        'basic', 'intermediate', 'advanced', 'expert', 'including'
    ];
    
    return nonSkills.some(nonSkill => 
        new RegExp(`^${nonSkill}$`, 'i').test(word.trim())
    );
}

function cleanLine(line) {
    return line.replace(/^[-•●\s]+/, '').trim();
}

module.exports = skillsParser;