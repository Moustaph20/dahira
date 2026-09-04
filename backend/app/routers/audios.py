
from pathlib import Path
from uuid import uuid4

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

from app.core.database import get_db
from app.core.permissions import require_permission

from app.models.audio import Audio
from app.models.khassida import Khassida
from app.models.ton import Ton


router = APIRouter(
    prefix="/audios",
    tags=["Audios"],
)


DOSSIER_AUDIOS = Path("uploads/audios")

DOSSIER_AUDIOS.mkdir(
    parents=True,
    exist_ok=True,
)


# ============================================================
# LISTER LES AUDIOS
#
# GET /audios
#
# Filtres optionnels :
#
# /audios?khassida_id=1
# /audios?ton_id=1
# /audios?khassida_id=1&ton_id=1
#
# Le frontend ProgrammeReligieux utilise précisément :
#
# /audios?khassida_id=X&ton_id=Y
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
    # ========================================================
    # REQUÊTE DE BASE
    # ========================================================

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

    # ========================================================
    # FILTRE KHASSIDA
    # ========================================================

    if khassida_id is not None:
        requete = requete.filter(
            Audio.khassida_id == khassida_id
        )

    # ========================================================
    # FILTRE TON
    # ========================================================

    if ton_id is not None:
        requete = requete.filter(
            Audio.ton_id == ton_id
        )

    # ========================================================
    # RÉCUPÉRATION
    # ========================================================

    audios = (
        requete
        .order_by(
            Audio.titre.asc()
        )
        .all()
    )

    # ========================================================
    # RÉPONSE
    # ========================================================

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
    # VÉRIFIER QUE LE TON EST BIEN ASSOCIÉ À LA KHASSIDA
    #
    # On vérifie l'existence d'au moins un audio actif
    # utilisant déjà cette combinaison.
    #
    # Cette vérification n'est PAS nécessaire pour permettre
    # le premier upload d'un audio.
    #
    # Elle est donc volontairement absente ici.
    # ========================================================

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

    extensions_autorisees = {
        ".mp3",
        ".wav",
        ".m4a",
        ".ogg",
    }

    if extension not in extensions_autorisees:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Format audio non autorisé. "
                "Formats acceptés : MP3, WAV, M4A, OGG."
            ),
        )

    # ========================================================
    # GÉNÉRER LE NOM DU FICHIER
    # ========================================================

    nom_fichier = (
        f"{uuid4().hex}{extension}"
    )

    chemin = (
        DOSSIER_AUDIOS / nom_fichier
    )

    # ========================================================
    # ENREGISTRER LE FICHIER
    # ========================================================

    contenu = await fichier.read()

    if not contenu:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le fichier audio est vide.",
        )

    with open(
        chemin,
        "wb",
    ) as fichier_destination:

        fichier_destination.write(
            contenu
        )

    # ========================================================
    # CRÉER L'AUDIO
    # ========================================================

    audio = Audio(
        khassida_id=khassida_id,
        ton_id=ton_id,
        titre=titre,
        fichier=str(
            chemin
        ).replace("\\", "/"),
        description=(
            description.strip()
            if description
            else None
        ),
        actif=True,
    )

    db.add(audio)

    db.commit()

    db.refresh(audio)

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
