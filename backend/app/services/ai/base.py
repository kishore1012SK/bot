from abc import ABC, abstractmethod
from typing import AsyncGenerator, Dict, Any, List, Optional

class BaseProvider(ABC):
    @abstractmethod
    async def generate(
        self, 
        prompt: str, 
        system_prompt: Optional[str] = None, 
        options: Optional[Dict[str, Any]] = None
    ) -> str:
        """Run text completion."""
        pass

    @abstractmethod
    async def generate_stream(
        self, 
        prompt: str, 
        system_prompt: Optional[str] = None, 
        options: Optional[Dict[str, Any]] = None
    ) -> AsyncGenerator[str, None]:
        """Stream token responses for text completion."""
        yield ""

    @abstractmethod
    async def generate_chat(
        self, 
        messages: List[Dict[str, str]], 
        options: Optional[Dict[str, Any]] = None
    ) -> str:
        """Standard chat interaction."""
        pass

    @abstractmethod
    async def generate_chat_stream(
        self, 
        messages: List[Dict[str, str]], 
        options: Optional[Dict[str, Any]] = None
    ) -> AsyncGenerator[str, None]:
        """Stream chat interaction tokens."""
        yield ""
