import json
import logging
import asyncio
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_active_user
from app.repositories.chat import ChatRepository
from app.repositories.knowledge import KnowledgeRepository
from app.repositories.audit_log import AuditLogRepository
from app.schemas.schemas import (
    ConversationResponse, 
    ConversationDetailResponse, 
    ConversationCreate,
    MessageResponse,
    MessageCreate
)
from app.core.config import settings
from app.services.ai.manager import ProviderManager
from app.vector.embeddings import EmbeddingService
from app.models.models import User, Message

logger = logging.getLogger("chat_api")
router = APIRouter()
embedding_service = EmbeddingService()

@router.get("", response_model=List[ConversationResponse])
async def list_conversations(
    query: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    chat_repo = ChatRepository(db)
    if query:
        return await chat_repo.search_conversations(current_user.id, query)
    return await chat_repo.get_user_conversations(current_user.id)

@router.post("", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    conv_in: ConversationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    chat_repo = ChatRepository(db)
    conv = await chat_repo.create_conversation(current_user.id, conv_in.title)
    await db.commit()
    return conv

@router.get("/{conv_id}", response_model=ConversationDetailResponse)
async def get_conversation(
    conv_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    chat_repo = ChatRepository(db)
    conv = await chat_repo.get_conversation_by_id(conv_id)
    if not conv or conv.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    messages = await chat_repo.get_conversation_messages(conv_id)
    
    # Map to schema response
    return ConversationDetailResponse(
        id=conv.id,
        user_id=conv.user_id,
        title=conv.title,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        messages=[
            MessageResponse.model_validate(msg) for msg in messages
        ]
    )

@router.put("/{conv_id}", response_model=ConversationResponse)
async def update_conversation(
    conv_id: int,
    conv_in: ConversationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    chat_repo = ChatRepository(db)
    conv = await chat_repo.get_conversation_by_id(conv_id)
    if not conv or conv.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    updated_conv = await chat_repo.update_conversation_title(conv_id, conv_in.title)
    await db.commit()
    return updated_conv

@router.delete("/{conv_id}", status_code=status.HTTP_200_OK)
async def delete_conversation(
    conv_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    chat_repo = ChatRepository(db)
    audit_repo = AuditLogRepository(db)
    
    conv = await chat_repo.get_conversation_by_id(conv_id)
    if not conv or conv.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    await chat_repo.delete_conversation(conv_id)
    await audit_repo.create(
        user_id=current_user.id,
        action="DELETE_CONVERSATION",
        ip_address=request.client.host if request.client else None,
        details={"conversation_title": conv.title, "conv_id": conv_id}
    )
    await db.commit()
    return {"message": "Conversation deleted successfully"}

@router.get("/{conv_id}/export")
async def export_conversation(
    conv_id: int,
    format: str = "json", # json | txt
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    chat_repo = ChatRepository(db)
    conv = await chat_repo.get_conversation_by_id(conv_id)
    if not conv or conv.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    messages = await chat_repo.get_conversation_messages(conv_id)
    
    if format == "json":
        history = [
            {"sender": msg.sender, "content": msg.content, "timestamp": msg.timestamp.isoformat()}
            for msg in messages
        ]
        export_content = json.dumps(history, indent=2)
        media_type = "application/json"
        filename = f"chat_{conv_id}.json"
    else:
        text_lines = [f"=== Chat History: {conv.title} ==="]
        for msg in messages:
            text_lines.append(f"[{msg.timestamp.strftime('%Y-%m-%d %H:%M:%S')}] {msg.sender.upper()}: {msg.content}")
        export_content = "\n".join(text_lines)
        media_type = "text/plain"
        filename = f"chat_{conv_id}.txt"
        
    return StreamingResponse(
        iter([export_content]),
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.post("/{conv_id}/stream")
async def stream_chat_response(
    conv_id: int,
    msg_in: MessageCreate,
    rag_enabled: bool = True,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    chat_repo = ChatRepository(db)
    kb_repo = KnowledgeRepository(db)
    
    conv = await chat_repo.get_conversation_by_id(conv_id)
    if not conv or conv.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    # Save User message to database
    user_msg = await chat_repo.create_message(conv_id, "user", msg_in.content)
    await db.commit() # Save user message first

    # Context retrieval (RAG)
    retrieved_context = ""
    if rag_enabled:
        try:
            query_emb = await embedding_service.get_embedding(msg_in.content)
            chunks = await kb_repo.search_vector_chunks(query_emb, limit=3)
            if chunks:
                retrieved_context = "\n\n".join(
                    f"[Source: {doc.name}] {chunk.content}"
                    for chunk, doc in chunks
                )
        except Exception as e:
            logger.error(f"RAG context retrieval failed: {e}")

    # Build Prompt context stack
    history_messages = await chat_repo.get_conversation_messages(conv_id)
    
    # Format message chain for LLM provider
    messages_payload = []
    
    # Prepend RAG system rules if context is present
    if retrieved_context:
        system_prompt = (
            "You are a secure corporate assistant. Use the following pieces of retrieved information "
            "to answer the question. If you don't know the answer, state that you do not know. "
            "Rely only on this local context if it directly addresses the query.\n\n"
            f"--- LOCAL CONTEXT ---\n{retrieved_context}\n----------------------"
        )
        messages_payload.append({"role": "system", "content": system_prompt})
    else:
        messages_payload.append({
            "role": "system", 
            "content": "You are a helpful enterprise AI chatbot running entirely in a private secure network."
        })

    # Add historical messages (limit to last 15 to avoid context window blowup)
    for msg in history_messages[-16:-1]: # exclude the latest user message which we will append last
        messages_payload.append({"role": msg.sender, "content": msg.content})

    # Append active question
    messages_payload.append({"role": "user", "content": msg_in.content})

    # LLM Stream generator
    async def sse_generator():
        provider = ProviderManager.get_provider()
        full_reply_text = ""
        try:
            async for token in provider.generate_chat_stream(messages_payload):
                full_reply_text += token
                # SSE data frame: send token
                yield f"data: {json.dumps({'token': token})}\n\n"
                await asyncio.sleep(0.01) # Micro-sleep to yield loop controls
                
            # Stream complete. Save final response to Database
            # We open a fresh connection session inside the generator thread
            # as the initial REST request context db session might be closed/yielding.
            from app.database.connection import SessionLocal
            async with SessionLocal() as db_stream:
                chat_repo_stream = ChatRepository(db_stream)
                await chat_repo_stream.create_message(conv_id, "assistant", full_reply_text)
                await db_stream.commit()
                
            yield "data: [DONE]\n\n"
        except Exception as e:
            logger.error(f"Error streaming response: {e}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(sse_generator(), media_type="text/event-stream")

# WebSockets active session list
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

ws_manager = ConnectionManager()

@router.websocket("/{conv_id}/ws")
async def websocket_chat_endpoint(websocket: WebSocket, conv_id: int):
    await ws_manager.connect(websocket)
    logger.info(f"WebSocket client connected to conversation {conv_id}")
    
    # We extract credentials from query parameters because WebSockets headers do not support standard auth bearers easily
    # Token passed as ?token=eyJ...
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Token missing")
        ws_manager.disconnect(websocket)
        return

    from jose import jwt, JWTError
    from app.core.security import ALGORITHM
    from app.database.connection import SessionLocal
    from app.repositories.user import UserRepository

    async with SessionLocal() as db:
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
            email: str = payload.get("sub")
            if email is None:
                raise JWTError()
            user_repo = UserRepository(db)
            user = await user_repo.get_by_email(email)
            if not user or not user.is_active:
                raise JWTError()
        except JWTError:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid credentials")
            ws_manager.disconnect(websocket)
            return

        # Check conversation ownership
        chat_repo = ChatRepository(db)
        conv = await chat_repo.get_conversation_by_id(conv_id)
        if not conv or conv.user_id != user.id:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Unauthorized")
            ws_manager.disconnect(websocket)
            return

    try:
        while True:
            # Client sends: {"content": "message", "rag_enabled": true}
            data_str = await websocket.receive_text()
            data = json.loads(data_str)
            user_text = data.get("content", "").strip()
            rag_enabled = data.get("rag_enabled", True)
            
            if not user_text:
                continue

            async with SessionLocal() as db:
                chat_repo = ChatRepository(db)
                kb_repo = KnowledgeRepository(db)
                
                # 1. Save user query to DB
                await chat_repo.create_message(conv_id, "user", user_text)
                await db.commit()

                # 2. Context retrieval (RAG)
                retrieved_context = ""
                if rag_enabled:
                    try:
                        query_emb = await embedding_service.get_embedding(user_text)
                        chunks = await kb_repo.search_vector_chunks(query_emb, limit=3)
                        if chunks:
                            retrieved_context = "\n\n".join(
                                f"[Source: {doc.name}] {chunk.content}"
                                for chunk, doc in chunks
                            )
                    except Exception as e:
                        logger.error(f"WS RAG retrieval failed: {e}")

                # 3. Load conversation context messages
                history_messages = await chat_repo.get_conversation_messages(conv_id)

            # Format LLM messages stack
            messages_payload = []
            if retrieved_context:
                system_prompt = (
                    "You are a secure corporate assistant. Use the following pieces of retrieved information "
                    "to answer the question. If you don't know the answer, state that you do not know.\n\n"
                    f"--- LOCAL CONTEXT ---\n{retrieved_context}\n----------------------"
                )
                messages_payload.append({"role": "system", "content": system_prompt})
            else:
                messages_payload.append({
                    "role": "system", 
                    "content": "You are a helpful enterprise AI chatbot running entirely in a private secure network."
                })

            for msg in history_messages[-16:-1]:
                messages_payload.append({"role": msg.sender, "content": msg.content})

            messages_payload.append({"role": "user", "content": user_text})

            # Stream LLM tokens back over WebSocket
            provider = ProviderManager.get_provider()
            full_reply_text = ""
            try:
                async for token in provider.generate_chat_stream(messages_payload):
                    full_reply_text += token
                    await websocket.send_json({
                        "type": "token",
                        "content": token
                    })
                    await asyncio.sleep(0.01)
                    
                # 4. Save completed reply to DB
                async with SessionLocal() as db_save:
                    chat_repo_save = ChatRepository(db_save)
                    db_msg = await chat_repo_save.create_message(conv_id, "assistant", full_reply_text)
                    await db_save.commit()
                    msg_id = db_msg.id
                
                # Send confirmation completion
                await websocket.send_json({
                    "type": "complete",
                    "content": full_reply_text,
                    "message_id": msg_id
                })
            except Exception as e:
                logger.error(f"WS LLM streaming failed: {e}")
                await websocket.send_json({
                    "type": "error",
                    "content": f"Streaming compilation error: {str(e)}"
                })

    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
        logger.info(f"WebSocket client disconnected from conversation {conv_id}")
    except Exception as e:
        logger.error(f"WebSocket exception: {e}")
        ws_manager.disconnect(websocket)
