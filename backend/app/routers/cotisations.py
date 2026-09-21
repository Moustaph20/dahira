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
# CONSTANTES
# ============================================================

MOIS_ORDRE = {
    "Janvier": 1,
    "Février": 2,
    "Mars": 3,
    "Avril": 4,
    "Mai": 5,
    "Juin": 6,
    "Juillet": 7,
    "Août": 8,
    "Septembre": 9,
    "Octobre": 10,
    "Novembre": 11,
    "Décembre": 12,
}


# ============================================================
# UTILITAIRES
# ============================================================

def normaliser_mois(mois: str) -> str:
    """
    Nettoie le nom du mois.
    """

    return (mois or "").strip()


def obtenir_numero_mois(mois: str) -> int | None:
    """
    Retourne le numéro correspondant au mois.
    """

    mois_normalise = normaliser_mois(mois)

    return MOIS_ORDRE.get(mois_normalise)


def obtenir_mois_precedent(
    mois: str,
    annee: int,
) -> tuple[str, int] | None:
    """
    Retourne le mois précédant le mois fourni.

    Exemple :
        Septembre 2026 -> Août 2026
        Janvier 2026  -> Décembre 2025
    """

    numero_mois = obtenir_numero_mois(mois)

    if numero_mois is None:
        return None

    if numero_mois == 1:
        return "Décembre", annee - 1

    mois_precedent_numero = numero_mois - 1

    for nom_mois, numero in MOIS_ORDRE.items():
        if numero == mois_precedent_numero:
            return nom_mois, annee

    return None


def obtenir_montant_paye(
    cotisation_id: int,
    db: Session,
) -> float:
    """
    Calcule le total réellement versé pour une cotisation
    à partir des paiements actifs associés.

    Important :
    un paiement représente une entrée d'argent réelle.
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

    Pour une cotisation à 0 :
        reste = 0
    """

    return max(
        0,
        float(montant or 0) - float(montant_paye or 0),
    )


def calculer_statut(
    montant: float,
    montant_paye: float,
) -> str:
    """
    Détermine le statut d'une cotisation.

    Cas particuliers :

    montant = 0
    paiement = 0
        -> Sans cotisation

    montant = 0
    paiement > 0
        -> Versement

    montant > 0
    paiement = 0
        -> Impayée

    montant > 0
    paiement < montant
        -> Partiellement payée

    montant > 0
    paiement >= montant
        -> Payée
    """

    montant = float(montant or 0)
    montant_paye = float(montant_paye or 0)

    # --------------------------------------------------------
    # MEMBRE SANS COTISATION FIXE
    # --------------------------------------------------------

    if montant <= 0:

        if montant_paye > 0:
            return "Versement"

        return "Sans cotisation"

    # --------------------------------------------------------
    # COTISATION NORMALE
    # --------------------------------------------------------

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

                "membre_id": paiement.membre_id,

                "cotisation_id": paiement.cotisation_id,

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


def obtenir_cotisation_precedente(
    membre_id: int,
    mois_concerne: str,
    annee: int,
    db: Session,
):
    """
    Recherche la cotisation du mois immédiatement précédent.

    Si elle n'existe pas, on retourne None.

    Le premier mois enregistré pour un membre n'est donc pas
    artificiellement bloqué.
    """

    precedent = obtenir_mois_precedent(
        mois_concerne,
        annee,
    )

    if precedent is None:
        return None

    mois_precedent, annee_precedente = precedent

    return (
        db.query(Cotisation)
        .filter(
            Cotisation.membre_id == membre_id,
            Cotisation.mois_concerne == mois_precedent,
            Cotisation.annee == annee_precedente,
            Cotisation.actif.is_(True),
        )
        .first()
    )


# ============================================================
# CRÉER UNE COTISATION
# ============================================================

@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
)
def creer_cotisation(
    membre_id: int,
    montant: float | None = None,
    mois_concerne: str = "",
    annee: int = 0,
    date_cotisation: date | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("COTISATION_CREER")
    ),
):

    # --------------------------------------------------------
    # VALIDATION MOIS
    # --------------------------------------------------------

    mois_concerne = normaliser_mois(
        mois_concerne
    )

    if not mois_concerne:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le mois concerné est obligatoire.",
        )

    if mois_concerne not in MOIS_ORDRE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Le mois concerné est invalide. "
                "Utilisez un mois valide."
            ),
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
    # MONTANT FIXE DU MEMBRE
    # --------------------------------------------------------
    #
    # Le frontend peut envoyer "montant", mais le backend
    # n'en fait PAS une source de vérité.
    #
    # La vraie valeur est :
    #
    # membre.montant_cotisation
    #
    # Cela garantit la cohérence.
    #

    montant_fixe = float(
        membre.montant_cotisation or 0
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
                "pour effectuer un versement."
            ),
        )

    # --------------------------------------------------------
    # CAS PARTICULIER :
    # MEMBRE AVEC COTISATION FIXE = 0
    # --------------------------------------------------------
    #
    # Il n'est jamais bloqué par la règle du mois précédent.
    #
    # Il peut avoir une cotisation mensuelle à 0 et effectuer
    # des versements volontaires.
    #

    if montant_fixe <= 0:

        montant_a_enregistrer = 0

    else:

        # ----------------------------------------------------
        # VÉRIFIER LE MOIS PRÉCÉDENT
        # ----------------------------------------------------

        cotisation_precedente = (
            obtenir_cotisation_precedente(
                membre_id=membre_id,
                mois_concerne=mois_concerne,
                annee=annee,
                db=db,
            )
        )

        # ----------------------------------------------------
        # SI LE MOIS PRÉCÉDENT EXISTE
        # ----------------------------------------------------

        if cotisation_precedente:

            montant_precedent = float(
                cotisation_precedente.montant or 0
            )

            montant_precedent_paye = (
                obtenir_montant_paye(
                    cotisation_precedente.id,
                    db,
                )
            )

            reste_precedent = calculer_reste(
                montant_precedent,
                montant_precedent_paye,
            )

            # ------------------------------------------------
            # MOIS PRÉCÉDENT NON SOLDÉ
            # ------------------------------------------------

            if reste_precedent > 0:

                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"La cotisation de "
                        f"{cotisation_precedente.mois_concerne} "
                        f"{cotisation_precedente.annee} "
                        "n'est pas encore soldée. "
                        f"Reste à payer : "
                        f"{reste_precedent:g} FCFA. "
                        "Vous devez d'abord solder cette "
                        "cotisation avant de passer au mois "
                        "suivant."
                    ),
                )

        # ----------------------------------------------------
        # LE MOIS PRÉCÉDENT EST SOLDÉ
        # ----------------------------------------------------

        montant_a_enregistrer = montant_fixe

    # --------------------------------------------------------
    # CRÉER LA COTISATION
    # --------------------------------------------------------

    cotisation = Cotisation(
        membre_id=membre_id,

        montant=montant_a_enregistrer,

        montant_du=montant_a_enregistrer,

        mois_concerne=mois_concerne,

        annee=annee,

        date_cotisation=(
            date_cotisation or date.today()
        ),
    )

    db.add(cotisation)

    try:

        db.flush()

        # ----------------------------------------------------
        # NOTIFICATION
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

            if montant_a_enregistrer > 0:

                message_notification = (
                    f"Votre cotisation du mois de "
                    f"{mois_concerne} {annee} a été créée "
                    f"pour un montant de "
                    f"{montant_a_enregistrer:g} FCFA. "
                    "Aucun paiement n'a encore été enregistré."
                )

            else:

                message_notification = (
                    f"La période de cotisation "
                    f"{mois_concerne} {annee} "
                    "a été enregistrée. "
                    "Votre cotisation fixe est de 0 FCFA. "
                    "Vous pouvez néanmoins effectuer "
                    "un versement volontaire."
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
        # COMMIT
        # ----------------------------------------------------

        db.commit()

        db.refresh(cotisation)

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

        "paiement": None,
    }


# ============================================================
# AJOUTER UN PAIEMENT
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

    # ========================================================
    # CAS 1 :
    # COTISATION FIXE > 0
    # ========================================================

    if montant_fixe > 0:

        # ----------------------------------------------------
        # EMPÊCHER PAIEMENT APRÈS PAIEMENT COMPLET
        # ----------------------------------------------------

        if reste <= 0:

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Cette cotisation est déjà "
                    "entièrement payée."
                ),
            )

        # ----------------------------------------------------
        # EMPÊCHER DE DÉPASSER LE RESTE
        # ----------------------------------------------------

        if montant > reste:

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Le paiement de {montant:g} FCFA "
                    f"dépasse le reste à payer de "
                    f"{reste:g} FCFA."
                ),
            )

    # ========================================================
    # CAS 2 :
    # COTISATION FIXE = 0
    # ========================================================
    #
    # AUCUNE LIMITE DE RESTE.
    #
    # Le paiement est un versement volontaire.
    #

    nouveau_total_paye = (
        montant_deja_paye + montant
    )

    nouveau_reste = calculer_reste(
        montant_fixe,
        nouveau_total_paye,
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
        # METTRE À JOUR LE RESTE
        # ----------------------------------------------------

        cotisation.montant_du = nouveau_reste

        # ----------------------------------------------------
        # NOTIFICATION
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

            if montant_fixe <= 0:

                message_notification = (
                    f"Votre versement de "
                    f"{montant:g} FCFA a été enregistré "
                    f"pour {cotisation.mois_concerne} "
                    f"{cotisation.annee}. "
                    f"Total versé sur cette période : "
                    f"{nouveau_total_paye:g} FCFA."
                )

            else:

                statut_apres_paiement = (
                    calculer_statut(
                        montant_fixe,
                        nouveau_total_paye,
                    )
                )

                if statut_apres_paiement == "Payée":

                    message_notification = (
                        f"Votre paiement de {montant:g} FCFA "
                        f"a été enregistré pour votre "
                        f"cotisation "
                        f"{cotisation.mois_concerne} "
                        f"{cotisation.annee}. "
                        "Votre cotisation est maintenant "
                        "entièrement payée."
                    )

                else:

                    message_notification = (
                        f"Votre paiement de {montant:g} FCFA "
                        f"a été enregistré pour votre "
                        f"cotisation "
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
        # COMMIT
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
# MEMBRES ACTIFS POUR LA GESTION DES COTISATIONS
# ============================================================

@router.get("/membres-actifs")
def lister_membres_actifs_pour_cotisations(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("COTISATION_CREER")
    ),
):
    """
    Retourne les membres actifs nécessaires à la gestion
    des cotisations.

    Cette route ne nécessite pas MEMBRE_CONSULTER.
    """

    membres = (
        db.query(Membre)
        .filter(
            Membre.actif.is_(True)
        )
        .order_by(
            Membre.nom.asc(),
            Membre.prenom.asc(),
        )
        .all()
    )

    return {
        "nombre": len(membres),

        "membres": [
            {
                "id": membre.id,

                "nom": membre.nom,

                "prenom": membre.prenom,

                "telephone": membre.telephone,

                "montant_cotisation": float(
                    membre.montant_cotisation or 0
                ),

                "actif": membre.actif,
            }
            for membre in membres
        ],
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