import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


def _bool(name, default):
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-insecure-change-me")
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL", f"sqlite:///{(BASE_DIR / 'instance' / 'sovereign.db').as_posix()}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JSON_SORT_KEYS = False

    CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",") if o.strip()]

    # Create tables and load seeds/catalogue.json when the database is empty.
    SEED_ON_START = _bool("SEED_ON_START", True)

    # Lightning
    LIGHTNING_PROVIDER = os.getenv("LIGHTNING_PROVIDER", "mock")
    INVOICE_TTL_SECONDS = int(os.getenv("INVOICE_TTL_SECONDS", "600"))

    # Demo mode enables the payment simulator and the reader lock/unlock toggle,
    # and accepts unsigned "simulated" events — but only for DEMO_PUBKEY.
    DEMO_MODE = _bool("DEMO_MODE", True)
    DEMO_PUBKEY = os.getenv("DEMO_PUBKEY", "a7c19e4f3b2d8e6015f9c4a7b3e2d1f08c6a5b4e3d2c1f0e9d8c7b6a5f4e3d2c")
    DEMO_NPUB = os.getenv("DEMO_NPUB", "npub17x8qmw3vfz0r5n4t2l6h9e8ycjdk5a3sgu7p4wxe2hqz6m9tlv0rfuak9p")

    # NIP-98 auth events older (or newer) than this are rejected to limit replay.
    AUTH_MAX_AGE_SECONDS = int(os.getenv("AUTH_MAX_AGE_SECONDS", "120"))


class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    SEED_ON_START = False
