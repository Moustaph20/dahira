import asyncio
from pathlib import Path

import cloudinary
import cloudinary.uploader
import httpx

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
    status,
)
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload

from app.core.config import settings
from app.core.database import get_db
from app.core.permissions import require_permission

from app.models.khassida import Khassida
from app.models.audio import Audio
from app.models.ton import Ton

from app.schemas.khassida import (
    KhassidaCreate,
    KhassidaResponse,
    KhassidaUpdate,
)

from app.schemas.ton import TonResponse


router = APIRouter(
    prefix="/khassidas",
    tags=["Kourel - Khassidas"],
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
# CONFIGURATION PDF
# ============================================================

TAILLE_MAX_PDF = 100 * 1024 * 1024  # 100 MB

DOSSIER_CLOUDINARY_PDF = "dahira/khassidas"


# ============================================================
# FONCTIONS UTILITAIRES PDF
# ============================================================

async def lire_fichier_pdf(
    fichier: UploadFile,
) -> bytes:
    """
    Lit le fichier PDF par morceaux et vérifie
    qu'il ne dépasse pas la taille maximale.
    """

    contenu = bytearray()

    while True:
        morceau = await fichier.read(
            1024 * 1024
        )

        if not morceau:
            break

        contenu.extend(morceau)

        if len(contenu) > TAILLE_MAX_PDF:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=(
                    "Le fichier PDF ne doit pas "
                    "dépasser 100 MB."
                ),
            )

    if not contenu:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le fichier PDF est vide.",
        )

    return bytes(contenu)


async def recuperer_pdf_distant(
    url: str,
) -> bytes:
    """
    Récupère le PDF depuis Cloudinary.
    """

    try:
        async with httpx.AsyncClient(
            follow_redirects=True,
            timeout=120.0,
        ) as client:

            response = await client.get(url)

        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=(
                    "Impossible de récupérer "
                    "le PDF depuis le stockage distant."
                ),
            )

        contenu = response.content

        if not contenu:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Le PDF est vide ou inaccessible.",
            )

        return contenu

    except HTTPException:
        raise

    except Exception as exc:
        print(
            "Erreur récupération PDF Cloudinary :",
            exc,
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Impossible de récupérer le PDF.",
        )


# ============================================================
# LISTE DES KHASSIDAS
#
# GET /khassidas
# ============================================================

@router.get(
    "",
    response_model=list[KhassidaResponse],
)
def lister_khassidas(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("KOUREL_CONSULTER")
    ),
):
    khassidas = (
        db.query(Khassida)
        .options(
            joinedload(Khassida.audios)
            .joinedload(Audio.ton)
        )
        .filter(
            Khassida.actif.is_(True)
        )
        .order_by(
            Khassida.titre.asc()
        )
        .all()
    )

    return khassidas


# ============================================================
# TOUS LES TONS DISPONIBLES POUR UNE KHASSIDA
#
# GET /khassidas/{khassida_id}/tons
# ============================================================

@router.get(
    "/{khassida_id}/tons",
    response_model=list[TonResponse],
)
def lister_tons_khassida(
    khassida_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("KOUREL_CONSULTER")
    ),
):
    # --------------------------------------------------------
    # Vérifier que la Khassida existe
    # --------------------------------------------------------

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

    # --------------------------------------------------------
    # Tous les tons actifs
    # --------------------------------------------------------

    tons = (
        db.query(Ton)
        .filter(
            Ton.actif.is_(True),
        )
        .order_by(
            Ton.nom.asc()
        )
        .all()
    )

    return tons



# ============================================================
# AUDIOS D'UNE KHASSIDA POUR UN TON
#
# GET /khassidas/{khassida_id}/tons/{ton_id}/audios
# ============================================================

@router.get(
    "/{khassida_id}/tons/{ton_id}/audios",
)
def lister_audios_khassida_ton(
    khassida_id: int,
    ton_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("KOUREL_CONSULTER")
    ),
):
    # --------------------------------------------------------
    # Vérifier que la Khassida existe
    # --------------------------------------------------------

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

    # --------------------------------------------------------
    # Vérifier que le ton existe
    # --------------------------------------------------------

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

    # --------------------------------------------------------
    # Récupérer les audios liés à la Khassida + Ton
    #
    # Audio.fichier contient l'URL Cloudinary.
    # --------------------------------------------------------

    audios = (
        db.query(Audio)
        .filter(
            Audio.khassida_id == khassida_id,
            Audio.ton_id == ton_id,
            Audio.actif.is_(True),
        )
        .order_by(
            Audio.titre.asc()
        )
        .all()
    )

    # --------------------------------------------------------
    # Retourner les informations nécessaires au frontend
    # --------------------------------------------------------

    return [
        {
            "id": audio.id,
            "titre": audio.titre,
            "fichier": audio.fichier,
            "description": audio.description,
            "actif": audio.actif,
            "ton": (
                {
                    "id": audio.ton.id,
                    "nom": audio.ton.nom,
                }
                if audio.ton
                else None
            ),
        }
        for audio in audios
    ]
# ============================================================
# DÉTAIL D'UNE KHASSIDA
#
# GET /khassidas/{khassida_id}
# ============================================================

@router.get(
    "/{khassida_id}",
    response_model=KhassidaResponse,
)
def obtenir_khassida(
    khassida_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("KOUREL_CONSULTER")
    ),
):
    khassida = (
        db.query(Khassida)
        .options(
            joinedload(Khassida.audios)
            .joinedload(Audio.ton)
        )
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

    return khassida


# ============================================================
# CRÉATION D'UNE KHASSIDA
#
# POST /khassidas
# ============================================================

@router.post(
    "",
    response_model=KhassidaResponse,
    status_code=status.HTTP_201_CREATED,
)
def creer_khassida(
    data: KhassidaCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("KOUREL_CREER")
    ),
):
    titre = data.titre.strip()

    if not titre:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le titre de la Khassida est obligatoire.",
        )

    khassida_existante = (
        db.query(Khassida)
        .filter(
            Khassida.titre.ilike(titre),
            Khassida.actif.is_(True),
        )
        .first()
    )

    if khassida_existante:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cette Khassida existe déjà.",
        )

    khassida = Khassida(
        titre=titre,
        auteur=(
            data.auteur.strip()
            if data.auteur
            else None
        ),
        description=(
            data.description.strip()
            if data.description
            else None
        ),
        actif=True,
    )

    db.add(khassida)
    db.commit()
    db.refresh(khassida)

    return khassida


# ============================================================
# AJOUT / REMPLACEMENT DU PDF
#
# POST /khassidas/{khassida_id}/pdf
# ============================================================

@router.post(
    "/{khassida_id}/pdf",
    response_model=KhassidaResponse,
)
async def uploader_pdf_khassida(
    khassida_id: int,
    fichier: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("KOUREL_MODIFIER")
    ),
):
    # --------------------------------------------------------
    # VÉRIFIER LA KHASSIDA
    # --------------------------------------------------------

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

    # --------------------------------------------------------
    # VÉRIFIER LE NOM DU FICHIER
    # --------------------------------------------------------

    if not fichier.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le fichier PDF est obligatoire.",
        )

    extension = Path(
        fichier.filename
    ).suffix.lower()

    if extension != ".pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Seuls les fichiers PDF sont autorisés.",
        )

    # --------------------------------------------------------
    # VÉRIFIER LE TYPE MIME
    # --------------------------------------------------------

    if (
        fichier.content_type
        and fichier.content_type != "application/pdf"
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le fichier doit être un PDF valide.",
        )

    # --------------------------------------------------------
    # LIRE LE FICHIER
    # --------------------------------------------------------

    contenu = await lire_fichier_pdf(
        fichier
    )

    # --------------------------------------------------------
    # IDENTIFIANT CLOUDINARY
    # --------------------------------------------------------

    public_id = (
        f"{DOSSIER_CLOUDINARY_PDF}/"
        f"khassida_{khassida.id}"
    )

    # --------------------------------------------------------
    # UPLOAD CLOUDINARY
    # --------------------------------------------------------

    try:
        resultat = await asyncio.to_thread(
            cloudinary.uploader.upload,
            contenu,
            resource_type="raw",
            public_id=public_id,
            overwrite=True,
        )

    except Exception as exc:
        print(
            "Erreur Cloudinary upload PDF :",
            exc,
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Impossible d'envoyer le PDF "
                "vers le stockage distant."
            ),
        )

    # --------------------------------------------------------
    # RÉCUPÉRER L'URL
    # --------------------------------------------------------

    pdf_url = resultat.get(
        "secure_url"
    )

    if not pdf_url:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Cloudinary n'a pas retourné "
                "l'URL du PDF."
            ),
        )

    # --------------------------------------------------------
    # ENREGISTRER EN BASE
    # --------------------------------------------------------

    ancienne_url = khassida.pdf_url

    khassida.pdf_url = pdf_url

    try:
        db.commit()
        db.refresh(khassida)

    except Exception as exc:
        db.rollback()

        print(
            "Erreur DB ajout PDF :",
            exc,
        )

        # ----------------------------------------------------
        # NETTOYER LE NOUVEAU FICHIER
        # ----------------------------------------------------

        try:
            await asyncio.to_thread(
                cloudinary.uploader.destroy,
                public_id,
                resource_type="raw",
                invalidate=True,
            )
        except Exception as cleanup_error:
            print(
                "Erreur nettoyage PDF Cloudinary :",
                cleanup_error,
            )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Impossible d'enregistrer "
                "le PDF dans la base de données."
            ),
        )

    # --------------------------------------------------------
    # RÉPONSE
    # --------------------------------------------------------

    return khassida


# ============================================================
# LIRE LE PDF DANS L'APPLICATION
#
# GET /khassidas/{khassida_id}/pdf/view
# ============================================================

@router.get(
    "/{khassida_id}/pdf/view",
)
async def lire_pdf_khassida(
    khassida_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("KOUREL_CONSULTER")
    ),
):
    # --------------------------------------------------------
    # RÉCUPÉRER LA KHASSIDA
    # --------------------------------------------------------

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

    # --------------------------------------------------------
    # VÉRIFIER LE PDF
    # --------------------------------------------------------

    if not khassida.pdf_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                "Aucun PDF n'est associé "
                "à cette Khassida."
            ),
        )

    # --------------------------------------------------------
    # RÉCUPÉRER LE PDF
    # --------------------------------------------------------

    contenu = await recuperer_pdf_distant(
        khassida.pdf_url
    )

    # --------------------------------------------------------
    # NOM DU FICHIER
    # --------------------------------------------------------

    nom_fichier = (
        f"{khassida.titre}.pdf"
        .replace("/", "-")
        .replace("\\", "-")
    )

    # --------------------------------------------------------
    # AFFICHAGE INLINE
    # --------------------------------------------------------

    return StreamingResponse(
        iter([contenu]),
        media_type="application/pdf",
        headers={
            "Content-Disposition": (
                f'inline; filename="{nom_fichier}"'
            ),
            "Content-Length": str(len(contenu)),
            "Cache-Control": "public, max-age=3600",
        },
    )


# ============================================================
# TÉLÉCHARGER LE PDF
#
# GET /khassidas/{khassida_id}/pdf/download
# ============================================================

@router.get(
    "/{khassida_id}/pdf/download",
)
async def telecharger_pdf_khassida(
    khassida_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("KOUREL_CONSULTER")
    ),
):
    # --------------------------------------------------------
    # RÉCUPÉRER LA KHASSIDA
    # --------------------------------------------------------

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

    # --------------------------------------------------------
    # VÉRIFIER LE PDF
    # --------------------------------------------------------

    if not khassida.pdf_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                "Aucun PDF n'est associé "
                "à cette Khassida."
            ),
        )

    # --------------------------------------------------------
    # RÉCUPÉRER LE PDF
    # --------------------------------------------------------

    contenu = await recuperer_pdf_distant(
        khassida.pdf_url
    )

    # --------------------------------------------------------
    # NOM DU FICHIER
    # --------------------------------------------------------

    nom_fichier = (
        f"{khassida.titre}.pdf"
        .replace("/", "-")
        .replace("\\", "-")
    )

    # --------------------------------------------------------
    # FORCER LE TÉLÉCHARGEMENT
    # --------------------------------------------------------

    return StreamingResponse(
        iter([contenu]),
        media_type="application/pdf",
        headers={
            "Content-Disposition": (
                f'attachment; filename="{nom_fichier}"'
            ),
            "Content-Length": str(len(contenu)),
        },
    )


# ============================================================
# SUPPRESSION DU PDF
#
# DELETE /khassidas/{khassida_id}/pdf
# ============================================================

@router.delete(
    "/{khassida_id}/pdf",
    response_model=KhassidaResponse,
)
async def supprimer_pdf_khassida(
    khassida_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("KOUREL_MODIFIER")
    ),
):
    # --------------------------------------------------------
    # RÉCUPÉRER LA KHASSIDA
    # --------------------------------------------------------

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

    # --------------------------------------------------------
    # VÉRIFIER LE PDF
    # --------------------------------------------------------

    if not khassida.pdf_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                "Aucun PDF n'est associé "
                "à cette Khassida."
            ),
        )

    # --------------------------------------------------------
    # EXTRAIRE LE PUBLIC ID
    #
    # Exemple :
    # dahira/khassidas/khassida_1
    # --------------------------------------------------------

    public_id = (
        f"{DOSSIER_CLOUDINARY_PDF}/"
        f"khassida_{khassida.id}"
    )

    # --------------------------------------------------------
    # URL EN BASE
    # --------------------------------------------------------

    khassida.pdf_url = None

    try:
        db.commit()
        db.refresh(khassida)

    except Exception as exc:
        db.rollback()

        print(
            "Erreur DB suppression PDF :",
            exc,
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Impossible de supprimer le PDF.",
        )

    # --------------------------------------------------------
    # SUPPRESSION CLOUDINARY
    # --------------------------------------------------------

    try:
        await asyncio.to_thread(
            cloudinary.uploader.destroy,
            public_id,
            resource_type="raw",
            invalidate=True,
        )

    except Exception as exc:
        print(
            "Erreur suppression PDF Cloudinary :",
            exc,
        )

    return khassida


# ============================================================
# MODIFICATION D'UNE KHASSIDA
#
# PUT /khassidas/{khassida_id}
# ============================================================

@router.put(
    "/{khassida_id}",
    response_model=KhassidaResponse,
)
def modifier_khassida(
    khassida_id: int,
    data: KhassidaUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("KOUREL_MODIFIER")
    ),
):
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

    donnees = data.model_dump(
        exclude_unset=True
    )

    # --------------------------------------------------------
    # TITRE
    # --------------------------------------------------------

    if "titre" in donnees:
        titre = (
            donnees["titre"].strip()
            if donnees["titre"]
            else ""
        )

        if not titre:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Le titre de la Khassida "
                    "est obligatoire."
                ),
            )

        doublon = (
            db.query(Khassida)
            .filter(
                Khassida.id != khassida_id,
                Khassida.titre.ilike(titre),
                Khassida.actif.is_(True),
            )
            .first()
        )

        if doublon:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "Une autre Khassida porte "
                    "déjà ce titre."
                ),
            )

        donnees["titre"] = titre

    # --------------------------------------------------------
    # AUTEUR
    # --------------------------------------------------------

    if "auteur" in donnees:
        donnees["auteur"] = (
            donnees["auteur"].strip()
            if donnees["auteur"]
            else None
        )

    # --------------------------------------------------------
    # DESCRIPTION
    # --------------------------------------------------------

    if "description" in donnees:
        donnees["description"] = (
            donnees["description"].strip()
            if donnees["description"]
            else None
        )

    # --------------------------------------------------------
    # PDF URL
    # --------------------------------------------------------

    if "pdf_url" in donnees:
        donnees["pdf_url"] = (
            donnees["pdf_url"].strip()
            if donnees["pdf_url"]
            else None
        )

    # --------------------------------------------------------
    # APPLICATION
    # --------------------------------------------------------

    for champ, valeur in donnees.items():
        setattr(
            khassida,
            champ,
            valeur,
        )

    db.commit()
    db.refresh(khassida)

    return khassida


# ============================================================
# SUPPRESSION LOGIQUE D'UNE KHASSIDA
#
# DELETE /khassidas/{khassida_id}
# ============================================================

@router.delete(
    "/{khassida_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def supprimer_khassida(
    khassida_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("KOUREL_SUPPRIMER")
    ),
):
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

    khassida.actif = False

    db.commit()

    return None