from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    PROJECT_NAME: str = "CertifiedRefurbs KE API"
    API_V1_PREFIX: str = "/api/v1"
    ENVIRONMENT: str = "development"

    # Database — PostgreSQL in Docker/production, SQLite for quick local runs.
    DATABASE_URL: str = "sqlite:///./certifiedrefurbs.db"
    SEED_ON_STARTUP: bool = True

    # Auth
    SECRET_KEY: str = "dev-only-secret-change-me-in-production-please"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7
    ADMIN_EMAIL: str = "admin@certifiedrefurbs.co.ke"
    ADMIN_PASSWORD: str = "admin12345"

    # CORS — comma separated list of allowed origins
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    # M-Pesa Daraja. MPESA_ENV: "simulate" (no network), "sandbox" or "production".
    MPESA_ENV: str = "simulate"
    MPESA_CONSUMER_KEY: str = ""
    MPESA_CONSUMER_SECRET: str = ""
    MPESA_SHORTCODE: str = "174379"
    MPESA_PASSKEY: str = ""
    MPESA_CALLBACK_URL: str = "https://example.com/api/v1/payments/mpesa/callback"

    # Import / pricing
    USD_TO_KES: float = 129.0
    FREE_DELIVERY_THRESHOLD: int = 5000
    NAIROBI_DELIVERY_FEE: int = 300
    COUNTRYWIDE_DELIVERY_FEE: int = 600

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
