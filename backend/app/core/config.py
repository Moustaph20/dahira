
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):

    # ==========================================================
    # BASE DE DONNÉES
    # ==========================================================

    database_url: str

    # ==========================================================
    # AUTHENTIFICATION JWT
    # ==========================================================

    secret_key: str

    algorithm: str = "HS256"

    access_token_expire_minutes: int = 60

    # ==========================================================
    # CORS
    # ==========================================================

    cors_origins: str = (
        "http://localhost:5173,"
        "http://127.0.0.1:5173"
    )

    # ==========================================================
    # CONFIGURATION PYDANTIC
    # ==========================================================

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ==========================================================
    # UTILITAIRE CORS
    # ==========================================================

    @property
    def cors_origins_list(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.cors_origins.split(",")
            if origin.strip()
        ]


settings = Settings()
