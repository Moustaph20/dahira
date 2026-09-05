from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import require_permission

from app.models.ton import Ton

from app.schemas.ton import (
    TonCreate,
    TonResponse,
    TonUpdate,
)


router = APIRouter(
    prefix="/tons",
    tags=["Kourel - Tons"],
)


# ============================================================
# LISTE DES TONS ACTIFS
# ============================================================

@router.get(
    "",
    response_model=list[TonResponse],
)
def lister_tons(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("KOUREL_CONSULTER")
    ),
):
    tons = (
        db.query(Ton)
        .filter(
            Ton.actif.is_(True),
        )
        .order_by(
            Ton.nom.asc(),
        )
        .all()
    )

    return tons


# ============================================================
# DÉTAIL D'UN TON
# ============================================================

@router.get(
    "/{ton_id}",
    response_model=TonResponse,
)
def obtenir_ton(
    ton_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("KOUREL_CONSULTER")
    ),
):
    ton = (
        db.query(Ton)
        .filter(
            Ton.id == ton_id,
            Ton.actif.is_(True),
        )
        .first()
    )

    if not ton:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ton introuvable.",
        )

    return ton


# ============================================================
# CRÉATION
# ============================================================

@router.post(
    "",
    response_model=TonResponse,
    status_code=status.HTTP_201_CREATED,
)
def creer_ton(
    data: TonCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("KOUREL_CREER")
    ),
):
    nom = data.nom.strip()

    if not nom:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le nom du ton est obligatoire.",
        )

    ton_existant = (
        db.query(Ton)
        .filter(
            Ton.nom.ilike(nom),
        )
        .first()
    )

    if ton_existant:
        if ton_existant.actif:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Ce ton existe déjà.",
            )

        # Réactivation d'un ancien ton supprimé
        ton_existant.nom = nom
        ton_existant.description = (
            data.description.strip()
            if data.description
            else None
        )
        ton_existant.actif = True

        db.commit()
        db.refresh(ton_existant)

        return ton_existant

    ton = Ton(
        nom=nom,
        description=(
            data.description.strip()
            if data.description
            else None
        ),
        actif=True,
    )

    db.add(ton)
    db.commit()
    db.refresh(ton)

    return ton


# ============================================================
# MODIFICATION
# ============================================================

@router.put(
    "/{ton_id}",
    response_model=TonResponse,
)
def modifier_ton(
    ton_id: int,
    data: TonUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("KOUREL_MODIFIER")
    ),
):
    ton = (
        db.query(Ton)
        .filter(
            Ton.id == ton_id,
            Ton.actif.is_(True),
        )
        .first()
    )

    if not ton:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ton introuvable.",
        )

    donnees = data.model_dump(
        exclude_unset=True,
    )

    # --------------------------------------------------------
    # NOM
    # --------------------------------------------------------

    if "nom" in donnees:
        nom = (
            donnees["nom"].strip()
            if donnees["nom"]
            else ""
        )

        if not nom:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Le nom du ton est obligatoire.",
            )

        doublon = (
            db.query(Ton)
            .filter(
                Ton.id != ton_id,
                Ton.nom.ilike(nom),
            )
            .first()
        )

        if doublon:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Un autre ton porte déjà ce nom.",
            )

        donnees["nom"] = nom

    # --------------------------------------------------------
    # DESCRIPTION
    # --------------------------------------------------------

    if "description" in donnees:
        donnees["description"] = (
            donnees["description"].strip()
            if donnees["description"]
            else None
        )

    # --------------------------------------------------------
    # APPLICATION
    # --------------------------------------------------------

    for champ, valeur in donnees.items():
        setattr(
            ton,
            champ,
            valeur,
        )

    db.commit()
    db.refresh(ton)

    return ton


# ============================================================
# SUPPRESSION LOGIQUE
# ============================================================

@router.delete(
    "/{ton_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def supprimer_ton(
    ton_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("KOUREL_SUPPRIMER")
    ),
):
    ton = (
        db.query(Ton)
        .filter(
            Ton.id == ton_id,
            Ton.actif.is_(True),
        )
        .first()
    )

    if not ton:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ton introuvable.",
        )

    ton.actif = False

    db.commit()

    return None