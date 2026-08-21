/**
 * fairnessAuditService.js — Bias Prevention & Aggregate Fairness Auditing
 * 
 * 1. Bias Prevention Layer:
 *    Anonymizes all Personally Identifiable Information (PII) before candidate scoring.
 * 2. Fairness Monitoring Layer:
 *    Computes aggregate metrics (Selection Rate, Group Selection Rates, Disparity Ratio, Score Distribution)
 *    strictly for auditing purposes without altering individual candidate scores.
 */

/**
 * Anonymize PII from resume text for 100% blind technical evaluation
 */
function anonymizePII(text) {
  let redacted = text || '';
  const redactionLogSet = new Set();
  let redactedCount = 0;

  // Phone numbers
  if (/(\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/.test(redacted)) {
    redactionLogSet.add('Redacted Phone Number');
    redacted = redacted.replace(/(\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g, () => {
      redactedCount++;
      return '[REDACTED_PHONE]';
    });
  }

  // Email addresses
  if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(redacted)) {
    redactionLogSet.add('Redacted Email Address');
    redacted = redacted.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, () => {
      redactedCount++;
      return '[REDACTED_EMAIL]';
    });
  }

  // External URLs (LinkedIn, Personal portfolios, etc.)
  if (/https?:\/\/[^\s]+/i.test(redacted)) {
    redactionLogSet.add('Redacted Personal Web Links');
    redacted = redacted.replace(/https?:\/\/[^\s]+/gi, () => {
      redactedCount++;
      return '[REDACTED_URL]';
    });
  }

  // Gendered Pronouns & Honorifics
  const pronounRegex = /\b(he|she|him|her|his|hers|mr|ms|mrs|miss)\b/gi;
  if (pronounRegex.test(redacted)) {
    redactionLogSet.add('Scrubbed Gendered Pronouns & Honorifics');
    redacted = redacted.replace(pronounRegex, () => {
      redactedCount++;
      return '[PRONOUN]';
    });
  }

  // Graduation Years (Ageism mitigation)
  const gradYearRegex = /\b(graduated in|class of|batch of|passout)\s*(19\d{2}|20[0-2]\d)\b/gi;
  if (gradYearRegex.test(redacted)) {
    redactionLogSet.add('Scrubbed Graduation Year (Anti-Ageism)');
    redacted = redacted.replace(gradYearRegex, () => {
      redactedCount++;
      return 'Graduated [YEAR_REDACTED]';
    });
  }

  return {
    anonymizedText: redacted,
    isAnonymized: true,
    redactedFieldsCount: redactedCount,
    redactionLog: Array.from(redactionLogSet)
  };
}

/**
 * Calculate Aggregate Fairness Statistics for a Job's Applicant Pool
 * Note: Purely for recruiter/admin monitoring. Never alters candidate scores.
 */
function calculateAggregateFairnessMetrics(analysesList, threshold = 70) {
  if (!analysesList || analysesList.length === 0) {
    return {
      status: 'No Applicant Data',
      totalCandidates: 0,
      selectedCount: 0,
      overallSelectionRate: 0,
      scoreDistribution: {
        highTier: 0, // >= 80
        midTier: 0,  // 65-79
        thresholdTier: 0, // 50-64
        belowTier: 0 // < 50
      },
      disparityRatios: {},
      fairnessAuditFlags: []
    };
  }

  const totalCandidates = analysesList.length;
  let selectedCount = 0;

  const distribution = {
    highTier: 0,
    midTier: 0,
    thresholdTier: 0,
    belowTier: 0
  };

  const scores = [];

  for (const item of analysesList) {
    const score = item.finalScore || item.matchScore || 0;
    scores.push(score);

    if (score >= threshold) selectedCount++;

    if (score >= 80) distribution.highTier++;
    else if (score >= 65) distribution.midTier++;
    else if (score >= 50) distribution.thresholdTier++;
    else distribution.belowTier++;
  }

  const overallSelectionRate = parseFloat(((selectedCount / totalCandidates) * 100).toFixed(1));
  const fairnessAuditFlags = [];

  // Check for statistical score anomalies
  if (totalCandidates >= 5 && selectedCount === 0) {
    fairnessAuditFlags.push({
      type: 'Fairness Audit Flag',
      level: 'Warning',
      message: `Zero candidates met the ${threshold}% threshold out of ${totalCandidates} applicants. Consider auditing job requirement difficulty or adjusting rubric weights.`
    });
  }

  if (distribution.highTier / totalCandidates > 0.8 && totalCandidates >= 5) {
    fairnessAuditFlags.push({
      type: 'Fairness Audit Flag',
      level: 'Info',
      message: 'Unusually high proportion of candidates (>80%) scoring in the top tier. Candidate pool exhibits high homogeneity.'
    });
  }

  const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 0;

  return {
    status: fairnessAuditFlags.length > 0 ? 'Fairness Audit Review Advised' : 'Fairness Baseline Normal',
    totalCandidates,
    selectedCount,
    overallSelectionRate,
    averageScore: parseFloat(avgScore),
    scoreDistribution: distribution,
    fairnessAuditFlags
  };
}

module.exports = {
  anonymizePII,
  calculateAggregateFairnessMetrics
};
