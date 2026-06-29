from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    SUPER_ADMIN = "Super Admin"
    ADMIN = "Admin"
    HR = "HR"
    EMPLOYEE = "Employee"
    STUDENT = "Student"

# --- Authentication & User Schemas ---
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: UserRole = UserRole.EMPLOYEE

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters long")

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    email: str
    full_name: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# --- Audit Log Schemas ---
class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    action: str
    ip_address: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    timestamp: datetime

    class Config:
        from_attributes = True


# --- Knowledge Base & Document Schemas ---
class DocumentResponse(BaseModel):
    id: int
    name: str
    category: str
    tags: Optional[List[str]] = None
    version: int
    file_type: str
    created_at: datetime
    user_id: int

    class Config:
        from_attributes = True


# --- Chat & Conversation Schemas ---
class MessageBase(BaseModel):
    content: str

class MessageCreate(MessageBase):
    pass

class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    sender: str  # user | assistant
    content: str
    timestamp: datetime

    class Config:
        from_attributes = True

class ConversationBase(BaseModel):
    title: str

class ConversationCreate(ConversationBase):
    pass

class ConversationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ConversationDetailResponse(ConversationResponse):
    messages: List[MessageResponse] = []


# --- Specialized Module Schemas ---

# Career Guidance
class CareerAssessmentSubmit(BaseModel):
    skills: List[str]
    interests: List[str]
    experience_years: int
    preferred_work_type: str  # Remote, Hybrid, Onsite
    goals: str

class CareerAssessmentResponse(BaseModel):
    id: int
    user_id: int
    assessment_data: Dict[str, Any]
    results: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True

# Resume Analyzer
class ResumeAnalysisResponse(BaseModel):
    id: int
    user_id: int
    resume_name: str
    skills: List[str]
    score: int
    suggestions: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True

# Interview Assistant
class InterviewSessionCreate(BaseModel):
    type: str  # Technical | HR | Coding

class InterviewSessionResponse(BaseModel):
    id: int
    user_id: int
    type: str
    chat_history: List[Dict[str, Any]]
    feedback: Optional[Dict[str, Any]] = None
    score: Optional[int] = None
    is_completed: bool
    created_at: datetime

    class Config:
        from_attributes = True

class InterviewAnswerSubmit(BaseModel):
    answer: str

# Project Recommendation
class ProjectRecommendSubmit(BaseModel):
    skills: List[str]
    difficulty: str  # Beginner | Intermediate | Advanced

class ProjectRecommendationResponse(BaseModel):
    id: int
    user_id: int
    skills: List[str]
    difficulty: str
    recommended_projects: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True


# --- System & Health Monitoring Schemas ---
class HealthResponse(BaseModel):
    status: str
    database: str
    vector_store: str
    active_llm: str
    system_stats: Dict[str, Any]
