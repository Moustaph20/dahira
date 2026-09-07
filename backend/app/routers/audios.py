
from pathlib import Path
from uuid import uuid4

import asyncio
import cloudinary
import cloudinary.uploader

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from sqlalchemy.orm import Session, joinedload

from app.core.config import settings
from app.core.database import get_db
from app.core.permissions import require_permission

from app.models.audio import Audio
from app.models.khassida import Khassida
from app.models.ton import Ton


router = APIRouter(
    prefix="/audios",
    tags=["Audios"],
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


# ============================================================
# CONFIGURATION UPLOAD
# ============================================================

TAILLE_MAX = 100 * 1024 * 1024  # 100 MB

EXTENSIONS_AUTORISEES = {
    ".mp3",
    ".wav",
    ".m4a",
    ".ogg",
}

DOSSIER_CLOUDINARY = "dahira/audios"


# ============================================================
# FONCTIONS UTILITAIRES
# ============================================================

def est_url_cloudinary(fichier: str | None) -> bool:
    """
    Vérifie si le fichier enregistré est une URL Cloudinary.
    """

    if not fichier:
        return False

    return (
        fichier.startswith("https://res.cloudinary.com/")
        or fichier.startswith("http://res.cloudinary.com/")
    )


def extraire_public_id_cloudinary(
    url: str,
) -> str | None:
    """
    Extrait le public_id Cloudinary depuis une URL.

    Exemple :

    https://res.cloudinary.com/p2vtwfjz/video/upload/v123456789/dahira/audios/abc123.mp3

    devient :

    dahira/audios/abc123
    """

    if not est_url_cloudinary(url):
        return None

    try:
        partie = url.split("/video/upload/", 1)[1]

        morceaux = partie.split("/")

        # Retirer éventuellement la version :
        # v123456789
        if morceaux and morceaux[0].startswith("v"):
            morceaux = morceaux[1:]

        chemin = "/".join(morceaux)

        # Retirer l'extension
        public_id = str(
            Path(chemin).with_suffix("")
        )

        return public_id

    except Exception:
        return None


async def supprimer_cloudinary(
    fichier: str | None,
) -> None:
    """
    Supprime un fichier audio Cloudinary.

    Les anciens fichiers locaux sont simplement ignorés.
    """

    if not fichier:
        return

    public_id = extraire_public_id_cloudinary(
        fichier
    )

    if not public_id:
        return

    try:
        await asyncio.to_thread(
            cloudinary.uploader.destroy,
            public_id,
            resource_type="video",
            invalidate=True,
        )

    except Exception as exc:
        print(
            "Erreur suppression Cloudinary audio :",
            exc,
        )


async def uploader_audio_cloudinary(
    contenu: bytes,
) -> tuple[str, str]:
    """
    Upload un fichier audio sur Cloudinary.

    Retourne :

    (
        secure_url,
        public_id
    )
    """

    public_id = (
        f"{DOSSIER_CLOUDINARY}/"
        f"{uuid4().hex}"
    )

    try:
        resultat = await asyncio.to_thread(
            cloudinary.uploader.upload,
            contenu,
            resource_type="video",
            public_id=public_id,
            overwrite=False,
        )

    except Exception as exc:
        print(
            "Erreur Cloudinary upload audio :",
            exc,
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Impossible d'envoyer l'audio "
                "vers le stockage distant."
            ),
        )

    url_audio = resultat.get(
        "secure_url"
    )

    if not url_audio:
        # Nettoyage de sécurité
        try:
            await asyncio.to_thread(
                cloudinary.uploader.destroy,
                public_id,
                resource_type="video",
                invalidate=True,
            )
        except Exception:
            pass

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Cloudinary n'a pas retourné "
                "l'URL de l'audio."
            ),
        )

    return url_audio, public_id


async def lire_fichier_audio(
    fichier: UploadFile,
) -> bytes:
    """
    Lit le fichier par morceaux et vérifie
    qu'il ne dépasse pas 100 MB.
    """

    contenu = bytearray()

    while True:
        morceau = await fichier.read(
            1024 * 1024
        )

        if not morceau:
            break

        contenu.extend(morceau)

        if len(contenu) > TAILLE_MAX:
            raise HTTPException(
                status_code=(
                    status.HTTP_413_REQUEST_ENTITY_TOO_LARGE
                ),
                detail=(
                    "Le fichier audio ne doit "
                    "pas dépasser 100 MB."
                ),
            )

    if not contenu:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le fichier audio est vide.",
        )

    return bytes(contenu)


# ============================================================
# LISTER LES AUDIOS
#
# GET /audios
#
# Filtres :
#
# /audios?khassida_id=1
# /audios?ton_id=1
# /audios?khassida_id=1&ton_id=1
# ============================================================

@router.get(
    "",
)
def lister_audios(
    khassida_id: int | None = Query(
        default=None,
    ),
    ton_id: int | None = Query(
        default=None,
    ),
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("KOUREL_CONSULTER")
    ),
):
    requete = (
        db.query(Audio)
        .options(
            joinedload(Audio.khassida),
            joinedload(Audio.ton),
        )
        .join(
            Khassida,
            Audio.khassida_id == Khassida.id,
        )
        .join(
            Ton,
            Audio.ton_id == Ton.id,
        )
        .filter(
            Audio.actif.is_(True),
            Khassida.actif.is_(True),
            Ton.actif.is_(True),
        )
    )

    # --------------------------------------------------------
    # FILTRE KHASSIDA
    # --------------------------------------------------------

    if khassida_id is not None:
        requete = requete.filter(
            Audio.khassida_id == khassida_id
        )

    # --------------------------------------------------------
    # FILTRE TON
    # --------------------------------------------------------

    if ton_id is not None:
        requete = requete.filter(
            Audio.ton_id == ton_id
        )

    # --------------------------------------------------------
    # RÉCUPÉRATION
    # --------------------------------------------------------

    audios = (
        requete
        .order_by(
            Audio.titre.asc()
        )
        .all()
    )

    # --------------------------------------------------------
    # RÉPONSE
    # --------------------------------------------------------

    return [
        {
            "id": audio.id,
            "titre": audio.titre,
            "fichier": audio.fichier,
            "description": audio.description,
            "actif": audio.actif,

            "khassida": {
                "id": audio.khassida.id,
                "titre": audio.khassida.titre,
            }
            if audio.khassida
            else None,

            "ton": {
                "id": audio.ton.id,
                "nom": audio.ton.nom,
                "description": audio.ton.description,
            }
            if audio.ton
            else None,
        }
        for audio in audios
    ]


# ============================================================
# AJOUTER UN AUDIO
#
# POST /audios/
#
# Multipart/form-data
# ============================================================

@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
)
async def ajouter_audio(
    khassida_id: int = Form(...),
    ton_id: int = Form(...),
    titre: str = Form(...),
    description: str | None = Form(None),
    fichier: UploadFile = File(...),

    db: Session = Depends(get_db),

    current_user=Depends(
        require_permission("PROGRAMME_GERER")
    ),
):
    # ========================================================
    # VÉRIFIER LA KHASSIDA
    # ========================================================

    khassida = (
        db.query(Khassida)
        .filter(
            Khassida.id == khassida_id,
            Khassida.actif.is_(True),
        )
        .first()
    )

    if not khassida:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Khassida introuvable.",
        )

    # ========================================================
    # VÉRIFIER LE TON
    # ========================================================

    ton = (
        db.query(Ton)
        .filter(
            Ton.id == ton_id,
            Ton.actif.is_(True),
        )
        .first()
    )

    if not ton:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ton introuvable.",
        )

    # ========================================================
    # VÉRIFIER LE TITRE
    # ========================================================

    titre = titre.strip()

    if not titre:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le titre de l'audio est obligatoire.",
        )

    # ========================================================
    # VÉRIFIER LE FICHIER
    # ========================================================

    if not fichier.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le fichier audio est obligatoire.",
        )

    extension = Path(
        fichier.filename
    ).suffix.lower()

    if extension not in EXTENSIONS_AUTORISEES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Format audio non autorisé. "
                "Formats acceptés : MP3, WAV, M4A, OGG."
            ),
        )

    # ========================================================
    # LIRE LE FICHIER
    # ========================================================

    contenu = await lire_fichier_audio(
        fichier
    )

    # ========================================================
    # UPLOAD CLOUDINARY
    # ========================================================

    url_audio, public_id = (
        await uploader_audio_cloudinary(
            contenu
        )
    )

    # ========================================================
    # CRÉER L'AUDIO EN BASE
    # ========================================================

    audio = Audio(
        khassida_id=khassida_id,
        ton_id=ton_id,
        titre=titre,
        fichier=url_audio,
        description=(
            description.strip()
            if description
            else None
        ),
        actif=True,
    )

    try:
        db.add(audio)
        db.commit()
        db.refresh(audio)

    except Exception as exc:
        db.rollback()

        print(
            "Erreur DB ajout audio :",
            exc,
        )

        # ----------------------------------------------------
        # SUPPRIMER L'ASSET CLOUDINARY
        # ----------------------------------------------------

        try:
            await asyncio.to_thread(
                cloudinary.uploader.destroy,
                public_id,
                resource_type="video",
                invalidate=True,
            )
        except Exception as cleanup_error:
            print(
                "Erreur suppression Cloudinary "
                "après rollback :",
                cleanup_error,
            )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Impossible d'enregistrer "
                "l'audio dans la base de données."
            ),
        )

    # ========================================================
    # RÉPONSE
    # ========================================================

    return {
        "message": "Audio ajouté avec succès",

        "id": audio.id,

        "titre": audio.titre,

        "description": audio.description,

        "fichier": audio.fichier,

        "khassida": {
            "id": khassida.id,
            "titre": khassida.titre,
        },

        "ton": {
            "id": ton.id,
            "nom": ton.nom,
        },
    }


# ============================================================
# MODIFIER UN AUDIO
#
# PUT /audios/{audio_id}
#
# Le fichier est OPTIONNEL.
#
# Sans nouveau fichier :
#   → modification du titre/description uniquement
#
# Avec nouveau fichier :
#   → upload nouveau fichier Cloudinary
#   → mise à jour DB
#   → suppression ancien fichier Cloudinary
# ============================================================

@router.put(
    "/{audio_id}",
)
async def modifier_audio(
    audio_id: int,

    khassida_id: int | None = Form(None),
    ton_id: int | None = Form(None),
    titre: str | None = Form(None),
    description: str | None = Form(None),
    fichier: UploadFile | None = File(None),

    db: Session = Depends(get_db),

    current_user=Depends(
        require_permission("PROGRAMME_GERER")
    ),
):
    # ========================================================
    # RÉCUPÉRER L'AUDIO
    # ========================================================

    audio = (
        db.query(Audio)
        .filter(
            Audio.id == audio_id,
            Audio.actif.is_(True),
        )
        .first()
    )

    if not audio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audio introuvable.",
        )

    # ========================================================
    # ANCIENNES VALEURS
    # ========================================================

    ancien_fichier = audio.fichier
    ancien_titre = audio.titre
    ancienne_description = audio.description
    ancienne_khassida_id = audio.khassida_id
    ancien_ton_id = audio.ton_id

    nouveau_public_id = None
    nouvelle_url = None

    # ========================================================
    # KHASSIDA
    # ========================================================

    if khassida_id is not None:
        khassida = (
            db.query(Khassida)
            .filter(
                Khassida.id == khassida_id,
                Khassida.actif.is_(True),
            )
            .first()
        )

        if not khassida:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Khassida introuvable.",
            )

    else:
        khassida = (
            db.query(Khassida)
            .filter(
                Khassida.id == audio.khassida_id,
            )
            .first()
        )

    # ========================================================
    # TON
    # ========================================================

    if ton_id is not None:
        ton = (
            db.query(Ton)
            .filter(
                Ton.id == ton_id,
                Ton.actif.is_(True),
            )
            .first()
        )

        if not ton:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ton introuvable.",
            )

    else:
        ton = (
            db.query(Ton)
            .filter(
                Ton.id == audio.ton_id,
            )
            .first()
        )

    # ========================================================
    # TITRE
    # ========================================================

    if titre is not None:
        titre = titre.strip()

        if not titre:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Le titre de l'audio "
                    "est obligatoire."
                ),
            )

    # ========================================================
    # NOUVEAU FICHIER
    # ========================================================

    if fichier is not None:
        if not fichier.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Le fichier audio est invalide.",
            )

        extension = Path(
            fichier.filename
        ).suffix.lower()

        if extension not in EXTENSIONS_AUTORISEES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Format audio non autorisé. "
                    "Formats acceptés : "
                    "MP3, WAV, M4A, OGG."
                ),
            )

        contenu = await lire_fichier_audio(
            fichier
        )

        # ----------------------------------------------------
        # UPLOAD NOUVEAU CLOUDINARY
        # ----------------------------------------------------

        (
            nouvelle_url,
            nouveau_public_id,
        ) = await uploader_audio_cloudinary(
            contenu
        )

    # ========================================================
    # APPLIQUER LES MODIFICATIONS
    # ========================================================

    if khassida_id is not None:
        audio.khassida_id = khassida_id

    if ton_id is not None:
        audio.ton_id = ton_id

    if titre is not None:
        audio.titre = titre

    if description is not None:
        audio.description = (
            description.strip()
            if description.strip()
            else None
        )

    if nouvelle_url:
        audio.fichier = nouvelle_url

    # ========================================================
    # SAUVEGARDER LA BASE
    # ========================================================

    try:
        db.commit()
        db.refresh(audio)

    except Exception as exc:
        db.rollback()

        print(
            "Erreur DB modification audio :",
            exc,
        )

        # ----------------------------------------------------
        # LE NOUVEAU FICHIER N'A PAS PU ÊTRE ASSOCIÉ
        # À LA BASE → ON LE SUPPRIME
        # ----------------------------------------------------

        if nouveau_public_id:
            try:
                await asyncio.to_thread(
                    cloudinary.uploader.destroy,
                    nouveau_public_id,
                    resource_type="video",
                    invalidate=True,
                )
            except Exception as cleanup_error:
                print(
                    "Erreur nettoyage nouveau "
                    "fichier Cloudinary :",
                    cleanup_error,
                )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Impossible de modifier "
                "l'audio dans la base de données."
            ),
        )

    # ========================================================
    # SUPPRIMER L'ANCIEN FICHIER
    #
    # IMPORTANT :
    # uniquement après que la DB ait réussi.
    # ========================================================

    if (
        nouvelle_url
        and ancien_fichier != nouvelle_url
    ):
        await supprimer_cloudinary(
            ancien_fichier
        )

    # ========================================================
    # RÉPONSE
    # ========================================================

    return {
        "message": "Audio modifié avec succès",

        "id": audio.id,

        "titre": audio.titre,

        "description": audio.description,

        "fichier": audio.fichier,

        "khassida": {
            "id": khassida.id,
            "titre": khassida.titre,
        }
        if khassida
        else None,

        "ton": {
            "id": ton.id,
            "nom": ton.nom,
        }
        if ton
        else None,
    }


# ============================================================
# SUPPRIMER UN AUDIO
#
# DELETE /audios/{audio_id}
#
# Suppression logique en base
# + suppression du fichier Cloudinary
# ============================================================

@router.delete(
    "/{audio_id}",
)
async def supprimer_audio(
    audio_id: int,

    db: Session = Depends(get_db),

    current_user=Depends(
        require_permission("PROGRAMME_GERER")
    ),
):
    # ========================================================
    # RÉCUPÉRER L'AUDIO
    # ========================================================

    audio = (
        db.query(Audio)
        .filter(
            Audio.id == audio_id,
            Audio.actif.is_(True),
        )
        .first()
    )

    if not audio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audio introuvable.",
        )

    # ========================================================
    # CONSERVER LE FICHIER
    # ========================================================

    fichier_a_supprimer = audio.fichier

    # ========================================================
    # SUPPRESSION LOGIQUE
    #
    # On conserve l'enregistrement en DB.
    # ========================================================

    audio.actif = False

    try:
        db.commit()

    except Exception as exc:
        db.rollback()

        print(
            "Erreur DB suppression audio :",
            exc,
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Impossible de supprimer "
                "l'audio."
            ),
        )

    # ========================================================
    # SUPPRIMER LE FICHIER CLOUDINARY
    #
    # La DB est déjà correctement mise à jour.
    # ========================================================

    await supprimer_cloudinary(
        fichier_a_supprimer
    )

    # ========================================================
    # RÉPONSE
    # ========================================================

    return {
        "message": "Audio supprimé avec succès",
        "id": audio_id,
    }

