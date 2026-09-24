"""
AI Orchestration & Grounding Pipeline for TripCraft / PackagePro.
Bridges natural language prompts with SQLite database and Decimal pricing.
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from src.ai.service import AIService
from src.ai.gemini_client import GeminiClient

def run_trip_builder_pipeline(prompt: str, **kwargs):
    """Run full AI Trip Builder pipeline."""
    return AIService.build_custom_trip(user_prompt=prompt, **kwargs)

def run_guide_matcher_pipeline(city_id: str, start_date: str, **kwargs):
    """Run full AI Guide Matcher pipeline."""
    return AIService.match_best_guide(city_id=city_id, start_date=start_date, **kwargs)

if __name__ == "__main__":
    print("Testing AI Trip Builder Pipeline...")
    res = run_trip_builder_pipeline("I want a 4-day spiritual heritage pilgrimage with a Tamil guide", preferred_language="ta")
    print("AI Proposal Status:", res["status"])
    print("Curated Package:", res["package"]["name"])
    print("Total Repriced:", res["reprice_summary"]["currency"], res["reprice_summary"]["total_price"])
    print("AI Justification:", res["ai_explanation"])
