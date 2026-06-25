"""Pytest fixtures."""
import sys
from pathlib import Path

# Ensure backend/app is on path when running pytest from backend/
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
