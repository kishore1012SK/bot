import os
import json
import shutil
import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_active_user
from app.repositories.specialized import SpecializedRepository
from app.schemas.schemas import ResumeAnalysisResponse
from app.services.knowledge.parsers import parse_document
from app.services.ai.manager import ProviderManager
from app.core.config import settings
from app.models.models import User

logger = logging.getLogger("resume_api")
router = APIRouter()

@router.post("/analyze", response_model=ResumeAnalysisResponse, status_code=status.HTTP_201_CREATED)
async def analyze_resume(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    spec_repo = SpecializedRepository(db)
    provider = ProviderManager.get_provider()

    # Validate file extension
    filename = file.filename
    _, ext = os.path.splitext(filename)
    ext = ext.lower().lstrip(".")
    if ext not in ["pdf", "docx"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported format. Please upload a PDF or Word Document (.docx)."
        )

    # Save temporary file
    temp_path = os.path.join(settings.UPLOAD_DIR, f"temp_{current_user.id}_{filename}")
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Parse extracted text
        text_content = parse_document(temp_path, ext)
        if not text_content.strip():
            raise ValueError("Document contains no extractable text.")
    except Exception as e:
        logger.error(f"Error parsing resume: {e}")
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not read resume text content: {str(e)}"
        )

    # Compile evaluation prompt
    prompt = f"""
    You are an expert HR recruiter. Analyze this resume text and score it on a scale of 0-100.
    Output a structured JSON response matching the schema below.
    
    Resume Text:
    {text_content[:6000]} # Trim to avoid context limit issues
    
    Output JSON format ONLY. Do not write markdown markers or explanation outside the JSON.
    Expected Schema:
    {{
        "extracted_skills": ["Skill A", "Skill B"],
        "overall_score": 75,
        "suggestions": {{
            "formatting": ["Fix margins", "Use standard headers"],
            "impact_improvements": ["Add numeric results to achievements", "Use action verbs"],
            "missing_keywords": ["Kubernetes", "AWS", "CI/CD"],
            "career_advice": ["Focus on fullstack projects to expand your options"]
        }}
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
                
        data = json.loads(cleaned)
    except Exception as e:
        logger.warning(f"Failed to parse resume evaluation output: {e}. Falling back to default grading.")
        data = {
            "extracted_skills": ["Python", "SQL"],
            "overall_score": 60,
            "suggestions": {
                "formatting": ["Ensure font sizes are uniform"],
                "impact_improvements": ["Detail specific metrics (e.g. speedups, cost cuts) for projects"],
                "missing_keywords": ["Containerization", "Testing Libraries"],
                "career_advice": ["Include a dedicated technical summary section"]
            },
            "note": "AI grader encountered a formatting error and fell back to standard evaluation."
        }

    # Clean up temporary file
    if os.path.exists(temp_path):
        os.remove(temp_path)

    # Save to Database
    db_analysis = await spec_repo.create_resume_analysis(
        user_id=current_user.id,
        resume_name=filename,
        extracted_text=text_content,
        skills=data.get("extracted_skills", []),
        score=data.get("overall_score", 50),
        suggestions=data.get("suggestions", {})
    )
    
    await db.commit()
    return db_analysis

@router.get("/history", response_model=List[ResumeAnalysisResponse])
async def get_resume_history(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    spec_repo = SpecializedRepository(db)
    return await spec_repo.get_user_resume_analyses(current_user.id)
