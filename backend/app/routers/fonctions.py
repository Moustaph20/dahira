from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db

from app.models.fonction import Fonction
from app.models.permission import Permission
from app.models.fonction_permission import FonctionPermission

from pydantic import BaseModel, Field


router = APIRouter(
    prefix="/fonctions",
    tags=["Fonctions"],
)


# ============================================================
# SCHEMAS
# ============================================================

class FonctionCreate(BaseModel):
    nom: str = Field(
        ...,
        min_length=2,
        max_length=100
    )

    description: str | None = None


class FonctionUpdate(BaseModel):
    nom: str | None = Field(
        default=None,
        min_length=2,
        max_length=100
    )

    description: str | None = None


class FonctionResponse(BaseModel):
    id: int
    nom: str
    description: str | None
    actif: bool

    class Config:
        from_attributes = True


class AjouterPermission(BaseModel):
    permission_id: int = Field(
        ...,
        gt=0
    )


class PermissionResponse(BaseModel):
    id: int
    code: str
    nom: str
    description: str | None
    actif: bool

    class Config:
        from_attributes = True


# ============================================================
# OUTIL : RECUPERER LES PERMISSIONS D'UNE FONCTION
# ============================================================

def recuperer_permissions_fonction(
    fonction_id: int,
    db: Session
):
    return (
        db.query(Permission)
        .join(
            FonctionPermission,
            FonctionPermission.permission_id
            == Permission.id
        )
        .filter(
            FonctionPermission.fonction_id == fonction_id,
            Permission.actif == True
        )
        .order_by(Permission.nom.asc())
        .all()
    )


# ============================================================
# LISTER LES FONCTIONS
# ============================================================

@router.get(
    "",
    response_model=list[FonctionResponse]
)
def lister_fonctions(
    inclure_inactives: bool = False,
    db: Session = Depends(get_db)
):
    query = db.query(Fonction)

    if not inclure_inactives:
        query = query.filter(
            Fonction.actif == True
        )

    return (
        query
        .order_by(Fonction.nom.asc())
        .all()
    )


# ============================================================
# CONSULTER UNE FONCTION
# ============================================================

@router.get(
    "/{fonction_id}",
    response_model=FonctionResponse
)
def consulter_fonction(
    fonction_id: int,
    db: Session = Depends(get_db)
):
    fonction = (
        db.query(Fonction)
        .filter(
            Fonction.id == fonction_id
        )
        .first()
    )

    if not fonction:
        raise HTTPException(
            status_code=404,
            detail="Fonction introuvable."
        )

    return fonction


# ============================================================
# CREER UNE FONCTION
# ============================================================

@router.post(
    "",
    response_model=FonctionResponse,
    status_code=status.HTTP_201_CREATED
)
def creer_fonction(
    data: FonctionCreate,
    db: Session = Depends(get_db)
):
    nom = data.nom.strip()

    if not nom:
        raise HTTPException(
            status_code=400,
            detail="Le nom de la fonction est obligatoire."
        )

    existe = (
        db.query(Fonction)
        .filter(
            Fonction.nom == nom
        )
        .first()
    )

    if existe:
        raise HTTPException(
            status_code=400,
            detail="Cette fonction existe déjà."
        )

    fonction = Fonction(
        nom=nom,
        description=data.description,
        actif=True
    )

    db.add(fonction)
    db.commit()
    db.refresh(fonction)

    return fonction


# ============================================================
# MODIFIER UNE FONCTION
# ============================================================

@router.put(
    "/{fonction_id}",
    response_model=FonctionResponse
)
def modifier_fonction(
    fonction_id: int,
    data: FonctionUpdate,
    db: Session = Depends(get_db)
):
    fonction = (
        db.query(Fonction)
        .filter(
            Fonction.id == fonction_id
        )
        .first()
    )

    if not fonction:
        raise HTTPException(
            status_code=404,
            detail="Fonction introuvable."
        )

    # --------------------------------------------------------
    # NOM
    # --------------------------------------------------------

    if data.nom is not None:

        nom = data.nom.strip()

        if not nom:
            raise HTTPException(
                status_code=400,
                detail="Le nom de la fonction est obligatoire."
            )

        existe = (
            db.query(Fonction)
            .filter(
                Fonction.nom == nom,
                Fonction.id != fonction_id
            )
            .first()
        )

        if existe:
            raise HTTPException(
                status_code=400,
                detail="Une autre fonction porte déjà ce nom."
            )

        fonction.nom = nom

    # --------------------------------------------------------
    # DESCRIPTION
    # --------------------------------------------------------

    if data.description is not None:
        fonction.description = data.description

    db.commit()
    db.refresh(fonction)

    return fonction


# ============================================================
# DESACTIVER UNE FONCTION
# ============================================================

@router.patch(
    "/{fonction_id}/desactiver"
)
def desactiver_fonction(
    fonction_id: int,
    db: Session = Depends(get_db)
):
    fonction = (
        db.query(Fonction)
        .filter(
            Fonction.id == fonction_id
        )
        .first()
    )

    if not fonction:
        raise HTTPException(
            status_code=404,
            detail="Fonction introuvable."
        )

    fonction.actif = False

    db.commit()

    return {
        "message": "Fonction désactivée."
    }


# ============================================================
# REACTIVER UNE FONCTION
# ============================================================

@router.patch(
    "/{fonction_id}/activer"
)
def activer_fonction(
    fonction_id: int,
    db: Session = Depends(get_db)
):
    fonction = (
        db.query(Fonction)
        .filter(
            Fonction.id == fonction_id
        )
        .first()
    )

    if not fonction:
        raise HTTPException(
            status_code=404,
            detail="Fonction introuvable."
        )

    fonction.actif = True

    db.commit()

    return {
        "message": "Fonction réactivée."
    }


# ============================================================
# LISTER LES PERMISSIONS D'UNE FONCTION
# ============================================================

@router.get(
    "/{fonction_id}/permissions",
    response_model=list[PermissionResponse]
)
def lister_permissions_fonction(
    fonction_id: int,
    db: Session = Depends(get_db)
):
    fonction = (
        db.query(Fonction)
        .filter(
            Fonction.id == fonction_id
        )
        .first()
    )

    if not fonction:
        raise HTTPException(
            status_code=404,
            detail="Fonction introuvable."
        )

    return recuperer_permissions_fonction(
        fonction_id,
        db
    )


# ============================================================
# AJOUTER UNE PERMISSION A UNE FONCTION
# ============================================================

@router.post(
    "/{fonction_id}/permissions",
    response_model=PermissionResponse,
    status_code=status.HTTP_201_CREATED
)
def ajouter_permission_fonction(
    fonction_id: int,
    data: AjouterPermission,
    db: Session = Depends(get_db)
):
    # --------------------------------------------------------
    # Vérifier la fonction
    # --------------------------------------------------------

    fonction = (
        db.query(Fonction)
        .filter(
            Fonction.id == fonction_id,
            Fonction.actif == True
        )
        .first()
    )

    if not fonction:
        raise HTTPException(
            status_code=404,
            detail="Fonction introuvable ou inactive."
        )

    # --------------------------------------------------------
    # Vérifier la permission
    # --------------------------------------------------------

    permission = (
        db.query(Permission)
        .filter(
            Permission.id == data.permission_id,
            Permission.actif == True
        )
        .first()
    )

    if not permission:
        raise HTTPException(
            status_code=404,
            detail="Permission introuvable ou inactive."
        )

    # --------------------------------------------------------
    # Vérifier l'existence de la liaison
    # --------------------------------------------------------

    liaison = (
        db.query(FonctionPermission)
        .filter(
            FonctionPermission.fonction_id
            == fonction_id,
            FonctionPermission.permission_id
            == data.permission_id
        )
        .first()
    )

    if liaison:
        raise HTTPException(
            status_code=400,
            detail="Cette permission est déjà attribuée à cette fonction."
        )

    # --------------------------------------------------------
    # Créer la liaison
    # --------------------------------------------------------

    liaison = FonctionPermission(
        fonction_id=fonction_id,
        permission_id=data.permission_id
    )

    db.add(liaison)
    db.commit()

    return permission


# ============================================================
# RETIRER UNE PERMISSION D'UNE FONCTION
# ============================================================

@router.delete(
    "/{fonction_id}/permissions/{permission_id}"
)
def retirer_permission_fonction(
    fonction_id: int,
    permission_id: int,
    db: Session = Depends(get_db)
):
    liaison = (
        db.query(FonctionPermission)
        .filter(
            FonctionPermission.fonction_id
            == fonction_id,
            FonctionPermission.permission_id
            == permission_id
        )
        .first()
    )

    if not liaison:
        raise HTTPException(
            status_code=404,
            detail="Cette permission n'est pas attribuée à cette fonction."
        )

    db.delete(liaison)
    db.commit()

    return {
        "message": "Permission retirée de la fonction."
    }


# ============================================================
# REMPLACER TOUTES LES PERMISSIONS D'UNE FONCTION
# ============================================================

@router.put(
    "/{fonction_id}/permissions",
    response_model=list[PermissionResponse]
)
def remplacer_permissions_fonction(
    fonction_id: int,
    permission_ids: list[int],
    db: Session = Depends(get_db)
):
    # --------------------------------------------------------
    # Vérifier la fonction
    # --------------------------------------------------------

    fonction = (
        db.query(Fonction)
        .filter(
            Fonction.id == fonction_id
        )
        .first()
    )

    if not fonction:
        raise HTTPException(
            status_code=404,
            detail="Fonction introuvable."
        )

    # --------------------------------------------------------
    # Supprimer les anciennes permissions
    # --------------------------------------------------------

    db.query(FonctionPermission).filter(
        FonctionPermission.fonction_id
        == fonction_id
    ).delete(
        synchronize_session=False
    )

    # --------------------------------------------------------
    # Éviter les doublons
    # --------------------------------------------------------

    permission_ids = list(
        set(permission_ids)
    )

    # --------------------------------------------------------
    # Ajouter les nouvelles permissions
    # --------------------------------------------------------

    permissions = []

    if permission_ids:

        permissions = (
            db.query(Permission)
            .filter(
                Permission.id.in_(permission_ids),
                Permission.actif == True
            )
            .all()
        )

        if len(permissions) != len(permission_ids):
            raise HTTPException(
                status_code=400,
                detail="Une ou plusieurs permissions sont invalides."
            )

        for permission in permissions:

            db.add(
                FonctionPermission(
                    fonction_id=fonction_id,
                    permission_id=permission.id
                )
            )

    db.commit()

    return (
        db.query(Permission)
        .join(
            FonctionPermission,
            FonctionPermission.permission_id
            == Permission.id
        )
        .filter(
            FonctionPermission.fonction_id
            == fonction_id,
            Permission.actif == True
        )
        .order_by(Permission.nom.asc())
        .all()
    )