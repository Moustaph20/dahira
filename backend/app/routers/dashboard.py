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


@router.get("")
def dashboard(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission(
            "DASHBOARD_CONSULTER"
        )
    ),
):
    # ---------------------------------------------------------
    # Vérification de la permission financière
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
    # Calculs financiers
    # ---------------------------------------------------------
    if peut_consulter_finances:

        # -----------------------------------------------------
        # 1. COTISATIONS PRÉVUES
        #
        # IMPORTANT :
        #
        # On ne se base PAS sur les lignes Cotisation déjà
        # créées en base.
        #
        # Les cotisations prévues représentent le montant
        # mensuel théorique de TOUS les membres actifs
        # ayant une cotisation obligatoire supérieure à 0.
        #
        # Exemple :
        #
        # Membre A : 7 000
        # Membre B : 5 000
        # Membre C : 0
        # Membre D : 10 000 mais inactif
        #
        # Cotisations prévues = 7 000 + 5 000
        #                      = 12 000
        #
        # Le membre à 0 n'est pas compté.
        # Le membre inactif n'est pas compté.
        # -----------------------------------------------------
        total_cotisations_estimees = (
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

        # -----------------------------------------------------
        # 2. PAIEMENTS RÉELLEMENT ENCAISSÉS
        #
        # Paiement.montant représente l'argent réellement
        # reçu.
        #
        # Cela comprend :
        #
        # - les paiements de cotisations normales ;
        # - les paiements partiels ;
        # - les versements volontaires des membres
        #   ayant une cotisation de 0.
        #
        # Un versement volontaire de 5 000 FCFA par un membre
        # non cotisant est donc compté ici.
        # -----------------------------------------------------
        total_cotisations_encaissees = (
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

        # -----------------------------------------------------
        # 3. AIDES EXTÉRIEURES
        #
        # Il s'agit uniquement des recettes enregistrées
        # comme aides provenant de l'extérieur.
        #
        # Une barkelou d'un membre non cotisant ne doit PAS
        # être enregistrée ici : elle est enregistrée comme
        # Paiement et apparaît donc dans les encaissements
        # des membres.
        # -----------------------------------------------------
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

        # -----------------------------------------------------
        # 4. DÉPENSES
        # -----------------------------------------------------
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

        # -----------------------------------------------------
        # Conversion en float
        # -----------------------------------------------------
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

        # -----------------------------------------------------
        # 5. TOTAL DES RECETTES
        #
        # Seul l'argent réellement reçu entre dans les
        # recettes.
        #
        # Les cotisations prévues ne sont PAS des recettes.
        # -----------------------------------------------------
        total_recettes = (
            total_cotisations_encaissees
            + total_aides_exterieures
        )

        # -----------------------------------------------------
        # 6. SOLDE DISPONIBLE
        #
        # Recettes réelles - dépenses
        # -----------------------------------------------------
        solde = (
            total_recettes
            - total_depenses
        )

    # ---------------------------------------------------------
    # Réponse API
    # ---------------------------------------------------------
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
        # Cotisations prévues
        #
        # Somme des cotisations mensuelles fixes des membres
        # actifs ayant montant_cotisation > 0.
        # -----------------------------------------------------
        "cotisations_estimees": (
            total_cotisations_estimees
            if peut_consulter_finances
            else None
        ),

        # -----------------------------------------------------
        # Paiements réellement encaissés
        # -----------------------------------------------------
        "cotisations_encaissees": (
            total_cotisations_encaissees
            if peut_consulter_finances
            else None
        ),

        # -----------------------------------------------------
        # Aides extérieures
        # -----------------------------------------------------
        "aides_exterieures": (
            total_aides_exterieures
            if peut_consulter_finances
            else None
        ),

        # -----------------------------------------------------
        # Recettes réelles
        # -----------------------------------------------------
        "total_recettes": (
            total_recettes
            if peut_consulter_finances
            else None
        ),

        # -----------------------------------------------------
        # Dépenses
        # -----------------------------------------------------
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

        # -----------------------------------------------------
        # Solde disponible
        # -----------------------------------------------------
        "solde_disponible": (
            solde
            if peut_consulter_finances
            else None
        ),
    }