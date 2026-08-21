const { screenResumeLocal } = require('./resumeScreener');

const jd = `
We are looking for a Full Stack Developer with at least 3 years of experience.
Required Skills: React, Node.js, MongoDB, Express.
Education: Bachelor's degree in Computer Science.
`;
const resume = `
Education: B.S. in Computer Science
Experience: 5 years of experience as a full-stack developer.
Built scalable REST APIs using Node.js and Express.
Created dynamic UIs using React and Redux.
Managed NoSQL databases with MongoDB.
`;

const r = screenResumeLocal(jd, resume);
console.log("All extracted skills from JD:", JSON.stringify(r.matchedSkills.concat(r.missingSkills)));
console.log("Matched:", JSON.stringify(r.matchedSkills));
console.log("Missing:", JSON.stringify(r.missingSkills));
console.log("Evidence:", JSON.stringify(r.keywordEvidence, null, 2));
console.log("Score:", r.matchScore);
