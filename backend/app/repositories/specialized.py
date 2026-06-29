from typing import List, Optional, Dict, Any
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.models import (
    CareerAssessment, 
    ResumeAnalysis, 
    InterviewSession, 
    ProjectRecommendation
)

class SpecializedRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    # --- Career Assessments ---
    async def create_career_assessment(
        self, user_id: int, assessment_data: Dict[str, Any], results: Dict[str, Any]
    ) -> CareerAssessment:
        db_assessment = CareerAssessment(
            user_id=user_id,
            assessment_data=assessment_data,
            results=results
        )
        self.db.add(db_assessment)
        await self.db.flush()
        return db_assessment

    async def get_user_career_assessments(self, user_id: int) -> List[CareerAssessment]:
        result = await self.db.execute(
            select(CareerAssessment)
            .where(CareerAssessment.user_id == user_id)
            .order_by(desc(CareerAssessment.created_at))
        )
        return list(result.scalars().all())

    # --- Resume Analyses ---
    async def create_resume_analysis(
        self, 
        user_id: int, 
        resume_name: str, 
        extracted_text: str, 
        skills: List[str], 
        score: int, 
        suggestions: Dict[str, Any]
    ) -> ResumeAnalysis:
        db_analysis = ResumeAnalysis(
            user_id=user_id,
            resume_name=resume_name,
            extracted_text=extracted_text,
            skills=skills,
            score=score,
            suggestions=suggestions
        )
        self.db.add(db_analysis)
        await self.db.flush()
        return db_analysis

    async def get_user_resume_analyses(self, user_id: int) -> List[ResumeAnalysis]:
        result = await self.db.execute(
            select(ResumeAnalysis)
            .where(ResumeAnalysis.user_id == user_id)
            .order_by(desc(ResumeAnalysis.created_at))
        )
        return list(result.scalars().all())

    # --- Interview Sessions ---
    async def create_interview_session(self, user_id: int, session_type: str) -> InterviewSession:
        db_session = InterviewSession(
            user_id=user_id,
            type=session_type,
            chat_history=[],
            is_completed=False
        )
        self.db.add(db_session)
        await self.db.flush()
        return db_session

    async def get_interview_session_by_id(self, session_id: int) -> Optional[InterviewSession]:
        result = await self.db.execute(
            select(InterviewSession).where(InterviewSession.id == session_id)
        )
        return result.scalars().first()

    async def update_interview_history(
        self, session_id: int, chat_history: List[Dict[str, Any]]
    ) -> Optional[InterviewSession]:
        db_session = await self.get_interview_session_by_id(session_id)
        if not db_session:
            return None
        db_session.chat_history = chat_history
        self.db.add(db_session)
        await self.db.flush()
        return db_session

    async def complete_interview_session(
        self, session_id: int, score: int, feedback: Dict[str, Any]
    ) -> Optional[InterviewSession]:
        db_session = await self.get_interview_session_by_id(session_id)
        if not db_session:
            return None
        db_session.score = score
        db_session.feedback = feedback
        db_session.is_completed = True
        self.db.add(db_session)
        await self.db.flush()
        return db_session

    async def get_user_interview_sessions(self, user_id: int) -> List[InterviewSession]:
        result = await self.db.execute(
            select(InterviewSession)
            .where(InterviewSession.user_id == user_id)
            .order_by(desc(InterviewSession.created_at))
        )
        return list(result.scalars().all())

    # --- Project Recommendations ---
    async def create_project_recommendation(
        self, user_id: int, skills: List[str], difficulty: str, recommended_projects: Dict[str, Any]
    ) -> ProjectRecommendation:
        db_rec = ProjectRecommendation(
            user_id=user_id,
            skills=skills,
            difficulty=difficulty,
            recommended_projects=recommended_projects
        )
        self.db.add(db_rec)
        await self.db.flush()
        return db_rec

    async def get_user_project_recommendations(self, user_id: int) -> List[ProjectRecommendation]:
        result = await self.db.execute(
            select(ProjectRecommendation)
            .where(ProjectRecommendation.user_id == user_id)
            .order_by(desc(ProjectRecommendation.created_at))
        )
        return list(result.scalars().all())
