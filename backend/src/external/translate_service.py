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

# Dynamic Travel Dictionaries across 8 Languages
CITIES_MAP = {
    "hi": {
        "Jaipur": "जयपुर", "Goa": "गोवा", "Tirupati": "तिरुपति", "Pokhara": "पोखरा", "Bhubaneswar": "भुवनेश्वर",
        "Mumbai": "मुंबई", "Hyderabad": "हैदराबाद", "Munnar": "मुन्नार", "Amritsar": "अमृतसर", "Udaipur": "उदयपुर",
        "Varanasi": "वाराणसी", "Bengaluru": "बेंगलुरु", "Pondicherry": "पुदुचेरी", "Kochi": "कोच्चि", "New Delhi": "नई दिल्ली",
        "Agra": "आगरा", "Shimla": "शिमला", "Manali": "मनाली", "Ooty": "ऊटी", "Darjeeling": "दार्जिलिंग",
        "Rishikesh": "ऋषिकेश", "Shillong": "शिलांग", "Gangtok": "गंगटोक", "Chikmagalur": "चिकमगलूर", "Gokarna": "गोकर्ण",
        "Hampi": "हम्पी", "Alleppey": "अलप्पुझा", "Wayanad": "वायनाड", "Mysuru": "मैसूर", "Chennai": "चेन्नई",
        "Madurai": "मदुरै", "Thanjavur": "तंजावुर", "Panaji": "पणजी", "Pune": "पुणे", "Jodhpur": "जोधपुर",
        "Jaisalmer": "जैसलमेर", "Kandy": "कैंडी", "Colombo": "कोलंबो", "Kathmandu": "काठमांडू", "Thimphu": "थिम्पू",
        "Dubai": "दुबई", "Abu Dhabi": "अबू धाबी", "Doha": "दोहा", "Singapore": "सिंगापुर", "Bangkok": "बैंकॉक",
        "Bali": "बाली", "Zurich": "ज्यूरिख", "Visakhapatnam": "विशाखापट्टनम", "Puri": "पुरी", "Guwahati": "गुवाहाटी"
    },
    "ta": {
        "Jaipur": "ஜெய்ப்பூர்", "Goa": "கோவா", "Tirupati": "திருப்பதி", "Pokhara": "பொக்காரா", "Bhubaneswar": "புவனேஸ்வர்",
        "Mumbai": "மும்பை", "Hyderabad": "ஹைதராபாத்", "Munnar": "மூணார்", "Amritsar": "அமிர்தசரஸ்", "Udaipur": "உதய்பூர்",
        "Varanasi": "வாரணாசி", "Bengaluru": "பெங்களூரு", "Pondicherry": "பாண்டிச்சேரி", "Kochi": "கொச்சி", "New Delhi": "புது தில்லி",
        "Agra": "ஆக்ரா", "Shimla": "சிம்லா", "Manali": "மணாலி", "Ooty": "ஊட்டி", "Darjeeling": "டார்ஜிலிங்",
        "Rishikesh": "ரிஷிகேஷ்", "Shillong": "ஷில்லாங்", "Gangtok": "கேங்டாக்", "Chikmagalur": "சிக்மகளூர்", "Gokarna": "கோகர்ணா",
        "Hampi": "ஹம்பி", "Alleppey": "ஆலப்புழா", "Wayanad": "வயநாடு", "Mysuru": "மைசூர்", "Chennai": "சென்னை",
        "Madurai": "மதுரை", "Thanjavur": "தஞ்சாவூர்", "Panaji": "பனாஜி", "Pune": "புனே", "Jodhpur": "ஜோத்பூர்",
        "Jaisalmer": "ஜெய்சல்மேர்", "Kandy": "கண்டி", "Colombo": "கொழும்பு", "Kathmandu": "காத்மாண்டு", "Thimphu": "திம்பு",
        "Dubai": "துபாய்", "Abu Dhabi": "அபுதாபி", "Singapore": "சிங்கப்பூர்", "Bangkok": "பாங்காக்", "Bali": "பாலி", "Zurich": "சூரிச்"
    },
    "te": {
        "Jaipur": "జైపూర్", "Goa": "గోవా", "Tirupati": "తిరుపతి", "Pokhara": "పోఖరా", "Bhubaneswar": "భువనేశ్వర్",
        "Mumbai": "ముంబై", "Hyderabad": "హైదరాబాద్", "Munnar": "మున్నార్", "Amritsar": "అమృతసర్", "Udaipur": "ఉదయపూర్",
        "Varanasi": "వారణాసి", "Bengaluru": "బెంగళూరు", "Pondicherry": "పాండిచ్చేరి", "Kochi": "కొచ్చి", "New Delhi": "న్యూఢిల్లీ",
        "Agra": "ఆగ్రా", "Shimla": "సిమ్లా", "Manali": "మనాలి", "Ooty": "ఊటీ", "Darjeeling": "డార్జిలింగ్",
        "Rishikesh": "రిషికేశ్", "Shillong": "షిల్లాంగ్", "Gangtok": "గాంగ్‌టక్", "Chikmagalur": "చిక్కమగళూరు", "Gokarna": "గోకర్ణ",
        "Hampi": "హంపీ", "Alleppey": "అలప్పుళా", "Wayanad": "వయనాడ్", "Mysuru": "మైసూర్", "Chennai": "చెన్నై",
        "Madurai": "మదురై", "Thanjavur": "తంజావూరు", "Panaji": "పనాజీ", "Pune": "పుణె", "Dubai": "దుబాయ్"
    },
    "kn": {
        "Jaipur": "ಜೈಪುರ", "Goa": "ಗೋವಾ", "Tirupati": "ತಿರುಪತಿ", "Pokhara": "ಪೋಖರಾ", "Bhubaneswar": "ಭುವನೇಶ್ವರ",
        "Mumbai": "ಮುಂಬೈ", "Hyderabad": "ಹೈದರಾಬಾದ್", "Munnar": "ಮುನ್ನಾರ್", "Amritsar": "ಅಮೃತಸರ", "Udaipur": "ಉದಯಪುರ",
        "Varanasi": "ವಾರಣಾಸಿ", "Bengaluru": "ಬೆಂಗಳೂರು", "Pondicherry": "ಪಾಂಡಿಚೇರಿ", "Kochi": "ಕೊಚ್ಚಿ", "New Delhi": "ನವದೆಹಲಿ",
        "Agra": "ಆಗ್ರಾ", "Shimla": "ಶಿಮ್ಲಾ", "Manali": "ಮನಾಲಿ", "Ooty": "ಊಟಿ", "Darjeeling": "ಡಾರ್ಜಿಲಿಂಗ್",
        "Rishikesh": "ಋಷಿಕೇಶ", "Shillong": "ಶಿಲ್ಲಾಂಗ್", "Gangtok": "ಗ್ಯಾಂಗ್ಟಾಕ್", "Chikmagalur": "ಚಿಕ್ಕಮಗಳೂರು", "Gokarna": "ಗೋಕರ್ಣ",
        "Hampi": "ಹಂಪಿ", "Alleppey": "ಅಲಪ್ಪುಳ", "Wayanad": "ವಯನಾಡ್", "Mysuru": "ಮೈಸೂರು", "Chennai": "ಚೆನ್ನೈ"
    },
    "mr": {
        "Jaipur": "जयपूर", "Goa": "गोवा", "Tirupati": "तिरुपती", "Pokhara": "पोखरा", "Bhubaneswar": "भुवनेश्वर",
        "Mumbai": "मुंबई", "Hyderabad": "हैदराबाद", "Munnar": "मुन्नार", "Amritsar": "अमृतसर", "Udaipur": "उदयपूर",
        "Varanasi": "वाराणसी", "Bengaluru": "बंगळुरू", "Pondicherry": "पाँडिचेरी", "Kochi": "कोची", "New Delhi": "नवी दिल्ली",
        "Agra": "आग्रा", "Shimla": "शिमला", "Manali": "मनाली", "Ooty": "उटी", "Darjeeling": "दार्जिलिंग",
        "Rishikesh": "ऋषिकेश", "Shillong": "शिलाँग", "Gangtok": "गंगटोक", "Chikmagalur": "चिकमंगळूर", "Gokarna": "गोकर्ण",
        "Hampi": "हम्पी", "Alleppey": "अलेप्पी", "Wayanad": "वायनाड", "Mysuru": "म्हैसूर", "Chennai": "चेन्नई", "Pune": "पुणे"
    },
    "bn": {
        "Jaipur": "জয়পুর", "Goa": "গোয়া", "Tirupati": "তিরুপতি", "Pokhara": "পোখরা", "Bhubaneswar": "ভুবনেশ্বর",
        "Mumbai": "মুম্বাই", "Hyderabad": "হায়দ্রাবাদ", "Munnar": "মুন্নার", "Amritsar": "অমৃতসর", "Udaipur": "উদয়পুর",
        "Varanasi": "বারাণসী", "Bengaluru": "বেঙ্গালুরু", "Pondicherry": "পন্ডিচেরি", "Kochi": "কোচি", "New Delhi": "নতুন দিল্লি",
        "Agra": "আগ্রা", "Shimla": "শিমলা", "Manali": "মানালি", "Ooty": "উটি", "Darjeeling": "দার্জিলিং", "Kolkata": "কলকাতা"
    },
    "gu": {
        "Jaipur": "જયપુર", "Goa": "ગોવા", "Tirupati": "તિરુપતિ", "Pokhara": "પોખરા", "Bhubaneswar": "ભુવનેશ્વર",
        "Mumbai": "મુંબઈ", "Hyderabad": "હૈદરાબાદ", "Munnar": "મુન્નાર", "Amritsar": "અમૃતસર", "Udaipur": "ઉદયપુર",
        "Varanasi": "વારાણસી", "Bengaluru": "બેંગલુરુ", "Pondicherry": "પોંડિચેરી", "Kochi": "કોચી", "New Delhi": "નવી દિલ્હી",
        "Ahmedabad": "અમદાવાદ", "Bhuj": "ભુજ", "Shimla": "શિમલા", "Manali": "મનાલી", "Ooty": "ઊટી"
    }
}

THEMES_MAP = {
    "hi": {
        "Honeymoon": "हनीमून", "Adventure": "एडवेंचर", "Food Trail": "फूड ट्रेल", "Food": "भोजन",
        "Pilgrimage": "तीर्थयात्रा", "Wildlife": "वन्यजीव", "Family": "पारिवारिक", "Heritage": "विरासत",
        "Romantic": "रोमांटिक", "Beach": "बीच", "Nature": "प्रकृति", "Culture": "संस्कृति", "Spiritual": "आध्यात्मिक"
    },
    "ta": {
        "Honeymoon": "தேன்நிலவு", "Adventure": "சாகசம்", "Food Trail": "உணவுப் பயணம்", "Food": "உணவு",
        "Pilgrimage": "புனித யாத்திரை", "Wildlife": "வனவிலங்கு", "Family": "குடும்பம்", "Heritage": "பாரம்பரியம்",
        "Romantic": "காதல்", "Beach": "கடற்கரை", "Nature": "இயற்கை", "Culture": "கலாச்சாரம்", "Spiritual": "ஆன்மீகம்"
    },
    "te": {
        "Honeymoon": "హనీమూన్", "Adventure": "సాహసం", "Food Trail": "ఫుడ్ ట్రయిల్", "Food": "ఆహారం",
        "Pilgrimage": "తీర్థయాత్ర", "Wildlife": "వన్యప్రాణులు", "Family": "కుటుంబం", "Heritage": "వారసత్వం",
        "Romantic": "రొమాంటిక్", "Beach": "బీచ్", "Nature": "ప్రకృతి", "Culture": "సంస్కృతి", "Spiritual": "ధార్మికం"
    },
    "kn": {
        "Honeymoon": "ಮಧುಚಂದ್ರ", "Adventure": "ಸಾಹಸ", "Food Trail": "ಆಹಾರ ಯಾನ", "Food": "ಆಹಾರ",
        "Pilgrimage": "ತೀರ್ಥಯಾತ್ರೆ", "Wildlife": "ವನ್ಯಜೀವಿ", "Family": "ಕುಟುಂಬ", "Heritage": "ಪರಂಪರೆ",
        "Romantic": "ರೋಮ್ಯಾಂಟಿಕ್", "Beach": "ಕಡಲತೀರ", "Nature": "ಪ್ರಕೃತಿ", "Culture": "ಸಂಸ್ಕೃತಿ", "Spiritual": "ಧಾರ್ಮಿಕ"
    },
    "mr": {
        "Honeymoon": "हनिमून", "Adventure": "साहस", "Food Trail": "फूड ट्रेल", "Food": "अन्न",
        "Pilgrimage": "तीर्थक्षेत्र", "Wildlife": "वन्यजीव", "Family": "कौटुंबिक", "Heritage": "वारसा",
        "Romantic": "रोमँटिक", "Beach": "बीच", "Nature": "निसर्ग", "Culture": "संस्कृती", "Spiritual": "धार्मिक"
    },
    "bn": {
        "Honeymoon": "হানিমুন", "Adventure": "অভিযান", "Food Trail": "ফুড ট্রেইল", "Food": "খাবার",
        "Pilgrimage": "তীর্থযাত্রা", "Wildlife": "বন্যপ্রাণী", "Family": "পারিবারিক", "Heritage": "ঐতিহ্য",
        "Romantic": "রোমান্টিক", "Beach": "সৈকত", "Nature": "প্রকৃতি", "Culture": "সংস্কৃতি", "Spiritual": "ধর্মীয়"
    },
    "gu": {
        "Honeymoon": "હનીમૂન", "Adventure": "સાહસ", "Food Trail": "ફૂડ ટ્રેઇલ", "Food": "ખોરાક",
        "Pilgrimage": "યાત્રાધામ", "Wildlife": "વન્યજીવન", "Family": "કૌટુંબિક", "Heritage": "વારસો",
        "Romantic": "રોમેન્ટિક", "Beach": "બીચ", "Nature": "કુદરત", "Culture": "સંસ્કૃતિ", "Spiritual": "ધાર્મિક"
    }
}

DAYS_LABEL_MAP = {
    "hi": ("दिन", "रातें"),
    "ta": ("நாட்கள்", "இரவுகள்"),
    "te": ("రోజులు", "రాత్రులు"),
    "kn": ("ದಿನಗಳು", "ರಾತ್ರಿಗಳು"),
    "mr": ("दिवस", "रात्री"),
    "bn": ("দিন", "রাত"),
    "gu": ("દિવસ", "રાત")
}

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
        "Recommended for You": "आपके लिए अनुशंसित",
        "Personalized": "व्यक्तिगत",
        "Recommended based on your preferences & booking history": "आपकी प्राथमिकताओं और बुकिंग इतिहास पर आधारित सिफारिशें",
        "Starting from": "शुरुआती कीमत",
        "Curated Packages": "क्यूरेटेड पैकेज",
        "Explore Packages": "पैकेज देखें"
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
        "Recommended for You": "உங்களுக்கான பரிந்துரைகள்",
        "Personalized": "தனிப்பயனாக்கப்பட்டது",
        "Recommended based on your preferences & booking history": "உங்கள் விருப்பங்களின் அடிப்படையில் பரிந்துரைக்கப்படுகிறது",
        "Starting from": "ஆரம்ப விலை",
        "Curated Packages": "தொகுக்கப்பட்ட சுற்றுலாக்கள்",
        "Explore Packages": "சுற்றுலாக்களை ஆராயுங்கள்"
    },
    "te": {
        "Customise Tour Package": "టూర్ ప్యాకేజీని అనుకూలీకరించండి",
        "Select Tour Guide": "టూర్ గైడ్‌ని ఎంచుకోండి",
        "Live Repricing": "లైవ్ ధరల నవీకరణ",
        "Book Now": "ఇప్పుడే బుక్ చేయండి",
        "Total Price": "మొత్తం ధర",
        "Base Price": "ప్రాథమిక ధర",
        "Substitute Guide": "ప్రత్యామ్నాయ గైడ్",
        "Recommended for You": "మీ కోసం సిఫార్సు చేయబడినవి",
        "Personalized": "వ్యక్తిగతీకరించిన",
        "Starting from": "ప్రారంభ ధర",
        "Curated Packages": "క్యూరేటెడ్ ప్యాకేజీలు",
        "Explore Packages": "ప్యాకేజీలను అన్వేషించండి"
    },
    "kn": {
        "Customise Tour Package": "ಪ್ರವಾಸ ಪ್ಯಾಕೇಜ್ ಅನ್ನು ಕಸ್ಟಮೈಸ್ ಮಾಡಿ",
        "Select Tour Guide": "ಪ್ರವಾಸ ಮಾರ್ಗದರ್ಶಕರನ್ನು ಆಯ್ಕೆಮಾಡಿ",
        "Live Repricing": "ಲೈವ್ ಬೆಲೆ ಮರುಲೆಕ್ಕಾಚಾರ",
        "Book Now": "ಈಗಲೇ ಕಾಯ್ದಿರಿಸಿ",
        "Total Price": "ಒಟ್ಟು ಬೆಲೆ",
        "Base Price": "ಮೂಲ ಬೆಲೆ",
        "Recommended for You": "ನಿಮಗಾಗಿ ಶಿಫಾರಸು ಮಾಡಲಾಗಿದೆ",
        "Starting from": "ಪ್ರಾರಂಭಿಕ ಬೆಲೆ",
        "Curated Packages": "ಕ್ಯುರೇಟೆಡ್ ಪ್ಯಾಕೇಜ್‌ಗಳು"
    },
    "mr": {
        "Customise Tour Package": "टूर पॅकेज कस्टमाइझ करा",
        "Select Tour Guide": "टूर गाइड निवडा",
        "Live Repricing": "थेट किंमत फेरबदल",
        "Book Now": "आता बुक करा",
        "Total Price": "एकूण किंमत",
        "Base Price": "मूळ किंमत",
        "Recommended for You": "तुमच्यासाठी शिफारस केलेले",
        "Starting from": "किमान किंमत",
        "Curated Packages": "क्युरेट केलेले पॅकेजेस"
    },
    "bn": {
        "Customise Tour Package": "ট্যুর প্যাকেজ কাস্টমাইজ করুন",
        "Select Tour Guide": "ট্যুর গাইড নির্বাচন করুন",
        "Live Repricing": "লাইভ মূল্য নির্ধারণ",
        "Book Now": "এখন বুক করুন",
        "Total Price": "মোট মূল্য",
        "Base Price": "মূল মূল্য",
        "Recommended for You": "আপনার জন্য প্রস্তাবিত",
        "Starting from": "শুরু হচ্ছে",
        "Curated Packages": "কিউরেটেড প্যাকেজ"
    },
    "gu": {
        "Customise Tour Package": "ટૂર પેકેજ કસ્ટમાઇઝ કરો",
        "Select Tour Guide": "ટૂર ગાઇડ પસંદ કરો",
        "Live Repricing": "લાઇવ કિંમત ફેરફાર",
        "Book Now": "હમણાં બુક કરો",
        "Total Price": "કુલ કિંમત",
        "Base Price": "મૂળ કિંમત",
        "Recommended for You": "તમારા માટે ભલામણ કરેલ",
        "Starting from": "પ્રારંભિક કિંમત",
        "Curated Packages": "ક્યુરેટેડ પેકેજો"
    }
}

class TranslationService:
    @classmethod
    def _decompose_and_translate_title(cls, text: str, clean_target: str) -> Optional[str]:
        """
        Deconstructs standard catalog titles like 'Bhubaneswar Wildlife — 6 Days' or 'Jaipur Heritage - 5 Days'
        and translates them cleanly into target language.
        """
        if clean_target not in CITIES_MAP:
            return None

        clean_text = text.replace("–", "—").replace("-", "—")
        parts = [p.strip() for p in clean_text.split("—")]
        if len(parts) >= 2:
            left = parts[0]
            right = parts[1]
            # Match City & Theme from left
            matched_city = None
            matched_theme = None
            city_dict = CITIES_MAP.get(clean_target, {})
            theme_dict = THEMES_MAP.get(clean_target, {})

            for city_en in city_dict.keys():
                if city_en.lower() in left.lower():
                    matched_city = city_dict[city_en]
                    # Check remaining string for theme
                    rem = left.lower().replace(city_en.lower(), "").strip()
                    for theme_en in theme_dict.keys():
                        if theme_en.lower() in rem:
                            matched_theme = theme_dict[theme_en]
                            break
                    break

            # Parse days from right
            import re
            day_match = re.search(r"(\d+)\s*Day", right, re.IGNORECASE)
            num_days = day_match.group(1) if day_match else None

            if matched_city:
                theme_str = f" {matched_theme}" if matched_theme else ""
                days_label = DAYS_LABEL_MAP.get(clean_target, ("Days", "Nights"))[0]
                days_str = f" — {num_days} {days_label}" if num_days else ""
                return f"{matched_city}{theme_str}{days_str}"

        return None

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

        # 1. Pattern Decomposition & Translation for Package Titles (Instant 0ms)
        decomposed = TranslationService._decompose_and_translate_title(text.strip(), clean_target)
        if decomposed:
            _TRANSLATION_CACHE[cache_key] = decomposed
            return {
                "translated_text": decomposed,
                "source": "pattern_decomposer",
                "target_lang": target_lang
            }

        # 2. Local Travel Dictionary (Instant 0ms Fallback)
        if clean_target in COMMON_TRANSLATIONS and text.strip() in COMMON_TRANSLATIONS[clean_target]:
            res = COMMON_TRANSLATIONS[clean_target][text.strip()]
            _TRANSLATION_CACHE[cache_key] = res
            return {
                "translated_text": res,
                "source": "local_dictionary",
                "target_lang": target_lang
            }

        # 3. Microsoft Azure Cognitive Services Translator Text API v3.0
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
