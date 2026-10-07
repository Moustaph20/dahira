# app/services/notifications_push.py

from firebase_admin import messaging
from sqlalchemy.orm import Session

from app.models.appareil_notification import AppareilNotification
from app.models.communication import Communication
from app.models.notification import Notification
from app.models.utilisateur import Utilisateur


# ============================================================
# CONFIGURATION
# ============================================================

TAILLE_LOT_FCM = 500


# ============================================================
# CODES FCM CORRESPONDANT À DES TOKENS INVALIDES
# ============================================================

CODES_TOKEN_INVALIDES = {
    "UNREGISTERED",
    "INVALID_ARGUMENT",
    "NOT_FOUND",
}


# ============================================================
# DÉSACTIVER UN TOKEN INVALIDE
# ============================================================

def _desactiver_token_invalide(
    appareil: AppareilNotification,
    exception: Exception,
) -> bool:
    """
    Désactive un appareil lorsque Firebase indique que son
    token FCM n'est plus valide.

    Retourne True si le token a été désactivé.
    """

    try:
        code = getattr(exception, "code", None)

        if code is not None:
            code = str(code).upper()

        if code in CODES_TOKEN_INVALIDES:
            appareil.actif = False
            return True

        message = str(exception).lower()

        mots_cles_invalides = (
            "unregistered",
            "registration token",
            "invalid registration",
            "not found",
            "token is no longer valid",
            "requested entity was not found",
        )

        if any(
            mot in message
            for mot in mots_cles_invalides
        ):
            appareil.actif = False
            return True

    except Exception as erreur:
        print(
            "ERREUR ANALYSE TOKEN FCM :",
            erreur,
        )

    return False


# ============================================================
# ENVOYER UNE COMMUNICATION À TOUS LES APPAREILS
# ============================================================

def envoyer_communication_push(
    communication: Communication,
    db: Session,
) -> dict:
    """
    Envoie une communication à tous les appareils actifs
    enregistrés pour les notifications push.

    Compatible avec :
        - communication texte uniquement
        - communication vocale uniquement
        - communication texte + vocal

    Pour un message vocal seul, le corps de la notification
    devient :

        "Nouveau message vocal disponible."

    Le fichier audio n'est jamais joué automatiquement par
    Firebase. L'URL audio est transmise dans les données FCM
    afin que l'application puisse ouvrir la communication.
    """

    # --------------------------------------------------------
    # RÉCUPÉRER LES APPAREILS ACTIFS
    # --------------------------------------------------------

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

    # --------------------------------------------------------
    # CORPS DE LA NOTIFICATION
    # --------------------------------------------------------

    contenu = (
        communication.contenu.strip()
        if communication.contenu
        else ""
    )

    if contenu:
        corps_notification = contenu
    elif communication.audio_url:
        corps_notification = (
            "Nouveau message vocal disponible."
        )
    else:
        corps_notification = (
            "Nouvelle communication disponible."
        )

    # --------------------------------------------------------
    # DONNÉES FCM
    # --------------------------------------------------------

    donnees = {
        "type": "communication",
        "communication_id": str(
            communication.id
        ),
        "type_communication": str(
            communication.type_communication
            or ""
        ),
        "priorite": str(
            communication.priorite
            or "NORMALE"
        ),
        "has_audio": (
            "true"
            if communication.audio_url
            else "false"
        ),
    }

    # --------------------------------------------------------
    # URL AUDIO
    # --------------------------------------------------------

    if communication.audio_url:
        donnees["audio_url"] = str(
            communication.audio_url
        )

    # --------------------------------------------------------
    # ENVOI PAR LOTS DE 500
    # --------------------------------------------------------

    for debut in range(
        0,
        len(appareils),
        TAILLE_LOT_FCM,
    ):
        lot = appareils[
            debut : debut + TAILLE_LOT_FCM
        ]

        # ----------------------------------------------------
        # IMPORTANT :
        # On garde uniquement les appareils possédant un token.
        #
        # Il faut conserver la même liste pour associer
        # correctement la réponse Firebase à l'appareil.
        # ----------------------------------------------------

        appareils_avec_token = [
            appareil
            for appareil in lot
            if appareil.token
            and appareil.actif
        ]

        tokens = [
            appareil.token
            for appareil in appareils_avec_token
        ]

        if not tokens:
            continue

        # ----------------------------------------------------
        # MESSAGE FIREBASE
        # ----------------------------------------------------

        message = messaging.MulticastMessage(
            notification=messaging.Notification(
                title=communication.titre,
                body=corps_notification,
            ),
            data=donnees,
            tokens=tokens,
        )

        # ----------------------------------------------------
        # ENVOI
        # ----------------------------------------------------

        try:
            reponse = (
                messaging.send_each_for_multicast(
                    message
                )
            )

            total_envoyes += (
                reponse.success_count
            )

            total_echecs += (
                reponse.failure_count
            )

            # ------------------------------------------------
            # TRAITER CHAQUE RÉPONSE
            # ------------------------------------------------

            for index, resultat in enumerate(
                reponse.responses
            ):
                if resultat.success:
                    continue

                # Même index que dans `tokens`
                appareil = (
                    appareils_avec_token[index]
                )

                exception = resultat.exception

                if exception:
                    _desactiver_token_invalide(
                        appareil,
                        exception,
                    )

                    print(
                        "ERREUR PUSH COMMUNICATION :",
                        exception,
                    )

            # ------------------------------------------------
            # SAUVEGARDER LES TOKENS DÉSACTIVÉS
            # ------------------------------------------------

            db.commit()

        except Exception as erreur:
            print(
                "ERREUR ENVOI FCM COMMUNICATION :",
                erreur,
            )

            total_echecs += len(tokens)

            # ------------------------------------------------
            # IMPORTANT :
            # On évite de faire échouer toute la transaction
            # de l'application à cause de Firebase.
            # ------------------------------------------------

            try:
                db.rollback()
            except Exception:
                pass

    # --------------------------------------------------------
    # RÉSULTAT
    # --------------------------------------------------------

    return {
        "envoyes": total_envoyes,
        "echecs": total_echecs,
        "appareils": len(appareils),
    }


# ============================================================
# ENVOYER UNE NOTIFICATION À UN UTILISATEUR
# ============================================================

def envoyer_notification_push(
    notification: Notification,
    db: Session,
) -> dict:
    """
    Envoie une notification à l'utilisateur concerné.

    La relation est :

        Notification.utilisateur_id
                ↓
        Utilisateur.id
                ↓
        Utilisateur.membre_id
                ↓
        AppareilNotification.membre_id
                ↓
        AppareilNotification.token
    """

    # --------------------------------------------------------
    # RÉCUPÉRER L'UTILISATEUR
    # --------------------------------------------------------

    utilisateur = (
        db.query(Utilisateur)
        .filter(
            Utilisateur.id
            == notification.utilisateur_id
        )
        .first()
    )

    if not utilisateur:
        return {
            "envoyes": 0,
            "echecs": 0,
            "appareils": 0,
        }

    # --------------------------------------------------------
    # L'UTILISATEUR DOIT ÊTRE ACTIF
    # --------------------------------------------------------

    if not utilisateur.actif:
        return {
            "envoyes": 0,
            "echecs": 0,
            "appareils": 0,
        }

    # --------------------------------------------------------
    # L'UTILISATEUR DOIT ÊTRE ASSOCIÉ À UN MEMBRE
    # --------------------------------------------------------

    if not utilisateur.membre_id:
        return {
            "envoyes": 0,
            "echecs": 0,
            "appareils": 0,
        }

    # --------------------------------------------------------
    # RÉCUPÉRER LES APPAREILS DU MEMBRE
    # --------------------------------------------------------

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
        }

    # --------------------------------------------------------
    # GARDER LES APPAREILS AVEC TOKEN
    # --------------------------------------------------------

    appareils_avec_token = [
        appareil
        for appareil in appareils
        if appareil.token
        and appareil.actif
    ]

    tokens = [
        appareil.token
        for appareil in appareils_avec_token
    ]

    if not tokens:
        return {
            "envoyes": 0,
            "echecs": 0,
            "appareils": len(appareils),
        }

    # --------------------------------------------------------
    # CONTENU
    # --------------------------------------------------------

    titre = (
        str(notification.titre)
        if notification.titre
        else "Dahira"
    )

    contenu = (
        str(notification.contenu)
        if notification.contenu
        else "Vous avez une nouvelle notification."
    )

    # --------------------------------------------------------
    # TYPE
    # --------------------------------------------------------

    type_notification = getattr(
        notification,
        "type_notification",
        None,
    )

    if not type_notification:
        type_notification = "NOTIFICATION"

    # --------------------------------------------------------
    # PRIORITÉ
    # --------------------------------------------------------

    priorite = getattr(
        notification,
        "priorite",
        None,
    )

    if not priorite:
        priorite = "NORMALE"

    # --------------------------------------------------------
    # DONNÉES FCM
    # --------------------------------------------------------

    donnees = {
        "type": "notification",
        "notification_id": str(
            notification.id
        ),
        "type_notification": str(
            type_notification
        ),
        "priorite": str(
            priorite
        ),
    }

    # --------------------------------------------------------
    # MESSAGE FIREBASE
    # --------------------------------------------------------

    message = messaging.MulticastMessage(
        notification=messaging.Notification(
            title=titre,
            body=contenu,
        ),
        data=donnees,
        tokens=tokens,
    )

    # --------------------------------------------------------
    # ENVOI
    # --------------------------------------------------------

    try:
        reponse = (
            messaging.send_each_for_multicast(
                message
            )
        )

        total_envoyes = (
            reponse.success_count
        )

        total_echecs = (
            reponse.failure_count
        )

        # ----------------------------------------------------
        # TRAITER LES TOKENS INVALIDES
        # ----------------------------------------------------

        for index, resultat in enumerate(
            reponse.responses
        ):
            if resultat.success:
                continue

            appareil = (
                appareils_avec_token[index]
            )

            exception = resultat.exception

            if exception:
                _desactiver_token_invalide(
                    appareil,
                    exception,
                )

                print(
                    "ERREUR PUSH NOTIFICATION :",
                    exception,
                )

        # ----------------------------------------------------
        # SAUVEGARDER LES MODIFICATIONS
        # ----------------------------------------------------

        db.commit()

        return {
            "envoyes": total_envoyes,
            "echecs": total_echecs,
            "appareils": len(appareils),
        }

    except Exception as erreur:
        print(
            "ERREUR ENVOI FCM NOTIFICATION :",
            erreur,
        )

        try:
            db.rollback()
        except Exception:
            pass

        return {
            "envoyes": 0,
            "echecs": len(tokens),
            "appareils": len(appareils),
        }