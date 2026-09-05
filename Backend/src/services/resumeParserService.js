const pdfParse = require('pdf-parse');
const geminiService = require('./geminiService');
const Job = require('../models/Job');

const ALL_TECH_SKILLS = [
  'python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'ruby', 'go', 'php', 'swift', 'kotlin', 'rust',
  'react', 'react native', 'angular', 'vue', 'svelte', 'node.js', 'node', 'express', 'django', 'flask', 'fastapi', 'spring', 'asp.net',
  'html', 'css', 'tailwind', 'bootstrap', 'sql', 'nosql', 'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch',
  'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'ansible', 'jenkins', 'git', 'github', 'ci/cd',
  'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'scikit-learn', 'nlp', 'data analysis', 'pandas', 'numpy',
  'agile', 'scrum', 'rest api', 'graphql', 'microservices', 'kafka', 'next.js', 'solidity', 'linux', 'firebase',
  'unit testing', 'pytest', 'jest', 'system design'
];

const SKILL_DISPLAY_MAP = {
  'python': 'Python',
  'javascript': 'JavaScript',
  'typescript': 'TypeScript',
  'java': 'Java',
  'c++': 'C++',
  'c#': 'C#',
  'ruby': 'Ruby',
  'go': 'Go (Golang)',
  'rust': 'Rust',
  'php': 'PHP',
  'swift': 'Swift',
  'kotlin': 'Kotlin',
  'react': 'React',
  'react native': 'React Native',
  'angular': 'Angular',
  'vue': 'Vue.js',
  'svelte': 'Svelte',
  'node.js': 'Node.js',
  'node': 'Node.js',
  'express': 'Express.js',
  'django': 'Django',
  'flask': 'Flask',
  'fastapi': 'FastAPI',
  'spring': 'Spring Boot',
  'asp.net': 'ASP.NET',
  'next.js': 'Next.js',
  'html': 'HTML5',
  'css': 'CSS3',
  'tailwind': 'Tailwind CSS',
  'bootstrap': 'Bootstrap',
  'sql': 'SQL',
  'nosql': 'NoSQL Databases',
  'mongodb': 'MongoDB',
  'postgresql': 'PostgreSQL',
  'mysql': 'MySQL',
  'redis': 'Redis Cache',
  'elasticsearch': 'Elasticsearch',
  'aws': 'AWS Cloud',
  'azure': 'Microsoft Azure',
  'gcp': 'Google Cloud (GCP)',
  'docker': 'Docker Containerization',
  'kubernetes': 'Kubernetes Orchestration',
  'terraform': 'Terraform (IaC)',
  'ansible': 'Ansible',
  'jenkins': 'Jenkins CI/CD',
  'git': 'Git Version Control',
  'github': 'GitHub Collaboration',
  'ci/cd': 'CI/CD Pipelines',
  'machine learning': 'Machine Learning',
  'deep learning': 'Deep Learning',
  'tensorflow': 'TensorFlow',
  'pytorch': 'PyTorch',
  'scikit-learn': 'Scikit-Learn',
  'nlp': 'Natural Language Processing (NLP)',
  'pandas': 'Pandas Data Analysis',
  'numpy': 'NumPy Numerical Computing',
  'data analysis': 'Data Analysis & Insights',
  'agile': 'Agile / Scrum Methodology',
  'scrum': 'Scrum Practices',
  'rest api': 'RESTful API Design',
  'graphql': 'GraphQL APIs',
  'microservices': 'Microservices Architecture',
  'kafka': 'Apache Kafka Event Streaming',
  'solidity': 'Solidity Smart Contracts',
  'linux': 'Linux & Shell Scripting',
  'firebase': 'Firebase Backend Services',
  'unit testing': 'Unit & Integration Testing',
  'pytest': 'PyTest Framework',
  'jest': 'Jest Testing Framework',
  'system design': 'System Design & Scalability'
};

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
  'deep learning': ['dl'],
  'rest api': ['restful api', 'rest apis', 'restful apis', 'rest endpoints'],
  'ci/cd': ['continuous integration', 'ci cd', 'github actions', 'gitlab ci'],
  'pytest': ['py.test', 'python testing'],
  'jest': ['jest testing', 'react testing library'],
  'html': ['html5'],
  'css': ['css3'],
};

// Domain skill clusters for contextual skill gap detection
const DOMAIN_PROFILES = [
  {
    domain: 'Full Stack & Web Engineering',
    triggerSkills: ['javascript', 'typescript', 'react', 'node', 'node.js', 'express', 'html', 'css', 'next.js', 'vue', 'angular'],
    coreSkills: ['javascript', 'typescript', 'react', 'node.js', 'express', 'postgresql', 'mongodb', 'rest api', 'tailwind', 'git', 'github', 'unit testing'],
    highValueAdditions: ['TypeScript', 'RESTful API Design', 'PostgreSQL', 'MongoDB', 'React', 'Node.js', 'Tailwind CSS', 'Unit & Integration Testing', 'Docker Containerization', 'Next.js']
  },
  {
    domain: 'Python & Backend Systems',
    triggerSkills: ['python', 'django', 'flask', 'fastapi'],
    coreSkills: ['python', 'fastapi', 'django', 'flask', 'postgresql', 'sql', 'rest api', 'redis', 'git', 'github', 'unit testing', 'docker'],
    highValueAdditions: ['FastAPI', 'PostgreSQL', 'RESTful API Design', 'Redis Cache', 'PyTest Framework', 'Docker Containerization', 'Microservices Architecture', 'SQL', 'CI/CD Pipelines']
  },
  {
    domain: 'Data Science & Machine Learning',
    triggerSkills: ['machine learning', 'deep learning', 'tensorflow', 'pytorch', 'scikit-learn', 'nlp', 'pandas', 'numpy', 'data analysis'],
    coreSkills: ['python', 'pandas', 'numpy', 'scikit-learn', 'pytorch', 'tensorflow', 'sql', 'data analysis', 'nlp', 'git'],
    highValueAdditions: ['PyTorch', 'TensorFlow', 'Scikit-Learn', 'Pandas Data Analysis', 'SQL', 'Natural Language Processing (NLP)', 'RESTful API Design', 'Data Analysis & Insights']
  },
  {
    domain: 'DevOps & Cloud Systems',
    triggerSkills: ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'jenkins', 'ci/cd', 'linux'],
    coreSkills: ['linux', 'docker', 'kubernetes', 'aws', 'ci/cd', 'terraform', 'git', 'github'],
    highValueAdditions: ['Docker Containerization', 'Kubernetes Orchestration', 'AWS Cloud', 'CI/CD Pipelines', 'Terraform (IaC)', 'Linux & Shell Scripting']
  },
  {
    domain: 'Mobile App Engineering',
    triggerSkills: ['react native', 'flutter', 'swift', 'kotlin'],
    coreSkills: ['react native', 'flutter', 'javascript', 'typescript', 'rest api', 'git'],
    highValueAdditions: ['React Native', 'TypeScript', 'RESTful API Design', 'Mobile UI/UX', 'State Management', 'Git Version Control']
  }
];

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

function extractSkillsFromText(text) {
  const found = new Set();
  const lower = (text || '').toLowerCase();
  for (const s of ALL_TECH_SKILLS) {
    if (hasSkill(s, lower)) {
      found.add(s);
    }
  }
  return Array.from(found);
}

function formatSkillName(rawSkill) {
  const key = rawSkill.toLowerCase().trim();
  return SKILL_DISPLAY_MAP[key] || (key.charAt(0).toUpperCase() + key.slice(1));
}

/**
 * Intelligent algorithmic resume analysis based on actual resume contents,
 * real open jobs in the database, and domain-specific skill graphs.
 */
async function generateIntelligentAnalysis(resumeText, detectedSkillsRaw) {
  const lower = (resumeText || '').toLowerCase();
  const detectedKeys = new Set(detectedSkillsRaw.map(s => s.toLowerCase()));

  // 1. Determine Candidate's Primary Domain
  let bestDomain = DOMAIN_PROFILES[0];
  let maxScore = -1;

  for (const profile of DOMAIN_PROFILES) {
    const matchCount = profile.triggerSkills.filter(s => detectedKeys.has(s)).length;
    if (matchCount > maxScore) {
      maxScore = matchCount;
      bestDomain = profile;
    }
  }

  // 2. Query Real Open Jobs from DB to detect real-world market demand
  let marketRequiredSkills = [];
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState === 1) {
      const openJobs = await Job.find({ status: 'open' }).select('title description skills_required requirements').limit(20);
      const skillCounts = {};
      for (const job of openJobs) {
        const jobSkills = [
          ...(job.skills_required || []),
          ...extractSkillsFromText(`${job.title} ${job.description} ${job.requirements || ''}`)
        ];
        for (const js of jobSkills) {
          const clean = js.toLowerCase().trim();
          if (clean) {
            skillCounts[clean] = (skillCounts[clean] || 0) + 1;
          }
        }
      }
      // Sort by most in-demand in database
      marketRequiredSkills = Object.entries(skillCounts)
        .sort((a, b) => b[1] - a[1])
        .map(entry => entry[0]);
    }
  } catch (err) {
    console.warn('[Real Job Market Query Warning]', err.message);
  }

  // 3. Format Matched Skills cleanly
  const matchedSkills = detectedSkillsRaw.map(formatSkillName);

  // 4. Compute Realistic Skills to Improve (Skills the candidate lacks that real matching jobs require)
  const missingCandidates = [];

  // Priority A: Skills from real open jobs that align with their domain
  for (const reqSkill of marketRequiredSkills) {
    if (!detectedKeys.has(reqSkill) && bestDomain.coreSkills.includes(reqSkill)) {
      const formatted = formatSkillName(reqSkill);
      if (!missingCandidates.includes(formatted)) {
        missingCandidates.push(formatted);
      }
    }
  }

  // Priority B: Domain high-value additions that candidate does not possess
  for (const addSkill of bestDomain.highValueAdditions) {
    const rawMatch = ALL_TECH_SKILLS.find(s => formatSkillName(s).toLowerCase() === addSkill.toLowerCase());
    if (rawMatch && !detectedKeys.has(rawMatch)) {
      if (!missingCandidates.includes(addSkill)) {
        missingCandidates.push(addSkill);
      }
    } else if (!rawMatch) {
      if (!missingCandidates.includes(addSkill)) {
        missingCandidates.push(addSkill);
      }
    }
  }

  // Pick top 3-4 realistic, highly relevant skills to improve
  const skillsToImprove = missingCandidates.slice(0, 4);

  // 5. Generate Tailored Actionable Suggestions based on resume inspection
  const suggestions = [];

  const hasMetrics = /%\s*|\b\d+\s*(?:%|percent|users|daily|monthly|requests|ms|seconds|records|queries|x|speedup|reduction|increase|downloads|stars)\b|\$\d+/i.test(lower);
  const hasLinks = /github\.com|linkedin\.com|https?:\/\/|[a-z0-9-]+\.(?:vercel\.app|netlify\.app|render\.com|io|dev)/i.test(lower);
  const hasProjects = /project|built|developed|implemented|architected|designed/i.test(lower);
  const hasTesting = /test|testing|jest|pytest|cypress|qa|unit/i.test(lower);
  const hasSummary = /summary|objective|about me|profile overview/i.test(lower);

  if (!hasMetrics) {
    suggestions.push('Add quantifiable impact metrics to project bullet points (e.g. "improved query speed by 35%", "handled 500+ daily API requests").');
  }
  if (!hasLinks) {
    suggestions.push('Include direct clickable links to your GitHub profile, portfolio, or live deployed project demos.');
  }
  if (!hasTesting) {
    if (detectedKeys.has('python')) {
      suggestions.push('Mention unit testing or test-driven development (e.g., PyTest, unittest) to demonstrate code reliability.');
    } else {
      suggestions.push('Highlight automated testing experience (e.g., Jest, React Testing Library) to strengthen production readiness.');
    }
  }
  if (!hasSummary) {
    suggestions.push(`Include a focused 2-3 line professional summary emphasizing your focus in ${bestDomain.domain}.`);
  }
  if (hasProjects && suggestions.length < 3) {
    suggestions.push('Detail the technical architecture and specific libraries used for each flagship project.');
  }
  if (suggestions.length < 3) {
    suggestions.push('Ensure experience descriptions start with strong action verbs (Architected, Implemented, Optimized, Deployed).');
  }

  // 6. Dynamic ATS Resume Score (50 - 98)
  let calculatedScore = 55;
  calculatedScore += Math.min(detectedSkillsRaw.length * 5, 20); // up to 20 pts for skills
  if (resumeText.length > 500) calculatedScore += 8;
  if (resumeText.length > 1200) calculatedScore += 5;
  if (hasMetrics) calculatedScore += 5;
  if (hasLinks) calculatedScore += 4;
  if (hasProjects) calculatedScore += 4;
  if (hasSummary) calculatedScore += 2;
  const score = Math.min(Math.max(calculatedScore, 60), 96);

  return {
    score,
    domain: bestDomain.domain,
    skills: matchedSkills,
    matchedSkills,
    skillsToImprove: skillsToImprove.length > 0 ? skillsToImprove : ['RESTful API Design', 'PostgreSQL', 'Unit Testing'],
    suggestions: suggestions.slice(0, 3),
    completeness: Math.min(score + 2, 98),
  };
}

/**
 * Extract text from PDF buffer and analyze with Gemini AI, enriched with real database job context.
 * Seamlessly falls back to the deterministic algorithmic engine on failure.
 */
const parseResume = async (pdfBuffer) => {
  let resumeText = '';
  try {
    const data = await pdfParse(pdfBuffer);
    resumeText = data.text || '';
  } catch (err) {
    console.error('[pdf-parse error]', err.message);
  }

  const detectedSkills = extractSkillsFromText(resumeText);
  const baselineAnalysis = await generateIntelligentAnalysis(resumeText, detectedSkills);

  if (!geminiService.hasApiKey() || !resumeText.trim()) {
    return {
      resumeText,
      analysis: baselineAnalysis,
    };
  }

  // Real open jobs context for Gemini prompt
  let activeJobsContext = '';
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState === 1) {
      const openJobs = await Job.find({ status: 'open' }).select('title skills_required').limit(6);
      if (openJobs.length > 0) {
        activeJobsContext = `Active In-Demand Job Postings on Platform:\n${openJobs.map(j => `- ${j.title} (Skills: ${(j.skills_required || []).join(', ')})`).join('\n')}`;
      }
    }
  } catch (_) {}

  const prompt = `
You are an expert AI Technical Recruiter and ATS Career Advisor.
Analyze the following resume text thoroughly and objectively based on real-world software engineering job standards.

${activeJobsContext}

Candidate Detected Baseline Skills: ${detectedSkills.join(', ') || 'None explicitly found'}

Requirements:
1. "score": Calculate a realistic ATS readiness score (55-98) based on technical depth, project quality, quantifiable impact, formatting, and completeness.
2. "domain": Identify the candidate's primary technical domain (e.g., "Full Stack Web Development", "Python Backend Engineering", "Data Science & AI", "Frontend Web Engineering").
3. "matchedSkills": Array of strings — candidate's verified, strongest technical skills extracted directly from their resume (format nicely, e.g. "Python", "JavaScript", "Git", "GitHub").
4. "skillsToImprove": Array of 3-4 realistic, high-priority complementary technical skills to learn next that bridge the gap to high-demand industry jobs matching THIS candidate's domain (e.g. if candidate knows Python & JavaScript, suggest relevant skills like "FastAPI", "PostgreSQL", "React", "RESTful APIs", "PyTest" — DO NOT provide random or disconnected technologies).
5. "suggestions": Array of 3-4 specific, constructive, actionable recommendations to improve this specific resume (referencing quantifiable metrics, live demo/GitHub links, project architecture, or testing).

Resume Text:
"""
${resumeText.substring(0, 4000)}
"""

Return ONLY a valid JSON object with the following exact keys:
{
  "score": number,
  "domain": string,
  "matchedSkills": string[],
  "skillsToImprove": string[],
  "suggestions": string[]
}
`;

  try {
    const aiResult = await geminiService.generateStructuredJSON(prompt);
    const combinedAnalysis = {
      score: typeof aiResult.score === 'number' ? aiResult.score : baselineAnalysis.score,
      domain: aiResult.domain || baselineAnalysis.domain,
      skills: (aiResult.matchedSkills?.length ? aiResult.matchedSkills : baselineAnalysis.skills),
      matchedSkills: (aiResult.matchedSkills?.length ? aiResult.matchedSkills : baselineAnalysis.matchedSkills),
      skillsToImprove: (aiResult.skillsToImprove?.length ? aiResult.skillsToImprove : baselineAnalysis.skillsToImprove),
      suggestions: (aiResult.suggestions?.length ? aiResult.suggestions : baselineAnalysis.suggestions),
      completeness: baselineAnalysis.completeness,
    };

    return {
      resumeText,
      analysis: combinedAnalysis,
    };
  } catch (err) {
    console.warn('[parseResume Gemini Fallback]', err.message);
    return {
      resumeText,
      analysis: baselineAnalysis,
    };
  }
};

module.exports = {
  parseResume,
  extractSkillsFromText,
  formatSkillName,
  generateIntelligentAnalysis,
};
