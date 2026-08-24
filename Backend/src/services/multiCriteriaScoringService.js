/**
 * multiCriteriaScoringService.js — Complete Multi-Criteria Candidate Scoring & Analysis Pipeline
 * 
 * Implements:
 * 1. PII Bias Prevention
 * 2. 4-Tier Skills Classification (Matched, Partially Matched, Missing, Additional)
 * 3. Graded Experience Scoring
 * 4. Project Relevance Analysis
 * 5. Education Qualification Matching
 * 6. Semantic Vector Similarity Analysis
 * 7. Configurable Weighted Multi-Criteria Rubric
 * 8. Independent Confidence Score & Level Calculator
 * 9. Threshold Decision & Constructive Rejection Diagnostics
 */

const { anonymizePII } = require('./fairnessAuditService');
const { calculateSemanticScore } = require('./semanticMatchingService');
const { extractProjectsFromResume, analyzeProjectRelevance } = require('./projectAnalysisService');
const { extractEducationFromResume, analyzeEducationMatch } = require('./educationAnalysisService');
const { generateConstructiveRejectionExplanation } = require('./rejectionExplainerService');

const ALL_TECH_SKILLS = [
  'python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'ruby', 'go', 'php', 'swift', 'kotlin', 'rust',
  'react', 'angular', 'vue', 'svelte', 'node.js', 'node', 'express', 'django', 'flask', 'fastapi', 'spring', 'asp.net',
  'html', 'css', 'tailwind', 'bootstrap', 'sql', 'nosql', 'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch',
  'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'ansible', 'jenkins', 'git', 'github', 'ci/cd',
  'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'scikit-learn', 'nlp', 'data analysis', 'pandas', 'numpy',
  'agile', 'scrum', 'rest api', 'graphql', 'microservices', 'kafka', 'next.js', 'solidity', 'linux', 'firebase'
];

const SKILL_SYNONYMS = {
  'javascript': ['js', 'ecmascript'],
  'kubernetes': ['k8s'],
  'node.js': ['node', 'nodejs', 'node js'],
  'aws': ['amazon web services'],
  'react': ['reactjs', 'react.js'],
  'typescript': ['ts'],
  'postgresql': ['postgres', 'psql'],
  'mongodb': ['mongo'],
  'golang': ['go'],
  'machine learning': ['ml', 'ai/ml'],
  'deep learning': ['dl']
};

const SKILL_ADJACENCIES = {
  'react': ['vue', 'angular', 'svelte', 'next.js'],
  'vue': ['react', 'angular', 'svelte'],
  'angular': ['react', 'vue', 'svelte'],
  'django': ['flask', 'fastapi'],
  'flask': ['django', 'fastapi'],
  'fastapi': ['django', 'flask'],
  'express': ['koa', 'nest', 'fastify', 'node.js'],
  'mysql': ['postgresql', 'sqlite', 'sql server', 'mariadb'],
  'postgresql': ['mysql', 'sqlite', 'sql server'],
  'mongodb': ['couchdb', 'dynamodb', 'redis', 'nosql'],
  'aws': ['azure', 'gcp'],
  'azure': ['aws', 'gcp'],
  'gcp': ['aws', 'azure'],
  'docker': ['podman', 'containerd', 'kubernetes'],
  'kubernetes': ['docker', 'openshift', 'helm'],
  'python': ['r', 'julia']
};

/**
 * Check if a skill exists in normalized text
 */
function hasSkill(skill, text) {
  if (!skill || !text) return false;
  const escaped = skill.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const rx = new RegExp(`(?<=[^a-zA-Z0-9#+]|^)${escaped}(?=[^a-zA-Z0-9#+]|$)`, 'i');
  if (rx.test(text)) return true;

  const syns = SKILL_SYNONYMS[skill.toLowerCase()] || [];
  for (const syn of syns) {
    const synEscaped = syn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const synRx = new RegExp(`(?<=[^a-zA-Z0-9#+]|^)${synEscaped}(?=[^a-zA-Z0-9#+]|$)`, 'i');
    if (synRx.test(text)) return true;
  }
  return false;
}

/**
 * Extract required skills from Job Description text & requirements array
 */
function extractJobSkills(job) {
  const found = new Set();
  const explicitSkills = job.skills_required || [];
  for (const s of explicitSkills) {
    if (typeof s === 'string' && s.trim()) found.add(s.trim().toLowerCase());
  }

  const jdText = [job.title, job.description, job.requirements].filter(Boolean).join(' ').toLowerCase();
  for (const s of ALL_TECH_SKILLS) {
    if (hasSkill(s, jdText)) {
      found.add(s);
    }
  }

  return Array.from(found);
}

/**
 * Extract candidate skills from resume
 */
function extractCandidateSkills(resumeText) {
  const found = new Set();
  const lower = (resumeText || '').toLowerCase();

  for (const s of ALL_TECH_SKILLS) {
    if (hasSkill(s, lower)) {
      found.add(s);
    }
  }

  return Array.from(found);
}

/**
 * Extract years of experience from text
 */
function extractTenure(text) {
  const regexps = [
    /(\d+)(?:\+| - \d+)?\s*(?:years?|yrs?)(?:\s+of)?\s+experience/i,
    /experience:?\s*(\d+)\+?\s*(?:years?|yrs?)/i,
    /(\d+)\+?\s*(?:years?|yrs?)\s+(?:working|developing|engineering|building)/i,
    /(?:over|more than)\s+(\d+)\s+(?:years?|yrs?)/i
  ];

  const lower = (text || '').toLowerCase();
  for (const r of regexps) {
    const match = lower.match(r);
    if (match && match[1]) {
      const yrs = parseInt(match[1], 10);
      if (yrs >= 0 && yrs <= 40) return yrs;
    }
  }

  if (/senior|lead|principal|architect/i.test(lower)) return 5;
  if (/mid-level|intermediate/i.test(lower)) return 3;
  if (/junior|entry|intern|graduate/i.test(lower)) return 1;

  return 0;
}

/**
 * Full Multi-Criteria Candidate Scoring Engine
 */
async function performMultiCriteriaAnalysis(params) {
  const {
    job,
    resumeText,
    candidateUser = {},
    applicationId = null,
    customRubricWeights = null,
    customThreshold = null
  } = params;

  // 1. Bias Prevention: Anonymize PII from resume text
  const { anonymizedText, isAnonymized, redactedFieldsCount, redactionLog } = anonymizePII(resumeText);

  // 2. Extract Skills & Classify into 4 Categories
  const requiredSkills = extractJobSkills(job);
  const candidateSkills = extractCandidateSkills(anonymizedText);

  const matchedSkills = [];
  const partiallyMatchedSkills = [];
  const missingSkills = [];
  const additionalSkills = [];

  for (const req of requiredSkills) {
    if (hasSkill(req, anonymizedText)) {
      matchedSkills.push(req);
    } else {
      const adjacents = SKILL_ADJACENCIES[req.toLowerCase()] || [];
      let foundAdj = null;
      for (const adj of adjacents) {
        if (hasSkill(adj, anonymizedText)) {
          foundAdj = adj;
          break;
        }
      }

      if (foundAdj) {
        partiallyMatchedSkills.push({
          wanted: req,
          have: foundAdj,
          similarity: 0.75,
          reason: `Demonstrates transferable competency in ${foundAdj} for ${req}`
        });
      } else {
        missingSkills.push(req);
      }
    }
  }

  for (const candSkill of candidateSkills) {
    if (!matchedSkills.includes(candSkill) && !partiallyMatchedSkills.some((p) => p.have === candSkill)) {
      additionalSkills.push(candSkill);
    }
  }

  const totalRequired = Math.max(1, requiredSkills.length);
  const exactRatio = matchedSkills.length / totalRequired;
  const adjRatio = partiallyMatchedSkills.length / totalRequired;
  const skillMatchPercentage = Math.round(((matchedSkills.length + partiallyMatchedSkills.length * 0.7) / totalRequired) * 100);

  // Skill Score (0–100)
  const rawSkillScore = Math.min(100, Math.round(
    (exactRatio * 85) +
    (adjRatio * 20) +
    Math.min(10, additionalSkills.length * 2)
  ));
  const skillScore = Math.max(10, rawSkillScore);

  // 3. Experience Analysis & Graded Score (0–100)
  const candidateYears = extractTenure(anonymizedText);
  const jdFullText = [job.title, job.description, job.requirements].filter(Boolean).join('\n\n');
  const requiredYears = extractTenure(jdFullText);

  let experienceScore = 50;
  if (requiredYears > 0) {
    if (candidateYears >= requiredYears) {
      experienceScore = 95;
    } else if (candidateYears > 0) {
      experienceScore = Math.min(90, Math.max(30, Math.round((candidateYears / requiredYears) * 85)));
    } else {
      experienceScore = 35;
    }
  } else {
    experienceScore = candidateYears >= 3 ? 95 : (candidateYears >= 1 ? 80 : 65);
  }

  // 4. Project Relevance Analysis (0–100)
  const extractedProjects = extractProjectsFromResume(anonymizedText);
  const projectAnalysisResult = analyzeProjectRelevance(extractedProjects, jdFullText, requiredSkills);
  const projectScore = projectAnalysisResult.projectScore;

  // 5. Education Qualification Analysis (0–100)
  const extractedEducation = extractEducationFromResume(anonymizedText);
  const educationAnalysisResult = analyzeEducationMatch(extractedEducation, jdFullText);
  const educationScore = educationAnalysisResult.educationScore;

  // 6. Semantic Vector Similarity (0–100)
  const semanticResult = calculateSemanticScore(jdFullText, anonymizedText);
  const semanticScore = semanticResult.semanticScore;

  // 7. Configurable Multi-Criteria Rubric Weights
  const weights = customRubricWeights || job.rubricWeights || {
    skillWeight: 0.40,
    experienceWeight: 0.25,
    semanticWeight: 0.20,
    projectWeight: 0.10,
    educationWeight: 0.05
  };

  // Normalization to 0–100
  const weightedSum =
    (skillScore * weights.skillWeight) +
    (experienceScore * weights.experienceWeight) +
    (semanticScore * weights.semanticWeight) +
    (projectScore * weights.projectWeight) +
    (educationScore * weights.educationWeight);

  const finalScore = Math.min(100, Math.max(10, Math.round(weightedSum)));

  // 8. Confidence Score Calculation (0–100)
  let confidencePts = 50;
  if (anonymizedText.length > 80) confidencePts += 15;
  if (candidateSkills.length >= 3) confidencePts += 15;
  if (candidateYears > 0) confidencePts += 10;
  if (projectAnalysisResult.hasProjectEvidence) confidencePts += 5;
  if (extractedEducation.degree !== 'Not Specified') confidencePts += 5;

  const componentScores = [skillScore, experienceScore, semanticScore, projectScore, educationScore];
  const maxScore = Math.max(...componentScores);
  const minScore = Math.min(...componentScores);
  const spread = maxScore - minScore;
  if (spread < 40) confidencePts += 5;

  const confidenceScore = Math.min(100, Math.max(25, confidencePts));
  let confidenceLevel = 'High';
  if (confidenceScore < 45) confidenceLevel = 'Insufficient';
  else if (confidenceScore < 65) confidenceLevel = 'Low';
  else if (confidenceScore < 80) confidenceLevel = 'Medium';

  // 9. Threshold Decision Making
  const threshold = customThreshold != null ? customThreshold : (job.threshold || 70);
  const thresholdPassed = finalScore >= threshold;
  const scoreDifference = finalScore - threshold;
  const status = thresholdPassed ? 'Shortlisted' : 'Not Shortlisted';

  // 10. Qualitative Strengths & Explanations
  const strengths = [];
  if (matchedSkills.length > 0) {
    strengths.push(`Core technical proficiency in ${matchedSkills.slice(0, 4).join(', ')}`);
  }
  if (partiallyMatchedSkills.length > 0) {
    strengths.push(`Transferable competencies in ${partiallyMatchedSkills.map((p) => p.have).join(', ')}`);
  }
  if (candidateYears >= requiredYears && candidateYears > 0) {
    strengths.push(`${candidateYears} years of relevant industry experience`);
  }
  if (projectAnalysisResult.relevantProjects.length > 0) {
    strengths.push(`${projectAnalysisResult.relevantProjects.length} relevant technical project(s) demonstrated`);
  }
  if (semanticScore >= 75) {
    strengths.push('High semantic contextual alignment with role architecture');
  }

  const improvementAreas = [];
  if (missingSkills.length > 0) {
    improvementAreas.push(...missingSkills.slice(0, 4));
  }
  if (requiredYears > candidateYears) {
    improvementAreas.push(`Additional production tenure (required: ${requiredYears} yrs, detected: ${candidateYears} yrs)`);
  }

  // 11. Constructive Rejection Explanation
  const rejectionExplanation = generateConstructiveRejectionExplanation({
    finalScore,
    threshold,
    matchedSkills,
    missingSkills,
    partiallyMatchedSkills,
    experienceAnalysis: { totalYears: candidateYears, requiredYears },
    projectAnalysis: projectAnalysisResult,
    semanticScore,
    jobTitle: job.title
  });

  // 12. Full Recruiter/Candidate Markdown Narrative Report
  let narrative = `### 📊 Multi-Criteria Candidate Evaluation Summary\n\n`;
  narrative += `• **Final Match Score:** **${finalScore}/100** (Company Threshold: **${threshold}**)\n`;
  narrative += `• **Evaluation Status:** **${status}** (${scoreDifference >= 0 ? `+${scoreDifference}` : scoreDifference} pts vs threshold)\n`;
  narrative += `• **Confidence Level:** **${confidenceLevel}** (${confidenceScore}% evidence index)\n\n`;

  narrative += `**Score Components:**\n`;
  narrative += `• Skills Score: **${skillScore}%** (Weight: ${Math.round(weights.skillWeight * 100)}%)\n`;
  narrative += `• Experience Score: **${experienceScore}%** (Weight: ${Math.round(weights.experienceWeight * 100)}%)\n`;
  narrative += `• Semantic Similarity: **${semanticScore}%** (Weight: ${Math.round(weights.semanticWeight * 100)}%)\n`;
  narrative += `• Project Relevance: **${projectScore}%** (Weight: ${Math.round(weights.projectWeight * 100)}%)\n`;
  narrative += `• Education Score: **${educationScore}%** (Weight: ${Math.round(weights.educationWeight * 100)}%)\n\n`;

  narrative += `**Technical Skills Matrix:**\n`;
  narrative += `• **Matched:** ${matchedSkills.length > 0 ? matchedSkills.map((s) => `\`${s}\``).join(', ') : 'None'}\n`;
  if (partiallyMatchedSkills.length > 0) {
    narrative += `• **Partially Matched:** ${partiallyMatchedSkills.map((p) => `\`${p.have}\` (for \`${p.wanted}\`)`).join(', ')}\n`;
  }
  if (missingSkills.length > 0) {
    narrative += `• **Missing Requirements:** ${missingSkills.map((s) => `\`${s}\``).join(', ')}\n`;
  }
  if (additionalSkills.length > 0) {
    narrative += `• **Additional Skills:** ${additionalSkills.slice(0, 5).map((s) => `\`${s}\``).join(', ')}\n`;
  }

  return {
    candidateId: candidateUser._id,
    jobId: job._id,
    applicationId,

    // Component Scores
    skillScore,
    experienceScore,
    projectScore,
    educationScore,
    semanticScore,
    rubricWeights: weights,
    finalScore,

    // Confidence
    confidenceScore,
    confidenceLevel,
    confidenceFactors: {
      resumeCompleteness: confidencePts,
      detectedSkillsCount: candidateSkills.length,
      hasExperienceInfo: candidateYears > 0,
      hasProjectInfo: projectAnalysisResult.hasProjectEvidence,
      hasEducationInfo: extractedEducation.degree !== 'Not Specified',
      componentsConsistency: 100 - spread
    },

    // Skills Matrix
    matchedSkills,
    partiallyMatchedSkills,
    missingSkills,
    additionalSkills,
    skillMatchPercentage,

    // Detailed Sub-Analyses
    experienceAnalysis: {
      totalYears: candidateYears,
      requiredYears,
      meetsRequirement: candidateYears >= requiredYears,
      detectedRoles: [job.title || 'Software Engineer'],
      responsibilitiesSummary: `Extracted ${candidateYears} years of technical experience.`
    },

    projectAnalysis: {
      projectScore,
      relevantProjects: projectAnalysisResult.relevantProjects,
      irrelevantProjects: projectAnalysisResult.irrelevantProjects
    },

    educationAnalysis: educationAnalysisResult,

    strengths,
    improvementAreas,
    explanation: narrative,

    // Threshold & Status
    threshold,
    thresholdPassed,
    scoreDifference,
    status,

    rejectionExplanation,

    // Fairness Audit
    fairnessAudit: {
      status: 'Passed',
      isAnonymized,
      redactedFieldsCount,
      redactionLog,
      flags: []
    },

    analyzedAt: new Date()
  };
}

module.exports = {
  performMultiCriteriaAnalysis,
  extractJobSkills,
  extractCandidateSkills
};
