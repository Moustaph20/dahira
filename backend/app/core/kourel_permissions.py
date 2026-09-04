
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user

from app.models.kourel import Kourel
from app.models.kourel_membre import KourelMembre
from app.models.programme_mensuel import ProgrammeMensuel
from app.models.repetition import Repetition
from app.models.utilisateur import Utilisateur


# ============================================================
# VÉRIFIER QU'UN UTILISATEUR EST MEMBRE D'UN KOUREL
# ============================================================

def verifier_membre_kourel(
    utilisateur: Utilisateur,
    kourel_id: int,
    db: Session,
):
    affiliation = (
        db.query(KourelMembre)
        .filter(
            KourelMembre.kourel_id == kourel_id,
            KourelMembre.membre_id == utilisateur.membre_id,
            KourelMembre.actif.is_(True),
        )
        .first()
    )

    if not affiliation:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'êtes pas membre de ce Kourel.",
        )

    return affiliation


# ============================================================
# MEMBRE DU KOUREL
# ============================================================

def require_kourel_membre(
    kourel_id: int,
    current_user: Utilisateur = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    kourel = (
        db.query(Kourel)
        .filter(
            Kourel.id == kourel_id,
            Kourel.actif.is_(True),
        )
        .first()
    )

    if not kourel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kourel introuvable ou inactif.",
        )

    verifier_membre_kourel(
        current_user,
        kourel_id,
        db,
    )

    return current_user


# ============================================================
# GESTIONNAIRE DU KOUREL
# ============================================================

def require_kourel_gestionnaire(
    kourel_id: int,
    current_user: Utilisateur = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    kourel = (
        db.query(Kourel)
        .filter(
            Kourel.id == kourel_id,
            Kourel.actif.is_(True),
        )
        .first()
    )

    if not kourel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kourel introuvable ou inactif.",
        )

    affiliation = verifier_membre_kourel(
        current_user,
        kourel_id,
        db,
    )

    if not affiliation.gestionnaire:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous êtes membre de ce Kourel mais vous n'en êtes pas le gestionnaire.",
        )

    return current_user


# ============================================================
# VÉRIFIER LE GESTIONNAIRE À PARTIR D'UN PROGRAMME
# ============================================================

def require_programme_gestionnaire(
    programme_id: int,
    current_user: Utilisateur = Depends(get_current_user),
    db: Session = Depends(get_db),
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
            detail="Programme mensuel introuvable.",
        )

    return require_kourel_gestionnaire_direct(
        programme.kourel_id,
        current_user,
        db,
    )


# ============================================================
# VÉRIFIER LE MEMBRE À PARTIR D'UN PROGRAMME
# ============================================================

def require_programme_membre(
    programme_id: int,
    current_user: Utilisateur = Depends(get_current_user),
    db: Session = Depends(get_db),
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
            detail="Programme mensuel introuvable.",
        )

    verifier_membre_kourel(
        current_user,
        programme.kourel_id,
        db,
    )

    return current_user


# ============================================================
# VÉRIFIER DIRECTEMENT UN GESTIONNAIRE
# ============================================================

def require_kourel_gestionnaire_direct(
    kourel_id: int,
    current_user: Utilisateur,
    db: Session,
):
    kourel = (
        db.query(Kourel)
        .filter(
            Kourel.id == kourel_id,
            Kourel.actif.is_(True),
        )
        .first()
    )

    if not kourel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kourel introuvable ou inactif.",
        )

    affiliation = verifier_membre_kourel(
        current_user,
        kourel_id,
        db,
    )

    if not affiliation.gestionnaire:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'êtes pas le gestionnaire de ce Kourel.",
        )

    return current_user


# ============================================================
# VÉRIFIER LE MEMBRE À PARTIR D'UNE RÉPÉTITION
# ============================================================

def get_repetition_kourel(
    repetition_id: int,
    db: Session,
):
    repetition = (
        db.query(Repetition)
        .filter(
            Repetition.id == repetition_id,
            Repetition.actif.is_(True),
        )
        .first()
    )

    if not repetition:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Répétition introuvable.",
        )

    programme = (
        db.query(ProgrammeMensuel)
        .filter(
            ProgrammeMensuel.id == repetition.programme_id,
            ProgrammeMensuel.actif.is_(True),
        )
        .first()
    )

    if not programme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Programme mensuel introuvable.",
        )

    return repetition, programme


def require_repetition_membre(
    repetition_id: int,
    current_user: Utilisateur = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    repetition, programme = get_repetition_kourel(
        repetition_id,
        db,
    )

    verifier_membre_kourel(
        current_user,
        programme.kourel_id,
        db,
    )

    return current_user


def require_repetition_gestionnaire(
    repetition_id: int,
    current_user: Utilisateur = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    repetition, programme = get_repetition_kourel(
        repetition_id,
        db,
    )

    require_kourel_gestionnaire_direct(
        programme.kourel_id,
        current_user,
        db,
    )

    return current_user

