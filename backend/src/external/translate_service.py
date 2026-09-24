"""
Multilingual Translation Service.
Connects to LibreTranslate with fallback support for essential Indian languages.
"""

import requests
from typing import Dict, Any, Optional
from src.config import settings

# Built-in essential translation dictionary for Indian Languages & Travel UI terms
COMMON_TRANSLATIONS = {
    "hi": {
        "Customise Tour Package": "टूर पैकेज कस्टमाइज़ करें",
        "Select Tour Guide": "टूर गाइड चुनें",
        "Live Repricing": "लाइव रीप्राइसिंग",
        "Book Now": "अभी बुक करें",
        "Package Inclusions": "पैकेज समावेशन",
        "Day": "दिन",
        "Hotel": "होटल",
        "Activity": "गतिविधि",
        "Transfer": "स्थानांतरण",
        "Available": "उपलब्ध",
        "Unavailable": "अनुपलब्ध",
        "Total Price": "कुल मूल्य",
        "Base Price": "मूल मूल्य",
        "Substitute Guide": "वैकल्पिक गाइड",
        "Real-World Pricing": "वास्तविक मूल्य निर्धारण",
        "Language": "भाषा",
        "Specialisation": "विशेषज्ञता",
        "Heritage": "विरासत",
        "Food": "भोजन",
        "Trekking": "ट्रेकिंग",
        "Wildlife": "वन्यजीव",
        "Photography": "फोटोग्राफी",
        "Religious": "धार्मिक"
    },
    "ta": {
        "Customise Tour Package": "சுற்றுலா தொகுப்பை தனிப்பயனாக்குங்கள்",
        "Select Tour Guide": "சுற்றுலா வழிகாட்டியைத் தேர்ந்தெடுக்கவும்",
        "Live Repricing": "நேரலை விலை மறுமதிப்பீடு",
        "Book Now": "இப்போது முன்பதிவு செய்யுங்கள்",
        "Package Inclusions": "தொகுப்பு உள்ளடக்கம்",
        "Day": "நாள்",
        "Hotel": "ஹோட்டல்",
        "Activity": "செயல்பாடு",
        "Transfer": "போக்குவரத்து",
        "Available": "கிடைக்கும்",
        "Unavailable": "கிடைக்கவில்லை",
        "Total Price": "மொத்த விலை",
        "Base Price": "அடிப்படை விலை",
        "Substitute Guide": "மாற்று வழிகாட்டி",
        "Real-World Pricing": "நிகழ்நேர விலை",
        "Language": "மொழி",
        "Specialisation": "சிறப்புத் துறை",
        "Heritage": "பாரம்பரியம்",
        "Food": "உணவு",
        "Trekking": "மலையேற்றம்",
        "Wildlife": "வனவிலங்கு",
        "Photography": "புகைப்படம்",
        "Religious": "ஆன்மீகம்"
    },
    "te": {
        "Customise Tour Package": "టూర్ ప్యాకేజీని అనుకూలీకరించండి",
        "Select Tour Guide": "టూర్ గైడ్‌ని ఎంచుకోండి",
        "Live Repricing": "లైవ్ ధరల నవీకరణ",
        "Book Now": "ఇప్పుడే బుక్ చేయండి",
        "Package Inclusions": "ప్యాకేజీ చేరికలు",
        "Day": "రోజు",
        "Hotel": "హోటల్",
        "Activity": "కార్యకలాపం",
        "Transfer": "రవాణా",
        "Total Price": "మొత్తం ధర",
        "Base Price": "ప్రాథమిక ధర",
        "Substitute Guide": "ప్రత్యామ్నాయ గైడ్",
        "Heritage": "వారసత్వం",
        "Food": "ఆహారం",
        "Religious": "ధార్మికం"
    }
}

class TranslationService:
    @staticmethod
    def translate(
        text: str,
        target_lang: str,
        source_lang: str = "en"
    ) -> Dict[str, Any]:
        """
        Translate text using LibreTranslate or local dictionary fallback.
        """
        # Clean target lang tag (e.g. 'ta-IN' -> 'ta')
        short_target = target_lang.split("-")[0].lower()
        short_source = source_lang.split("-")[0].lower()

        if short_target == short_source:
            return {"translated_text": text, "source": "identical_lang", "target_lang": target_lang}

        # 1. Try LibreTranslate API if configured & running
        if settings.LIBRETRANSLATE_URL:
            try:
                resp = requests.post(
                    f"{settings.LIBRETRANSLATE_URL.rstrip('/')}/translate",
                    data={
                        "q": text,
                        "source": short_source,
                        "target": short_target,
                        "format": "text"
                    },
                    timeout=2
                )
                if resp.status_code == 200:
                    data = resp.json()
                    translated = data.get("translatedText")
                    if translated:
                        return {
                            "translated_text": translated,
                            "source": "libretranslate_live",
                            "target_lang": target_lang
                        }
            except Exception:
                pass  # Fall through to dictionary fallback

        # 2. Dictionary Fallback
        if short_target in COMMON_TRANSLATIONS:
            dict_match = COMMON_TRANSLATIONS[short_target].get(text.strip())
            if dict_match:
                return {
                    "translated_text": dict_match,
                    "source": "local_dictionary",
                    "target_lang": target_lang
                }

        # 3. Default back to original string
        return {
            "translated_text": text,
            "source": "fallback_original",
            "target_lang": target_lang
        }
