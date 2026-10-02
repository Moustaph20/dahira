from sqlalchemy.orm import Session

from app.models.notification import Notification


def creer_notification(
    db: Session,
    utilisateur_id: int,
    titre: str,
    message: str,
    type: str = "INFO",
    route: str | None = None,
):
    """
    Crée une notification personnelle pour un utilisateur.

    IMPORTANT :
    - Cette fonction ne fait volontairement aucun commit.
    - Le commit reste sous la responsabilité du service/router
      qui effectue l'action principale.
    - Le push Firebase n'est pas envoyé ici afin de ne pas
      mélanger la création en base et l'envoi externe.
    """

    notification = Notification(
        utilisateur_id=utilisateur_id,
        titre=titre,
        message=message,
        type=type,
        route=route,
        lu=False,
    )

    db.add(notification)

    return notification


def creer_notifications_utilisateurs(
    db: Session,
    utilisateur_ids: list[int],
    titre: str,
    message: str,
    type: str = "INFO",
    route: str | None = None,
):
    """
    Crée la même notification personnelle pour plusieurs utilisateurs.

    Cette fonction ne fait aucun commit et n'envoie pas directement
    de push Firebase.

    Elle est principalement destinée aux notifications automatiques
    internes lorsqu'une même notification doit être créée pour
    plusieurs utilisateurs distincts.
    """

    notifications = []

    for utilisateur_id in set(utilisateur_ids):
        if not utilisateur_id:
            continue

        notification = creer_notification(
            db=db,
            utilisateur_id=utilisateur_id,
            titre=titre,
            message=message,
            type=type,
            route=route,
        )

        notifications.append(notification)

    return notifications