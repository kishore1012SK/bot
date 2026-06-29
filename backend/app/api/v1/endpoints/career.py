import json
import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_active_user
from app.repositories.specialized import SpecializedRepository
from app.schemas.schemas import CareerAssessmentSubmit, CareerAssessmentResponse
from app.services.ai.manager import ProviderManager
from app.models.models import User

logger = logging.getLogger("career_api")
router = APIRouter()

@router.post("/assess", response_model=CareerAssessmentResponse, status_code=status.HTTP_201_CREATED)
async def submit_assessment(
    assessment: CareerAssessmentSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    spec_repo = SpecializedRepository(db)
    provider = ProviderManager.get_provider()

    # Define prompt instructions to enforce structured JSON output from local LLM
    prompt = f"""
    You are an expert career counsellor. Evaluate this student/employee profile and output a structured JSON response matching the schema below.
    
    User Profile:
    - Current Skills: {", ".join(assessment.skills)}
    - Interests: {", ".join(assessment.interests)}
    - Experience: {assessment.experience_years} years
    - Preference: {assessment.preferred_work_type}
    - Career Goals: {assessment.goals}
    
    Output JSON format ONLY. Do not write markdown markers or explanation outside the JSON.
    Expected Schema:
    {{
        "recommended_roles": ["Role A", "Role B"],
        "skills_gap_analysis": {{
            "matched_skills": ["Skill A"],
            "missing_skills": ["Skill B", "Skill C"],
            "critical_focus_areas": ["Area A"]
        }},
        "milestones_roadmap": [
            {{"phase": "Phase 1: Short Term", "duration": "0-3 months", "actions": ["Learn X", "Build Y"]}},
            {{"phase": "Phase 2: Medium Term", "duration": "3-6 months", "actions": ["Certify in Z"]}}
        ],
        "course_recommendations": [
            {{"title": "Course Name", "topics": ["Topic A"], "provider_type": "Coursera/Udemy/Self-study"}}
        ]
    }}
    """
    
    try:
        raw_response = await provider.generate(prompt, system_prompt="You are a JSON generator. Respond only with valid JSON.")
        
        # Clean response in case LLM added markdown ticks ```json ... ```
        cleaned = raw_response.strip()
        if cleaned.startswith("```"):
            lines = cleaned.split("\n")
            if lines[0].startswith("```json") or lines[0].startswith("```"):
                cleaned = "\n".join(lines[1:-1])
        
        results = json.loads(cleaned)
    except Exception as e:
        logger.warning(f"Failed to parse LLM JSON output for career assessment: {e}. Falling back to default format.")
        # Fallback structured JSON in case local model outputs non-valid JSON
        results = {
            "recommended_roles": ["Software Engineer", "Systems Architect"],
            "skills_gap_analysis": {
                "matched_skills": assessment.skills,
                "missing_skills": ["System Design", "Advanced Algorithms", "Docker"],
                "critical_focus_areas": ["Containerization", "Microservices Design"]
            },
            "milestones_roadmap": [
                {"phase": "Phase 1: Foundation", "duration": "1-3 months", "actions": ["Build sample applications", "Study cloud deployment fundamentals"]},
                {"phase": "Phase 2: Upskilling", "duration": "3-6 months", "actions": ["Complete advanced systems architecture documentation"]}
            ],
            "course_recommendations": [
                {"title": "Fundamentals of Distributed Systems Architecture", "topics": ["Consistency Models", "Load Balancing"], "provider_type": "Corporate Portal"}
            ],
            "note": "AI response parser encountered a format error and returned standard guidelines matching your goals."
        }

    # Save to Database
    db_assessment = await spec_repo.create_career_assessment(
        user_id=current_user.id,
        assessment_data=assessment.model_dump(),
        results=results
    )
    await db.commit()
    return db_assessment

@router.get("/history", response_model=List[CareerAssessmentResponse])
async def get_career_history(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    spec_repo = SpecializedRepository(db)
    return await spec_repo.get_user_career_assessments(current_user.id)
