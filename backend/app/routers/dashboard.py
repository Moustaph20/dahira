from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import require_permission

from app.models.cotisation import Cotisation
from app.models.membre import Membre
from app.models.paiement import Paiement
from app.models.depense import Depense
from app.models.aide_exterieure import AideExterieure
from app.models.fonction_permission import FonctionPermission
from app.models.permission import Permission
from app.models.utilisateur_fonction import UtilisateurFonction


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


# ============================================================
# OUTIL : VÉRIFIER UNE PERMISSION
# ============================================================

def utilisateur_a_permission(
    db: Session,
    utilisateur_id: int,
    code_permission: str,
) -> bool:
    """
    Vérifie directement en base si l'utilisateur possède
    une permission donnée via sa fonction.

    Chaîne :

        Utilisateur
             ↓
        UtilisateurFonction
             ↓
           Fonction
             ↓
        FonctionPermission
             ↓
         Permission
    """

    permission = (
        db.query(Permission)
        .filter(
            Permission.code == code_permission,
            Permission.actif.is_(True),
        )
        .first()
    )

    if not permission:
        return False

    autorisation = (
        db.query(FonctionPermission)
        .join(
            UtilisateurFonction,
            UtilisateurFonction.fonction_id
            == FonctionPermission.fonction_id,
        )
        .filter(
            UtilisateurFonction.utilisateur_id
            == utilisateur_id,
            FonctionPermission.permission_id
            == permission.id,
        )
        .first()
    )

    return autorisation is not None


# ============================================================
# DASHBOARD
# ============================================================

@router.get("")
def dashboard(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission(
            "DASHBOARD_CONSULTER"
        )
    ),
):
    """
    Retourne les informations du tableau de bord.

    Permission obligatoire :
        DASHBOARD_CONSULTER

    Les données financières sont retournées uniquement si
    l'utilisateur possède également :
        FINANCE_CONSULTER
    """

    # ========================================================
    # VÉRIFICATION DE LA PERMISSION FINANCIÈRE
    # ========================================================

    peut_consulter_finances = utilisateur_a_permission(
        db=db,
        utilisateur_id=current_user.id,
        code_permission="FINANCE_CONSULTER",
    )

    # ========================================================
    # MEMBRES ACTIFS
    # ========================================================

    nombre_membres = (
        db.query(
            func.count(Membre.id)
        )
        .filter(
            Membre.actif.is_(True)
        )
        .scalar()
        or 0
    )

    # ========================================================
    # VALEURS FINANCIÈRES PAR DÉFAUT
    # ========================================================

    total_cotisations = 0.0
    total_paiements = 0.0
    total_aides_exterieures = 0.0
    total_depenses = 0.0
    total_recettes = 0.0
    solde = 0.0

    # ========================================================
    # DONNÉES FINANCIÈRES
    # ========================================================

    if peut_consulter_finances:

        # ----------------------------------------------------
        # COTISATIONS ENCAISSÉES
        # ----------------------------------------------------

        total_cotisations = (
            db.query(
                func.coalesce(
                    func.sum(
                        Cotisation.montant
                    ),
                    0,
                )
            )
            .filter(
                Cotisation.actif.is_(True)
            )
            .scalar()
            or 0
        )

        # ----------------------------------------------------
        # PAIEMENTS EFFECTUÉS
        # ----------------------------------------------------

        total_paiements = (
            db.query(
                func.coalesce(
                    func.sum(
                        Paiement.montant
                    ),
                    0,
                )
            )
            .filter(
                Paiement.actif.is_(True)
            )
            .scalar()
            or 0
        )

        # ----------------------------------------------------
        # AIDES EXTÉRIEURES
        # ----------------------------------------------------

        total_aides_exterieures = (
            db.query(
                func.coalesce(
                    func.sum(
                        AideExterieure.montant
                    ),
                    0,
                )
            )
            .filter(
                AideExterieure.actif.is_(True)
            )
            .scalar()
            or 0
        )

        # ----------------------------------------------------
        # DÉPENSES
        # ----------------------------------------------------

        total_depenses = (
            db.query(
                func.coalesce(
                    func.sum(
                        Depense.montant
                    ),
                    0,
                )
            )
            .filter(
                Depense.actif.is_(True)
            )
            .scalar()
            or 0
        )

        # ----------------------------------------------------
        # CONVERSION EN FLOAT
        # ----------------------------------------------------

        total_cotisations = float(
            total_cotisations
        )

        total_paiements = float(
            total_paiements
        )

        total_aides_exterieures = float(
            total_aides_exterieures
        )

        total_depenses = float(
            total_depenses
        )

        # ----------------------------------------------------
        # TOTAL RECETTES
        #
        # Cotisations + aides extérieures
        # ----------------------------------------------------

        total_recettes = (
            total_cotisations
            + total_aides_exterieures
        )

        # ----------------------------------------------------
        # SOLDE
        #
        # Recettes - dépenses
        # ----------------------------------------------------

        solde = (
            total_recettes
            - total_depenses
        )

    # ========================================================
    # RÉPONSE
    # ========================================================

    return {
        "message": (
            "Tableau de bord chargé avec succès"
        ),

        # ----------------------------------------------------
        # DROITS
        # ----------------------------------------------------

        "dashboard_consulter": True,

        "finance_consulter": (
            peut_consulter_finances
        ),

        # ----------------------------------------------------
        # MEMBRES
        # ----------------------------------------------------

        "membres_actifs": nombre_membres,

        # ----------------------------------------------------
        # FINANCES
        # ----------------------------------------------------

        "cotisations_encaissees": (
            total_cotisations
            if peut_consulter_finances
            else None
        ),

        "aides_exterieures": (
            total_aides_exterieures
            if peut_consulter_finances
            else None
        ),

        "total_recettes": (
            total_recettes
            if peut_consulter_finances
            else None
        ),

        "depenses": (
            total_depenses
            if peut_consulter_finances
            else None
        ),

        "total_depenses": (
            total_depenses
            if peut_consulter_finances
            else None
        ),

        "paiements_effectues": (
            total_paiements
            if peut_consulter_finances
            else None
        ),

        "solde_disponible": (
            solde
            if peut_consulter_finances
            else None
        ),
    }