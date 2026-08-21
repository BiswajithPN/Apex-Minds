/**
 * rejectionExplainerService.js — Explainable AI & Constructive Candidate Rejection Generator
 * 
 * Generates professional, respectful, job-relevant, non-discriminatory feedback
 * when a candidate does not meet the configured job threshold.
 */

function generateConstructiveRejectionExplanation(params) {
  const {
    finalScore,
    threshold,
    matchedSkills = [],
    missingSkills = [],
    partiallyMatchedSkills = [],
    experienceAnalysis = {},
    projectAnalysis = {},
    semanticScore = 50,
    jobTitle = 'Position'
  } = params;

  const scoreDiff = finalScore - threshold;
  const isRejected = finalScore < threshold;

  const reasons = [];
  const strongAreas = [];
  const improvementAreas = [];

  // 1. Identify Strong Areas
  if (matchedSkills.length > 0) {
    strongAreas.push(...matchedSkills.slice(0, 5));
  }
  if (experienceAnalysis.totalYears >= 2) {
    strongAreas.push(`${experienceAnalysis.totalYears}+ years industry track record`);
  }
  if (projectAnalysis.relevantProjects?.length > 0) {
    strongAreas.push('Relevant practical project portfolio');
  }

  // 2. Identify Deficit / Missing Requirements (Main Reasons)
  if (missingSkills.length > 0) {
    reasons.push(
      `Core Skill Alignment: The role specifically requires demonstrated proficiency in [${missingSkills.slice(0, 4).join(', ')}], which were not identified in your resume.`
    );
    improvementAreas.push(...missingSkills.slice(0, 4));
  }

  if (partiallyMatchedSkills.length > 0) {
    const partialEx = partiallyMatchedSkills.slice(0, 2).map((p) => `${p.have} (for ${p.wanted})`).join(', ');
    reasons.push(
      `Transferable Competencies: You possess adjacent transferable skills (${partialEx}), but direct hands-on experience in the primary requirement is preferred.`
    );
  }

  if (experienceAnalysis.requiredYears > 0 && experienceAnalysis.totalYears < experienceAnalysis.requiredYears) {
    const shortfall = experienceAnalysis.requiredYears - experienceAnalysis.totalYears;
    reasons.push(
      `Experience Tenure: The position requires ${experienceAnalysis.requiredYears}+ years of relevant production experience; your resume reflected approximately ${experienceAnalysis.totalYears} years (${shortfall} year deficit).`
    );
    improvementAreas.push(`Additional hands-on industry tenure in ${jobTitle} domains`);
  }

  if (semanticScore < 55) {
    reasons.push(
      `Domain Scope Alignment: Your project narratives and work responsibilities had moderate semantic alignment with the technical architecture outlined for this role.`
    );
  }

  if (reasons.length === 0) {
    reasons.push('High candidate competitiveness for this opening with other applicants closely matching all preferred criteria.');
  }

  // 3. Actionable Constructive Advice
  let constructiveAdvice = '';
  if (missingSkills.length > 0) {
    const topMissing = missingSkills.slice(0, 3).join(', ');
    constructiveAdvice = `To strengthen your candidacy for similar roles, consider building verified production projects or obtaining industry certifications in ${topMissing}.`;
  } else if (experienceAnalysis.totalYears < experienceAnalysis.requiredYears) {
    constructiveAdvice = `You have strong foundational skills. Gaining additional practical experience in production deployments will make you highly competitive for mid/senior postings.`;
  } else {
    constructiveAdvice = `Highlighting quantified business impact, system architecture decisions, and containerized deployments in your project descriptions will further elevate your profile.`;
  }

  const headline = isRejected
    ? `Your application was not shortlisted for the ${jobTitle} position.`
    : `Your application meets the screening criteria for ${jobTitle}.`;

  return {
    isRejected,
    headline,
    matchScore: finalScore,
    threshold,
    difference: scoreDiff,
    reasons,
    strengths: Array.from(new Set(strongAreas)),
    improvementAreas: Array.from(new Set(improvementAreas)),
    constructiveAdvice
  };
}

module.exports = {
  generateConstructiveRejectionExplanation
};
