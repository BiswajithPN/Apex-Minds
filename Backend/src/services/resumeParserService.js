const pdfParse = require('pdf-parse');
const geminiService = require('./geminiService');

/**
 * Extract text from PDF buffer and send to Gemini for structured JSON analysis.
 * Fallback: returns { ai_analysis_failed: true } if Gemini is absent or fails.
 */
const parseResume = async (pdfBuffer) => {
  let resumeText = '';
  try {
    const data = await pdfParse(pdfBuffer);
    resumeText = data.text || '';
  } catch (err) {
    console.error('[pdf-parse error]', err.message);
  }

  if (!geminiService.hasApiKey() || !resumeText.trim()) {
    return {
      resumeText,
      analysis: {
        score: 75,
        matchedSkills: ['JavaScript', 'HTML/CSS', 'Problem Solving'],
        skillsToImprove: ['TypeScript', 'Cloud Architecture'],
        suggestions: [
          'Add quantitative metrics to experience descriptions',
          'Include links to portfolio projects or GitHub repositories',
        ],
        ai_analysis_failed: true,
      },
    };
  }

  const prompt = `
You are an expert ATS (Applicant Tracking System) resume analyzer. Analyze the following resume text and return a JSON object ONLY with the following exact keys:
- "score": number from 50 to 100 based on overall resume quality
- "skills": array of strings (all technical & soft skills found)
- "matchedSkills": array of strings (top strongest skills)
- "skillsToImprove": array of strings (missing/weak skills for modern tech roles)
- "suggestions": array of 2-4 actionable bullet points to improve the resume

Resume Text:
"""
${resumeText.substring(0, 4000)}
"""
`;

  try {
    const analysis = await geminiService.generateStructuredJSON(prompt);
    return {
      resumeText,
      analysis,
    };
  } catch (err) {
    console.error('[parseResume error]', err.message);
    return {
      resumeText,
      analysis: {
        score: 70,
        matchedSkills: ['General Professional Skills'],
        skillsToImprove: ['Technical Documentation'],
        suggestions: ['Review formatting for ATS readability'],
        ai_analysis_failed: true,
        error: err.message,
      },
    };
  }
};

module.exports = {
  parseResume,
};
