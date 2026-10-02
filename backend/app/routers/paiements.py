from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import require_permission

from app.models.paiement import Paiement
from app.models.cotisation import Cotisation
from app.models.membre import Membre

from app.services.notification_service import creer_notification
from app.services.notifications_push import envoyer_notification_push


router = APIRouter(
    prefix="/paiements",
    tags=["Paiements"],
)


# ============================================================
# UTILITAIRE
# ============================================================

def calculer_statut(
    montant: float,
    montant_du: float,
) -> str:
    """
    Détermine le statut d'une cotisation à partir du
    montant initial et du reste à payer.
    """

    montant_paye = montant - montant_du

    if montant_paye <= 0:
        return "Impayée"

    if montant_du <= 0:
        return "Payée"

    return "Partiellement payée"


# ============================================================
# NOTIFICATION DU PAIEMENT
# ============================================================

def notifier_paiement(
    db: Session,
    paiement: Paiement,
    cotisation: Cotisation,
    membre: Membre,
) -> dict | None:
    """
    Crée une notification personnelle après l'enregistrement
    d'un paiement puis tente d'envoyer le push Firebase.

    IMPORTANT :
    - Le paiement doit déjà être enregistré en base.
    - Une erreur Firebase ne doit jamais annuler le paiement.
    - La notification reste disponible dans l'application
      même si le push échoue.
    """

    utilisateur = getattr(
        membre,
        "utilisateur",
        None,
    )

    if not utilisateur:
        return None

    if not utilisateur.actif:
        return None

    montant_paiement = float(
        paiement.montant or 0
    )

    montant_du = float(
        cotisation.montant_du or 0
    )

    mois = cotisation.mois_concerne
    annee = cotisation.annee

    # --------------------------------------------------------
    # COTISATION ENTIÈREMENT SOLDÉE
    # --------------------------------------------------------

    if montant_du <= 0:

        titre = "Cotisation soldée"

        message = (
            f"Votre paiement de "
            f"{montant_paiement:.0f} FCFA a bien été enregistré. "
            f"Votre cotisation de {mois} {annee} "
            f"est maintenant entièrement soldée. "
            f"Merci."
        )

    # --------------------------------------------------------
    # COTISATION ENCORE PARTIELLEMENT PAYÉE
    # --------------------------------------------------------

    else:

        titre = "Paiement enregistré"

        message = (
            f"Votre paiement de "
            f"{montant_paiement:.0f} FCFA pour votre "
            f"cotisation de {mois} {annee} "
            f"a bien été enregistré. "
            f"Reste à payer : {montant_du:.0f} FCFA."
        )

    # --------------------------------------------------------
    # CRÉER LA NOTIFICATION
    # --------------------------------------------------------

    notification = creer_notification(
        db=db,
        utilisateur_id=utilisateur.id,
        titre=titre,
        message=message,
        type="COTISATION",
        route="/cotisations",
    )

    try:

        # La notification doit être enregistrée avant
        # de tenter le push Firebase.
        db.commit()

        db.refresh(notification)

    except Exception as error:

        db.rollback()

        print(
            "ERREUR CRÉATION NOTIFICATION PAIEMENT :",
            error,
        )

        return None

    # --------------------------------------------------------
    # ENVOYER LE PUSH
    # --------------------------------------------------------

    try:

        resultat_push = envoyer_notification_push(
            notification=notification,
            db=db,
        )

        return resultat_push

    except Exception as error:

        # IMPORTANT :
        # Le paiement et la notification restent enregistrés.
        print(
            "ERREUR PUSH NOTIFICATION PAIEMENT :",
            error,
        )

        return {
            "envoyes": 0,
            "echecs": 1,
            "appareils": 0,
            "message": "Notification enregistrée, mais push Firebase échoué.",
        }


# ============================================================
# CRÉER UN PAIEMENT
# ============================================================

@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
)
def creer_paiement(
    cotisation_id: int,
    montant: float,
    mode_paiement: str = "espèce",
    date_paiement: date | None = None,
    reference: str | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("PAIEMENT_CREER")
    ),
):

    # --------------------------------------------------------
    # VALIDATION DU MONTANT
    # --------------------------------------------------------

    if montant <= 0:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Le montant du paiement doit "
                "être supérieur à zéro."
            ),
        )

    # --------------------------------------------------------
    # VALIDATION DU MODE DE PAIEMENT
    # --------------------------------------------------------

    mode_paiement = (
        mode_paiement.strip()
        if mode_paiement
        else ""
    )

    if not mode_paiement:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le mode de paiement est obligatoire.",
        )

    # --------------------------------------------------------
    # RECHERCHER LA COTISATION
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
    # RECHERCHER LE MEMBRE
    # --------------------------------------------------------

    membre = (
        db.query(Membre)
        .filter(
            Membre.id == cotisation.membre_id,
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
    # CALCUL DU RESTE ACTUEL
    # --------------------------------------------------------

    montant_du_actuel = float(
        cotisation.montant_du
    )

    # --------------------------------------------------------
    # COTISATION DÉJÀ PAYÉE
    # --------------------------------------------------------

    if montant_du_actuel <= 0:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Cette cotisation est déjà "
                "entièrement payée."
            ),
        )

    # --------------------------------------------------------
    # EMPÊCHER LE SURPAIEMENT
    # --------------------------------------------------------

    if montant > montant_du_actuel:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Le montant maximum autorisé est "
                f"{montant_du_actuel:.0f} FCFA."
            ),
        )

    # --------------------------------------------------------
    # NOUVEAU RESTE
    # --------------------------------------------------------

    nouveau_montant_du = (
        montant_du_actuel - montant
    )

    nouveau_montant_du = max(
        0,
        nouveau_montant_du,
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
            date_paiement
            or date.today()
        ),
        reference=reference,
    )

    db.add(paiement)

    # --------------------------------------------------------
    # METTRE À JOUR LA COTISATION
    # --------------------------------------------------------

    cotisation.montant_du = (
        nouveau_montant_du
    )

    # --------------------------------------------------------
    # ENREGISTRER LE PAIEMENT
    # --------------------------------------------------------

    try:

        db.commit()

        db.refresh(paiement)
        db.refresh(cotisation)

    except IntegrityError:

        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Impossible d'enregistrer "
                "le paiement."
            ),
        )

    # --------------------------------------------------------
    # CALCUL DU STATUT
    # --------------------------------------------------------

    montant_cotise = (
        float(cotisation.montant)
        - float(cotisation.montant_du)
    )

    statut = calculer_statut(
        float(cotisation.montant),
        float(cotisation.montant_du),
    )

    # --------------------------------------------------------
    # NOTIFICATION PERSONNELLE + PUSH
    # --------------------------------------------------------

    resultat_notification = notifier_paiement(
        db=db,
        paiement=paiement,
        cotisation=cotisation,
        membre=membre,
    )

    # --------------------------------------------------------
    # RÉPONSE
    # --------------------------------------------------------

    return {
        "message": "Paiement enregistré avec succès.",

        "paiement": {
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

            "actif":
                paiement.actif,
        },

        "cotisation": {
            "id": cotisation.id,

            "membre_id":
                cotisation.membre_id,

            "montant":
                float(cotisation.montant),

            "montant_cotise":
                montant_cotise,

            "montant_du":
                float(cotisation.montant_du),

            "mois_concerne":
                cotisation.mois_concerne,

            "annee":
                cotisation.annee,

            "date_cotisation":
                cotisation.date_cotisation,

            "statut":
                statut,
        },

        "notification": {
            "envoyee": (
                resultat_notification is not None
            ),
            "push": resultat_notification,
        },
    }


# ============================================================
# LISTER LES PAIEMENTS
# ============================================================

@router.get("")
def lister_paiements(
    membre_id: int | None = None,
    cotisation_id: int | None = None,
    date_debut: date | None = None,
    date_fin: date | None = None,
    mode_paiement: str | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission(
            "PAIEMENT_CONSULTER"
        )
    ),
):

    query = (
        db.query(Paiement)
        .filter(
            Paiement.actif.is_(True)
        )
    )

    # --------------------------------------------------------
    # FILTRE MEMBRE
    # --------------------------------------------------------

    if membre_id is not None:

        query = query.filter(
            Paiement.membre_id == membre_id
        )

    # --------------------------------------------------------
    # FILTRE COTISATION
    # --------------------------------------------------------

    if cotisation_id is not None:

        query = query.filter(
            Paiement.cotisation_id
            == cotisation_id
        )

    # --------------------------------------------------------
    # FILTRE DATE
    # --------------------------------------------------------

    if date_debut is not None:

        query = query.filter(
            Paiement.date_paiement
            >= date_debut
        )

    if date_fin is not None:

        query = query.filter(
            Paiement.date_paiement
            <= date_fin
        )

    # --------------------------------------------------------
    # FILTRE MODE
    # --------------------------------------------------------

    if mode_paiement:

        query = query.filter(
            Paiement.mode_paiement
            == mode_paiement.strip()
        )

    # --------------------------------------------------------
    # RÉSULTATS
    # --------------------------------------------------------

    paiements = (
        query
        .order_by(
            Paiement.date_paiement.desc(),
            Paiement.id.desc(),
        )
        .all()
    )

    # --------------------------------------------------------
    # TOTAL
    # --------------------------------------------------------

    total = sum(
        float(paiement.montant)
        for paiement in paiements
    )

    resultat = []

    for paiement in paiements:

        cotisation = (
            db.query(Cotisation)
            .filter(
                Cotisation.id
                == paiement.cotisation_id
            )
            .first()
        )

        resultat.append({
            "id":
                paiement.id,

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

            "actif":
                paiement.actif,

            "cotisation": (
                {
                    "id":
                        cotisation.id,

                    "montant":
                        float(cotisation.montant),

                    "montant_du":
                        float(
                            cotisation.montant_du
                        ),

                    "mois_concerne":
                        cotisation.mois_concerne,

                    "annee":
                        cotisation.annee,

                    "date_cotisation":
                        cotisation.date_cotisation,

                    "statut":
                        calculer_statut(
                            float(
                                cotisation.montant
                            ),
                            float(
                                cotisation.montant_du
                            ),
                        ),
                }
                if cotisation
                else None
            ),
        })

    return {
        "message": "Lecture réussie.",

        "nombre":
            len(resultat),

        "total":
            total,

        "paiements":
            resultat,
    }


# ============================================================
# CONSULTER UN PAIEMENT
# ============================================================

@router.get("/{paiement_id}")
def obtenir_paiement(
    paiement_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission(
            "PAIEMENT_CONSULTER"
        )
    ),
):

    paiement = (
        db.query(Paiement)
        .filter(
            Paiement.id == paiement_id,
            Paiement.actif.is_(True),
        )
        .first()
    )

    if not paiement:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paiement introuvable.",
        )

    cotisation = (
        db.query(Cotisation)
        .filter(
            Cotisation.id
            == paiement.cotisation_id
        )
        .first()
    )

    membre = (
        db.query(Membre)
        .filter(
            Membre.id
            == paiement.membre_id
        )
        .first()
    )

    return {
        "id":
            paiement.id,

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

        "actif":
            paiement.actif,

        "membre": (
            {
                "id": membre.id,
                "nom": membre.nom,
                "prenom": membre.prenom,
                "telephone": membre.telephone,
            }
            if membre
            else None
        ),

        "cotisation": (
            {
                "id": cotisation.id,

                "montant":
                    float(cotisation.montant),

                "montant_du":
                    float(
                        cotisation.montant_du
                    ),

                "montant_cotise":
                    float(cotisation.montant)
                    - float(
                        cotisation.montant_du
                    ),

                "mois_concerne":
                    cotisation.mois_concerne,

                "annee":
                    cotisation.annee,

                "date_cotisation":
                    cotisation.date_cotisation,

                "statut":
                    calculer_statut(
                        float(
                            cotisation.montant
                        ),
                        float(
                            cotisation.montant_du
                        ),
                    ),
            }
            if cotisation
            else None
        ),
    }