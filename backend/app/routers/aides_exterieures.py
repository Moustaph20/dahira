
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import require_permission

from app.models.aide_exterieure import AideExterieure

from app.schemas.aide_exterieure import (
    AideExterieureCreate,
    AideExterieureResponse,
    AideExterieureUpdate,
)


router = APIRouter(
    prefix="/aides-exterieures",
    tags=["Aides extérieures"],
)


# ============================================================
# LISTE
# ============================================================

@router.get(
    "",
    response_model=list[AideExterieureResponse]
)
def lister_aides_exterieures(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("AIDE_EXTERIEURE_CONSULTER")
    ),
):

    return (
        db.query(AideExterieure)
        .filter(
            AideExterieure.actif.is_(True)
        )
        .order_by(
            AideExterieure.date_aide.desc()
        )
        .all()
    )


# ============================================================
# DÉTAIL
# ============================================================

@router.get(
    "/{aide_id}",
    response_model=AideExterieureResponse
)
def obtenir_aide_exterieure(
    aide_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("AIDE_EXTERIEURE_CONSULTER")
    ),
):

    aide = (
        db.query(AideExterieure)
        .filter(
            AideExterieure.id == aide_id,
            AideExterieure.actif.is_(True)
        )
        .first()
    )

    if not aide:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aide extérieure introuvable."
        )

    return aide


# ============================================================
# CRÉATION
# ============================================================

@router.post(
    "",
    response_model=AideExterieureResponse,
    status_code=status.HTTP_201_CREATED
)
def creer_aide_exterieure(
    data: AideExterieureCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("AIDE_EXTERIEURE_CREER")
    ),
):

    aide = AideExterieure(
        source=data.source,
        montant=data.montant,
        description=data.description,
        date_aide=data.date_aide,
        actif=True,
    )

    db.add(aide)
    db.commit()
    db.refresh(aide)

    return aide


# ============================================================
# MODIFICATION
# ============================================================

@router.put(
    "/{aide_id}",
    response_model=AideExterieureResponse
)
def modifier_aide_exterieure(
    aide_id: int,
    data: AideExterieureUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("AIDE_EXTERIEURE_MODIFIER")
    ),
):

    aide = (
        db.query(AideExterieure)
        .filter(
            AideExterieure.id == aide_id,
            AideExterieure.actif.is_(True)
        )
        .first()
    )

    if not aide:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aide extérieure introuvable."
        )

    donnees = data.model_dump(
        exclude_unset=True
    )

    for champ, valeur in donnees.items():
        setattr(aide, champ, valeur)

    db.commit()
    db.refresh(aide)

    return aide


# ============================================================
# SUPPRESSION LOGIQUE
# ============================================================

@router.delete(
    "/{aide_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def supprimer_aide_exterieure(
    aide_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("AIDE_EXTERIEURE_SUPPRIMER")
    ),
):

    aide = (
        db.query(AideExterieure)
        .filter(
            AideExterieure.id == aide_id,
            AideExterieure.actif.is_(True)
        )
        .first()
    )

    if not aide:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aide extérieure introuvable."
        )

    aide.actif = False

    db.commit()

    return None

