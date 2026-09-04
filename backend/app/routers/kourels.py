
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.permissions import require_permission

from app.models.kourel import Kourel
from app.models.kourel_membre import KourelMembre
from app.models.membre import Membre

from app.schemas.kourel import (
    KourelCreate,
    KourelDetailResponse,
    KourelMembreCreate,
    KourelMembreResponse,
    KourelResponse,
    KourelUpdate,
)

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

        gestionnaire=affiliation.gestionnaire,

        nom=membre.nom,
        prenom=membre.prenom,
        telephone=membre.telephone,
        lieu_residence=membre.lieu_residence,
        montant_cotisation=membre.montant_cotisation,
    )
router = APIRouter(
    prefix="/kourels",
    tags=["Kourels"],
)


# ============================================================
# UTILITAIRES
# ============================================================


def obtenir_kourel_actif(
    kourel_id: int,
    db: Session,
) -> Kourel:

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
            detail="Kourel introuvable.",
        )

    return kourel


def obtenir_membre_actif(
    membre_id: int,
    db: Session,
) -> Membre:

    membre = (
        db.query(Membre)
        .filter(
            Membre.id == membre_id,
            Membre.actif.is_(True),
        )
        .first()
    )

    if not membre:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Membre introuvable.",
        )

    return membre


def obtenir_affiliation(
    kourel_id: int,
    membre_id: int,
    db: Session,
) -> KourelMembre | None:

    return (
        db.query(KourelMembre)
        .filter(
            KourelMembre.kourel_id == kourel_id,
            KourelMembre.membre_id == membre_id,
        )
        .first()
    )


def obtenir_affiliation_active(
    kourel_id: int,
    membre_id: int,
    db: Session,
) -> KourelMembre | None:

    return (
        db.query(KourelMembre)
        .filter(
            KourelMembre.kourel_id == kourel_id,
            KourelMembre.membre_id == membre_id,
            KourelMembre.actif.is_(True),
        )
        .first()
    )



# ============================================================
# MES KOURELS
#
# GET /kourels/mes-kourels
#
# Retourne uniquement les Kourels auxquels appartient
# le membre correspondant à l'utilisateur connecté.
# ============================================================

@router.get(
    "/mes-kourels",
    response_model=list[KourelResponse],
)
def lister_mes_kourels(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # --------------------------------------------------------
    # Vérifier que l'utilisateur possède un membre
    # --------------------------------------------------------

    if current_user.membre_id is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aucun membre associé à cet utilisateur.",
        )

    # --------------------------------------------------------
    # Récupérer uniquement les Kourels actifs auxquels
    # le membre connecté appartient actuellement
    # --------------------------------------------------------

    kourels = (
        db.query(Kourel)
        .join(
            KourelMembre,
            KourelMembre.kourel_id == Kourel.id,
        )
        .filter(
            KourelMembre.membre_id == current_user.membre_id,
            KourelMembre.actif.is_(True),
            Kourel.actif.is_(True),
        )
        .order_by(
            Kourel.nom.asc(),
        )
        .all()
    )

    return kourels



# ============================================================
# LISTE DE TOUS LES KOURELS
#
# GET /kourels
# ============================================================


@router.get(
    "",
    response_model=list[KourelResponse],
)
def lister_kourels(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("KOUREL_CONSULTER")
    ),
):

    return (
        db.query(Kourel)
        .filter(
            Kourel.actif.is_(True),
        )
        .order_by(
            Kourel.nom.asc(),
        )
        .all()
    )


# ============================================================
# DÉTAIL D'UN KOUREL
#
# GET /kourels/{kourel_id}
# ============================================================


@router.get(
    "/{kourel_id:int}",
    response_model=KourelDetailResponse,
)
def obtenir_kourel(
    kourel_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("KOUREL_CONSULTER")
    ),
):

    kourel = obtenir_kourel_actif(
        kourel_id,
        db,
    )

    membres = (
        db.query(KourelMembre)
        .filter(
            KourelMembre.kourel_id == kourel_id,
            KourelMembre.actif.is_(True),
        )
        .order_by(
            KourelMembre.date_entree.asc(),
            KourelMembre.id.asc(),
        )
        .all()
    )

    return {
        "id": kourel.id,
        "nom": kourel.nom,
        "description": kourel.description,
        "gestionnaire_membre_id": kourel.gestionnaire_membre_id,
        "actif": kourel.actif,
        "created_at": kourel.created_at,
        "updated_at": kourel.updated_at,
        "membres": membres,
    }


# ============================================================
# CRÉER UN KOUREL
#
# POST /kourels
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
            detail="Le nom du Kourel ne peut pas être vide.",
        )

    # --------------------------------------------------------
    # Vérification du nom
    # --------------------------------------------------------

    kourel_existant = (
        db.query(Kourel)
        .filter(
            Kourel.nom.ilike(nom),
            Kourel.actif.is_(True),
        )
        .first()
    )

    if kourel_existant:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Un Kourel portant ce nom existe déjà.",
        )

    # --------------------------------------------------------
    # Description
    # --------------------------------------------------------

    description = data.description

    if description:
        description = description.strip() or None

    # --------------------------------------------------------
    # Création
    # --------------------------------------------------------

    kourel = Kourel(
        nom=nom,
        description=description,
        actif=True,
    )

    db.add(kourel)

    try:
        db.commit()
        db.refresh(kourel)

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Impossible de créer le Kourel.",
        )

    return kourel


# ============================================================
# MODIFIER UN KOUREL
#
# PUT /kourels/{kourel_id}
# ============================================================


@router.put(
    "/{kourel_id:int}",
    response_model=KourelResponse,
)
def modifier_kourel(
    kourel_id: int,
    data: KourelUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("KOUREL_MODIFIER")
    ),
):

    kourel = obtenir_kourel_actif(
        kourel_id,
        db,
    )

    donnees = data.model_dump(
        exclude_unset=True,
    )

    # --------------------------------------------------------
    # NOM
    # --------------------------------------------------------

    if "nom" in donnees:

        nom = (
            donnees["nom"] or ""
        ).strip()

        if not nom:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Le nom du Kourel ne peut pas être vide.",
            )

        doublon = (
            db.query(Kourel)
            .filter(
                Kourel.nom.ilike(nom),
                Kourel.id != kourel_id,
                Kourel.actif.is_(True),
            )
            .first()
        )

        if doublon:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Un autre Kourel porte déjà ce nom.",
            )

        donnees["nom"] = nom

    # --------------------------------------------------------
    # DESCRIPTION
    # --------------------------------------------------------

    if "description" in donnees:

        description = donnees["description"]

        if description:
            description = description.strip() or None

        donnees["description"] = description

    # --------------------------------------------------------
    # APPLICATION
    # --------------------------------------------------------

    for champ, valeur in donnees.items():
        setattr(
            kourel,
            champ,
            valeur,
        )

    try:
        db.commit()
        db.refresh(kourel)

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Impossible de modifier le Kourel.",
        )

    return kourel


# ============================================================
# AJOUTER UN MEMBRE AU KOUREL
#
# POST /kourels/{kourel_id}/membres
# ============================================================


@router.post(
    "/{kourel_id:int}/membres",
    response_model=KourelMembreResponse,
    status_code=status.HTTP_201_CREATED,
)
def ajouter_membre_kourel(
    kourel_id: int,
    data: KourelMembreCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("KOUREL_MODIFIER")
    ),
):

    # --------------------------------------------------------
    # Vérifier le Kourel
    # --------------------------------------------------------

    obtenir_kourel_actif(
        kourel_id,
        db,
    )

    # --------------------------------------------------------
    # Vérifier le membre
    # --------------------------------------------------------

    obtenir_membre_actif(
        data.membre_id,
        db,
    )

    # --------------------------------------------------------
    # Affiliation existante
    # --------------------------------------------------------

    affiliation = obtenir_affiliation(
        kourel_id,
        data.membre_id,
        db,
    )

    if affiliation:

        # ----------------------------------------------------
        # Déjà actif
        # ----------------------------------------------------

        if affiliation.actif:

            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Ce membre appartient déjà à ce Kourel.",
            )

        # ----------------------------------------------------
        # Réactivation
        # ----------------------------------------------------

        affiliation.actif = True
        affiliation.date_entree = date.today()
        affiliation.date_sortie = None
        affiliation.gestionnaire = False

        try:
            db.commit()
            db.refresh(affiliation)

        except Exception:
            db.rollback()

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=(
                    "Impossible de réactiver le membre "
                    "dans le Kourel."
                ),
            )

        return affiliation

    # --------------------------------------------------------
    # Nouvelle affiliation
    # --------------------------------------------------------

    affiliation = KourelMembre(
        kourel_id=kourel_id,
        membre_id=data.membre_id,
        date_entree=date.today(),
        date_sortie=None,
        gestionnaire=False,
        actif=True,
    )

    db.add(affiliation)

    try:
        db.commit()
        db.refresh(affiliation)

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Impossible d'ajouter le membre au Kourel.",
        )

    return affiliation


# ============================================================
# LISTE DES MEMBRES D'UN KOUREL
#
# GET /kourels/{kourel_id}/membres
# ============================================================


@router.get(
    "/{kourel_id:int}/membres",
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

    resultats = (
        query
        .order_by(
            Membre.nom.asc(),
            Membre.prenom.asc(),
        )
        .all()
    )

    return [
        construire_reponse_membre_kourel(
            affiliation,
            membre,
        )
        for affiliation, membre in resultats
    ]


# ============================================================
# RETIRER UN MEMBRE DU KOUREL
#
# DELETE /kourels/{kourel_id}/membres/{membre_id}
# ============================================================


@router.delete(
    "/{kourel_id:int}/membres/{membre_id:int}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def retirer_membre_kourel(
    kourel_id: int,
    membre_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("KOUREL_MODIFIER")
    ),
):

    kourel = obtenir_kourel_actif(
        kourel_id,
        db,
    )

    affiliation = obtenir_affiliation_active(
        kourel_id,
        membre_id,
        db,
    )

    if not affiliation:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ce membre n'appartient pas à ce Kourel.",
        )

    # --------------------------------------------------------
    # Protection du gestionnaire
    # --------------------------------------------------------

    if kourel.gestionnaire_membre_id == membre_id:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Ce membre est le gestionnaire du Kourel. "
                "Veuillez désigner un autre gestionnaire "
                "avant de le retirer."
            ),
        )

    # --------------------------------------------------------
    # Désactivation logique
    # --------------------------------------------------------

    affiliation.actif = False
    affiliation.date_sortie = date.today()
    affiliation.gestionnaire = False

    try:
        db.commit()

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Impossible de retirer le membre du Kourel.",
        )

    return None


# ============================================================
# DÉSIGNER UN GESTIONNAIRE
#
# PUT /kourels/{kourel_id}/gestionnaire/{membre_id}
# ============================================================


@router.put(
    "/{kourel_id:int}/gestionnaire/{membre_id:int}",
    response_model=KourelResponse,
)
def definir_gestionnaire(
    kourel_id: int,
    membre_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("KOUREL_MODIFIER")
    ),
):

    kourel = obtenir_kourel_actif(
        kourel_id,
        db,
    )

    # --------------------------------------------------------
    # Vérifier le membre
    # --------------------------------------------------------

    obtenir_membre_actif(
        membre_id,
        db,
    )

    # --------------------------------------------------------
    # Vérifier son appartenance au Kourel
    # --------------------------------------------------------

    nouvelle_affiliation = obtenir_affiliation_active(
        kourel_id,
        membre_id,
        db,
    )

    if not nouvelle_affiliation:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Le gestionnaire doit obligatoirement "
                "être membre actif de ce Kourel."
            ),
        )

    # --------------------------------------------------------
    # Si c'est déjà le gestionnaire
    # --------------------------------------------------------

    if kourel.gestionnaire_membre_id == membre_id:

        nouvelle_affiliation.gestionnaire = True

        db.commit()
        db.refresh(kourel)

        return kourel

    # --------------------------------------------------------
    # Ancien gestionnaire
    # --------------------------------------------------------

    if kourel.gestionnaire_membre_id is not None:

        ancienne_affiliation = (
            db.query(KourelMembre)
            .filter(
                KourelMembre.kourel_id == kourel_id,
                KourelMembre.membre_id
                == kourel.gestionnaire_membre_id,
                KourelMembre.actif.is_(True),
            )
            .first()
        )

        if ancienne_affiliation:
            ancienne_affiliation.gestionnaire = False

    # --------------------------------------------------------
    # Sécurité supplémentaire :
    # aucun autre membre ne doit rester
    # gestionnaire=True
    # --------------------------------------------------------

    autres_affiliations = (
        db.query(KourelMembre)
        .filter(
            KourelMembre.kourel_id == kourel_id,
            KourelMembre.membre_id != membre_id,
            KourelMembre.gestionnaire.is_(True),
        )
        .all()
    )

    for affiliation in autres_affiliations:
        affiliation.gestionnaire = False

    # --------------------------------------------------------
    # Nouveau gestionnaire
    # --------------------------------------------------------

    nouvelle_affiliation.gestionnaire = True

    kourel.gestionnaire_membre_id = membre_id

    try:
        db.commit()
        db.refresh(kourel)

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Impossible de désigner le gestionnaire "
                "du Kourel."
            ),
        )

    return kourel


# ============================================================
# RETIRER LE GESTIONNAIRE
#
# DELETE /kourels/{kourel_id}/gestionnaire
# ============================================================


@router.delete(
    "/{kourel_id:int}/gestionnaire",
    response_model=KourelResponse,
)
def retirer_gestionnaire(
    kourel_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("KOUREL_MODIFIER")
    ),
):

    kourel = obtenir_kourel_actif(
        kourel_id,
        db,
    )

    if kourel.gestionnaire_membre_id is None:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                "Aucun gestionnaire n'est actuellement "
                "désigné."
            ),
        )

    ancienne_affiliation = (
        db.query(KourelMembre)
        .filter(
            KourelMembre.kourel_id == kourel_id,
            KourelMembre.membre_id
            == kourel.gestionnaire_membre_id,
            KourelMembre.actif.is_(True),
        )
        .first()
    )

    if ancienne_affiliation:
        ancienne_affiliation.gestionnaire = False

    kourel.gestionnaire_membre_id = None

    try:
        db.commit()
        db.refresh(kourel)

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Impossible de retirer le gestionnaire "
                "du Kourel."
            ),
        )

    return kourel


# ============================================================
# SUPPRESSION LOGIQUE DU KOUREL
#
# DELETE /kourels/{kourel_id}
# ============================================================


@router.delete(
    "/{kourel_id:int}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def supprimer_kourel(
    kourel_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_permission("KOUREL_SUPPRIMER")
    ),
):

    kourel = obtenir_kourel_actif(
        kourel_id,
        db,
    )

    # --------------------------------------------------------
    # Désactivation du Kourel
    # --------------------------------------------------------

    kourel.actif = False

    # --------------------------------------------------------
    # Désactivation des affiliations
    # --------------------------------------------------------

    affiliations = (
        db.query(KourelMembre)
        .filter(
            KourelMembre.kourel_id == kourel_id,
            KourelMembre.actif.is_(True),
        )
        .all()
    )

    for affiliation in affiliations:

        affiliation.actif = False

        if affiliation.date_sortie is None:
            affiliation.date_sortie = date.today()

        affiliation.gestionnaire = False

    # --------------------------------------------------------
    # Suppression du gestionnaire principal
    # --------------------------------------------------------

    kourel.gestionnaire_membre_id = None

    try:
        db.commit()

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Impossible de supprimer le Kourel.",
        )

    return None
