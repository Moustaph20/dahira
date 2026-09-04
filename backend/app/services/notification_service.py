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
    Crée une notification pour un utilisateur.

    Cette fonction ne fait pas de commit.
    Le commit est laissé au router/service appelant afin
    de pouvoir intégrer la notification dans la même
    transaction que l'action principale.
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
    Crée la même notification pour plusieurs utilisateurs.
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
    