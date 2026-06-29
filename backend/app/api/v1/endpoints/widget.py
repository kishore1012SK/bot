import json
import logging
import asyncio
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.repositories.knowledge import KnowledgeRepository
from app.services.ai.manager import ProviderManager
from app.vector.embeddings import EmbeddingService

logger = logging.getLogger("widget_api")
router = APIRouter()
embedding_service = EmbeddingService()

class WidgetChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    rag_enabled: bool = True

@router.post("/stream")
async def widget_chat_stream(
    req: WidgetChatRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    RAG-enabled chat streaming endpoint designed specifically for the embedded widget.
    Does not require user authentication (designed for public/external guest access on corporate portals).
    """
    kb_repo = KnowledgeRepository(db)
    
    # 1. Retrieve RAG Context if enabled
    retrieved_context = ""
    if req.rag_enabled:
        try:
            query_emb = await embedding_service.get_embedding(req.message)
            chunks = await kb_repo.search_vector_chunks(query_emb, limit=3)
            if chunks:
                retrieved_context = "\n\n".join(
                    f"[Source: {doc.name}] {chunk.content}"
                    for chunk, doc in chunks
                )
        except Exception as e:
            logger.error(f"Widget RAG context retrieval failed: {e}")

    # 2. Compile message payload for the LLM
    messages_payload = []
    if retrieved_context:
        system_prompt = (
            "You are a helpful customer support chatbot representing our company. "
            "Use the following pieces of corporate information to answer the user's question. "
            "If you don't know the answer, politely state that you do not know. "
            "Keep your answers concise, helpful, and professional.\n\n"
            f"--- CORPORATE CONTEXT ---\n{retrieved_context}\n--------------------------"
        )
        messages_payload.append({"role": "system", "content": system_prompt})
    else:
        messages_payload.append({
            "role": "system",
            "content": "You are a helpful customer support chatbot representing our company. Keep your answers concise and professional."
        })

    # Append user question
    messages_payload.append({"role": "user", "content": req.message})

    # 3. Define SSE Generator
    async def sse_generator():
        provider = ProviderManager.get_provider()
        try:
            async for token in provider.generate_chat_stream(messages_payload):
                yield f"data: {json.dumps({'token': token})}\n\n"
                await asyncio.sleep(0.01) # Yield controls to the async event loop
            yield "data: [DONE]\n\n"
        except Exception as e:
            logger.error(f"Widget LLM streaming failed: {e}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(sse_generator(), media_type="text/event-stream")
