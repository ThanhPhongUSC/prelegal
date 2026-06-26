"""Supported legal document types, loaded from the project ``catalog.json``.

Each catalog entry points at a Markdown template under ``templates/``. The
document ``id`` is the template filename stem (e.g. ``CSA``, ``Mutual-NDA``). The
NDA cover-page entry is excluded: our preview builds its own cover page, so only
the Standard Terms templates are offered as document types.
"""

import json
import os
from functools import lru_cache
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
CATALOG_PATH = Path(os.environ.get("PRELEGAL_CATALOG_PATH", REPO_ROOT / "catalog.json"))
TEMPLATES_DIR = Path(os.environ.get("PRELEGAL_TEMPLATES_DIR", REPO_ROOT / "templates"))

# Catalog entries we do not offer as standalone document types.
_EXCLUDED_IDS = {"Mutual-NDA-coverpage"}


class DocumentType:
    """A supported document type and the path to its Standard Terms template."""

    def __init__(self, id: str, name: str, description: str, template: Path):
        self.id = id
        self.name = name
        self.description = description
        self.template = template

    def summary(self) -> dict:
        return {"id": self.id, "name": self.name, "description": self.description}


@lru_cache
def _types() -> dict[str, DocumentType]:
    catalog = json.loads(CATALOG_PATH.read_text())
    types: dict[str, DocumentType] = {}
    for entry in catalog["templates"]:
        path = REPO_ROOT / entry["filename"]
        doc_id = path.stem
        if doc_id in _EXCLUDED_IDS:
            continue
        types[doc_id] = DocumentType(doc_id, entry["name"], entry["description"], path)
    return types


def supported_types() -> list[dict]:
    """The document types offered to the user, as ``{id, name, description}``."""
    return [t.summary() for t in _types().values()]


def get_template(doc_id: str) -> dict:
    """Return ``{id, name, markdown}`` for a document type, or raise ``KeyError``."""
    doc = _types()[doc_id]
    return {"id": doc.id, "name": doc.name, "markdown": doc.template.read_text()}
