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
    tags=["Dashboard"]
)


@router.get("")
def dashboard(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("DASHBOARD_CONSULTER")
    )
):

    # ========================================================
    # MEMBRES ACTIFS
    # ========================================================

    nombre_membres = (
        db.query(func.count(Membre.id))
        .filter(
            Membre.actif.is_(True)
        )
        .scalar()
        or 0
    )

    # ========================================================
    # COTISATIONS ENCAISSÉES
    # ========================================================

    total_cotisations = (
        db.query(
            func.coalesce(
                func.sum(Cotisation.montant),
                0
            )
        )
        .filter(
            Cotisation.actif.is_(True)
        )
        .scalar()
        or 0
    )

    # ========================================================
    # PAIEMENTS EFFECTUÉS
    #
    # Information conservée pour l'affichage/statistiques.
    # Les paiements NE SONT PAS des dépenses du Dahira.
    # ========================================================

    total_paiements = (
        db.query(
            func.coalesce(
                func.sum(Paiement.montant),
                0
            )
        )
        .filter(
            Paiement.actif.is_(True)
        )
        .scalar()
        or 0
    )

    # ========================================================
    # AIDES EXTÉRIEURES
    # ========================================================

    total_aides_exterieures = (
        db.query(
            func.coalesce(
                func.sum(AideExterieure.montant),
                0
            )
        )
        .filter(
            AideExterieure.actif.is_(True)
        )
        .scalar()
        or 0
    )

    # ========================================================
    # DÉPENSES
    # ========================================================

    total_depenses = (
        db.query(
            func.coalesce(
                func.sum(Depense.montant),
                0
            )
        )
        .filter(
            Depense.actif.is_(True)
        )
        .scalar()
        or 0
    )

    # ========================================================
    # CONVERSION
    # ========================================================

    total_cotisations = float(total_cotisations)
    total_paiements = float(total_paiements)
    total_aides_exterieures = float(
        total_aides_exterieures
    )
    total_depenses = float(total_depenses)

    # ========================================================
    # TOTAL DES RECETTES
    #
    # RECETTES =
    #     COTISATIONS
    #     +
    #     AIDES EXTÉRIEURES
    # ========================================================

    total_recettes = (
        total_cotisations
        + total_aides_exterieures
    )

    # ========================================================
    # SOLDE DISPONIBLE
    #
    # SOLDE =
    #     TOTAL RECETTES
    #     -
    #     TOTAL DÉPENSES
    # ========================================================

    solde = (
        total_recettes
        - total_depenses
    )

    return {
        "message": "Tableau de bord chargé avec succès",

        # ----------------------------------------------------
        # MEMBRES
        # ----------------------------------------------------

        "membres_actifs": nombre_membres,

        # ----------------------------------------------------
        # RECETTES
        # ----------------------------------------------------

        "cotisations_encaissees": total_cotisations,

        "aides_exterieures": total_aides_exterieures,

        "total_recettes": total_recettes,

        # ----------------------------------------------------
        # DÉPENSES
        # ----------------------------------------------------

        "depenses": total_depenses,

        "total_depenses": total_depenses,

        # ----------------------------------------------------
        # PAIEMENTS
        #
        # Conservé pour information.
        # Ne participe PAS au calcul du solde.
        # ----------------------------------------------------

        "paiements_effectues": total_paiements,

        # ----------------------------------------------------
        # SOLDE
        # ----------------------------------------------------

        "solde_disponible": solde,
    }