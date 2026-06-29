from typing import List, Optional
from sqlalchemy import select, desc, or_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.models import Conversation, Message

class ChatRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_conversation_by_id(self, conv_id: int) -> Optional[Conversation]:
        result = await self.db.execute(
            select(Conversation).where(Conversation.id == conv_id)
        )
        return result.scalars().first()

    async def get_user_conversations(self, user_id: int, skip: int = 0, limit: int = 100) -> List[Conversation]:
        result = await self.db.execute(
            select(Conversation)
            .where(Conversation.user_id == user_id)
            .order_by(desc(Conversation.updated_at))
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def create_conversation(self, user_id: int, title: str) -> Conversation:
        db_conv = Conversation(user_id=user_id, title=title)
        self.db.add(db_conv)
        await self.db.flush()
        return db_conv

    async def update_conversation_title(self, conv_id: int, title: str) -> Optional[Conversation]:
        db_conv = await self.get_conversation_by_id(conv_id)
        if not db_conv:
            return None
        db_conv.title = title
        self.db.add(db_conv)
        await self.db.flush()
        return db_conv

    async def delete_conversation(self, conv_id: int) -> bool:
        db_conv = await self.get_conversation_by_id(conv_id)
        if not db_conv:
            return False
        await self.db.delete(db_conv)
        await self.db.flush()
        return True

    async def get_conversation_messages(self, conv_id: int) -> List[Message]:
        result = await self.db.execute(
            select(Message)
            .where(Message.conversation_id == conv_id)
            .order_by(Message.timestamp)
        )
        return list(result.scalars().all())

    async def create_message(self, conv_id: int, sender: str, content: str) -> Message:
        db_msg = Message(
            conversation_id=conv_id,
            sender=sender,
            content=content
        )
        self.db.add(db_msg)
        await self.db.flush()
        return db_msg

    async def search_conversations(self, user_id: int, query: str) -> List[Conversation]:
        """
        Search conversations containing messages that match a search query.
        """
        # Join Conversation and Message tables, find matching message contents
        stmt = (
            select(Conversation)
            .join(Message, Message.conversation_id == Conversation.id)
            .where(
                Conversation.user_id == user_id,
                or_(
                    Conversation.title.ilike(f"%{query}%"),
                    Message.content.ilike(f"%{query}%")
                )
            )
            .distinct(Conversation.id)
            .order_by(desc(Conversation.updated_at))
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
