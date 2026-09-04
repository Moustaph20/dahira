import uuid
from pathlib import Path
from typing import Annotated

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    status,
)
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

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
# CONFIGURATION DES FICHIERS
# ==========================================================

BASE_DIR = Path(__file__).resolve().parent.parent.parent

UPLOAD_DIR = BASE_DIR / "uploads" / "galerie"

UPLOAD_DIR.mkdir(
    parents=True,
    exist_ok=True,
)


# Taille maximale : 100 Mo
TAILLE_MAX = 100 * 1024 * 1024


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
    Construit l'URL publique permettant de récupérer le fichier.
    """

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


def supprimer_fichier(chemin: str) -> None:
    """
    Supprime un fichier du disque s'il existe.
    """

    try:
        fichier = Path(chemin)

        if fichier.exists():
            fichier.unlink()

    except Exception:
        # Une erreur de suppression du fichier ne doit
        # pas faire échouer la réponse API.
        pass


async def sauvegarder_fichier(
    fichier: UploadFile,
) -> tuple[str, str]:
    """
    Sauvegarde physiquement le fichier sur le serveur.

    Retourne :
        (type_media, chemin_complet)
    """

    if not fichier.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Aucun fichier sélectionné.",
        )

    # ------------------------------------------------------
    # Déterminer le type
    # ------------------------------------------------------

    type_media = determiner_type_media(
        fichier.filename
    )

    # ------------------------------------------------------
    # Extension
    # ------------------------------------------------------

    extension = Path(
        fichier.filename
    ).suffix.lower()

    # ------------------------------------------------------
    # Nom unique
    # ------------------------------------------------------

    nom_unique = (
        f"{uuid.uuid4().hex}{extension}"
    )

    chemin = UPLOAD_DIR / nom_unique

    taille = 0

    # ------------------------------------------------------
    # Écriture du fichier
    # ------------------------------------------------------

    try:

        with chemin.open("wb") as buffer:

            while True:

                morceau = await fichier.read(
                    1024 * 1024
                )

                if not morceau:
                    break

                taille += len(morceau)

                if taille > TAILLE_MAX:

                    # Suppression du fichier partiellement écrit
                    if chemin.exists():
                        chemin.unlink()

                    raise HTTPException(
                        status_code=(
                            status.HTTP_413_REQUEST_ENTITY_TOO_LARGE
                        ),
                        detail=(
                            "Le fichier est trop volumineux. "
                            "Taille maximale : 100 MB."
                        ),
                    )

                buffer.write(morceau)

    finally:

        await fichier.close()

    return type_media, str(chemin)


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

    Cette route est destinée à la page publique Home.jsx.
    Elle ne nécessite donc pas de permission particulière.
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
    Retourne physiquement le fichier demandé.
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

    chemin = Path(
        galerie.chemin_fichier
    )

    if not chemin.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fichier introuvable sur le serveur.",
        )

    return FileResponse(
        path=str(chemin),
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
    Liste tous les médias, actifs ou non.

    Cette route est destinée à Galerie.jsx
    côté administration.
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
        Form(...)
    ],

    # IMPORTANT :
    # Le défaut est placé APRÈS Annotated.
    description: Annotated[
        str | None,
        Form()
    ] = None,

    ordre: Annotated[
        int,
        Form()
    ] = 0,

    actif: Annotated[
        bool,
        Form()
    ] = True,

    fichier: UploadFile = File(...),

    db: Session = Depends(get_db),
):
    """
    Crée un nouveau média dans la galerie.
    """

    # ------------------------------------------------------
    # Validation du titre
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
    # Validation de l'ordre
    # ------------------------------------------------------

    if ordre < 0:

        raise HTTPException(
            status_code=(
                status.HTTP_422_UNPROCESSABLE_ENTITY
            ),
            detail=(
                "L'ordre ne peut pas être négatif."
            ),
        )

    # ------------------------------------------------------
    # Nettoyage description
    # ------------------------------------------------------

    description_nettoyee = (
        description.strip()
        if description
        else None
    )

    # ------------------------------------------------------
    # Sauvegarde physique
    # ------------------------------------------------------

    type_media, chemin = (
        await sauvegarder_fichier(fichier)
    )

    # ------------------------------------------------------
    # Création SQL
    # ------------------------------------------------------

    galerie = Galerie(
        titre=titre_nettoye,
        description=description_nettoyee,
        type_media=type_media,
        nom_fichier=fichier.filename,
        chemin_fichier=chemin,
        ordre=ordre,
        actif=actif,
    )

    try:

        db.add(galerie)

        db.commit()

        db.refresh(galerie)

    except Exception:

        db.rollback()

        # Si la base échoue après l'upload,
        # on supprime le fichier pour éviter
        # un fichier orphelin.
        supprimer_fichier(chemin)

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
        Form(...)
    ],

    # Même règle ici :
    # Form() ne contient PAS le défaut.
    description: Annotated[
        str | None,
        Form()
    ] = None,

    ordre: Annotated[
        int,
        Form()
    ] = 0,

    actif: Annotated[
        bool,
        Form()
    ] = True,

    fichier: UploadFile | None = File(None),

    db: Session = Depends(get_db),
):
    """
    Modifie les informations d'un média.

    Le fichier est facultatif :
    - s'il n'est pas envoyé, l'ancien fichier reste.
    - s'il est envoyé, l'ancien fichier est remplacé.
    """

    # ------------------------------------------------------
    # Recherche
    # ------------------------------------------------------

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
            detail=(
                "L'ordre ne peut pas être négatif."
            ),
        )

    # ------------------------------------------------------
    # Mise à jour des informations
    # ------------------------------------------------------

    galerie.titre = titre_nettoye

    galerie.description = (
        description.strip()
        if description
        else None
    )

    galerie.ordre = ordre

    galerie.actif = actif

    # ------------------------------------------------------
    # Remplacement du fichier
    # ------------------------------------------------------

    ancien_fichier = None

    if fichier and fichier.filename:

        ancien_fichier = galerie.chemin_fichier

        (
            nouveau_type_media,
            nouveau_chemin,
        ) = await sauvegarder_fichier(
            fichier
        )

        galerie.type_media = (
            nouveau_type_media
        )

        galerie.nom_fichier = (
            fichier.filename
        )

        galerie.chemin_fichier = (
            nouveau_chemin
        )

    # ------------------------------------------------------
    # Sauvegarde DB
    # ------------------------------------------------------

    try:

        db.commit()

        db.refresh(galerie)

    except Exception:

        db.rollback()

        # Si un nouveau fichier a été enregistré
        # mais que la base échoue, on le supprime.
        if (
            fichier
            and fichier.filename
            and galerie.chemin_fichier
        ):
            nouveau_fichier = (
                galerie.chemin_fichier
            )

            if (
                nouveau_fichier
                != ancien_fichier
            ):
                supprimer_fichier(
                    nouveau_fichier
                )

        raise

    # ------------------------------------------------------
    # Suppression de l'ancien fichier
    # ------------------------------------------------------

    if (
        ancien_fichier
        and fichier
        and fichier.filename
        and ancien_fichier
        != galerie.chemin_fichier
    ):
        supprimer_fichier(
            ancien_fichier
        )

    return vers_response(galerie)


# ==========================================================
# ACTIVER / DÉSACTIVER UN MÉDIA
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

    # Ici le champ est obligatoire.
    # Form(...) est donc parfaitement correct.
    actif: Annotated[
        bool,
        Form(...)
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
    Supprime le média de la base et son fichier
    du serveur.
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

    chemin = galerie.chemin_fichier

    db.delete(galerie)

    db.commit()

    # Suppression physique
    supprimer_fichier(chemin)

    return None