"""Load ERP finance policies from Markdown files."""
import re
from pathlib import Path

from app.config import POLICIES_DIR
from app.models import PolicyChunk


SECTION_RE = re.compile(r"^##\s+(.+)$", re.MULTILINE)


def _slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", text.lower()).strip("_")


def load_policies() -> list[PolicyChunk]:
    """Load all Markdown policy files and split into chunks by ## heading."""
    chunks: list[PolicyChunk] = []
    for md_path in sorted(POLICIES_DIR.glob("*.md")):
        text = md_path.read_text(encoding="utf-8")
        source = md_path.stem

        # If no ## headings, treat the whole file as one chunk.
        matches = list(SECTION_RE.finditer(text))
        if not matches:
            chunks.append(
                PolicyChunk(source=source, content=text.strip(), category=source)
            )
            continue

        for i, match in enumerate(matches):
            start = match.start()
            end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
            section_text = text[start:end].strip()
            heading = match.group(1).strip()
            category = _slugify(heading)
            chunks.append(
                PolicyChunk(
                    source=source,
                    content=section_text,
                    category=category,
                )
            )

    return chunks
