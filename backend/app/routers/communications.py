from datetime import datetime, timezone
import asyncio

import cloudinary
import cloudinary.uploader

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import require_permission
from app.core.config import settings
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
# CONFIGURATION CLOUDINARY
# ============================================================

cloudinary.config(
    cloud_name=settings.cloudinary_cloud_name,
    api_key=settings.cloudinary_api_key,
    api_secret=settings.cloudinary_api_secret,
    secure=True,
)


DOSSIER_CLOUDINARY_AUDIO = "dahira/communications"

# Limite actuelle du compte Cloudinary utilisée par le projet.
TAILLE_MAX_AUDIO = 10 * 1024 * 1024


TYPES_AUDIO_AUTORISES = {
    "audio/webm",
    "audio/webm;codecs=opus",
    "audio/ogg",
    "audio/ogg;codecs=opus",
    "audio/mp4",
    "audio/mpeg",
    "audio/wav",
    "audio/x-wav",
}


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
    Convertit une date en UTC sans timezone.

    Le modèle Communication utilise actuellement :

        DateTime

    et non :

        DateTime(timezone=True)

    On conserve donc des datetime naïfs représentant UTC.
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

    Règles :

    - BROUILLON -> BROUILLON
    - ANNULEE -> ANNULEE
    - date future -> PROGRAMMEE
    - date absente/passée -> PUBLIEE
    """

    maintenant = maintenant_utc()

    # --------------------------------------------------------
    # Statuts explicitement demandés
    # --------------------------------------------------------

    if statut_demande in {
        STATUT_BROUILLON,
        STATUT_ANNULEE,
    }:
        return statut_demande

    # --------------------------------------------------------
    # Normalisation date
    # --------------------------------------------------------

    date_publication = normaliser_datetime_utc(
        date_publication
    )

    # --------------------------------------------------------
    # Date future
    # --------------------------------------------------------

    if (
        date_publication is not None
        and date_publication > maintenant
    ):
        return STATUT_PROGRAMMEE

    # --------------------------------------------------------
    # Publication immédiate
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

    Le détail de l'envoi est géré par :

        envoyer_communication_push(communication, db)

    Retourne True si le service d'envoi s'exécute
    sans exception.
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
# UPLOAD MESSAGE VOCAL
# ============================================================

@router.post("/audio")
async def uploader_audio_communication(
    fichier: UploadFile = File(...),
    current_user=Depends(
        require_permission("COMMUNICATION_CREER")
    ),
):
    """
    Téléverse un message vocal vers Cloudinary.

    Formats autorisés :

    - WebM
    - OGG
    - MP4
    - MP3
    - WAV

    Taille maximale : 10 Mo.
    """

    # --------------------------------------------------------
    # Type MIME
    # --------------------------------------------------------

    type_contenu = (
        fichier.content_type or ""
    ).lower().strip()

    types_audio_acceptes = {
        "audio/webm",
        "audio/ogg",
        "audio/mp4",
        "audio/mpeg",
        "audio/wav",
        "audio/x-wav",
    }

    if not (
        type_contenu in types_audio_acceptes
        or type_contenu.startswith("audio/webm")
        or type_contenu.startswith("audio/ogg")
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Format audio non autorisé : {fichier.content_type}. "
                "Utilisez WebM, OGG, MP4, MP3 ou WAV."
            ),
        )

    # --------------------------------------------------------
    # Lecture
    # --------------------------------------------------------

    contenu = await fichier.read()

    if not contenu:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le fichier audio est vide.",
        )

    # --------------------------------------------------------
    # Taille
    # --------------------------------------------------------

    if len(contenu) > TAILLE_MAX_AUDIO:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=(
                "Le message vocal ne doit pas dépasser 10 Mo."
            ),
        )

    # --------------------------------------------------------
    # Upload Cloudinary
    # --------------------------------------------------------

    try:
        resultat = await asyncio.to_thread(
            cloudinary.uploader.upload,
            contenu,
            resource_type="video",
            folder=DOSSIER_CLOUDINARY_AUDIO,
            use_filename=False,
            unique_filename=True,
        )

    except Exception as erreur:
        print(
            "ERREUR UPLOAD AUDIO COMMUNICATION :",
            erreur,
        )

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=(
                "Impossible d'envoyer le message vocal "
                "vers Cloudinary."
            ),
        ) from erreur

    # --------------------------------------------------------
    # URL Cloudinary
    # --------------------------------------------------------

    audio_url = resultat.get("secure_url")

    if not audio_url:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=(
                "Cloudinary n'a pas retourné "
                "l'URL du message vocal."
            ),
        )

    return {
        "audio_url": audio_url,
        "public_id": resultat.get("public_id"),
        "format": resultat.get("format"),
        "resource_type": resultat.get("resource_type"),
        "bytes": resultat.get("bytes"),
    }


# ============================================================
# LISTE DES COMMUNICATIONS
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
        require_permission(
            "COMMUNICATION_CONSULTER"
        )
    ),
):
    """
    Liste les communications avec filtres.
    """

    query = db.query(Communication)

    # --------------------------------------------------------
    # Filtre actif
    # --------------------------------------------------------

    if actif is not None:
        query = query.filter(
            Communication.actif == actif
        )

    # --------------------------------------------------------
    # Filtre type
    # --------------------------------------------------------

    if type_communication:
        query = query.filter(
            Communication.type_communication
            == type_communication
        )

    # --------------------------------------------------------
    # Filtre priorité
    # --------------------------------------------------------

    if priorite:
        query = query.filter(
            Communication.priorite == priorite
        )

    # --------------------------------------------------------
    # Filtre statut
    # --------------------------------------------------------

    if statut_communication:

        statut_communication = (
            statut_communication.upper().strip()
        )

        if (
            statut_communication
            not in STATUTS_VALIDES
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Statut de communication invalide."
                ),
            )

        query = query.filter(
            Communication.statut
            == statut_communication
        )

    # --------------------------------------------------------
    # Récupération
    # --------------------------------------------------------

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
        require_permission(
            "COMMUNICATION_CONSULTER"
        )
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
# CRÉER UNE COMMUNICATION
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
        require_permission(
            "COMMUNICATION_CREER"
        )
    ),
):
    """
    Crée une communication.

    Une communication peut contenir :

    - uniquement du texte ;
    - uniquement un vocal ;
    - du texte + un vocal.

    Elle ne peut pas être vide.

    Comportement :

    - date future -> PROGRAMMEE
    - date absente/passée -> PUBLIEE
    - BROUILLON -> BROUILLON
    - ANNULEE -> ANNULEE
    """

    # --------------------------------------------------------
    # Vérification texte / vocal
    # --------------------------------------------------------

    contenu = (
        donnees.contenu or ""
    ).strip()

    audio_url = (
        donnees.audio_url or ""
    ).strip() or None

    if not contenu and not audio_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "La communication doit contenir "
                "un message texte ou un message vocal."
            ),
        )

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
    # Détermination statut
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

        contenu=(
            contenu
            if contenu
            else None
        ),

        audio_url=audio_url,

        type_communication=(
            donnees.type_communication
        ),

        priorite=(
            donnees.priorite
        ),

        date_publication=(
            date_publication
        ),

        date_expiration=(
            date_expiration
        ),

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
# MODIFIER UNE COMMUNICATION
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
        require_permission(
            "COMMUNICATION_MODIFIER"
        )
    ),
):
    """
    Modifie une communication.

    Gère :

    - texte ;
    - vocal ;
    - texte + vocal ;
    - programmation ;
    - publication ;
    - expiration ;
    - brouillon ;
    - annulation.

    Lors d'une modification :

    - audio_url absent = ancien vocal conservé ;
    - audio_url null = vocal supprimé ;
    - texte absent = ancien texte conservé ;
    - contenu null = texte supprimé.

    Une communication doit toujours contenir au moins
    un texte ou un vocal après modification.
    """

    # --------------------------------------------------------
    # Recherche
    # --------------------------------------------------------

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

    ancien_push_envoye = (
        communication.push_envoye
    )

    # --------------------------------------------------------
    # Champs simples
    # --------------------------------------------------------

    if donnees.titre is not None:

        communication.titre = (
            donnees.titre.strip()
        )

    # --------------------------------------------------------
    # CONTENU
    #
    # Important :
    # il faut utiliser model_fields_set.
    #
    # Pourquoi ?
    #
    # - champ absent -> on conserve le texte actuel ;
    # - contenu=null -> on supprime explicitement le texte ;
    # --------------------------------------------------------

    if "contenu" in donnees.model_fields_set:

        communication.contenu = (
            donnees.contenu.strip()
            if donnees.contenu
            else None
        )

    # --------------------------------------------------------
    # AUDIO
    #
    # - champ absent -> conservation du vocal actuel ;
    # - audio_url=null -> suppression du vocal ;
    # --------------------------------------------------------

    if "audio_url" in donnees.model_fields_set:

        communication.audio_url = (
            donnees.audio_url.strip()
            if donnees.audio_url
            else None
        )

    # --------------------------------------------------------
    # Type
    # --------------------------------------------------------

    if donnees.type_communication is not None:

        communication.type_communication = (
            donnees.type_communication
        )

    # --------------------------------------------------------
    # Priorité
    # --------------------------------------------------------

    if donnees.priorite is not None:

        communication.priorite = (
            donnees.priorite
        )

    # --------------------------------------------------------
    # Dates
    # --------------------------------------------------------

    if "date_publication" in donnees.model_fields_set:

        date_publication = normaliser_datetime_utc(
            donnees.date_publication
        )

    if "date_expiration" in donnees.model_fields_set:

        date_expiration = normaliser_datetime_utc(
            donnees.date_expiration
        )

    # --------------------------------------------------------
    # Date publication
    # --------------------------------------------------------

    if date_publication is not None:

        communication.date_publication = (
            date_publication
        )

    # --------------------------------------------------------
    # Date expiration
    # --------------------------------------------------------

    communication.date_expiration = (
        date_expiration
    )

    # --------------------------------------------------------
    # Vérification dates
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
    # Vérification texte / vocal
    # --------------------------------------------------------

    contenu_final = (
        communication.contenu or ""
    ).strip()

    audio_final = (
        communication.audio_url or ""
    ).strip()

    if not contenu_final and not audio_final:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "La communication doit contenir "
                "un message texte ou un message vocal."
            ),
        )

    # --------------------------------------------------------
    # Statut demandé
    # --------------------------------------------------------

    statut_demande = donnees.statut

    if statut_demande is not None:

        statut_demande = (
            statut_demande.upper().strip()
        )

        if statut_demande not in STATUTS_VALIDES:

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Statut de communication invalide."
                ),
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
        nouveau_statut = (
            determiner_statut_creation(
                date_publication,
                None,
            )
        )

    communication.statut = nouveau_statut

    # --------------------------------------------------------
    # Actif
    # --------------------------------------------------------

    if donnees.actif is not None:

        communication.actif = (
            donnees.actif
        )

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
    # PUSH
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
        require_permission(
            "COMMUNICATION_MODIFIER"
        )
    ),
):
    """
    Active ou désactive une communication.

    Règles :

    - une communication normale peut être activée/désactivée ;
    - une communication ANNULEE ne peut pas être réactivée
      avec cette route ;
    - une communication EXPIREE peut être réactivée si
      son expiration n'est plus dépassée ;
    - lors d'une réactivation d'une communication expirée,
      le statut devient PUBLIEE.
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

        date_expiration = (
            normaliser_datetime_utc(
                communication.date_expiration
            )
        )

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

        # ----------------------------------------------------
        # Vérification contenu
        # ----------------------------------------------------

        if (
            not (communication.contenu or "").strip()
            and not communication.audio_url
        ):

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "La communication doit contenir "
                    "un message texte ou un message vocal."
                ),
            )

        communication.statut = (
            STATUT_PUBLIEE
        )

        communication.actif = True

        communication.push_envoye = False

        db.commit()
        db.refresh(communication)

        # ----------------------------------------------------
        # Push
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

    # Sécurité : on vérifie quand même qu'une communication
    # contient bien un texte ou un vocal.

    if (
        not (communication.contenu or "").strip()
        and not communication.audio_url
    ):

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "La communication doit contenir "
                "un message texte ou un message vocal."
            ),
        )

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
        require_permission(
            "COMMUNICATION_MODIFIER"
        )
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

    communication.statut = (
        STATUT_ANNULEE
    )

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
        require_permission(
            "COMMUNICATION_SUPPRIMER"
        )
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