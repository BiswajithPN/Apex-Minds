import os
import json
from pydantic import BaseModel, Field
from typing import List
from google import genai
from google.genai import types

# Define the expected JSON output schema using Pydantic
class KeywordEvidence(BaseModel):
    criterion: str
    found: bool
    sourceText: str

class ResumeScreeningResult(BaseModel):
    matchScore: int = Field(description="Score from 0 to 100 based purely on skills/experience/education fit")
    matchedSkills: List[str]
    missingSkills: List[str]
    experienceYears: float
    experienceRequired: float
    educationMatch: bool
    keywordEvidence: List[KeywordEvidence]
    reasoning: str

def screen_resume(job_description: str, resume_text: str, api_key: str = None) -> str:
    """
    Screens a resume against a job description using Gemini.
    Returns a strictly formatted JSON string based on the requested schema.
    """
    # Initialize the Gemini client. It will automatically use the GEMINI_API_KEY env var if no key is passed.
    client = genai.Client(api_key=api_key)

    # The prompt template provided
    prompt = f"""You are a resume screening assistant for a bias-aware hiring pipeline.

You will receive:
1. A job description with required skills, minimum experience, and education requirements.
2. Resume text with identity-related fields already redacted (name, gender, photo, age, address are NOT included — do not attempt to infer or comment on them).

Your task:
1. Extract only job-relevant signals: skills, years of relevant experience, education, certifications, and notable projects.
2. Compare extracted signals against the job requirements.
3. Compute a matchScore from 0–100 based purely on skills/experience/education fit.
4. For every criterion you evaluate, cite the exact resume line/phrase that supports your judgment (this is mandatory — no unsupported claims).
5. List matchedSkills and missingSkills explicitly.
6. Do not penalize or reward based on tone, formatting, university prestige, employment gaps, or writing style unless the job description explicitly requires those.
7. Return ONLY valid JSON in this exact schema, no preamble or markdown.

Job Description:
{job_description}

Resume Text (identity fields redacted):
{resume_text}
"""

    # Call the model with structured output enabled
    response = client.models.generate_content(
        model='gemini-2.5-pro',
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=ResumeScreeningResult,
            temperature=0.1, # Low temperature since we want analytical, deterministic evaluations
        ),
    )
    
    return response.text

if __name__ == "__main__":
    # Example usage for testing
    sample_job_description = '''
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
    
    print("Screening Resume... Please wait.\n")
    try:
        # Note: Make sure to set your GEMINI_API_KEY environment variable before running
        result_json_str = screen_resume(sample_job_description, sample_resume)
        
        print("--- Resulting JSON ---\n")
        print(result_json_str)
        
        # Verify it parses correctly
        parsed_result = json.loads(result_json_str)
        print(f"\nSuccessfully parsed! Match Score: {parsed_result.get('matchScore')}/100")

    except Exception as e:
        print(f"Error occurred: {e}")
        print("\nDid you remember to set the GEMINI_API_KEY environment variable?")
        print("Example (Windows PowerShell): $env:GEMINI_API_KEY='your-key-here'")
