from datetime import datetime

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.permissions import require_permission

from app.models.notification import Notification
from app.models.utilisateur import Utilisateur

from app.schemas.notification import (
    NotificationCreate,
    NotificationResponse,
    NotificationCountResponse,
)


router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"],
)


# ============================================================
# LISTE DES NOTIFICATIONS
# ============================================================

@router.get(
    "",
    response_model=list[NotificationResponse],
)
def get_notifications(
    current_user: Utilisateur = Depends(
        require_permission("NOTIFICATION_CONSULTER")
    ),
    db: Session = Depends(get_db),
):
    """
    Retourne les notifications de l'utilisateur connecté.
    """

    notifications = (
        db.query(Notification)
        .filter(
            Notification.utilisateur_id
            == current_user.id
        )
        .order_by(
            Notification.created_at.desc()
        )
        .all()
    )

    return notifications


# ============================================================
# NOTIFICATIONS NON LUES
# ============================================================

@router.get(
    "/non-lues",
    response_model=list[NotificationResponse],
)
def get_notifications_non_lues(
    current_user: Utilisateur = Depends(
        require_permission("NOTIFICATION_CONSULTER")
    ),
    db: Session = Depends(get_db),
):
    """
    Retourne uniquement les notifications non lues.
    """

    notifications = (
        db.query(Notification)
        .filter(
            Notification.utilisateur_id
            == current_user.id,
            Notification.lu.is_(False),
        )
        .order_by(
            Notification.created_at.desc()
        )
        .all()
    )

    return notifications


# ============================================================
# COMPTEUR
# ============================================================

@router.get(
    "/compteur",
    response_model=NotificationCountResponse,
)
def get_compteur_notifications(
    current_user: Utilisateur = Depends(
        require_permission("NOTIFICATION_CONSULTER")
    ),
    db: Session = Depends(get_db),
):
    """
    Retourne le nombre total et le nombre de notifications
    non lues de l'utilisateur connecté.
    """

    total = (
        db.query(Notification)
        .filter(
            Notification.utilisateur_id
            == current_user.id
        )
        .count()
    )

    non_lues = (
        db.query(Notification)
        .filter(
            Notification.utilisateur_id
            == current_user.id,
            Notification.lu.is_(False),
        )
        .count()
    )

    return {
        "total": total,
        "non_lues": non_lues,
    }


# ============================================================
# UNE NOTIFICATION
# ============================================================

@router.get(
    "/{notification_id}",
    response_model=NotificationResponse,
)
def get_notification(
    notification_id: int,
    current_user: Utilisateur = Depends(
        require_permission("NOTIFICATION_CONSULTER")
    ),
    db: Session = Depends(get_db),
):
    """
    Retourne une notification appartenant à l'utilisateur connecté.
    """

    notification = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.utilisateur_id
            == current_user.id,
        )
        .first()
    )

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification introuvable.",
        )

    return notification


# ============================================================
# MARQUER UNE NOTIFICATION COMME LUE
# ============================================================

@router.patch(
    "/{notification_id}/lue",
    response_model=NotificationResponse,
)
def marquer_notification_lue(
    notification_id: int,
    current_user: Utilisateur = Depends(
        require_permission("NOTIFICATION_CONSULTER")
    ),
    db: Session = Depends(get_db),
):
    """
    Marque une notification de l'utilisateur comme lue.
    """

    notification = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.utilisateur_id
            == current_user.id,
        )
        .first()
    )

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification introuvable.",
        )

    if not notification.lu:
        notification.lu = True
        notification.date_lecture = datetime.utcnow()

        db.commit()
        db.refresh(notification)

    return notification


# ============================================================
# MARQUER TOUTES LES NOTIFICATIONS COMME LUES
# ============================================================

@router.patch(
    "/toutes-lues",
)
def marquer_toutes_notifications_lues(
    current_user: Utilisateur = Depends(
        require_permission("NOTIFICATION_CONSULTER")
    ),
    db: Session = Depends(get_db),
):
    """
    Marque toutes les notifications non lues
    de l'utilisateur connecté comme lues.
    """

    notifications = (
        db.query(Notification)
        .filter(
            Notification.utilisateur_id
            == current_user.id,
            Notification.lu.is_(False),
        )
        .all()
    )

    maintenant = datetime.utcnow()

    for notification in notifications:
        notification.lu = True
        notification.date_lecture = maintenant

    db.commit()

    return {
        "message": "Toutes les notifications ont été marquées comme lues.",
        "nombre": len(notifications),
    }


# ============================================================
# CRÉER UNE NOTIFICATION
# ============================================================

@router.post(
    "",
    response_model=NotificationResponse,
    status_code=status.HTTP_201_CREATED,
)
def creer_notification(
    data: NotificationCreate,
    current_user: Utilisateur = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    """
    Crée une notification.

    Cette route est volontairement séparée de la permission
    NOTIFICATION_CONSULTER.

    Elle pourra être sécurisée plus tard avec une permission
    spécifique, par exemple NOTIFICATION_CREER.
    """

    utilisateur = (
        db.query(Utilisateur)
        .filter(
            Utilisateur.id == data.utilisateur_id,
            Utilisateur.actif.is_(True),
        )
        .first()
    )

    if not utilisateur:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur destinataire introuvable.",
        )

    notification = Notification(
        utilisateur_id=data.utilisateur_id,
        titre=data.titre,
        message=data.message,
        type=data.type,
        route=data.route,
        lu=False,
    )

    db.add(notification)
    db.commit()
    db.refresh(notification)

    return notification


# ============================================================
# SUPPRIMER UNE NOTIFICATION
# ============================================================

@router.delete(
    "/{notification_id}",
)
def supprimer_notification(
    notification_id: int,
    current_user: Utilisateur = Depends(
        require_permission("NOTIFICATION_CONSULTER")
    ),
    db: Session = Depends(get_db),
):
    """
    Supprime une notification appartenant à l'utilisateur connecté.
    """

    notification = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.utilisateur_id
            == current_user.id,
        )
        .first()
    )

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification introuvable.",
        )

    db.delete(notification)
    db.commit()

    return {
        "message": "Notification supprimée avec succès."
    }