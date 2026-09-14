from sqlalchemy import text
from app.core.database import engine


def appliquer_migrations():
    migrations = [
        """
        ALTER TABLE khassidas
        ADD COLUMN IF NOT EXISTS pdf_url TEXT;
        """,

        """
        INSERT INTO khassida_tons (khassida_id, ton_id)
        SELECT k.id, t.id
        FROM khassidas k
        CROSS JOIN tons t
        WHERE k.actif = TRUE
          AND t.actif = TRUE
          AND NOT EXISTS (
              SELECT 1
              FROM khassida_tons kt
              WHERE kt.khassida_id = k.id
                AND kt.ton_id = t.id
          );
        """,
    ]

    with engine.begin() as connection:
        for migration in migrations:
            connection.execute(text(migration))