from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user

from app.models.fonction_permission import FonctionPermission
from app.models.permission import Permission
from app.models.utilisateur import Utilisateur
from app.models.utilisateur_fonction import UtilisateurFonction
from app.models.kourel_membre import KourelMembre
from app.models.kourel import Kourel
from app.models.programme_mensuel import ProgrammeMensuel


# ============================================================
# PERMISSION CLASSIQUE
# ============================================================

def require_permission(code: str):

    def permission_checker(
        current_user: Utilisateur = Depends(get_current_user),
        db: Session = Depends(get_db),
    ):
        permission = (
            db.query(Permission)
            .filter(
                Permission.code == code,
                Permission.actif.is_(True),
            )
            .first()
        )

        if not permission:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Permission inexistante : {code}",
            )

        autorisation = (
            db.query(FonctionPermission)
            .join(
                UtilisateurFonction,
                UtilisateurFonction.fonction_id
                == FonctionPermission.fonction_id,
            )
            .filter(
                UtilisateurFonction.utilisateur_id
                == current_user.id,
                FonctionPermission.permission_id
                == permission.id,
            )
            .first()
        )

        if not autorisation:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission insuffisante : {code}",
            )

        return current_user

    return permission_checker


# ============================================================
# VÉRIFIER QUE L'UTILISATEUR EST MEMBRE DU KOUREL
# ============================================================

def require_kourel_membre(kourel_id: int):

    def kourel_membre_checker(
        current_user: Utilisateur = Depends(get_current_user),
        db: Session = Depends(get_db),
    ):
        # ----------------------------------------------------
        # Vérifier que l'utilisateur est lié à un membre
        # ----------------------------------------------------

        if not current_user.membre_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "Cet utilisateur n'est associé "
                    "à aucun membre."
                ),
            )

        # ----------------------------------------------------
        # Vérifier le Kourel
        # ----------------------------------------------------

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

        # ----------------------------------------------------
        # Vérifier l'affiliation
        # ----------------------------------------------------

        affiliation = (
            db.query(KourelMembre)
            .filter(
                KourelMembre.kourel_id == kourel_id,
                KourelMembre.membre_id == current_user.membre_id,
                KourelMembre.actif.is_(True),
            )
            .first()
        )

        if not affiliation:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Vous n'êtes pas membre de ce Kourel.",
            )

        return current_user

    return kourel_membre_checker


# ============================================================
# VÉRIFIER QUE L'UTILISATEUR EST GESTIONNAIRE
# DU KOUREL D'UN PROGRAMME
#
# IMPORTANT :
# Le programme_id est récupéré automatiquement depuis
# l'URL par FastAPI.
#
# Exemple :
#
# /programmes-religieux/1/repetitions/1
#
# programme_id = 1
#        ↓
# ProgrammeMensuel
#        ↓
# kourel_id
#        ↓
# KourelMembre
#        ↓
# membre_id de l'utilisateur
#        ↓
# gestionnaire = True
# ============================================================

def require_kourel_gestionnaire():

    def kourel_gestionnaire_checker(
        programme_id: int,
        current_user: Utilisateur = Depends(get_current_user),
        db: Session = Depends(get_db),
    ):
        # ----------------------------------------------------
        # Vérifier que l'utilisateur est lié à un membre
        # ----------------------------------------------------

        if not current_user.membre_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "Cet utilisateur n'est associé "
                    "à aucun membre."
                ),
            )

        # ----------------------------------------------------
        # Vérifier que le programme existe et est actif
        # ----------------------------------------------------

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

        # ----------------------------------------------------
        # Récupérer automatiquement le Kourel
        # ----------------------------------------------------

        kourel = (
            db.query(Kourel)
            .filter(
                Kourel.id == programme.kourel_id,
                Kourel.actif.is_(True),
            )
            .first()
        )

        if not kourel:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=(
                    "Le Kourel associé à ce programme "
                    "est introuvable ou inactif."
                ),
            )

        # ----------------------------------------------------
        # Vérifier que l'utilisateur est gestionnaire
        # de CE Kourel
        # ----------------------------------------------------

        affiliation = (
            db.query(KourelMembre)
            .filter(
                KourelMembre.kourel_id == kourel.id,
                KourelMembre.membre_id == current_user.membre_id,
                KourelMembre.actif.is_(True),
                KourelMembre.gestionnaire.is_(True),
            )
            .first()
        )

        if not affiliation:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "Vous êtes membre de l'application, "
                    "mais vous n'êtes pas le gestionnaire "
                    "du Kourel associé à ce programme."
                ),
            )

        return current_user

    return kourel_gestionnaire_checker


# ============================================================
# VÉRIFIER QUE L'UTILISATEUR EST GESTIONNAIRE D'AU MOINS
# UN KOUREL
# ============================================================

def require_un_kourel_gestionnaire():

    def gestionnaire_checker(
        current_user: Utilisateur = Depends(get_current_user),
        db: Session = Depends(get_db),
    ):
        # ----------------------------------------------------
        # L'utilisateur doit être lié à un membre
        # ----------------------------------------------------

        if not current_user.membre_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "Cet utilisateur n'est associé "
                    "à aucun membre."
                ),
            )

        # ----------------------------------------------------
        # Vérifier qu'il est gestionnaire d'au moins
        # un Kourel actif
        # ----------------------------------------------------

        affiliation = (
            db.query(KourelMembre)
            .join(
                Kourel,
                Kourel.id == KourelMembre.kourel_id,
            )
            .filter(
                KourelMembre.membre_id == current_user.membre_id,
                KourelMembre.actif.is_(True),
                KourelMembre.gestionnaire.is_(True),
                Kourel.actif.is_(True),
            )
            .first()
        )

        if not affiliation:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "Vous n'êtes gestionnaire d'aucun Kourel."
                ),
            )

        return current_user

    return gestionnaire_checker