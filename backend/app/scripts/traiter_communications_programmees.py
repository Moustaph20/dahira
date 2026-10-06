import sys
from datetime import datetime

from pathlib import Path


# ============================================================
# RACINE DU PROJET
# ============================================================

ROOT_DIR = Path(__file__).resolve().parents[2]

if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))


# ============================================================
# IMPORTS
# ============================================================

from app.core.database import SessionLocal
from app.core.firebase import initialiser_firebase

from app.models.communication import Communication

from app.services.notifications_push import (
    envoyer_communication_push,
)


# ============================================================
# CONSTANTES
# ============================================================

STATUT_PROGRAMMEE = "PROGRAMMEE"
STATUT_PUBLIEE = "PUBLIEE"
STATUT_EXPIREE = "EXPIREE"


# ============================================================
# TRAITEMENT DES COMMUNICATIONS
# ============================================================

def traiter_communications_programmees(db):
    """
    Publie automatiquement les communications programmées
    dont la date de publication est arrivée.

    Gère également l'expiration des communications publiées.
    """

    maintenant = datetime.now()

    nombre_programmees = 0
    nombre_publiees = 0
    nombre_push_envoyes = 0
    nombre_push_erreurs = 0
    nombre_expirees = 0

    # --------------------------------------------------------
    # 1. Récupérer les communications programmées arrivées
    # --------------------------------------------------------

    communications_a_publier = (
        db.query(Communication)
        .filter(
            Communication.statut == STATUT_PROGRAMMEE,
            Communication.date_publication <= maintenant,
        )
        .order_by(
            Communication.date_publication.asc(),
            Communication.id.asc(),
        )
        .all()
    )

    nombre_programmees = len(communications_a_publier)

    # --------------------------------------------------------
    # 2. Publier les communications
    # --------------------------------------------------------

    for communication in communications_a_publier:

        try:
            communication.statut = STATUT_PUBLIEE
            communication.actif = True
            communication.push_envoye = False

            db.commit()
            db.refresh(communication)

            nombre_publiees += 1

            print(
                f"Communication #{communication.id} "
                f"publiée : {communication.titre}"
            )

            # ------------------------------------------------
            # Envoi du push Firebase
            # ------------------------------------------------

            try:

                envoyer_communication_push(
                    communication,
                    db,
                )

                communication.push_envoye = True

                db.commit()
                db.refresh(communication)

                nombre_push_envoyes += 1

                print(
                    f"Push envoyé pour la communication "
                    f"#{communication.id}."
                )

            except Exception as error:

                db.rollback()

                nombre_push_erreurs += 1

                print(
                    f"ERREUR PUSH communication "
                    f"#{communication.id} :",
                    error,
                )

        except Exception as error:

            db.rollback()

            print(
                f"ERREUR PUBLICATION communication "
                f"#{communication.id} :",
                error,
            )

    # --------------------------------------------------------
    # 3. Expirer les communications arrivées à échéance
    # --------------------------------------------------------

    communications_a_expirer = (
        db.query(Communication)
        .filter(
            Communication.statut == STATUT_PUBLIEE,
            Communication.date_expiration.isnot(None),
            Communication.date_expiration <= maintenant,
            Communication.actif == True,
        )
        .all()
    )

    for communication in communications_a_expirer:

        try:

            communication.statut = STATUT_EXPIREE
            communication.actif = False

            db.commit()
            db.refresh(communication)

            nombre_expirees += 1

            print(
                f"Communication #{communication.id} "
                f"expirée : {communication.titre}"
            )

        except Exception as error:

            db.rollback()

            print(
                f"ERREUR EXPIRATION communication "
                f"#{communication.id} :",
                error,
            )

    return {
        "maintenant": maintenant,
        "nombre_programmees": nombre_programmees,
        "nombre_publiees": nombre_publiees,
        "nombre_push_envoyes": nombre_push_envoyes,
        "nombre_push_erreurs": nombre_push_erreurs,
        "nombre_expirees": nombre_expirees,
    }


# ============================================================
# PROGRAMME PRINCIPAL
# ============================================================

def main():

    # --------------------------------------------------------
    # Initialisation de Firebase
    # --------------------------------------------------------

    try:

        initialiser_firebase()

        print(
            "Firebase initialisé avec succès."
        )

    except Exception as error:

        print(
            "ERREUR INITIALISATION FIREBASE :",
            error,
        )

        raise

    # --------------------------------------------------------
    # Connexion à la base de données
    # --------------------------------------------------------

    db = SessionLocal()

    try:

        resultat = traiter_communications_programmees(
            db=db,
        )

        print(
            "============================================"
        )

        print(
            "TRAITEMENT DES COMMUNICATIONS PROGRAMMÉES"
        )

        print(
            "============================================"
        )

        print(
            f"Date/heure : "
            f"{resultat['maintenant']}"
        )

        print(
            f"Communications arrivées : "
            f"{resultat['nombre_programmees']}"
        )

        print(
            f"Communications publiées : "
            f"{resultat['nombre_publiees']}"
        )

        print(
            f"Push envoyés : "
            f"{resultat['nombre_push_envoyes']}"
        )

        print(
            f"Erreurs push : "
            f"{resultat['nombre_push_erreurs']}"
        )

        print(
            f"Communications expirées : "
            f"{resultat['nombre_expirees']}"
        )

        print(
            "============================================"
        )

    except Exception as error:

        print(
            "ERREUR TRAITEMENT COMMUNICATIONS :",
            error,
        )

        raise

    finally:

        db.close()


# ============================================================
# POINT D'ENTRÉE
# ============================================================

if __name__ == "__main__":
    main()