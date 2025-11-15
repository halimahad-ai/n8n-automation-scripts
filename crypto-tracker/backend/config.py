"""Configuration management for the crypto tracker application."""
from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List, Union


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Database
    database_url: str = "sqlite:///./crypto_tracker.db"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # API Keys
    coingecko_api_key: str = ""
    binance_api_key: str = ""
    binance_api_secret: str = ""
    coinmarketcap_api_key: str = ""

    # Application
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    debug: bool = True

    # Data Fetching
    fetch_interval_seconds: int = 300
    top_coins_count: int = 50

    # CORS
    cors_origins: Union[List[str], str] = "http://localhost:3000,http://localhost:5173"

    @field_validator('cors_origins', mode='before')
    @classmethod
    def parse_cors_origins(cls, v):
        """Parse CORS origins from string or list."""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(',')]
        return v

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
