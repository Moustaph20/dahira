from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import require_permission
from app.models.declamation import Declamation
from app.models.declamation_khassida import DeclamationKhassida
from app.models.khassida import Khassida
from app.models.khassida_ton import KhassidaTon
from app.models.ton import Ton
from app.models.audio import Audio


router = APIRouter(
    prefix="/choix-khassidas",
    tags=["Choix des Khassida"]
)


# ============================================================
# SCHEMAS
# ============================================================

class ChoixKhassidaRequest(BaseModel):
    khassida_id: int
    ton_id: int
    ordre: int = Field(..., ge=1)


class ModifierChoixKhassidaRequest(BaseModel):
    ton_id: int
    ordre: int = Field(..., ge=1)


# ============================================================
# CHOISIR UN KHASSIDA POUR UNE DÉCLAMATION
# ============================================================

@router.post(
    "/declamations/{declamation_id}",
    status_code=status.HTTP_201_CREATED
)
def ajouter_choix_khassida(
    declamation_id: int,
    choix: ChoixKhassidaRequest,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("PROGRAMME_GERER")
    )
):
    declamation = (
        db.query(Declamation)
        .filter(
            Declamation.id == declamation_id
        )
        .first()
    )

    if not declamation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Déclamation introuvable."
        )

    khassida = (
        db.query(Khassida)
        .filter(
            Khassida.id == choix.khassida_id,
            Khassida.actif.is_(True)
        )
        .first()
    )

    if not khassida:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Khassida introuvable."
        )

    ton = (
        db.query(Ton)
        .filter(
            Ton.id == choix.ton_id,
            Ton.actif.is_(True)
        )
        .first()
    )

    if not ton:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ton introuvable."
        )

    association = (
        db.query(KhassidaTon)
        .filter(
            KhassidaTon.khassida_id == choix.khassida_id,
            KhassidaTon.ton_id == choix.ton_id
        )
        .first()
    )

    if not association:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ce ton n'est pas disponible pour ce Khassida."
        )

    deja_selectionne = (
        db.query(DeclamationKhassida)
        .filter(
            DeclamationKhassida.declamation_id == declamation_id,
            DeclamationKhassida.khassida_id == choix.khassida_id
        )
        .first()
    )

    if deja_selectionne:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ce Khassida est déjà sélectionné pour cette déclamation."
        )

    ordre_existant = (
        db.query(DeclamationKhassida)
        .filter(
            DeclamationKhassida.declamation_id == declamation_id,
            DeclamationKhassida.ordre == choix.ordre
        )
        .first()
    )

    if ordre_existant:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cet ordre est déjà utilisé."
        )

    choix_khassida = DeclamationKhassida(
        declamation_id=declamation_id,
        khassida_id=choix.khassida_id,
        ton_id=choix.ton_id,
        ordre=choix.ordre
    )

    db.add(choix_khassida)
    db.commit()
    db.refresh(choix_khassida)

    return {
        "message": "Khassida ajouté à la déclamation avec succès",
        "khassida": khassida.titre,
        "ton": ton.nom,
        "ordre": choix.ordre
    }


# ============================================================
# CONSULTER LES KHASSIDA ET TONS DISPONIBLES
# ============================================================

@router.get("/declamations/{declamation_id}/disponibles")
def khassidas_disponibles(
    declamation_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("PROGRAMME_GERER")
    )
):
    declamation = (
        db.query(Declamation)
        .filter(
            Declamation.id == declamation_id
        )
        .first()
    )

    if not declamation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Déclamation introuvable."
        )

    khassidas = (
        db.query(Khassida)
        .filter(
            Khassida.actif.is_(True)
        )
        .order_by(
            Khassida.titre.asc()
        )
        .all()
    )

    resultat = []

    for khassida in khassidas:

        associations = (
            db.query(KhassidaTon, Ton)
            .join(
                Ton,
                Ton.id == KhassidaTon.ton_id
            )
            .filter(
                KhassidaTon.khassida_id == khassida.id,
                Ton.actif.is_(True)
            )
            .order_by(
                Ton.nom.asc()
            )
            .all()
        )

        resultat.append({
            "khassida": {
                "titre": khassida.titre,
                "auteur": khassida.auteur,
                "description": khassida.description
            },
            "tons": [
                {
                    "nom": ton.nom
                }
                for _, ton in associations
            ]
        })

    return {
        "declamation": {
            "date": declamation.date_declamation,
            "evenement": declamation.evenement,
            "lieu": declamation.lieu
        },
        "khassidas": resultat
    }


# ============================================================
# VOIR LES KHASSIDA DÉJÀ CHOISIS
# ============================================================

@router.get("/declamations/{declamation_id}")
def choix_de_la_declamation(
    declamation_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("PROGRAMME_GERER")
    )
):
    declamation = (
        db.query(Declamation)
        .filter(
            Declamation.id == declamation_id
        )
        .first()
    )

    if not declamation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Déclamation introuvable."
        )

    choix = (
        db.query(
            DeclamationKhassida,
            Khassida,
            Ton
        )
        .join(
            Khassida,
            Khassida.id == DeclamationKhassida.khassida_id
        )
        .join(
            Ton,
            Ton.id == DeclamationKhassida.ton_id
        )
        .filter(
            DeclamationKhassida.declamation_id == declamation_id
        )
        .order_by(
            DeclamationKhassida.ordre.asc()
        )
        .all()
    )

    return {
        "declamation": {
            "date": declamation.date_declamation,
            "evenement": declamation.evenement,
            "lieu": declamation.lieu
        },
        "khassidas": [
            {
                "titre": khassida.titre,
                "auteur": khassida.auteur,
                "ton": ton.nom,
                "ordre": choix_khassida.ordre
            }
            for choix_khassida, khassida, ton in choix
        ]
    }


# ============================================================
# MODIFIER LE TON OU L'ORDRE
# ============================================================

@router.put("/{choix_id}")
def modifier_choix_khassida(
    choix_id: int,
    modification: ModifierChoixKhassidaRequest,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("PROGRAMME_GERER")
    )
):
    choix = (
        db.query(DeclamationKhassida)
        .filter(
            DeclamationKhassida.id == choix_id
        )
        .first()
    )

    if not choix:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Choix de Khassida introuvable."
        )

    association = (
        db.query(KhassidaTon)
        .filter(
            KhassidaTon.khassida_id == choix.khassida_id,
            KhassidaTon.ton_id == modification.ton_id
        )
        .first()
    )

    if not association:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ce ton n'est pas disponible pour ce Khassida."
        )

    ordre_existant = (
        db.query(DeclamationKhassida)
        .filter(
            DeclamationKhassida.declamation_id == choix.declamation_id,
            DeclamationKhassida.ordre == modification.ordre,
            DeclamationKhassida.id != choix_id
        )
        .first()
    )

    if ordre_existant:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cet ordre est déjà utilisé."
        )

    ton = (
        db.query(Ton)
        .filter(
            Ton.id == modification.ton_id,
            Ton.actif.is_(True)
        )
        .first()
    )

    if not ton:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ton introuvable."
        )

    choix.ton_id = modification.ton_id
    choix.ordre = modification.ordre

    db.commit()
    db.refresh(choix)

    return {
        "message": "Choix du Khassida modifié avec succès",
        "ton": ton.nom,
        "ordre": choix.ordre
    }


# ============================================================
# SUPPRIMER UN CHOIX
# ============================================================

@router.delete("/{choix_id}")
def supprimer_choix_khassida(
    choix_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("PROGRAMME_GERER")
    )
):
    choix = (
        db.query(DeclamationKhassida)
        .filter(
            DeclamationKhassida.id == choix_id
        )
        .first()
    )

    if not choix:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Choix de Khassida introuvable."
        )

    db.delete(choix)
    db.commit()

    return {
        "message": "Khassida retiré de la déclamation avec succès"
    }


# ============================================================
# AUDIOS D'UN TON
# ============================================================

@router.get("/tons/{ton_id}/audios")
def audios_du_ton(
    ton_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("PROGRAMME_GERER")
    )
):
    ton = (
        db.query(Ton)
        .filter(
            Ton.id == ton_id,
            Ton.actif.is_(True)
        )
        .first()
    )

    if not ton:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ton introuvable."
        )

    audios = (
        db.query(Audio)
        .filter(
            Audio.ton_id == ton_id,
            Audio.actif.is_(True)
        )
        .order_by(
            Audio.titre.asc()
        )
        .all()
    )

    return {
        "ton": {
            "nom": ton.nom
        },
        "audios": [
            {
                "titre": audio.titre,
                "fichier": audio.fichier,
                "description": audio.description
            }
            for audio in audios
        ]
    }