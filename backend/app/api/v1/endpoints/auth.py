from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_active_user
from app.repositories.user import UserRepository
from app.repositories.audit_log import AuditLogRepository
from app.schemas.schemas import UserCreate, UserResponse, Token, LoginRequest
from app.core.security import verify_password, create_access_token
from app.models.models import User

router = APIRouter()

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_in: UserCreate,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    user_repo = UserRepository(db)
    audit_repo = AuditLogRepository(db)
    
    # Check if user already exists
    existing_user = await user_repo.get_by_email(user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this email already exists in the system."
        )
        
    # Enforce default role safety: self-registered users cannot set admin/hr roles directly
    # They default to Employee or Student.
    if user_in.role.value in ["Super Admin", "Admin", "HR"]:
        # Only allow creating employee or student through self-registration
        # Promoted roles require admin setup
        user_in.role = "Employee"
        
    user = await user_repo.create(user_in)
    
    # Audit log
    await audit_repo.create(
        user_id=user.id,
        action="USER_REGISTRATION",
        ip_address=request.client.host if request.client else None,
        details={"email": user.email, "role": user.role}
    )
    
    await db.commit()
    return user

@router.post("/login", response_model=Token)
async def login(
    request: Request,
    db: AsyncSession = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
):
    user_repo = UserRepository(db)
    audit_repo = AuditLogRepository(db)
    
    user = await user_repo.get_by_email(form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        # Audit failed login attempt (user_id is None because auth failed)
        await audit_repo.create(
            user_id=None,
            action="USER_LOGIN_FAILED",
            ip_address=request.client.host if request.client else None,
            details={"email": form_data.username}
        )
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password"
        )
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
        
    # Generate Access Token
    access_token = create_access_token(subject=user.email, role=user.role)
    
    # Audit log
    await audit_repo.create(
        user_id=user.id,
        action="USER_LOGIN_SUCCESS",
        ip_address=request.client.host if request.client else None,
        details={}
    )
    await db.commit()
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        role=user.role,
        email=user.email,
        full_name=user.full_name
    )

@router.post("/login/json", response_model=Token)
async def login_json(
    login_data: LoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Fallback JSON endpoint for login (if OAuth2Form is not preferred by frontend)"""
    user_repo = UserRepository(db)
    audit_repo = AuditLogRepository(db)
    
    user = await user_repo.get_by_email(login_data.email)
    if not user or not verify_password(login_data.password, user.hashed_password):
        await audit_repo.create(
            user_id=None,
            action="USER_LOGIN_FAILED",
            ip_address=request.client.host if request.client else None,
            details={"email": login_data.email}
        )
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password"
        )
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
        
    access_token = create_access_token(subject=user.email, role=user.role)
    
    await audit_repo.create(
        user_id=user.id,
        action="USER_LOGIN_SUCCESS",
        ip_address=request.client.host if request.client else None,
        details={}
    )
    await db.commit()
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        role=user.role,
        email=user.email,
        full_name=user.full_name
    )

@router.get("/me", response_model=UserResponse)
async def read_user_me(
    current_user: User = Depends(get_current_active_user)
):
    return current_user
