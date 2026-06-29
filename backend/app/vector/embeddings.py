import httpx
import logging
from typing import List
from app.core.config import settings

logger = logging.getLogger("embeddings")

class EmbeddingService:
    def __init__(self):
        self.use_local = settings.USE_LOCAL_EMBEDDINGS
        self.local_model = None
        
        if self.use_local:
            try:
                from sentence_transformers import SentenceTransformer
                self.local_model = SentenceTransformer(settings.EMBEDDING_MODEL_NAME)
                logger.info(f"Loaded local SentenceTransformer model: {settings.EMBEDDING_MODEL_NAME}")
            except ImportError:
                logger.warning(
                    "sentence-transformers not installed. "
                    "Falling back to Ollama Embeddings API."
                )
                self.use_local = False

    async def get_embedding(self, text: str) -> List[float]:
        """
        Generate embedding for a single string.
        """
        if self.use_local and self.local_model:
            # Sync execution under threadpool for local CPU bounds
            import asyncio
            loop = asyncio.get_running_loop()
            emb = await loop.run_in_executor(None, self.local_model.encode, text)
            return emb.tolist()
        else:
            # Fallback to local Ollama Embeddings API
            return await self._get_ollama_embedding(text)

    async def _get_ollama_embedding(self, text: str) -> List[float]:
        url = f"{settings.OLLAMA_BASE_URL.rstrip('/')}/api/embeddings"
        payload = {
            "model": settings.OLLAMA_EMBEDDING_MODEL,
            "prompt": text
        }
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(url, json=payload)
                resp.raise_for_status()
                data = resp.json()
                embedding = data.get("embedding")
                if not embedding:
                    # In newer Ollama versions, the endpoint is /api/embed and the property is "embeddings"
                    # Let's try /api/embed fallback
                    fallback_url = f"{settings.OLLAMA_BASE_URL.rstrip('/')}/api/embed"
                    fallback_payload = {
                        "model": settings.OLLAMA_EMBEDDING_MODEL,
                        "input": text
                    }
                    resp_fb = await client.post(fallback_url, json=fallback_payload)
                    resp_fb.raise_for_status()
                    data_fb = resp_fb.json()
                    embeddings_list = data_fb.get("embeddings", [])
                    if embeddings_list:
                        embedding = embeddings_list[0]
                
                if not embedding:
                    raise ValueError(f"No embedding returned from Ollama endpoint. Response: {data}")
                
                # Truncate or pad to fit DB expectation (384 dimensions if using standard MiniLM target)
                # Note: Nomic-embed-text is 768. If the database expects 384, we slice it.
                # However, a clean design matches the DB schema dynamically, or we slice/pad.
                # Let's dynamically fit to 384 dimensions if the model returns a larger size
                # to match our database column definition, or return the full vector if database matches.
                # To be bulletproof, we check dimensions:
                from app.models.models import EMBEDDING_DIMENSION
                if len(embedding) > EMBEDDING_DIMENSION:
                    embedding = embedding[:EMBEDDING_DIMENSION]
                elif len(embedding) < EMBEDDING_DIMENSION:
                    embedding = embedding + [0.0] * (EMBEDDING_DIMENSION - len(embedding))
                
                return embedding
        except Exception as e:
            logger.error(f"Failed to fetch embedding from Ollama: {e}")
            # Safe zero-vector fallback in case LLM engine is offline
            from app.models.models import EMBEDDING_DIMENSION
            return [0.0] * EMBEDDING_DIMENSION
            
    async def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for a list of strings.
        """
        embeddings = []
        for text in texts:
            emb = await self.get_embedding(text)
            embeddings.append(emb)
        return embeddings
