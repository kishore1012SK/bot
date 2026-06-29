import httpx
import json
import logging
from typing import AsyncGenerator, Dict, Any, List, Optional
from app.services.ai.base import BaseProvider
from app.core.config import settings

logger = logging.getLogger("ollama_provider")

class OllamaProvider(BaseProvider):
    def __init__(self, base_url: str = settings.OLLAMA_BASE_URL, model: str = settings.DEFAULT_LLM_MODEL):
        self.base_url = base_url.rstrip("/")
        self.model = model

    async def generate(
        self, 
        prompt: str, 
        system_prompt: Optional[str] = None, 
        options: Optional[Dict[str, Any]] = None
    ) -> str:
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "options": options or {}
        }
        if system_prompt:
            payload["system"] = system_prompt
            
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                resp = await client.post(f"{self.base_url}/api/generate", json=payload)
                resp.raise_for_status()
                data = resp.json()
                return data.get("response", "")
        except Exception as e:
            logger.error(f"Ollama generation failed: {e}")
            raise

    async def generate_stream(
        self, 
        prompt: str, 
        system_prompt: Optional[str] = None, 
        options: Optional[Dict[str, Any]] = None
    ) -> AsyncGenerator[str, None]:
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": True,
            "options": options or {}
        }
        if system_prompt:
            payload["system"] = system_prompt

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                async with client.stream("POST", f"{self.base_url}/api/generate", json=payload) as response:
                    response.raise_for_status()
                    async for line in response.aiter_lines():
                        if line:
                            try:
                                data = json.loads(line)
                                token = data.get("response", "")
                                if token:
                                    yield token
                            except json.JSONDecodeError:
                                continue
        except Exception as e:
            logger.error(f"Ollama stream failed: {e}")
            yield f"\n[Ollama Connection Error: {e}]"

    async def generate_chat(
        self, 
        messages: List[Dict[str, str]], 
        options: Optional[Dict[str, Any]] = None
    ) -> str:
        payload = {
            "model": self.model,
            "messages": messages,
            "stream": False,
            "options": options or {}
        }
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                resp = await client.post(f"{self.base_url}/api/chat", json=payload)
                resp.raise_for_status()
                data = resp.json()
                return data.get("message", {}).get("content", "")
        except Exception as e:
            logger.error(f"Ollama chat failed: {e}")
            raise

    async def generate_chat_stream(
        self, 
        messages: List[Dict[str, str]], 
        options: Optional[Dict[str, Any]] = None
    ) -> AsyncGenerator[str, None]:
        payload = {
            "model": self.model,
            "messages": messages,
            "stream": True,
            "options": options or {}
        }
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                async with client.stream("POST", f"{self.base_url}/api/chat", json=payload) as response:
                    response.raise_for_status()
                    async for line in response.aiter_lines():
                        if line:
                            try:
                                data = json.loads(line)
                                token = data.get("message", {}).get("content", "")
                                if token:
                                    yield token
                            except json.JSONDecodeError:
                                continue
        except Exception as e:
            logger.error(f"Ollama chat stream failed: {e}")
            yield f"\n[Ollama Connection Error: {e}]"
