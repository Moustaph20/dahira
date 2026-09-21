from datetime import date, timedelta
from calendar import monthrange

from fastapi import APIRouter, Depends, HTTPException, Query
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
# PERMISSION
# ============================================================

def utilisateur_a_permission(
    db: Session,
    utilisateur_id: int,
    code_permission: str,
) -> bool:
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
# OUTILS DATES
# ============================================================

def premier_jour_du_mois(d: date) -> date:
    return d.replace(day=1)


def dernier_jour_du_mois(d: date) -> date:
    dernier_jour = monthrange(d.year, d.month)[1]
    return d.replace(day=dernier_jour)


def ajouter_mois(d: date, nombre: int) -> date:
    """
    Ajoute un nombre de mois à une date.
    """
    mois_total = d.year * 12 + (d.month - 1) + nombre

    nouvelle_annee = mois_total // 12
    nouveau_mois = mois_total % 12 + 1

    nouveau_jour = min(
        d.day,
        monthrange(nouvelle_annee, nouveau_mois)[1],
    )

    return date(
        nouvelle_annee,
        nouveau_mois,
        nouveau_jour,
    )


def nombre_mois_couverts(
    date_debut: date,
    date_fin: date,
) -> int:
    """
    Compte le nombre de mois calendaires touchés par la période.

    Exemple :
    01/09/2026 -> 30/09/2026 = 1 mois
    15/09/2026 -> 10/10/2026 = 2 mois
    01/01/2026 -> 31/03/2026 = 3 mois
    """

    return (
        (date_fin.year - date_debut.year) * 12
        + date_fin.month
        - date_debut.month
        + 1
    )


def normaliser_periode(
    date_debut: date | None,
    date_fin: date | None,
):
    """
    Vérifie et normalise les dates de période.
    """

    if date_debut and date_fin:
        if date_debut > date_fin:
            raise HTTPException(
                status_code=400,
                detail=(
                    "La date de début doit être antérieure "
                    "ou égale à la date de fin."
                ),
            )

        return date_debut, date_fin

    # Si une seule date est fournie,
    # on considère cela comme une erreur.
    if date_debut and not date_fin:
        raise HTTPException(
            status_code=400,
            detail="La date de fin est obligatoire.",
        )

    if date_fin and not date_debut:
        raise HTTPException(
            status_code=400,
            detail="La date de début est obligatoire.",
        )

    # Aucune période :
    # on retourne None / None.
    return None, None


# ============================================================
# DASHBOARD
# ============================================================

@router.get("")
def dashboard(
    date_debut: date | None = Query(
        default=None,
        description="Date de début de la période",
    ),
    date_fin: date | None = Query(
        default=None,
        description="Date de fin de la période",
    ),
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission(
            "DASHBOARD_CONSULTER"
        )
    ),
):
    # ---------------------------------------------------------
    # Vérification des dates
    # ---------------------------------------------------------

    date_debut, date_fin = normaliser_periode(
        date_debut,
        date_fin,
    )

    periode_active = (
        date_debut is not None
        and date_fin is not None
    )

    # ---------------------------------------------------------
    # Permission financière
    # ---------------------------------------------------------

    peut_consulter_finances = utilisateur_a_permission(
        db=db,
        utilisateur_id=current_user.id,
        code_permission="FINANCE_CONSULTER",
    )

    # ---------------------------------------------------------
    # Nombre de membres actifs
    # ---------------------------------------------------------

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

    # ---------------------------------------------------------
    # Valeurs financières par défaut
    # ---------------------------------------------------------

    total_cotisations_estimees = 0.0
    total_cotisations_encaissees = 0.0
    total_aides_exterieures = 0.0
    total_depenses = 0.0
    total_recettes = 0.0
    solde = 0.0

    # ---------------------------------------------------------
    # CALCULS FINANCIERS
    # ---------------------------------------------------------

    if peut_consulter_finances:

        # =====================================================
        # 1. COTISATIONS PRÉVUES
        # =====================================================
        #
        # On part de TOUS les membres actifs.
        #
        # Exemple :
        #
        # Membre A = 7 000
        # Membre B = 5 000
        # Membre C = 0
        #
        # Prévision mensuelle = 12 000
        #
        # Si période = septembre + octobre :
        #
        # 12 000 x 2 = 24 000
        #
        # Si aucune période n'est sélectionnée :
        # on conserve le comportement actuel :
        # prévision mensuelle.
        # =====================================================

        total_mensuel_cotisations = (
            db.query(
                func.coalesce(
                    func.sum(
                        Membre.montant_cotisation
                    ),
                    0,
                )
            )
            .filter(
                Membre.actif.is_(True),
                Membre.montant_cotisation > 0,
            )
            .scalar()
            or 0
        )

        total_mensuel_cotisations = float(
            total_mensuel_cotisations
        )

        if periode_active:
            mois_couverts = nombre_mois_couverts(
                date_debut,
                date_fin,
            )

            total_cotisations_estimees = (
                total_mensuel_cotisations
                * mois_couverts
            )
        else:
            mois_couverts = 1

            total_cotisations_estimees = (
                total_mensuel_cotisations
            )

        # =====================================================
        # 2. PAIEMENTS RÉELLEMENT ENCAISSÉS
        # =====================================================

        requete_paiements = (
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
        )

        if periode_active:
            requete_paiements = requete_paiements.filter(
                Paiement.date_paiement >= date_debut,
                Paiement.date_paiement <= date_fin,
            )

        total_cotisations_encaissees = (
            requete_paiements.scalar()
            or 0
        )

        # =====================================================
        # 3. AIDES EXTÉRIEURES
        # =====================================================

        requete_aides = (
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
        )

        if periode_active:
            requete_aides = requete_aides.filter(
                AideExterieure.date_aide >= date_debut,
                AideExterieure.date_aide <= date_fin,
            )

        total_aides_exterieures = (
            requete_aides.scalar()
            or 0
        )

        # =====================================================
        # 4. DÉPENSES
        # =====================================================

        requete_depenses = (
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
        )

        if periode_active:
            requete_depenses = requete_depenses.filter(
                Depense.date_depense >= date_debut,
                Depense.date_depense <= date_fin,
            )

        total_depenses = (
            requete_depenses.scalar()
            or 0
        )

        # =====================================================
        # CONVERSION
        # =====================================================

        total_cotisations_estimees = float(
            total_cotisations_estimees
        )

        total_cotisations_encaissees = float(
            total_cotisations_encaissees
        )

        total_aides_exterieures = float(
            total_aides_exterieures
        )

        total_depenses = float(
            total_depenses
        )

        # =====================================================
        # 5. TOTAL RECETTES
        # =====================================================

        total_recettes = (
            total_cotisations_encaissees
            + total_aides_exterieures
        )

        # =====================================================
        # 6. SOLDE
        # =====================================================

        solde = (
            total_recettes
            - total_depenses
        )

    # =========================================================
    # RÉPONSE
    # =========================================================

    return {
        "message": (
            "Tableau de bord chargé avec succès"
        ),

        "dashboard_consulter": True,

        "finance_consulter": (
            peut_consulter_finances
        ),

        # -----------------------------------------------------
        # Membres
        # -----------------------------------------------------

        "membres_actifs": nombre_membres,

        # -----------------------------------------------------
        # Informations période
        # -----------------------------------------------------

        "periode_active": periode_active,

        "date_debut": (
            date_debut.isoformat()
            if date_debut
            else None
        ),

        "date_fin": (
            date_fin.isoformat()
            if date_fin
            else None
        ),

        "mois_couverts": (
            nombre_mois_couverts(
                date_debut,
                date_fin,
            )
            if periode_active
            else 1
        ),

        # -----------------------------------------------------
        # Finances
        # -----------------------------------------------------

        "cotisations_estimees": (
            total_cotisations_estimees
            if peut_consulter_finances
            else None
        ),

        "cotisations_encaissees": (
            total_cotisations_encaissees
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

        "solde_disponible": (
            solde
            if peut_consulter_finances
            else None
        ),
    }