import json
import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_active_user
from app.repositories.specialized import SpecializedRepository
from app.schemas.schemas import ProjectRecommendSubmit, ProjectRecommendationResponse
from app.services.ai.manager import ProviderManager
from app.models.models import User

logger = logging.getLogger("projects_api")
router = APIRouter()

@router.post("/recommend", response_model=ProjectRecommendationResponse, status_code=status.HTTP_201_CREATED)
async def recommend_projects(
    recommend_in: ProjectRecommendSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    spec_repo = SpecializedRepository(db)
    provider = ProviderManager.get_provider()

    # Create recommendation prompt
    prompt = f"""
    You are an expert technical lead recommending software projects matching a user's skillset.
    Recommend three appropriate projects suited for a {recommend_in.difficulty} developer.
    
    Candidate Skills: {", ".join(recommend_in.skills)}
    Target Difficulty: {recommend_in.difficulty}
    
    Output JSON format ONLY. Do not write markdown markers or explanation outside the JSON.
    Expected Schema:
    {{
        "projects": [
            {{
                "title": "Project Name",
                "description": "Short project synopsis",
                "difficulty_rating": "{recommend_in.difficulty}",
                "stack": ["Python", "Docker"],
                "estimated_hours": 40,
                "milestones": [
                    {{"step": "Milestone 1", "description": "Set up repo and base setup"}},
                    {{"step": "Milestone 2", "description": "Implement core routes"}}
                ]
            }}
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
                
        recommended_projects = json.loads(cleaned)
    except Exception as e:
        logger.warning(f"Failed to parse project recommendations JSON output: {e}. Falling back to default suggestions.")
        recommended_projects = {
            "projects": [
                {
                    "title": "Corporate Secure Dashboard System",
                    "description": "Create an internally deployed metric visualizer dashboard utilizing local SQLite data layers.",
                    "difficulty_rating": recommend_in.difficulty,
                    "stack": ["Python", "FastAPI", "Tailwind CSS"],
                    "estimated_hours": 30,
                    "milestones": [
                        {"step": "Phase 1: Environment Setup", "description": "Configure FastAPI application endpoints and CORS permissions."},
                        {"step": "Phase 2: Frontend Integrations", "description": "Build responsive Tailwind HTML visualizers."}
                    ]
                }
            ],
            "note": "AI engine response formatting error occurred. Default project recommended."
        }

    # Save to Database
    db_rec = await spec_repo.create_project_recommendation(
        user_id=current_user.id,
        skills=recommend_in.skills,
        difficulty=recommend_in.difficulty,
        recommended_projects=recommended_projects
    )
    
    await db.commit()
    return db_rec

@router.get("/history", response_model=List[ProjectRecommendationResponse])
async def get_project_history(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    spec_repo = SpecializedRepository(db)
    return await spec_repo.get_user_project_recommendations(current_user.id)
