from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.models import User
from app.schemas.schemas import UserCreate, UserUpdate
from app.core.security import get_password_hash

class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, user_id: int) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalars().first()

    async def get_by_email(self, email: str) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalars().first()

    async def get_all(self, skip: int = 0, limit: int = 100) -> List[User]:
        result = await self.db.execute(select(User).offset(skip).limit(limit))
        return list(result.scalars().all())

    async def create(self, user_in: UserCreate) -> User:
        hashed_password = get_password_hash(user_in.password)
        db_user = User(
            email=user_in.email,
            hashed_password=hashed_password,
            full_name=user_in.full_name,
            role=user_in.role.value if hasattr(user_in.role, 'value') else user_in.role,
        )
        self.db.add(db_user)
        await self.db.flush()
        return db_user

    async def update(self, user_id: int, user_in: UserUpdate) -> Optional[User]:
        db_user = await self.get_by_id(user_id)
        if not db_user:
            return None
        
        update_data = user_in.model_dump(exclude_unset=True)
        if "password" in update_data and update_data["password"]:
            hashed_password = get_password_hash(update_data["password"])
            db_user.hashed_password = hashed_password
            del update_data["password"]
            
        for field, value in update_data.items():
            if field == "role" and hasattr(value, 'value'):
                value = value.value
            setattr(db_user, field, value)
            
        self.db.add(db_user)
        await self.db.flush()
        return db_user

    async def delete(self, user_id: int) -> bool:
        db_user = await self.get_by_id(user_id)
        if not db_user:
            return False
        await self.db.delete(db_user)
        await self.db.flush()
        return True
