from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    PORT: int = 8000
    NODE_ENV: str = "development"
    DATABASE_URL: str = "sqlite+aiosqlite:///./project_mgmt.db"
    JWT_SECRET: str = "super-secret-key-change-this-in-production-min-32-chars"
    JWT_EXPIRES_IN: int = 86400  # in seconds (1 day)
    BCRYPT_SALT_ROUNDS: int = 10
    CORS_ORIGIN: str = "http://localhost:5173,http://localhost:3000"
    RATE_LIMIT_WINDOW_MS: int = 900000
    RATE_LIMIT_MAX: int = 100

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def cors_origins_list(self) -> List[str]:
        if not self.CORS_ORIGIN:
            return ["*"]
        return [origin.strip() for origin in self.CORS_ORIGIN.split(",") if origin.strip()]

settings = Settings()
