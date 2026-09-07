import asyncio
from pathlib import Path
from typing import Annotated
from urllib.parse import urlparse

import cloudinary
import cloudinary.uploader
from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    status,
)
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.permissions import require_permission
from app.models.galerie import Galerie
from app.schemas.galerie import (
    GalerieOrdreUpdate,
    GalerieResponse,
)


router = APIRouter(
    prefix="/galerie",
    tags=["Galerie"],
)


# ==========================================================
# CONFIGURATION CLOUDINARY
# ==========================================================

cloudinary.config(
    cloud_name=settings.cloudinary_cloud_name,
    api_key=settings.cloudinary_api_key,
    api_secret=settings.cloudinary_api_secret,
    secure=True,
)


# ==========================================================
# CONFIGURATION
# ==========================================================

TAILLE_MAX = 100 * 1024 * 1024  # 100 MB


EXTENSIONS_IMAGES = {
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".gif",
}


EXTENSIONS_VIDEOS = {
    ".mp4",
    ".webm",
    ".mov",
    ".m4v",
}


DOSSIER_CLOUDINARY = "dahira/galerie"


# ==========================================================
# UTILITAIRES
# ==========================================================

def determiner_type_media(filename: str) -> str:
    """
    Détermine si le fichier est une image ou une vidéo.
    """

    extension = Path(filename).suffix.lower()

    if extension in EXTENSIONS_IMAGES:
        return "image"

    if extension in EXTENSIONS_VIDEOS:
        return "video"

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=(
            "Format non supporté. "
            "Images acceptées : JPG, JPEG, PNG, WEBP, GIF. "
            "Vidéos acceptées : MP4, WEBM, MOV, M4V."
        ),
    )


def construire_url(galerie: Galerie) -> str:
    """
    Retourne directement l'URL Cloudinary du média.

    Pour les anciens médias encore enregistrés avec un chemin
    local, on conserve temporairement l'ancien endpoint.
    """

    chemin = galerie.chemin_fichier or ""

    if chemin.startswith("http://") or chemin.startswith("https://"):
        return chemin

    return f"/galerie/fichier/{galerie.id}"


def vers_response(galerie: Galerie) -> GalerieResponse:
    """
    Transforme un objet SQLAlchemy Galerie
    en réponse Pydantic.
    """

    return GalerieResponse(
        id=galerie.id,
        titre=galerie.titre,
        description=galerie.description,
        type_media=galerie.type_media,
        nom_fichier=galerie.nom_fichier,
        url=construire_url(galerie),
        ordre=galerie.ordre,
        actif=galerie.actif,
        created_at=galerie.created_at,
        updated_at=galerie.updated_at,
    )


def extraire_public_id_depuis_url(url: str) -> str | None:
    """
    Extrait le public_id Cloudinary depuis une URL Cloudinary.

    Exemple :

    https://res.cloudinary.com/demo/image/upload/v123456/
    dahira/galerie/abc123.jpg

    devient :

    dahira/galerie/abc123
    """

    if not url:
        return None

    if not (
        url.startswith("http://")
        or url.startswith("https://")
    ):
        return None

    try:
        parsed = urlparse(url)

        chemin = parsed.path.strip("/")

        morceaux = chemin.split("/")

        if "upload" not in morceaux:
            return None

        index_upload = morceaux.index("upload")

        apres_upload = morceaux[index_upload + 1 :]

        if not apres_upload:
            return None

        # Suppression de la version Cloudinary : v123456
        if apres_upload[0].startswith("v"):
            if apres_upload[0][1:].isdigit():
                apres_upload = apres_upload[1:]

        if not apres_upload:
            return None

        public_id_avec_extension = "/".join(
            apres_upload
        )

        extension = Path(
            public_id_avec_extension
        ).suffix

        if extension:
            public_id = (
                public_id_avec_extension[
                    :-len(extension)
                ]
            )
        else:
            public_id = public_id_avec_extension

        return public_id

    except Exception:
        return None


async def uploader_vers_cloudinary(
    fichier: UploadFile,
) -> tuple[str, str]:
    """
    Upload le fichier vers Cloudinary.

    Retourne :

        (type_media, url_cloudinary)
    """

    if not fichier.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Aucun fichier sélectionné.",
        )

    type_media = determiner_type_media(
        fichier.filename
    )

    extension = Path(
        fichier.filename
    ).suffix.lower()

    # ------------------------------------------------------
    # Vérification de la taille
    # ------------------------------------------------------

    contenu = bytearray()
    taille = 0

    try:

        while True:

            morceau = await fichier.read(
                1024 * 1024
            )

            if not morceau:
                break

            taille += len(morceau)

            if taille > TAILLE_MAX:

                raise HTTPException(
                    status_code=(
                        status.HTTP_413_REQUEST_ENTITY_TOO_LARGE
                    ),
                    detail=(
                        "Le fichier est trop volumineux. "
                        "Taille maximale : 100 MB."
                    ),
                )

            contenu.extend(morceau)

    finally:

        await fichier.close()

    # ------------------------------------------------------
    # Nom public unique
    # ------------------------------------------------------

    import uuid

    nom_public = (
        f"{uuid.uuid4().hex}{extension}"
    )

    public_id = (
        f"{DOSSIER_CLOUDINARY}/"
        f"{Path(nom_public).stem}"
    )

    # ------------------------------------------------------
    # Type de ressource Cloudinary
    # ------------------------------------------------------

    resource_type = (
        "image"
        if type_media == "image"
        else "video"
    )

    # ------------------------------------------------------
    # Upload Cloudinary
    # ------------------------------------------------------

    try:

        resultat = await asyncio.to_thread(
            cloudinary.uploader.upload,
            bytes(contenu),
            public_id=public_id,
            resource_type=resource_type,
            overwrite=False,
        )

    except Exception as exc:

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=(
                "Impossible d'envoyer le fichier "
                f"vers Cloudinary : {str(exc)}"
            ),
        ) from exc

    url = resultat.get("secure_url")

    if not url:

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=(
                "Cloudinary n'a pas retourné "
                "d'URL pour le fichier."
            ),
        )

    return type_media, url


def supprimer_fichier_cloudinary(
    url: str,
    type_media: str,
) -> None:
    """
    Supprime un média de Cloudinary à partir de son URL.
    """

    public_id = extraire_public_id_depuis_url(
        url
    )

    if not public_id:
        return

    resource_type = (
        "image"
        if type_media == "image"
        else "video"
    )

    try:

        cloudinary.uploader.destroy(
            public_id,
            resource_type=resource_type,
            invalidate=True,
        )

    except Exception:
        # Une erreur Cloudinary ne doit pas empêcher
        # la suppression de l'enregistrement DB.
        pass


# ==========================================================
# GALERIE PUBLIQUE
# ==========================================================

@router.get(
    "/public",
    response_model=list[GalerieResponse],
)
def galerie_publique(
    db: Session = Depends(get_db),
):
    """
    Retourne uniquement les médias actifs.
    """

    medias = (
        db.query(Galerie)
        .filter(
            Galerie.actif.is_(True)
        )
        .order_by(
            Galerie.ordre.asc(),
            Galerie.created_at.desc(),
        )
        .all()
    )

    return [
        vers_response(media)
        for media in medias
    ]


# ==========================================================
# RÉCUPÉRER UN FICHIER
# ==========================================================

@router.get(
    "/fichier/{galerie_id}",
)
def recuperer_fichier(
    galerie_id: int,
    db: Session = Depends(get_db),
):
    """
    Ancien endpoint conservé pour compatibilité.

    Pour les nouveaux médias Cloudinary, on redirige
    directement vers l'URL Cloudinary.

    Pour les anciens médias locaux, on essaie encore
    de récupérer le fichier sur le disque.
    """

    galerie = (
        db.query(Galerie)
        .filter(
            Galerie.id == galerie_id
        )
        .first()
    )

    if not galerie:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Média introuvable.",
        )

    chemin = galerie.chemin_fichier or ""

    # ------------------------------------------------------
    # Nouveau média Cloudinary
    # ------------------------------------------------------

    if chemin.startswith(
        "http://"
    ) or chemin.startswith(
        "https://"
    ):

        return RedirectResponse(
            url=chemin,
            status_code=status.HTTP_307_TEMPORARY_REDIRECT,
        )

    # ------------------------------------------------------
    # Ancien média local
    # ------------------------------------------------------

    chemin_local = Path(chemin)

    if not chemin_local.exists():

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                "Fichier introuvable sur le serveur. "
                "Ce média a probablement été supprimé "
                "après un redémarrage de Render."
            ),
        )

    from fastapi.responses import FileResponse

    return FileResponse(
        path=str(chemin_local),
        filename=galerie.nom_fichier,
    )


# ==========================================================
# LISTER TOUS LES MÉDIAS
# ==========================================================

@router.get(
    "",
    response_model=list[GalerieResponse],
    dependencies=[
        Depends(
            require_permission(
                "GALERIE_CONSULTER"
            )
        )
    ],
)
def lister_galerie(
    db: Session = Depends(get_db),
):
    """
    Liste tous les médias.
    """

    medias = (
        db.query(Galerie)
        .order_by(
            Galerie.ordre.asc(),
            Galerie.created_at.desc(),
        )
        .all()
    )

    return [
        vers_response(media)
        for media in medias
    ]


# ==========================================================
# CRÉER UN MÉDIA
# ==========================================================

@router.post(
    "",
    response_model=GalerieResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[
        Depends(
            require_permission(
                "GALERIE_CREER"
            )
        )
    ],
)
async def creer_media(
    titre: Annotated[
        str,
        Form(...),
    ],

    description: Annotated[
        str | None,
        Form(),
    ] = None,

    ordre: Annotated[
        int,
        Form(),
    ] = 0,

    actif: Annotated[
        bool,
        Form(),
    ] = True,

    fichier: UploadFile = File(...),

    db: Session = Depends(get_db),
):
    """
    Crée un nouveau média.

    Le fichier est envoyé directement à Cloudinary.
    """

    # ------------------------------------------------------
    # Validation titre
    # ------------------------------------------------------

    titre_nettoye = titre.strip()

    if len(titre_nettoye) < 2:

        raise HTTPException(
            status_code=(
                status.HTTP_422_UNPROCESSABLE_ENTITY
            ),
            detail=(
                "Le titre doit contenir "
                "au moins 2 caractères."
            ),
        )

    # ------------------------------------------------------
    # Validation ordre
    # ------------------------------------------------------

    if ordre < 0:

        raise HTTPException(
            status_code=(
                status.HTTP_422_UNPROCESSABLE_ENTITY
            ),
            detail="L'ordre ne peut pas être négatif.",
        )

    description_nettoyee = (
        description.strip()
        if description
        else None
    )

    # ------------------------------------------------------
    # Upload Cloudinary
    # ------------------------------------------------------

    type_media, url_cloudinary = (
        await uploader_vers_cloudinary(
            fichier
        )
    )

    # ------------------------------------------------------
    # Création DB
    # ------------------------------------------------------

    galerie = Galerie(
        titre=titre_nettoye,
        description=description_nettoyee,
        type_media=type_media,
        nom_fichier=fichier.filename,
        chemin_fichier=url_cloudinary,
        ordre=ordre,
        actif=actif,
    )

    try:

        db.add(galerie)

        db.commit()

        db.refresh(galerie)

    except Exception:

        db.rollback()

        supprimer_fichier_cloudinary(
            url_cloudinary,
            type_media,
        )

        raise

    return vers_response(galerie)


# ==========================================================
# MODIFIER UN MÉDIA
# ==========================================================

@router.put(
    "/{galerie_id}",
    response_model=GalerieResponse,
    dependencies=[
        Depends(
            require_permission(
                "GALERIE_MODIFIER"
            )
        )
    ],
)
async def modifier_media(
    galerie_id: int,

    titre: Annotated[
        str,
        Form(...),
    ],

    description: Annotated[
        str | None,
        Form(),
    ] = None,

    ordre: Annotated[
        int,
        Form(),
    ] = 0,

    actif: Annotated[
        bool,
        Form(),
    ] = True,

    fichier: UploadFile | None = File(None),

    db: Session = Depends(get_db),
):
    """
    Modifie les informations d'un média.

    Si un nouveau fichier est envoyé :
    - upload du nouveau fichier sur Cloudinary ;
    - mise à jour DB ;
    - suppression de l'ancien média Cloudinary.
    """

    galerie = (
        db.query(Galerie)
        .filter(
            Galerie.id == galerie_id
        )
        .first()
    )

    if not galerie:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Média introuvable.",
        )

    # ------------------------------------------------------
    # Validation
    # ------------------------------------------------------

    titre_nettoye = titre.strip()

    if len(titre_nettoye) < 2:

        raise HTTPException(
            status_code=(
                status.HTTP_422_UNPROCESSABLE_ENTITY
            ),
            detail=(
                "Le titre doit contenir "
                "au moins 2 caractères."
            ),
        )

    if ordre < 0:

        raise HTTPException(
            status_code=(
                status.HTTP_422_UNPROCESSABLE_ENTITY
            ),
            detail="L'ordre ne peut pas être négatif.",
        )

    # ------------------------------------------------------
    # Informations actuelles
    # ------------------------------------------------------

    ancien_url = galerie.chemin_fichier
    ancien_type = galerie.type_media

    # ------------------------------------------------------
    # Mise à jour texte
    # ------------------------------------------------------

    galerie.titre = titre_nettoye

    galerie.description = (
        description.strip()
        if description
        else None
    )

    galerie.ordre = ordre
    galerie.actif = actif

    nouveau_url = None
    nouveau_type = None

    # ------------------------------------------------------
    # Nouveau fichier
    # ------------------------------------------------------

    if fichier and fichier.filename:

        (
            nouveau_type,
            nouveau_url,
        ) = await uploader_vers_cloudinary(
            fichier
        )

        galerie.type_media = nouveau_type

        galerie.nom_fichier = (
            fichier.filename
        )

        galerie.chemin_fichier = (
            nouveau_url
        )

    # ------------------------------------------------------
    # Sauvegarde DB
    # ------------------------------------------------------

    try:

        db.commit()

        db.refresh(galerie)

    except Exception:

        db.rollback()

        # Si le nouveau fichier a été uploadé mais
        # que la DB échoue, on supprime le nouveau fichier.
        if nouveau_url and nouveau_type:

            supprimer_fichier_cloudinary(
                nouveau_url,
                nouveau_type,
            )

        raise

    # ------------------------------------------------------
    # Suppression ancien média Cloudinary
    # ------------------------------------------------------

    if (
        nouveau_url
        and ancien_url
        and (
            ancien_url.startswith("http://")
            or ancien_url.startswith("https://")
        )
    ):

        supprimer_fichier_cloudinary(
            ancien_url,
            ancien_type,
        )

    return vers_response(galerie)


# ==========================================================
# ACTIVER / DÉSACTIVER
# ==========================================================

@router.patch(
    "/{galerie_id}/statut",
    response_model=GalerieResponse,
    dependencies=[
        Depends(
            require_permission(
                "GALERIE_MODIFIER"
            )
        )
    ],
)
def modifier_statut(
    galerie_id: int,

    actif: Annotated[
        bool,
        Form(...),
    ],

    db: Session = Depends(get_db),
):
    """
    Active ou désactive un média.
    """

    galerie = (
        db.query(Galerie)
        .filter(
            Galerie.id == galerie_id
        )
        .first()
    )

    if not galerie:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Média introuvable.",
        )

    galerie.actif = actif

    db.commit()

    db.refresh(galerie)

    return vers_response(galerie)


# ==========================================================
# MODIFIER L'ORDRE
# ==========================================================

@router.patch(
    "/{galerie_id}/ordre",
    response_model=GalerieResponse,
    dependencies=[
        Depends(
            require_permission(
                "GALERIE_MODIFIER"
            )
        )
    ],
)
def modifier_ordre(
    galerie_id: int,

    donnees: GalerieOrdreUpdate,

    db: Session = Depends(get_db),
):
    """
    Modifie l'ordre d'affichage d'un média.
    """

    galerie = (
        db.query(Galerie)
        .filter(
            Galerie.id == galerie_id
        )
        .first()
    )

    if not galerie:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Média introuvable.",
        )

    galerie.ordre = donnees.ordre

    db.commit()

    db.refresh(galerie)

    return vers_response(galerie)


# ==========================================================
# SUPPRIMER UN MÉDIA
# ==========================================================

@router.delete(
    "/{galerie_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[
        Depends(
            require_permission(
                "GALERIE_SUPPRIMER"
            )
        )
    ],
)
def supprimer_media(
    galerie_id: int,

    db: Session = Depends(get_db),
):
    """
    Supprime le média de la base et de Cloudinary.
    """

    galerie = (
        db.query(Galerie)
        .filter(
            Galerie.id == galerie_id
        )
        .first()
    )

    if not galerie:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Média introuvable.",
        )

    url = galerie.chemin_fichier
    type_media = galerie.type_media

    # ------------------------------------------------------
    # Suppression DB
    # ------------------------------------------------------

    db.delete(galerie)

    db.commit()

    # ------------------------------------------------------
    # Suppression Cloudinary
    # ------------------------------------------------------

    if url and (
        url.startswith("http://")
        or url.startswith("https://")
    ):

        supprimer_fichier_cloudinary(
            url,
            type_media,
        )

    return None