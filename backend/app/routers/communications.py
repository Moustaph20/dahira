
# app/routers/communications.py

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import require_permission
from app.models.communication import Communication
from app.schemas.communication import (
    CommunicationCreate,
    CommunicationResponse,
    CommunicationStatutUpdate,
    CommunicationUpdate,
)


router = APIRouter(
    prefix="/communications",
    tags=["Communications"],
)


# ============================================================
# UTILITAIRE
# ============================================================

def verifier_communication_existante(
    communication_id: int,
    db: Session,
) -> Communication:
    communication = (
        db.query(Communication)
        .filter(Communication.id == communication_id)
        .first()
    )

    if not communication:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Communication introuvable.",
        )

    return communication


# ============================================================
# CONSULTER LES COMMUNICATIONS
# ============================================================

@router.get(
    "",
    response_model=list[CommunicationResponse],
)
def lister_communications(
    actif: bool | None = Query(
        default=None,
        description="Filtrer selon le statut actif/inactif.",
    ),
    type_communication: str | None = Query(
        default=None,
        description="Filtrer par type de communication.",
    ),
    priorite: str | None = Query(
        default=None,
        description="Filtrer par priorité.",
    ),
    db: Session = Depends(get_db),
    utilisateur=Depends(
        require_permission("COMMUNICATION_CONSULTER")
    ),
):
    """
    Retourne la liste des communications.

    Permission :
    COMMUNICATION_CONSULTER
    """

    query = db.query(Communication)

    # --------------------------------------------------------
    # Filtre actif / inactif
    # --------------------------------------------------------

    if actif is not None:
        query = query.filter(
            Communication.actif == actif
        )

    # --------------------------------------------------------
    # Filtre type
    # --------------------------------------------------------

    if type_communication:
        query = query.filter(
            Communication.type_communication
            == type_communication.strip().upper()
        )

    # --------------------------------------------------------
    # Filtre priorité
    # --------------------------------------------------------

    if priorite:
        query = query.filter(
            Communication.priorite
            == priorite.strip().upper()
        )

    # --------------------------------------------------------
    # Tri
    # Plus récente en premier
    # --------------------------------------------------------

    communications = (
        query
        .order_by(
            Communication.date_publication.desc(),
            Communication.id.desc(),
        )
        .all()
    )

    return communications


# ============================================================
# CONSULTER UNE COMMUNICATION
# ============================================================

@router.get(
    "/{communication_id}",
    response_model=CommunicationResponse,
)
def obtenir_communication(
    communication_id: int,
    db: Session = Depends(get_db),
    utilisateur=Depends(
        require_permission("COMMUNICATION_CONSULTER")
    ),
):
    """
    Retourne une communication précise.

    Permission :
    COMMUNICATION_CONSULTER
    """

    return verifier_communication_existante(
        communication_id,
        db,
    )


# ============================================================
# CREER UNE COMMUNICATION
# ============================================================

@router.post(
    "",
    response_model=CommunicationResponse,
    status_code=status.HTTP_201_CREATED,
)
def creer_communication(
    donnees: CommunicationCreate,
    db: Session = Depends(get_db),
    utilisateur=Depends(
        require_permission("COMMUNICATION_CREER")
    ),
):
    """
    Crée une nouvelle communication.

    Permission :
    COMMUNICATION_CREER
    """

    # --------------------------------------------------------
    # Vérification des dates
    # --------------------------------------------------------

    if (
        donnees.date_expiration is not None
        and donnees.date_publication is not None
        and donnees.date_expiration
        <= donnees.date_publication
    ):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "La date d'expiration doit être "
                "postérieure à la date de publication."
            ),
        )

    # --------------------------------------------------------
    # Création
    # --------------------------------------------------------

    communication = Communication(
        titre=donnees.titre,
        contenu=donnees.contenu,
        type_communication=donnees.type_communication,
        priorite=donnees.priorite,
        date_publication=(
            donnees.date_publication
            if donnees.date_publication is not None
            else datetime.now()
        ),
        date_expiration=donnees.date_expiration,
        actif=donnees.actif,
    )

    db.add(communication)
    db.commit()
    db.refresh(communication)

    return communication


# ============================================================
# MODIFIER UNE COMMUNICATION
# ============================================================

@router.put(
    "/{communication_id}",
    response_model=CommunicationResponse,
)
def modifier_communication(
    communication_id: int,
    donnees: CommunicationUpdate,
    db: Session = Depends(get_db),
    utilisateur=Depends(
        require_permission("COMMUNICATION_MODIFIER")
    ),
):
    """
    Modifie une communication existante.

    Permission :
    COMMUNICATION_MODIFIER
    """

    communication = verifier_communication_existante(
        communication_id,
        db,
    )

    # --------------------------------------------------------
    # Récupération des valeurs finales
    # --------------------------------------------------------

    date_publication = (
        donnees.date_publication
        if donnees.date_publication is not None
        else communication.date_publication
    )

    date_expiration = (
        donnees.date_expiration
        if donnees.date_expiration is not None
        else communication.date_expiration
    )

    # --------------------------------------------------------
    # Vérification cohérence des dates
    # --------------------------------------------------------

    if (
        date_expiration is not None
        and date_expiration <= date_publication
    ):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "La date d'expiration doit être "
                "postérieure à la date de publication."
            ),
        )

    # --------------------------------------------------------
    # Mise à jour uniquement des champs fournis
    # --------------------------------------------------------

    if donnees.titre is not None:
        communication.titre = donnees.titre

    if donnees.contenu is not None:
        communication.contenu = donnees.contenu

    if donnees.type_communication is not None:
        communication.type_communication = (
            donnees.type_communication
        )

    if donnees.priorite is not None:
        communication.priorite = donnees.priorite

    if donnees.date_publication is not None:
        communication.date_publication = (
            donnees.date_publication
        )

    if donnees.date_expiration is not None:
        communication.date_expiration = (
            donnees.date_expiration
        )

    if donnees.actif is not None:
        communication.actif = donnees.actif

    # --------------------------------------------------------
    # Mise à jour de updated_at
    # --------------------------------------------------------

    communication.updated_at = datetime.now()

    db.commit()
    db.refresh(communication)

    return communication


# ============================================================
# ACTIVER / DESACTIVER UNE COMMUNICATION
# ============================================================

@router.patch(
    "/{communication_id}/statut",
    response_model=CommunicationResponse,
)
def modifier_statut_communication(
    communication_id: int,
    donnees: CommunicationStatutUpdate,
    db: Session = Depends(get_db),
    utilisateur=Depends(
        require_permission("COMMUNICATION_MODIFIER")
    ),
):
    """
    Active ou désactive une communication.

    Permission :
    COMMUNICATION_MODIFIER
    """

    communication = verifier_communication_existante(
        communication_id,
        db,
    )

    communication.actif = donnees.actif
    communication.updated_at = datetime.now()

    db.commit()
    db.refresh(communication)

    return communication


# ============================================================
# SUPPRIMER UNE COMMUNICATION
# ============================================================

@router.delete(
    "/{communication_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def supprimer_communication(
    communication_id: int,
    db: Session = Depends(get_db),
    utilisateur=Depends(
        require_permission("COMMUNICATION_SUPPRIMER")
    ),
):
    """
    Supprime définitivement une communication.

    Permission :
    COMMUNICATION_SUPPRIMER
    """

    communication = verifier_communication_existante(
        communication_id,
        db,
    )

    db.delete(communication)
    db.commit()

    return None
