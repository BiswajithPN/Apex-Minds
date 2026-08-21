/**
 * biasAuditService.js — Job Description Inclusivity & Bias Audit Engine
 */

const EXCLUSIONARY_TERMS = {
  'ninja': {
    category: 'Hyperbolic / Aggressive',
    suggestion: 'skilled developer, software engineer, or technical specialist',
    explanation: 'Informal slang can discourage qualified candidates who value professional descriptions.'
  },
  'rockstar': {
    category: 'Hyperbolic / Ego-Centric',
    suggestion: 'high-impact contributor, subject matter expert, or senior engineer',
    explanation: 'Associated with excessive individualism over collaborative teamwork.'
  },
  'guru': {
    category: 'Cultural Appropriation / Vague',
    suggestion: 'expert, specialist, or technical lead',
    explanation: 'Vague buzzwords create ambiguity in job expectations.'
  },
  'aggressive': {
    category: 'Masculine Gender-Leaning',
    suggestion: 'proactive, goal-oriented, or highly driven',
    explanation: 'Gender-coded language that research shows reduces female applicant rates.'
  },
  'dominate': {
    category: 'Hyper-Competitive',
    suggestion: 'lead, excel in, or expand market presence',
    explanation: 'Aggressive phrasing creates an unwelcoming culture signal.'
  },
  'hacker': {
    category: 'Unclear / Jargon',
    suggestion: 'problem solver, software engineer, or security researcher',
    explanation: 'May convey unstructured or sloppy engineering practices.'
  },
  'digital native': {
    category: 'Ageism Signal',
    suggestion: 'technologically proficient or experienced with modern digital platforms',
    explanation: 'Explicitly excludes experienced candidates who grew up prior to smartphones/internet.'
  },
  'young and energetic': {
    category: 'Direct Age Discrimination',
    suggestion: 'enthusiastic, motivated, and collaborative',
    explanation: 'Directly violates fair hiring standards regarding age discrimination.'
  },
  'fast-paced environment': {
    category: 'Burnout Indicator',
    suggestion: 'dynamic and collaborative product environment',
    explanation: 'Often flagged by candidates as shorthand for unmanaged overtime.'
  }
};

/**
 * Audits a job description text for inclusivity and equity.
 */
function auditJobDescription(jobDescription) {
  const jd = jobDescription || '';
  const lowerJd = jd.toLowerCase();
  const flaggedWords = [];
  let score = 100;

  for (const [word, info] of Object.entries(EXCLUSIONARY_TERMS)) {
    const regex = new RegExp(`\\b${word.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
    if (regex.test(lowerJd)) {
      flaggedWords.push({
        term: word,
        category: info.category,
        suggestion: info.suggestion,
        explanation: info.explanation
      });
      score -= 15;
    }
  }

  const finalScore = Math.max(20, Math.min(100, score));

  let grade = 'A+ (Highly Inclusive)';
  if (finalScore < 50) grade = 'D (High Bias Risk)';
  else if (finalScore < 70) grade = 'C (Needs Refinement)';
  else if (finalScore < 90) grade = 'B (Generally Inclusive)';

  return {
    inclusivityScore: finalScore,
    grade,
    flaggedCount: flaggedWords.length,
    flaggedWords,
    summary: flaggedWords.length === 0
      ? 'Great job! Your job description uses inclusive, bias-free, and objective professional language.'
      : `Found ${flaggedWords.length} phrasing issue(s) that may unintentionally bias or deter qualified applicants.`
  };
}

module.exports = {
  auditJobDescription,
  EXCLUSIONARY_TERMS
};
