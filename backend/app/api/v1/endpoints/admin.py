import logging
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.api.deps import get_db, require_admin_or_higher
from app.repositories.user import UserRepository
from app.repositories.audit_log import AuditLogRepository
from app.schemas.schemas import UserResponse, UserUpdate, AuditLogResponse
from app.models.models import User, Document, Message, AuditLog

logger = logging.getLogger("admin_api")
router = APIRouter()

# Enforce that all routes in this file require Admin access
router.dependencies = [Depends(require_admin_or_higher)]

@router.get("/users", response_model=List[UserResponse])
async def list_users(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    user_repo = UserRepository(db)
    return await user_repo.get_all(skip=skip, limit=limit)

@router.put("/users/{user_id}/role", response_model=UserResponse)
async def update_user_role(
    user_id: int,
    role_in: UserUpdate, # Expect role inside updates schema
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(require_admin_or_higher)
):
    user_repo = UserRepository(db)
    audit_repo = AuditLogRepository(db)
    
    if not role_in.role:
        raise HTTPException(status_code=400, detail="Role is required.")
        
    user = await user_repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
        
    # Prevent self demotion or modifying Super Admins unless current user is Super Admin
    if user.id == current_admin.id and role_in.role.value != current_admin.role:
        raise HTTPException(status_code=400, detail="Admins cannot change their own roles.")
        
    updated_user = await user_repo.update(user_id, UserUpdate(role=role_in.role))
    
    await audit_repo.create(
        user_id=current_admin.id,
        action="ADMIN_CHANGE_USER_ROLE",
        ip_address=request.client.host if request.client else None,
        details={"target_user": user.email, "new_role": role_in.role.value}
    )
    await db.commit()
    return updated_user

@router.put("/users/{user_id}/status", response_model=UserResponse)
async def toggle_user_status(
    user_id: int,
    status_in: UserUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(require_admin_or_higher)
):
    user_repo = UserRepository(db)
    audit_repo = AuditLogRepository(db)
    
    if status_in.is_active is None:
        raise HTTPException(status_code=400, detail="Active status is required.")
        
    user = await user_repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
        
    if user.id == current_admin.id:
        raise HTTPException(status_code=400, detail="Admins cannot deactivate themselves.")
        
    updated_user = await user_repo.update(user_id, UserUpdate(is_active=status_in.is_active))
    
    await audit_repo.create(
        user_id=current_admin.id,
        action="ADMIN_TOGGLE_USER_STATUS",
        ip_address=request.client.host if request.client else None,
        details={"target_user": user.email, "active_status": status_in.is_active}
    )
    await db.commit()
    return updated_user

@router.delete("/users/{user_id}", status_code=status.HTTP_200_OK)
async def delete_user(
    user_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(require_admin_or_higher)
):
    user_repo = UserRepository(db)
    audit_repo = AuditLogRepository(db)
    
    user = await user_repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
        
    if user.id == current_admin.id:
        raise HTTPException(status_code=400, detail="Admins cannot delete themselves.")
        
    await user_repo.delete(user_id)
    await audit_repo.create(
        user_id=current_admin.id,
        action="ADMIN_DELETE_USER",
        ip_address=request.client.host if request.client else None,
        details={"deleted_user_email": user.email}
    )
    await db.commit()
    return {"message": "User deleted successfully."}

@router.get("/logs", response_model=List[AuditLogResponse])
async def list_audit_logs(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    audit_repo = AuditLogRepository(db)
    return await audit_repo.get_all(skip=skip, limit=limit)

@router.get("/analytics")
async def get_system_analytics(
    db: AsyncSession = Depends(get_db)
):
    """
    Return aggregation metrics for the Admin Dashboard panels.
    """
    # 1. User count aggregates
    user_count_stmt = select(func.count(User.id))
    user_res = await db.execute(user_count_stmt)
    total_users = user_res.scalar() or 0
    
    role_stmt = select(User.role, func.count(User.id)).group_by(User.role)
    role_res = await db.execute(role_stmt)
    role_breakdown = {role: count for role, count in role_res.all()}
    
    # 2. Document count aggregates
    doc_count_stmt = select(func.count(Document.id))
    doc_res = await db.execute(doc_count_stmt)
    total_documents = doc_res.scalar() or 0
    
    # 3. Message count aggregates
    msg_count_stmt = select(func.count(Message.id)).where(Message.sender == "user")
    msg_res = await db.execute(msg_count_stmt)
    total_questions = msg_res.scalar() or 0
    
    # 4. Activity Logs aggregates (last 10 logs)
    latest_logs_stmt = (
        select(AuditLog)
        .order_by(desc(AuditLog.timestamp))
        .limit(10)
    )
    log_res = await db.execute(latest_logs_stmt)
    latest_activities = [
        {
            "id": log.id,
            "action": log.action,
            "timestamp": log.timestamp.isoformat(),
            "details": log.details
        }
        for log in log_res.scalars().all()
    ]

    return {
        "total_users": total_users,
        "role_breakdown": role_breakdown,
        "total_documents": total_documents,
        "total_questions_asked": total_questions,
        "latest_activities": latest_activities
    }
