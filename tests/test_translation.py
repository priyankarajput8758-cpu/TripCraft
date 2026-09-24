import pytest
from src.external.translate_service import TranslationService

def test_azure_translation_basic():
    """Verify that translation handles basic translation and returns valid translated text."""
    res = TranslationService.translate("Welcome to your customized tour package", target_lang="hi", source_lang="en")
    assert res is not None
    assert "translated_text" in res
    assert len(res["translated_text"]) > 0

def test_azure_translation_batch():
    """Verify batch translation produces matching number of output translations."""
    texts = ["Heritage Tour", "Local Guide", "Book Now"]
    res = TranslationService.translate_batch(texts, target_lang="ta", source_lang="en")
    assert len(res) == len(texts)
    for item in res:
        assert isinstance(item, str)
        assert len(item) > 0
