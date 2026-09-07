from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user

from app.models.appareil_notification import AppareilNotification
from app.models.utilisateur import Utilisateur


router = APIRouter(
    prefix="/notifications",
    tags=["Notifications push"],
)


class AppareilNotificationCreate(BaseModel):
    token: str
    plateforme: str = "web"


@router.post("/appareil")
def enregistrer_appareil(
    data: AppareilNotificationCreate,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user),
):
    """
    Enregistre le navigateur/appareil du membre connecté
    pour recevoir les notifications push FCM.
    """

    # ========================================================
    # VÉRIFIER LE MEMBRE
    # ========================================================

    if current_user.membre_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Cet utilisateur n'est associé "
                "à aucun membre."
            ),
        )

    # ========================================================
    # VÉRIFIER LE TOKEN
    # ========================================================

    token = data.token.strip()

    if not token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le token FCM est obligatoire.",
        )

    # ========================================================
    # RECHERCHER SI LE TOKEN EXISTE DÉJÀ
    # ========================================================

    appareil = (
        db.query(AppareilNotification)
        .filter(
            AppareilNotification.token == token
        )
        .first()
    )

    # ========================================================
    # TOKEN DÉJÀ ENREGISTRÉ
    # ========================================================

    if appareil:

        appareil.membre_id = current_user.membre_id
        appareil.plateforme = data.plateforme
        appareil.actif = True

        db.commit()
        db.refresh(appareil)

        return {
            "message": (
                "Appareil déjà enregistré, "
                "informations mises à jour."
            ),
            "id": appareil.id,
        }

    # ========================================================
    # NOUVEL APPAREIL
    # ========================================================

    appareil = AppareilNotification(
        membre_id=current_user.membre_id,
        token=token,
        plateforme=data.plateforme,
        actif=True,
    )

    db.add(appareil)
    db.commit()
    db.refresh(appareil)

    return {
        "message": "Appareil enregistré avec succès.",
        "id": appareil.id,
    }