const geminiService = require('./geminiService');

/**
 * Rank applicants for an employer's job posting using AI.
 * Fallback: Sort by existing application match_score descending.
 */
const rankApplicants = async (applicants, job) => {
  if (!applicants || applicants.length === 0) return [];

  if (!geminiService.hasApiKey()) {
    // Fallback: sort by match_score descending
    return [...applicants].sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
  }

  const applicantSummaries = applicants.map((app) => ({
    appId: app._id.toString(),
    name: app.applicant?.name || app.jobSeekerId?.full_name || 'Candidate',
    skills: app.matchedSkills || [],
    score: app.match_score || 0,
  }));

  const prompt = `
Rank the following applicants for the job "${job.title}". Return a JSON array ONLY of applicant IDs in ranked order from best to worst fit.
Applicants: ${JSON.stringify(applicantSummaries)}
`;

  try {
    const rankedIds = await geminiService.generateStructuredJSON(prompt);
    if (Array.isArray(rankedIds)) {
      const idMap = new Map(applicants.map((a) => [a._id.toString(), a]));
      const ordered = rankedIds.map((id) => idMap.get(id)).filter(Boolean);
      // Append any unranked applicants
      const remaining = applicants.filter((a) => !ordered.includes(a));
      return [...ordered, ...remaining];
    }
  } catch (err) {
    // Fallback
  }

  return [...applicants].sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
};

module.exports = {
  rankApplicants,
};
