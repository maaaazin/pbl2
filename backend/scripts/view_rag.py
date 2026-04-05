#!/usr/bin/env python3
"""Print documents stored in the local Chroma UI-elements collection.

Run from the `backend/` directory::

    uv run python scripts/view_rag.py
"""

from __future__ import annotations

import sys
from pathlib import Path

_backend_root = Path(__file__).resolve().parents[1]
if str(_backend_root) not in sys.path:
    sys.path.insert(0, str(_backend_root))

from app.core.rag.vector_store import get_vector_store


def main() -> None:
    vector_store = get_vector_store()
    collection = vector_store.get()
    docs = collection.get("documents", [])
    metadatas = collection.get("metadatas", [])

    print(f"Total UI elements in RAG: {len(docs)}\n")

    for i in range(len(docs)):
        meta = metadatas[i] if metadatas else {}
        print(f"--- Element {i + 1} ---")
        print(f"Target URL: {meta.get('url')}")
        print(f"Semantic content: {docs[i]}")
        print(f"Raw JSON: {meta.get('raw_json')}\n")


if __name__ == "__main__":
    main()
