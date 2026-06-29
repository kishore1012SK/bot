from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy import select, desc, delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.models import Document, DocumentChunk
from app.schemas.schemas import DocumentResponse

class KnowledgeRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_document_by_id(self, doc_id: int) -> Optional[Document]:
        result = await self.db.execute(select(Document).where(Document.id == doc_id))
        return result.scalars().first()

    async def get_document_by_name(self, name: str, user_id: int) -> Optional[Document]:
        result = await self.db.execute(
            select(Document).where(Document.name == name, Document.user_id == user_id)
        )
        return result.scalars().first()

    async def get_all_documents(self, skip: int = 0, limit: int = 100) -> List[Document]:
        result = await self.db.execute(
            select(Document).order_by(desc(Document.created_at)).offset(skip).limit(limit)
        )
        return list(result.scalars().all())

    async def get_user_documents(self, user_id: int, skip: int = 0, limit: int = 100) -> List[Document]:
        result = await self.db.execute(
            select(Document)
            .where(Document.user_id == user_id)
            .order_by(desc(Document.created_at))
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def create_document(
        self, 
        user_id: int, 
        name: str, 
        category: str, 
        tags: Optional[List[str]], 
        file_path: str, 
        file_type: str,
        version: int = 1
    ) -> Document:
        db_doc = Document(
            user_id=user_id,
            name=name,
            category=category,
            tags=tags or [],
            version=version,
            file_path=file_path,
            file_type=file_type
        )
        self.db.add(db_doc)
        await self.db.flush()
        return db_doc

    async def delete_document(self, doc_id: int) -> bool:
        db_doc = await self.get_document_by_id(doc_id)
        if not db_doc:
            return False
        await self.db.delete(db_doc)
        await self.db.flush()
        return True

    async def add_document_chunks(self, chunks: List[Dict[str, Any]]) -> None:
        """
        Bulk insert chunks for a document.
        chunks elements: {"document_id": int, "content": str, "embedding": List[float], "chunk_index": int}
        """
        db_chunks = [
            DocumentChunk(
                document_id=c["document_id"],
                content=c["content"],
                embedding=c["embedding"],
                chunk_index=c["chunk_index"]
            )
            for c in chunks
        ]
        self.db.add_all(db_chunks)
        await self.db.flush()

    async def search_vector_chunks(
        self, 
        query_embedding: List[float], 
        limit: int = 5,
        category: Optional[str] = None
    ) -> List[Tuple[DocumentChunk, Document]]:
        """
        Perform a hybrid vector search using pgvector cosine distance.
        Returns a list of Tuple (DocumentChunk, ParentDocument).
        """
        # Join DocumentChunk and Document to fetch parent metadata
        stmt = (
            select(DocumentChunk, Document)
            .join(Document, DocumentChunk.document_id == Document.id)
        )
        
        # Apply category filter if specified
        if category:
            stmt = stmt.where(Document.category == category)
            
        # Order by cosine distance (closest first)
        stmt = stmt.order_by(
            DocumentChunk.embedding.cosine_distance(query_embedding)
        ).limit(limit)
        
        result = await self.db.execute(stmt)
        return list(result.all())
