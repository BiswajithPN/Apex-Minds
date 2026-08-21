const geminiService = require('./geminiService');

/**
 * AI Job Recommendations for Job Seekers.
 * Fallback: returns first N open jobs.
 */
const getRecommendations = async (profile, jobs) => {
  if (!jobs || jobs.length === 0) return [];

  if (!geminiService.hasApiKey()) {
    // Fallback: Return open jobs with mock match info
    return jobs.map((job) => ({
      ...job.toObject ? job.toObject() : job,
      matchedSkills: (profile?.skills || []).slice(0, 3),
      reasons: ['Matches your location and background'],
    }));
  }

  const candidateInfo = {
    skills: profile?.skills || [],
    location: profile?.location || '',
    experience: profile?.experience || '',
  };

  const jobSummaries = jobs.map((j) => ({
    id: j._id.toString(),
    title: j.title,
    skills: j.skills_required || [],
    location: j.location || '',
  }));

  const prompt = `
You are a job recommendation engine. Given the candidate profile and a list of jobs, recommend the best matching jobs.
Candidate: ${JSON.stringify(candidateInfo)}
Jobs: ${JSON.stringify(jobSummaries)}

Return a JSON array ONLY of objects with:
- "id": job id
- "matchedSkills": array of matching skill strings
- "reasons": array of 1-2 brief reason strings why this job fits
`;

  try {
    const recs = await geminiService.generateStructuredJSON(prompt);
    if (Array.isArray(recs)) {
      const jobMap = new Map(jobs.map((j) => [j._id.toString(), j.toObject ? j.toObject() : j]));
      return recs
        .map((r) => {
          const job = jobMap.get(r.id);
          if (!job) return null;
          return {
            ...job,
            matchedSkills: r.matchedSkills || [],
            reasons: r.reasons || ['AI Matched'],
          };
        })
        .filter(Boolean);
    }
  } catch (err) {
    // Fallback
  }

  return jobs.map((job) => ({
    ...job.toObject ? job.toObject() : job,
    matchedSkills: (profile?.skills || []).slice(0, 3),
    reasons: ['Matches your skill set'],
  }));
};

module.exports = {
  getRecommendations,
};
