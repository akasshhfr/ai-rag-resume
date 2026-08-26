from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from app.config import settings


def _clean_db_url(url: str) -> str:
    """
    Remove unsupported params from the Neon connection string.
    SQLAlchemy / psycopg2 don't understand 'channel_binding' — strip it.
    """
    from urllib.parse import urlparse, urlencode, parse_qs, urlunparse
    parsed = urlparse(url)
    params = parse_qs(parsed.query, keep_blank_values=True)
    params.pop("channel_binding", None)          # not supported by psycopg2
    new_query = urlencode({k: v[0] for k, v in params.items()})
    clean = urlunparse(parsed._replace(query=new_query))
    # SQLAlchemy needs postgresql+psycopg2:// scheme
    return clean.replace("postgresql://", "postgresql+psycopg2://", 1)


_db_url = _clean_db_url(settings.database_url)

engine = create_engine(
    _db_url,
    pool_pre_ping=True,          # reconnect after idle timeout (important for Neon)
    pool_recycle=300,            # recycle connections every 5 min
    connect_args={"sslmode": "require"},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
