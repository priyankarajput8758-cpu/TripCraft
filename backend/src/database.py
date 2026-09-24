"""
Database connection manager and Decimal/Row helpers.
Enforces Rule R3 (Decimal money) and SQLite thread safety.
"""

import sqlite3
from contextlib import contextmanager
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path
from typing import Generator, Any, Dict
from src.config import settings

def dict_factory(cursor: sqlite3.Cursor, row: tuple) -> Dict[str, Any]:
    """Convert sqlite3 row to dictionary."""
    d = {}
    for idx, col in enumerate(cursor.description):
        d[col[0]] = row[idx]
    return d

def to_decimal(val: Any) -> Decimal:
    """
    Safely convert money string or number to Decimal with 2 decimal places.
    Never passes through a standard float.
    """
    if val is None or val == "":
        return Decimal("0.00")
    if isinstance(val, Decimal):
        return val.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    # Cast via string representation
    return Decimal(str(val).strip()).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

def format_money(val: Decimal) -> str:
    """Format Decimal to standard 2-place string (e.g. '12500.00')."""
    return str(to_decimal(val))

@contextmanager
def get_db_connection() -> Generator[sqlite3.Connection, None, None]:
    """Provide a thread-safe transactional SQLite connection."""
    db_path = Path(settings.DB_PATH)
    if not db_path.exists():
        # Fallback if relative path resolution differs
        fallback = Path(__file__).resolve().parent.parent.parent / "data" / "PS-04.db"
        if fallback.exists():
            db_path = fallback
        else:
            raise FileNotFoundError(f"SQLite database not found at {db_path} or {fallback}")

    conn = sqlite3.connect(str(db_path), check_same_thread=False)
    conn.row_factory = dict_factory
    conn.execute("PRAGMA foreign_keys = ON;")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def init_db_extensions():
    """Ensure additive tables such as package_selections exist."""
    with get_db_connection() as conn:
        conn.execute("""
        CREATE TABLE IF NOT EXISTS package_selections (
          selection_id TEXT PRIMARY KEY,
          package_id TEXT NOT NULL,
          component_id TEXT NOT NULL,
          swap_group TEXT NOT NULL,
          trip_id TEXT,
          itinerary_id TEXT,
          user_id TEXT,
          chosen_at TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'active',
          updated_at TEXT NOT NULL,
          FOREIGN KEY (package_id) REFERENCES tour_packages(package_id),
          FOREIGN KEY (component_id) REFERENCES package_components(component_id)
        );
        """)
