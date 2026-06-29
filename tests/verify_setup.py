import sys
import os

# Append the backend directory to path so we can import app modules directly
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))

def main():
    print("Verifying backend setup import compatibility...")
    try:
        from app.core.config import settings
        print(" [OK] core.config imported successfully")
        
        from app.database.connection import engine, Base, get_db
        print(" [OK] database.connection imported successfully")
        
        from app.models.models import User, AuditLog, Document, DocumentChunk, Conversation, Message
        print(" [OK] models.models imported successfully")
        
        from app.schemas.schemas import UserCreate, UserResponse, Token, LoginRequest
        print(" [OK] schemas.schemas imported successfully")
        
        from app.repositories.user import UserRepository
        from app.repositories.audit_log import AuditLogRepository
        print(" [OK] repositories (UserRepository, AuditLogRepository) imported successfully")
        
        from app.api.deps import get_current_user, RoleChecker
        print(" [OK] api.deps imported successfully")
        
        from app.services.ai.base import BaseProvider
        from app.services.ai.ollama import OllamaProvider
        from app.services.ai.llamacpp import LlamaCppProvider
        from app.services.ai.vllm import VllmProvider
        from app.services.ai.manager import ProviderManager
        print(" [OK] AI providers and ProviderManager imported successfully")
        
        from app.vector.embeddings import EmbeddingService
        from app.services.knowledge.parsers import parse_document
        from app.services.knowledge.chunker import TextChunker
        from app.repositories.knowledge import KnowledgeRepository
        from app.repositories.chat import ChatRepository
        from app.repositories.specialized import SpecializedRepository
        print(" [OK] All Database Repository layers (User, Logs, KB, Chat, Specialized) imported successfully")
        
        from app.api.v1.api import api_router
        print(" [OK] api.v1.api master router imported successfully")
        
        from app.main import app
        print(" [OK] app.main entrypoint imported successfully")
        
        print("\n[SUCCESS] Backend compilation verification passed successfully! All imports resolved.")
        sys.exit(0)
    except Exception as e:
        print(f"\n[FAIL] Setup Verification Failed: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
