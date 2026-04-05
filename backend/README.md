# AQUA backend

FastAPI service for agentic test generation, Playwright execution, JWT auth, and MongoDB persistence.

## Layout

| Path | Purpose |
|------|---------|
| `app/` | Application code (`main`, `api`, `core`, `db`, `models`, `services`) |
| `app/api/v1/` | Versioned HTTP routes |
| `app/api/dependencies.py` | Shared FastAPI dependencies (e.g. `get_current_user`) |
| `docs/` | Setup and testing notes |
| `notebooks/` | Jupyter experiments (e.g. planning notebooks) |
| `scripts/` | CLI utilities (`view_rag.py`, etc.) |

Generated output (gitignored): `playwright_scripts/`, `playwright_artifacts/`, `data/`.

## Run

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload
```

Configure `.env` (see `docs/SETUP_AND_TESTING.md`). Set a strong `JWT_SECRET` in production.

## Format & lint

```bash
uv sync --group dev
uv run ruff format app scripts
uv run ruff check app scripts
```

## Chroma / RAG path

Vector data is stored under `CHROMA_PATH` (default `data/chroma_db`). If you used an older build that wrote to `data/chroma`, point `CHROMA_PATH` there or move the folder.
