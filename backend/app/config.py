from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # App
    APP_NAME: str = "Agentic Test System"
    API_V1_PREFIX: str = "/api/v1"

    # Database
    MONGODB_URI: str = "mongodb://localhost:27017"
    DB_NAME: str = "agentic_testing"

    # LLM
    GROQ_API_KEY: str | None = None
    LMSTUDIO_URL: str = "http://localhost:1234"
    LLM_PROVIDER: str = "lmstudio"  # "lmstudio" | "groq"
    LLM_MODEL: str = "qwen2.5-coder:latest"
    LLM_TEMPERATURE: float = 0.2
    LLM_TIMEOUT_S: float = 180.0
    LLM_MAX_TOKENS: int | None = None

    # Agent / Playwright script generation (can use a separate LM Studio instance/model)
    AGENT_LMSTUDIO_URL: str | None = None
    AGENT_LLM_MODEL: str | None = None

    # Playwright artifacts
    PLAYWRIGHT_SCRIPT_OUTPUT_DIR: str | None = "playwright_scripts"
    PLAYWRIGHT_ARTIFACTS_DIR: str = "playwright_artifacts"

    # Vector DB
    CHROMA_PATH: str = "data/chroma_db"

    # Auth
    JWT_SECRET: str = "change-me-in-production-use-long-random-string"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7

    # CORS (comma-separated origins, or "*" for dev)
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"

    class Config:
        env_file = ".env"


@lru_cache
def get_settings():
    return Settings()


settings = get_settings()
