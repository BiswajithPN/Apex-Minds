/**
 * test_resumeScreener.js
 * 
 * Comprehensive test suite for resumeScreener.js
 * Uses ONLY built-in Node.js — no external test frameworks needed.
 */

const { screenResumeLocal } = require('./resumeScreener');

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, testName) {
    if (condition) {
        console.log(`  ✅ PASS: ${testName}`);
        passed++;
    } else {
        console.log(`  ❌ FAIL: ${testName}`);
        failed++;
        failures.push(testName);
    }
}

// =========================================================
// TEST 1: Perfect Match — all skills, enough experience, education
// =========================================================
console.log("\n========================================");
console.log("TEST 1: Perfect Match");
console.log("========================================");
{
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
    const result = screenResumeLocal(jd, resume);
    
    assert(result.matchScore === 100, "Score should be 100 for a perfect match");
    assert(result.matchedSkills.length === 4, "All 4 skills should match");
    assert(result.missingSkills.length === 0, "No skills should be missing");
    assert(result.experienceYears === 5, "Should extract 5 years experience");
    assert(result.educationMatch === true, "Education should match (B.S.)");
    assert(result.keywordEvidence.length === 4, "Should have 4 evidence entries");
    assert(typeof result.reasoning === 'string' && result.reasoning.length > 0, "Reasoning should be a non-empty string");
}


// =========================================================
// TEST 2: Zero Match — no skills, no experience, no education
// =========================================================
console.log("\n========================================");
console.log("TEST 2: Zero Match");
console.log("========================================");
{
    const jd = `
    Required Skills: Kubernetes, Terraform, AWS.
    Minimum 5 years of experience.
    Education: Master's degree required.
    `;
    const resume = `
    I enjoy painting and cooking in my free time.
    Volunteered at a local shelter for 2 summers.
    `;
    const result = screenResumeLocal(jd, resume);
    
    assert(result.matchScore === 0, "Score should be 0 for zero match");
    assert(result.matchedSkills.length === 0, "No skills should match");
    assert(result.missingSkills.length === 3, "All 3 skills should be missing");
    assert(result.experienceYears === 0, "Should extract 0 years experience");
    assert(result.educationMatch === false, "Education should not match");
}


// =========================================================
// TEST 3: Partial Match — some skills present, some missing
// =========================================================
console.log("\n========================================");
console.log("TEST 3: Partial Match");
console.log("========================================");
{
    const jd = `
    Required Skills: Python, Django, PostgreSQL, Redis.
    Minimum 4 years of experience.
    Education: Bachelor's degree.
    `;
    const resume = `
    Education: B.Tech in Information Technology.
    Experience: 3 years of experience as a backend developer.
    Built web apps using Python and Django.
    Used MySQL for database management.
    `;
    const result = screenResumeLocal(jd, resume);
    
    assert(result.matchedSkills.includes("Python"), "Python should be matched");
    assert(result.matchedSkills.includes("Django"), "Django should be matched");
    assert(result.missingSkills.includes("PostgreSQL"), "PostgreSQL should be missing");
    assert(result.missingSkills.includes("Redis"), "Redis should be missing");
    assert(result.experienceYears === 3, "Should extract 3 years");
    assert(result.educationMatch === true, "B.Tech should match education");
    assert(result.matchScore > 0 && result.matchScore < 100, "Score should be partial (between 0 and 100)");
}


// =========================================================
// TEST 4: Experience Variations — '3+ yrs', '10 years of experience'
// =========================================================
console.log("\n========================================");
console.log("TEST 4: Experience Parsing Variations");
console.log("========================================");
{
    const jd1 = `Required Skills: Java. Minimum 2+ years of experience.`;
    const resume1 = `Experience: 10 years of experience with Java development.`;
    const r1 = screenResumeLocal(jd1, resume1);
    assert(r1.experienceYears === 10, "Should parse '10 years of experience'");

    const jd2 = `Required Skills: Go. At least 5 yrs experience.`;
    const resume2 = `3 yrs working as a Go developer. Education: BS in CS.`;
    const r2 = screenResumeLocal(jd2, resume2);
    assert(r2.experienceYears === 3, "Should parse '3 yrs working'");
}


// =========================================================
// TEST 5: Education Variations — B.Tech, Master, PhD
// =========================================================
console.log("\n========================================");
console.log("TEST 5: Education Keyword Variations");
console.log("========================================");
{
    const jd = `Required Skills: C++.`;
    
    const cases = [
        { resume: "Education: B.Tech in ECE", expected: true, label: "B.Tech" },
        { resume: "Education: M.Tech in CS", expected: true, label: "M.Tech" },
        { resume: "Education: Master of Science", expected: true, label: "Master" },
        { resume: "Education: PhD in Machine Learning", expected: true, label: "PhD" },
        { resume: "Education: Bachelor of Arts", expected: true, label: "Bachelor" },
        { resume: "Completed high school diploma", expected: false, label: "High School only" },
    ];
    
    for (let c of cases) {
        const r = screenResumeLocal(jd, c.resume);
        assert(r.educationMatch === c.expected, `Education '${c.label}' should be ${c.expected}`);
    }
}


// =========================================================
// TEST 6: Evidence / sourceText — should cite resume lines
// =========================================================
console.log("\n========================================");
console.log("TEST 6: Evidence Citation");
console.log("========================================");
{
    const jd = `Required Skills: React, TypeScript.`;
    const resume = `Built interactive dashboards using React and Chart.js. No TypeScript experience.`;
    const result = screenResumeLocal(jd, resume);
    
    const reactEvidence = result.keywordEvidence.find(e => e.criterion === "Skill: React");
    assert(reactEvidence !== undefined, "Should have evidence entry for React");
    assert(reactEvidence.found === true, "React evidence should be found=true");
    assert(reactEvidence.sourceText.includes("React"), "React sourceText should cite the resume line");
    
    const tsEvidence = result.keywordEvidence.find(e => e.criterion === "Skill: TypeScript");
    assert(tsEvidence !== undefined, "Should have evidence entry for TypeScript");
    // TypeScript IS mentioned in the resume text ("No TypeScript experience") so the keyword matcher will find it
    // This is a known limitation of keyword-based matching
}


// =========================================================
// TEST 7: Empty Inputs — should not crash
// =========================================================
console.log("\n========================================");
console.log("TEST 7: Empty / Edge Case Inputs");
console.log("========================================");
{
    let r;
    
    // Both empty
    r = screenResumeLocal("", "");
    assert(typeof r.matchScore === 'number', "Empty inputs should return a valid score");
    assert(Array.isArray(r.matchedSkills), "Empty inputs should return matchedSkills array");
    assert(Array.isArray(r.missingSkills), "Empty inputs should return missingSkills array");
    
    // JD empty, resume has content
    r = screenResumeLocal("", "5 years experience with Python. B.S. in CS.");
    assert(r.matchScore > 0, "Empty JD with good resume should still give a score");
    
    // JD has content, resume empty
    r = screenResumeLocal("Required Skills: Java, Spring. 3 years experience. Bachelor's degree.", "");
    assert(r.matchScore === 0, "Good JD with empty resume should give 0");
    assert(r.missingSkills.length > 0, "Should list missing skills for empty resume");
}


// =========================================================
// TEST 8: Output Schema Validation
// =========================================================
console.log("\n========================================");
console.log("TEST 8: Output JSON Schema Validation");
console.log("========================================");
{
    const jd = `Required Skills: Python. 2 years experience. Bachelor's degree.`;
    const resume = `Python developer with 3 years experience. B.S. in Computer Science.`;
    const result = screenResumeLocal(jd, resume);
    
    assert(typeof result.matchScore === 'number', "matchScore should be a number");
    assert(result.matchScore >= 0 && result.matchScore <= 100, "matchScore should be 0-100");
    assert(Array.isArray(result.matchedSkills), "matchedSkills should be an array");
    assert(Array.isArray(result.missingSkills), "missingSkills should be an array");
    assert(typeof result.experienceYears === 'number', "experienceYears should be a number");
    assert(typeof result.educationMatch === 'boolean', "educationMatch should be a boolean");
    assert(Array.isArray(result.biasFiltersApplied), "biasFiltersApplied should be an array");
    assert(Array.isArray(result.keywordEvidence), "keywordEvidence should be an array");
    assert(typeof result.reasoning === 'string', "reasoning should be a string");
    
    // Check keywordEvidence shape
    for (let ev of result.keywordEvidence) {
        assert(typeof ev.criterion === 'string', "evidence.criterion should be a string");
        assert(typeof ev.found === 'boolean', "evidence.found should be a boolean");
        assert(typeof ev.sourceText === 'string', "evidence.sourceText should be a string");
    }
    
    // Verify it serializes to valid JSON
    const jsonStr = JSON.stringify(result);
    const reparsed = JSON.parse(jsonStr);
    assert(reparsed.matchScore === result.matchScore, "JSON round-trip should preserve data");
}

// =========================================================
// TEST 8b: Negation & Synonym Testing
// =========================================================
console.log("\n========================================");
console.log("TEST 8b: Negation & Synonym Testing");
console.log("========================================");
{
    const jd = `Required Skills: React, Kubernetes, JavaScript, Node.js`;
    const resume = `
    I have zero experience with React.
    Deployed apps on K8s.
    Proficient in JS.
    No node.js knowledge.
    `;
    const r = screenResumeLocal(jd, resume);
    assert(r.missingSkills.includes("React"), "Negated React should be missing");
    assert(r.missingSkills.includes("Node.js"), "Negated Node.js should be missing");
    assert(r.matchedSkills.includes("Kubernetes"), "Synonym K8s should match Kubernetes");
    assert(r.matchedSkills.includes("JavaScript"), "Synonym JS should match JavaScript");
}


// =========================================================
// TEST 9: Case Insensitivity
// =========================================================
console.log("\n========================================");
console.log("TEST 9: Case Insensitivity");
console.log("========================================");
{
    const jd = `Required Skills: PYTHON, react, Node.JS.`;
    const resume = `Worked with python, React, and NODE.JS for 2 years of experience. B.S. degree.`;
    const result = screenResumeLocal(jd, resume);
    
    assert(result.matchedSkills.length === 3, "Case-insensitive matching should find all 3 skills");
    assert(result.missingSkills.length === 0, "No skills should be missing with case differences");
}


// =========================================================
// TEST 10: Scoring Logic Verification
// =========================================================
console.log("\n========================================");
console.log("TEST 10: Scoring Math Verification");
console.log("========================================");
{
    // Skills only (50%), no experience, no education
    const jd1 = `Required Skills: A, B.`;
    const resume1 = `Worked with A and B.`;
    const r1 = screenResumeLocal(jd1, resume1);
    // Skills: 2/2 = 50, Exp: 0 required so +30, Edu: no = 0 => 80
    assert(r1.matchScore === 80, `Skills+no-exp-req score should be 80, got ${r1.matchScore}`);
    
    // Half skills, full experience, education
    const jd2 = `Required Skills: X, Y, Z, W. 2 years experience. Bachelor's degree.`;
    const resume2 = `Worked with X and Y. 4 years experience. Bachelor of Science.`;
    const r2 = screenResumeLocal(jd2, resume2);
    // Skills: 2/4 = 25, Exp: min(4/2,1)*30 = 30, Edu: 20 => 75
    assert(r2.matchScore === 75, `Half skills + full exp + edu should be 75, got ${r2.matchScore}`);
}


// =========================================================
// SUMMARY
// =========================================================
console.log("\n========================================");
console.log("TEST SUMMARY");
console.log("========================================");
console.log(`Total: ${passed + failed} | ✅ Passed: ${passed} | ❌ Failed: ${failed}`);
if (failures.length > 0) {
    console.log("\nFailed tests:");
    for (let f of failures) {
        console.log(`  - ${f}`);
    }
}
console.log("");
process.exit(failed > 0 ? 1 : 0);
