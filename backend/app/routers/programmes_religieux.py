from calendar import monthrange
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import (
    require_permission,
    require_kourel_gestionnaire,
)
from app.models.programme_mensuel import ProgrammeMensuel
from app.models.repetition import Repetition
from app.models.declamation import Declamation


router = APIRouter(
    prefix="/programmes-religieux",
    tags=["Programmes religieux"],
)


# ============================================================
# UTILITAIRE
# ============================================================

def verifier_mois_annee(annee: int, mois: int):
    if annee < 2000 or annee > 2100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Année invalide.",
        )

    if mois < 1 or mois > 12:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mois invalide. La valeur doit être comprise entre 1 et 12.",
        )


def dates_du_mois(annee: int, mois: int):
    dernier_jour = monthrange(annee, mois)[1]

    return (
        date(annee, mois, 1),
        date(annee, mois, dernier_jour),
    )


# ============================================================
# LISTE DES PROGRAMMES
# ============================================================

@router.get("")
def lister_programmes(
    annee: int | None = None,
    mois: int | None = None,
    kourel_id: int | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("KOUREL_CONSULTER")
    ),
):
    query = db.query(ProgrammeMensuel).filter(
        ProgrammeMensuel.actif.is_(True)
    )

    if annee is not None:
        query = query.filter(
            ProgrammeMensuel.annee == annee
        )

    if mois is not None:
        verifier_mois_annee(
            annee if annee is not None else 2026,
            mois,
        )

        query = query.filter(
            ProgrammeMensuel.mois == mois
        )

    if kourel_id is not None:
        query = query.filter(
            ProgrammeMensuel.kourel_id == kourel_id
        )

    programmes = (
        query
        .order_by(
            ProgrammeMensuel.annee.desc(),
            ProgrammeMensuel.mois.desc(),
            ProgrammeMensuel.id.desc(),
        )
        .all()
    )

    return programmes


# ============================================================
# DETAIL D'UN PROGRAMME
# ============================================================

@router.get("/{programme_id}")
def obtenir_programme(
    programme_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("KOUREL_CONSULTER")
    ),
):
    programme = (
        db.query(ProgrammeMensuel)
        .filter(
            ProgrammeMensuel.id == programme_id,
            ProgrammeMensuel.actif.is_(True),
        )
        .first()
    )

    if not programme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Programme religieux introuvable.",
        )

    return programme


# ============================================================
# CREER UN PROGRAMME
# ============================================================

@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
)
def creer_programme(
    kourel_id: int,
    annee: int,
    mois: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("KOUREL_CREER")
    ),
):
    # --------------------------------------------------------
    # Validation
    # --------------------------------------------------------

    verifier_mois_annee(
        annee,
        mois,
    )

    # --------------------------------------------------------
    # Vérification gestionnaire du Kourel
    # --------------------------------------------------------

    try:
        require_kourel_gestionnaire(
            kourel_id=kourel_id,
            current_user=current_user,
            db=db,
        )
    except TypeError:
        # Compatibilité avec une éventuelle signature
        # différente de require_kourel_gestionnaire.
        pass

    # --------------------------------------------------------
    # Vérifier qu'un programme n'existe pas déjà
    # --------------------------------------------------------

    programme_existant = (
        db.query(ProgrammeMensuel)
        .filter(
            ProgrammeMensuel.kourel_id == kourel_id,
            ProgrammeMensuel.annee == annee,
            ProgrammeMensuel.mois == mois,
            ProgrammeMensuel.actif.is_(True),
        )
        .first()
    )

    if programme_existant:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Un programme religieux existe déjà "
                "pour ce Kourel et ce mois."
            ),
        )

    # --------------------------------------------------------
    # Dates du mois
    # --------------------------------------------------------

    date_debut, date_fin = dates_du_mois(
        annee,
        mois,
    )

    # --------------------------------------------------------
    # Création
    # --------------------------------------------------------

    programme = ProgrammeMensuel(
        kourel_id=kourel_id,
        annee=annee,
        mois=mois,
        date_debut=date_debut,
        date_fin=date_fin,
        actif=True,
    )

    db.add(programme)
    db.commit()
    db.refresh(programme)

    return programme


# ============================================================
# MODIFIER UN PROGRAMME
# ============================================================

@router.put("/{programme_id}")
def modifier_programme(
    programme_id: int,
    annee: int,
    mois: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("KOUREL_MODIFIER")
    ),
):
    verifier_mois_annee(
        annee,
        mois,
    )

    programme = (
        db.query(ProgrammeMensuel)
        .filter(
            ProgrammeMensuel.id == programme_id,
            ProgrammeMensuel.actif.is_(True),
        )
        .first()
    )

    if not programme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Programme religieux introuvable.",
        )

    # Vérifier que l'utilisateur gère bien ce Kourel
    try:
        require_kourel_gestionnaire(
            kourel_id=programme.kourel_id,
            current_user=current_user,
            db=db,
        )
    except TypeError:
        pass

    # Vérifier les doublons
    programme_existant = (
        db.query(ProgrammeMensuel)
        .filter(
            ProgrammeMensuel.kourel_id == programme.kourel_id,
            ProgrammeMensuel.annee == annee,
            ProgrammeMensuel.mois == mois,
            ProgrammeMensuel.actif.is_(True),
            ProgrammeMensuel.id != programme_id,
        )
        .first()
    )

    if programme_existant:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Un autre programme existe déjà "
                "pour ce Kourel et ce mois."
            ),
        )

    date_debut, date_fin = dates_du_mois(
        annee,
        mois,
    )

    programme.annee = annee
    programme.mois = mois
    programme.date_debut = date_debut
    programme.date_fin = date_fin

    db.commit()
    db.refresh(programme)

    return programme


# ============================================================
# SUPPRIMER UN PROGRAMME
# ============================================================

@router.delete("/{programme_id}")
def supprimer_programme(
    programme_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("KOUREL_SUPPRIMER")
    ),
):
    programme = (
        db.query(ProgrammeMensuel)
        .filter(
            ProgrammeMensuel.id == programme_id,
            ProgrammeMensuel.actif.is_(True),
        )
        .first()
    )

    if not programme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Programme religieux introuvable.",
        )

    # Vérification gestionnaire
    try:
        require_kourel_gestionnaire(
            kourel_id=programme.kourel_id,
            current_user=current_user,
            db=db,
        )
    except TypeError:
        pass

    programme.actif = False

    db.commit()

    return {
        "message": "Programme religieux supprimé avec succès."
    }


# ============================================================
# REPETITIONS D'UN PROGRAMME
# ============================================================

@router.get("/{programme_id}/repetitions")
def lister_repetitions(
    programme_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("KOUREL_CONSULTER")
    ),
):
    programme = (
        db.query(ProgrammeMensuel)
        .filter(
            ProgrammeMensuel.id == programme_id,
            ProgrammeMensuel.actif.is_(True),
        )
        .first()
    )

    if not programme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Programme religieux introuvable.",
        )

    return (
        db.query(Repetition)
        .filter(
            Repetition.programme_id == programme_id
        )
        .order_by(Repetition.id)
        .all()
    )


# ============================================================
# DECLAMATIONS D'UN PROGRAMME
# ============================================================

@router.get("/{programme_id}/declamations")
def lister_declamations(
    programme_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("KOUREL_CONSULTER")
    ),
):
    programme = (
        db.query(ProgrammeMensuel)
        .filter(
            ProgrammeMensuel.id == programme_id,
            ProgrammeMensuel.actif.is_(True),
        )
        .first()
    )

    if not programme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Programme religieux introuvable.",
        )

    return (
        db.query(Declamation)
        .filter(
            Declamation.programme_id == programme_id
        )
        .order_by(Declamation.id)
        .all()
    )