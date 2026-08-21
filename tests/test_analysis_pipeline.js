const { calculateSemanticScore, calculateTfIdfCosineSimilarity, calculateJaccardSimilarity } = require('../Backend/src/services/semanticMatchingService');
const { performMultiCriteriaAnalysis } = require('../Backend/src/services/multiCriteriaScoringService');
const { anonymizePII, calculateAggregateFairnessMetrics } = require('../Backend/src/services/fairnessAuditService');
const { generateConstructiveRejectionExplanation } = require('../Backend/src/services/rejectionExplainerService');
const { extractProjectsFromResume, analyzeProjectRelevance } = require('../Backend/src/services/projectAnalysisService');
const { extractEducationFromResume, analyzeEducationMatch } = require('../Backend/src/services/educationAnalysisService');

async function runFullRecruitmentAnalysisTestSuite() {
  console.log('======================================================================');
  console.log('🧪 HIREHUB AI RECRUITMENT ANALYSIS MODULE — COMPREHENSIVE TEST SUITE');
  console.log('======================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}`);
      failed++;
    }
  }

  // -------------------------------------------------------------------------
  // TEST 1: Semantic Matching & Conceptual Domain Parity
  // -------------------------------------------------------------------------
  console.log('--- Test Group 1: Text & Semantic Embedding Similarity ---');
  const jdMachineLearning = 'Machine Learning Engineer required with deep predictive models experience, Python, and data science algorithms.';
  const candidateMlResume = 'Developed predictive models using Python, pandas, and scikit-learn for fraud detection.';

  const semanticRes = calculateSemanticScore(jdMachineLearning, candidateMlResume);
  assert(semanticRes.semanticScore >= 60, `Semantic similarity recognizes conceptual ML parity (Score: ${semanticRes.semanticScore}%)`);
  assert(semanticRes.textSimilarity.tfidfCosine > 0, `TF-IDF Cosine similarity calculated (${semanticRes.textSimilarity.tfidfCosine})`);
  assert(semanticRes.textSimilarity.jaccard > 0, `Jaccard token similarity calculated (${semanticRes.textSimilarity.jaccard})`);

  // -------------------------------------------------------------------------
  // TEST 2: PII Anonymization (Bias Prevention Layer)
  // -------------------------------------------------------------------------
  console.log('\n--- Test Group 2: PII Anonymization (Bias Prevention) ---');
  const rawTextWithPii = 'John Doe. Phone: +1-555-123-4567. Email: john.doe@example.com. Profile: https://linkedin.com/in/johndoe. He graduated in 2018. Experienced React and Node developer.';
  const anonymized = anonymizePII(rawTextWithPii);

  assert(!anonymized.anonymizedText.includes('john.doe@example.com'), 'Email address scrubbed');
  assert(!anonymized.anonymizedText.includes('555-123-4567'), 'Phone number scrubbed');
  assert(!anonymized.anonymizedText.includes('https://linkedin.com'), 'External web link scrubbed');
  assert(!anonymized.anonymizedText.includes('He graduated'), 'Pronoun and graduation date scrubbed');
  assert(anonymized.isAnonymized === true, 'Anonymized flag confirmed');

  // -------------------------------------------------------------------------
  // TEST 3: Project Relevance & Education Analysis
  // -------------------------------------------------------------------------
  console.log('\n--- Test Group 3: Project Relevance & Education Matching ---');
  const resumeWithProjects = `
    Key Projects:
    - Smart Cloud Deployer: Built an automated container pipeline with Docker, Kubernetes, and AWS Terraform.
    - Weather App: Created a static HTML/CSS web page.
    Education:
    B.Tech Computer Science and Engineering from National Institute of Technology, Graduated 2021.
  `;

  const extractedProjects = extractProjectsFromResume(resumeWithProjects);
  const projAnalysis = analyzeProjectRelevance(extractedProjects, 'Senior Kubernetes Cloud Architect AWS Docker', ['kubernetes', 'aws', 'docker']);
  assert(projAnalysis.relevantProjects.length >= 1, `Identified relevant technical projects (${projAnalysis.relevantProjects.length} relevant)`);
  assert(projAnalysis.projectScore >= 70, `Project relevance score calculated (${projAnalysis.projectScore}%)`);

  const eduInfo = extractEducationFromResume(resumeWithProjects);
  const eduMatch = analyzeEducationMatch(eduInfo, 'Requires B.S. or B.Tech in CS');
  assert(eduMatch.meetsRequirement === true, `Education qualification met (${eduInfo.degree} in ${eduInfo.field})`);

  // -------------------------------------------------------------------------
  // TEST 4: Multi-Criteria Rubric Scoring & 4-Tier Skills Breakdown
  // -------------------------------------------------------------------------
  console.log('\n--- Test Group 4: Multi-Criteria Weighted Rubric & Skills Matrix ---');
  const mockJob = {
    _id: 'job_test_123',
    title: 'Senior Full Stack Engineer',
    description: 'We are seeking a Senior Full Stack Engineer with 4+ years experience in React, Node.js, TypeScript, PostgreSQL, and AWS.',
    requirements: 'Must have experience with Docker, CI/CD, and building scalable REST APIs.',
    skills_required: ['react', 'node.js', 'typescript', 'postgresql', 'aws', 'docker'],
    threshold: 70,
    rubricWeights: {
      skillWeight: 0.40,
      experienceWeight: 0.25,
      semanticWeight: 0.20,
      projectWeight: 0.10,
      educationWeight: 0.05
    }
  };

  const strongCandidateResume = `
    Alex Rivers. Senior Full Stack Developer.
    Experience: 5 years of engineering experience developing high-scale web platforms.
    Skills: React, Node.js, TypeScript, PostgreSQL, Docker, Redis, Git, REST APIs.
    Projects:
    - Cloud Microservices Portal: Architected React frontend and Node.js microservices deployed with Docker.
    Education: B.S. in Computer Science.
  `;

  const deficitCandidateResume = `
    Junior Designer.
    Skills: HTML, CSS, Figma, WordPress, Photoshop.
    Experience: 1 year designing graphic banners and WordPress themes.
    Education: Diploma in Graphic Design.
  `;

  const strongAnalysis = await performMultiCriteriaAnalysis({
    job: mockJob,
    resumeText: strongCandidateResume,
    candidateUser: { _id: 'user_strong_1', full_name: 'Alex Rivers', email: 'alex@example.com' }
  });

  const deficitAnalysis = await performMultiCriteriaAnalysis({
    job: mockJob,
    resumeText: deficitCandidateResume,
    candidateUser: { _id: 'user_deficit_2', full_name: 'Jordan Smith', email: 'jordan@example.com' }
  });

  assert(strongAnalysis.finalScore >= 70, `Strong candidate passed threshold (Score: ${strongAnalysis.finalScore}%, Threshold: ${mockJob.threshold}%)`);
  assert(strongAnalysis.status === 'Shortlisted', `Strong candidate marked Shortlisted`);
  assert(strongAnalysis.confidenceLevel === 'High', `Strong candidate confidence level is High (${strongAnalysis.confidenceScore}%)`);
  assert(strongAnalysis.matchedSkills.includes('react'), 'Matched skills include React');

  assert(deficitAnalysis.finalScore < 70, `Deficit candidate fell below threshold (Score: ${deficitAnalysis.finalScore}%, Threshold: ${mockJob.threshold}%)`);
  assert(deficitAnalysis.status === 'Not Shortlisted', 'Deficit candidate marked Not Shortlisted');
  assert(deficitAnalysis.missingSkills.length >= 3, `Missing skills detected (${deficitAnalysis.missingSkills.join(', ')})`);

  // -------------------------------------------------------------------------
  // TEST 5: Constructive Candidate Rejection Explanation
  // -------------------------------------------------------------------------
  console.log('\n--- Test Group 5: Constructive Rejection Explanation ---');
  const rejectionExp = generateConstructiveRejectionExplanation({
    finalScore: deficitAnalysis.finalScore,
    threshold: 70,
    matchedSkills: deficitAnalysis.matchedSkills,
    missingSkills: deficitAnalysis.missingSkills,
    experienceAnalysis: deficitAnalysis.experienceAnalysis,
    projectAnalysis: deficitAnalysis.projectAnalysis,
    semanticScore: deficitAnalysis.semanticScore,
    jobTitle: mockJob.title
  });

  assert(rejectionExp.isRejected === true, 'Flagged as rejected / not shortlisted');
  assert(rejectionExp.reasons.length > 0, `Generated ${rejectionExp.reasons.length} job-relevant rejection reasons`);
  assert(rejectionExp.constructiveAdvice.length > 10, 'Generated actionable constructive remediation advice');
  assert(!rejectionExp.constructiveAdvice.includes('gender') && !rejectionExp.constructiveAdvice.includes('age'), 'Free from discriminatory terms');

  // -------------------------------------------------------------------------
  // TEST 6: Candidate Ranking & Threshold Decision Ordering
  // -------------------------------------------------------------------------
  console.log('\n--- Test Group 6: Candidate Ranking Leaderboard ---');
  const candidatePool = [
    { name: 'Candidate A', finalScore: 88, confidenceScore: 90 },
    { name: 'Candidate B', finalScore: 88, confidenceScore: 95 }, // Tie-breaker by confidence
    { name: 'Candidate C', finalScore: 72, confidenceScore: 80 },
    { name: 'Candidate D', finalScore: 45, confidenceScore: 60 }
  ];

  candidatePool.sort((a, b) => {
    if (b.finalScore !== a.finalScore) return b.finalScore - a.finalScore;
    return b.confidenceScore - a.confidenceScore;
  });

  assert(candidatePool[0].name === 'Candidate B', 'Candidate B wins #1 rank on confidence tie-breaker');
  assert(candidatePool[3].name === 'Candidate D', 'Candidate D positioned last based on score');

  // -------------------------------------------------------------------------
  // TEST 7: Aggregate Fairness Monitoring
  // -------------------------------------------------------------------------
  console.log('\n--- Test Group 7: Aggregate Fairness Monitoring ---');
  const fairnessReport = calculateAggregateFairnessMetrics([strongAnalysis, deficitAnalysis], 70);
  assert(fairnessReport.totalCandidates === 2, 'Fairness audit tracks total candidates (2)');
  assert(fairnessReport.overallSelectionRate === 50, 'Selection rate correctly computed as 50%');

  console.log('\n======================================================================');
  console.log(`📊 TEST SUITE SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('======================================================================\n');

  if (failed > 0) process.exit(1);
}

runFullRecruitmentAnalysisTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
