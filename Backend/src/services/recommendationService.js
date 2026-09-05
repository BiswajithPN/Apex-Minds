const geminiService = require('./geminiService');
const { calculateSemanticScore } = require('./semanticMatchingService');
const { extractSkillsFromText, formatSkillName } = require('./resumeParserService');

function normalizeSkill(s) {
  return (s || '').toLowerCase().trim().replace(/[-_]/g, ' ');
}

/**
 * Helper: Check if a required skill exists in resume text or candidate skills list.
 * Supports exact match, normalized phrase match, and word boundary regex across all domains.
 */
function candidateHasSkill(skill, resumeText, candidateSkillsLower) {
  if (!skill) return false;
  const rawSkill = skill.toLowerCase().trim();
  const normalized = normalizeSkill(skill);

  // 1. Check candidate profile skills
  if (candidateSkillsLower.has(rawSkill) || candidateSkillsLower.has(normalized)) return true;
  for (const cs of candidateSkillsLower) {
    if (cs === rawSkill || cs === normalized || normalizeSkill(cs) === normalized) return true;
  }

  // 2. Check resume text with word boundaries and phrase matching
  if (!resumeText) return false;
  const lowerText = resumeText.toLowerCase();

  const escaped = rawSkill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const rx = new RegExp(`(?<=[^a-zA-Z0-9#+]|^)${escaped}(?=[^a-zA-Z0-9#+]|$)`, 'i');
  if (rx.test(resumeText)) return true;

  // Also check normalized multi-word phrases (e.g. "molecular biology", "dna sequencing")
  if (normalized.length >= 3 && lowerText.includes(normalized)) return true;

  return false;
}

/**
 * Helper: Parse all required skills from job posting
 * Extracts from skills_required (array or comma-separated string), requirements, and description.
 * (Strictly excludes company names from skill matching)
 */
function parseJobRequiredSkills(jobObj) {
  const skillsSet = new Set();

  // 1. Parse explicit skills_required (array or comma-separated string)
  if (Array.isArray(jobObj.skills_required)) {
    for (const item of jobObj.skills_required) {
      if (typeof item === 'string') {
        item.split(',').forEach(s => {
          const clean = s.trim();
          if (clean) skillsSet.add(clean);
        });
      }
    }
  } else if (typeof jobObj.skills_required === 'string') {
    jobObj.skills_required.split(',').forEach(s => {
      const clean = s.trim();
      if (clean) skillsSet.add(clean);
    });
  }

  // 2. Also parse explicit comma-separated skills in requirements field if present
  if (typeof jobObj.requirements === 'string' && jobObj.requirements.includes(',')) {
    const parts = jobObj.requirements.split(',');
    for (const p of parts) {
      const clean = p.trim();
      if (clean.length >= 2 && clean.length <= 30 && !clean.includes('.')) {
        skillsSet.add(clean);
      }
    }
  }

  // 3. Extract technical and scientific terms found in Title, Description, and Requirements
  const jdTextOnly = [
    jobObj.title || '',
    jobObj.description || '',
    jobObj.requirements || ''
  ].join(' ');

  const textSkills = extractSkillsFromText(jdTextOnly);
  for (const s of textSkills) {
    skillsSet.add(s);
  }

  return Array.from(skillsSet);
}

/**
 * Intelligent AI Job Recommendation Engine.
 * Matches candidate's resume strictly against company Required Skills (comma-separated)
 * and Job Description, filtering out non-matching jobs completely.
 */
const getRecommendations = async (profile, jobs) => {
  if (!jobs || jobs.length === 0) return [];

  const resumeText = profile?.resume_text || '';
  const extractedFromResume = extractSkillsFromText(resumeText);
  const candidateSkills = [
    ...new Set([...(profile?.skills || []), ...extractedFromResume])
  ];
  
  const candidateSkillsLower = new Set(candidateSkills.map(s => s.toLowerCase().trim()));

  // 1. Evaluate Every Job against Required Skills & Job Description
  const evaluatedJobs = [];

  for (const job of jobs) {
    const jobObj = job.toObject ? job.toObject() : job;

    // Job Description text ONLY (Title + Description + Requirements — NO company name)
    const jdTextOnly = [
      jobObj.title || '',
      jobObj.description || '',
      jobObj.requirements || ''
    ].join(' ');

    // Extract all required skills (e.g. from Required Skills comma-separated)
    const requiredSkillsRaw = parseJobRequiredSkills(jobObj);

    // Direct Match against Job's Required Skills
    const matchedSkills = [];
    const missingSkills = [];

    for (const reqSkill of requiredSkillsRaw) {
      if (candidateHasSkill(reqSkill, resumeText, candidateSkillsLower)) {
        matchedSkills.push(formatSkillName(reqSkill));
      } else {
        missingSkills.push(formatSkillName(reqSkill));
      }
    }

    // Semantic Similarity between Resume and Job Description (0 - 100)
    let semanticScore = 20;
    if (resumeText.trim().length > 40) {
      try {
        const semResult = calculateSemanticScore(jdTextOnly, resumeText);
        semanticScore = semResult.semanticScore || 20;
      } catch (_) {
        semanticScore = 20;
      }
    }

    // Required Skills Coverage Ratio (0 - 100)
    let skillScore = 0;
    if (requiredSkillsRaw.length > 0) {
      skillScore = Math.min(100, Math.round((matchedSkills.length / requiredSkillsRaw.length) * 100));
    } else if (matchedSkills.length > 0) {
      skillScore = Math.min(100, matchedSkills.length * 20);
    }

    // Title relevance bonus
    let titleBonus = 0;
    const titleLower = (jobObj.title || '').toLowerCase();
    for (const cs of candidateSkillsLower) {
      if (cs.length > 2 && titleLower.includes(cs)) {
        titleBonus += 15;
        break;
      }
    }

    // Strict Composite Match Score based on Required Skills (65%) and Job Description (35%)
    let matchScore = 0;
    if (requiredSkillsRaw.length > 0 && resumeText.trim().length > 40) {
      matchScore = Math.round((skillScore * 0.65) + (semanticScore * 0.25) + (titleBonus * 0.10));
    } else if (requiredSkillsRaw.length > 0) {
      matchScore = Math.round((skillScore * 0.85) + (titleBonus * 0.15));
    } else if (resumeText.trim().length > 40) {
      matchScore = Math.round((semanticScore * 0.80) + (titleBonus * 0.20));
    } else {
      matchScore = 0;
    }

    matchScore = Math.min(Math.max(matchScore, 0), 98);

    // Reasons based purely on Required Skills and Job Description
    const reasons = [];
    if (matchedSkills.length > 0 && requiredSkillsRaw.length > 0) {
      const topSkills = matchedSkills.slice(0, 3).join(', ');
      reasons.push(`Matches ${matchedSkills.length} of ${requiredSkillsRaw.length} required skills: ${topSkills}`);
    } else if (matchedSkills.length > 0) {
      reasons.push(`Direct skill match for ${matchedSkills.slice(0, 3).join(', ')}`);
    }

    if (semanticScore >= 65) {
      reasons.push('High semantic match with job description responsibilities & scope');
    } else if (titleBonus > 0) {
      reasons.push('Job title matches your verified core background');
    } else if (matchedSkills.length > 0) {
      reasons.push('Relevant role matching your verified skill stack');
    }

    const uniqueMatchedSkills = [...new Set(matchedSkills)];
    const uniqueMissingSkills = [...new Set(missingSkills.filter(s => !uniqueMatchedSkills.includes(s)))];

    evaluatedJobs.push({
      ...jobObj,
      matchScore,
      matchedSkills: uniqueMatchedSkills,
      missingSkills: uniqueMissingSkills.slice(0, 3),
      reasons: reasons.slice(0, 2),
    });
  }

  // Sort by highest match score first
  evaluatedJobs.sort((a, b) => b.matchScore - a.matchScore);

  // Strict Filtering:
  // ONLY recommend jobs where:
  // 1. Candidate matched at least 1 explicit required skill AND matchScore >= 35, OR
  // 2. High semantic match (matchScore >= 50).
  // Non-matching jobs are NEVER recommended.
  let filteredJobs = evaluatedJobs.filter(j => j.matchedSkills.length > 0 && j.matchScore >= 30);

  // 2. If Gemini AI is configured, refine match scores based on Required Skills & JD
  if (geminiService.hasApiKey() && filteredJobs.length > 0 && resumeText.trim().length > 40) {
    const topToRefine = filteredJobs.slice(0, 6);
    const candidateSummary = {
      skills: candidateSkills,
      resumeSummary: resumeText.substring(0, 1500),
    };

    const jobsSummary = topToRefine.map(j => ({
      id: (j._id || j.id).toString(),
      title: j.title,
      requiredSkills: Array.isArray(j.skills_required) ? j.skills_required.join(', ') : (j.skills_required || ''),
      description: (j.description || '').substring(0, 300),
      requirements: (j.requirements || '').substring(0, 200),
    }));

    const prompt = `
You are an expert Job Matching AI. Match the candidate's resume strictly against each job's Required Skills and Job Description. (Do NOT use company names in matching).

Candidate:
${JSON.stringify(candidateSummary)}

Jobs:
${JSON.stringify(jobsSummary)}

Evaluate candidate fit for each job strictly on:
1. Direct match with Required Skills (comma-separated).
2. Semantic match with Job Description & Requirements.
Omit jobs that have low or zero skill overlap.

Return a JSON array ONLY of objects for matching jobs:
[
  {
    "id": "job id string",
    "matchScore": number (35-98),
    "matchedSkills": ["skill1", "skill2"],
    "reasons": ["1-2 specific reasons based on required skills & job description fit"]
  }
]
`;

    try {
      const aiResults = await geminiService.generateStructuredJSON(prompt);
      if (Array.isArray(aiResults) && aiResults.length > 0) {
        const jobMap = new Map(topToRefine.map(j => [(j._id || j.id).toString(), j]));
        const aiRankedJobs = [];

        for (const aiMatch of aiResults) {
          const original = jobMap.get(aiMatch.id);
          if (original && (aiMatch.matchScore >= 35 || (aiMatch.matchedSkills && aiMatch.matchedSkills.length > 0))) {
            aiRankedJobs.push({
              ...original,
              matchScore: typeof aiMatch.matchScore === 'number' ? aiMatch.matchScore : original.matchScore,
              matchedSkills: aiMatch.matchedSkills?.length ? aiMatch.matchedSkills : original.matchedSkills,
              reasons: aiMatch.reasons?.length ? aiMatch.reasons : original.reasons,
            });
          }
        }

        if (aiRankedJobs.length > 0) {
          aiRankedJobs.sort((a, b) => b.matchScore - a.matchScore);
          return aiRankedJobs;
        }
      }
    } catch (err) {
      console.warn('[Gemini Job Recommendations Refinement Fallback]', err.message);
    }
  }

  return filteredJobs;
};

module.exports = {
  getRecommendations,
  parseJobRequiredSkills,
  candidateHasSkill,
};
