const geminiService = require('./geminiService');

/**
 * Calculate match score between candidate profile/resume and job requirements.
 * Fallback: String matching algorithm on skills.
 */
const calculateMatchScore = async (candidate, job) => {
  const candidateSkills = candidate.skills || [];
  const requiredSkills = job.skills_required || [];

  if (!geminiService.hasApiKey()) {
    // String matching fallback algorithm
    if (requiredSkills.length === 0) {
      return { match_score: 80, matched_skills: candidateSkills.slice(0, 3), missing_skills: [] };
    }
    const matched = candidateSkills.filter((s) =>
      requiredSkills.some((req) => req.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(req.toLowerCase()))
    );
    const missing = requiredSkills.filter((req) => !matched.includes(req));
    const score = Math.min(100, Math.max(50, Math.round((matched.length / Math.max(1, requiredSkills.length)) * 50 + 50)));

    return {
      match_score: score,
      matched_skills: matched,
      missing_skills: missing,
    };
  }

  const prompt = `
Evaluate the candidate fit for this job requirement. Return JSON ONLY with:
- "match_score": number between 50 and 100
- "matched_skills": array of strings (candidate skills matching job requirements)
- "missing_skills": array of strings (job skills candidate lacks)

Candidate:
- Name: ${candidate.full_name || 'Candidate'}
- Skills: ${candidateSkills.join(', ')}
- Experience: ${candidate.experience || 'Not specified'}

Job:
- Title: ${job.title}
- Required Skills: ${requiredSkills.join(', ')}
- Description: ${job.description}
`;

  try {
    const result = await geminiService.generateStructuredJSON(prompt);
    return {
      match_score: result.match_score || 75,
      matched_skills: result.matched_skills || [],
      missing_skills: result.missing_skills || [],
    };
  } catch (err) {
    return {
      match_score: 75,
      matched_skills: candidateSkills.slice(0, 3),
      missing_skills: [],
    };
  }
};

module.exports = {
  calculateMatchScore,
};
