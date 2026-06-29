import psutil
import shutil
import time
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_db
from app.schemas.schemas import HealthResponse
from app.core.config import settings
import httpx

router = APIRouter()

async def check_db_health(db: AsyncSession) -> str:
    try:
        await db.execute(text("SELECT 1"))
        return "healthy"
    except Exception as e:
        return f"unhealthy: {str(e)}"

async def check_vector_health(db: AsyncSession) -> str:
    try:
        # Check if pgvector is enabled
        res = await db.execute(text("SELECT extname FROM pg_extension WHERE extname = 'vector'"))
        row = res.fetchone()
        if row:
            return "healthy (pgvector active)"
        return "unhealthy (pgvector extension not installed)"
    except Exception as e:
        return f"unhealthy: {str(e)}"

async def check_llm_health() -> str:
    provider = settings.DEFAULT_LLM_PROVIDER.lower()
    base_url = ""
    
    if provider == "ollama":
        base_url = settings.OLLAMA_BASE_URL
        endpoint = f"{base_url}/api/tags"
    elif provider == "llamacpp":
        base_url = settings.LLAMACPP_BASE_URL
        endpoint = f"{base_url}/health"
    elif provider == "vllm":
        base_url = settings.VLLM_BASE_URL
        endpoint = f"{base_url}/v1/models"
    else:
        return "unknown provider"
        
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await client.get(endpoint)
            if resp.status_code == 200:
                return f"healthy ({provider} connected)"
            return f"unhealthy (status {resp.status_code})"
    except Exception as e:
        return f"unhealthy (cannot connect to {provider} at {base_url}): {str(e)}"

@router.get("", response_model=HealthResponse)
async def health_check(db: AsyncSession = Depends(get_db)):
    db_status = await check_db_health(db)
    vector_status = await check_vector_health(db)
    llm_status = await check_llm_health()
    
    # Calculate CPU, Memory and Disk
    cpu_percent = psutil.cpu_percent(interval=None)
    memory_info = psutil.virtual_memory()
    total, used, free = shutil.disk_usage("/")
    
    # Check GPU availability (mocked or checks via nvidia-smi if command-line tool is available)
    # Inside Windows, checking for CUDA usage can be mocked gracefully if PyTorch is not fully loaded.
    gpu_status = "Not available (CPU Fallback Active)"
    try:
        # Simple execution check if nvidia-smi exists to see if GPU is attached
        import subprocess
        result = subprocess.run(['nvidia-smi'], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if result.returncode == 0:
            gpu_status = "Available (CUDA Active)"
    except Exception:
        pass

    system_stats = {
        "cpu_usage_percent": cpu_percent,
        "memory_usage_percent": memory_info.percent,
        "memory_total_gb": round(memory_info.total / (1024**3), 2),
        "memory_used_gb": round(memory_info.used / (1024**3), 2),
        "disk_free_gb": round(free / (1024**3), 2),
        "gpu_status": gpu_status,
        "timestamp": time.time()
    }
    
    is_healthy = "healthy" if db_status == "healthy" and "healthy" in vector_status else "degraded"
    
    return HealthResponse(
        status=is_healthy,
        database=db_status,
        vector_store=vector_status,
        active_llm=llm_status,
        system_stats=system_stats
    )
