import sys
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[2]

if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))


from app.core.database import SessionLocal
from app.services.rappel_cotisation_service import (
    envoyer_rappels_cotisations,
)


def main():
    db = SessionLocal()

    try:
        resultat = envoyer_rappels_cotisations(
            db=db,
        )

        print("============================================")
        print("RAPPELS AUTOMATIQUES DE COTISATION")
        print("============================================")

        print(
            f"Jour : {resultat['jour']}"
        )

        print(
            f"Mois : {resultat['mois']} "
            f"{resultat['annee']}"
        )

        if not resultat["jour_rappel"]:
            print(
                "Aujourd'hui n'est pas un jour "
                "de rappel."
            )
        else:
            print(
                f"Cotisations analysées : "
                f"{resultat['nombre_cotisations']}"
            )

            print(
                f"Rappels créés : "
                f"{resultat['nombre_rappels_crees']}"
            )

            print(
                f"Rappels déjà envoyés : "
                f"{resultat['nombre_deja_envoyes']}"
            )

            print(
                f"Cotisations soldées : "
                f"{resultat['nombre_soldes']}"
            )

            print(
                f"Sans compte utilisateur : "
                f"{resultat['nombre_sans_utilisateur']}"
            )

        print("============================================")

    except Exception as error:
        print(
            "ERREUR RAPPELS COTISATIONS :",
            error,
        )
        raise

    finally:
        db.close()


if __name__ == "__main__":
    main()