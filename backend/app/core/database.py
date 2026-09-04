from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import settings


# ============================================================
# MOTEUR SQLALCHEMY
# ============================================================

engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
)


# ============================================================
# SESSION
# ============================================================

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


# ============================================================
# BASE DES MODÈLES
# ============================================================

Base = declarative_base()


# ============================================================
# DÉPENDANCE DATABASE
# ============================================================

def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()