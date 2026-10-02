from firebase_admin import messaging
from sqlalchemy.orm import Session

from app.models.appareil_notification import AppareilNotification
from app.models.communication import Communication
from app.models.notification import Notification
from app.models.utilisateur import Utilisateur


TAILLE_LOT_FCM = 500


CODES_TOKENS_INVALIDES = {
    "messaging/registration-token-not-registered",
    "messaging/invalid-registration-token",
}


def _desactiver_token_invalide(
    appareil: AppareilNotification,
    erreur,
) -> None:
    """
    Désactive un appareil lorsque Firebase indique que son token
    n'est plus valide.
    """

    code_erreur = getattr(
        erreur,
        "code",
        "",
    )

    if code_erreur in CODES_TOKENS_INVALIDES:
        appareil.actif = False


def envoyer_communication_push(
    communication: Communication,
    db: Session,
) -> dict:
    """
    Envoie une communication à tous les appareils actifs
    enregistrés pour les membres.

    Les appareils sont envoyés par lots de 500 maximum.

    Cette fonction est destinée aux communications collectives.
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

    for debut in range(
        0,
        len(appareils),
        TAILLE_LOT_FCM,
    ):
        lot = appareils[
            debut : debut + TAILLE_LOT_FCM
        ]

        tokens = [
            appareil.token
            for appareil in lot
            if appareil.token
            and appareil.actif
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

            for index, resultat in enumerate(
                reponse.responses
            ):
                if resultat.success:
                    continue

                appareil = lot[index]

                _desactiver_token_invalide(
                    appareil,
                    resultat.exception,
                )

            db.commit()

        except Exception as erreur:
            print(
                "ERREUR ENVOI FCM COMMUNICATION :",
                erreur,
            )

            total_echecs += len(tokens)

    return {
        "envoyes": total_envoyes,
        "echecs": total_echecs,
        "appareils": len(appareils),
    }


def envoyer_notification_push(
    notification: Notification,
    db: Session,
) -> dict:
    """
    Envoie une notification personnelle au membre associé
    à l'utilisateur destinataire.

    La notification est envoyée à tous les appareils actifs
    appartenant à ce membre.

    Exemple :

        Notification
            utilisateur_id = 15
                    ↓
        Utilisateur.membre_id
                    ↓
        AppareilNotification
                    ↓
        📱 téléphone / navigateur du membre
    """

    utilisateur = (
        db.query(Utilisateur)
        .filter(
            Utilisateur.id == notification.utilisateur_id,
            Utilisateur.actif.is_(True),
        )
        .first()
    )

    if not utilisateur:
        return {
            "envoyes": 0,
            "echecs": 0,
            "appareils": 0,
            "message": "Utilisateur destinataire introuvable ou inactif.",
        }

    if not utilisateur.membre_id:
        return {
            "envoyes": 0,
            "echecs": 0,
            "appareils": 0,
            "message": "Aucun membre associé à cet utilisateur.",
        }

    appareils = (
        db.query(AppareilNotification)
        .filter(
            AppareilNotification.membre_id
            == utilisateur.membre_id,
            AppareilNotification.actif.is_(True),
        )
        .all()
    )

    if not appareils:
        return {
            "envoyes": 0,
            "echecs": 0,
            "appareils": 0,
            "message": "Aucun appareil actif pour ce membre.",
        }

    total_envoyes = 0
    total_echecs = 0

    for debut in range(
        0,
        len(appareils),
        TAILLE_LOT_FCM,
    ):
        lot = appareils[
            debut : debut + TAILLE_LOT_FCM
        ]

        tokens = [
            appareil.token
            for appareil in lot
            if appareil.token
            and appareil.actif
        ]

        if not tokens:
            continue

        message = messaging.MulticastMessage(
            notification=messaging.Notification(
                title=notification.titre,
                body=notification.message,
            ),
            data={
                "type": "notification",
                "notification_id": str(
                    notification.id
                ),
                "notification_type": notification.type,
                "route": notification.route or "",
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

            for index, resultat in enumerate(
                reponse.responses
            ):
                if resultat.success:
                    continue

                appareil = lot[index]

                _desactiver_token_invalide(
                    appareil,
                    resultat.exception,
                )

            db.commit()

        except Exception as erreur:
            print(
                "ERREUR ENVOI FCM NOTIFICATION :",
                erreur,
            )

            total_echecs += len(tokens)

    return {
        "envoyes": total_envoyes,
        "echecs": total_echecs,
        "appareils": len(appareils),
    }