from typing import List, Optional, Any, Dict
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.models import AuditLog

class AuditLogRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(
        self, 
        user_id: Optional[int], 
        action: str, 
        ip_address: Optional[str] = None, 
        details: Optional[Dict[str, Any]] = None
    ) -> AuditLog:
        db_log = AuditLog(
            user_id=user_id,
            action=action,
            ip_address=ip_address,
            details=details
        )
        self.db.add(db_log)
        await self.db.flush()
        return db_log

    async def get_all(self, skip: int = 0, limit: int = 100) -> List[AuditLog]:
        result = await self.db.execute(
            select(AuditLog)
            .order_by(desc(AuditLog.timestamp))
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_by_user_id(self, user_id: int, skip: int = 0, limit: int = 100) -> List[AuditLog]:
        result = await self.db.execute(
            select(AuditLog)
            .where(AuditLog.user_id == user_id)
            .order_by(desc(AuditLog.timestamp))
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())
