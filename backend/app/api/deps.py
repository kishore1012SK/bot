from typing import AsyncGenerator, List, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from jose import jwt, JWTError

from app.core.config import settings
from app.core.security import ALGORITHM
from app.database.connection import get_db
from app.models.models import User
from app.repositories.user import UserRepository
from app.schemas.schemas import UserRole

# Using OAuth2PasswordBearer to extract token
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)

async def get_current_user(
    db: AsyncSession = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user_repo = UserRepository(db)
    user = await user_repo.get_by_email(email)
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user

class RoleChecker:
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(
        self, 
        current_user: User = Depends(get_current_active_user)
    ) -> User:
        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Action not allowed for role: {current_user.role}. Permitted roles: {', '.join(self.allowed_roles)}"
            )
        return current_user

# Pre-defined role dependencies for quick usage
require_super_admin = RoleChecker([UserRole.SUPER_ADMIN.value])
require_admin_or_higher = RoleChecker([UserRole.SUPER_ADMIN.value, UserRole.ADMIN.value])
require_hr_or_higher = RoleChecker([UserRole.SUPER_ADMIN.value, UserRole.ADMIN.value, UserRole.HR.value])
require_employee_or_higher = RoleChecker([
    UserRole.SUPER_ADMIN.value, 
    UserRole.ADMIN.value, 
    UserRole.HR.value, 
    UserRole.EMPLOYEE.value
])
