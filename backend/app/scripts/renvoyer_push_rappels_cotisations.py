
import argparse
import sys
from datetime import date
from pathlib import Path

from sqlalchemy import func


# ============================================================
# RACINE DU PROJET
# ============================================================

ROOT_DIR = Path(__file__).resolve().parents[2]

if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))


# ============================================================
# IMPORTS DU PROJET
# ============================================================

from app.core.database import SessionLocal
from app.core.firebase import initialiser_firebase
from app.models.notification import Notification
from app.services.notifications_push import (
    envoyer_notification_push,
)


# ============================================================
# CONFIGURATION DE LA REPRISE
# ============================================================

DATE_CIBLE = date(2026, 10, 18)

TYPE_RAPPEL = "COTISATION_RAPPEL"

MARQUEUR_RAPPEL = "[RAPPEL_COTISATION:"

MARQUEUR_JOUR = ":18]"


# ============================================================
# RECHERCHER LES RAPPELS EXISTANTS
# ============================================================

def recuperer_rappels_existants(db):
    """
    Récupère uniquement les notifications de rappel de
    cotisation créées le 18 octobre 2026 et portant le
    marqueur du rappel exceptionnel du jour 18.

    Aucune notification n'est créée ou modifiée ici.
    """

    rappels = (
        db.query(Notification)
        .filter(
            Notification.type == TYPE_RAPPEL,
            Notification.message.contains(
                MARQUEUR_RAPPEL
            ),
            Notification.message.contains(
                MARQUEUR_JOUR
            ),
            func.date(Notification.created_at)
            == DATE_CIBLE,
        )
        .order_by(Notification.id.asc())
        .all()
    )

    return rappels


# ============================================================
# PROGRAMME PRINCIPAL
# ============================================================

def main():
    parser = argparse.ArgumentParser(
        description=(
            "Réessayer l'envoi push des rappels "
            "de cotisation déjà enregistrés."
        )
    )

    parser.add_argument(
        "--envoyer",
        action="store_true",
        help=(
            "Envoie réellement les notifications "
            "après confirmation de la liste ciblée."
        ),
    )

    args = parser.parse_args()

    db = SessionLocal()

    try:
        # ----------------------------------------------------
        # RÉCUPÉRER LES NOTIFICATIONS EXISTANTES
        # ----------------------------------------------------

        rappels = recuperer_rappels_existants(db)

        print("=" * 55)
        print("REPRISE DES PUSH DE COTISATION")
        print("=" * 55)
        print(f"Date ciblée : {DATE_CIBLE}")
        print(f"Notifications trouvées : {len(rappels)}")
        print("Aucune nouvelle notification ne sera créée.")
        print("=" * 55)

        if not rappels:
            print(
                "Aucune notification ne correspond aux "
                "critères. Aucun envoi effectué."
            )
            return

        if args.envoyer and len(rappels) != 34:
            raise RuntimeError(
                f"Reprise annulée : 34 notifications étaient "
                f"attendues, mais {len(rappels)} ont été trouvées. "
                "Aucun envoi effectué."
            )

        # ----------------------------------------------------
        # AFFICHER LA LISTE AVANT TOUT ENVOI
        # ----------------------------------------------------

        for notification in rappels:
            print(
                f"ID={notification.id} | "
                f"Utilisateur={notification.utilisateur_id} | "
                f"Titre={notification.titre}"
            )

        # ----------------------------------------------------
        # MODE SANS ENVOI PAR DÉFAUT
        # ----------------------------------------------------

        if not args.envoyer:
            print("-" * 55)
            print("MODE SIMULATION : aucun push envoyé.")
            print(
                "Vérifie la liste, puis utilise --envoyer "
                "pour lancer l'envoi réel."
            )
            return

        # ----------------------------------------------------
        # INITIALISER FIREBASE
        # ----------------------------------------------------

        initialiser_firebase()

        print("Firebase initialisé avec succès.")

        # ----------------------------------------------------
        # ENVOYER LES NOTIFICATIONS EXISTANTES
        # ----------------------------------------------------

        total_notifications = 0
        total_appareils_envoyes = 0
        total_echecs = 0
        total_appareils = 0
        sans_appareil = 0

        for notification in rappels:
            print(
                f"\nEnvoi de la notification "
                f"{notification.id}..."
            )

            resultat = envoyer_notification_push(
                notification=notification,
                db=db,
            )

            envoyes = resultat.get("envoyes", 0)
            echecs = resultat.get("echecs", 0)
            appareils = resultat.get("appareils", 0)

            total_notifications += 1
            total_appareils_envoyes += envoyes
            total_echecs += echecs
            total_appareils += appareils

            if appareils == 0:
                sans_appareil += 1

            print(
                f"Résultat : envoyés={envoyes}, "
                f"échecs={echecs}, "
                f"appareils={appareils}"
            )

        # ----------------------------------------------------
        # BILAN FINAL
        # ----------------------------------------------------

        print("\n" + "=" * 55)
        print("BILAN DE LA REPRISE DES PUSH")
        print("=" * 55)
        print(
            f"Notifications traitées : "
            f"{total_notifications}"
        )
        print(
            f"Envois acceptés par Firebase : "
            f"{total_appareils_envoyes}"
        )
        print(
            f"Échecs signalés par Firebase : "
            f"{total_echecs}"
        )
        print(
            f"Appareils sans token actif : "
            f"{sans_appareil}"
        )
        print("=" * 55)

        print(
            "Attention : un envoi accepté par Firebase "
            "ne garantit pas que le téléphone a affiché "
            "la notification."
        )

    except Exception as erreur:
        print(
            "ERREUR REPRISE PUSH COTISATIONS :",
            erreur,
        )
        raise

    finally:
        db.close()


# ============================================================
# POINT D'ENTRÉE
# ============================================================

if __name__ == "__main__":
    main()
