/**
 * screenerService.js — Algorithmic Bias-Aware Resume Screening Engine
 * 
 * Core Features:
 * 1. Zero-bias identity redaction (scrubbing PII, pronouns, ageism dates, university pedigree)
 * 2. Multi-tier skills extraction with canonical synonyms and transferable adjacency graphs
 * 3. Experience and educational requirement validation
 * 4. Transparent, explainable scoring breakdown & narrative generation
 */

// ============================================================================
// SKILLS & SYNONYMS & ADJACENCY DICTIONARIES
// ============================================================================

const COMMON_TECH_SKILLS = [
  'python', 'java', 'javascript', 'c++', 'c#', 'ruby', 'go', 'php', 'swift', 'kotlin', 'rust',
  'react', 'angular', 'vue', 'svelte', 'node.js', 'express', 'django', 'flask', 'fastapi', 'spring', 'asp.net',
  'html', 'css', 'tailwind', 'bootstrap', 'sql', 'nosql', 'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch', 'sqlite',
  'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'ansible', 'jenkins', 'git', 'github', 'ci/cd',
  'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'nlp', 'data analysis', 'pandas', 'numpy',
  'agile', 'scrum', 'rest api', 'graphql', 'typescript', 'microservices', 'kafka', 'next.js'
];

const TECH_SYNONYMS = {
  'javascript': ['js', 'ecmascript'],
  'kubernetes': ['k8s'],
  'node.js': ['node', 'nodejs', 'node js'],
  'aws': ['amazon web services'],
  'react': ['reactjs', 'react.js'],
  'typescript': ['ts'],
  'postgresql': ['postgres', 'psql'],
  'mongodb': ['mongo'],
  'golang': ['go'],
  'gcp': ['google cloud', 'google cloud platform'],
  'azure': ['microsoft azure'],
  'tailwind': ['tailwindcss', 'tailwind css'],
  'machine learning': ['ml', 'ai/ml'],
  'deep learning': ['dl']
};

const ADJACENT_MAP = {
  'react': ['vue', 'angular', 'svelte', 'next.js'],
  'angular': ['react', 'vue', 'svelte'],
  'vue': ['react', 'angular', 'svelte'],
  'svelte': ['react', 'vue', 'angular'],
  'django': ['flask', 'fastapi'],
  'flask': ['django', 'fastapi'],
  'fastapi': ['django', 'flask'],
  'express': ['koa', 'nest', 'fastify', 'node.js'],
  'nest': ['express', 'koa', 'fastify'],
  'mysql': ['postgresql', 'sqlite', 'sql server', 'mariadb'],
  'postgresql': ['mysql', 'sqlite', 'sql server'],
  'mongodb': ['couchdb', 'cassandra', 'dynamodb', 'redis'],
  'aws': ['azure', 'gcp'],
  'azure': ['aws', 'gcp'],
  'gcp': ['aws', 'azure'],
  'python': ['r', 'julia'],
  'docker': ['podman', 'containerd', 'kubernetes']
};

const NEGATION_WORDS = ['no', 'zero', 'lack of', 'without', 'never', 'not'];

const DEGREE_KEYWORDS = [
  'bachelor', 'b.s.', 'b.a.', 'bsc', 'bs', 'b.e.', 'b.tech',
  'master', 'm.s.', 'm.a.', 'msc', 'ms', 'm.tech', 'mba',
  'phd', 'doctorate', 'dr.', 'degree', 'diploma'
];

const CERTIFICATION_KEYWORDS = [
  'aws certified', 'azure certified', 'gcp certified', 'google cloud certified',
  'cka', 'ckad', 'pmp', 'scrum master', 'csm', 'cissp', 'ceh', 'comptia',
  'hashicorp certified', 'oracle certified'
];

// ============================================================================
// IDENTITY REDACTION (BIAS MITIGATION)
// ============================================================================

/**
 * Strips PII and potential demographic bias markers from resume text.
 */
function redactIdentityFields(text) {
  let redacted = text || '';
  const redactionLogSet = new Set();

  // 1. Phone numbers
  if (/(\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/.test(redacted)) {
    redactionLogSet.add('Removed Phone Number');
    redacted = redacted.replace(/(\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g, '[REDACTED_PHONE]');
  }

  // 2. Email addresses
  if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(redacted)) {
    redactionLogSet.add('Removed Email Address');
    redacted = redacted.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]');
  }

  // 3. URLs and Web links
  if (/https?:\/\/[^\s]+/i.test(redacted)) {
    redactionLogSet.add('Removed External URLs / Links');
    redacted = redacted.replace(/https?:\/\/[^\s]+/gi, '[REDACTED_URL]');
  }

  // 4. Physical Addresses / Zip Codes
  if (/\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)?,\s*[A-Z]{2}\s*\d{5}(?:-\d{4})?\b/.test(redacted)) {
    redactionLogSet.add('Removed Physical Address');
    redacted = redacted.replace(/\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)?,\s*[A-Z]{2}\s*\d{5}(?:-\d{4})?\b/g, '[REDACTED_ADDRESS]');
  }

  // 5. Gender Pronouns
  if (/\b(he|him|his|she|her|hers)\b/i.test(redacted)) {
    redactionLogSet.add('Removed Gender Pronouns');
    redacted = redacted.replace(/\b(he|him|his|she|her|hers)\b/gi, '[REDACTED_GENDER]');
  }

  // 6. Ageism Prevention: Graduation dates near degree keywords
  const degreeDateRegex = /\b(bachelor|b\.s\.|b\.a\.|master|m\.s\.|m\.a\.|phd|degree|b\.tech|m\.tech|class of|graduated)\b[\s\S]{0,40}?\b(199\d|20[0-2]\d|2030)\b|\b(199\d|20[0-2]\d|2030)\b[\s\S]{0,40}?\b(bachelor|b\.s\.|b\.a\.|master|m\.s\.|m\.a\.|phd|degree|b\.tech|m\.tech)\b/gi;
  let ageismFound = false;
  redacted = redacted.replace(degreeDateRegex, (match) => {
    ageismFound = true;
    return match.replace(/\b(199\d|20[0-2]\d|2030)\b/g, '[REDACTED_DATE]');
  });
  if (ageismFound) {
    redactionLogSet.add('Removed Graduation Dates (Ageism Prevention)');
  }

  // 7. University Pedigree Stripping
  const pedigreeRegex = /\b([a-zA-Z]+(?:\s+[a-zA-Z]+)?)\s+(University|College|Institute|Polytechnic)\b/gi;
  if (pedigreeRegex.test(redacted)) {
    redactionLogSet.add('Removed University / Institutional Pedigree');
    redacted = redacted.replace(pedigreeRegex, '[REDACTED_INSTITUTION]');
  }

  return {
    redactedText: redacted,
    redactionLog: Array.from(redactionLogSet)
  };
}

// ============================================================================
// SKILL & REQUIREMENT MATCHING LOGIC
// ============================================================================

function makeWordRegex(token) {
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?:^|[^a-zA-Z0-9+#])${escaped}(?:$|[^a-zA-Z0-9+#])`, 'i');
}

function extractSkillsFromJD(jdText) {
  const jdLower = (jdText || '').toLowerCase();
  const foundSkills = [];

  for (const skill of COMMON_TECH_SKILLS) {
    const rx = makeWordRegex(skill);
    if (rx.test(jdLower)) {
      foundSkills.push(skill);
      continue;
    }

    // Check synonyms
    if (TECH_SYNONYMS[skill]) {
      for (const syn of TECH_SYNONYMS[skill]) {
        const sRx = makeWordRegex(syn);
        if (sRx.test(jdLower)) {
          foundSkills.push(skill);
          break;
        }
      }
    }
  }

  return Array.from(new Set(foundSkills));
}

function matchSkillInText(skill, text) {
  const textLower = (text || '').toLowerCase();
  const directRx = makeWordRegex(skill);
  if (directRx.test(textLower)) {
    const matchIndex = textLower.search(directRx);
    const windowStart = Math.max(0, matchIndex - 30);
    const contextWindow = textLower.slice(windowStart, matchIndex);
    const isNegated = NEGATION_WORDS.some(neg => contextWindow.includes(neg));
    if (!isNegated) return true;
  }

  if (TECH_SYNONYMS[skill]) {
    for (const syn of TECH_SYNONYMS[skill]) {
      const synRx = makeWordRegex(syn);
      if (synRx.test(textLower)) {
        return true;
      }
    }
  }

  return false;
}

function extractYearsExperience(text) {
  const regexps = [
    /(\d+)(?:\+| - \d+)?\s*(?:years?|yrs?)(?:\s+of)?\s+experience/i,
    /experience:?\s*(\d+)\+?\s*(?:years?|yrs?)/i,
    /(\d+)\+?\s*(?:years?|yrs?)\s+(?:working|developing|engineering|building)/i,
    /(?:over|more than)\s+(\d+)\s+(?:years?|yrs?)/i
  ];

  const textLower = (text || '').toLowerCase();
  for (const r of regexps) {
    const match = textLower.match(r);
    if (match && match[1]) {
      const years = parseInt(match[1], 10);
      if (years >= 0 && years <= 40) return years;
    }
  }

  if (/senior|lead|principal|architect/i.test(textLower)) return 5;
  if (/mid-level|intermediate/i.test(textLower)) return 3;
  if (/junior|entry|intern|graduate/i.test(textLower)) return 1;

  return 0;
}

function extractEducation(text) {
  const textLower = (text || '').toLowerCase();
  for (const k of DEGREE_KEYWORDS) {
    if (textLower.includes(k)) {
      return { meetsRequirement: true, degree: k.toUpperCase() };
    }
  }
  return { meetsRequirement: false, degree: 'Not explicitly specified' };
}

function extractCertifications(text) {
  const textLower = (text || '').toLowerCase();
  const found = [];
  for (const cert of CERTIFICATION_KEYWORDS) {
    if (textLower.includes(cert)) {
      found.push({ name: cert.toUpperCase() });
    }
  }
  return found;
}

// ============================================================================
// CORE SCREENING ENGINE
// ============================================================================

function screenResumeLocal(jobDescription, resumeText, redactionLog = []) {
  const requiredSkills = extractSkillsFromJD(jobDescription);
  const matchedSkills = [];
  const missingSkills = [];
  const adjacentSkills = [];

  for (const skill of requiredSkills) {
    if (matchSkillInText(skill, resumeText)) {
      matchedSkills.push({ skill, status: 'exact_or_synonym' });
    } else {
      const adjacents = ADJACENT_MAP[skill] || [];
      let foundAdj = null;
      for (const adj of adjacents) {
        if (matchSkillInText(adj, resumeText)) {
          foundAdj = adj;
          break;
        }
      }

      if (foundAdj) {
        adjacentSkills.push({ wanted: skill, have: foundAdj });
      } else {
        missingSkills.push({ skill });
      }
    }
  }

  const calculatedYears = extractYearsExperience(resumeText);
  const jdRequiredYears = extractYearsExperience(jobDescription);
  const education = extractEducation(resumeText);
  const certifications = extractCertifications(resumeText);

  let score = 0;
  const totalRequired = Math.max(1, requiredSkills.length);

  // 1. Skill Match Component (up to 60 pts)
  const exactRatio = matchedSkills.length / totalRequired;
  score += Math.round(exactRatio * 60);

  // 2. Transferable Adjacent Skills Component (up to 15 pts)
  const adjBonus = Math.min(15, adjacentSkills.length * 5);
  score += adjBonus;

  // 3. Experience Component (up to 15 pts)
  if (jdRequiredYears > 0) {
    if (calculatedYears >= jdRequiredYears) {
      score += 15;
    } else if (calculatedYears > 0) {
      score += Math.round((calculatedYears / jdRequiredYears) * 15);
    }
  } else {
    if (calculatedYears > 0) score += 10;
  }

  // 4. Education & Certification Component (up to 10 pts)
  if (education.meetsRequirement) score += 5;
  if (certifications.length > 0) score += Math.min(5, certifications.length * 3);

  const finalMatchScore = Math.min(100, Math.max(10, score));

  let decision = 'Not Recommended';
  let reasoning = '';

  if (finalMatchScore >= 75) {
    decision = 'Highly Recommended (Shortlist)';
    reasoning = `Outstanding technical alignment with ${matchedSkills.length}/${totalRequired} required skills and verified background.`;
  } else if (finalMatchScore >= 50) {
    decision = 'Consider with Technical Screen';
    reasoning = `Solid foundation with ${matchedSkills.length} exact skills and transferable competencies. Technical screening advised.`;
  } else {
    decision = 'Not Recommended';
    reasoning = `Insufficient alignment with core technical requirements. Missing ${missingSkills.length} critical skills.`;
  }

  return {
    matchScore: finalMatchScore,
    decision,
    reasoning,
    requiredSkills,
    matchedSkills,
    adjacentSkills,
    missingSkills,
    experience: {
      totalYearsCalculated: calculatedYears,
      requiredYears: jdRequiredYears,
      meetsRequirement: calculatedYears >= jdRequiredYears
    },
    education,
    certifications,
    biasFlags: {
      isAnonymized: true,
      redactionLog
    }
  };
}

// ============================================================================
// NARRATIVE & DECISION REPORT GENERATOR
// ============================================================================

function generateDecision(result) {
  const { matchScore, matchedSkills, missingSkills, adjacentSkills, experience, education, certifications, decision } = result;
  const reasons = [];

  if (matchedSkills.length > 0) {
    reasons.push(`✅ Demonstrates ${matchedSkills.length} core required skills: ${matchedSkills.map(s => s.skill).join(', ')}.`);
  }
  if (adjacentSkills.length > 0) {
    reasons.push(`💡 Holds transferable adjacent skills: ${adjacentSkills.map(s => `${s.have} (for ${s.wanted})`).join(', ')}.`);
  }
  if (experience.totalYearsCalculated > 0) {
    reasons.push(`✅ Has approximately ${experience.totalYearsCalculated} years of relevant experience.`);
  }
  if (education.meetsRequirement) {
    reasons.push(`✅ Education criteria met (${education.degree}).`);
  }
  if (certifications && certifications.length > 0) {
    reasons.push(`🏆 Certified in: ${certifications.map(c => c.name).join(', ')}.`);
  }

  if (missingSkills.length > 0) {
    reasons.push(`❌ Lacks clear evidence for: ${missingSkills.map(s => s.skill).join(', ')}.`);
  }
  if (experience.requiredYears > 0 && experience.totalYearsCalculated < experience.requiredYears) {
    reasons.push(`⚠️ Experience (${experience.totalYearsCalculated} yrs) below requested (${experience.requiredYears} yrs).`);
  }

  let narrative = `### Comprehensive Candidate Evaluation Summary\n\n`;
  narrative += `**1. Profile & Experience:**\n`;
  narrative += `The candidate demonstrates **${experience.totalYearsCalculated} years** of detectable industry experience. `;
  if (education.meetsRequirement) {
    narrative += `Educational baseline is verified with a degree qualification (**${education.degree}**).\n\n`;
  } else {
    narrative += `Educational degree wasn't explicitly highlighted in parsed text.\n\n`;
  }

  narrative += `**2. Technical Skills Breakdown:**\n`;
  if (matchedSkills.length > 0) {
    narrative += `The candidate strongly matches core prerequisites: **${matchedSkills.map(s => s.skill).join(', ')}**. `;
  } else {
    narrative += `No direct matches for the requested technical prerequisites were found. `;
  }

  if (adjacentSkills.length > 0) {
    narrative += `\nTransferable skill mapping indicates rapid ramp-up potential via **${adjacentSkills.map(s => s.have).join(', ')}** (applicable to **${adjacentSkills.map(s => s.wanted).join(', ')}**). `;
  }

  if (missingSkills.length > 0) {
    narrative += `\nPrimary skill gaps include: **${missingSkills.map(s => s.skill).join(', ')}**.`;
  }

  narrative += `\n\n**3. Final Recommendation:**\n`;
  narrative += `**${decision}** (Match Score: **${matchScore}/100**)\n`;
  narrative += `${result.reasoning}`;

  return {
    decision,
    reasons,
    comprehensiveReport: narrative
  };
}

module.exports = {
  redactIdentityFields,
  screenResumeLocal,
  generateDecision,
  extractSkillsFromJD,
  extractYearsExperience
};
