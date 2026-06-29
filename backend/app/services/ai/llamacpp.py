import httpx
import json
import logging
from typing import AsyncGenerator, Dict, Any, List, Optional
from app.services.ai.base import BaseProvider
from app.core.config import settings

logger = logging.getLogger("llamacpp_provider")

class LlamaCppProvider(BaseProvider):
    def __init__(self, base_url: str = settings.LLAMACPP_BASE_URL, model: str = settings.DEFAULT_LLM_MODEL):
        self.base_url = base_url.rstrip("/")
        self.model = model

    def _format_prompt(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        if system_prompt:
            return f"<|system|>\n{system_prompt}</s>\n<|user|>\n{prompt}</s>\n<|assistant|>\n"
        return f"<|user|>\n{prompt}</s>\n<|assistant|>\n"

    async def generate(
        self, 
        prompt: str, 
        system_prompt: Optional[str] = None, 
        options: Optional[Dict[str, Any]] = None
    ) -> str:
        formatted = self._format_prompt(prompt, system_prompt)
        payload = {
            "prompt": formatted,
            "stream": False,
            **(options or {})
        }
        
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                resp = await client.post(f"{self.base_url}/completion", json=payload)
                resp.raise_for_status()
                data = resp.json()
                return data.get("content", "")
        except Exception as e:
            logger.error(f"Llama.cpp completion failed: {e}")
            raise

    async def generate_stream(
        self, 
        prompt: str, 
        system_prompt: Optional[str] = None, 
        options: Optional[Dict[str, Any]] = None
    ) -> AsyncGenerator[str, None]:
        formatted = self._format_prompt(prompt, system_prompt)
        payload = {
            "prompt": formatted,
            "stream": True,
            **(options or {})
        }

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                async with client.stream("POST", f"{self.base_url}/completion", json=payload) as response:
                    response.raise_for_status()
                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            try:
                                json_str = line[6:].strip()
                                if json_str:
                                    data = json.loads(json_str)
                                    token = data.get("content", "")
                                    if token:
                                        yield token
                            except json.JSONDecodeError:
                                continue
        except Exception as e:
            logger.error(f"Llama.cpp stream failed: {e}")
            yield f"\n[Llama.cpp Connection Error: {e}]"

    async def generate_chat(
        self, 
        messages: List[Dict[str, str]], 
        options: Optional[Dict[str, Any]] = None
    ) -> str:
        # Use OpenAI compatible API exposed by modern llama.cpp server
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
            logger.error(f"Llama.cpp chat completions failed, falling back to prompt formatting: {e}")
            # Fallback to formatting messages into a single prompt for /completion
            formatted_prompt = ""
            for msg in messages:
                role = msg.get("role")
                content = msg.get("content")
                if role == "system":
                    formatted_prompt += f"<|system|>\n{content}</s>\n"
                elif role == "user":
                    formatted_prompt += f"<|user|>\n{content}</s>\n"
                elif role == "assistant":
                    formatted_prompt += f"<|assistant|>\n{content}</s>\n"
            formatted_prompt += "<|assistant|>\n"
            return await self.generate(formatted_prompt, options=options)

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
            logger.error(f"Llama.cpp chat stream failed: {e}")
            yield f"\n[Llama.cpp Connection Error: {e}]"
