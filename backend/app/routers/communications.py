
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import require_permission
from app.models.communication import Communication
from app.schemas.communication import (
    CommunicationAnnulation,
    CommunicationCreate,
    CommunicationResponse,
    CommunicationStatutUpdate,
    CommunicationUpdate,
)
from app.services.notifications_push import (
    envoyer_communication_push,
)


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/communications",
    tags=["Communications"],
)


# ============================================================
# STATUTS
# ============================================================

STATUT_BROUILLON = "BROUILLON"
STATUT_PROGRAMMEE = "PROGRAMMEE"
STATUT_PUBLIEE = "PUBLIEE"
STATUT_EXPIREE = "EXPIREE"
STATUT_ANNULEE = "ANNULEE"

STATUTS_VALIDES = {
    STATUT_BROUILLON,
    STATUT_PROGRAMMEE,
    STATUT_PUBLIEE,
    STATUT_EXPIREE,
    STATUT_ANNULEE,
}


# ============================================================
# OUTILS DATETIME
# ============================================================

def normaliser_datetime_utc(
    valeur: datetime | None,
) -> datetime | None:
    """
    Convertit une date en UTC SANS timezone.

    Notre modèle Communication utilise actuellement :

        DateTime

    et non :

        DateTime(timezone=True)

    Nous conservons donc des datetime naïfs représentant UTC
    partout dans cette partie de l'application.

    - None -> None
    - datetime naïf -> considéré comme UTC
    - datetime timezone-aware -> converti en UTC puis rendu naïf
    """

    if valeur is None:
        return None

    if valeur.tzinfo is None:
        return valeur

    return valeur.astimezone(
        timezone.utc
    ).replace(
        tzinfo=None
    )


def maintenant_utc() -> datetime:
    """
    Retourne maintenant en UTC sous forme de datetime naïf.

    Compatible avec les colonnes SQLAlchemy DateTime
    actuellement utilisées par Communication.
    """

    return datetime.now(timezone.utc).replace(
        tzinfo=None
    )


# ============================================================
# DÉTERMINATION DU STATUT
# ============================================================

def determiner_statut_creation(
    date_publication: datetime | None,
    statut_demande: str | None,
) -> str:
    """
    Détermine automatiquement le statut d'une communication
    lors de sa création.
    """

    maintenant = maintenant_utc()

    # --------------------------------------------------------
    # Brouillon / annulation explicitement demandés
    # --------------------------------------------------------

    if statut_demande in {
        STATUT_BROUILLON,
        STATUT_ANNULEE,
    }:
        return statut_demande

    date_publication = normaliser_datetime_utc(
        date_publication
    )

    # --------------------------------------------------------
    # Date future = communication programmée
    # --------------------------------------------------------

    if (
        date_publication is not None
        and date_publication > maintenant
    ):
        return STATUT_PROGRAMMEE

    # --------------------------------------------------------
    # Date absente ou passée = publication immédiate
    # --------------------------------------------------------

    return STATUT_PUBLIEE


# ============================================================
# EXPIRATION
# ============================================================

def mettre_a_jour_expiration(
    communication: Communication,
) -> bool:
    """
    Vérifie si une communication doit être considérée
    comme expirée.

    Retourne True si une modification a été effectuée.
    """

    if communication.statut in {
        STATUT_BROUILLON,
        STATUT_ANNULEE,
        STATUT_EXPIREE,
    }:
        return False

    date_expiration = normaliser_datetime_utc(
        communication.date_expiration
    )

    if (
        date_expiration is not None
        and date_expiration <= maintenant_utc()
    ):
        communication.statut = STATUT_EXPIREE
        communication.actif = False

        return True

    return False


# ============================================================
# NOTIFICATION PUSH
# ============================================================

def envoyer_push_communication(
    communication: Communication,
    db: Session,
) -> bool:
    """
    Envoie la notification Firebase pour une communication.

    Utilise le véritable service Firebase du projet :

        envoyer_communication_push(communication, db)

    Retourne True si l'envoi du service push s'est exécuté
    sans lever d'exception.

    Le résultat détaillé du service Firebase est affiché dans
    les logs mais ne bloque pas la communication si aucun
    appareil n'est enregistré.
    """

    try:
        resultat = envoyer_communication_push(
            communication,
            db,
        )

        print(
            "Push communication :",
            resultat,
        )

        return True

    except Exception as erreur:
        print(
            "ERREUR ENVOI PUSH COMMUNICATION :",
            erreur,
        )

        return False


# ============================================================
# LISTE
# ============================================================

@router.get(
    "",
    response_model=list[CommunicationResponse],
)
def lister_communications(
    actif: bool | None = Query(
        default=None,
    ),
    type_communication: str | None = Query(
        default=None,
    ),
    priorite: str | None = Query(
        default=None,
    ),
    statut_communication: str | None = Query(
        default=None,
    ),
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("COMMUNICATION_CONSULTER")
    ),
):
    """
    Liste les communications avec filtres.
    """

    query = db.query(Communication)

    # --------------------------------------------------------
    # Filtres
    # --------------------------------------------------------

    if actif is not None:
        query = query.filter(
            Communication.actif == actif
        )

    if type_communication:
        query = query.filter(
            Communication.type_communication
            == type_communication
        )

    if priorite:
        query = query.filter(
            Communication.priorite == priorite
        )

    if statut_communication:

        if statut_communication not in STATUTS_VALIDES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Statut de communication invalide.",
            )

        query = query.filter(
            Communication.statut
            == statut_communication
        )

    communications = (
        query
        .order_by(
            Communication.date_publication.desc()
        )
        .all()
    )

    # --------------------------------------------------------
    # Mise à jour automatique des expirations
    # --------------------------------------------------------

    modifications = False

    for communication in communications:

        if mettre_a_jour_expiration(
            communication
        ):
            modifications = True

    if modifications:

        db.commit()

        for communication in communications:
            db.refresh(communication)

    return communications


# ============================================================
# OBTENIR UNE COMMUNICATION
# ============================================================

@router.get(
    "/{communication_id}",
    response_model=CommunicationResponse,
)
def obtenir_communication(
    communication_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("COMMUNICATION_CONSULTER")
    ),
):
    """
    Retourne une communication précise.
    """

    communication = (
        db.query(Communication)
        .filter(
            Communication.id == communication_id
        )
        .first()
    )

    if not communication:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Communication introuvable.",
        )

    # --------------------------------------------------------
    # Vérification expiration
    # --------------------------------------------------------

    if mettre_a_jour_expiration(
        communication
    ):
        db.commit()
        db.refresh(communication)

    return communication


# ============================================================
# CRÉER
# ============================================================

@router.post(
    "",
    response_model=CommunicationResponse,
    status_code=status.HTTP_201_CREATED,
)
def creer_communication(
    donnees: CommunicationCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("COMMUNICATION_CREER")
    ),
):
    """
    Crée une communication.

    Comportement :

    - date future -> PROGRAMMEE
    - date absente ou passée -> PUBLIEE
    - BROUILLON -> BROUILLON
    - ANNULEE -> ANNULEE

    Une notification Firebase est envoyée uniquement
    pour une communication publiée immédiatement.
    """

    # --------------------------------------------------------
    # Normalisation des dates
    # --------------------------------------------------------

    date_publication = normaliser_datetime_utc(
        donnees.date_publication
    )

    date_expiration = normaliser_datetime_utc(
        donnees.date_expiration
    )

    # --------------------------------------------------------
    # Vérification expiration
    # --------------------------------------------------------

    if (
        date_publication is not None
        and date_expiration is not None
        and date_expiration <= date_publication
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "La date d'expiration doit être "
                "postérieure à la date de publication."
            ),
        )

    # --------------------------------------------------------
    # Détermination du statut
    # --------------------------------------------------------

    statut = determiner_statut_creation(
        date_publication,
        donnees.statut,
    )

    # --------------------------------------------------------
    # Date par défaut
    # --------------------------------------------------------

    if date_publication is None:
        date_publication = maintenant_utc()

    # --------------------------------------------------------
    # Création
    # --------------------------------------------------------

    communication = Communication(
        titre=donnees.titre.strip(),
        contenu=donnees.contenu.strip(),
        type_communication=donnees.type_communication,
        priorite=donnees.priorite,
        date_publication=date_publication,
        date_expiration=date_expiration,
        statut=statut,
        actif=(
            False
            if statut in {
                STATUT_BROUILLON,
                STATUT_ANNULEE,
                STATUT_EXPIREE,
            }
            else donnees.actif
        ),
        push_envoye=False,
    )

    db.add(communication)

    db.commit()
    db.refresh(communication)

    # --------------------------------------------------------
    # PUSH IMMÉDIAT
    # --------------------------------------------------------

    if statut == STATUT_PUBLIEE:

        push_ok = envoyer_push_communication(
            communication,
            db,
        )

        if push_ok:

            communication.push_envoye = True

            db.commit()
            db.refresh(communication)

    return communication


# ============================================================
# MODIFIER
# ============================================================

@router.put(
    "/{communication_id}",
    response_model=CommunicationResponse,
)
def modifier_communication(
    communication_id: int,
    donnees: CommunicationUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("COMMUNICATION_MODIFIER")
    ),
):
    """
    Modifie une communication.

    Gère également le changement de date et donc
    le passage vers PROGRAMMEE ou PUBLIEE.
    """

    communication = (
        db.query(Communication)
        .filter(
            Communication.id == communication_id
        )
        .first()
    )

    if not communication:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Communication introuvable.",
        )

    # --------------------------------------------------------
    # Valeurs actuelles
    # --------------------------------------------------------

    date_publication = normaliser_datetime_utc(
        communication.date_publication
    )

    date_expiration = normaliser_datetime_utc(
        communication.date_expiration
    )

    ancien_statut = communication.statut
    ancien_push_envoye = communication.push_envoye

    # --------------------------------------------------------
    # Champs simples
    # --------------------------------------------------------

    if donnees.titre is not None:
        communication.titre = donnees.titre.strip()

    if donnees.contenu is not None:
        communication.contenu = donnees.contenu.strip()

    if donnees.type_communication is not None:
        communication.type_communication = (
            donnees.type_communication
        )

    if donnees.priorite is not None:
        communication.priorite = donnees.priorite

    # --------------------------------------------------------
    # Dates
    # --------------------------------------------------------

    if donnees.date_publication is not None:

        date_publication = normaliser_datetime_utc(
            donnees.date_publication
        )

    if donnees.date_expiration is not None:

        date_expiration = normaliser_datetime_utc(
            donnees.date_expiration
        )

    communication.date_publication = (
        date_publication
        if date_publication is not None
        else communication.date_publication
    )

    communication.date_expiration = date_expiration

    # --------------------------------------------------------
    # Vérification des dates
    # --------------------------------------------------------

    if (
        date_publication is not None
        and date_expiration is not None
        and date_expiration <= date_publication
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "La date d'expiration doit être "
                "postérieure à la date de publication."
            ),
        )

    # --------------------------------------------------------
    # Statut demandé
    # --------------------------------------------------------

    statut_demande = donnees.statut

    if statut_demande is not None:

        if statut_demande not in STATUTS_VALIDES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Statut de communication invalide.",
            )

    # --------------------------------------------------------
    # Détermination du nouveau statut
    # --------------------------------------------------------

    if statut_demande in {
        STATUT_BROUILLON,
        STATUT_ANNULEE,
    }:

        nouveau_statut = statut_demande

    elif statut_demande == STATUT_EXPIREE:

        nouveau_statut = STATUT_EXPIREE

    elif statut_demande == STATUT_PROGRAMMEE:

        if date_publication is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Une communication programmée doit "
                    "posséder une date de publication."
                ),
            )

        if date_publication <= maintenant_utc():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "La date d'une communication programmée "
                    "doit être dans le futur."
                ),
            )

        nouveau_statut = STATUT_PROGRAMMEE

    elif statut_demande == STATUT_PUBLIEE:

        nouveau_statut = STATUT_PUBLIEE

    else:

        # Aucun statut fourni :
        # détermination automatique.
        nouveau_statut = determiner_statut_creation(
            date_publication,
            None,
        )

    communication.statut = nouveau_statut

    # --------------------------------------------------------
    # Actif
    # --------------------------------------------------------

    if donnees.actif is not None:
        communication.actif = donnees.actif

    if nouveau_statut in {
        STATUT_BROUILLON,
        STATUT_ANNULEE,
        STATUT_EXPIREE,
    }:

        communication.actif = False

    elif nouveau_statut in {
        STATUT_PROGRAMMEE,
        STATUT_PUBLIEE,
    }:

        if donnees.actif is None:
            communication.actif = True

    # --------------------------------------------------------
    # Gestion du push
    # --------------------------------------------------------

    if nouveau_statut == STATUT_PROGRAMMEE:

        communication.push_envoye = False

    doit_envoyer_push = (
        nouveau_statut == STATUT_PUBLIEE
        and (
            ancien_statut != STATUT_PUBLIEE
            or not ancien_push_envoye
        )
    )

    # --------------------------------------------------------
    # Sauvegarde
    # --------------------------------------------------------

    db.commit()
    db.refresh(communication)

    # --------------------------------------------------------
    # Push
    # --------------------------------------------------------

    if doit_envoyer_push:

        push_ok = envoyer_push_communication(
            communication,
            db,
        )

        if push_ok:

            communication.push_envoye = True

            db.commit()
            db.refresh(communication)

    return communication


# ============================================================
# ACTIVER / DÉSACTIVER
# ============================================================


@router.patch(
    "/{communication_id}/statut",
    response_model=CommunicationResponse,
)
def modifier_statut_communication(
    communication_id: int,
    donnees: CommunicationStatutUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("COMMUNICATION_MODIFIER")
    ),
):
    """
    Active ou désactive une communication.

    Règles :

    - Une communication normale peut être activée/désactivée.
    - Une communication ANNULEE ne peut pas être réactivée
      par cette route.
    - Une communication EXPIREE peut être réactivée uniquement
      si sa date d'expiration est encore dans le futur ou si
      aucune date d'expiration n'est définie.
    - Lorsqu'une communication EXPIREE est réactivée,
      son statut redevient PUBLIEE.
    """

    communication = (
        db.query(Communication)
        .filter(
            Communication.id == communication_id
        )
        .first()
    )

    if not communication:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Communication introuvable.",
        )

    # ========================================================
    # DÉSACTIVATION
    # ========================================================

    if not donnees.actif:

        communication.actif = False

        db.commit()
        db.refresh(communication)

        return communication

    # ========================================================
    # RÉACTIVATION
    # ========================================================

    # Une communication annulée doit passer par
    # la modification explicite de son statut.
    if communication.statut == STATUT_ANNULEE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Une communication annulée ne peut pas être "
                "réactivée avec cette action."
            ),
        )

    # --------------------------------------------------------
    # Communication expirée
    # --------------------------------------------------------

    if communication.statut == STATUT_EXPIREE:

        date_expiration = normaliser_datetime_utc(
            communication.date_expiration
        )

        # Une expiration toujours passée ne peut pas
        # être contournée simplement en activant la communication.
        if (
            date_expiration is not None
            and date_expiration <= maintenant_utc()
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Cette communication est toujours expirée. "
                    "Modifiez d'abord sa date d'expiration vers "
                    "une date future avant de la réactiver."
                ),
            )

        # L'expiration n'est plus dépassée :
        # la communication peut redevenir publiée.
        communication.statut = STATUT_PUBLIEE
        communication.actif = True

        # Si aucun push n'a encore été envoyé pour cette
        # nouvelle publication, il sera envoyé.
        communication.push_envoye = False

        db.commit()
        db.refresh(communication)

        # ----------------------------------------------------
        # Push après réactivation
        # ----------------------------------------------------

        push_ok = envoyer_push_communication(
            communication,
            db,
        )

        if push_ok:
            communication.push_envoye = True

            db.commit()
            db.refresh(communication)

        return communication

    # ========================================================
    # AUTRES STATUTS
    # ========================================================

    communication.actif = True

    db.commit()
    db.refresh(communication)

    return communication



# ============================================================
# ANNULER UNE COMMUNICATION PROGRAMMÉE
# ============================================================

@router.patch(
    "/{communication_id}/annuler",
    response_model=CommunicationResponse,
)
def annuler_communication(
    communication_id: int,
    donnees: CommunicationAnnulation | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("COMMUNICATION_MODIFIER")
    ),
):
    """
    Annule une communication programmée.
    """

    communication = (
        db.query(Communication)
        .filter(
            Communication.id == communication_id
        )
        .first()
    )

    if not communication:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Communication introuvable.",
        )

    if communication.statut != STATUT_PROGRAMMEE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Seules les communications programmées "
                "peuvent être annulées."
            ),
        )

    communication.statut = STATUT_ANNULEE
    communication.actif = False
    communication.push_envoye = False

    db.commit()
    db.refresh(communication)

    return communication


# ============================================================
# SUPPRIMER
# ============================================================

@router.delete(
    "/{communication_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def supprimer_communication(
    communication_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("COMMUNICATION_SUPPRIMER")
    ),
):
    """
    Supprime définitivement une communication.
    """

    communication = (
        db.query(Communication)
        .filter(
            Communication.id == communication_id
        )
        .first()
    )

    if not communication:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Communication introuvable.",
        )

    db.delete(communication)
    db.commit()

    return None
