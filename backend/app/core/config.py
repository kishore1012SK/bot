import os
from typing import List, Union
from pydantic import AnyHttpUrl, BeforeValidator, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing_extensions import Annotated

def parse_cors_origins(v: Union[str, List[str]]) -> List[str]:
    if isinstance(v, str) and not v.startswith("["):
        return [i.strip() for i in v.split(",")]
    elif isinstance(v, (list, str)):
        return v
    raise ValueError(v)

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_ignore_empty=True, extra="ignore"
    )
    
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Enterprise Private AI Assistant"
    
    # Security
    SECRET_KEY: str = "supersecretkeychangeinproduction1234567890!@#$%"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # CORS Origins
    BACKEND_CORS_ORIGINS: Annotated[
        List[str], BeforeValidator(parse_cors_origins)
    ] = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"]

    # Database
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "private_ai"
    
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    @property
    def SQLALCHEMY_SYNC_DATABASE_URI(self) -> str:
        # For setup/migrations where async is not needed/supported by default tools
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    # LLM Settings
    DEFAULT_LLM_PROVIDER: str = "ollama"  # ollama | llamacpp | vllm
    DEFAULT_LLM_MODEL: str = "llama3"
    
    # Provider Base URLs
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    LLAMACPP_BASE_URL: str = "http://localhost:8080"
    VLLM_BASE_URL: str = "http://localhost:8000"
    
    # Embeddings
    USE_LOCAL_EMBEDDINGS: bool = True  # True: load sentence-transformers locally, False: call Ollama Embeddings API
    EMBEDDING_MODEL_NAME: str = "all-MiniLM-L6-v2"
    OLLAMA_EMBEDDING_MODEL: str = "nomic-embed-text"
    
    # Knowledge Base
    UPLOAD_DIR: str = "uploads"
    
    # Rate Limiting
    RATE_LIMIT_CALLS: int = 100
    RATE_LIMIT_PERIOD_SECONDS: int = 60

settings = Settings()
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
