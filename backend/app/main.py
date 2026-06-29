import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.core.config import settings
from app.database.connection import engine, Base
from app.api.v1.api import api_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize DB and vector extension
    logger.info("Initializing database...")
    async with engine.begin() as conn:
        try:
            # Enable the pgvector extension if it exists
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
            logger.info("pgvector extension check complete.")
        except Exception as e:
            logger.warning(f"Could not check/create pgvector extension: {e}. Please ensure it is installed.")
        
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables initialized successfully.")
    
    yield
    # Shutdown operations (if any)
    logger.info("Shutting down backend services.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Set CORS middleware
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin).strip("/") for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Mount central API router
app.include_router(api_router, prefix=settings.API_V1_STR)

# Serve embeddable chatbot widget assets statically
from fastapi.staticfiles import StaticFiles
import os

static_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "static")
os.makedirs(static_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.get("/")
async def root():
    return {
        "message": f"Welcome to the {settings.PROJECT_NAME} API. Please navigate to {settings.API_V1_STR}/docs for API documentation."
    }

