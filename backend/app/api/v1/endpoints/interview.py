import json
import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_active_user
from app.repositories.specialized import SpecializedRepository
from app.schemas.schemas import (
    InterviewSessionCreate, 
    InterviewSessionResponse, 
    InterviewAnswerSubmit
)
from app.services.ai.manager import ProviderManager
from app.models.models import User

logger = logging.getLogger("interview_api")
router = APIRouter()

# Max QA rounds (e.g. 5 questions and 5 answers)
MAX_INTERVIEW_TURNS = 10 

@router.post("/start", response_model=InterviewSessionResponse, status_code=status.HTTP_201_CREATED)
async def start_interview(
    session_in: InterviewSessionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    spec_repo = SpecializedRepository(db)
    provider = ProviderManager.get_provider()
    
    # 1. Generate the initial question
    prompt = f"""
    You are an expert recruiter conducting a professional {session_in.type} interview for an enterprise company.
    Generate the first introductory interview question to begin the evaluation.
    Keep the question concise and professional.
    """
    try:
        first_question = await provider.generate(
            prompt, 
            system_prompt=f"You are a professional corporate interviewer conducting a {session_in.type} interview."
        )
    except Exception as e:
        logger.error(f"Failed to generate first question: {e}")
        first_question = f"Welcome! Let's start the {session_in.type} interview. Can you please introduce yourself and tell me about your background?"

    # 2. Save session to DB
    session = await spec_repo.create_interview_session(current_user.id, session_in.type)
    
    # Init history with the first assistant question
    chat_history = [{"role": "assistant", "content": first_question}]
    await spec_repo.update_interview_history(session.id, chat_history)
    
    await db.commit()
    return session

@router.post("/{session_id}/answer", response_model=InterviewSessionResponse)
async def submit_answer(
    session_id: int,
    answer_in: InterviewAnswerSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    spec_repo = SpecializedRepository(db)
    provider = ProviderManager.get_provider()
    
    session = await spec_repo.get_interview_session_by_id(session_id)
    if not session or session.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Interview session not found")
        
    if session.is_completed:
        raise HTTPException(status_code=400, detail="This interview session is already completed.")

    # Append user answer
    chat_history = list(session.chat_history)
    chat_history.append({"role": "user", "content": answer_in.answer})
    
    # Check if we have completed MAX turns
    if len(chat_history) >= MAX_INTERVIEW_TURNS:
        # Score the interview and finish
        prompt = f"""
        You are a hiring manager evaluating a candidate's transcript for a {session.type} interview.
        Grade the candidate's answers out of 100.
        Output a structured JSON response matching the schema below.
        
        Transcript:
        {json.dumps(chat_history, indent=2)}
        
        Output JSON format ONLY. Do not write markdown markers or explanation outside the JSON.
        Expected Schema:
        {{
            "score": 82,
            "feedback": {{
                "general_summary": "Summary of performance",
                "strengths": ["List of strengths"],
                "improvements": ["List of improvement details"]
            }}
        }}
        """
        
        try:
            raw_response = await provider.generate(prompt, system_prompt="You are a JSON generator. Respond only with valid JSON.")
            cleaned = raw_response.strip()
            if cleaned.startswith("```"):
                lines = cleaned.split("\n")
                if lines[0].startswith("```json") or lines[0].startswith("```"):
                    cleaned = "\n".join(lines[1:-1])
            
            evaluation = json.loads(cleaned)
            score = evaluation.get("score", 70)
            feedback = evaluation.get("feedback", {})
        except Exception as e:
            logger.warning(f"Failed to grade interview session transcript: {e}")
            score = 75
            feedback = {
                "general_summary": "Completed mock interview simulation session.",
                "strengths": ["Demonstrates clear communication"],
                "improvements": ["Elaborate with more structural metrics or code logic next time."]
            }
            
        session = await spec_repo.update_interview_history(session_id, chat_history)
        session = await spec_repo.complete_interview_session(session_id, score, feedback)
        await db.commit()
        return session
        
    else:
        # Generate the next question
        prompt = f"""
        You are an expert corporate interviewer conducting a {session.type} interview.
        Review the transcript history so far and generate the next relevant follow-up question.
        Keep the question professional, direct and concise.
        
        Transcript:
        {json.dumps(chat_history, indent=2)}
        """
        try:
            next_q = await provider.generate(
                prompt, 
                system_prompt="You are a professional corporate interviewer. Respond ONLY with the next interview question."
            )
        except Exception as e:
            logger.error(f"Failed to generate next question: {e}")
            next_q = "Thank you. Let's move on: What is your typical approach to tackling complex programming problems?"
            
        chat_history.append({"role": "assistant", "content": next_q})
        
        session = await spec_repo.update_interview_history(session_id, chat_history)
        await db.commit()
        return session

@router.get("/history", response_model=List[InterviewSessionResponse])
async def get_interview_history(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    spec_repo = SpecializedRepository(db)
    return await spec_repo.get_user_interview_sessions(current_user.id)
