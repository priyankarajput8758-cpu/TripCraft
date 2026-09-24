"""
Google Gemini AI Client with Multi-Model Fallback and Resilience.
Models: gemini-2.5-flash -> gemini-1.5-flash -> gemini-2.0-flash -> gemini-3.8-flash.
"""

import json
import logging
from typing import Optional, Dict, Any
from src.config import settings

logger = logging.getLogger("ai_client")

class GeminiClient:
    @staticmethod
    def generate_content(prompt: str, system_instruction: Optional[str] = None) -> Optional[str]:
        """
        Generate text using Google GenAI SDK with multi-model fallback.
        """
        if not settings.GEMINI_API_KEY:
            logger.warning("GEMINI_API_KEY not configured. Using deterministic engine.")
            return None

        # Try Google GenAI SDK
        try:
            from google import genai
            client = genai.Client(api_key=settings.GEMINI_API_KEY)

            for model_name in settings.GEMINI_MODELS:
                try:
                    config = {}
                    if system_instruction:
                        config["system_instruction"] = system_instruction

                    response = client.models.generate_content(
                        model=model_name,
                        contents=prompt,
                        config=config if config else None
                    )
                    if response and response.text:
                        return response.text
                except Exception as model_err:
                    logger.warning(f"Model {model_name} failed: {model_err}, trying next fallback...")
                    continue
        except Exception as e:
            logger.error(f"Gemini SDK invocation error: {e}")

        return None
