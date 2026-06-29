from typing import Optional
from app.core.config import settings
from app.services.ai.base import BaseProvider
from app.services.ai.ollama import OllamaProvider
from app.services.ai.llamacpp import LlamaCppProvider
from app.services.ai.vllm import VllmProvider

class ProviderManager:
    @staticmethod
    def get_provider(
        provider_name: Optional[str] = None, 
        model_name: Optional[str] = None
    ) -> BaseProvider:
        """
        Factory method to get the configured local LLM provider.
        """
        # Fallback to configured settings if parameters are omitted
        provider = (provider_name or settings.DEFAULT_LLM_PROVIDER).lower()
        model = model_name or settings.DEFAULT_LLM_MODEL

        if provider == "ollama":
            return OllamaProvider(model=model)
        elif provider == "llamacpp":
            return LlamaCppProvider(model=model)
        elif provider == "vllm":
            return VllmProvider(model=model)
        else:
            # Default fallback to Ollama provider
            return OllamaProvider(model=model)
