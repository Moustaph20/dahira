from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import require_permission

from app.models.cotisation import Cotisation
from app.models.membre import Membre
from app.models.paiement import Paiement
from app.models.utilisateur import Utilisateur

from app.services.notification_service import (
    creer_notification,
)


router = APIRouter(
    prefix="/cotisations",
    tags=["Cotisations"],
)


# ============================================================
# UTILITAIRES
# ============================================================

def obtenir_montant_paye(
    cotisation_id: int,
    db: Session,
) -> float:
    """
    Calcule le total réellement payé pour une cotisation
    à partir des paiements associés.
    """

    paiements = (
        db.query(Paiement)
        .filter(
            Paiement.cotisation_id == cotisation_id,
            Paiement.actif.is_(True),
        )
        .all()
    )

    return sum(
        float(paiement.montant or 0)
        for paiement in paiements
    )


def calculer_reste(
    montant: float,
    montant_paye: float,
) -> float:
    """
    Calcule le reste à payer.
    """

    return max(
        0,
        float(montant) - float(montant_paye),
    )


def calculer_statut(
    montant: float,
    montant_paye: float,
) -> str:
    """
    Détermine le statut d'une cotisation.
    """

    montant = float(montant or 0)
    montant_paye = float(montant_paye or 0)

    if montant_paye <= 0:
        return "Impayée"

    if montant_paye >= montant:
        return "Payée"

    return "Partiellement payée"


def obtenir_paiements(
    cotisation_id: int,
    db: Session,
):
    """
    Retourne les paiements actifs d'une cotisation.
    """

    return (
        db.query(Paiement)
        .filter(
            Paiement.cotisation_id == cotisation_id,
            Paiement.actif.is_(True),
        )
        .order_by(
            Paiement.date_paiement.desc(),
            Paiement.id.desc(),
        )
        .all()
    )


def construire_cotisation(
    cotisation: Cotisation,
    db: Session,
):
    """
    Construit la représentation JSON d'une cotisation.
    """

    montant = float(
        cotisation.montant or 0
    )

    montant_cotise = obtenir_montant_paye(
        cotisation.id,
        db,
    )

    montant_du = calculer_reste(
        montant,
        montant_cotise,
    )

    statut = calculer_statut(
        montant,
        montant_cotise,
    )

    paiements = obtenir_paiements(
        cotisation.id,
        db,
    )

    return {
        "id": cotisation.id,

        "membre_id": cotisation.membre_id,

        "montant": montant,

        "montant_cotise": montant_cotise,

        "montant_du": montant_du,

        "mois_concerne": cotisation.mois_concerne,

        "annee": cotisation.annee,

        "date_cotisation": cotisation.date_cotisation,

        "statut": statut,

        "actif": cotisation.actif,

        "paiements": [
            {
                "id": paiement.id,

                "montant": float(
                    paiement.montant or 0
                ),

                "mode_paiement":
                    paiement.mode_paiement,

                "date_paiement":
                    paiement.date_paiement,

                "reference":
                    paiement.reference,
            }
            for paiement in paiements
        ],
    }


# ============================================================
# CRÉER UNE COTISATION
# ============================================================

@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
)
def creer_cotisation(
    membre_id: int,
    montant: float,
    montant_cotise: float,
    mois_concerne: str,
    annee: int,
    mode_paiement: str = "espèce",
    date_cotisation: date | None = None,
    reference: str | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("COTISATION_CREER")
    ),
):

    # --------------------------------------------------------
    # VALIDATION MONTANT
    # --------------------------------------------------------

    if montant <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Le montant mensuel doit être "
                "supérieur à zéro."
            ),
        )

    if montant_cotise < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Le montant cotisé ne peut pas "
                "être négatif."
            ),
        )

    if montant_cotise > montant:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Le montant cotisé ne peut pas "
                "dépasser le montant mensuel fixé."
            ),
        )

    # --------------------------------------------------------
    # VALIDATION MOIS
    # --------------------------------------------------------

    mois_concerne = mois_concerne.strip()

    if not mois_concerne:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le mois concerné est obligatoire.",
        )

    # --------------------------------------------------------
    # VALIDATION ANNÉE
    # --------------------------------------------------------

    if annee < 2000 or annee > 2100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="L'année concernée est invalide.",
        )

    # --------------------------------------------------------
    # VALIDATION MODE PAIEMENT
    # --------------------------------------------------------

    mode_paiement = (
        mode_paiement or ""
    ).strip()

    if montant_cotise > 0 and not mode_paiement:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Le mode de paiement est obligatoire "
                "si un montant est encaissé."
            ),
        )

    # --------------------------------------------------------
    # VÉRIFIER LE MEMBRE
    # --------------------------------------------------------

    membre = (
        db.query(Membre)
        .filter(
            Membre.id == membre_id,
            Membre.actif.is_(True),
        )
        .first()
    )

    if not membre:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Membre actif introuvable.",
        )

    # --------------------------------------------------------
    # VÉRIFIER SI LA COTISATION EXISTE DÉJÀ
    # --------------------------------------------------------

    cotisation_existante = (
        db.query(Cotisation)
        .filter(
            Cotisation.membre_id == membre_id,
            Cotisation.mois_concerne == mois_concerne,
            Cotisation.annee == annee,
            Cotisation.actif.is_(True),
        )
        .first()
    )

    if cotisation_existante:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Une cotisation pour "
                f"{mois_concerne} {annee} "
                "existe déjà pour ce membre. "
                "Utilisez « Ajouter un paiement » "
                "pour effectuer un versement supplémentaire."
            ),
        )

    # --------------------------------------------------------
    # CRÉER LA COTISATION
    # --------------------------------------------------------

    cotisation = Cotisation(
        membre_id=membre_id,
        montant=montant,
        montant_du=max(
            0,
            montant - montant_cotise,
        ),
        mois_concerne=mois_concerne,
        annee=annee,
        date_cotisation=(
            date_cotisation or date.today()
        ),
    )

    db.add(cotisation)

    paiement = None

    try:

        db.flush()

        # ----------------------------------------------------
        # PREMIER PAIEMENT
        # ----------------------------------------------------

        if montant_cotise > 0:

            paiement = Paiement(
                membre_id=membre_id,
                cotisation_id=cotisation.id,
                montant=montant_cotise,
                mode_paiement=mode_paiement,
                date_paiement=(
                    date_cotisation or date.today()
                ),
                reference=reference,
            )

            db.add(paiement)

            db.flush()

        # ----------------------------------------------------
        # NOTIFICATION DU MEMBRE
        # ----------------------------------------------------

        utilisateur_membre = (
            db.query(Utilisateur)
            .filter(
                Utilisateur.membre_id == membre_id,
                Utilisateur.actif.is_(True),
            )
            .first()
        )

        if utilisateur_membre:

            if montant_cotise > 0:

                message_notification = (
                    f"Votre cotisation du mois de "
                    f"{mois_concerne} {annee} a été enregistrée "
                    f"pour un montant de {montant:g} FCFA. "
                    f"Montant versé : "
                    f"{montant_cotise:g} FCFA. "
                    f"Reste à payer : "
                    f"{max(0, montant - montant_cotise):g} FCFA."
                )

            else:

                message_notification = (
                    f"Votre cotisation du mois de "
                    f"{mois_concerne} {annee} a été créée "
                    f"pour un montant de {montant:g} FCFA. "
                    "Aucun paiement n'a encore été enregistré."
                )

            creer_notification(
                db=db,
                utilisateur_id=utilisateur_membre.id,
                titre="Cotisation enregistrée",
                message=message_notification,
                type="COTISATION",
                route="/cotisations",
            )

        # ----------------------------------------------------
        # COMMIT UNIQUE
        # ----------------------------------------------------

        db.commit()

        db.refresh(cotisation)

        if paiement:
            db.refresh(paiement)

    except IntegrityError as error:

        db.rollback()

        print(
            "ERREUR INTEGRITY ERROR COTISATION :",
            error,
        )

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Impossible d'enregistrer "
                "cette cotisation."
            ),
        )

    # --------------------------------------------------------
    # RÉPONSE
    # --------------------------------------------------------

    resultat = construire_cotisation(
        cotisation,
        db,
    )

    return {
        "message": (
            "Cotisation enregistrée "
            "avec succès."
        ),

        "cotisation": resultat,

        "paiement": (
            {
                "id": paiement.id,
                "membre_id": paiement.membre_id,
                "cotisation_id":
                    paiement.cotisation_id,
                "montant":
                    float(paiement.montant),
                "mode_paiement":
                    paiement.mode_paiement,
                "date_paiement":
                    paiement.date_paiement,
                "reference":
                    paiement.reference,
            }
            if paiement
            else None
        ),
    }


# ============================================================
# AJOUTER UN PAIEMENT À UNE COTISATION EXISTANTE
# ============================================================

@router.post(
    "/{cotisation_id}/paiements",
    status_code=status.HTTP_201_CREATED,
)
def ajouter_paiement(
    cotisation_id: int,
    montant: float,
    mode_paiement: str = "espèce",
    date_paiement: date | None = None,
    reference: str | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("COTISATION_CREER")
    ),
):

    # --------------------------------------------------------
    # VALIDATION
    # --------------------------------------------------------

    if montant <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Le montant du paiement doit "
                "être supérieur à zéro."
            ),
        )

    mode_paiement = (
        mode_paiement or ""
    ).strip()

    if not mode_paiement:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le mode de paiement est obligatoire.",
        )

    # --------------------------------------------------------
    # CHERCHER COTISATION
    # --------------------------------------------------------

    cotisation = (
        db.query(Cotisation)
        .filter(
            Cotisation.id == cotisation_id,
            Cotisation.actif.is_(True),
        )
        .first()
    )

    if not cotisation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cotisation introuvable.",
        )

    # --------------------------------------------------------
    # CALCULER LE RESTE
    # --------------------------------------------------------

    montant_fixe = float(
        cotisation.montant or 0
    )

    montant_deja_paye = obtenir_montant_paye(
        cotisation.id,
        db,
    )

    reste = calculer_reste(
        montant_fixe,
        montant_deja_paye,
    )

    # --------------------------------------------------------
    # EMPÊCHER UN PAIEMENT APRÈS PAIEMENT COMPLET
    # --------------------------------------------------------

    if reste <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Cette cotisation est déjà "
                "entièrement payée."
            ),
        )

    # --------------------------------------------------------
    # EMPÊCHER DE DÉPASSER LE RESTE
    # --------------------------------------------------------

    if montant > reste:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Le paiement de {montant:g} FCFA "
                f"dépasse le reste à payer de "
                f"{reste:g} FCFA."
            ),
        )

    # --------------------------------------------------------
    # CRÉER LE PAIEMENT
    # --------------------------------------------------------

    paiement = Paiement(
        membre_id=cotisation.membre_id,
        cotisation_id=cotisation.id,
        montant=montant,
        mode_paiement=mode_paiement,
        date_paiement=(
            date_paiement or date.today()
        ),
        reference=reference,
    )

    db.add(paiement)

    try:

        db.flush()

        # ----------------------------------------------------
        # NOUVEAU TOTAL PAYÉ
        # ----------------------------------------------------

        nouveau_total_paye = (
            montant_deja_paye + montant
        )

        nouveau_reste = calculer_reste(
            montant_fixe,
            nouveau_total_paye,
        )

        cotisation.montant_du = nouveau_reste

        # ----------------------------------------------------
        # NOTIFICATION DU MEMBRE
        # ----------------------------------------------------

        utilisateur_membre = (
            db.query(Utilisateur)
            .filter(
                Utilisateur.membre_id
                == cotisation.membre_id,
                Utilisateur.actif.is_(True),
            )
            .first()
        )

        if utilisateur_membre:

            statut_apres_paiement = calculer_statut(
                montant_fixe,
                nouveau_total_paye,
            )

            if statut_apres_paiement == "Payée":

                message_notification = (
                    f"Votre paiement de {montant:g} FCFA "
                    f"a été enregistré pour votre cotisation "
                    f"{cotisation.mois_concerne} "
                    f"{cotisation.annee}. "
                    "Votre cotisation est maintenant "
                    "entièrement payée."
                )

            else:

                message_notification = (
                    f"Votre paiement de {montant:g} FCFA "
                    f"a été enregistré pour votre cotisation "
                    f"{cotisation.mois_concerne} "
                    f"{cotisation.annee}. "
                    f"Total versé : "
                    f"{nouveau_total_paye:g} FCFA. "
                    f"Reste à payer : "
                    f"{nouveau_reste:g} FCFA."
                )

            creer_notification(
                db=db,
                utilisateur_id=utilisateur_membre.id,
                titre="Paiement enregistré",
                message=message_notification,
                type="COTISATION",
                route="/cotisations",
            )

        # ----------------------------------------------------
        # COMMIT UNIQUE
        # ----------------------------------------------------

        db.commit()

        db.refresh(paiement)
        db.refresh(cotisation)

    except IntegrityError as error:

        db.rollback()

        print(
            "ERREUR INTEGRITY ERROR PAIEMENT :",
            error,
        )

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Impossible d'enregistrer "
                "ce paiement."
            ),
        )

    # --------------------------------------------------------
    # RÉSULTAT
    # --------------------------------------------------------

    resultat = construire_cotisation(
        cotisation,
        db,
    )

    return {
        "message": (
            "Paiement enregistré "
            "avec succès."
        ),

        "cotisation": resultat,

        "paiement": {
            "id": paiement.id,

            "membre_id":
                paiement.membre_id,

            "cotisation_id":
                paiement.cotisation_id,

            "montant":
                float(paiement.montant),

            "mode_paiement":
                paiement.mode_paiement,

            "date_paiement":
                paiement.date_paiement,

            "reference":
                paiement.reference,
        },
    }


# ============================================================
# LISTER LES COTISATIONS
# ============================================================

@router.get("")
def lister_cotisations(
    membre_id: int | None = None,
    date_debut: date | None = None,
    date_fin: date | None = None,
    mois_concerne: str | None = None,
    annee: int | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission(
            "COTISATION_CONSULTER"
        )
    ),
):

    query = (
        db.query(Cotisation)
        .filter(
            Cotisation.actif.is_(True)
        )
    )

    # --------------------------------------------------------
    # FILTRE MEMBRE
    # --------------------------------------------------------

    if membre_id is not None:
        query = query.filter(
            Cotisation.membre_id == membre_id
        )

    # --------------------------------------------------------
    # FILTRE DATE
    # --------------------------------------------------------

    if date_debut is not None:
        query = query.filter(
            Cotisation.date_cotisation >= date_debut
        )

    if date_fin is not None:
        query = query.filter(
            Cotisation.date_cotisation <= date_fin
        )

    # --------------------------------------------------------
    # FILTRE MOIS
    # --------------------------------------------------------

    if mois_concerne is not None:
        query = query.filter(
            Cotisation.mois_concerne
            == mois_concerne.strip()
        )

    # --------------------------------------------------------
    # FILTRE ANNÉE
    # --------------------------------------------------------

    if annee is not None:
        query = query.filter(
            Cotisation.annee == annee
        )

    # --------------------------------------------------------
    # RÉSULTATS
    # --------------------------------------------------------

    cotisations = (
        query
        .order_by(
            Cotisation.annee.desc(),
            Cotisation.date_cotisation.desc(),
            Cotisation.id.desc(),
        )
        .all()
    )

    resultat = []

    total = 0
    total_cotise = 0
    total_du = 0

    for cotisation in cotisations:

        data = construire_cotisation(
            cotisation,
            db,
        )

        resultat.append(data)

        total += data["montant"]
        total_cotise += data["montant_cotise"]
        total_du += data["montant_du"]

    return {
        "message": "Lecture réussie",

        "nombre":
            len(resultat),

        "total":
            total,

        "total_cotise":
            total_cotise,

        "total_du":
            total_du,

        "cotisations":
            resultat,
    }


# ============================================================
# CONSULTER UNE COTISATION
# ============================================================

@router.get("/{cotisation_id}")
def obtenir_cotisation(
    cotisation_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission(
            "COTISATION_CONSULTER"
        )
    ),
):

    cotisation = (
        db.query(Cotisation)
        .filter(
            Cotisation.id == cotisation_id,
            Cotisation.actif.is_(True),
        )
        .first()
    )

    if not cotisation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cotisation introuvable.",
        )

    return construire_cotisation(
        cotisation,
        db,
    )