from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=[".env", "../../.env"],
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # LLM
    openai_api_key: str
    llm_provider: str = "openai"
    llm_model: str = "gpt-4.1"
    embedding_model: str = "text-embedding-3-small"
    pgvector_embed_dim: int = 1536

    # Database
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_db: str = "agentic_commerce"
    postgres_user: str = "codeloom"
    postgres_password: str = "codeloom"
    database_url: str = "postgresql+asyncpg://codeloom:codeloom@localhost:5432/agentic_commerce"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # Langfuse
    langfuse_enabled: bool = True
    langfuse_secret_key: str = ""
    langfuse_public_key: str = ""
    langfuse_base_url: str = "https://cloud.langfuse.com"

    # BFF integration (for domain_action tool)
    bff_base_url: str = "http://localhost:4201/api"

    # Application
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    env: str = "development"
    debug: bool = False

    @property
    def sync_database_url(self) -> str:
        return self.database_url.replace("postgresql+asyncpg", "postgresql")


settings = Settings()
