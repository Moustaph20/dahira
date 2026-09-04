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


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


# ============================================================
# OUTIL : VÉRIFIER UNE PERMISSION DE L'UTILISATEUR
# ============================================================

def utilisateur_a_permission(
    utilisateur,
    code_permission: str,
) -> bool:
    """
    Vérifie si l'utilisateur possède une permission donnée.

    La fonction reste volontairement souple afin de fonctionner
    avec la structure actuelle de l'utilisateur retourné par
    le système d'authentification.
    """

    # --------------------------------------------------------
    # Cas 1 : l'utilisateur possède directement une méthode
    #         a_permission()
    # --------------------------------------------------------

    methode_permission = getattr(
        utilisateur,
        "a_permission",
        None,
    )

    if callable(methode_permission):
        try:
            return bool(
                methode_permission(code_permission)
            )
        except Exception:
            pass

    # --------------------------------------------------------
    # Cas 2 : permissions directement présentes sur
    #         l'utilisateur
    # --------------------------------------------------------

    permissions = getattr(
        utilisateur,
        "permissions",
        None,
    )

    if permissions:

        # Liste de chaînes :
        # ["DASHBOARD_CONSULTER", "FINANCE_CONSULTER"]
        if isinstance(permissions, (list, tuple, set)):

            for permission in permissions:

                if isinstance(permission, str):
                    if permission == code_permission:
                        return True

                elif isinstance(permission, dict):
                    if (
                        permission.get("code")
                        == code_permission
                    ):
                        return True

                else:
                    if (
                        getattr(
                            permission,
                            "code",
                            None,
                        )
                        == code_permission
                    ):
                        return True

    # --------------------------------------------------------
    # Cas 3 : permissions sous forme de dictionnaire
    # --------------------------------------------------------

    if isinstance(permissions, dict):

        valeur = permissions.get(
            code_permission
        )

        if valeur is True:
            return True

    return False


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
        current_user,
        "FINANCE_CONSULTER",
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
    #
    # Elles ne sont calculées que si l'utilisateur possède
    # FINANCE_CONSULTER.
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
        #
        # Les paiements ne sont PAS considérés comme des
        # dépenses du Dahira.
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
        # CONVERSION
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
        # RECETTES =
        #     COTISATIONS
        #     +
        #     AIDES EXTÉRIEURES
        # ----------------------------------------------------

        total_recettes = (
            total_cotisations
            + total_aides_exterieures
        )

        # ----------------------------------------------------
        # SOLDE
        #
        # SOLDE =
        #     TOTAL RECETTES
        #     -
        #     TOTAL DÉPENSES
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
        #
        # Si l'utilisateur n'a pas FINANCE_CONSULTER,
        # les valeurs restent à 0 et le frontend masque
        # toute la partie financière.
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