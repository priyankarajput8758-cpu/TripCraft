"""
Multilingual Translation Service.
Primary Engine: Microsoft Azure Cognitive Services Translator Text API v3.0
Supports Tamil (ta), Hindi (hi), Telugu (te), Kannada (kn), Marathi (mr), Bengali (bn), Gujarati (gu), Malayalam (ml), etc.
Fallback: Google Gemini AI and Essential Travel Vocabulary Dictionary.
"""

import requests
import logging
from typing import Dict, Any, List, Union, Optional
from src.config import settings
from src.ai.gemini_client import GeminiClient

logger = logging.getLogger("translate_service")

# Language code normalization for Azure Translator
AZURE_LANG_MAP = {
    "en": "en",
    "en-in": "en",
    "en-us": "en",
    "hi": "hi",
    "hi-in": "hi",
    "ta": "ta",
    "ta-in": "ta",
    "te": "te",
    "te-in": "te",
    "kn": "kn",
    "kn-in": "kn",
    "mr": "mr",
    "mr-in": "mr",
    "bn": "bn",
    "bn-in": "bn",
    "gu": "gu",
    "ml": "ml",
    "pa": "pa",
    "ur": "ur"
}

# Essential Travel UI Vocabulary Dictionary (Instant Zero-Latency Fallback)
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
    },
    "kn": {
        "Customise Tour Package": "ಪ್ರವಾಸ ಪ್ಯಾಕೇಜ್ ಅನ್ನು ಕಸ್ಟಮೈಸ್ ಮಾಡಿ",
        "Select Tour Guide": "ಪ್ರವಾಸ ಮಾರ್ಗದರ್ಶಕರನ್ನು ಆಯ್ಕೆಮಾಡಿ",
        "Live Repricing": "ಲೈವ್ ಬೆಲೆ ಮರುಲೆಕ್ಕಾಚಾರ",
        "Book Now": "ಈಗಲೇ ಕಾಯ್ದಿರಿಸಿ",
        "Total Price": "ಒಟ್ಟು ಬೆಲೆ",
        "Base Price": "ಮೂಲ ಬೆಲೆ",
        "Heritage": "ಪರಂಪರೆ",
        "Food": "ಆಹಾರ",
        "Religious": "ಧಾರ್ಮಿಕ"
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
        Translate a single text string using Microsoft Azure Translator v3.0,
        falling back to Gemini AI and local vocabulary.
        """
        if not text or not text.strip():
            return {"translated_text": "", "source": "empty", "target_lang": target_lang}

        clean_target = AZURE_LANG_MAP.get(target_lang.lower().strip(), target_lang.split("-")[0].lower())
        clean_source = AZURE_LANG_MAP.get(source_lang.lower().strip(), source_lang.split("-")[0].lower())

        if clean_target == clean_source:
            return {"translated_text": text, "source": "identical_lang", "target_lang": target_lang}

        # 1. Primary Engine: Microsoft Azure Cognitive Services Translator
        if settings.AZURE_TRANSLATOR_KEY:
            try:
                endpoint = f"{settings.AZURE_TRANSLATOR_ENDPOINT.rstrip('/')}/translate?api-version=3.0&to={clean_target}"
                if clean_source:
                    endpoint += f"&from={clean_source}"

                headers = {
                    "Ocp-Apim-Subscription-Key": settings.AZURE_TRANSLATOR_KEY,
                    "Ocp-Apim-Subscription-Region": settings.AZURE_TRANSLATOR_REGION,
                    "Content-Type": "application/json"
                }
                body = [{"Text": text}]

                resp = requests.post(endpoint, headers=headers, json=body, timeout=5)
                if resp.status_code == 200:
                    data = resp.json()
                    if isinstance(data, list) and len(data) > 0:
                        translations = data[0].get("translations", [])
                        if translations and len(translations) > 0:
                            translated_val = translations[0].get("text")
                            if translated_val:
                                return {
                                    "translated_text": translated_val,
                                    "source": "azure_translator_v3",
                                    "target_lang": target_lang
                                }
                else:
                    logger.warning(f"Azure Translator HTTP {resp.status_code}: {resp.text}")
            except Exception as e:
                logger.warning(f"Azure Translator request exception: {e}")

        # 2. Local Travel Dictionary Fallback
        if clean_target in COMMON_TRANSLATIONS and text.strip() in COMMON_TRANSLATIONS[clean_target]:
            return {
                "translated_text": COMMON_TRANSLATIONS[clean_target][text.strip()],
                "source": "local_dictionary",
                "target_lang": target_lang
            }

        # 3. Google Gemini AI Translation Fallback
        try:
            ai_prompt = f"Translate this travel text from {clean_source} to {clean_target} ({target_lang}) naturally and accurately:\n\"{text}\""
            system_inst = "You are an expert multilingual travel translator. Output ONLY the translated sentence, without commentary, quotes, or markdown fences."
            ai_translated = GeminiClient.generate_content(ai_prompt, system_inst)
            if ai_translated and ai_translated.strip():
                return {
                    "translated_text": ai_translated.strip().strip('"'),
                    "source": "gemini_ai",
                    "target_lang": target_lang
                }
        except Exception as e:
            logger.warning(f"Translation via Gemini failed: {e}")

        # 4. Fallback Original
        return {
            "translated_text": text,
            "source": "fallback_original",
            "target_lang": target_lang
        }

    @staticmethod
    def translate_batch(
        texts: List[str],
        target_lang: str,
        source_lang: str = "en"
    ) -> List[str]:
        """
        Translate a batch of texts efficiently in a single Azure Translator API call.
        """
        if not texts:
            return []

        clean_target = AZURE_LANG_MAP.get(target_lang.lower().strip(), target_lang.split("-")[0].lower())
        clean_source = AZURE_LANG_MAP.get(source_lang.lower().strip(), source_lang.split("-")[0].lower())

        if clean_target == clean_source:
            return texts

        # Try Azure Batch Translation
        if settings.AZURE_TRANSLATOR_KEY:
            try:
                endpoint = f"{settings.AZURE_TRANSLATOR_ENDPOINT.rstrip('/')}/translate?api-version=3.0&to={clean_target}"
                if clean_source:
                    endpoint += f"&from={clean_source}"

                headers = {
                    "Ocp-Apim-Subscription-Key": settings.AZURE_TRANSLATOR_KEY,
                    "Ocp-Apim-Subscription-Region": settings.AZURE_TRANSLATOR_REGION,
                    "Content-Type": "application/json"
                }
                body = [{"Text": t} for t in texts]

                resp = requests.post(endpoint, headers=headers, json=body, timeout=8)
                if resp.status_code == 200:
                    data = resp.json()
                    results = []
                    for item in data:
                        t_list = item.get("translations", [])
                        if t_list:
                            results.append(t_list[0].get("text", ""))
                        else:
                            results.append("")
                    if len(results) == len(texts):
                        return results
            except Exception as e:
                logger.warning(f"Azure Batch Translator exception: {e}")

        # Fallback to single translate
        return [TranslationService.translate(t, target_lang, source_lang)["translated_text"] for t in texts]
