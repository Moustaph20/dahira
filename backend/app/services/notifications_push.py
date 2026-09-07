# app/services/notifications_push.py

from firebase_admin import messaging
from sqlalchemy.orm import Session

from app.models.appareil_notification import AppareilNotification
from app.models.communication import Communication


TAILLE_LOT_FCM = 500


def envoyer_communication_push(
    communication: Communication,
    db: Session,
) -> dict:
    """
    Envoie une communication à tous les appareils actifs
    enregistrés pour les membres.

    Les appareils sont envoyés par lots de 500 maximum,
    conformément aux limites FCM.
    """

    appareils = (
        db.query(AppareilNotification)
        .filter(
            AppareilNotification.actif.is_(True)
        )
        .all()
    )

    if not appareils:
        return {
            "envoyes": 0,
            "echecs": 0,
            "appareils": 0,
        }

    total_envoyes = 0
    total_echecs = 0

    for debut in range(0, len(appareils), TAILLE_LOT_FCM):
        lot = appareils[
            debut : debut + TAILLE_LOT_FCM
        ]

        tokens = [
            appareil.token
            for appareil in lot
            if appareil.token
        ]

        if not tokens:
            continue

        message = messaging.MulticastMessage(
            notification=messaging.Notification(
                title=communication.titre,
                body=communication.contenu,
            ),
            data={
                "type": "communication",
                "communication_id": str(
                    communication.id
                ),
                "type_communication": (
                    communication.type_communication
                ),
                "priorite": communication.priorite,
            },
            tokens=tokens,
        )

        try:
            reponse = (
                messaging.send_each_for_multicast(
                    message
                )
            )

            total_envoyes += reponse.success_count
            total_echecs += reponse.failure_count

            # ------------------------------------------------
            # Désactivation des tokens invalides
            # ------------------------------------------------

            for index, resultat in enumerate(
                reponse.responses
            ):
                if resultat.success:
                    continue

                appareil = lot[index]

                erreur = resultat.exception

                code_erreur = getattr(
                    erreur,
                    "code",
                    "",
                )

                if code_erreur in {
                    "messaging/registration-token-not-registered",
                    "messaging/invalid-registration-token",
                }:
                    appareil.actif = False

            db.commit()

        except Exception as erreur:
            print(
                "ERREUR ENVOI FCM :",
                erreur,
            )

            total_echecs += len(tokens)

    return {
        "envoyes": total_envoyes,
        "echecs": total_echecs,
        "appareils": len(appareils),
    }