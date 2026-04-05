from __future__ import annotations

import os

from langchain_community.vectorstores import Chroma

from app.config import settings
from app.core.rag.embeddings import get_embeddings


def get_vector_store(collection_name: str = "ui_elements") -> Chroma:
    """Return a Chroma vector store instance persisted under ``settings.CHROMA_PATH``."""
    persist = settings.CHROMA_PATH
    os.makedirs(persist, exist_ok=True)
    embeddings = get_embeddings()
    return Chroma(
        collection_name=collection_name,
        embedding_function=embeddings,
        persist_directory=persist,
    )
