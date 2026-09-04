from sqlalchemy import text
from app.core.database import engine

try:
    with engine.connect() as connection:
        result = connection.execute(text("SELECT version();"))
        print("Connexion PostgreSQL réussie !")
        print(result.scalar())

except Exception as e:
    print("Erreur de connexion PostgreSQL :")
    print(e)