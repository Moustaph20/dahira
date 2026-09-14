from sqlalchemy import text

from app.core.database import engine


def appliquer_migrations():
    """
    Applique les petites migrations SQL nécessaires
    sans dépendre de l'accès au shell Render.

    Toutes les opérations sont idempotentes.
    """

    migrations = [
        """
        ALTER TABLE khassidas
        ADD COLUMN IF NOT EXISTS pdf_url TEXT;
        """,
    ]

    with engine.begin() as connection:
        for migration in migrations:
            connection.execute(text(migration))