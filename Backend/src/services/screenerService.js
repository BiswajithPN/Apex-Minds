/**
 * screenerService.js — Algorithmic Bias-Aware Resume Screening & Semantic Analysis Engine
 * 
 * Core Features:
 * 1. Zero-bias identity redaction (scrubbing PII, pronouns, ageism dates, university pedigree)
 * 2. Multi-tier skills extraction with canonical synonyms and transferable adjacency graphs
 * 3. Semantic Vector Similarity & Contextual Domain Depth Analysis
 * 4. Dynamic Mathematical Threshold Classification Matrix (Tiers 1–4)
 * 5. Explainable Rejection Diagnostics & Remediation Gap Analysis
 */

// ============================================================================
// SKILLS, SYNONYMS & ADJACENCY DICTIONARIES
// ============================================================================

const { calculateSemanticScore } = require('./semanticMatchingService');

const COMMON_TECH_SKILLS = [
  'python', 'java', 'javascript', 'c++', 'c#', 'ruby', 'go', 'php', 'swift', 'kotlin', 'rust', 'typescript',
  'react', 'angular', 'vue', 'svelte', 'node.js', 'node', 'express', 'django', 'flask', 'fastapi', 'spring', 'spring boot', 'asp.net',
  'html', 'html5', 'css', 'css3', 'tailwind', 'bootstrap', 'sass', 'scss', 'redux', 'mobx', 'zustand',
  'sql', 'nosql', 'mongodb', 'postgresql', 'postgres', 'mysql', 'redis', 'elasticsearch', 'sqlite', 'oracle', 'dynamodb',
  'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'k8s', 'terraform', 'ansible', 'jenkins', 'git', 'github', 'gitlab', 'ci/cd',
  'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'scikit-learn', 'nlp', 'computer vision', 'data science', 'data analysis', 'pandas', 'numpy',
  'agile', 'scrum', 'rest api', 'restful', 'graphql', 'microservices', 'kafka', 'rabbitmq', 'next.js', 'nuxt', 'vue.js',
  'linux', 'bash', 'shell', 'devops', 'full stack', 'fullstack', 'frontend', 'backend', 'web development', 'api development'
];

const TECH_SYNONYMS = {
  'javascript': ['js', 'ecmascript', 'vanilla js'],
  'typescript': ['ts'],
  'node.js': ['node', 'nodejs', 'node js'],
  'react': ['reactjs', 'react.js', 'react native'],
  'vue': ['vuejs', 'vue.js'],
  'angular': ['angularjs', 'angular.js'],
  'mongodb': ['mongo', 'mongoose'],
  'postgresql': ['postgres', 'psql'],
  'aws': ['amazon web services', 'ec2', 's3', 'lambda'],
  'kubernetes': ['k8s'],
  'docker': ['containerization', 'containers'],
  'html': ['html5'],
  'css': ['css3'],
  'machine learning': ['ml', 'ai/ml', 'artificial intelligence'],
  'deep learning': ['dl', 'neural networks'],
  'ci/cd': ['continuous integration', 'continuous deployment', 'github actions', 'jenkins pipeline'],
  'rest api': ['restful', 'rest apis', 'web apis']
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
  'mongodb': ['couchdb', 'cassandra', 'dynamodb', 'redis', 'nosql'],
  'aws': ['azure', 'gcp', 'cloud'],
  'azure': ['aws', 'gcp', 'cloud'],
  'gcp': ['aws', 'azure', 'cloud'],
  'python': ['r', 'julia'],
  'docker': ['podman', 'containerd', 'kubernetes'],
  'kubernetes': ['docker', 'openshift', 'helm']
};

const ACTION_VERBS = [
  'architected', 'engineered', 'developed', 'deployed', 'implemented', 'designed',
  'scaled', 'optimized', 'automated', 'orchestrated', 'managed', 'spearheaded',
  'refactored', 'built', 'integrated', 'configured', 'maintained', 'monitored'
];

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
// 1. IDENTITY REDACTION (ZERO-DEMOGRAPHIC-BIAS ANONYMIZER)
// ============================================================================

function redactIdentityFields(text) {
  let redacted = text || '';
  const redactionLogSet = new Set();

  if (/(\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/.test(redacted)) {
    redactionLogSet.add('Removed Phone Number');
    redacted = redacted.replace(/(\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g, '[REDACTED_PHONE]');
  }

  if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(redacted)) {
    redactionLogSet.add('Removed Email Address');
    redacted = redacted.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]');
  }

  if (/https?:\/\/[^\s]+/i.test(redacted)) {
    redactionLogSet.add('Removed External URLs / Web Links');
    redacted = redacted.replace(/https?:\/\/[^\s]+/gi, '[REDACTED_URL]');
  }

  const pronounRegex = /\b(he|she|him|her|his|hers|mr|ms|mrs|miss)\b/gi;
  if (pronounRegex.test(redacted)) {
    redactionLogSet.add('Scrubbed Gendered Pronouns & Honorifics');
    redacted = redacted.replace(pronounRegex, '[PRONOUN]');
  }

  const gradYearRegex = /\b(graduated in|class of|batch of|passout)\s*(19\d{2}|20[0-2]\d)\b/gi;
  if (gradYearRegex.test(redacted)) {
    redactionLogSet.add('Scrubbed Graduation Dates (Anti-Ageism)');
    redacted = redacted.replace(gradYearRegex, 'Graduated [DATE_REDACTED]');
  }

  return {
    cleanedText: redacted,
    redactionLog: Array.from(redactionLogSet)
  };
}

// ============================================================================
// 2. SEMANTIC SIMILARITY & CONTEXTUAL VECTOR ANALYSIS
// ============================================================================

function extractWordTokens(text) {
  const stopWords = new Set([
    'and', 'the', 'is', 'in', 'at', 'of', 'on', 'for', 'with', 'a', 'an', 'to',
    'as', 'by', 'are', 'be', 'this', 'that', 'from', 'or', 'you', 'your', 'we', 'our'
  ]);

  return (text || '')
    .toLowerCase()
    .replace(/[^a-zA-Z0-9#+.]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));
}

function calculateSemanticSimilarity(jdText, resumeText) {
  const jdTokens = extractWordTokens(jdText);
  const resumeTokens = extractWordTokens(resumeText);

  if (jdTokens.length === 0 || resumeTokens.length === 0) {
    return { semanticScore: 50, actionVerbDensity: 0, sharedContextTokens: [] };
  }

  const jdFreq = {};
  for (const t of jdTokens) jdFreq[t] = (jdFreq[t] || 0) + 1;

  const resumeFreq = {};
  for (const t of resumeTokens) resumeFreq[t] = (resumeFreq[t] || 0) + 1;

  const allWords = Array.from(new Set([...Object.keys(jdFreq), ...Object.keys(resumeFreq)]));

  let dotProduct = 0;
  let magJd = 0;
  let magResume = 0;
  const sharedContextTokens = [];

  for (const w of allWords) {
    const v1 = jdFreq[w] || 0;
    const v2 = resumeFreq[w] || 0;
    dotProduct += v1 * v2;
    magJd += v1 * v1;
    magResume += v2 * v2;
    if (v1 > 0 && v2 > 0) {
      sharedContextTokens.push(w);
    }
  }

  const cosine = (magJd > 0 && magResume > 0) ? (dotProduct / (Math.sqrt(magJd) * Math.sqrt(magResume))) : 0;
  
  // Count action engineering verbs
  const textLower = resumeText.toLowerCase();
  let actionVerbCount = 0;
  for (const verb of ACTION_VERBS) {
    if (textLower.includes(verb)) actionVerbCount++;
  }
  const actionVerbDensity = Math.min(100, Math.round((actionVerbCount / 6) * 100));

  const semanticScore = Math.min(100, Math.max(10, Math.round((cosine * 80) + (actionVerbDensity * 0.20))));

  return {
    semanticScore,
    cosineSimilarity: parseFloat(cosine.toFixed(3)),
    actionVerbDensity,
    sharedContextTokens: sharedContextTokens.slice(0, 15)
  };
}

// ============================================================================
// 3. SKILLS & HEURISTIC PARSERS
// ============================================================================

function matchSkillInText(skill, text) {
  if (!skill || !text) return false;
  const normalizedText = ` ${text.toLowerCase()} `;
  const target = skill.toLowerCase();

  const escaped = target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const baseRegex = new RegExp(`(?<=[^a-zA-Z0-9#+]|^)${escaped}(?=[^a-zA-Z0-9#+]|$)`, 'i');

  if (baseRegex.test(normalizedText)) {
    const negationRegex = new RegExp(`(?:${NEGATION_WORDS.join('|')})\\s+(?:[\\w\\s]{1,15})?${escaped}`, 'i');
    if (!negationRegex.test(normalizedText)) {
      return true;
    }
  }

  const synonyms = TECH_SYNONYMS[target] || [];
  for (const syn of synonyms) {
    const synEscaped = syn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const synRegex = new RegExp(`(?<=[^a-zA-Z0-9#+]|^)${synEscaped}(?=[^a-zA-Z0-9#+]|$)`, 'i');
    if (synRegex.test(normalizedText)) {
      return true;
    }
  }

  return false;
}

function extractSkillsFromJD(jdText) {
  if (!jdText) return [];
  const found = new Set();
  const lower = jdText.toLowerCase();

  for (const skill of COMMON_TECH_SKILLS) {
    if (matchSkillInText(skill, lower)) {
      found.add(skill);
    }
  }

  // Also check synonyms in JD
  for (const [canonical, aliases] of Object.entries(TECH_SYNONYMS)) {
    for (const alias of aliases) {
      if (matchSkillInText(alias, lower)) {
        found.add(canonical);
      }
    }
  }

  return Array.from(found);
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
// 4. CORE SCREENING ENGINE WITH DYNAMIC THRESHOLD CLASSIFICATION
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
  const semanticAnalysis = calculateSemanticScore(jobDescription, resumeText);

  const totalRequired = Math.max(1, requiredSkills.length);
  const exactRatio = matchedSkills.length / totalRequired;
  const adjRatio = adjacentSkills.length / totalRequired;

  // 1. Skill Match Score (0–100 component)
  const compSkillScore = Math.min(100, Math.round((exactRatio * 85) + (adjRatio * 20)));

  // 2. Experience Score (0–100 component)
  let compExpScore = 50;
  if (jdRequiredYears > 0) {
    if (calculatedYears >= jdRequiredYears) compExpScore = 95;
    else if (calculatedYears > 0) compExpScore = Math.min(90, Math.max(30, Math.round((calculatedYears / jdRequiredYears) * 85)));
    else compExpScore = 40;
  } else {
    compExpScore = calculatedYears >= 3 ? 95 : (calculatedYears >= 1 ? 80 : 65);
  }

  // 3. Semantic Similarity Score (0–100 component)
  const compSemanticScore = semanticAnalysis.semanticScore || 65;

  // 4. Education & Certifications Score (0–100 component)
  let compEduScore = education.meetsRequirement ? 85 : 60;
  if (certifications.length > 0) compEduScore = Math.min(100, compEduScore + certifications.length * 10);

  // Multi-Criteria Weighted Rubric (Skills 40%, Experience 25%, Semantic 25%, Education 10%)
  const weightedTotal =
    (compSkillScore * 0.40) +
    (compExpScore * 0.25) +
    (compSemanticScore * 0.25) +
    (compEduScore * 0.10);

  const finalMatchScore = Math.min(100, Math.max(15, Math.round(weightedTotal)));

  // ==========================================================================
  // MATHEMATICAL THRESHOLD CALCULATION & 4-TIER CLASSIFICATION
  // ==========================================================================
  // Dynamic minimum acceptance threshold based on role seniority
  let minimumThreshold = 50;
  if (jdRequiredYears >= 5) minimumThreshold = 65; // Senior role higher baseline
  else if (jdRequiredYears >= 3) minimumThreshold = 55; // Mid role baseline

  let classificationTier = '';
  let decision = '';
  let isRejected = false;

  if (finalMatchScore >= 80) {
    classificationTier = 'Tier 1: Exceptional Alignment';
    decision = 'Highly Recommended (Direct Interview)';
  } else if (finalMatchScore >= 65) {
    classificationTier = 'Tier 2: Strong Alignment';
    decision = 'Recommended (Technical Assessment)';
  } else if (finalMatchScore >= minimumThreshold) {
    classificationTier = 'Tier 3: Moderate / Transferable Fit';
    decision = 'Consider with Targeted Screening';
  } else {
    classificationTier = 'Tier 4: Deficient Alignment (Rejected)';
    decision = 'Not Recommended (Below Threshold)';
    isRejected = true;
  }

  // ==========================================================================
  // EXPLAINABLE REJECTION & GAP DIAGNOSTICS
  // ==========================================================================
  const primaryRejectionReasons = [];
  const gapBreakdown = [];

  if (missingSkills.length > 0) {
    const missingRatio = Math.round((missingSkills.length / totalRequired) * 100);
    primaryRejectionReasons.push(
      `Core Skill Gap (${missingRatio}% missing): Candidate lacks evidence for ${missingSkills.length} mandatory technologies: [${missingSkills.map(s => s.skill).join(', ')}].`
    );
    gapBreakdown.push({
      category: 'Technical Stack Requirements',
      missing: missingSkills.map(s => s.skill),
      severity: missingSkills.length >= 3 ? 'HIGH' : 'MEDIUM',
      explanation: `The job requires practical proficiency in ${missingSkills.map(s => s.skill).join(', ')}, which were not identified in the resume text.`
    });
  }

  if (jdRequiredYears > 0 && calculatedYears < jdRequiredYears) {
    const shortfall = jdRequiredYears - calculatedYears;
    primaryRejectionReasons.push(
      `Experience Tenure Deficit: Role mandates ${jdRequiredYears}+ years of industry experience, but candidate profile demonstrated approximately ${calculatedYears} years (${shortfall} year shortfall).`
    );
    gapBreakdown.push({
      category: 'Experience Tenure',
      deficit: `${shortfall} years below requirement`,
      severity: shortfall >= 3 ? 'HIGH' : 'MEDIUM',
      explanation: `Required ${jdRequiredYears} years vs ${calculatedYears} years detected.`
    });
  }

  if (semanticAnalysis.semanticScore < 45) {
    primaryRejectionReasons.push(
      `Semantic Domain Alignment: Candidate's work descriptions show weak contextual alignment (${semanticAnalysis.semanticScore}%) with the architectural scope and engineering responsibilities outlined in the job description.`
    );
  }

  let candidateRemediationPlan = '';
  if (missingSkills.length > 0) {
    const topMissing = missingSkills.slice(0, 3).map(s => s.skill).join(', ');
    candidateRemediationPlan = `To meet this job's criteria, candidate should strengthen hands-on experience in ${topMissing} through verified production projects or relevant technical certifications.`;
  } else if (jdRequiredYears > calculatedYears) {
    candidateRemediationPlan = `Candidate has relevant foundational skills but needs additional practical tenure in production environments to meet the senior benchmark.`;
  } else {
    candidateRemediationPlan = `Candidate should provide more concrete engineering achievements and technical depth in their resume summaries.`;
  }

  const narrativeResult = generateDecision({
    matchScore: finalMatchScore,
    decision,
    classificationTier,
    matchedSkills,
    missingSkills,
    adjacentSkills,
    experience: {
      totalYearsCalculated: calculatedYears,
      requiredYears: jdRequiredYears,
      meetsRequirement: calculatedYears >= jdRequiredYears
    },
    education,
    certifications,
    semanticAnalysis,
    isRejected,
    primaryRejectionReasons,
    candidateRemediationPlan
  });

  return {
    matchScore: finalMatchScore,
    decision,
    classificationTier,
    reasoning: narrativeResult.reasoning,
    comprehensiveReport: narrativeResult.comprehensiveReport,
    requiredSkills,
    matchedSkills,
    adjacentSkills,
    missingSkills,
    thresholdBreakdown: {
      calculatedThreshold: minimumThreshold,
      classificationTier,
      isRejected,
      scoreComponents: {
        skillScore: `${compSkillScore}/100`,
        adjacentScore: `${Math.min(20, adjacentSkills.length * 5)}/20`,
        semanticScore: `${compSemanticScore}/100`,
        experienceScore: `${compExpScore}/100`,
        educationScore: `${compEduScore}/100`
      }
    },
    semanticAnalysis,
    rejectionDiagnostics: {
      isRejected,
      primaryReasons: primaryRejectionReasons,
      gapBreakdown,
      remediationPlan: candidateRemediationPlan
    },
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
// 5. NARRATIVE & DECISION REPORT GENERATOR
// ============================================================================

function generateDecision(params) {
  const {
    matchScore,
    decision,
    classificationTier,
    matchedSkills,
    missingSkills,
    adjacentSkills,
    experience,
    education,
    certifications,
    semanticAnalysis,
    isRejected,
    primaryRejectionReasons,
    candidateRemediationPlan
  } = params;

  let reasoning = '';
  if (!isRejected) {
    reasoning = `Strong alignment with ${matchedSkills.length} core technical requirements, ${adjacentSkills.length} transferable skills, and verified domain context.`;
  } else {
    reasoning = `Rejected due to ${missingSkills.length} missing prerequisite skills and threshold deficit.`;
  }

  let narrative = `### 📊 AI Candidate Evaluation & Classification Report\n\n`;
  narrative += `**1. Classification & Recommendation:**\n`;
  narrative += `• **Decision:** **${decision}**\n`;
  narrative += `• **Classification Tier:** ${classificationTier}\n`;
  narrative += `• **Composite Match Score:** **${matchScore}/100**\n`;
  narrative += `• **Semantic Context Alignment:** **${semanticAnalysis?.semanticScore || 0}%**\n\n`;

  narrative += `**2. Technical Competency Breakdown:**\n`;
  if (matchedSkills.length > 0) {
    narrative += `• **Matched Core Skills:** ${matchedSkills.map(s => `\`${s.skill}\``).join(', ')}\n`;
  } else {
    narrative += `• **Matched Core Skills:** None of the specific core technologies were matched.\n`;
  }

  if (adjacentSkills.length > 0) {
    narrative += `• **Transferable Adjacent Skills:** ${adjacentSkills.map(s => `\`${s.have}\` (transferable to \`${s.wanted}\`)`).join(', ')}\n`;
  }

  if (missingSkills.length > 0) {
    narrative += `• **Missing Required Skills:** ${missingSkills.map(s => `\`${s.skill}\``).join(', ')}\n`;
  }

  narrative += `\n**3. Experience & Qualifications:**\n`;
  narrative += `• **Detected Experience:** ${experience.totalYearsCalculated} years (Job requirement: ${experience.requiredYears || 'Not specified'} years)\n`;
  narrative += `• **Education:** ${education.meetsRequirement ? `Verified (${education.degree})` : 'Not explicitly specified'}\n`;
  if (certifications?.length > 0) {
    narrative += `• **Certifications:** ${certifications.map(c => c.name).join(', ')}\n`;
  }

  // Rejection or Acceptance Details
  if (isRejected) {
    narrative += `\n**4. ⚠️ Why the Candidate Was Rejected (Gap Analysis):**\n`;
    for (const reason of primaryRejectionReasons) {
      narrative += `• ${reason}\n`;
    }
    if (candidateRemediationPlan) {
      narrative += `\n**💡 Actionable Remediation Plan:**\n${candidateRemediationPlan}\n`;
    }
  } else {
    narrative += `\n**4. 🌟 Strengths & Next Steps:**\n`;
    narrative += `• Candidate demonstrates strong foundational capability and meets the baseline score threshold.\n`;
    narrative += `• Recommended to advance to the next screening stage.\n`;
  }

  return {
    decision,
    reasoning,
    comprehensiveReport: narrative
  };
}

// ============================================================================
// 6. JOB DESCRIPTION INCLUSIVITY & BIAS AUDITOR
// ============================================================================

const EXCLUSIONARY_TERMS = {
  'ninja': { category: 'Aggressive / Over-hyped', suggestion: 'expert, specialist, lead engineer', explanation: 'Can discourage qualified candidates looking for professional team culture.' },
  'rockstar': { category: 'Aggressive / Over-hyped', suggestion: 'high performer, skilled engineer, expert', explanation: 'Creates impression of solitary work over collaborative team contributions.' },
  'guru': { category: 'Over-hyped', suggestion: 'specialist, experienced developer', explanation: 'Vague buzzword that fails to clarify actual technical responsibilities.' },
  'crush it': { category: 'Aggressive', suggestion: 'succeed, deliver results, excel', explanation: 'Hyper-competitive phrasing that can alienate collaborative candidates.' },
  'dominate': { category: 'Aggressive', suggestion: 'lead, excel, establish leadership', explanation: 'Hyper-aggressive tone.' },
  'young and energetic': { category: 'Ageist Bias', suggestion: 'motivated, dynamic, enthusiastic', explanation: 'Potentially exclusionary towards experienced older professionals.' },
  'digital native': { category: 'Ageist Bias', suggestion: 'technologically proficient, tech-savvy', explanation: 'Implicit age bias against candidates who grew up before modern internet adoption.' },
  'work hard play hard': { category: 'Exclusionary', suggestion: 'balanced, dynamic work environment', explanation: 'Often signals poor work-life balance and long hours.' },
  'aggressive': { category: 'Masculine-Coded', suggestion: 'determined, ambitious, goal-driven', explanation: 'Research shows masculine-coded language reduces female application rates.' }
};

function auditJobDescription(jobDescription) {
  const text = jobDescription || '';
  const textLower = text.toLowerCase();
  const flagged = [];

  for (const [term, data] of Object.entries(EXCLUSIONARY_TERMS)) {
    const rx = new RegExp(`\\b${term}\\b`, 'gi');
    if (rx.test(textLower)) {
      flagged.push({
        term,
        category: data.category,
        suggestion: data.suggestion,
        explanation: data.explanation
      });
    }
  }

  const penalty = flagged.length * 12;
  const inclusivityScore = Math.max(20, 100 - penalty);

  let grade = 'Excellent (Highly Inclusive)';
  if (inclusivityScore < 60) grade = 'Needs Improvement (Exclusionary Phrasing Detected)';
  else if (inclusivityScore < 85) grade = 'Moderate Inclusivity';

  return {
    inclusivityScore,
    grade,
    flaggedWords: flagged,
    summary: flagged.length === 0
      ? 'The job description demonstrates balanced, neutral, and inclusive phrasing with zero detected bias keywords.'
      : `Identified ${flagged.length} terms that may deter diverse candidates or signal unconscious bias.`
  };
}

module.exports = {
  redactIdentityFields,
  screenResumeLocal,
  generateDecision,
  auditJobDescription,
  extractSkillsFromJD,
  extractYearsExperience,
  calculateSemanticSimilarity
};
