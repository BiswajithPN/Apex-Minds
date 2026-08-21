const fs = require('fs');

function extractSkillsFromJD(jdText) {
    const commonTechSkills = [
        "python", "java", "javascript", "c++", "ruby", "go", "php", "swift", "kotlin", "rust",
        "react", "angular", "vue", "node.js", "express", "django", "flask", "spring", "asp.net",
        "html", "css", "sql", "nosql", "mongodb", "postgresql", "mysql", "redis", "elasticsearch",
        "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "ansible", "jenkins", "git",
        "machine learning", "data analysis", "agile", "scrum", "ci/cd", "rest api", "graphql", "typescript"
    ];
    
    const jdLower = jdText.toLowerCase();
    const foundSkills = [];
    
    for (let skill of commonTechSkills) {
        if (jdLower.includes(skill)) {
            foundSkills.push(skill);
        }
    }
    
    return foundSkills;
}

function extractYearsExperience(text) {
    const regexps = [
        /(\d+)(?:\+| - \d+)?\s*(?:years?|yrs?)(?:\s+of)?\s+experience/i,
        /experience:?\s*(\d+)\+?\s*(?:years?|yrs?)/i,
        /(\d+)\+?\s*(?:years?|yrs?)\s+(?:working|developing|engineering)/i
    ];
    
    const textLower = text.toLowerCase();
    for (let r of regexps) {
        const match = textLower.match(r);
        if (match && match[1]) {
            return parseInt(match[1], 10);
        }
    }
    return 0;
}

function extractEducation(text) {
    const textLower = text.toLowerCase();
    const keywords = ["bachelor", "b.s.", "b.a.", "master", "m.s.", "m.a.", "phd", "b.tech", "m.tech", "degree"];
    for (let k of keywords) {
        if (textLower.includes(k)) return k;
    }
    return null;
}

function levenshteinDistance(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix = [];
    for (let i = 0; i <= b.length; i++) { matrix[i] = [i]; }
    for (let j = 0; j <= a.length; j++) { matrix[0][j] = j; }
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    return matrix[b.length][a.length];
}

function fuzzyMatchSkill(skill, text) {
    const textLower = text.toLowerCase();
    const skillLower = skill.toLowerCase();
    if (textLower.includes(skillLower)) return skillLower;
    const words = textLower.split(/[\s,.;:()]+/);
    for (let word of words) {
        if (Math.abs(word.length - skillLower.length) <= 2) {
            const dist = levenshteinDistance(skillLower, word);
            const maxDist = Math.max(1, Math.floor(skillLower.length * 0.35));
            if (dist > 0 && dist <= maxDist) return word;
        }
    }
    return null;
}

const TECH_SYNONYMS = {
    'javascript': ['js'],
    'kubernetes': ['k8s'],
    'node.js': ['node', 'nodejs'],
    'amazon web services': ['aws'],
    'aws': ['amazon web services'],
    'react': ['reactjs', 'react.js'],
    'typescript': ['ts'],
    'postgresql': ['postgres']
};

const ADJACENT_MAP = {
    'react': ['vue', 'angular', 'svelte'],
    'angular': ['react', 'vue', 'svelte'],
    'vue': ['react', 'angular', 'svelte'],
    'django': ['flask', 'fastapi'],
    'flask': ['django', 'fastapi'],
    'express': ['koa', 'nest', 'fastify'],
    'mysql': ['postgresql', 'sqlite', 'sql server'],
    'postgresql': ['mysql', 'sqlite', 'sql server'],
    'mongodb': ['couchdb', 'cassandra', 'dynamodb'],
    'aws': ['azure', 'gcp'],
    'azure': ['aws', 'gcp'],
    'gcp': ['aws', 'azure']
};

function checkAdjacentSkills(missingSkills, textLower) {
    const adjacents = [];
    const missingCopy = [...missingSkills];
    
    for (let i = missingCopy.length - 1; i >= 0; i--) {
        const reqSkill = missingCopy[i];
        const neighbors = ADJACENT_MAP[reqSkill];
        if (!neighbors) continue;
        
        for (let n of neighbors) {
            if (textLower.includes(n)) {
                adjacents.push({
                    have: n,
                    wanted: reqSkill,
                    reasoning: `Candidate has experience with ${n}, which is highly transferable to ${reqSkill}.`
                });
                missingCopy.splice(i, 1);
                break;
            }
        }
    }
    return { adjacents, remainingMissing: missingCopy };
}

function extractCertifications(text) {
    const certs = [];
    const regex = /\b(certified|certification|aws certified|cisco|comptia|azure|gcp professional)\b[\s\S]{0,50}?(\n|\.|$)/gi;
    let match;
    while ((match = regex.exec(text)) !== null) {
        certs.push({ name: match[0].trim(), evidence: match[0].trim() });
    }
    return certs.slice(0, 3);
}

function extractAchievements(text) {
    const achieves = [];
    const regex = /\b(reduced|increased|improved|led|managed|optimized|delivered)[\s\S]{0,60}?(\d+%|\d+\s*x|\$\d+[mk]?)/gi;
    let match;
    while ((match = regex.exec(text)) !== null) {
        achieves.push({ description: match[0].trim(), metric: match[2].trim() });
    }
    return achieves.slice(0, 3);
}

function extractProjects(text) {
    const projects = [];
    const regex = /\b(project:|built|developed|created)\b[\s\S]{0,100}?(\n|$)/gi;
    let match;
    while ((match = regex.exec(text)) !== null) {
        let snippet = match[0].trim();
        projects.push({ title: "Extracted Project", technologies: [], summary: snippet });
    }
    return projects.slice(0, 2);
}

function screenResumeLocal(jobDescription, resumeText, redactionLog = []) {
    const requiredSkills = extractSkillsFromJD(jobDescription);
    const expRequired = extractYearsExperience(jobDescription);
    
    const resumeLower = resumeText.toLowerCase();
    const sentences = resumeText.split(/(?<=[.!?])\s+/);
    
    const expYears = extractYearsExperience(resumeText);
    const eduMatchStr = extractEducation(resumeText);
    const eduMatch = eduMatchStr !== null;
    
    const matchedSkills = [];
    let missingSkills = [];
    
    const NEGATION_WORDS = ['no', 'zero', 'lack of', 'without'];

    function isNegated(fullText, matchToken) {
        const textLower = fullText.toLowerCase();
        const tokenLower = matchToken.toLowerCase();
        let index = textLower.indexOf(tokenLower);
        let foundUnnegated = false;
        
        while (index !== -1) {
            const prefix = textLower.substring(Math.max(0, index - 50), index);
            const wordsBefore = prefix.split(/[\s,.;]+/).filter(w => w.length > 0);
            const window = wordsBefore.slice(-4).join(' ');
            const windowAndToken = window + ' ' + tokenLower;
            const negFound = NEGATION_WORDS.some(neg => {
                const regex = new RegExp('\\b' + neg + '\\b', 'i');
                return regex.test(windowAndToken);
            });
            if (!negFound) {
                foundUnnegated = true;
                break;
            }
            index = textLower.indexOf(tokenLower, index + tokenLower.length);
        }
        return !foundUnnegated;
    }

    for (let skill of requiredSkills) {
        let searchTerms = [skill];
        if (TECH_SYNONYMS[skill]) searchTerms = searchTerms.concat(TECH_SYNONYMS[skill]);
        
        let isMatch = false;
        let matchedToken = null;
        let confidence = "low";
        
        for (let term of searchTerms) {
            const regex = new RegExp('\\b' + term.replace(/[.*+?^$\/()|[\\]\\\\]/g, '\\\\$&') + '\\b', 'i');
            if (regex.test(resumeText)) {
                if (!isNegated(resumeText, term)) {
                    isMatch = true;
                    matchedToken = term;
                    confidence = "high";
                    break;
                }
            }
        }
        
        if (!isMatch) {
            for (let term of searchTerms) {
                const fuzzyResult = fuzzyMatchSkill(term, resumeText);
                if (fuzzyResult) {
                    if (!isNegated(resumeText, fuzzyResult)) {
                        isMatch = true;
                        matchedToken = fuzzyResult;
                        confidence = "medium";
                        break;
                    }
                }
            }
        }
        
        if (isMatch && matchedToken) {
            let evidenceText = "";
            for (let s of sentences) {
                if (s.toLowerCase().includes(matchedToken.toLowerCase())) {
                    evidenceText = s;
                    break;
                }
            }
            matchedSkills.push({
                skill: skill,
                evidence: evidenceText || `Matched via: ${matchedToken}`,
                confidence
            });
        } else {
            missingSkills.push(skill);
        }
    }
    
    // Adjacency checking
    const { adjacents, remainingMissing } = checkAdjacentSkills(missingSkills, resumeLower);
    
    const missingSkillsObjects = remainingMissing.map(s => ({ skill: s, note: "Not found in resume." }));
    
    const ocrWarning = resumeText.length < 100 || (resumeText.match(/[^a-zA-Z0-9\s]/g) || []).length > resumeText.length * 0.2;
    
    // Scoring
    let score = 0;
    if (requiredSkills.length > 0) {
        const matchWeight = matchedSkills.length + (adjacents.length * 0.5);
        score += Math.min(matchWeight / requiredSkills.length, 1.0) * 50;
    } else { score += 50; }
    
    if (expRequired > 0) { score += Math.min(expYears / expRequired, 1.0) * 30; } else { score += 30; }
    if (eduMatch) { score += 20; }
    score = Math.round(score);
    
    let decision = "NOT A MATCH";
    if (score >= 70) decision = "STRONG MATCH";
    else if (score >= 50) decision = "MAYBE - NEEDS REVIEW";

    return {
        matchScore: score,
        decision,
        ocrQualityWarning: ocrWarning,
        ocrQualityNote: ocrWarning ? "High volume of noise characters or very short text detected." : "OCR quality looks acceptable.",
        matchedSkills,
        missingSkills: missingSkillsObjects,
        adjacentSkills: adjacents,
        experience: {
            totalYearsCalculated: expYears,
            calculationBreakdown: expYears > 0 ? "Extracted using regex date heuristics." : "No explicit experience years found.",
            relevantRoles: []
        },
        education: {
            meetsRequirement: eduMatch,
            degree: eduMatchStr || "Not explicitly found",
            field: "Not extracted",
            evidence: eduMatchStr ? "Found keywords indicating degree." : ""
        },
        certifications: extractCertifications(resumeText),
        projects: extractProjects(resumeText),
        achievements: extractAchievements(resumeText),
        strengths: [`Has ${expYears} years of experience`, `${matchedSkills.length} exact skill matches`],
        gaps: remainingMissing,
        biasFlags: {
            identityFieldsRemovedBeforeScoring: ["name", "gender", "photo", "address", "age", "phone", "email"],
            note: "Score computed only from skills, experience, education, and demonstrated impact. Filters applied: " + redactionLog.join(', ')
        },
        reasoning: `Candidate scored ${score}/100. Matched ${matchedSkills.length} exact skills and ${adjacents.length} adjacent skills. Education requirement met: ${eduMatch}.`,
        recommendationSummary: decision
    };
}

module.exports = { screenResumeLocal };
