"""
Multilingual Translation Service.
Primary Engine: Microsoft Azure Cognitive Services Translator Text API v3.0
Supports Tamil (ta), Hindi (hi), Telugu (te), Kannada (kn), Marathi (mr), Bengali (bn), Gujarati (gu), Malayalam (ml), etc.
Fallback: Travel Vocabulary Dictionary and Google Gemini AI.
Includes connection pooling, in-memory caching, and resilient error recovery.
"""

import requests
import logging
from typing import Dict, Any, List, Union, Optional
from urllib.parse import quote
from src.config import settings
from src.ai.gemini_client import GeminiClient

logger = logging.getLogger("translate_service")

# Reusable HTTP session with connection pooling
_session = requests.Session()
adapter = requests.adapters.HTTPAdapter(pool_connections=20, pool_maxsize=50, max_retries=1)
_session.mount("https://", adapter)
_session.mount("http://", adapter)

# In-memory translation cache (target_lang:source_text -> translated_text)
_TRANSLATION_CACHE: Dict[str, str] = {}

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
    "gu-in": "gu",
    "ml": "ml",
    "ml-in": "ml",
    "pa": "pa",
    "ur": "ur"
}

# Essential Travel UI & Package Vocabulary Dictionary (Zero-Latency Guarantee)
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
        "Religious": "धार्मिक",
        "Goa Coastal Trek": "गोवा तटीय ट्रेक",
        "Romantic Beach Resort": "रोमांटिक बीच रिसॉर्ट",
        "Ancient Temples Trail": "प्राचीन मंदिर पथ",
        "Family Beach & Wildlife": "पारिवारिक बीच और वन्यजीव",
        "Goa Heritage & Coastal Experience": "गोवा विरासत और तटीय अनुभव",
        "4-Star Beachfront Resort": "4-स्टार बीचफ्रंट रिसॉर्ट",
        "5-Star Heritage Villa": "5-स्टार हेरिटेज विला",
        "Grande Island Scuba Diving": "ग्रांडे द्वीप स्कूबा डाइविंग",
        "Private AC SUV Transfer": "प्राइवेट एसी एसयूवी ट्रांसफर",
        "Standard Hillview Stay": "स्टैंडर्ड हिलव्यू स्टे",
        "Luxury Coffee Estate Resort": "लक्जरी कॉफी एस्टेट रिसॉर्ट",
        "Eco Nature Homestay": "इको नेचर होमस्टे",
        "Adventure": "साहसिक",
        "Honeymoon": "हनीमून",
        "Pilgrimage": "तीर्थयात्रा",
        "Family": "पारिवारिक",
        "Food Trail": "फूड ट्रेल"
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
        "Religious": "ஆன்மீகம்",
        "Goa Coastal Trek": "கோவா கடற்கரை மலையேற்றம்",
        "Romantic Beach Resort": "காதல் கடற்கரை விடுதி",
        "Ancient Temples Trail": "பண்டைய கோயில்கள் பாதை",
        "Family Beach & Wildlife": "குடும்ப கடற்கரை & வனவிலங்கு",
        "Goa Heritage & Coastal Experience": "கோவா பாரம்பரியம் & கடற்கரை அனுபவம்",
        "4-Star Beachfront Resort": "4-நட்சத்திர கடற்கரை ரிசார்ட்",
        "5-Star Heritage Villa": "5-நட்சத்திர பாரம்பரிய வில்லா",
        "Grande Island Scuba Diving": "கிராண்டே தீவு ஸ்கூபா டைவிங்",
        "Private AC SUV Transfer": "சொந்த ஏசி எஸ்யூவி வாகனம்",
        "Standard Hillview Stay": "ஹில்வியூ தங்குமிடம்",
        "Luxury Coffee Estate Resort": "சொகுசு காபி எஸ்டேட் ரிசார்ட்",
        "Eco Nature Homestay": "இயற்கை சூழல் இல்லம்",
        "Adventure": "சாகசம்",
        "Honeymoon": "தேன்நிலவு",
        "Pilgrimage": "ஆன்மீகப் பயணம்",
        "Family": "குடும்பம்",
        "Food Trail": "உணவுப் பயணம்"
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
        "Religious": "ధార్మికం",
        "Goa Coastal Trek": "గోవా తీరప్రాంత ట్రెక్",
        "Romantic Beach Resort": "రొమాంటిక్ బీచ్ రిసార్ట్",
        "Ancient Temples Trail": "పురాతన దేవాలయాల యాత్ర",
        "Family Beach & Wildlife": "ఫ్యామిలీ బీచ్ & వన్యప్రాణులు",
        "Goa Heritage & Coastal Experience": "గోవా వారసత్వం & తీర అనుభవం",
        "Adventure": "సాహసం",
        "Honeymoon": "హనీమూన్",
        "Pilgrimage": "తీర్థయాత్ర",
        "Family": "కుటుంబం"
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
        "Religious": "ಧಾರ್ಮಿಕ",
        "Goa Coastal Trek": "ಗೋವಾ ಕರಾವಳಿ ಚಾರಣ",
        "Romantic Beach Resort": "ರೋಮ್ಯಾಂಟಿಕ್ ಬೀಚ್ ರೆಸಾರ್ಟ್",
        "Ancient Temples Trail": "ಪ್ರಾಚೀನ ದೇವಾಲಯಗಳ ಪ್ರವಾಸ",
        "Family Beach & Wildlife": "ಕುಟುಂಬ ಕಡಲತೀರ & ವನ್ಯಜೀವಿ",
        "Goa Heritage & Coastal Experience": "ಗೋವಾ ಪರಂಪರೆ ಮತ್ತು ಕರಾವಳಿ ಅನುಭವ",
        "Adventure": "ಸಾಹಸ",
        "Honeymoon": "ಮಧುಚಂದ್ರ",
        "Pilgrimage": "ತೀರ್ಥಯಾತ್ರೆ",
        "Family": "ಕುಟುಂಬ"
    },
    "mr": {
        "Customise Tour Package": "टूर पॅकेज कस्टमाइझ करा",
        "Select Tour Guide": "टूर गाइड निवडा",
        "Live Repricing": "थेट किंमत फेरबदल",
        "Book Now": "आता बुक करा",
        "Total Price": "एकूण किंमत",
        "Base Price": "मूळ किंमत",
        "Heritage": "वारसा",
        "Food": "अन्न",
        "Religious": "धार्मिक",
        "Goa Coastal Trek": "गोवा कोस्टल ट्रेक",
        "Romantic Beach Resort": "रोमँटिक बीच रिसॉर्ट",
        "Ancient Temples Trail": "प्राचीन मंदिरे ट्रेल",
        "Family Beach & Wildlife": "कौटुंबिक बीच आणि वन्यजीव",
        "Adventure": "साहस",
        "Honeymoon": "हनिमून",
        "Pilgrimage": "तीर्थक्षेत्र",
        "Family": "कौटुंबिक"
    },
    "bn": {
        "Customise Tour Package": "ট্যুর প্যাকেজ কাস্টমাইজ করুন",
        "Select Tour Guide": "ট্যুর গাইড নির্বাচন করুন",
        "Live Repricing": "লাইভ মূল্য নির্ধারণ",
        "Book Now": "এখন বুক করুন",
        "Total Price": "মোট মূল্য",
        "Base Price": "মূল মূল্য",
        "Heritage": "ঐতিহ্য",
        "Food": "খাবার",
        "Religious": "ধর্মীয়",
        "Goa Coastal Trek": "গোয়া উপকূলীয় ট্রেক",
        "Romantic Beach Resort": "রোমান্টিক বিচ রিসোর্ট",
        "Ancient Temples Trail": "প্রাচীন মন্দিরের পথ",
        "Family Beach & Wildlife": "পারিবারিক সৈকত ও বন্যপ্রাণী",
        "Adventure": "অভিযান",
        "Honeymoon": "হানিমুন",
        "Pilgrimage": "তীর্থযাত্রা",
        "Family": "পারিবারিক"
    },
    "gu": {
        "Customise Tour Package": "ટૂર પેકેજ કસ્ટમાઇઝ કરો",
        "Select Tour Guide": "ટૂર ગાઇડ પસંદ કરો",
        "Live Repricing": "લાઇવ કિંમત ફેરફાર",
        "Book Now": "હમણાં બુક કરો",
        "Total Price": "કુલ કિંમત",
        "Base Price": "મૂળ કિંમત",
        "Heritage": "વારસો",
        "Food": "ખોરાક",
        "Religious": "ધાર્મિક",
        "Goa Coastal Trek": "ગોવા કોસ્ટલ ટ્રેક",
        "Romantic Beach Resort": "રોમેન્ટિક બીચ રિસોર્ટ",
        "Ancient Temples Trail": "પ્રાચીન મંદિરો પગદંડી",
        "Family Beach & Wildlife": "કૌટુંબિક બીચ અને વન્યજીવન",
        "Adventure": "સાહસ",
        "Honeymoon": "હનીમૂન",
        "Pilgrimage": "યાત્રાધામ",
        "Family": "કૌટુંબિક"
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
        falling back to local dictionary and Gemini AI with caching.
        """
        if not text or not text.strip():
            return {"translated_text": "", "source": "empty", "target_lang": target_lang}

        clean_target = AZURE_LANG_MAP.get(target_lang.lower().strip(), target_lang.split("-")[0].lower())
        clean_source = AZURE_LANG_MAP.get(source_lang.lower().strip(), source_lang.split("-")[0].lower())

        if clean_target == clean_source:
            return {"translated_text": text, "source": "identical_lang", "target_lang": target_lang}

        # If language code is not a valid 2-3 char code or known Azure code, return original
        if len(clean_target) > 5 or clean_target not in AZURE_LANG_MAP:
            return {"translated_text": text, "source": "unsupported_lang", "target_lang": target_lang}

        cache_key = f"{clean_target}:{clean_source}:{text.strip()}"
        if cache_key in _TRANSLATION_CACHE:
            return {
                "translated_text": _TRANSLATION_CACHE[cache_key],
                "source": "memory_cache",
                "target_lang": target_lang
            }

        # 1. Local Travel Dictionary (Instant 0ms Fallback)
        if clean_target in COMMON_TRANSLATIONS and text.strip() in COMMON_TRANSLATIONS[clean_target]:
            res = COMMON_TRANSLATIONS[clean_target][text.strip()]
            _TRANSLATION_CACHE[cache_key] = res
            return {
                "translated_text": res,
                "source": "local_dictionary",
                "target_lang": target_lang
            }

        # 2. Microsoft Azure Cognitive Services Translator Text API v3.0
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

                resp = _session.post(endpoint, headers=headers, json=body, timeout=3)
                if resp.status_code == 200:
                    data = resp.json()
                    if isinstance(data, list) and len(data) > 0:
                        translations = data[0].get("translations", [])
                        if translations and len(translations) > 0:
                            translated_val = translations[0].get("text")
                            if translated_val:
                                _TRANSLATION_CACHE[cache_key] = translated_val
                                return {
                                    "translated_text": translated_val,
                                    "source": "azure_translator_v3",
                                    "target_lang": target_lang
                                }
                else:
                    logger.warning(f"Azure Translator HTTP {resp.status_code}: {resp.text}")
            except Exception as e:
                logger.warning(f"Azure Translator request exception: {e}")

        # 3. Google Gemini AI Translation Fallback (Single string only)
        try:
            ai_prompt = f"Translate this travel text from {clean_source} to {clean_target} ({target_lang}) naturally and accurately:\n\"{text}\""
            system_inst = "You are an expert multilingual travel translator. Output ONLY the translated sentence, without commentary, quotes, or markdown fences."
            ai_translated = GeminiClient.generate_content(ai_prompt, system_inst)
            if ai_translated and ai_translated.strip():
                clean_res = ai_translated.strip().strip('"')
                _TRANSLATION_CACHE[cache_key] = clean_res
                return {
                    "translated_text": clean_res,
                    "source": "gemini_ai",
                    "target_lang": target_lang
                }
        except Exception as e:
            logger.warning(f"Translation via Gemini failed: {e}")

        # 4. Fallback Original
        _TRANSLATION_CACHE[cache_key] = text
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
        Translate a batch of texts efficiently in a single Azure Translator API call with cache lookup.
        """
        if not texts:
            return []

        clean_target = AZURE_LANG_MAP.get(target_lang.lower().strip(), target_lang.split("-")[0].lower())
        clean_source = AZURE_LANG_MAP.get(source_lang.lower().strip(), source_lang.split("-")[0].lower())

        if clean_target == clean_source or len(clean_target) > 5 or clean_target not in AZURE_LANG_MAP:
            return texts

        results: List[Optional[str]] = [None] * len(texts)
        missing_indices: List[int] = []
        missing_texts: List[str] = []

        # Check in-memory cache and dictionary first
        for i, t in enumerate(texts):
            if not t or not t.strip():
                results[i] = t
                continue
            cache_key = f"{clean_target}:{clean_source}:{t.strip()}"
            if cache_key in _TRANSLATION_CACHE:
                results[i] = _TRANSLATION_CACHE[cache_key]
            elif clean_target in COMMON_TRANSLATIONS and t.strip() in COMMON_TRANSLATIONS[clean_target]:
                dict_val = COMMON_TRANSLATIONS[clean_target][t.strip()]
                _TRANSLATION_CACHE[cache_key] = dict_val
                results[i] = dict_val
            else:
                missing_indices.append(i)
                missing_texts.append(t)

        if not missing_texts:
            return [r if r is not None else "" for r in results]

        # Azure Batch Translation for missing texts (1 single HTTP request)
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
                body = [{"Text": t} for t in missing_texts]

                resp = _session.post(endpoint, headers=headers, json=body, timeout=4)
                if resp.status_code == 200:
                    data = resp.json()
                    for idx, item in enumerate(data):
                        t_list = item.get("translations", [])
                        if t_list:
                            trans = t_list[0].get("text", missing_texts[idx])
                            orig_idx = missing_indices[idx]
                            results[orig_idx] = trans
                            _TRANSLATION_CACHE[f"{clean_target}:{clean_source}:{missing_texts[idx].strip()}"] = trans
                else:
                    logger.warning(f"Azure Batch Translator HTTP {resp.status_code}: {resp.text}")
            except Exception as e:
                logger.warning(f"Azure Batch Translator exception: {e}")

        # For remaining missing items, fallback safely to original text without blocking loops
        return [r if r is not None else texts[i] for i, r in enumerate(results)]
