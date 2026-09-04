from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.permissions import require_permission

from app.models.khassida import Khassida
from app.models.audio import Audio
from app.models.ton import Ton

from app.schemas.khassida import (
    KhassidaCreate,
    KhassidaResponse,
    KhassidaUpdate,
    TonResponse,
)


router = APIRouter(
    prefix="/khassidas",
    tags=["Kourel - Khassidas"],
)


# ============================================================
# LISTE DES KHASSIDAS
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
# TONS ASSOCIÉS À UNE KHASSIDA
# ============================================================

# ============================================================
# TOUS LES TONS DISPONIBLES POUR UNE KHASSIDA
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
    # Récupérer TOUS les tons actifs
    #
    # IMPORTANT :
    # On ne passe plus par Audio.
    #
    # Ainsi, même si aucun audio n'utilise encore un ton,
    # celui-ci apparaît quand même dans la liste.
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
    # Récupérer les Tons associés via les Audios
    # --------------------------------------------------------

    tons = (
        db.query(Ton)
        .join(
            Audio,
            Audio.ton_id == Ton.id,
        )
        .filter(
            Audio.khassida_id == khassida_id,
            Audio.actif.is_(True),
            Ton.actif.is_(True),
        )
        .distinct()
        .order_by(
            Ton.nom.asc()
        )
        .all()
    )

    return tons


# ============================================================
# DÉTAIL D'UNE KHASSIDA
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
# CRÉATION
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
# MODIFICATION
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
                detail="Le titre de la Khassida est obligatoire.",
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
                detail="Une autre Khassida porte déjà ce titre.",
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
# SUPPRESSION LOGIQUE
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