import sys
from pathlib import Path


# Permet au script de trouver le package "app"
# lorsqu'il est lancé directement.
ROOT_DIR = Path(__file__).resolve().parents[2]

if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))


from app.core.database import SessionLocal
from app.services.cotisation_service import (
    generer_cotisations_mensuelles,
)


def main():
    db = SessionLocal()

    try:

        resultat = generer_cotisations_mensuelles(
            db=db,
        )

        print(
            "============================================"
        )
        print(
            "GÉNÉRATION DES COTISATIONS MENSUELLES"
        )
        print(
            "============================================"
        )

        print(
            f"Mois : "
            f"{resultat['mois']} "
            f"{resultat['annee']}"
        )

        print(
            f"Membres actifs : "
            f"{resultat['total_membres_actifs']}"
        )

        print(
            f"Cotisations créées : "
            f"{resultat['nombre_creees']}"
        )

        print(
            f"Déjà existantes : "
            f"{resultat['nombre_existantes']}"
        )

        print(
            f"Cotisations à 0 FCFA : "
            f"{resultat['nombre_cotisations_zero']}"
        )

        print(
            "============================================"
        )

    except Exception as error:

        print(
            "ERREUR GÉNÉRATION COTISATIONS :",
            error,
        )

        raise

    finally:

        db.close()


if __name__ == "__main__":
    main()