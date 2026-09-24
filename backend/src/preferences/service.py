"""
User preferences and multilingual filtering service.
"""

from datetime import datetime, timezone
from typing import Dict, Any, Optional
from src.database import get_db_connection

class PreferencesService:
    @staticmethod
    def get_user_preferences(user_id: str) -> Dict[str, Any]:
        """Fetch user preferences and user profile."""
        with get_db_connection() as conn:
            user = conn.execute("SELECT * FROM users WHERE user_id = ?", (user_id,)).fetchone()
            if not user:
                # Return default traveller profile if user not found
                return {
                    "user_id": user_id,
                    "display_name": "Divyansh Duggad",
                    "email": "divyansh@example.com",
                    "locale": "en-IN",
                    "preferred_languages": "en-IN,hi,ta",
                    "guide_language": "ta",
                    "interests": "heritage,food,photography",
                    "pace": "moderate",
                    "preferred_currency": "INR",
                    "max_daily_budget": "15000.00"
                }

            prefs = conn.execute("SELECT * FROM user_preferences WHERE user_id = ?", (user_id,)).fetchone()
            if not prefs:
                return {
                    "user_id": user["user_id"],
                    "display_name": user["display_name"],
                    "email": user["email"],
                    "locale": user["locale"],
                    "preferred_languages": user["locale"],
                    "guide_language": user["locale"],
                    "interests": "heritage,food",
                    "pace": "moderate",
                    "preferred_currency": user["home_currency"],
                    "max_daily_budget": "10000.00"
                }

            res = dict(user)
            res.update(prefs)
            return res

    @staticmethod
    def update_user_preferences(
        user_id: str,
        preferred_languages: Optional[str] = None,
        guide_language: Optional[str] = None,
        interests: Optional[str] = None,
        pace: Optional[str] = None,
        preferred_currency: Optional[str] = None,
        max_daily_budget: Optional[str] = None
    ) -> Dict[str, Any]:
        """Update or insert user preferences."""
        now = datetime.now(timezone.utc).isoformat()
        with get_db_connection() as conn:
            existing = conn.execute("SELECT * FROM user_preferences WHERE user_id = ?", (user_id,)).fetchone()
            if existing:
                conn.execute("""
                    UPDATE user_preferences
                    SET preferred_languages = COALESCE(?, preferred_languages),
                        guide_language = COALESCE(?, guide_language),
                        interests = COALESCE(?, interests),
                        pace = COALESCE(?, pace),
                        preferred_currency = COALESCE(?, preferred_currency),
                        max_daily_budget = COALESCE(?, max_daily_budget),
                        updated_at = ?
                    WHERE user_id = ?
                """, (preferred_languages, guide_language, interests, pace, preferred_currency, max_daily_budget, now, user_id))
            else:
                pref_id = f"prf_{user_id[:8]}"
                conn.execute("""
                    INSERT INTO user_preferences (
                        preference_id, user_id, preferred_languages, guide_language, interests,
                        pace, preferred_currency, max_daily_budget, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    pref_id, user_id,
                    preferred_languages or "en-IN",
                    guide_language or "en-IN",
                    interests or "heritage",
                    pace or "moderate",
                    preferred_currency or "INR",
                    max_daily_budget or "10000.00",
                    now
                ))

            return PreferencesService.get_user_preferences(user_id)
