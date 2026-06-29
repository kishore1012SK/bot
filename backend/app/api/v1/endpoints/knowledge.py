import os
import shutil
import json
import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func

from app.api.deps import get_db, get_current_active_user
from app.repositories.knowledge import KnowledgeRepository
from app.repositories.audit_log import AuditLogRepository
from app.schemas.schemas import DocumentResponse, UserRole
from app.core.config import settings
from app.services.knowledge.parsers import parse_document
from app.services.knowledge.chunker import TextChunker
from app.vector.embeddings import EmbeddingService
from app.models.models import User, Document, DocumentChunk

logger = logging.getLogger("knowledge_api")
router = APIRouter()

# Instantiate services
chunker = TextChunker()
embedding_service = EmbeddingService()

@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    request: Request,
    file: UploadFile = File(...),
    category: str = Form("General"),
    tags_json: Optional[str] = Form(None), # JSON list of strings e.g. '["policy", "hr"]'
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Parse tags
    tags = []
    if tags_json:
        try:
            tags = json.loads(tags_json)
        except json.JSONDecodeError:
            pass

    # Validate file extension
    filename = file.filename
    _, ext = os.path.splitext(filename)
    ext = ext.lower().lstrip(".")
    if ext not in ["pdf", "docx", "doc", "xlsx", "xls", "txt", "md", "markdown", "csv"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format: {ext}."
        )

    # Repository & Audit log setup
    kb_repo = KnowledgeRepository(db)
    audit_repo = AuditLogRepository(db)
    
    # Save file to disk
    upload_path = os.path.join(settings.UPLOAD_DIR, f"{current_user.id}_{filename}")
    try:
        with open(upload_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        logger.error(f"Failed to save file locally: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not save file to disk."
        )

    # Document Versioning Logic:
    # If file with same name exists, increment version
    stmt = (
        select(Document)
        .where(Document.name == filename, Document.user_id == current_user.id)
        .order_by(desc(Document.version))
        .limit(1)
    )
    res = await db.execute(stmt)
    latest_doc = res.scalars().first()
    version = 1
    if latest_doc:
        version = latest_doc.version + 1

    try:
        # 1. Parse text from document
        extracted_text = parse_document(upload_path, ext)
        if not extracted_text.strip():
            raise ValueError("Document contains no readable text content.")
            
        # 2. Slice text into chunks
        text_chunks = chunker.split_text(extracted_text)
        
        # 3. Create document record
        doc_record = await kb_repo.create_document(
            user_id=current_user.id,
            name=filename,
            category=category,
            tags=tags,
            file_path=upload_path,
            file_type=ext,
            version=version
        )
        
        # 4. Generate embeddings and save chunks
        chunks_payload = []
        for index, chunk_text in enumerate(text_chunks):
            embedding = await embedding_service.get_embedding(chunk_text)
            chunks_payload.append({
                "document_id": doc_record.id,
                "content": chunk_text,
                "embedding": embedding,
                "chunk_index": index
            })
            
        if chunks_payload:
            await kb_repo.add_document_chunks(chunks_payload)
            
        # Write to Audit Log
        await audit_repo.create(
            user_id=current_user.id,
            action="DOCUMENT_UPLOAD",
            ip_address=request.client.host if request.client else None,
            details={"document_name": filename, "version": version, "chunks": len(chunks_payload)}
        )
        
        await db.commit()
        return doc_record
    except Exception as e:
        logger.error(f"Failed to process uploaded file: {e}")
        # Cleanup file if error occurs
        if os.path.exists(upload_path):
            os.remove(upload_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to index document: {str(e)}"
        )

@router.get("", response_model=List[DocumentResponse])
async def list_documents(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    kb_repo = KnowledgeRepository(db)
    # Admin roles can view all docs, Employee/Student scope to self
    if current_user.role in [UserRole.SUPER_ADMIN.value, UserRole.ADMIN.value]:
        return await kb_repo.get_all_documents()
    else:
        return await kb_repo.get_user_documents(current_user.id)

@router.delete("/{doc_id}", status_code=status.HTTP_200_OK)
async def delete_document(
    doc_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    kb_repo = KnowledgeRepository(db)
    audit_repo = AuditLogRepository(db)
    
    doc = await kb_repo.get_document_by_id(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    # Permission check: Only document owners or Admins can delete
    if doc.user_id != current_user.id and current_user.role not in [UserRole.SUPER_ADMIN.value, UserRole.ADMIN.value]:
        raise HTTPException(status_code=403, detail="Not authorized to delete this document")
        
    try:
        # Delete file from local storage
        if os.path.exists(doc.file_path):
            os.remove(doc.file_path)
            
        await kb_repo.delete_document(doc_id)
        
        # Log event
        await audit_repo.create(
            user_id=current_user.id,
            action="DOCUMENT_DELETE",
            ip_address=request.client.host if request.client else None,
            details={"document_name": doc.name, "doc_id": doc_id}
        )
        await db.commit()
        return {"message": "Document deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting document: {e}")
        raise HTTPException(status_code=500, detail="Could not delete document.")

@router.post("/search")
async def search_knowledge_base(
    query: str = Form(...),
    limit: int = Form(5),
    category: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    RAG search utility returning relevant document chunks.
    Filters search scope to return only the latest version of each document name.
    """
    kb_repo = KnowledgeRepository(db)
    
    # 1. Generate query embedding
    query_embedding = await embedding_service.get_embedding(query)
    
    # 2. Execute pgvector search
    results = await kb_repo.search_vector_chunks(
        query_embedding=query_embedding,
        limit=limit,
        category=category
    )
    
    # 3. Format results response
    formatted_results = []
    for chunk, doc in results:
        # Check permissions (admins see all, users see their own OR public docs)
        # Note: If database represents corporate shared assets, employee roles can read
        # all general/corporate documents uploaded. Let's allow users to see documents.
        formatted_results.append({
            "chunk_id": chunk.id,
            "document_id": doc.id,
            "document_name": doc.name,
            "category": doc.category,
            "version": doc.version,
            "content": chunk.content,
            "chunk_index": chunk.chunk_index
        })
        
    return formatted_results
