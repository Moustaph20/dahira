
from datetime import date

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import require_permission

from app.models.kourel import Kourel
from app.models.kourel_membre import KourelMembre
from app.models.membre import Membre

from app.schemas.kourel import (
    KourelCreate,
    KourelResponse,
    AjouterMembreKourel,
    KourelMembreResponse,
)


router = APIRouter(
    prefix="/kourels",
    tags=["Kourels"],
)


# ============================================================
# OUTIL INTERNE
# Construire la réponse d'une affiliation Kourel + Membre
# ============================================================

def construire_reponse_membre_kourel(
    affiliation: KourelMembre,
    membre: Membre,
) -> KourelMembreResponse:

    return KourelMembreResponse(
        id=affiliation.id,
        kourel_id=affiliation.kourel_id,
        membre_id=affiliation.membre_id,

        date_entree=affiliation.date_entree,
        date_sortie=affiliation.date_sortie,
        actif=affiliation.actif,

        nom=membre.nom,
        prenom=membre.prenom,
        telephone=membre.telephone,
        lieu_residence=membre.lieu_residence,
        montant_cotisation=membre.montant_cotisation,
    )


# ============================================================
# CRÉER UN KOUREL
# ============================================================

@router.post(
    "",
    response_model=KourelResponse,
    status_code=status.HTTP_201_CREATED,
)
def creer_kourel(
    data: KourelCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("KOUREL_CREER")
    ),
):
    nom = data.nom.strip()

    if not nom:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le nom du Kourel est obligatoire.",
        )

    existe = (
        db.query(Kourel)
        .filter(Kourel.nom == nom)
        .first()
    )

    if existe:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Un Kourel avec ce nom existe déjà.",
        )

    kourel = Kourel(
        nom=nom,
        description=data.description,
        actif=True,
    )

    db.add(kourel)
    db.commit()
    db.refresh(kourel)

    return kourel


# ============================================================
# LISTER LES KOURELS
# ============================================================

@router.get(
    "",
    response_model=list[KourelResponse],
)
def lister_kourels(
    inclure_inactifs: bool = False,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("KOUREL_CONSULTER")
    ),
):
    query = db.query(Kourel)

    if not inclure_inactifs:
        query = query.filter(
            Kourel.actif.is_(True)
        )

    return (
        query
        .order_by(Kourel.nom.asc())
        .all()
    )


# ============================================================
# CONSULTER UN KOUREL
# ============================================================

@router.get(
    "/{kourel_id}",
    response_model=KourelResponse,
)
def consulter_kourel(
    kourel_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("KOUREL_CONSULTER")
    ),
):
    kourel = (
        db.query(Kourel)
        .filter(Kourel.id == kourel_id)
        .first()
    )

    if not kourel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kourel introuvable.",
        )

    return kourel


# ============================================================
# MODIFIER UN KOUREL
# ============================================================

@router.put(
    "/{kourel_id}",
    response_model=KourelResponse,
)
def modifier_kourel(
    kourel_id: int,
    data: KourelCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("KOUREL_MODIFIER")
    ),
):
    kourel = (
        db.query(Kourel)
        .filter(Kourel.id == kourel_id)
        .first()
    )

    if not kourel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kourel introuvable.",
        )

    nom = data.nom.strip()

    if not nom:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le nom du Kourel est obligatoire.",
        )

    existe = (
        db.query(Kourel)
        .filter(
            Kourel.nom == nom,
            Kourel.id != kourel_id,
        )
        .first()
    )

    if existe:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Un autre Kourel porte déjà ce nom.",
        )

    kourel.nom = nom
    kourel.description = data.description

    db.commit()
    db.refresh(kourel)

    return kourel


# ============================================================
# DÉSACTIVER UN KOUREL
# ============================================================

@router.patch(
    "/{kourel_id}/desactiver",
)
def desactiver_kourel(
    kourel_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("KOUREL_SUPPRIMER")
    ),
):
    kourel = (
        db.query(Kourel)
        .filter(Kourel.id == kourel_id)
        .first()
    )

    if not kourel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kourel introuvable.",
        )

    kourel.actif = False

    db.commit()

    return {
        "message": "Kourel désactivé.",
    }


# ============================================================
# RÉACTIVER UN KOUREL
# ============================================================

@router.patch(
    "/{kourel_id}/activer",
)
def activer_kourel(
    kourel_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("KOUREL_MODIFIER")
    ),
):
    kourel = (
        db.query(Kourel)
        .filter(Kourel.id == kourel_id)
        .first()
    )

    if not kourel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kourel introuvable.",
        )

    kourel.actif = True

    db.commit()

    return {
        "message": "Kourel réactivé.",
    }


# ============================================================
# AJOUTER UN MEMBRE AU KOUREL
# ============================================================

@router.post(
    "/{kourel_id}/membres",
    response_model=KourelMembreResponse,
    status_code=status.HTTP_201_CREATED,
)
def ajouter_membre_kourel(
    kourel_id: int,
    data: AjouterMembreKourel,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("KOUREL_MODIFIER")
    ),
):
    # --------------------------------------------------------
    # Vérifier le Kourel
    # --------------------------------------------------------

    kourel = (
        db.query(Kourel)
        .filter(
            Kourel.id == kourel_id,
            Kourel.actif.is_(True),
        )
        .first()
    )

    if not kourel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kourel introuvable ou inactif.",
        )

    # --------------------------------------------------------
    # Vérifier le membre
    # --------------------------------------------------------

    membre = (
        db.query(Membre)
        .filter(
            Membre.id == data.membre_id,
            Membre.actif.is_(True),
        )
        .first()
    )

    if not membre:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Membre introuvable ou inactif.",
        )

    # --------------------------------------------------------
    # Vérifier l'affiliation existante
    # --------------------------------------------------------

    affiliation = (
        db.query(KourelMembre)
        .filter(
            KourelMembre.kourel_id == kourel_id,
            KourelMembre.membre_id == data.membre_id,
        )
        .first()
    )

    # --------------------------------------------------------
    # Affiliation existante
    # --------------------------------------------------------

    if affiliation:

        if affiliation.actif:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ce membre appartient déjà à ce Kourel.",
            )

        # Réactivation
        affiliation.actif = True
        affiliation.date_sortie = None
        affiliation.date_entree = (
            data.date_entree
            or date.today()
        )

        db.commit()
        db.refresh(affiliation)

        return construire_reponse_membre_kourel(
            affiliation,
            membre,
        )

    # --------------------------------------------------------
    # Nouvelle affiliation
    # --------------------------------------------------------

    affiliation = KourelMembre(
        kourel_id=kourel_id,
        membre_id=data.membre_id,
        date_entree=(
            data.date_entree
            or date.today()
        ),
        actif=True,
    )

    db.add(affiliation)
    db.commit()
    db.refresh(affiliation)

    return construire_reponse_membre_kourel(
        affiliation,
        membre,
    )


# ============================================================
# LISTER LES MEMBRES D'UN KOUREL
# ============================================================

@router.get(
    "/{kourel_id}/membres",
    response_model=list[KourelMembreResponse],
)
def lister_membres_kourel(
    kourel_id: int,
    inclure_inactifs: bool = False,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("KOUREL_CONSULTER")
    ),
):
    # --------------------------------------------------------
    # Vérifier le Kourel
    # --------------------------------------------------------

    kourel = (
        db.query(Kourel)
        .filter(Kourel.id == kourel_id)
        .first()
    )

    if not kourel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kourel introuvable.",
        )

    # --------------------------------------------------------
    # Requête
    # --------------------------------------------------------

    query = (
        db.query(
            KourelMembre,
            Membre,
        )
        .join(
            Membre,
            Membre.id == KourelMembre.membre_id,
        )
        .filter(
            KourelMembre.kourel_id == kourel_id,
        )
    )

    if not inclure_inactifs:
        query = query.filter(
            KourelMembre.actif.is_(True)
        )

    # --------------------------------------------------------
    # Ordre
    # --------------------------------------------------------

    resultats = (
        query
        .order_by(
            Membre.nom.asc(),
            Membre.prenom.asc(),
        )
        .all()
    )

    # --------------------------------------------------------
    # Réponse
    # --------------------------------------------------------

    return [
        construire_reponse_membre_kourel(
            affiliation,
            membre,
        )
        for affiliation, membre in resultats
    ]


# ============================================================
# RETIRER UN MEMBRE DU KOUREL
# ============================================================

@router.delete(
    "/{kourel_id}/membres/{membre_id}",
)
def retirer_membre_kourel(
    kourel_id: int,
    membre_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("KOUREL_MODIFIER")
    ),
):
    affiliation = (
        db.query(KourelMembre)
        .filter(
            KourelMembre.kourel_id == kourel_id,
            KourelMembre.membre_id == membre_id,
            KourelMembre.actif.is_(True),
        )
        .first()
    )

    if not affiliation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ce membre n'appartient pas à ce Kourel.",
        )

    affiliation.actif = False
    affiliation.date_sortie = date.today()

    db.commit()

    return {
        "message": "Membre retiré du Kourel.",
    }

