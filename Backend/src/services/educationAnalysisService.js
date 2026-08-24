/**
 * educationAnalysisService.js — Education Qualification & Field Alignment Analyzer
 */

const DEGREE_LEVELS = [
  { level: 'doctorate', keywords: ['phd', 'ph.d', 'doctorate', 'doctor of philosophy'], points: 100 },
  { level: 'master', keywords: ['master', 'm.s.', 'm.a.', 'msc', 'ms', 'm.tech', 'mtech', 'mba', 'm.e.'], points: 90 },
  { level: 'bachelor', keywords: ['bachelor', 'b.s.', 'b.a.', 'bsc', 'bs', 'b.e.', 'b.tech', 'btech', 'bca', 'b.sc'], points: 80 },
  { level: 'diploma', keywords: ['diploma', 'associate', 'polytechnic'], points: 65 },
  { level: 'certification', keywords: ['certificate', 'certified', 'bootcamp'], points: 60 }
];

const FIELDS_MAP = [
  { field: 'Computer Science & Engineering', keywords: ['computer science', 'cs', 'cse', 'information technology', 'software engineering', 'computer engineering', 'data science', 'ai', 'artificial intelligence'] },
  { field: 'Electrical / Electronics', keywords: ['electrical', 'electronics', 'ece', 'eee', 'telecommunication'] },
  { field: 'Mechanical / Civil / Other Engineering', keywords: ['mechanical', 'civil', 'chemical', 'biotech', 'mechatronics'] },
  { field: 'Business & Management', keywords: ['business administration', 'finance', 'marketing', 'management', 'economics', 'commerce'] },
  { field: 'Mathematics & Statistics', keywords: ['mathematics', 'statistics', 'physics', 'applied math'] }
];

function extractEducationFromResume(resumeText) {
  if (!resumeText) {
    return {
      degree: 'Not Specified',
      field: 'Not Specified',
      institution: 'Not Specified',
      graduationYear: '',
      specialization: '',
      detectedLevel: 'bachelor',
      points: 70
    };
  }

  const textLower = resumeText.toLowerCase();

  let detectedDegree = 'Bachelor Degree (or Equivalent)';
  let detectedPoints = 75;
  let detectedLevel = 'bachelor';

  for (const item of DEGREE_LEVELS) {
    for (const kw of item.keywords) {
      const rx = new RegExp(`\\b${kw.replace('.', '\\.')}\\b`, 'i');
      if (rx.test(textLower)) {
        detectedDegree = kw.toUpperCase();
        detectedPoints = item.points;
        detectedLevel = item.level;
        break;
      }
    }
    if (detectedLevel !== 'bachelor') break;
  }

  let detectedField = 'Technology / Engineering';
  for (const item of FIELDS_MAP) {
    for (const kw of item.keywords) {
      if (textLower.includes(kw)) {
        detectedField = item.field;
        break;
      }
    }
    if (detectedField !== 'Technology / Engineering') break;
  }

  // Extract institution if present (e.g. University of ..., ... Institute of Technology)
  let institution = 'Accredited Institution';
  const instMatch = resumeText.match(/\b([A-Z][a-zA-Z\s&]{2,30}(?:University|Institute|College|Academy|Polytechnic))\b/);
  if (instMatch && instMatch[1]) {
    institution = instMatch[1].trim();
  }

  // Extract graduation year if present
  let graduationYear = '';
  const yearMatch = resumeText.match(/\b(20[0-2]\d|19\d{2})\b/);
  if (yearMatch && yearMatch[1]) {
    graduationYear = yearMatch[1];
  }

  return {
    degree: detectedDegree,
    field: detectedField,
    institution,
    graduationYear,
    specialization: detectedField,
    detectedLevel,
    points: detectedPoints
  };
}

function analyzeEducationMatch(educationInfo, jobDescription) {
  const jdLower = (jobDescription || '').toLowerCase();

  let requiredDegree = 'bachelor';
  if (/master|m\.s|mtech|mba/i.test(jdLower)) requiredDegree = 'master';
  else if (/phd|doctorate/i.test(jdLower)) requiredDegree = 'doctorate';

  const reqIndex = DEGREE_LEVELS.findIndex((d) => d.level === requiredDegree);
  const candIndex = DEGREE_LEVELS.findIndex((d) => d.level === educationInfo.detectedLevel);

  const meetsRequirement = candIndex <= reqIndex;

  let educationScore = educationInfo.points;
  if (!meetsRequirement) {
    educationScore = Math.max(50, educationInfo.points - 20);
  }

  return {
    educationScore,
    degree: educationInfo.degree,
    field: educationInfo.field,
    institution: educationInfo.institution,
    graduationYear: educationInfo.graduationYear,
    specialization: educationInfo.specialization,
    meetsRequirement,
    educationMatch: meetsRequirement ? 'Meets or Exceeds Educational Criteria' : 'Partial Educational Alignment'
  };
}

module.exports = {
  extractEducationFromResume,
  analyzeEducationMatch
};
