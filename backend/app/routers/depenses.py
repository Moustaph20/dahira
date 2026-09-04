from datetime import date
from decimal import Decimal
from pathlib import Path
from uuid import uuid4

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

from app.models.depense import Depense

from app.schemas.depense import (
    DepenseResponse,
    DepenseUpdate,
    TypeSortie,
)


router = APIRouter(
    prefix="/depenses",
    tags=["Dépenses"],
)


# ============================================================
# DOSSIER DES PIÈCES JOINTES
# ============================================================

UPLOAD_DIR = Path("uploads/depenses")

UPLOAD_DIR.mkdir(
    parents=True,
    exist_ok=True,
)


# ============================================================
# TYPES DE FICHIERS AUTORISÉS
# ============================================================

EXTENSIONS_AUTORISEES = {
    ".pdf",
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
}


TAILLE_MAX_FICHIER = 10 * 1024 * 1024  # 10 Mo


# ============================================================
# LISTE
# ============================================================

@router.get(
    "",
    response_model=list[DepenseResponse],
)
def lister_depenses(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("DEPENSE_CONSULTER")
    ),
):

    return (
        db.query(Depense)
        .filter(
            Depense.actif.is_(True)
        )
        .order_by(
            Depense.date_depense.desc(),
            Depense.id.desc(),
        )
        .all()
    )


# ============================================================
# DÉTAIL
# ============================================================

@router.get(
    "/{depense_id}",
    response_model=DepenseResponse,
)
def obtenir_depense(
    depense_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("DEPENSE_CONSULTER")
    ),
):

    depense = (
        db.query(Depense)
        .filter(
            Depense.id == depense_id,
            Depense.actif.is_(True),
        )
        .first()
    )

    if not depense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sortie d'argent introuvable.",
        )

    return depense


# ============================================================
# CRÉATION
# ============================================================

@router.post(
    "",
    response_model=DepenseResponse,
    status_code=status.HTTP_201_CREATED,
)
async def creer_depense(
    motif: str = Form(...),
    type_sortie: TypeSortie = Form(...),
    remis_a: str = Form(...),
    montant: Decimal = Form(...),
    date_depense: date = Form(...),
    description: str | None = Form(None),
    piece_jointe: UploadFile | None = File(None),

    db: Session = Depends(get_db),

    current_user=Depends(
        require_permission("DEPENSE_CREER")
    ),
):

    # ========================================================
    # VALIDATION MOTIF
    # ========================================================

    motif = motif.strip()

    if not motif:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Veuillez saisir le motif de la sortie d'argent.",
        )

    # ========================================================
    # VALIDATION REMIS À
    # ========================================================

    remis_a = remis_a.strip()

    if not remis_a:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Veuillez préciser à qui l'argent a été remis.",
        )

    # ========================================================
    # VALIDATION MONTANT
    # ========================================================

    if montant <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le montant doit être supérieur à zéro.",
        )

    # ========================================================
    # DESCRIPTION
    # ========================================================

    if description:
        description = description.strip() or None

    # ========================================================
    # PIÈCE JOINTE
    # ========================================================

    piece_jointe_nom = None
    piece_jointe_path = None

    if piece_jointe:

        # ----------------------------------------------------
        # Vérification extension
        # ----------------------------------------------------

        nom_original = (
            piece_jointe.filename or ""
        )

        extension = (
            Path(nom_original)
            .suffix
            .lower()
        )

        if extension not in EXTENSIONS_AUTORISEES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Type de fichier non autorisé. "
                    "Formats acceptés : PDF, JPG, JPEG, PNG, "
                    "WEBP, DOC, DOCX, XLS et XLSX."
                ),
            )

        # ----------------------------------------------------
        # Lecture du fichier
        # ----------------------------------------------------

        contenu = await piece_jointe.read()

        if len(contenu) > TAILLE_MAX_FICHIER:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La pièce jointe ne doit pas dépasser 10 Mo.",
            )

        # ----------------------------------------------------
        # Nom sécurisé et unique
        # ----------------------------------------------------

        nom_fichier = (
            f"{uuid4().hex}"
            f"{extension}"
        )

        chemin_fichier = (
            UPLOAD_DIR / nom_fichier
        )

        chemin_fichier.write_bytes(
            contenu
        )

        piece_jointe_nom = nom_original

        piece_jointe_path = str(
            chemin_fichier
        )

    # ========================================================
    # CRÉATION
    # ========================================================

    depense = Depense(
        motif=motif,
        type_sortie=type_sortie.value,
        remis_a=remis_a,
        montant=montant,
        date_depense=date_depense,
        description=description,
        piece_jointe_nom=piece_jointe_nom,
        piece_jointe_path=piece_jointe_path,
        actif=True,
    )

    try:

        db.add(depense)

        db.commit()

        db.refresh(depense)

    except Exception:

        db.rollback()

        # Si le fichier a été enregistré mais que la
        # transaction DB échoue, on supprime le fichier.

        if piece_jointe_path:

            chemin = Path(
                piece_jointe_path
            )

            if chemin.exists():
                chemin.unlink()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Impossible d'enregistrer la sortie d'argent.",
        )

    return depense


# ============================================================
# PIÈCE JOINTE
# ============================================================

@router.get(
    "/{depense_id}/piece-jointe",
)
def telecharger_piece_jointe(
    depense_id: int,
    db: Session = Depends(get_db),

    current_user=Depends(
        require_permission("DEPENSE_CONSULTER")
    ),
):

    depense = (
        db.query(Depense)
        .filter(
            Depense.id == depense_id,
            Depense.actif.is_(True),
        )
        .first()
    )

    if not depense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sortie d'argent introuvable.",
        )

    if not depense.piece_jointe_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aucune pièce jointe associée à cette sortie.",
        )

    chemin = Path(
        depense.piece_jointe_path
    )

    if not chemin.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="La pièce jointe est introuvable sur le serveur.",
        )

    return FileResponse(
        path=chemin,
        filename=(
            depense.piece_jointe_nom
            or chemin.name
        ),
    )


# ============================================================
# MODIFICATION
# ============================================================

@router.put(
    "/{depense_id}",
    response_model=DepenseResponse,
)
def modifier_depense(
    depense_id: int,
    data: DepenseUpdate,

    db: Session = Depends(get_db),

    current_user=Depends(
        require_permission("DEPENSE_MODIFIER")
    ),
):

    depense = (
        db.query(Depense)
        .filter(
            Depense.id == depense_id,
            Depense.actif.is_(True),
        )
        .first()
    )

    if not depense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sortie d'argent introuvable.",
        )

    donnees = data.model_dump(
        exclude_unset=True
    )

    # ========================================================
    # VALIDATIONS
    # ========================================================

    if "motif" in donnees:

        motif = (
            donnees["motif"] or ""
        ).strip()

        if not motif:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Le motif ne peut pas être vide.",
            )

        donnees["motif"] = motif

    if "remis_a" in donnees:

        remis_a = (
            donnees["remis_a"] or ""
        ).strip()

        if not remis_a:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Le champ « Remis à » ne peut pas être vide.",
            )

        donnees["remis_a"] = remis_a

    if "montant" in donnees:

        if donnees["montant"] <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Le montant doit être supérieur à zéro.",
            )

    if "description" in donnees:

        if donnees["description"]:
            donnees["description"] = (
                donnees["description"].strip()
                or None
            )

    if "type_sortie" in donnees:

        donnees["type_sortie"] = (
            donnees["type_sortie"].value
        )

    # ========================================================
    # APPLICATION
    # ========================================================

    for champ, valeur in donnees.items():

        setattr(
            depense,
            champ,
            valeur,
        )

    db.commit()

    db.refresh(depense)

    return depense


# ============================================================
# SUPPRESSION LOGIQUE
# ============================================================

@router.delete(
    "/{depense_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def supprimer_depense(
    depense_id: int,

    db: Session = Depends(get_db),

    current_user=Depends(
        require_permission("DEPENSE_SUPPRIMER")
    ),
):

    depense = (
        db.query(Depense)
        .filter(
            Depense.id == depense_id,
            Depense.actif.is_(True),
        )
        .first()
    )

    if not depense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sortie d'argent introuvable.",
        )

    depense.actif = False

    db.commit()

    return None