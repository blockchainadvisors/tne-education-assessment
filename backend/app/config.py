from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Application
    app_name: str = "TNE Assessment Platform"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"

    # Database
    database_url: str = "postgresql+asyncpg://tne:tne_secret@localhost:5432/tne_assessment"
    database_echo: bool = False

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # JWT
    jwt_algorithm: str = "HS256"
    jwt_secret_key: str = "change-me-in-production-use-openssl-rand-hex-32"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7

    # S3 / MinIO
    s3_endpoint_url: str = "http://localhost:9000"
    s3_access_key: str = "minioadmin"
    s3_secret_key: str = "minioadmin"
    s3_bucket_name: str = "tne-uploads"
    s3_region: str = "us-east-1"

    # Anthropic
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-sonnet-4-20250514"
    anthropic_max_retries: int = 3

    # Celery
    celery_broker_url: str = "redis://localhost:6379/1"
    celery_result_backend: str = "redis://localhost:6379/2"

    # SMTP / Email
    smtp_host: str = "localhost"
    smtp_port: int = 1025
    smtp_use_tls: bool = False
    smtp_from_email: str = "noreply@tne-assessment.local"
    smtp_from_name: str = "TNE Assessment Platform"
    frontend_url: str = "http://localhost:3000"

    # Token expiry
    email_verify_token_expire_hours: int = 24
    magic_link_token_expire_minutes: int = 15

    # CORS
    cors_origins: list[str] = ["http://localhost:3000", "https://tne.badev.tools", "https://tne-api.badev.tools"]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
