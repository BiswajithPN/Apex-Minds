import re
import json
import math
from typing import List

def extract_years_experience(text: str) -> float:
    """Extracts years of experience from text (e.g. '4 years', '3+ yrs')."""
    pattern = r'(\d+)\+?\s*(?:years?|yrs?)(?:\s+of)?\s+(?:experience|working)?'
    matches = re.findall(pattern, text, re.IGNORECASE)
    if matches:
        return float(max(int(m) for m in matches))
    return 0.0

def extract_education(text: str) -> bool:
    """Checks for degree keywords."""
    keywords = ['bachelor', 'b.s.', 'bs', 'b.a.', 'ba', 'master', 'm.s.', 'phd', 'degree', 'b.tech', 'm.tech']
    text_lower = text.lower()
    return any(kw in text_lower for kw in keywords)

def extract_skills_from_jd(jd_text: str) -> List[str]:
    """Basic heuristic to extract skills from a Job Description."""
    skills = []
    # Look for common keywords or split by commas near "Skills"
    lines = jd_text.split('\n')
    for line in lines:
        if any(kw in line.lower() for kw in ['skill', 'technology', 'stack', 'requirement']):
            # Remove the prefix like "Required Skills:"
            clean_line = re.sub(r'^.*?:', '', line)
            parts = re.split(r'[,;]', clean_line)
            for part in parts:
                part = part.strip()
                if part and part.lower() not in ['required skills', 'skills', 'technologies', 'stack', 'requirements']:
                    skills.append(part)
                    
    # Fallback to a common tech stack list if none found
    if not skills:
        common = ['python', 'react', 'java', 'c++', 'sql', 'postgres', 'postgresql', 'aws', 'docker', 'kubernetes', 'fastapi', 'django', 'node']
        for c in common:
            if c in jd_text.lower():
                skills.append(c)
                
    return list(set([s.strip() for s in skills if s.strip()]))

def screen_resume_local(job_description: str, resume_text: str) -> str:
    """
    Screens a resume against a JD using purely inbuilt Python code.
    Returns the required JSON format.
    """
    required_skills = extract_skills_from_jd(job_description)
    exp_required = extract_years_experience(job_description)
    
    resume_lower = resume_text.lower()
    exp_years = extract_years_experience(resume_text)
    edu_match = extract_education(resume_text)
    
    matched_skills = []
    missing_skills = []
    keyword_evidence = []
    
    for skill in required_skills:
        # Check if the skill exists in the resume
        escaped_skill = re.escape(skill.lower())
        match = re.search(r'\b' + escaped_skill + r'\b', resume_lower)
        if match:
            matched_skills.append(skill)
            # Find the sentence containing the skill for evidence
            sentences = re.split(r'[.!?\n]', resume_text)
            evidence_text = ""
            for s in sentences:
                if skill.lower() in s.lower():
                    evidence_text = s.strip()
                    break
                    
            keyword_evidence.append({
                "criterion": f"Skill: {skill}",
                "found": True,
                "sourceText": evidence_text
            })
        else:
            missing_skills.append(skill)
            keyword_evidence.append({
                "criterion": f"Skill: {skill}",
                "found": False,
                "sourceText": ""
            })
            
    # Compute Match Score (0 - 100)
    score = 0
    if required_skills:
        skill_score = (len(matched_skills) / len(required_skills)) * 50
    else:
        skill_score = 50 # Full points if no specific skills listed
        
    score += skill_score
    
    if exp_required > 0:
        exp_ratio = min(exp_years / exp_required, 1.0)
        score += exp_ratio * 30
    else:
        score += 30
        
    if edu_match:
        score += 20
        
    score = int(math.ceil(score))
    
    reasoning = (
        f"Analyzed locally using inbuilt tools. "
        f"Candidate has {exp_years} years of experience (vs {exp_required} required). "
        f"Matched {len(matched_skills)} out of {len(required_skills)} skills. "
        f"Education requirement met: {edu_match}."
    )
    
    result = {
        "matchScore": score,
        "matchedSkills": matched_skills,
        "missingSkills": missing_skills,
        "experienceYears": exp_years,
        "experienceRequired": exp_required,
        "educationMatch": edu_match,
        "keywordEvidence": keyword_evidence,
        "reasoning": reasoning
    }
    
    return json.dumps(result, indent=2)

if __name__ == "__main__":
    sample_jd = '''
    We are looking for a Software Engineer with at least 3 years of experience.
    Required Skills: Python, React, PostgreSQL.
    Education: Bachelor's degree in Computer Science or related field.
    '''
    
    sample_resume = '''
    Education: B.S. in Computer Science
    Experience: 4 years working as a full-stack developer. 
    Built backend services using Python and FastAPI. 
    Managed databases using PostgreSQL.
    Frontend experience with Vue.js, no React experience yet.
    '''
    
    print("Screening Resume using LOCAL Inbuilt Python logic (No API Keys)...\n")
    print(screen_resume_local(sample_jd, sample_resume))
