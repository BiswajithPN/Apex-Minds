/**
 * projectAnalysisService.js — Project Relevance & Technology Alignment Analyzer
 */

const KNOWN_TECHS = [
  'python', 'javascript', 'typescript', 'react', 'node.js', 'node', 'express', 'django', 'flask', 'fastapi',
  'vue', 'angular', 'svelte', 'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'aws', 'azure', 'gcp',
  'docker', 'kubernetes', 'terraform', 'ci/cd', 'git', 'github', 'machine learning', 'deep learning',
  'tensorflow', 'pytorch', 'scikit-learn', 'pandas', 'numpy', 'nlp', 'rest api', 'graphql', 'html', 'css',
  'tailwind', 'bootstrap', 'microservices', 'kafka', 'next.js', 'solidity', 'linux', 'firebase'
];

/**
 * Extract candidate projects from resume text
 */
function extractProjectsFromResume(resumeText) {
  if (!resumeText) return [];

  const projects = [];
  const lines = resumeText.split(/\r?\n/);
  let insideProjectSection = false;
  let currentProject = null;

  const projectHeaderRegex = /\b(projects?|key projects?|academic projects?|personal projects?|notable projects?)\b/i;
  const otherSectionRegex = /\b(experience|employment|work history|education|skills|certifications|awards|summary|contact)\b/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Check if entered project section
    if (projectHeaderRegex.test(line) && line.length < 35 && !line.includes(':')) {
      insideProjectSection = true;
      continue;
    }

    // Check if transitioned into another section
    if (insideProjectSection && otherSectionRegex.test(line) && line.length < 35 && !line.includes(':')) {
      insideProjectSection = false;
      if (currentProject) projects.push(currentProject);
      currentProject = null;
      continue;
    }

    if (insideProjectSection) {
      // Heuristic for new project heading (e.g. "E-Commerce Platform - React, Node", "• AI Chatbot", "Prediction Engine:")
      const isNewItem = /^([•\-*]|\d+\.|\b(built|developed|created|implemented|designed)\b)/i.test(line) ||
        (line.length < 60 && (line.includes('|') || line.includes('-') || line.includes(':')));

      if (isNewItem && currentProject && currentProject.description.length > 20) {
        projects.push(currentProject);
        currentProject = null;
      }

      if (!currentProject) {
        currentProject = {
          title: line.replace(/^[•\-*]\s*/, '').slice(0, 80),
          description: line,
          technologies: []
        };
      } else {
        currentProject.description += ' ' + line;
      }
    }
  }

  if (currentProject && currentProject.description.length > 15) {
    projects.push(currentProject);
  }

  // Fallback: If no explicit Projects section found, scan for paragraphs containing project action words
  if (projects.length === 0) {
    const sentences = resumeText.split(/(?<=[.!?])\s+|\n+/);
    for (const s of sentences) {
      if (/\b(built|developed|created|implemented|architected|engineered|designed)\b/i.test(s) && s.length > 25) {
        projects.push({
          title: s.slice(0, 60) + '...',
          description: s,
          technologies: []
        });
      }
    }
  }

  // Extract technologies for each project
  for (const proj of projects) {
    const textLower = proj.description.toLowerCase();
    const foundTechs = new Set();
    for (const tech of KNOWN_TECHS) {
      const escaped = tech.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const rx = new RegExp(`(?<=[^a-zA-Z0-9#+]|^)${escaped}(?=[^a-zA-Z0-9#+]|$)`, 'i');
      if (rx.test(textLower)) {
        foundTechs.add(tech);
      }
    }
    proj.technologies = Array.from(foundTechs);
  }

  return projects.slice(0, 6);
}

/**
 * Compare extracted projects against job requirements
 */
function analyzeProjectRelevance(projects, jobDescription, requiredSkills = []) {
  if (!projects || projects.length === 0) {
    return {
      projectScore: 40, // Base default score when project section is implicit
      relevantProjects: [],
      irrelevantProjects: [],
      hasProjectEvidence: false
    };
  }

  const jdLower = (jobDescription || '').toLowerCase();
  const reqSkillsLower = new Set((requiredSkills || []).map((s) => s.toLowerCase()));

  const relevantProjects = [];
  const irrelevantProjects = [];

  for (const proj of projects) {
    const matchedTechs = proj.technologies.filter(
      (t) => reqSkillsLower.has(t) || jdLower.includes(t)
    );

    if (matchedTechs.length > 0) {
      relevantProjects.push({
        title: proj.title,
        technologies: proj.technologies,
        relevanceRationale: `Demonstrates applied expertise in ${matchedTechs.join(', ')} matching job requirements.`
      });
    } else {
      irrelevantProjects.push({
        title: proj.title,
        technologies: proj.technologies
      });
    }
  }

  // Graded scoring (0–100)
  let score = 50;
  if (relevantProjects.length >= 3) score = 95;
  else if (relevantProjects.length === 2) score = 85;
  else if (relevantProjects.length === 1) score = 70;
  else if (projects.length > 0) score = 55;

  return {
    projectScore: score,
    relevantProjects,
    irrelevantProjects,
    hasProjectEvidence: true
  };
}

module.exports = {
  extractProjectsFromResume,
  analyzeProjectRelevance
};
