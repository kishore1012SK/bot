import httpx
import json
import logging
from typing import AsyncGenerator, Dict, Any, List, Optional
from app.services.ai.base import BaseProvider
from app.core.config import settings

logger = logging.getLogger("vllm_provider")

class VllmProvider(BaseProvider):
    def __init__(self, base_url: str = settings.VLLM_BASE_URL, model: str = settings.DEFAULT_LLM_MODEL):
        self.base_url = base_url.rstrip("/")
        self.model = model

    async def generate(
        self, 
        prompt: str, 
        system_prompt: Optional[str] = None, 
        options: Optional[Dict[str, Any]] = None
    ) -> str:
        # Prepend system prompt if provided
        full_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
        payload = {
            "model": self.model,
            "prompt": full_prompt,
            "stream": False,
            **(options or {})
        }
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                resp = await client.post(f"{self.base_url}/v1/completions", json=payload)
                resp.raise_for_status()
                data = resp.json()
                return data["choices"][0]["text"]
        except Exception as e:
            logger.error(f"vLLM completion failed: {e}")
            raise

    async def generate_stream(
        self, 
        prompt: str, 
        system_prompt: Optional[str] = None, 
        options: Optional[Dict[str, Any]] = None
    ) -> AsyncGenerator[str, None]:
        full_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
        payload = {
            "model": self.model,
            "prompt": full_prompt,
            "stream": True,
            **(options or {})
        }
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                async with client.stream("POST", f"{self.base_url}/v1/completions", json=payload) as response:
                    response.raise_for_status()
                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            content = line[6:].strip()
                            if content == "[DONE]":
                                break
                            try:
                                data = json.loads(content)
                                token = data["choices"][0].get("text", "")
                                if token:
                                    yield token
                            except json.JSONDecodeError:
                                continue
        except Exception as e:
            logger.error(f"vLLM stream failed: {e}")
            yield f"\n[vLLM Connection Error: {e}]"

    async def generate_chat(
        self, 
        messages: List[Dict[str, str]], 
        options: Optional[Dict[str, Any]] = None
    ) -> str:
        payload = {
            "model": self.model,
            "messages": messages,
            "stream": False,
            **(options or {})
        }
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                resp = await client.post(f"{self.base_url}/v1/chat/completions", json=payload)
                resp.raise_for_status()
                data = resp.json()
                return data["choices"][0]["message"]["content"]
        except Exception as e:
            logger.error(f"vLLM chat completions failed: {e}")
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
            **(options or {})
        }
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                async with client.stream("POST", f"{self.base_url}/v1/chat/completions", json=payload) as response:
                    response.raise_for_status()
                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            content = line[6:].strip()
                            if content == "[DONE]":
                                break
                            try:
                                data = json.loads(content)
                                token = data["choices"][0]["delta"].get("content", "")
                                if token:
                                    yield token
                            except (json.JSONDecodeError, KeyError, IndexError):
                                continue
        except Exception as e:
            logger.error(f"vLLM chat stream failed: {e}")
            yield f"\n[vLLM Connection Error: {e}]"
