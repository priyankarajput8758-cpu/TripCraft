"""
Google Gemini AI Client with Multi-Model Fallback and Resilience.
Supported Models: gemini-3.6-flash -> gemini-3.7-flash -> gemini-3.8-flash -> gemini-3.5-flash -> gemini-flash-latest.
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
        Generate text using Google GenAI SDK with multi-model fallback and strict timeout.
        """
        if not settings.GEMINI_API_KEY:
            logger.warning("GEMINI_API_KEY not configured.")
            return None

        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=settings.GEMINI_API_KEY)

            for model_name in settings.GEMINI_MODELS:
                try:
                    config = types.GenerateContentConfig(
                        system_instruction=system_instruction if system_instruction else None,
                        http_options=types.HttpOptions(timeout=12000)
                    )

                    response = client.models.generate_content(
                        model=model_name,
                        contents=prompt,
                        config=config
                    )
                    if response and response.text:
                        return response.text
                except Exception as model_err:
                    logger.warning(f"Model {model_name} failed: {model_err}, trying next fallback...")
                    continue
        except Exception as e:
            logger.error(f"Gemini SDK invocation error: {e}")

        return None

    @staticmethod
    def generate_json(prompt: str, system_instruction: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Generate structured JSON output using Google GenAI SDK with multi-model fallback and strict timeout.
        """
        if not settings.GEMINI_API_KEY:
            return None

        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=settings.GEMINI_API_KEY)

            for model_name in settings.GEMINI_MODELS:
                try:
                    config = types.GenerateContentConfig(
                        response_mime_type="application/json",
                        system_instruction=system_instruction if system_instruction else None,
                        http_options=types.HttpOptions(timeout=12000)
                    )

                    response = client.models.generate_content(
                        model=model_name,
                        contents=prompt,
                        config=config
                    )
                    if response and response.text:
                        clean_text = response.text.strip()
                        # Strip markdown fences if present
                        if clean_text.startswith("```json"):
                            clean_text = clean_text[7:]
                        if clean_text.startswith("```"):
                            clean_text = clean_text[3:]
                        if clean_text.endswith("```"):
                            clean_text = clean_text[:-3]
                        return json.loads(clean_text.strip())
                except Exception as model_err:
                    logger.warning(f"JSON Generation on {model_name} failed: {model_err}, trying next fallback...")
                    continue
        except Exception as e:
            logger.error(f"Gemini JSON invocation error: {e}")

        return None
