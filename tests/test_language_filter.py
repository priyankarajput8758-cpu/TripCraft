"""
Test Suite: Server-side Multilingual Filtering (PS-04 Rule R6).
Verifies that language preferences visibly change recommendations server-side.
"""

from src.catalog.service import CatalogService
from src.database import get_db_connection

def test_language_preference_filters_packages(db):
    """Verify that BCP-47 language tag filters tour packages server-side."""
    # Find a language present in packages
    pkg = db.execute("SELECT languages_offered FROM tour_packages WHERE languages_offered LIKE '%hi%' LIMIT 1").fetchone()
    if not pkg:
        pytest.skip("No packages with 'hi' in languages_offered")

    res = CatalogService.list_packages(language_bcp47="hi")
    assert res["total"] > 0
    for p in res["packages"]:
        assert "hi" in p["languages_offered"]

def test_language_preference_filters_guides(db):
    """Verify that BCP-47 tag filters guides who speak that language."""
    res = CatalogService.list_guides(language="ta")
    assert res["total"] > 0
    for g in res["guides"]:
        assert "ta" in g["languages"]

def test_language_filter_fallback_notice():
    """Verify that unsupported language codes return graceful fallback with clear notice."""
    res = CatalogService.list_packages(language_bcp47="xyz-nonexistent")
    assert res["language_notice"] is not None
    assert "xyz-nonexistent" in res["language_notice"]
    assert len(res["packages"]) > 0
