"""
Pytest configuration and shared fixtures.
"""

import sys
from pathlib import Path
import pytest

# Add backend directory to sys.path
BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from src.database import get_db_connection

@pytest.fixture
def db():
    with get_db_connection() as conn:
        yield conn
